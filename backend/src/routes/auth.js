const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const prisma = require('../db');
const { createAccessToken, setAuthCookie, getCurrentUser } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');

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

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase();
        
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) return res.status(400).json({ detail: 'Email already registered' });
        
        const code = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        
        await prisma.oTP.deleteMany({ where: { email: normalizedEmail, purpose: 'signup' } });
        
        await prisma.oTP.create({
            data: { email: normalizedEmail, code, purpose: 'signup', expires_at: expiresAt }
        });
        
        const emailResult = await sendEmail(normalizedEmail, 'Your SoleKicks Verification Code', `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`);
        
        if (!emailResult.success) {
            return res.status(500).json({ detail: `Failed to send email: ${emailResult.error}` });
        }
        
        res.json({ success: true, message: 'OTP sent' });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, otp } = req.body;
        const normalizedEmail = email.toLowerCase();
        
        if (!otp) return res.status(400).json({ detail: 'OTP is required' });
        
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
            return res.status(400).json({ detail: 'Email already registered' });
        }

        const otpRecord = await prisma.oTP.findFirst({
            where: { email: normalizedEmail, purpose: 'signup' },
            orderBy: { created_at: 'desc' }
        });
        
        if (!otpRecord || otpRecord.code !== otp) {
            return res.status(400).json({ detail: 'Invalid OTP' });
        }
        if (new Date() > otpRecord.expires_at) {
            return res.status(400).json({ detail: 'OTP has expired' });
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
        
        // Clean up OTPs
        await prisma.oTP.deleteMany({ where: { email: normalizedEmail, purpose: 'signup' } });

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

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase();
        
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) return res.status(404).json({ detail: 'Account not found' });
        if (!user.password_hash) return res.status(400).json({ detail: 'This account uses Google Login.' });
        
        const code = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        await prisma.oTP.deleteMany({ where: { email: normalizedEmail, purpose: 'reset_password' } });
        
        await prisma.oTP.create({
            data: { email: normalizedEmail, code, purpose: 'reset_password', expires_at: expiresAt }
        });
        
        const emailResult = await sendEmail(normalizedEmail, 'SoleKicks Password Reset', `<p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`);
        
        if (!emailResult.success) {
            return res.status(500).json({ detail: `Failed to send email: ${emailResult.error}` });
        }
        
        res.json({ success: true, message: 'OTP sent' });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, new_password } = req.body;
        const normalizedEmail = email.toLowerCase();
        
        const otpRecord = await prisma.oTP.findFirst({
            where: { email: normalizedEmail, purpose: 'reset_password' },
            orderBy: { created_at: 'desc' }
        });
        
        if (!otpRecord || otpRecord.code !== otp) return res.status(400).json({ detail: 'Invalid OTP' });
        if (new Date() > otpRecord.expires_at) return res.status(400).json({ detail: 'OTP has expired' });
        
        const hashed = await hashPassword(new_password);
        await prisma.user.update({
            where: { email: normalizedEmail },
            data: { password_hash: hashed }
        });
        
        await prisma.oTP.deleteMany({ where: { email: normalizedEmail, purpose: 'reset_password' } });
        
        res.json({ success: true, message: 'Password updated' });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/me', getCurrentUser, (req, res) => {
    res.json({ success: true, data: req.user });
});

router.post('/change-password', getCurrentUser, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        
        if (!user.password_hash) {
            return res.status(400).json({ detail: 'You are logged in with Google. Password cannot be changed.' });
        }
        
        if (!(await verifyPassword(current_password, user.password_hash))) {
            return res.status(401).json({ detail: 'Incorrect current password' });
        }
        
        const hashed = await hashPassword(new_password);
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password_hash: hashed }
        });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
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
