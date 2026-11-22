const { Safepay } = require('@sfpy/node-sdk');
const crypto = require('crypto');
const prisma = require('../db');

const DEFAULT_SAFEPAY_CONFIG = {
    apiKey: process.env.SAFEPAY_API_KEY || 'sec_1e86f0ae-5242-40ad-a888-6cdf18b022b6',
    v1Secret: process.env.SAFEPAY_SECRET || '8bd1d74c497526dc06cba27380f1b4b0c0919cba7c27c5eadec0dcd923a0f973',
    webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET || process.env.SAFEPAY_SECRET || '8bd1d74c497526dc06cba27380f1b4b0c0919cba7c27c5eadec0dcd923a0f973',
    environment: process.env.SAFEPAY_ENVIRONMENT || 'sandbox'
};

function getSafepayClient(settings) {
    const env = settings?.safepay_environment || DEFAULT_SAFEPAY_CONFIG.environment;
    const apiKey = settings?.safepay_api_key || DEFAULT_SAFEPAY_CONFIG.apiKey;
    const v1Secret = settings?.safepay_v1_secret || DEFAULT_SAFEPAY_CONFIG.v1Secret;
    const webhookSecret = settings?.safepay_webhook_secret || DEFAULT_SAFEPAY_CONFIG.webhookSecret;

    return new Safepay({
        environment: env,
        apiKey: apiKey,
        v1Secret: v1Secret,
        webhookSecret: webhookSecret
    });
}

const safepayClient = getSafepayClient();
const SAFEPAY_CONFIG = DEFAULT_SAFEPAY_CONFIG;

/**
 * Creates a Safepay payment tracker token and hosted checkout URL.
 * Supports Debit/Credit Cards, JazzCash, Easypaisa, and Raast.
 *
 * @param {object} order - Order record from database
 * @param {string} originUrl - Frontend base URL (e.g. https://sneak-pk.vercel.app or http://localhost:5173)
 * @returns {Promise<{token: string, checkoutUrl: string, amountInPkr: number, isAdvance: boolean}>}
 */
async function createPaymentSession(order, originUrl) {
    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
    const client = getSafepayClient(settings);

    // If order has advance required on COD, charge only the advance amount!
    let amountInPkr = Math.round(Number(order.total));
    const isAdvance = Boolean(order.advance_required && order.advance_amount > 0 && (order.advance_paid || 0) < order.advance_amount);
    if (isAdvance) {
        amountInPkr = Math.round(Number(order.advance_amount));
    }

    // Step 1: Create tracker token
    const trackerResponse = await client.payments.create({
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

    const checkoutUrl = client.checkout.create({
        token: token,
        orderId: order.order_number,
        cancelUrl: cancelUrl,
        redirectUrl: redirectUrl,
        source: 'custom',
        webhooks: true
    });

    return {
        token,
        checkoutUrl,
        amountInPkr,
        isAdvance
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
