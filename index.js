const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const exphbs = require('express-handlebars')
const Handlebars = require('handlebars')
const homeRoutes = require('./routes/home')
const cardRoutes = require('./routes/card')
const addRoutes = require('./routes/add')
const ordersRoutes = require('./routes/orders')
const coursesRoutes = require('./routes/courses')
const User = require('./models/user')
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')


const app = express()

const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs',
  handlebars: allowInsecurePrototypeAccess(Handlebars)
})

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')
app.set('views', 'views')

app.use(async (req, res, next) => {
  try {
    const user = await User.findById('5fe873619faf766b5db2f618')
    req.user = user
    next()
  } catch (e) {
    console.log(e)
  }
})

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({extended: true}))

app.use('/', homeRoutes)
app.use('/add', addRoutes)
app.use('/courses', coursesRoutes)
app.use('/card', cardRoutes)
app.use('/orders', ordersRoutes)

const PORT = process.env.PORT || 3000

async function start() {
  try {
    const url = `mongodb+srv://inecon:5yMDdlzmgpl6pJQB@cluster0.1i9bl.mongodb.net/shop`
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    })
    const candidate = await User.findOne()
    if (!candidate) {
      const user = new User({
        email: 'saturnua@gmail.com',
        name: 'Saturnua',
        cart: {items: []}
      })
      await user.save()
      //del before prod
      console.log(user)
    }
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (e) {
    console.log(e)
  }
}

start()


