const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../db');
const { getOptionalUser, getCurrentUser, ownerFilter } = require('../middleware/auth');

const router = express.Router();

async function getOrCreateWishlist(user, guestId) {
    const filter = ownerFilter(user, guestId);
    if (!filter) throw new Error('Missing guest id');
    
    let w = await prisma.wishlist.findFirst({
        where: filter,
        include: { items: true }
    });
    
    if (!w) {
        w = await prisma.wishlist.create({
            data: {
                id: uuidv4(),
                user_id: user ? user.id : null,
                guest_id: !user ? guestId : null,
            },
            include: { items: true }
        });
    }
    return w;
}

router.get('/', getOptionalUser, async (req, res) => {
    try {
        const guestId = req.headers['x-guest-id'];
        if (!req.user && !guestId) return res.status(400).json({ detail: 'Missing guest id' });
        
        const w = await getOrCreateWishlist(req.user, guestId);
        const out = [];
        for (const it of w.items || []) {
            const p = await prisma.product.findUnique({
                where: { id: it.product_id },
                include: { sizes: true }
            });
            if (p) out.push(p);
        }
        
        res.json({
            success: true,
            data: out,
            ids: (w.items || []).map(i => i.product_id)
        });
    } catch (err) {
        res.status(400).json({ detail: err.message });
    }
});

router.post('/items', getOptionalUser, async (req, res) => {
    try {
        const guestId = req.headers['x-guest-id'];
        if (!req.user && !guestId) return res.status(400).json({ detail: 'Missing guest id' });
        
        const { product_id, size } = req.body;
        const w = await getOrCreateWishlist(req.user, guestId);
        
        const existing = w.items.find(i => i.product_id === product_id);
        
        if (!existing) {
            await prisma.wishlistItem.create({
                data: {
                    id: uuidv4(),
                    wishlist_id: w.id,
                    product_id,
                    size
                }
            });
        }
        
        const updatedW = await prisma.wishlist.findUnique({
            where: { id: w.id },
            include: { items: true }
        });
        
        res.json({
            success: true,
            ids: updatedW.items.map(i => i.product_id)
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.delete('/items/:product_id', getOptionalUser, async (req, res) => {
    try {
        const guestId = req.headers['x-guest-id'];
        const w = await getOrCreateWishlist(req.user, guestId);
        
        const item = w.items.find(i => i.product_id === req.params.product_id);
        if (item) {
            await prisma.wishlistItem.delete({ where: { id: item.id } });
        }
        
        const updatedW = await prisma.wishlist.findUnique({
            where: { id: w.id },
            include: { items: true }
        });
        
        res.json({
            success: true,
            ids: updatedW.items.map(i => i.product_id)
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/merge', getCurrentUser, async (req, res) => {
    try {
        const guestId = req.headers['x-guest-id'];
        if (!guestId) return res.json({ success: true });
        
        const guestW = await prisma.wishlist.findUnique({
            where: { guest_id: guestId },
            include: { items: true }
        });
        
        if (!guestW || guestW.items.length === 0) {
            return res.json({ success: true });
        }
        
        const userW = await getOrCreateWishlist(req.user, null);
        
        for (const gi of guestW.items) {
            const existing = userW.items.find(i => i.product_id === gi.product_id);
            if (!existing) {
                await prisma.wishlistItem.update({
                    where: { id: gi.id },
                    data: { wishlist_id: userW.id }
                });
            }
        }
        
        await prisma.wishlist.delete({ where: { id: guestW.id } });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

module.exports = router;
