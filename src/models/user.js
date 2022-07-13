const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Task = require('./task')

// Creating a new schema instead of passing user object directly into mongoose.model method
// Has the advantage that different methods can be used on the schema that cannot be used on the passed object. See below.
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Invalid email address')
            }
        }
    },
    password:{
        type: String,
        required: true,
        minLength: 6,
        trim: true,
        validate(value){
            if(validator.contains(value, 'password')){
                throw new Error('Password cannot contain phrase: \"password\"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value){
            if(value < 0){
                throw new Error('Age must be a positive number')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
},{
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

// toJSON is called implicitly every time res.send is called on the user object
// res.send( user ) automatically calls JSON.stringify( user )
// By defining a toJSON method on the user, we can define what data is sent back (exposed) to JSON.stringify
// toJSON is never explicitly called, but is executed everytime res.send( user ) is called.
userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

// Define instance method to generate authentication tokens
userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({ _id: user.id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token
}

// Define new static method on User class
// Find a user by email address and compare password hashes
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login!')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login!')
    }

    return user
}

// Define action before user is saved to DB
// In this case, hash user password before saving
// async function cannot be an arrow function, because we need access to 'this' inside the function
userSchema.pre('save', async function(next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// Remove user created tasks when user is deleted
userSchema.pre('remove', async function(next) {
    const user = this

    await Task.deleteMany({ owner: user._id })

    next()
})

// Once additional operations are complete, create the new model, using the schema
const User = mongoose.model('User', userSchema)

module.exports = User