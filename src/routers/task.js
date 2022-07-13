const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try{
        await task.save()
        res.status(201).send(task)
    }catch(e){
        res.status(400).send(e)
    }
})

// Return all tasks in collection
router.get('/tasks', auth, async (req, res) => {
    // Setup pagination variables
    var skip = parseInt(req.query.skip)
    var limit = parseInt(req.query.limit)

    // Setup object to use in find method
    const match = {
        owner: req.user._id,
    }

    // Setup object to use in sort method
    const sort = {}

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1]
    }

    // Enable search criteria
    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    } 

    try{
        res.send(await Task.find(match)
            .skip(skip)
            .limit(limit)
            .sort(sort))
    }catch(e){
        res.status(500).send(e)
    }
})

// Find specific task by Id
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try{
        const task = await Task.findOne({ _id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send(e)
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isAllowedUpdate = updates.every((update) => allowedUpdates.includes(update))

    if ( !isAllowedUpdate) {
        return res.status(400).send({error: 'Invalid update attempt!'})
    }
    
    try{
        const task = await Task.findOne({ _id, owner: req.user._id })
        
        if ( !task ) {
            return res.status(404).send()
        }

        updates.forEach((update) => task[update] = req.body[update])
        await task.save()

        res.send(task)
    }catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try{
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id })

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router