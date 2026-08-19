const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const prisma = require('../db');
const { createAccessToken, setAuthCookie, getCurrentUser } = require('../middleware/auth');

const router = express.Router();

async function hashPassword(p) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(p, salt);
}

async function verifyPassword(p, hash) {
    if (!hash) return false;
    try {
        return await bcrypt.compare(p, hash);
    } catch {
        return false;
    }
}

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        const normalizedEmail = email.toLowerCase();
        
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
            return res.status(400).json({ detail: 'Email already registered' });
        }

        const uid = uuidv4();
        const hashed = await hashPassword(password);
        
        await prisma.user.create({
            data: {
                id: uid,
                name: name,
                email: normalizedEmail,
                phone: phone,
                password_hash: hashed,
                role: 'customer',
                is_blocked: false
            }
        });

        const token = createAccessToken(uid, normalizedEmail, 'customer');
        setAuthCookie(res, token);
        
        res.json({
            success: true,
            data: { id: uid, name, email: normalizedEmail, role: 'customer', token }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();
        
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        
        if (!user || !(await verifyPassword(password, user.password_hash))) {
            return res.status(401).json({ detail: 'Invalid email or password' });
        }
        if (user.is_blocked) {
            return res.status(403).json({ detail: 'Account is blocked' });
        }
        
        const token = createAccessToken(user.id, normalizedEmail, user.role);
        setAuthCookie(res, token);
        
        res.json({
            success: true,
            data: { id: user.id, name: user.name, email: normalizedEmail, role: user.role, token }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/me', getCurrentUser, (req, res) => {
    res.json({ success: true, data: req.user });
});

router.post('/logout', (req, res) => {
    res.clearCookie('access_token', { path: '/' });
    res.json({ success: true });
});

router.post('/google/session', async (req, res) => {
    try {
        const { session_id } = req.body;
        if (!session_id) {
            return res.status(400).json({ detail: 'Missing session_id' });
        }

        const r = await axios.get("https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data", {
            headers: { "X-Session-ID": session_id },
            timeout: 30000
        });

        const d = r.data;
        const email = (d.email || "").toLowerCase();
        if (!email) {
            return res.status(401).json({ detail: 'No email from Google' });
        }

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            const uid = uuidv4();
            user = await prisma.user.create({
                data: {
                    id: uid,
                    name: d.name || email,
                    email: email,
                    phone: null,
                    password_hash: null,
                    role: 'customer',
                    is_blocked: false,
                    picture: d.picture
                }
            });
        }

        if (user.is_blocked) {
            return res.status(403).json({ detail: 'Account is blocked' });
        }

        const token = createAccessToken(user.id, email, user.role);
        
        res.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: email,
                role: user.role,
                picture: user.picture,
                token: token
            }
        });

    } catch (err) {
        if (err.response && err.response.status === 401) {
            return res.status(401).json({ detail: 'Google authentication failed' });
        }
        res.status(500).json({ detail: err.message });
    }
});

module.exports = router;
