const express = require('express');
const app = express();

app.use('/api/tours', toursRouter)

const toursRouter = express.Router();

toursRouter.route('/').

app.get('/api/tours', (req, res) => {
    res.status(200).json({
        data: tours
    })
})

app.get('/api/users', (req, res) => {
    res.status(200).json({
        data: tours
    })
})