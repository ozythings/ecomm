const express = require('express');
const parser = require('body-parser');
const cors = require('cors');

const app = express();

// Global Middlewares
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(parser.json());
app.use(parser.urlencoded({extended: true}));

// Routes
const indexRouter = require('./routes');
const authRouter = require('./routes/auth');

// Use Routes
app.use('/', indexRouter);
app.use('/auth', authRouter);

// Not Found
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Not Found',
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        code: 500,
        message: 'Internal Server Error',
    });
});

module.exports = app;
