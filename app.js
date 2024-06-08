import express from 'express'


const app = express();

app.use((req,res,next) => {
    next(HttpError(404, 'Route not found'));
})

app.use((err,req,res,next) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    })
})