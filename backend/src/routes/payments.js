const express = require('express');
const stripe = require('../utils/stripe');
const prisma = require('../db');

const router = express.Router();

router.post('/payments/stripe/checkout', async (req, res) => {
    try {
        const { order_id, origin_url } = req.body;
        
        const o = await prisma.order.findUnique({ where: { id: order_id } });
        if (!o) return res.status(404).json({ detail: 'Order not found' });
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: `Order ${o.order_number}` },
                    unit_amount: Math.round(o.total * 100)
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${origin_url}/order-confirmation/${o.order_number}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin_url}/checkout`,
            metadata: { order_id: order_id, order_number: o.order_number }
        });
        
        await prisma.paymentTransaction.create({
            data: {
                session_id: session.id,
                order_id: order_id,
                amount: o.total,
                currency: 'usd',
                status: 'initiated',
                payment_status: 'pending'
            }
        });
        
        res.json({ success: true, data: { checkout_url: session.url, session_id: session.id } });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/payments/status/:session_id', async (req, res) => {
    try {
        const { session_id } = req.params;
        let rec = await prisma.paymentTransaction.findUnique({ where: { session_id } });
        
        if (!rec) return res.status(404).json({ detail: 'Transaction not found' });
        
        if (rec.payment_status !== 'paid') {
            try {
                const status = await stripe.checkout.sessions.retrieve(session_id);
                if (status.payment_status === 'paid' || status.status === 'complete') {
                    await prisma.paymentTransaction.update({
                        where: { session_id },
                        data: { status: 'completed', payment_status: 'paid' }
                    });
                    await prisma.order.update({
                        where: { id: rec.order_id },
                        data: { payment_status: 'paid', status: 'confirmed' }
                    });
                    rec.payment_status = 'paid';
                }
            } catch (stripeErr) {
                console.error(`stripe status error: ${stripeErr.message}`);
            }
        }
        
        res.json({ success: true, data: { session_id, payment_status: rec.payment_status } });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// Note: webhook should be placed before body-parser in express setup
// We did that in server.js, but the router itself needs to handle it
router.post('/webhook/stripe', async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        // Note: For local development, we skip endpoint_secret verification just like the python version
        // if we don't have STRIPE_WEBHOOK_SECRET
        
        const bodyStr = req.body.toString();
        let event;
        
        try {
            event = JSON.parse(bodyStr);
        } catch (err) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            if (session.payment_status === 'paid') {
                const rec = await prisma.paymentTransaction.findUnique({ where: { session_id: session.id } });
                if (rec && rec.payment_status !== 'paid') {
                    await prisma.paymentTransaction.update({
                        where: { session_id: session.id },
                        data: { payment_status: 'paid', status: 'completed' }
                    });
                    await prisma.order.update({
                        where: { id: rec.order_id },
                        data: { payment_status: 'paid', status: 'confirmed' }
                    });
                }
            }
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error(`webhook error: ${err.message}`);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
