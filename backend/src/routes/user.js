const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../db');
const { getCurrentUser } = require('../middleware/auth');

const router = express.Router();

router.get('/addresses', getCurrentUser, async (req, res) => {
    try {
        const items = await prisma.address.findMany({
            where: { user_id: req.user.id },
            orderBy: { is_default: 'desc' }
        });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/addresses', getCurrentUser, async (req, res) => {
    try {
        const doc = { ...req.body };
        doc.id = uuidv4();
        doc.user_id = req.user.id;
        
        const count = await prisma.address.count({ where: { user_id: req.user.id } });
        
        if (doc.is_default) {
            await prisma.address.updateMany({
                where: { user_id: req.user.id },
                data: { is_default: false }
            });
        } else if (count === 0) {
            doc.is_default = true;
        }
        
        const newAddress = await prisma.address.create({ data: doc });
        res.json({ success: true, data: newAddress });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/addresses/:aid', getCurrentUser, async (req, res) => {
    try {
        const aid = req.params.aid;
        const doc = { ...req.body };
        
        if (doc.is_default) {
            await prisma.address.updateMany({
                where: { user_id: req.user.id },
                data: { is_default: false }
            });
        }
        
        const updated = await prisma.address.updateMany({
            where: { id: aid, user_id: req.user.id },
            data: doc
        });
        
        if (updated.count === 0) return res.status(404).json({ detail: 'Address not found' });
        
        const a = await prisma.address.findUnique({ where: { id: aid } });
        res.json({ success: true, data: a });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.delete('/addresses/:aid', getCurrentUser, async (req, res) => {
    try {
        await prisma.address.deleteMany({
            where: { id: req.params.aid, user_id: req.user.id }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/store-credit', getCurrentUser, async (req, res) => {
    try {
        const sc = await prisma.storeCredit.findUnique({ where: { user_id: req.user.id } });
        const bal = sc ? sc.balance : 0.0;
        
        const ledger = await prisma.storeCreditLedger.findMany({
            where: { user_id: req.user.id },
            orderBy: { created_at: 'desc' }
        });
        
        res.json({ success: true, data: { balance: bal, ledger } });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

module.exports = router;
