const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'seongrim-admin-secret-key-2026';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
        }
        req.user = user;
        next();
    });
}

module.exports = {
    JWT_SECRET,
    authenticateToken
};
