const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async(req, res, next) => {
    try {
        // Retrieve user provided auth token from request header and remove beginning of the string
        const token = req.header('Authorization').replace('Bearer ', '')
        // Verify provided token was acutally created by the server with same secret phrase
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // Lookup user in DB
        // User must have ID provided in token and the token value itself
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        if(!user){
            throw new Error()
        }

        // If everything went well, user data and token is stored in req object and route handler is execued
        req.token = token
        req.user = user
        next()
    } catch (e) {
        // If an error occurs along the way, route handler is NOT excecuted, instead error is displayed.
        res.status(401).send({ error: 'Please authenticate!' })
    }
}

module.exports = auth