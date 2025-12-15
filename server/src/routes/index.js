const express = require('express');

const router = express.Router();

// GET /
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        code: 200,
        message: 'server is running...',
    });
});

module.exports = router;
