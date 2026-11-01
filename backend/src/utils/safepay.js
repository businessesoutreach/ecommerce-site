const { Safepay } = require('@sfpy/node-sdk');
const crypto = require('crypto');

const SAFEPAY_CONFIG = {
    apiKey: process.env.SAFEPAY_API_KEY || 'sec_1e86f0ae-5242-40ad-a888-6cdf18b022b6',
    v1Secret: process.env.SAFEPAY_SECRET || '8bd1d74c497526dc06cba27380f1b4b0c0919cba7c27c5eadec0dcd923a0f973',
    webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET || process.env.SAFEPAY_SECRET || '8bd1d74c497526dc06cba27380f1b4b0c0919cba7c27c5eadec0dcd923a0f973',
    environment: process.env.SAFEPAY_ENVIRONMENT || 'sandbox'
};

const safepayClient = new Safepay({
    environment: SAFEPAY_CONFIG.environment,
    apiKey: SAFEPAY_CONFIG.apiKey,
    v1Secret: SAFEPAY_CONFIG.v1Secret,
    webhookSecret: SAFEPAY_CONFIG.webhookSecret
});

/**
 * Creates a Safepay payment tracker token and hosted checkout URL.
 * Supports Debit/Credit Cards, JazzCash, Easypaisa, and Raast.
 *
 * @param {object} order - Order record from database
 * @param {string} originUrl - Frontend base URL (e.g. https://sneak-pk.vercel.app or http://localhost:5173)
 * @returns {Promise<{token: string, checkoutUrl: string}>}
 */
async function createPaymentSession(order, originUrl) {
    // Amount in PKR standard currency units
    const amountInPkr = Math.round(Number(order.total));

    // Step 1: Create tracker token
    const trackerResponse = await safepayClient.payments.create({
        amount: amountInPkr,
        currency: 'PKR'
    });

    const token = trackerResponse.token;
    if (!token) {
        throw new Error('No tracker token returned by Safepay');
    }

    // Step 2: Build checkout URL
    const redirectUrl = `${originUrl}/order-confirmation/${order.order_number}?safepay=success&tracker=${token}`;
    const cancelUrl = `${originUrl}/checkout?safepay=cancelled`;

    const checkoutUrl = safepayClient.checkout.create({
        token: token,
        orderId: order.order_number,
        cancelUrl: cancelUrl,
        redirectUrl: redirectUrl,
        source: 'custom',
        webhooks: true
    });

    return {
        token,
        checkoutUrl
    };
}

/**
 * Verifies the x-sfpy-signature header of an incoming Safepay webhook.
 * Uses SHA-512 HMAC matching Safepay's specification.
 *
 * @param {object} req - Express request object
 * @returns {boolean}
 */
function verifyWebhookSignature(req) {
    const signature = req.headers['x-sfpy-signature'];
    
    // In sandbox mode without strict verification, allow test requests without signature
    if (!signature) {
        if (SAFEPAY_CONFIG.environment === 'sandbox' && !process.env.SAFEPAY_STRICT_WEBHOOK) {
            console.warn('Safepay webhook: No x-sfpy-signature header received. Accepting in sandbox mode.');
            return true;
        }
        return false;
    }

    try {
        // Try SDK verification first
        if (safepayClient.verify && typeof safepayClient.verify.webhook === 'function') {
            const isValid = safepayClient.verify.webhook(req);
            if (isValid) return true;
        }

        // Custom HMAC-SHA512 fallback
        const secret = SAFEPAY_CONFIG.webhookSecret;
        const payloadString = req.body?.data ? JSON.stringify(req.body.data) : (req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body));
        const computedSignature = crypto
            .createHmac('sha512', secret)
            .update(Buffer.from(payloadString))
            .digest('hex');

        if (signature.toLowerCase() === computedSignature.toLowerCase()) {
            return true;
        }

        // Try comparing buffer timing-safely if lengths match
        if (signature.length === computedSignature.length) {
            return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(computedSignature, 'hex'));
        }

        return false;
    } catch (err) {
        console.error('Safepay signature verification exception:', err.message);
        return false;
    }
}

module.exports = {
    safepayClient,
    SAFEPAY_CONFIG,
    createPaymentSession,
    verifyWebhookSignature
};
