const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

// Fast-fail if essential security variables are missing
if (!process.env.JWT_SECRET) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing.');
}

const authRoutes = require('./src/routes/auth');
const catalogRoutes = require('./src/routes/catalog');
const cartRoutes = require('./src/routes/cart').router;
const wishlistRoutes = require('./src/routes/wishlist');
const checkoutRoutes = require('./src/routes/checkout').router;
const ordersRoutes = require('./src/routes/orders');
const paymentsRoutes = require('./src/routes/payments');
const adminRoutes = require('./src/routes/admin');
const cmsRoutes = require('./src/routes/cms');
const userRoutes = require('./src/routes/user');
const miscRoutes = require('./src/routes/misc');

const app = express();

// Security HTTP Headers with Helmet
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow storefront images & static assets
    contentSecurityPolicy: false // Handled per-page on frontend
}));

// CORS Configuration - Allow any origin and any requested headers dynamically (including x-guest-id)
const corsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // allowedHeaders omitted so it automatically reflects any requested headers (e.g. x-guest-id, authorization)
};
app.use(cors(corsOptions));

// General API Rate Limiting (600 requests per 15 minutes)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { detail: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api', generalLimiter);

// Strict Rate Limiting for Auth Endpoints (Brute-force protection: 30 requests per 15 minutes)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { detail: 'Too many login or OTP attempts from this IP, please try again in 15 minutes.' }
});

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(cookieParser());

const apiRouter = express.Router();

apiRouter.use('/auth', authLimiter, authRoutes);
apiRouter.use('/', catalogRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/wishlist', wishlistRoutes);
apiRouter.use('/checkout', checkoutRoutes);
apiRouter.use('/orders', ordersRoutes);
apiRouter.use('/', paymentsRoutes);
apiRouter.use('/cms', cmsRoutes);
apiRouter.use('/admin/cms', cmsRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/me', userRoutes);
apiRouter.use('/', miscRoutes);

app.use('/api', apiRouter);

const PORT = process.env.PORT || 8000;
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`SOLEKICKS PK API (Node.js) listening on port ${PORT}`);
    });
}

module.exports = app;
