const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account')

const router = new express.Router()

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try{
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    }catch(e){
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token})
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async(req, res) => {
    try{

        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async(req, res) => {
    try{
        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// Middleware function gets passed in as 2nd argument
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

// Nobody should be able to retrieve user information by simply providing a user id, except for their own profile information
// In that case, the route above ('/users/me') is already implemented
// Therefore, the route below is obsolete

// router.get('/users/:id', async (req, res) => {
//     const _id = req.params.id

//     try{
//         const user = await User.findById(_id)
//         if(!user){
//             return res.status(404).send({error: 'No user with ID ' + _id + ' found!'})
//         }
//         res.send(user)
//     }catch(e){
//         res.status(500).send(e)
//     }
// })

// Update a user identified by ID and put the transmitted updates in place
router.patch('/users/me', auth, async (req, res) => {
    // Making sure only existing attributes can be updated
    // Getting all update attributes sent over via HTTP:
    const updates = Object.keys(req.body)
    // Setting up an array of allowed attributes to update:
    const allowedUpdates = ['name', 'email', 'password', 'age']
    // Comparing the two arrays to see if all requested updates are allowed updates
    // .every() returns true only if every return value is true and false if one return value is false
    const isValidUpdate = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidUpdate) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try{
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        // findByIdAndUpdate bypasses middleware and password hash cannot be applied
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        //     new: true,
        //     runValidators: true
        // })

        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try{
        await req.user.remove()
        sendCancelEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

// Setup multer
// Do not setup 'dest' property, because we want access to .file property in route handler
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        // Regex to only accept image files
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('File must be an image'))
        }
        cb(undefined, true)
    }
})

// Use multer function as middleware for route
// Function name (upload) must match const name used to setup multer
// String argument must match reqest body key value sent over via HTTP
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    // req.file.buffer only exists if we do NOT setup 'dest' property in multer config
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
// Collect and customize unhandled errors
// In this case from Multer middleware
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findById( req.params.id )

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router