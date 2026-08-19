const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../db');
const { getOptionalUser, getCurrentUser, ownerFilter } = require('../middleware/auth');

const router = express.Router();

function priceOf(product, size) {
    return parseFloat(product.base_price);
}

async function enrichCart(cart) {
    const items = [];
    let subtotal = 0;
    
    for (const it of cart.items || []) {
        const p = await prisma.product.findUnique({
            where: { id: it.product_id },
            include: { sizes: true }
        });
        if (!p) continue;
        
        const price = priceOf(p, it.size);
        const line = price * it.quantity;
        subtotal += line;
        
        items.push({
            id: it.id,
            product_id: p.id,
            slug: p.slug,
            name: p.name,
            size: it.size,
            quantity: it.quantity,
            price: price,
            compare_at_price: p.compare_at_price,
            image: p.images[0],
            brand: p.brand_slug,
            line_total: line
        });
    }
    
    return {
        items,
        subtotal,
        count: items.reduce((acc, curr) => acc + curr.quantity, 0)
    };
}

async function getOrCreateCart(user, guestId) {
    const filter = ownerFilter(user, guestId);
    if (!filter) throw new Error('Missing guest id');
    
    let cart = await prisma.cart.findFirst({
        where: filter,
        include: { items: true }
    });
    
    if (!cart) {
        cart = await prisma.cart.create({
            data: {
                id: uuidv4(),
                user_id: user ? user.id : null,
                guest_id: !user ? guestId : null,
            },
            include: { items: true }
        });
    }
    return cart;
}

router.get('/', getOptionalUser, async (req, res) => {
    try {
        const guestId = req.headers['x-guest-id'];
        if (!req.user && !guestId) return res.status(400).json({ detail: 'Missing guest id' });
        
        const cart = await getOrCreateCart(req.user, guestId);
        res.json({ success: true, data: await enrichCart(cart) });
    } catch (err) {
        res.status(400).json({ detail: err.message });
    }
});

router.post('/items', getOptionalUser, async (req, res) => {
    try {
        const guestId = req.headers['x-guest-id'];
        if (!req.user && !guestId) return res.status(400).json({ detail: 'Missing guest id' });
        
        const { product_id, size, quantity = 1 } = req.body;
        
        const cart = await getOrCreateCart(req.user, guestId);
        
        const p = await prisma.product.findUnique({
            where: { id: product_id },
            include: { sizes: true }
        });
        
        if (!p) return res.status(404).json({ detail: 'Product not found' });
        
        const variant = p.sizes.find(s => s.size === size);
        if (!variant || variant.stock < quantity) {
            return res.status(400).json({ detail: 'Insufficient stock for selected size' });
        }
        
        const existing = cart.items.find(i => i.product_id === product_id && i.size === size);
        
        if (existing) {
            await prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + quantity }
            });
        } else {
            await prisma.cartItem.create({
                data: {
                    id: uuidv4(),
                    cart_id: cart.id,
                    product_id,
                    size,
                    quantity
                }
            });
        }
        
        const updatedCart = await prisma.cart.update({
            where: { id: cart.id },
            data: { updated_at: new Date() },
            include: { items: true }
        });
        
        res.json({ success: true, data: await enrichCart(updatedCart) });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/items/:item_id', getOptionalUser, async (req, res) => {
    try {
        const guestId = req.headers['x-guest-id'];
        const cart = await getOrCreateCart(req.user, guestId);
        const qty = parseInt(req.body.quantity || 1);
        
        const item = cart.items.find(i => i.id === req.params.item_id);
        if (item) {
            if (qty <= 0) {
                await prisma.cartItem.delete({ where: { id: item.id } });
            } else {
                await prisma.cartItem.update({
                    where: { id: item.id },
                    data: { quantity: qty }
                });
            }
        }
        
        const updatedCart = await prisma.cart.update({
            where: { id: cart.id },
            data: { updated_at: new Date() },
            include: { items: true }
        });
        
        res.json({ success: true, data: await enrichCart(updatedCart) });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.delete('/items/:item_id', getOptionalUser, async (req, res) => {
    try {
        const guestId = req.headers['x-guest-id'];
        const cart = await getOrCreateCart(req.user, guestId);
        
        const item = cart.items.find(i => i.id === req.params.item_id);
        if (item) {
            await prisma.cartItem.delete({ where: { id: item.id } });
        }
        
        const updatedCart = await prisma.cart.update({
            where: { id: cart.id },
            data: { updated_at: new Date() },
            include: { items: true }
        });
        
        res.json({ success: true, data: await enrichCart(updatedCart) });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/merge', getCurrentUser, async (req, res) => {
    try {
        const guestId = req.headers['x-guest-id'];
        if (!guestId) return res.json({ success: true });
        
        const guestCart = await prisma.cart.findUnique({
            where: { guest_id: guestId },
            include: { items: true }
        });
        
        if (!guestCart || guestCart.items.length === 0) {
            return res.json({ success: true });
        }
        
        const userCart = await getOrCreateCart(req.user, null);
        
        for (const gi of guestCart.items) {
            const existing = userCart.items.find(i => i.product_id === gi.product_id && i.size === gi.size);
            if (existing) {
                await prisma.cartItem.update({
                    where: { id: existing.id },
                    data: { quantity: existing.quantity + gi.quantity }
                });
            } else {
                await prisma.cartItem.update({
                    where: { id: gi.id },
                    data: { cart_id: userCart.id }
                });
            }
        }
        
        await prisma.cart.delete({ where: { id: guestCart.id } });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

module.exports = {
    router,
    getOrCreateCart,
    enrichCart
};
