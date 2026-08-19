const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

function createAccessToken(uid, email, role) {
    const payload = {
        sub: uid,
        email: email,
        role: role,
        type: 'access'
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
}

function decodeToken(token) {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
}

async function getTokenFromRequest(req) {
    let token = req.cookies?.access_token;
    if (!token) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }
    return token;
}

async function getCurrentUser(req, res, next) {
    try {
        const token = await getTokenFromRequest(req);
        if (!token) {
            return res.status(401).json({ detail: 'Not authenticated' });
        }
        
        const payload = decodeToken(token);
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            return res.status(401).json({ detail: 'User not found' });
        }
        
        // Exclude password_hash
        const { password_hash, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ detail: 'Token expired' });
        }
        return res.status(401).json({ detail: 'Invalid token' });
    }
}

async function getOptionalUser(req, res, next) {
    try {
        const token = await getTokenFromRequest(req);
        if (token) {
            const payload = decodeToken(token);
            const user = await prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (user) {
                const { password_hash, ...userWithoutPassword } = user;
                req.user = userWithoutPassword;
            }
        }
    } catch (err) {
        // Optional auth, silently fail
    }
    next();
}

async function getAdmin(req, res, next) {
    await getCurrentUser(req, res, () => {
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
            return res.status(403).json({ detail: 'Admin access required' });
        }
        next();
    });
}

function setAuthCookie(res, token) {
    res.cookie('access_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        path: '/'
    });
}

function ownerFilter(user, guest_id) {
    if (user) {
        return { user_id: user.id };
    }
    if (guest_id) {
        return { guest_id: guest_id };
    }
    return null;
}

module.exports = {
    createAccessToken,
    decodeToken,
    getTokenFromRequest,
    getCurrentUser,
    getOptionalUser,
    getAdmin,
    setAuthCookie,
    ownerFilter
};
