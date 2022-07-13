const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT

const multer = require('multer')
const upload = multer({
    dest: 'images'
})

app.post('/upload', upload.single('upload'), (req, res) => {
    res.send()
})

// Configure express to automatically parse incoming JSON
app.use(express.json())

// Configure the app to use routes defined in external files
app.use(userRouter)
app.use(taskRouter)

app.get('*', (req, res) => {
    res.status(404).send('Error 404,  Page not found')
})

app.listen(port, () => {
    console.log('Server is up on port: ' + port)
})

