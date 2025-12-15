const {Router} = require('express');
const jwt = require('jsonwebtoken');
const db = require('../../db/index');

const router = Router();

// POST /auth/signin
router.post('/signin', async (req, res) => {
    const {email, password} = req.body;
    const stmt = await db.prepare(`SELECT * FROM admins WHERE email = ? AND password = ?`);
    const admin = await stmt.get(email, password);

    if (!admin) return res.status(401).send({
        status: 401,
        message: 'Incorrect email or password!',
    });

    const token = jwt.sign(admin, process.env.JWT_SECRET_KEY, {
        expiresIn: '1d',
    });

    // LOGGING to db // try-catch
    db.prepare(`
        INSERT INTO auth_logs (admin_id, action_id, ip_address, signin_date, log_date)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).run(
        admin.admin_id,
        1,
        req.ip ?? 'unknown'
    );

    return res.status(200).json({
        status: 200,
        token,
    });
});

// POST /auth/signout
router.post('/signout', async (req, res) => {
    const token = req.headers.token.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).send({
            status: 401,
            message: 'Incorrect token!',
        });

        const {admin_id} = decoded;

        db.prepare(`
            UPDATE auth_logs
            SET signout_date = datetime('now')
            WHERE admin_id = ?
            ORDER BY log_id DESC
            LIMIT 1
        `).run(admin_id)
    });
});

module.exports = router;
