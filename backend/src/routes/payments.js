const express = require('express');
const prisma = require('../db');

const router = express.Router();


// ==========================================
// Safepay PK Routes (Cards, JazzCash, Easypaisa)
// ==========================================
const { createPaymentSession, verifyWebhookSignature, SAFEPAY_CONFIG } = require('../utils/safepay');

// Initiate Safepay checkout — frontend calls this after creating the order
router.post('/payments/safepay/checkout', async (req, res) => {
    try {
        const { order_id, origin_url } = req.body;

        const order = await prisma.order.findUnique({
            where: { id: order_id },
            include: { items: true }
        });
        if (!order) return res.status(404).json({ detail: 'Order not found' });

        const session = await createPaymentSession(order, origin_url);

        await prisma.paymentTransaction.create({
            data: {
                session_id: session.token,
                order_id: order_id,
                amount: session.amountInPkr || order.total,
                currency: 'PKR',
                status: 'initiated',
                payment_status: 'pending'
            }
        });

        res.json({
            success: true,
            data: {
                checkout_url: session.checkoutUrl,
                tracker: session.token
            }
        });
    } catch (err) {
        console.error('Safepay checkout error:', err.message);
        res.status(500).json({ detail: err.message });
    }
});

const axios = require('axios');

// Safepay Status check by tracker token (queries Safepay API & syncs status immediately on redirect)
router.get('/payments/safepay/status/:tracker', async (req, res) => {
    try {
        const { tracker } = req.params;
        let txn = await prisma.paymentTransaction.findUnique({ where: { session_id: tracker } });
        if (!txn) return res.status(404).json({ detail: 'Transaction not found' });

        let order = await prisma.order.findUnique({
            where: { id: txn.order_id },
            include: { items: true }
        });

        // If local payment status is not yet marked as paid, query Safepay API directly
        if (txn.payment_status !== 'paid' && order) {
            try {
                const baseUrl = SAFEPAY_CONFIG.environment === 'production'
                    ? 'https://api.getsafepay.com'
                    : 'https://sandbox.api.getsafepay.com';

                const sfRes = await axios.get(`${baseUrl}/order/v1/${tracker}`, { timeout: 10000 });
                const sfData = sfRes.data?.data;
                const isPaid = sfData && (
                    sfData.state === 'TRACKER_ENDED' || 
                    sfData.state === 'COMPLETED' || 
                    sfData.state === 'PAID' || 
                    sfData.transaction != null
                );

                if (isPaid && order.payment_status !== 'paid' && !(order.payment_method === 'COD' && order.payment_status === 'partially_paid')) {
                    const isCodAdvance = Boolean(order.payment_method === 'COD' && order.advance_required);
                    order = await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            payment_status: isCodAdvance ? 'partially_paid' : 'paid',
                            advance_paid: isCodAdvance ? order.advance_amount : (order.advance_paid || 0),
                            status: 'confirmed'
                        },
                        include: { items: true }
                    });

                    await prisma.paymentTransaction.update({
                        where: { session_id: tracker },
                        data: {
                            status: 'completed',
                            payment_status: 'paid'
                        }
                    });

                    txn.payment_status = 'paid';

                    // Send confirmation email
                    if (order.customer_email) {
                        try {
                            const { sendOrderConfirmation } = require('../utils/mailer');
                            const originUrl = process.env.FRONTEND_URL || 'https://sneak-pk.vercel.app';
                            sendOrderConfirmation(order.customer_email, order, originUrl).catch(console.error);
                        } catch (mailErr) {
                            console.error('Mail error on status sync:', mailErr.message);
                        }
                    }
                    console.log(`Safepay Status API: Order ${order.order_number} verified and marked as paid!`);
                }
            } catch (apiErr) {
                console.error('Safepay order status check error:', apiErr.message);
            }
        }

        res.json({
            success: true,
            data: {
                tracker,
                payment_status: txn.payment_status,
                order_status: order ? order.status : null,
                order_number: order ? order.order_number : null,
                order: order || null
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// Webhook endpoint for Safepay (registered in Safepay dashboard)
// URL: https://sneak-pk.vercel.app/api/webhook/safepay
router.post(['/webhook/safepay', '/payments/safepay/webhook'], async (req, res) => {
    try {
        console.log('Safepay Webhook received. Headers:', JSON.stringify(req.headers));
        console.log('Safepay Webhook body:', JSON.stringify(req.body));

        if (!verifyWebhookSignature(req)) {
            console.error('Safepay webhook signature mismatch');
            return res.status(400).json({ error: 'Invalid Safepay signature' });
        }

        const payload = req.body || {};
        const eventType = req.headers['x-sfpy-event-type'] || payload.type || payload.event;
        const data = payload.data || payload;

        // Extract identifiers: token/tracker and order_id/order_number
        const trackerToken = data.token || data.tracker || data.beacon || (data.metadata && data.metadata.tracker);
        const orderNumber = data.order_id || (data.metadata && (data.metadata.order_number || data.metadata.orderId));

        console.log(`Safepay Event: ${eventType}, tracker: ${trackerToken}, order: ${orderNumber}`);

        // Find the matching order
        let order = null;
        let txn = null;

        if (trackerToken) {
            txn = await prisma.paymentTransaction.findUnique({ where: { session_id: trackerToken } });
            if (txn) {
                order = await prisma.order.findUnique({ where: { id: txn.order_id }, include: { items: true } });
            }
        }

        if (!order && orderNumber) {
            order = await prisma.order.findUnique({ where: { order_number: orderNumber }, include: { items: true } });
        }

        // Determine event outcome
        const state = (data.state || data.status || '').toUpperCase();
        const isSuccess = 
            eventType === 'payment.succeeded' ||
            eventType === 'payment.completed' ||
            eventType === 'payment:created' ||
            state === 'COMPLETED' ||
            state === 'PAID' ||
            state === 'TRACKER_ENDED';

        const isFailed = 
            eventType === 'payment.failed' ||
            eventType === 'payment.rejected' ||
            eventType === 'error:occurred' ||
            state === 'FAILED' ||
            state === 'REJECTED';

        const isRefunded = 
            eventType === 'payment.refunded' ||
            eventType === 'refund:created';

        if (order) {
            if (isSuccess && order.payment_status !== 'paid' && !(order.payment_method === 'COD' && order.payment_status === 'partially_paid')) {
                const isCodAdvance = Boolean(order.payment_method === 'COD' && order.advance_required);
                const updatedOrder = await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        payment_status: isCodAdvance ? 'partially_paid' : 'paid',
                        advance_paid: isCodAdvance ? order.advance_amount : (order.advance_paid || 0),
                        status: 'confirmed'
                    },
                    include: { items: true }
                });

                if (txn) {
                    await prisma.paymentTransaction.update({
                        where: { session_id: txn.session_id },
                        data: {
                            status: 'completed',
                            payment_status: 'paid'
                        }
                    });
                }

                // Send confirmation email
                if (updatedOrder.customer_email) {
                    try {
                        const { sendOrderConfirmation } = require('../utils/mailer');
                        const originUrl = process.env.FRONTEND_URL || 'https://sneak-pk.vercel.app';
                        sendOrderConfirmation(updatedOrder.customer_email, updatedOrder, originUrl).catch(console.error);
                    } catch (mailErr) {
                        console.error('Safepay webhook mail error:', mailErr.message);
                    }
                }
                console.log(`Safepay: Order ${order.order_number} marked as paid & confirmed.`);
            } else if (isFailed) {
                await prisma.order.update({
                    where: { id: order.id },
                    data: { payment_status: 'failed' }
                });
                if (txn) {
                    await prisma.paymentTransaction.update({
                        where: { session_id: txn.session_id },
                        data: { status: 'failed', payment_status: 'failed' }
                    });
                }
                console.log(`Safepay: Order ${order.order_number} payment failed.`);
            } else if (isRefunded) {
                await prisma.order.update({
                    where: { id: order.id },
                    data: { payment_status: 'refunded' }
                });
                if (txn) {
                    await prisma.paymentTransaction.update({
                        where: { session_id: txn.session_id },
                        data: { status: 'refunded', payment_status: 'refunded' }
                    });
                }
                console.log(`Safepay: Order ${order.order_number} refunded.`);
            }
        } else {
            console.warn('Safepay webhook: No matching order found for tracker:', trackerToken, 'order:', orderNumber);
        }

        return res.status(200).json({ success: true, received: true });
    } catch (err) {
        console.error('Safepay webhook processing error:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;


