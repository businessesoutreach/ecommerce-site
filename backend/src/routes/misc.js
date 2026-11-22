const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../db');
const { getAdmin } = require('../middleware/auth');
const { uploadBuffer } = require('../utils/cloudinary');
const { getSettings } = require('./checkout');
const memoryCache = require('../utils/cache');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/newsletter/subscribe', async (req, res) => {
    try {
        const email = req.body.email.toLowerCase();
        await prisma.newsletter.upsert({
            where: { email },
            update: {},
            create: { email }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/settings', async (req, res) => {
    try {
        const cached = memoryCache.get('settings');
        if (cached) return res.json({ success: true, data: cached });
        const s = await getSettings();
        memoryCache.set('settings', s, 60 * 1000);
        res.json({ success: true, data: s });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/hero-slides', async (req, res) => {
    try {
        const cached = memoryCache.get('hero-slides');
        if (cached) return res.json({ success: true, data: cached });
        const items = await prisma.heroSlide.findMany({
            where: { is_active: true },
            orderBy: { sort_order: 'asc' }
        });
        memoryCache.set('hero-slides', items, 60 * 1000);
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/admin/upload', getAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ detail: 'No file uploaded' });
        
        const result = await uploadBuffer(req.file.buffer, 'solekicks/admin');
        res.json({ success: true, data: { path: result.public_id, url: result.secure_url } });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// Public upload for reviews/avatars
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ detail: 'No file uploaded' });
        
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ detail: 'Only images are allowed' });
        }
        
        const result = await uploadBuffer(req.file.buffer, 'solekicks/public');
        res.json({ success: true, data: { path: result.public_id, url: result.secure_url } });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get(/^\/files\/(.*)/, async (req, res) => {
    res.status(404).json({ detail: 'File not found. Please use direct CDN URLs.' });
});

module.exports = router;
