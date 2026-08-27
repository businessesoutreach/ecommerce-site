const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_API_SECRET || 'sk_test_dummy', {
    apiVersion: '2023-10-16' // use latest or matching
});

module.exports = stripe;
