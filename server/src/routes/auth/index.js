const {Router} = require('express');
const {} = require('../../../../src/app/actions');

const router = Router();

// POST /auth/signin
router.post('/signin', (req, res) => {
    const {email, password} = req.body;



    return res.status(200).json({
        status: 'success',
        code: 200,
    });
});

module.exports = router;
