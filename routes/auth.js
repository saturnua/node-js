const {Router} = require('express')
const bcrypt = require('bcrypt-nodejs')
const crypto = require('crypto')
const {validationResult} = require('express-validator')
const User = require('../models/user')
const nodemailer = require('nodemailer')
const sendgrid = require('nodemailer-sendgrid-transport')
const keys = require('../keys')
const regEmail = require('../emails/registrations')
const resetEmail = require('../emails/reset')
const {registerValidators} = require('../utils/validators')
const {loginValidators} = require('../utils/validators')
const router = Router()

const transporter = nodemailer.createTransport(sendgrid({
    auth: {api_key: keys.SENDGRID_API_KEY}
}))

router.get('/login', async (req, res) => {
    res.render('auth/login', {
        title: 'Авторизация',
        isLogin: true,
        loginError: req.flash('loginError'),
        registerError: req.flash('registerError'),
    })
})

router.get('/logout', async (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login#login')
    })
})

router.post('/login', loginValidators, async (req, res) => {
    try {
        const {email, password} = req.body
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            req.flash('loginError', errors.array()[0].msg)
            return res.status(422).redirect('/auth/login#login')
        } else {
            const candidate = await User.findOne({email})
            const areSame = await bcrypt.compareSync(password, candidate.password)
            if (areSame) {
                req.session.user = candidate
                req.session.isAuthenticated = true
                req.session.save(err => {
                    if (err) {
                        throw (err)
                    }
                    res.redirect('/')
                })
            } else {
                req.flash('loginError', 'Вы ввели неправильный пароль')
                res.redirect('/auth/login#login')
            }
        }
    } catch (e) {
        console.log(e)
    }
})

router.post('/register', registerValidators, async (req, res) => {
    try {
        const {email, password, name} = req.body

        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            req.flash('registerError', errors.array()[0].msg)
            return res.status(422).redirect('/auth/login#register')
        }
        let salt = bcrypt.genSaltSync(10);
        let hashPassword = await bcrypt.hashSync(password, salt)
        const user = new User({
            email, name, password: hashPassword, cart: {items: []}
        })
        await user.save()

        await transporter.sendMail(regEmail(email))
        res.redirect('/auth/login#login')
    } catch (e) {
        console.log(e)
    }
})

router.get('/reset', (req, res) => {
    res.render('auth/reset', {
        title: 'Забыли пароль?',
        error: req.flash('error')
    })
})

router.get('/password/:token', async (req, res) => {
    if (!req.params.token) {
        return res.redirect('/auth/login')
    }
    try {
        const user = await User.findOne({
            resetToken: req.params.token,
            resetTokenExp: {$gt: Date.now()}
        })
        if (!user) {
            return res.redirect('/auth/login')
        } else {
            res.render('auth/password', {
                title: 'Восстановить доступ',
                error: req.flash('error'),
                userId: user._id.toString(),
                token: req.params.token
            })
        }
    } catch
        (e) {
        console.log(e)
    }
})

router.post('/password', async (req, res) => {
    try {
        const user = await User.findOne({
            _id: req.body.userId,
            resetToken: req.body.token,
            resetTokenExp: {$gt: Date.now()}
        })
        if (user) {
            let salt = bcrypt.genSaltSync(10);
            user.password = await bcrypt.hashSync(req.body.password, salt)
            user.resetToken = undefined
            user.resetTokenExp = undefined
            console.log(user)
            await user.save()
            res.redirect('/auth/login')
        } else {
            req.flash('loginError', 'Время жизни токена истекло')
            res.redirect('/auth/login')
        }
    } catch (e) {
        console.log(e)
    }
})

router.post('/reset', (req, res) => {
    try {
        crypto.randomBytes(32, async (err, buffer) => {
            if (err) {
                req.flash('error', 'Что-то пошло не так повторите попытку позже ')
                return res.redirect('/auth/reset')
            }
            const token = buffer.toString('hex')

            const candidate = await User.findOne({email: req.body.email})
            if (candidate) {
                candidate.resetToken = token
                candidate.resetTokenExp = Date.now() + 60 * 60 * 1000
                await candidate.save()
                await transporter.sendMail(resetEmail(candidate.email, token))
                res.redirect('/auth/login')
            } else {
                req.flash('error', 'Такого email ненайдено')
                res.redirect('/auth/reset')
            }
        })
    } catch (e) {
        console.log(e)
    }
})
module.exports = router