const express = require('express');
const prisma = require('../db');
const { getCurrentUser } = require('../middleware/auth');

const router = express.Router();

async function getSettings() {
    const s = await prisma.settings.findUnique({ where: { id: 'singleton' } });
    return s || {};
}

async function shippingEstimate(country_code, subtotal) {
    const settings = await getSettings();
    const zone = await prisma.shippingZone.findFirst({
        where: { country_code: country_code, is_active: true }
    });
    
    let flat;
    let free_min;
    
    if (zone) {
        flat = zone.flat_fee;
        free_min = zone.free_shipping_min;
    } else {
        flat = settings.flat_shipping_fee || 250;
        free_min = settings.free_shipping_min_amt || 5000;
    }
    
    const fee = (free_min && subtotal >= free_min) ? 0 : flat;
    return { shipping_fee: fee, free_shipping_min: free_min };
}

async function validateCoupon(code, subtotal) {
    const c = await prisma.coupon.findFirst({
        where: { code: code.toUpperCase(), is_active: true }
    });
    
    if (!c) throw new Error('Invalid coupon code');
    if (c.expires_at && new Date(c.expires_at) < new Date()) {
        throw new Error('Coupon expired');
    }
    if (c.max_uses && c.used_count >= c.max_uses) {
        throw new Error('Coupon usage limit reached');
    }
    if (c.min_order_value && subtotal < c.min_order_value) {
        throw new Error(`Minimum order Rs. ${c.min_order_value} required`);
    }
    
    let discount = 0;
    if (c.type === 'percentage') {
        discount = subtotal * (c.value / 100);
    } else {
        discount = c.value;
    }
    
    return { coupon: c, discount: Math.min(discount, subtotal) };
}

router.post('/shipping-estimate', async (req, res) => {
    try {
        const { country_code = 'PK', subtotal } = req.body;
        const data = await shippingEstimate(country_code, parseFloat(subtotal));
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/apply-coupon', async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        const { coupon, discount } = await validateCoupon(code, parseFloat(subtotal));
        
        res.json({
            success: true,
            data: {
                code: coupon.code,
                discount: discount,
                type: coupon.type,
                value: coupon.value
            }
        });
    } catch (err) {
        res.status(400).json({ detail: err.message });
    }
});

router.post('/apply-store-credit', getCurrentUser, async (req, res) => {
    try {
        const subtotal = parseFloat(req.body.subtotal || 0);
        const sc = await prisma.storeCredit.findUnique({ where: { user_id: req.user.id } });
        const bal = sc ? sc.balance : 0.0;
        
        const usable = Math.min(bal, subtotal);
        res.json({
            success: true,
            data: {
                available: bal,
                applicable: usable
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

module.exports = {
    router,
    getSettings,
    shippingEstimate,
    validateCoupon
};
