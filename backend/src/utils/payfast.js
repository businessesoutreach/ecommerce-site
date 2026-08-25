const axios = require('axios');

const PAYFAST_CONFIG = {
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    securedKey: process.env.PAYFAST_SECURED_KEY,
    tokenUrl: process.env.PAYFAST_TOKEN_URL || 'https://sandbox.gopayfast.com/Token/token.php',
    checkoutUrl: process.env.PAYFAST_CHECKOUT_URL || 'https://sandbox.gopayfast.com/Transaction/pay.php',
    isSandbox: process.env.PAYFAST_SANDBOX === 'true'
};

/**
 * Get an access token from PayFast for a transaction.
 * @param {string} basketId - Unique identifier for the order/basket
 * @param {number} amount - Transaction amount in PKR
 * @returns {Promise<{token: string, merchantId: string}>}
 */
async function getAccessToken(basketId, amount) {
    // If no merchant credentials, use mock mode for development
    if (!PAYFAST_CONFIG.merchantId || PAYFAST_CONFIG.merchantId === 'your_sandbox_merchant_id') {
        console.log(`\n========================================`);
        console.log(`MOCK PAYFAST TOKEN REQUEST`);
        console.log(`Basket ID: ${basketId}`);
        console.log(`Amount: PKR ${amount}`);
        console.log(`========================================\n`);
        return {
            token: `MOCK_TOKEN_${Date.now()}`,
            merchantId: PAYFAST_CONFIG.merchantId || 'MOCK_MERCHANT'
        };
    }

    try {
        const params = new URLSearchParams();
        params.append('MERCHANT_ID', PAYFAST_CONFIG.merchantId);
        params.append('SECURED_KEY', PAYFAST_CONFIG.securedKey);
        params.append('BASKET_ID', basketId);
        params.append('TXNAMT', String(amount));

        const response = await axios.post(PAYFAST_CONFIG.tokenUrl, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 30000
        });

        if (response.data && response.data.ACCESS_TOKEN) {
            return {
                token: response.data.ACCESS_TOKEN,
                merchantId: PAYFAST_CONFIG.merchantId
            };
        }

        throw new Error('No ACCESS_TOKEN in PayFast response');
    } catch (error) {
        console.error('PayFast token error:', error.message);
        throw new Error(`PayFast token error: ${error.message}`);
    }
}

/**
 * Build the form data for redirecting the user to PayFast's hosted checkout.
 * @param {object} order - The order object from the database
 * @param {string} accessToken - The token returned from getAccessToken
 * @param {string} paymentMethod - JAZZCASH, EASYPAISA, or CARD
 * @param {string} successUrl - URL to redirect to on success
 * @param {string} failureUrl - URL to redirect to on failure
 * @param {string} callbackUrl - IPN callback URL for server-to-server notification
 * @returns {object} - The form fields and the checkout URL
 */
function buildCheckoutPayload(order, accessToken, paymentMethod, successUrl, failureUrl, callbackUrl) {
    // Map our payment methods to PayFast's PROCCODE
    // 00 = All methods, allowing PayFast to show all options
    // PayFast handles the method selection on their page
    const procCode = '00';

    const payload = {
        MERCHANT_ID: PAYFAST_CONFIG.merchantId || 'MOCK_MERCHANT',
        TOKEN: accessToken,
        PROCCODE: procCode,
        TXNAMT: String(order.total),
        BASKET_ID: order.order_number,
        ORDER_DATE: new Date().toISOString().split('T')[0],
        TXNDESC: `SoleKicks PK Order ${order.order_number}`,
        SUCCESS_URL: successUrl,
        FAILURE_URL: failureUrl,
        CUSTOMER_MOBILE_NO: order.customer_phone?.replace(/\D/g, '') || '',
        CUSTOMER_EMAIL_ADDRESS: order.customer_email || '',
        CHECKOUT_URL: PAYFAST_CONFIG.checkoutUrl,
        IPN_URL: callbackUrl
    };

    return payload;
}

/**
 * Verify an IPN (Instant Payment Notification) callback from PayFast.
 * In production, you should verify the signature/hash sent by PayFast.
 * @param {object} payload - The POST body from PayFast's IPN
 * @returns {boolean}
 */
function verifyIPN(payload) {
    // Basic verification: check that required fields exist
    if (!payload || !payload.BASKET_ID) {
        return false;
    }

    // In sandbox/mock mode, accept all callbacks
    if (PAYFAST_CONFIG.isSandbox || !PAYFAST_CONFIG.merchantId || PAYFAST_CONFIG.merchantId === 'your_sandbox_merchant_id') {
        return true;
    }

    // In production, verify the MERCHANT_ID matches
    if (payload.MERCHANT_ID !== PAYFAST_CONFIG.merchantId) {
        console.error('PayFast IPN: MERCHANT_ID mismatch');
        return false;
    }

    return true;
}

module.exports = { getAccessToken, buildCheckoutPayload, verifyIPN, PAYFAST_CONFIG };
