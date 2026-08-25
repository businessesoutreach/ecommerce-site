const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../db');
const { getOptionalUser, getCurrentUser } = require('../middleware/auth');
const { getOrCreateCart } = require('./cart');
const { shippingEstimate, validateCoupon, getSettings } = require('./checkout');
const { notify } = require('../utils/notifications');

const router = express.Router();

async function genOrderNumber() {
    for (let i = 0; i < 6; i++) {
        const num = "PK-SNK-" + Math.floor(10000 + Math.random() * 90000);
        const existing = await prisma.order.findUnique({ where: { order_number: num } });
        if (!existing) return num;
    }
    return "PK-SNK-" + uuidv4().substring(0, 8).toUpperCase();
}

async function addStoreCredit(user_id, amount, reason, order_id = null) {
    const sc = await prisma.storeCredit.findUnique({ where: { user_id } });
    const currentBal = sc ? sc.balance : 0.0;
    const newBal = currentBal + parseFloat(amount);
    
    if (sc) {
        await prisma.storeCredit.update({
            where: { user_id },
            data: { balance: newBal }
        });
    } else {
        await prisma.storeCredit.create({
            data: { id: uuidv4(), user_id, balance: newBal }
        });
    }
    
    await prisma.storeCreditLedger.create({
        data: {
            id: uuidv4(),
            user_id,
            amount: parseFloat(amount),
            reason,
            order_id
        }
    });
    
    return newBal;
}

router.post('/', getOptionalUser, async (req, res) => {
    try {
        const guestId = req.headers['x-guest-id'];
        const {
            customer_name, customer_phone, customer_email,
            shipping_address, payment_method, coupon_code,
            customer_note, store_credit_amount = 0
        } = req.body;
        
        const cart = await getOrCreateCart(req.user, guestId);
        if (!cart.items || cart.items.length === 0) {
            return res.status(400).json({ detail: 'Cart is empty' });
        }
        
        let subtotal = 0;
        const orderItemsData = [];
        
        // Fetch products manually because we need to decrement stock in a transaction later
        for (const it of cart.items) {
            const p = await prisma.product.findUnique({
                where: { id: it.product_id },
                include: { sizes: true }
            });
            if (!p) throw new Error('A product is no longer available');
            
            const variant = p.sizes.find(s => s.size === it.size);
            if (!variant || variant.stock < it.quantity) {
                throw new Error(`Insufficient stock for ${p.name} size ${it.size}`);
            }
            
            const price = parseFloat(p.base_price);
            subtotal += price * it.quantity;
            
            orderItemsData.push({
                product_id: p.id,
                product_name: p.name,
                variant_label: `EU ${it.size}`,
                size: it.size,
                image_url: p.images[0],
                unit_price: price,
                quantity: it.quantity
            });
        }
        
        let discount = 0;
        let finalCoupon = null;
        if (coupon_code) {
            const result = await validateCoupon(coupon_code, subtotal);
            finalCoupon = result.coupon.code;
            discount = result.discount;
        }
        
        const countryCode = shipping_address?.country_code || 'PK';
        const est = await shippingEstimate(countryCode, subtotal);
        const shipping_fee = est.shipping_fee;
        
        const settings = await getSettings();
        const thr = settings.advance_payment_threshold;
        const pct = settings.advance_payment_percent;
        const advance_required = Boolean(payment_method === 'COD' && thr && pct && subtotal >= thr);
        const advance_amount = advance_required ? (subtotal * (pct / 100)) : 0.0;
        
        let store_credit_used = 0.0;
        if (req.user && store_credit_amount > 0) {
            const sc = await prisma.storeCredit.findUnique({ where: { user_id: req.user.id } });
            const bal = sc ? sc.balance : 0.0;
            store_credit_used = Math.min(parseFloat(store_credit_amount), bal, subtotal - discount + shipping_fee);
        }
        
        const total = subtotal - discount + shipping_fee - store_credit_used;
        
        const order_number = await genOrderNumber();
        const order_id = uuidv4();
        
        let payment_status = 'pending';
        let advance_paid = 0.0;
        
        if (payment_method === 'WALLET') payment_status = 'paid';
        else if (advance_required) {
            payment_status = 'partially_paid';
            advance_paid = advance_amount;
        }
        
        // Transaction for atomic stock decrement and order creation
        const order = await prisma.$transaction(async (tx) => {
            // Decrement stock
            for (const it of cart.items) {
                const updated = await tx.productSize.updateMany({
                    where: {
                        product_id: it.product_id,
                        size: it.size,
                        stock: { gte: it.quantity }
                    },
                    data: { stock: { decrement: it.quantity } }
                });
                if (updated.count === 0) {
                    throw new Error(`Sorry, one of your items just sold out. Please review your bag.`);
                }
            }
            
            if (finalCoupon) {
                await tx.coupon.update({
                    where: { code: finalCoupon },
                    data: { used_count: { increment: 1 } }
                });
            }
            
            const newOrder = await tx.order.create({
                data: {
                    id: order_id,
                    order_number,
                    user_id: req.user ? req.user.id : null,
                    customer_name,
                    customer_phone,
                    customer_email,
                    shipping_address,
                    subtotal,
                    shipping_fee,
                    discount_amount: discount,
                    coupon_code: finalCoupon,
                    store_credit_used,
                    advance_required,
                    advance_amount,
                    advance_paid,
                    total,
                    payment_method,
                    payment_status,
                    status: 'placed',
                    customer_note,
                    items: {
                        create: orderItemsData.map(oi => ({
                            id: uuidv4(),
                            ...oi
                        }))
                    },
                    status_history: {
                        create: [{
                            id: uuidv4(),
                            status: 'placed',
                            note: 'Order placed'
                        }]
                    }
                },
                include: { items: true, status_history: true }
            });
            
            // Clear cart items
            await tx.cartItem.deleteMany({
                where: { cart_id: cart.id }
            });
            
            return newOrder;
        });
        
        if (store_credit_used > 0 && req.user) {
            await addStoreCredit(req.user.id, -store_credit_used, "REDEEMED_ON_ORDER", order.id);
        }
        
        if (order.customer_email && payment_method === 'COD') {
            const { sendOrderConfirmation } = require('../utils/mailer');
            const origin = req.headers.origin || 'http://localhost:5173';
            sendOrderConfirmation(order.customer_email, order, origin).catch(console.error);
        }
        
        await notify(order, "ORDER_PLACED", `Order ${order.order_number} confirmed! Total Rs. ${total} via ${payment_method}. We'll update you as it ships.`);
        
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ detail: err.message });
    }
});

