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
                    const updatedOrder = await prisma.order.update({
                        where: { id: rec.order_id },
                        data: { payment_status: 'paid', status: 'confirmed' },
                        include: { items: true }
                    });
                    
                    if (updatedOrder.customer_email) {
                        const { sendOrderConfirmation } = require('../utils/mailer');
                        const originUrl = 'http://localhost:5173'; // Default fallback, but typically should use env var or similar in prod
                        sendOrderConfirmation(updatedOrder.customer_email, updatedOrder, originUrl).catch(console.error);
                    }
                }
            }
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error(`webhook error: ${err.message}`);
        res.status(500).json({ success: false });
    }
});

// ==========================================
// PayFast PK Routes
// ==========================================
const { getAccessToken, buildCheckoutPayload, verifyIPN, PAYFAST_CONFIG } = require('../utils/payfast');

// Initiate PayFast checkout — frontend calls this after creating the order
router.post('/payments/payfast/initiate', async (req, res) => {
    try {
        const { order_id, origin_url } = req.body;
        
        const order = await prisma.order.findUnique({ where: { id: order_id } });
        if (!order) return res.status(404).json({ detail: 'Order not found' });
        
        const { token, merchantId } = await getAccessToken(order.order_number, order.total);
        
        const backendUrl = `${origin_url.replace(/:\d+$/, ':8000')}`; // Backend port
        const successUrl = `${origin_url}/order-confirmation/${order.order_number}?payfast=success`;
        const failureUrl = `${origin_url}/checkout?payfast=failed`;
        const callbackUrl = `${backendUrl}/api/payments/payfast/callback`;
        
        const checkoutData = buildCheckoutPayload(order, token, order.payment_method, successUrl, failureUrl, callbackUrl);
        
        // Create payment transaction record
        const sessionId = `payfast_${order.order_number}_${Date.now()}`;
        await prisma.paymentTransaction.create({
            data: {
                session_id: sessionId,
                order_id: order_id,
                amount: order.total,
                currency: 'PKR',
                status: 'initiated',
                payment_status: 'pending'
            }
        });
        
        res.json({
            success: true,
            data: {
                checkout_url: checkoutData.CHECKOUT_URL,
                form_fields: checkoutData,
                session_id: sessionId,
                is_mock: !PAYFAST_CONFIG.merchantId || PAYFAST_CONFIG.merchantId === 'your_sandbox_merchant_id'
            }
        });
    } catch (err) {
        console.error('PayFast initiate error:', err.message);
        res.status(500).json({ detail: err.message });
    }
});

// IPN callback from PayFast (server-to-server)
router.post('/payments/payfast/callback', async (req, res) => {
    try {
        console.log('PayFast IPN received:', JSON.stringify(req.body));
        
        const payload = req.body;
        
        if (!verifyIPN(payload)) {
            console.error('PayFast IPN verification failed');
            return res.status(400).json({ detail: 'Invalid IPN' });
        }
        
        const orderNumber = payload.BASKET_ID;
        const txnStatus = payload.TRANSACTION_STATUS; // 0 = failed, 1 = success
        
        const order = await prisma.order.findUnique({ where: { order_number: orderNumber } });
        if (!order) {
            console.error(`PayFast IPN: Order ${orderNumber} not found`);
            return res.status(404).json({ detail: 'Order not found' });
        }
        
        if (txnStatus === '1' || txnStatus === 1) {
            // Payment successful
            await prisma.order.update({
                where: { id: order.id },
                data: { payment_status: 'paid', status: 'confirmed' }
            });
            
            // Update payment transaction if exists
            const txn = await prisma.paymentTransaction.findFirst({
                where: { order_id: order.id },
                orderBy: { created_at: 'desc' }
            });
            if (txn) {
                await prisma.paymentTransaction.update({
                    where: { session_id: txn.session_id },
                    data: { status: 'completed', payment_status: 'paid' }
                });
            }
            
            console.log(`PayFast: Order ${orderNumber} payment confirmed`);
        } else {
            // Payment failed
            await prisma.order.update({
                where: { id: order.id },
                data: { payment_status: 'failed' }
            });
            console.log(`PayFast: Order ${orderNumber} payment failed`);
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error('PayFast callback error:', err.message);
        res.status(500).json({ detail: err.message });
    }
});

// Mock endpoint for testing without real PayFast credentials
// Simulates a successful payment callback
router.post('/payments/payfast/mock-complete', async (req, res) => {
    try {
        const { order_number } = req.body;
        
        const order = await prisma.order.findUnique({ where: { order_number } });
        if (!order) return res.status(404).json({ detail: 'Order not found' });
        
        await prisma.order.update({
            where: { id: order.id },
            data: { payment_status: 'paid', status: 'confirmed' }
        });
        
        const txn = await prisma.paymentTransaction.findFirst({
            where: { order_id: order.id },
            orderBy: { created_at: 'desc' }
        });
        if (txn) {
            await prisma.paymentTransaction.update({
                where: { session_id: txn.session_id },
                data: { status: 'completed', payment_status: 'paid' }
            });
        }
        
        res.json({ success: true, message: `Order ${order_number} marked as paid (mock)` });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

module.exports = router;

