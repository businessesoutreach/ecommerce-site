const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const authRoutes = require('./routes/auth');
const catalogRoutes = require('./routes/catalog');
const cartRoutes = require('./routes/cart').router;
const wishlistRoutes = require('./routes/wishlist');
const checkoutRoutes = require('./routes/checkout').router;
const ordersRoutes = require('./routes/orders');
const paymentsRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const miscRoutes = require('./routes/misc');

const app = express();

app.use(cors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
    credentials: false // matching FastAPI allow_credentials=False but in Node we might need it for cookies? Wait, python had allow_credentials=False, but it uses cookies? That's a contradiction. Python had: allow_credentials=False. Let's match it exactly.
}));

// We need raw body for Stripe webhook before express.json()
app.use('/api/webhook/stripe', express.raw({type: 'application/json'}));

app.use(express.json());
app.use(cookieParser());

const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/', catalogRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/wishlist', wishlistRoutes);
apiRouter.use('/checkout', checkoutRoutes);
apiRouter.use('/orders', ordersRoutes);
apiRouter.use('/', paymentsRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/me', userRoutes);
apiRouter.use('/', miscRoutes);

app.use('/api', apiRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`SOLEKICKS PK API (Node.js) listening on port ${PORT}`);
});