router.get('/', getCurrentUser, async (req, res) => {
    try {
        const items = await prisma.order.findMany({
            where: { user_id: req.user.id },
            orderBy: { created_at: 'desc' },
            include: { items: true, status_history: true }
        });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/:order_number', getOptionalUser, async (req, res) => {
    try {
        const phone = req.query.phone;
        const o = await prisma.order.findUnique({
            where: { order_number: req.params.order_number },
            include: { items: true, status_history: true }
        });
        
        if (!o) return res.status(404).json({ detail: 'Order not found' });
        
        if (req.user && o.user_id === req.user.id) {
            return res.json({ success: true, data: o });
        }
        
        if (phone && o.customer_phone.replace(/\s/g, '') === phone.replace(/\s/g, '')) {
            return res.json({ success: true, data: o });
        }
        
        res.status(403).json({ detail: 'Provide the phone number used at checkout' });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/:order_id/cancel', getCurrentUser, async (req, res) => {
    try {
        const o = await prisma.order.findFirst({
            where: { id: req.params.order_id, user_id: req.user.id }
        });
        
        if (!o) return res.status(404).json({ detail: 'Order not found' });
        if (['shipped', 'delivered', 'cancelled'].includes(o.status)) {
            return res.status(400).json({ detail: 'Order can no longer be cancelled' });
        }
        
        await prisma.order.update({
            where: { id: req.params.order_id },
            data: {
                status: 'cancelled',
                status_history: {
                    create: {
                        id: uuidv4(),
                        status: 'cancelled',
                        note: 'Cancelled by customer'
                    }
                }
            }
        });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/:order_id/return-request', getOptionalUser, async (req, res) => {
    try {
        const o = await prisma.order.findUnique({ where: { id: req.params.order_id } });
        if (!o) return res.status(404).json({ detail: 'Order not found' });
        
        const { reason, phone } = req.body;
        
        const authorized = (req.user && o.user_id === req.user.id) || 
                           (phone && o.customer_phone.replace(/\s/g, '') === phone.replace(/\s/g, ''));
                           
        if (!authorized) return res.status(403).json({ detail: 'Not authorized for this order' });
        
        if (['cancelled', 'returned', 'return_requested'].includes(o.status)) {
            return res.status(400).json({ detail: 'A return is not available for this order' });
        }
        
        const rr = await prisma.returnRequest.create({
            data: {
                id: uuidv4(),
                order_id: o.id,
                order_number: o.order_number,
                customer_name: o.customer_name,
                customer_phone: o.customer_phone,
                reason,
                status: 'pending'
            }
        });
        
        await prisma.order.update({
            where: { id: o.id },
            data: {
                status: 'return_requested',
                status_history: {
                    create: {
                        id: uuidv4(),
                        status: 'return_requested',
                        note: reason
                    }
                }
            }
        });
        
        await notify(o, 'RETURN_REQUESTED', `Return request received for ${o.order_number}. Our team will review it shortly.`);
        
        res.json({ success: true, data: rr });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

module.exports = router;
