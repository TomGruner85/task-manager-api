const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()

// Configure express to automatically parse incoming JSON
app.use(express.json())

// Configure the app to use routes defined in external files
app.use(userRouter)
app.use(taskRouter)

app.get('*', (req, res) => {
    res.status(404).send('Error 404,  Page not found')
})

module.exports = app