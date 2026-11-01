const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = require('../src/db');

async function testSafepayWebhook() {
    const targetOrderNumber = process.argv[2] || 'PK-SNK-99999';
    let order = {
        order_number: targetOrderNumber,
        total: 2500,
        payment_status: 'pending',
        status: 'pending'
    };

    try {
        if (process.argv[2]) {
            const found = await prisma.order.findUnique({ where: { order_number: targetOrderNumber } });
            if (found) order = found;
        } else {
            const found = await prisma.order.findFirst({ orderBy: { created_at: 'desc' } });
            if (found) order = found;
        }
    } catch (dbErr) {
        console.warn('⚠️ Note: Database query skipped (' + dbErr.message.split('\n')[0] + '). Testing API endpoint with mock order: ' + targetOrderNumber);
    }

    console.log(`\n========================================`);
    console.log(`🧪 TESTING SAFEPAY WEBHOOK LOCALLY`);
    console.log(`Order Number : ${order.order_number}`);
    console.log(`Total Amount : Rs. ${order.total}`);
    console.log(`Current Status: ${order.payment_status} / ${order.status}`);
    console.log(`========================================\n`);

    // Prepare mock tracker token
    const testTracker = `track_test_${Date.now()}`;

    try {
        if (order.id) {
            await prisma.paymentTransaction.upsert({
                where: { session_id: testTracker },
                create: {
                    session_id: testTracker,
                    order_id: order.id,
                    amount: order.total,
                    currency: 'PKR',
                    status: 'initiated',
                    payment_status: 'pending'
                },
                update: {}
            });
        }
    } catch (_) {}

    // Construct Safepay 2.0.0 webhook payload
    const payload = {
        type: 'payment.succeeded',
        data: {
            token: testTracker,
            order_id: order.order_number,
            amount: Math.round(order.total * 100),
            currency: 'PKR',
            state: 'COMPLETED',
            metadata: {
                order_number: order.order_number,
                tracker: testTracker
            }
        }
    };

    // Compute real HMAC-SHA512 signature
    const secret = process.env.SAFEPAY_WEBHOOK_SECRET || process.env.SAFEPAY_SECRET;
    const rawData = JSON.stringify(payload.data);
    const signature = crypto.createHmac('sha512', secret).update(Buffer.from(rawData)).digest('hex');

    console.log(`Payload prepared with tracker: ${testTracker}`);
    console.log(`Generated HMAC-SHA512 Signature: ${signature.substring(0, 24)}...`);

    const backendUrl = process.env.TEST_BACKEND_URL || 'http://localhost:8000';
    const webhookUrl = `${backendUrl}/api/webhook/safepay`;

    console.log(`Sending POST to: ${webhookUrl} ...\n`);

    try {
        const response = await axios.post(webhookUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-sfpy-signature': signature,
                'x-sfpy-event-type': 'payment.succeeded'
            }
        });

        console.log(`✅ Server responded with status: ${response.status}`, response.data);

        // Check updated order status in database if connected
        try {
            if (order.id) {
                const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
                console.log(`\n🎉 Database Verification:`);
                console.log(`Payment Status : ${updatedOrder.payment_status} (Expected: paid)`);
                console.log(`Order Status   : ${updatedOrder.status} (Expected: confirmed)`);
            }
        } catch (_) {}
    } catch (err) {
        console.error(`❌ Webhook request failed:`, err.response ? err.response.data : err.message);
    } finally {
        await prisma.$disconnect();
    }
}

testSafepayWebhook().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
