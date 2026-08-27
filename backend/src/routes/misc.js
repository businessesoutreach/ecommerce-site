const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../db');
const { getAdmin } = require('../middleware/auth');
const { APP_NAME, putObject, getObject } = require('../utils/storage');
const { getSettings } = require('./checkout');

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
        res.json({ success: true, data: await getSettings() });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/hero-slides', async (req, res) => {
    try {
        const items = await prisma.heroSlide.findMany({
            where: { is_active: true },
            orderBy: { sort_order: 'asc' }
        });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/admin/upload', getAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ detail: 'No file uploaded' });
        
        const ext = req.file.originalname.includes('.') ? req.file.originalname.split('.').pop() : 'bin';
        const path = `${APP_NAME}/uploads/${uuidv4()}.${ext}`;
        
        const result = await putObject(path, req.file.buffer, req.file.mimetype || 'application/octet-stream');
        res.json({ success: true, data: { path: result.path, url: `/api/files/${result.path}` } });
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
        
        const ext = req.file.originalname.includes('.') ? req.file.originalname.split('.').pop() : 'png';
        const path = `${APP_NAME}/public_uploads/${uuidv4()}.${ext}`;
        
        const result = await putObject(path, req.file.buffer, req.file.mimetype);
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/files/${result.path}`;
        res.json({ success: true, data: { path: result.path, url: url } });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get(/^\/files\/(.*)/, async (req, res) => {
    try {
        const path = req.params[0];
        const { data, contentType } = await getObject(path);
        
        res.setHeader('Content-Type', contentType);
        res.send(data);
    } catch (err) {
        res.status(404).send('File not found');
    }
});

module.exports = router;
