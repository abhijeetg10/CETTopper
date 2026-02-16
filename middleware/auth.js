const jwt = require('jsonwebtoken');

// Secret key for JWT (store in .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Bearer <token>
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, role, iat, exp }
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid token.' });
    }
};

const authenticateAdmin = (req, res, next) => {
    // authenticateToken must run first to populate req.user
    if (!req.user) {
        return res.status(401).json({ error: 'Access denied. Not authenticated.' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    next();
};

module.exports = { authenticateToken, authenticateAdmin, JWT_SECRET };
