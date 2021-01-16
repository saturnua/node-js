const {body} = require('express-validator')
const User = require('../models/user')

exports.registerValidators = [
    body('email')
        .isEmail()
        .withMessage('Введите корректный email')
        .custom(async (value, {req}) => {
            try {
                const user = await User.findOne({
                    email: value
                })
                if (user) {
                    return Promise.reject('Такой email уже зарегистрирован')
                }
            } catch (e) {
                console.log(e)
            }
        }).normalizeEmail(),
    body('password', 'Введите корректный пароль')
        .isLength({min: 6, max: 56})
        .isAlphanumeric()
        .trim(),
    body('confirm')
        .custom((value, {req}) => {
            if (value !== req.body.password) {
                throw new Error('Пароли должны совпадать')
            }
            return true
        }).trim(),
    body('name', 'Имя должно быть минимум 3 символа')
        .isLength({min: 3})
        .trim()
]
exports.loginValidators = [
    body('email')
        .isEmail()
        .withMessage('Введите корректный email')
        .custom(async (value, {req}) => {
            try {
                const user = await User.findOne({
                    email: value
                })
                if (!user) {
                    return Promise.reject('Такой email не зарегистрирован')
                }
            } catch (e) {
                console.log(e)
            }
        }).normalizeEmail(),
    body('password', 'Введите корректный пароль')
        .isLength({min: 6, max: 56})
        .isAlphanumeric()
        .trim(),
]
exports.courseValidators = [
    body('title').isLength({min: 3}).withMessage('Минимальная длинна названия 3 символа').trim(),
    body('price').isNumeric().withMessage('Введите корректную цену'),
    body('img', 'Введите корректный URL картинки').isURL()
]
