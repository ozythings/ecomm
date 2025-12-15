const express = require('express');
const cors = require('cors');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Routes
const indexRouter = require('./routes');

// Use Routes
app.use('/', indexRouter);

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
