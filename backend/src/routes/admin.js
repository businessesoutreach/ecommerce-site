const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const stream = require('stream');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../db');
const { getAdmin } = require('../middleware/auth');
const { notify } = require('../utils/notifications');
const courierService = require('../services/courier');
const { requireRole, logAdminAction } = require('../middleware/rbac');
const { sendShippingUpdate } = require('../utils/mailer');
const memoryCache = require('../utils/cache');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(getAdmin);

// Invalidate homepage and catalog cache on any successful admin write operation
router.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        res.on('finish', () => {
            if (res.statusCode < 400) {
                memoryCache.flush();
            }
        });
    }
    next();
});

// RBAC Strict routes
router.use('/analytics', requireRole(['admin']));
router.use('/settings', requireRole(['admin']));
router.use('/users', requireRole(['admin']));
router.use('/audit-logs', requireRole(['admin']));

router.get('/audit-logs', async (req, res) => {
    try {
        const { entity_type, action, search, limit } = req.query;
        let where = {};
        if (entity_type && entity_type !== 'all') {
            where.entity_type = entity_type;
        }
        if (action && action !== 'all') {
            where.action = action;
        }
        if (search) {
            where.OR = [
                { admin_name: { contains: search, mode: 'insensitive' } },
                { action: { contains: search, mode: 'insensitive' } },
                { entity_id: { contains: search, mode: 'insensitive' } }
            ];
        }
        const take = parseInt(limit) || 200;
        const logs = await prisma.adminActionLog.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take
        });
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// Global Omnisearch across products, orders, and customers
router.get('/omnisearch', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q || q.length < 2) {
            return res.json({ success: true, data: { products: [], orders: [], customers: [] } });
        }

        const [products, orders, customers] = await Promise.all([
            prisma.product.findMany({
                where: {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { slug: { contains: q, mode: 'insensitive' } },
                        { category_slug: { contains: q, mode: 'insensitive' } },
                        { brand_slug: { contains: q, mode: 'insensitive' } },
                    ]
                },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    base_price: true,
                    images: true,
                    category_slug: true,
                    brand_slug: true,
                    status: true,
                }
            }),
            prisma.order.findMany({
                where: {
                    OR: [
                        { order_number: { contains: q, mode: 'insensitive' } },
                        { customer_name: { contains: q, mode: 'insensitive' } },
                        { customer_phone: { contains: q, mode: 'insensitive' } },
                        { customer_email: { contains: q, mode: 'insensitive' } },
                    ]
                },
                take: 5,
                select: {
                    id: true,
                    order_number: true,
                    customer_name: true,
                    customer_email: true,
                    total: true,
                    status: true,
                    created_at: true,
                }
            }),
            prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { email: { contains: q, mode: 'insensitive' } },
                        { phone: { contains: q, mode: 'insensitive' } },
                    ]
                },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    picture: true,
                    is_blocked: true,
                }
            })
        ]);

        res.json({
            success: true,
            data: {
                products,
                orders,
                customers
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, detail: err.message });
    }
});

router.post('/pos/checkout', async (req, res) => {
    try {
        const { items, customer, payment_method, total } = req.body;
        if (!items || items.length === 0) return res.status(400).json({ detail: 'Cart empty' });

        const order_number = "POS-" + uuidv4().substring(0, 8).toUpperCase();
        
        const order = await prisma.$transaction(async (tx) => {
            for (const it of items) {
                await tx.productSize.updateMany({
                    where: { product_id: it.product_id, size: it.size, stock: { gte: it.quantity } },
                    data: { stock: { decrement: it.quantity } }
                });
            }
            
            return await tx.order.create({
                data: {
                    id: uuidv4(),
                    order_number,
                    customer_name: customer.name || 'Walk-in Customer',
                    customer_phone: customer.phone || 'N/A',
                    customer_email: customer.email || null,
                    subtotal: total,
                    shipping_fee: 0,
                    total: total,
                    payment_method: payment_method,
                    payment_status: 'paid',
                    status: 'delivered',
                    source: 'POS',
                    items: {
                        create: items.map(oi => ({
                            id: uuidv4(),
                            product_id: oi.product_id,
                            product_name: oi.name,
                            variant_label: `Size ${oi.size}`,
                            size: oi.size,
                            image_url: '',
                            unit_price: oi.price,
                            quantity: oi.quantity
                        }))
                    },
                    status_history: {
                        create: [{ id: uuidv4(), status: 'delivered', note: 'POS Checkout' }]
                    }
                }
            });
        });

        await logAdminAction(req.user, 'pos_checkout', 'order', order.id, { total, items: items.length });
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ detail: err.message || 'POS Checkout failed' });
    }
});

router.get('/analytics/profitability', async (req, res) => {
    try {
        const { range = '30d', startDate, endDate } = req.query;
        const now = new Date();
        let periodStart, periodEnd = now;
        let prevPeriodStart = null, prevPeriodEnd = null;

        if (range === 'today') {
            periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const elapsed = now.getTime() - periodStart.getTime();
            prevPeriodStart = new Date(periodStart.getTime() - 24 * 60 * 60 * 1000);
            prevPeriodEnd = new Date(prevPeriodStart.getTime() + elapsed);
        } else if (range === 'yesterday') {
            periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
            periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
            prevPeriodStart = new Date(periodStart.getTime() - 24 * 60 * 60 * 1000);
            prevPeriodEnd = new Date(periodEnd.getTime() - 24 * 60 * 60 * 1000);
        } else if (range === '7d') {
            periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            prevPeriodStart = new Date(periodStart.getTime() - 7 * 24 * 60 * 60 * 1000);
            prevPeriodEnd = periodStart;
        } else if (range === '30d') {
            periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            prevPeriodStart = new Date(periodStart.getTime() - 30 * 24 * 60 * 60 * 1000);
            prevPeriodEnd = periodStart;
        } else if (range === '90d') {
            periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            prevPeriodStart = new Date(periodStart.getTime() - 90 * 24 * 60 * 60 * 1000);
            prevPeriodEnd = periodStart;
        } else if (range === 'mtd') {
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            const elapsed = now.getTime() - periodStart.getTime();
            prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
            prevPeriodEnd = new Date(prevPeriodStart.getTime() + elapsed);
        } else if (range === 'ytd') {
            periodStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
            const elapsed = now.getTime() - periodStart.getTime();
            prevPeriodStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
            prevPeriodEnd = new Date(prevPeriodStart.getTime() + elapsed);
        } else if (range === 'all') {
            periodStart = new Date(0);
            prevPeriodStart = null;
            prevPeriodEnd = null;
        } else if (range === 'custom' && startDate) {
            periodStart = new Date(startDate);
            periodEnd = endDate ? new Date(endDate) : now;
            const elapsed = periodEnd.getTime() - periodStart.getTime();
            prevPeriodStart = new Date(periodStart.getTime() - elapsed);
            prevPeriodEnd = periodStart;
        } else {
            periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            prevPeriodStart = new Date(periodStart.getTime() - 30 * 24 * 60 * 60 * 1000);
            prevPeriodEnd = periodStart;
        }

        const [currentOrders, previousOrders, categories, brands] = await Promise.all([
            prisma.order.findMany({
                where: { created_at: { gte: periodStart, lte: periodEnd } },
                include: { items: { include: { product: true } } },
                orderBy: { created_at: 'asc' }
            }),
            prevPeriodStart ? prisma.order.findMany({
                where: { created_at: { gte: prevPeriodStart, lte: prevPeriodEnd } },
                include: { items: { include: { product: true } } }
            }) : Promise.resolve([]),
            prisma.category.findMany(),
            prisma.brand.findMany()
        ]);

        const catMap = Object.fromEntries(categories.map(c => [c.slug, c.name]));
        const brandMap = Object.fromEntries(brands.map(b => [b.slug, b.name]));

        const validOrders = currentOrders.filter(o => o.status !== 'cancelled' && o.status !== 'failed');
        const validPrevOrders = previousOrders.filter(o => o.status !== 'cancelled' && o.status !== 'failed');

        const grossRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const prevGrossRevenue = validPrevOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        let cogs = 0;
        let totalUnitsSold = 0;
        validOrders.forEach(o => {
            o.items?.forEach(it => {
                totalUnitsSold += (it.quantity || 1);
                cogs += ((it.product?.cost_price || 0) * (it.quantity || 1));
            });
        });

        let prevCogs = 0;
        let prevUnitsSold = 0;
        validPrevOrders.forEach(o => {
            o.items?.forEach(it => {
                prevUnitsSold += (it.quantity || 1);
                prevCogs += ((it.product?.cost_price || 0) * (it.quantity || 1));
            });
        });

        const shippingRevenue = validOrders.reduce((sum, o) => sum + (o.shipping_fee || 0), 0);
        const shippingCosts = Math.round(shippingRevenue * 0.8);
        const discounts = validOrders.reduce((sum, o) => sum + (o.discount_amount || 0) + (o.store_credit_used || 0), 0);

        const prevShippingRevenue = validPrevOrders.reduce((sum, o) => sum + (o.shipping_fee || 0), 0);
        const prevShippingCosts = Math.round(prevShippingRevenue * 0.8);

        const netProfit = grossRevenue - cogs - shippingCosts;
        const prevNetProfit = prevGrossRevenue - prevCogs - prevShippingCosts;

        const netMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
        const prevNetMargin = prevGrossRevenue > 0 ? (prevNetProfit / prevGrossRevenue) * 100 : 0;

        const aov = validOrders.length > 0 ? grossRevenue / validOrders.length : 0;
        const prevAov = validPrevOrders.length > 0 ? prevGrossRevenue / validPrevOrders.length : 0;

        const calcTrend = (curr, prev) => {
            if (!prev || prev === 0) return curr > 0 ? 100 : 0;
            return Number((((curr - prev) / prev) * 100).toFixed(1));
        };

        const paymentBreakdown = {
            COD: { count: 0, revenue: 0, collected: 0, pending: 0 },
            BANK_TRANSFER: { count: 0, revenue: 0, collected: 0, pending: 0 },
            CARD: { count: 0, revenue: 0, collected: 0, pending: 0 },
        };

        validOrders.forEach(o => {
            const method = (o.payment_method || 'COD').toUpperCase();
            const target = paymentBreakdown[method] || paymentBreakdown.COD;
            target.count += 1;
            target.revenue += o.total;
            if (o.payment_status === 'paid' || o.cod_remittance_status === 'remitted') {
                target.collected += o.total;
            } else {
                target.pending += o.total;
            }
        });

        const orderStatusMap = {};
        currentOrders.forEach(o => {
            orderStatusMap[o.status] = (orderStatusMap[o.status] || 0) + 1;
        });

        const isHourly = range === 'today' || range === 'yesterday';
        const isMonthly = range === 'ytd' || range === 'all';
        const trendBuckets = {};

        validOrders.forEach(o => {
            const d = new Date(o.created_at);
            let key;
            if (isHourly) {
                key = `${d.getHours()}:00`;
            } else if (isMonthly) {
                key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            } else {
                key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            if (!trendBuckets[key]) {
                trendBuckets[key] = { date: key, label: key, revenue: 0, profit: 0, cogs: 0, orders: 0 };
            }

            let orderCogs = 0;
            o.items?.forEach(it => {
                orderCogs += ((it.product?.cost_price || 0) * (it.quantity || 1));
            });
            const orderShippingCost = (o.shipping_fee || 0) * 0.8;
            const orderProfit = o.total - orderCogs - orderShippingCost;

            trendBuckets[key].revenue += Math.round(o.total);
            trendBuckets[key].profit += Math.round(orderProfit);
            trendBuckets[key].cogs += Math.round(orderCogs);
            trendBuckets[key].orders += 1;
        });

        const timelineTrend = Object.values(trendBuckets);

        const categoryStats = {};
        const brandStats = {};
        const productPerformance = {};

        validOrders.forEach(o => {
            o.items?.forEach(it => {
                const p = it.product;
                const catSlug = p?.category_slug || 'other';
                const catName = catMap[catSlug] || catSlug;
                const brandSlug = p?.brand_slug || 'airvault';
                const brandName = brandMap[brandSlug] || brandSlug;
                const lineRev = (it.price || it.unit_price || 0) * (it.quantity || 1);
                const lineCost = (p?.cost_price || 0) * (it.quantity || 1);
                const lineProfit = lineRev - lineCost;

                if (!categoryStats[catSlug]) categoryStats[catSlug] = { name: catName, slug: catSlug, revenue: 0, units: 0, profit: 0 };
                categoryStats[catSlug].revenue += lineRev;
                categoryStats[catSlug].units += (it.quantity || 1);
                categoryStats[catSlug].profit += lineProfit;

                if (!brandStats[brandSlug]) brandStats[brandSlug] = { name: brandName, slug: brandSlug, revenue: 0, units: 0, profit: 0 };
                brandStats[brandSlug].revenue += lineRev;
                brandStats[brandSlug].units += (it.quantity || 1);
                brandStats[brandSlug].profit += lineProfit;

                const pid = it.product_id || p?.id || it.product_name;
                if (!productPerformance[pid]) {
                    productPerformance[pid] = {
                        id: pid,
                        name: p?.name || it.product_name || 'Sneaker Drop',
                        slug: p?.slug || '',
                        image: p?.images?.[0] || '',
                        category: catName,
                        brand: brandName,
                        units_sold: 0,
                        revenue: 0,
                        cost: 0,
                        profit: 0,
                        margin: 0,
                        stock: p?.sizes?.reduce((acc, s) => acc + s.stock, 0) || 0
                    };
                }
                productPerformance[pid].units_sold += (it.quantity || 1);
                productPerformance[pid].revenue += lineRev;
                productPerformance[pid].cost += lineCost;
                productPerformance[pid].profit += lineProfit;
            });
        });

        const categoryList = Object.values(categoryStats).map(c => ({
            ...c,
            margin: c.revenue > 0 ? Number(((c.profit / c.revenue) * 100).toFixed(1)) : 0
        })).sort((a, b) => b.revenue - a.revenue);

        const brandList = Object.values(brandStats).map(b => ({
            ...b,
            margin: b.revenue > 0 ? Number(((b.profit / b.revenue) * 100).toFixed(1)) : 0
        })).sort((a, b) => b.revenue - a.revenue);

        const topProducts = Object.values(productPerformance).map(p => ({
            ...p,
            margin: p.revenue > 0 ? Number(((p.profit / p.revenue) * 100).toFixed(1)) : 0
        })).sort((a, b) => b.revenue - a.revenue).slice(0, 15);

        const cityMap = {};
        const provinceMap = {};
        validOrders.forEach(o => {
            let addr = o.shipping_address;
            if (typeof addr === 'string') {
                try { addr = JSON.parse(addr); } catch { addr = {}; }
            }
            const city = addr?.city?.trim() || 'Karachi';
            const province = addr?.province?.trim() || 'Sindh';

            cityMap[city] = (cityMap[city] || 0) + o.total;
            provinceMap[province] = (provinceMap[province] || 0) + o.total;
        });

        const cityDistribution = Object.entries(cityMap)
            .map(([city, revenue]) => ({ city, revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8);

        const provinceDistribution = Object.entries(provinceMap)
            .map(([province, revenue]) => ({ province, revenue }))
            .sort((a, b) => b.revenue - a.revenue);

        const customerPhones = validOrders.map(o => o.customer_phone).filter(Boolean);
        const uniqueCustomers = new Set(customerPhones).size;
        const phoneCounts = {};
        customerPhones.forEach(p => { phoneCounts[p] = (phoneCounts[p] || 0) + 1; });
        const repeatCustomersCount = Object.values(phoneCounts).filter(c => c > 1).length;
        const repeatPurchaseRate = uniqueCustomers > 0 ? Number(((repeatCustomersCount / uniqueCustomers) * 100).toFixed(1)) : 0;

        res.json({
            success: true,
            data: {
                revenue: grossRevenue,
                cogs,
                shipping_costs: shippingCosts,
                net_profit: netProfit,
                trend: timelineTrend,
                range,
                period: {
                    start: periodStart.toISOString(),
                    end: periodEnd.toISOString(),
                    prev_start: prevPeriodStart ? prevPeriodStart.toISOString() : null,
                    prev_end: prevPeriodEnd ? prevPeriodEnd.toISOString() : null
                },
                kpis: {
                    gross_revenue: { value: grossRevenue, trend: calcTrend(grossRevenue, prevGrossRevenue) },
                    net_profit: { value: netProfit, trend: calcTrend(netProfit, prevNetProfit) },
                    net_margin: { value: Number(netMargin.toFixed(1)), trend: Number((netMargin - prevNetMargin).toFixed(1)) },
                    cogs: { value: cogs, trend: calcTrend(cogs, prevCogs) },
                    orders_count: { value: validOrders.length, trend: calcTrend(validOrders.length, validPrevOrders.length) },
                    total_orders_placed: { value: currentOrders.length },
                    units_sold: { value: totalUnitsSold, trend: calcTrend(totalUnitsSold, prevUnitsSold) },
                    aov: { value: Math.round(aov), trend: calcTrend(aov, prevAov) },
                    discounts_given: { value: discounts },
                    shipping_revenue: { value: shippingRevenue },
                    shipping_costs: { value: shippingCosts },
                    unique_customers: { value: uniqueCustomers },
                    repeat_rate: { value: repeatPurchaseRate }
                },
                payment_breakdown: paymentBreakdown,
                order_status: orderStatusMap,
                timeline_trend: timelineTrend,
                category_performance: categoryList,
                brand_performance: brandList,
                top_products: topProducts,
                city_distribution: cityDistribution,
                province_distribution: provinceDistribution
            }
        });
    } catch (err) {
        console.error("Analytics Error:", err);
        res.status(500).json({ detail: err.message });
    }
});

router.get('/analytics/overview', async (req, res) => {
    try {
        const { range = '30d' } = req.query;
        const now = new Date();
        const days = range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30;
        
        const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const prevPeriodStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

        // Fetch all orders
        const allOrders = await prisma.order.findMany({ include: { items: { include: { product: true } } } });
        const validOrders = allOrders.filter(o => o.status !== 'cancelled' && o.status !== 'failed');
        
        // KPIs (current range vs previous period of same duration)
        const currentOrders = validOrders.filter(o => o.created_at >= periodStart);
        const previousOrders = validOrders.filter(o => o.created_at >= prevPeriodStart && o.created_at < periodStart);

        const isCollected = (o) => o.payment_status === 'paid' || o.cod_remittance_status === 'remitted';
        const currentRev = currentOrders.filter(isCollected).reduce((sum, o) => sum + o.total, 0);
        const prevRev = previousOrders.filter(isCollected).reduce((sum, o) => sum + o.total, 0);
        
        const pendingCodRev = currentOrders.filter(o => o.payment_method === 'COD' && o.cod_remittance_status !== 'remitted' && o.status !== 'cancelled' && o.status !== 'failed').reduce((sum, o) => sum + o.total, 0);
        
        const currentCount = currentOrders.length;
        const prevCount = previousOrders.length;

        const currentAOV = currentCount ? currentRev / currentCount : 0;
        const prevAOV = prevCount ? prevRev / prevCount : 0;

        const allUsers = await prisma.user.findMany();
        const currentUsers = allUsers.filter(u => u.created_at >= periodStart).length;
        const prevUsers = allUsers.filter(u => u.created_at >= prevPeriodStart && u.created_at < periodStart).length;

        const calcTrend = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        const deliveredCount = currentOrders.filter(o => o.status === 'delivered').length;
        const pendingCount = currentOrders.filter(o => o.status === 'placed').length;
        const confirmedCount = currentOrders.filter(o => o.status === 'confirmed').length;

        const kpis = {
            revenue: { value: currentRev, trend: calcTrend(currentRev, prevRev) },
            pending_cod: { value: pendingCodRev, trend: 0 },
            orders: { value: currentCount, trend: calcTrend(currentCount, prevCount) },
            total_orders: { value: allOrders.length, trend: 0 },
            delivered_orders: { value: deliveredCount, trend: 0 },
            pending_orders: { value: pendingCount, trend: 0 },
            confirmed_orders: { value: confirmedCount, trend: 0 },
            customers: { value: allUsers.length, trend: calcTrend(currentUsers, prevUsers) },
            aov: { value: currentAOV, trend: calcTrend(currentAOV, prevAOV) }
        };

        // Chart Data (aggregated by day)
        const dailyMap = {};
        for(let i = days - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            dailyMap[d.toISOString().split('T')[0]] = { revenue: 0, orders: 0 };
        }
        for (const o of currentOrders) {
            const d = o.created_at.toISOString().split('T')[0];
            if (dailyMap[d]) {
                if (isCollected(o)) dailyMap[d].revenue += o.total;
                dailyMap[d].orders += 1;
            }
        }
        const sales_chart = Object.keys(dailyMap).sort().map(date => ({
            date,
            revenue: Math.round(dailyMap[date].revenue),
            orders: dailyMap[date].orders
        }));

        // Top Selling Products & Sales by Category
        const productStats = {};
        let catStats = {};
        for (const o of currentOrders) {
            for (const item of o.items) {
                if (!productStats[item.product_id]) {
                    productStats[item.product_id] = { 
                        id: item.product_id,
                        sold: 0, 
                        rev: 0, 
                        name: item.product?.name || 'Unknown',
                        image: item.product?.images?.[0] || item.product?.hover_image || '',
                        category: item.product?.category_slug || 'Sneakers',
                        price: item.product?.base_price || item.unit_price || 0
                    };
                }
                productStats[item.product_id].sold += item.quantity;
                productStats[item.product_id].rev += (item.unit_price * item.quantity);

                // Category sales include all valid orders
                const cat = item.product?.category_slug || 'uncategorized';
                catStats[cat] = (catStats[cat] || 0) + (item.unit_price * item.quantity);
            }
        }

        const top_products = Object.values(productStats).sort((a,b) => b.sold - a.sold).slice(0, 5);
        const sales_by_category = Object.keys(catStats).map(c => ({ name: c, value: catStats[c] })).sort((a,b) => b.value - a.value);

        // Recent Orders
        const recent_orders = allOrders.sort((a,b) => b.created_at - a.created_at).slice(0, 8).map(o => ({
            id: o.id,
            order_number: o.order_number,
            customer_name: o.customer_name,
            customer_email: o.customer_email,
            payment_method: o.payment_method,
            payment_status: o.payment_status,
            total: o.total,
            status: o.status,
            items_count: o.items?.length || 0,
            created_at: o.created_at
        }));

        // Customer Overview
        const returningCustomersCount = allOrders.reduce((acc, o) => {
            if (o.user_id) acc.add(o.user_id);
            return acc;
        }, new Set()).size;
        
        const customer_overview = {
            total: allUsers.length,
            new: currentUsers,
            returning: returningCustomersCount
        };

        // Needs Attention
        const pending_orders = allOrders.filter(o => ['placed', 'confirmed'].includes(o.status)).length;
        const failed_payments = allOrders.filter(o => o.status === 'failed').length;
        
        const allProducts = await prisma.product.findMany({ include: { sizes: true } });
        const low_stock = allProducts.filter(p => p.sizes.some(s => s.stock < 5)).length;

        // Inventory by Category
        const inventoryMap = {};
        allProducts.forEach(p => {
            inventoryMap[p.category_slug] = (inventoryMap[p.category_slug] || 0) + 1;
        });
        const inventory_by_category = Object.keys(inventoryMap).map(c => ({ name: c, count: inventoryMap[c] }));

        const reviews = await prisma.review.count({ where: { status: 'pending' } });
        const refunds = await prisma.returnRequest.count({ where: { status: 'pending' } }).catch(() => 0);

        const needs_attention = {
            pending_orders,
            failed_payments,
            low_stock,
            pending_reviews: reviews,
            refund_requests: refunds
        };

        res.json({
            success: true,
            data: { kpis, sales_chart, top_products, sales_by_category, recent_orders, customer_overview, needs_attention, inventory_by_category }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ detail: err.message });
    }
});

router.get('/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const skip = (page - 1) * limit;

        const { category, brand, stock, status, price, search } = req.query;
        let where = {};

        if (status && status !== 'all') {
            where.status = status;
        }
        if (category && category !== 'all') {
            where.category_slug = category;
        }
        if (brand && brand !== 'all') {
            where.brand_slug = brand;
        }
        
        if (price && price !== 'all') {
            if (price === 'under_50') where.base_price = { lt: 50 };
            else if (price === '50_100') where.base_price = { gte: 50, lte: 100 };
            else if (price === '100_500') where.base_price = { gte: 100, lte: 500 };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Handle stock filtering requires looking at sizes or calculating total stock
        // For simplicity, we filter in JS for stock if we need to, but Prisma can filter on relations
        if (stock && stock !== 'all') {
            if (stock === 'in_stock') {
                where.sizes = { some: { stock: { gt: 5 } } };
            } else if (stock === 'low_stock') {
                where.sizes = { some: { stock: { gt: 0, lte: 5 } } };
            } else if (stock === 'out_of_stock') {
                where.sizes = { every: { stock: 0 } };
            }
        }

        const [items, totalCount, allProducts] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: { sizes: true }
            }),
            prisma.product.count({ where }),
            prisma.product.findMany({ include: { sizes: true } })
        ]);

        let active = 0, draft = 0, archived = 0, low_stock = 0, out_of_stock = 0;
        for (const p of allProducts) {
            if (p.status === 'active') active++;
            else if (p.status === 'draft') draft++;
            else if (p.status === 'archived') archived++;
            
            const totalStock = p.sizes.reduce((acc, s) => acc + s.stock, 0);
            if (totalStock === 0) out_of_stock++;
            else if (totalStock <= 5) low_stock++;
        }

        const stats = {
            total: allProducts.length,
            active,
            draft,
            archived,
            low_stock,
            out_of_stock
        };

        res.json({
            success: true,
            data: {
                products: items,
                pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
                stats
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findFirst({
            where: {
                OR: [
                    { id },
                    { slug: id }
                ]
            },
            include: {
                sizes: { orderBy: { size: 'asc' } },
                reviews: { take: 5, orderBy: { created_at: 'desc' } }
            }
        });
        if (!product) {
            return res.status(404).json({ detail: "Product not found" });
        }
        res.json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/products/bulk', async (req, res) => {
    try {
        const { productIds, action, value } = req.body;
        if (!productIds || !Array.isArray(productIds) || !action) {
            return res.status(400).json({ detail: "Missing productIds or action" });
        }
        
        if (action === 'delete') {
            // Because of foreign keys, we delete sizes first
            await prisma.productSize.deleteMany({ where: { product_id: { in: productIds } } });
            await prisma.product.deleteMany({ where: { id: { in: productIds } } });
        } else if (action === 'status') {
            await prisma.product.updateMany({
                where: { id: { in: productIds } },
                data: { status: value }
            });
        } else if (action === 'category') {
            await prisma.product.updateMany({
                where: { id: { in: productIds } },
                data: { category_slug: value }
            });
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/products/:id/duplicate', async (req, res) => {
    try {
        const p = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: { sizes: true }
        });
        if (!p) return res.status(404).json({ detail: "Product not found" });

        const doc = { ...p };
        delete doc.id;
        delete doc.created_at;
        delete doc.updated_at;
        delete doc.sizes;
        
        doc.name = `${doc.name} (Copy)`;
        let base_slug = doc.slug;
        let slug = `${base_slug}-copy`;
        while (await prisma.product.findUnique({ where: { slug } })) {
            slug = `${base_slug}-copy-${uuidv4().substring(0, 4)}`;
        }
        doc.slug = slug;
        doc.status = 'draft'; // Copies are drafts

        const newProduct = await prisma.product.create({
            data: {
                ...doc,
                sizes: {
                    create: p.sizes.map(s => ({
                        id: uuidv4(),
                        size: s.size,
                        stock: s.stock
                    }))
                }
            }
        });

        res.json({ success: true, data: newProduct });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/products', async (req, res) => {
    try {
        const doc = { ...req.body };
        doc.id = uuidv4();
        doc.status = doc.status || 'active';
        doc.images = doc.images || [];
        doc.avg_rating = 5.0;
        doc.review_count = 0;
        doc.sort_order = 999;
        
        const base_slug = doc.slug || (doc.name || 'product').toLowerCase().replace(/\s+/g, '-');
        let slug = base_slug;
        
        while (await prisma.product.findUnique({ where: { slug } })) {
            slug = `${base_slug}-${uuidv4().substring(0, 4)}`;
        }
        doc.slug = slug;
        
        if (!doc.hover_image && doc.images.length > 0) {
            doc.hover_image = doc.images.length > 1 ? doc.images[1] : doc.images[0];
        }
        
        const sizesData = doc.sizes || [
            { size: "39", stock: 5 }, { size: "40", stock: 5 }, { size: "41", stock: 5 },
            { size: "42", stock: 5 }, { size: "43", stock: 5 }, { size: "44", stock: 5 }, { size: "45", stock: 5 }
        ];
        delete doc.sizes;
        
        const p = await prisma.product.create({
            data: {
                ...doc,
                sizes: { create: sizesData.map(s => ({ id: uuidv4(), ...s })) }
            },
            include: { sizes: true }
        });
        await logAdminAction(req.user, 'CREATE_PRODUCT', 'product', p.id, { name: p.name, price: p.base_price, sku: p.sku });
        res.json({ success: true, data: p });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/products/:id', async (req, res) => {
    try {
        const doc = { ...req.body };
        delete doc.id;
        
        let sizesData = null;
        if (doc.sizes) {
            sizesData = doc.sizes;
            delete doc.sizes;
        }
        
        await prisma.product.update({
            where: { id: req.params.id },
            data: doc
        });
        
        if (sizesData) {
            for (const s of sizesData) {
                if (s.id) {
                    await prisma.productSize.update({
                        where: { id: s.id },
                        data: { stock: s.stock }
                    });
                } else {
                    await prisma.productSize.create({
                        data: {
                            id: uuidv4(),
                            product_id: req.params.id,
                            size: s.size,
                            stock: s.stock
                        }
                    });
                }
            }
        }
        
        const p = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: { sizes: true }
        });
        await logAdminAction(req.user, 'UPDATE_PRODUCT', 'product', req.params.id, { name: p?.name, price: p?.base_price });
        res.json({ success: true, data: p });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/products/:id/stock', async (req, res) => {
    try {
        const { sizes } = req.body;
        if (!sizes || !Array.isArray(sizes)) {
            return res.status(400).json({ detail: "Sizes array is required" });
        }

        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: { sizes: true }
        });
        if (!product) return res.status(404).json({ detail: "Product not found" });

        const updatedSizes = [];
        for (const s of sizes) {
            const newStock = Math.max(0, parseInt(s.stock) || 0);
            if (s.id) {
                const updated = await prisma.productSize.update({
                    where: { id: s.id },
                    data: { stock: newStock }
                });
                updatedSizes.push(updated);
            }
        }

        const totalStock = updatedSizes.reduce((sum, item) => sum + item.stock, 0);

        await logAdminAction(req.user, 'UPDATE_STOCK', 'product', product.id, {
            product_name: product.name,
            total_stock: totalStock,
            sizes_updated: updatedSizes.length
        });

        res.json({
            success: true,
            data: {
                ...product,
                sizes: updatedSizes
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.delete('/products/:id', async (req, res) => {
    try {
        await logAdminAction(req.user, 'DELETE_PRODUCT', 'product', req.params.id, {});
        await prisma.product.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/orders', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const skip = (page - 1) * limit;

        const { status, payment, payment_method, cod_status, date, search } = req.query;
        let where = {};

        if (status && status !== 'all') {
            where.status = status;
        }
        if (payment && payment !== 'all') {
            where.payment_status = payment;
        }
        if (payment_method && payment_method !== 'all') {
            where.payment_method = payment_method;
        }
        if (cod_status && cod_status !== 'all') {
            where.payment_method = 'COD';
            where.cod_remittance_status = cod_status;
        }

        if (date && date !== 'all') {
            const now = new Date();
            if (date === 'today') {
                where.created_at = { gte: new Date(now.setHours(0,0,0,0)) };
            } else if (date === 'yesterday') {
                const start = new Date(now);
                start.setDate(start.getDate() - 1);
                start.setHours(0,0,0,0);
                const end = new Date(now);
                end.setDate(end.getDate() - 1);
                end.setHours(23,59,59,999);
                where.created_at = { gte: start, lte: end };
            } else if (date === '7d') {
                const start = new Date(now);
                start.setDate(start.getDate() - 7);
                where.created_at = { gte: start };
            } else if (date === '30d') {
                const start = new Date(now);
                start.setDate(start.getDate() - 30);
                where.created_at = { gte: start };
            }
        }

        if (search) {
            const cleanSearch = search.trim();
            where.OR = [
                { order_number: { contains: cleanSearch, mode: 'insensitive' } },
                { customer_name: { contains: cleanSearch, mode: 'insensitive' } },
                { customer_phone: { contains: cleanSearch, mode: 'insensitive' } },
                { customer_email: { contains: cleanSearch, mode: 'insensitive' } },
                { tracking_number: { contains: cleanSearch, mode: 'insensitive' } }
            ];
        }

        const [items, totalCount, allOrders] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: { items: { include: { product: true } }, status_history: true }
            }),
            prisma.order.count({ where }),
            prisma.order.findMany({ select: { status: true, payment_method: true, cod_remittance_status: true, total: true } }) // to calculate top status tabs counts efficiently
        ]);

        let codPendingCount = 0;
        let codPendingTotal = 0;
        let codRemittedCount = 0;
        let codRemittedTotal = 0;
        let totalCodOrders = 0;
        let totalCodAmount = 0;

        for (const o of allOrders) {
            if (o.payment_method === 'COD') {
                totalCodOrders++;
                totalCodAmount += (o.total || 0);
                if (o.cod_remittance_status === 'remitted') {
                    codRemittedCount++;
                    codRemittedTotal += (o.total || 0);
                } else {
                    codPendingCount++;
                    codPendingTotal += (o.total || 0);
                }
            }
        }

        const cod_summary = {
            total_count: totalCodOrders,
            total_amount: totalCodAmount,
            pending_count: codPendingCount,
            pending_amount: codPendingTotal,
            remitted_count: codRemittedCount,
            remitted_amount: codRemittedTotal,
        };

        const status_counts = {
            all: allOrders.length,
            placed: allOrders.filter(o => o.status === 'placed').length,
            confirmed: allOrders.filter(o => o.status === 'confirmed').length,
            packed: allOrders.filter(o => o.status === 'packed').length,
            shipped: allOrders.filter(o => o.status === 'shipped').length,
            out_for_delivery: allOrders.filter(o => o.status === 'out_for_delivery').length,
            delivered: allOrders.filter(o => o.status === 'delivered').length,
            cancelled: allOrders.filter(o => o.status === 'cancelled').length,
            returned: allOrders.filter(o => o.status === 'returned').length,
            pending: allOrders.filter(o => ['placed', 'confirmed', 'pending'].includes(o.status)).length,
            processing: allOrders.filter(o => ['processing', 'packed'].includes(o.status)).length,
            refunded: allOrders.filter(o => ['refunded', 'returned'].includes(o.status)).length,
            cod_pending: codPendingCount,
            cod_remitted: codRemittedCount,
        };

        res.json({
            success: true,
            data: {
                orders: items,
                pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
                status_counts,
                cod_summary,
                courier_configured: courierService.isConfigured()
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    { id: id },
                    { order_number: id }
                ]
            },
            include: {
                items: {
                    include: { product: true }
                },
                status_history: {
                    orderBy: { at: 'desc' }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ detail: 'Order not found' });
        }

        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/orders', async (req, res) => {
    try {
        const {
            customer_name,
            customer_phone,
            customer_email,
            shipping_address,
            items,
            payment_method = 'COD',
            shipping_fee = 0,
            discount_amount = 0,
            customer_note
        } = req.body;

        if (!customer_name || !customer_name.trim()) {
            return res.status(400).json({ detail: 'Customer name is required' });
        }
        if (!customer_phone || !customer_phone.trim()) {
            return res.status(400).json({ detail: 'Customer phone number is required' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ detail: 'At least one product item is required' });
        }

        let subtotal = 0;
        const orderItemsData = [];

        for (const it of items) {
            const prod = await prisma.product.findUnique({
                where: { id: it.product_id },
                include: { sizes: true }
            });
            if (!prod) {
                return res.status(400).json({ detail: `Product not found: ${it.product_id}` });
            }

            const sizeObj = prod.sizes.find(s => s.size === String(it.size));
            if (!sizeObj) {
                return res.status(400).json({ detail: `Size ${it.size} does not exist for ${prod.name}` });
            }
            if (sizeObj.stock < (it.quantity || 1)) {
                return res.status(400).json({ detail: `Insufficient stock for ${prod.name} (Size ${it.size}). Available: ${sizeObj.stock}` });
            }

            const unitPrice = prod.is_flash_sale && prod.flash_sale_price ? prod.flash_sale_price : prod.base_price;
            const qty = Math.max(1, parseInt(it.quantity) || 1);
            subtotal += unitPrice * qty;

            orderItemsData.push({
                product_id: prod.id,
                product_name: prod.name,
                variant_label: `Size ${it.size}`,
                size: String(it.size),
                image_url: prod.images?.[0] || prod.hover_image || '',
                unit_price: unitPrice,
                quantity: qty
            });
        }

        const fee = Number(shipping_fee) || 0;
        const discount = Number(discount_amount) || 0;
        const total = Math.max(0, subtotal + fee - discount);

        let orderNumber = `PK-SNK-${Math.floor(10000 + Math.random() * 90000)}`;
        while (await prisma.order.findUnique({ where: { order_number: orderNumber } })) {
            orderNumber = `PK-SNK-${Math.floor(10000 + Math.random() * 90000)}`;
        }

        const formattedAddress = typeof shipping_address === 'object' && shipping_address !== null
            ? shipping_address
            : { address_l1: String(shipping_address || 'Walk-in / Direct Order'), city: 'Karachi', province: 'Sindh', country_code: 'PK' };

        const newOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    id: uuidv4(),
                    order_number: orderNumber,
                    customer_name: customer_name.trim(),
                    customer_phone: customer_phone.trim(),
                    customer_email: customer_email ? customer_email.trim() : null,
                    shipping_address: formattedAddress,
                    subtotal,
                    shipping_fee: fee,
                    discount_amount: discount,
                    total,
                    payment_method: payment_method || 'COD',
                    payment_status: payment_method === 'COD' ? 'pending' : 'paid',
                    status: 'placed',
                    customer_note: customer_note ? customer_note.trim() : 'Manual order created by admin',
                    items: {
                        create: orderItemsData.map(it => ({
                            id: uuidv4(),
                            ...it
                        }))
                    },
                    status_history: {
                        create: {
                            id: uuidv4(),
                            status: 'placed',
                            note: 'Manual order created by admin via Admin Portal'
                        }
                    }
                },
                include: {
                    items: { include: { product: true } },
                    status_history: true
                }
            });

            for (const it of orderItemsData) {
                await tx.productSize.updateMany({
                    where: { product_id: it.product_id, size: it.size },
                    data: { stock: { decrement: it.quantity } }
                });
            }

            return order;
        });

        memoryCache.flush();

        res.json({ success: true, data: newOrder });
    } catch (err) {
        console.error('ADMIN CREATE ORDER ERROR:', err);
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/orders/bulk-status', async (req, res) => {
    try {
        const { orderIds, status } = req.body;
        if (!orderIds || !Array.isArray(orderIds) || !status) {
            return res.status(400).json({ detail: "Missing orderIds or status" });
        }
        
        const updateData = { status };
        if (['confirmed', 'delivered'].includes(status)) {
            updateData.cod_remittance_status = 'remitted';
        }

        await prisma.order.updateMany({
            where: { id: { in: orderIds } },
            data: updateData
        });

        // Add history for all
        const histories = orderIds.map(id => ({
            id: uuidv4(),
            order_id: id,
            status,
            note: 'Bulk status update'
        }));
        await prisma.orderStatusHistory.createMany({ data: histories });
        await logAdminAction(req.user, 'BULK_UPDATE_ORDER_STATUS', 'order', (orderIds || []).join(','), { count: orderIds?.length, status });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/orders/:id/note', async (req, res) => {
    try {
        const { note } = req.body;
        const o = await prisma.order.update({
            where: { id: req.params.id },
            data: { customer_note: note } // using customer_note for internal notes as requested or if there's no internal note field
        });
        await logAdminAction(req.user, 'UPDATE_ORDER_NOTE', 'order', req.params.id, { note, order_number: o.order_number });
        res.json({ success: true, data: o });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/orders/:id/status', async (req, res) => {
    try {
        const { status, tracking_number, courier_name, note } = req.body;
        
        const updateData = { status };
        if (['confirmed', 'delivered'].includes(status)) {
            updateData.cod_remittance_status = 'remitted';
        }
        if (tracking_number) updateData.tracking_number = tracking_number;
        if (courier_name) updateData.courier_name = courier_name;
        
        const o = await prisma.order.update({
            where: { id: req.params.id },
            data: {
                ...updateData,
                status_history: {
                    create: { id: uuidv4(), status, note: note || '' }
                }
            },
            include: { items: true, status_history: true }
        });
        
        const labels = {
            confirmed: "verified ✅", packed: "packed 📦", shipped: "dispatched 🚚",
            out_for_delivery: "out for delivery 🛵", delivered: "delivered 🎉", cancelled: "cancelled"
        };
        
        if (labels[status]) {
            const extra = (status === 'shipped' && o.tracking_number) ? ` Tracking: ${o.courier_name || ''} ${o.tracking_number}`.trimEnd() : '';
            await notify(o, "STATUS_UPDATE", `Order ${o.order_number} is now ${labels[status]}.${extra}`);
        }
        
        if (status === 'shipped' && o.customer_email) {
            const origin_url = process.env.FRONTEND_URL || 'http://localhost:5173';
            sendShippingUpdate(o.customer_email, o, origin_url).catch(e => console.error(e));
        }

        await logAdminAction(req.user, 'UPDATE_ORDER_STATUS', 'order', req.params.id, {
            status,
            order_number: o.order_number,
            courier_name: o.courier_name,
            tracking_number: o.tracking_number,
            note: note || undefined
        });
        
        res.json({ success: true, data: o });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/orders/:id/cod-remittance', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['pending', 'remitted'].includes(status)) {
            return res.status(400).json({ detail: "Status must be 'pending' or 'remitted'" });
        }
        const o = await prisma.order.update({
            where: { id: req.params.id },
            data: { cod_remittance_status: status }
        });
        await logAdminAction(req.user, 'UPDATE_COD_REMITTANCE', 'order', req.params.id, {
            status,
            order_number: o.order_number
        });
        res.json({ success: true, data: o });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/notifications', async (req, res) => {
    try {
        const items = await prisma.notification.findMany({ orderBy: { created_at: 'desc' } });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const [items, productCounts] = await Promise.all([
            prisma.category.findMany({
                orderBy: { sort_order: 'asc' },
                include: { parent: true, children: true }
            }),
            prisma.product.groupBy({
                by: ['category_slug'],
                _count: { id: true }
            })
        ]);
        const countMap = Object.fromEntries(productCounts.map(c => [c.category_slug, c._count.id]));
        const enriched = items.map(c => ({
            ...c,
            product_count: countMap[c.slug] || 0
        }));
        res.json({ success: true, data: enriched });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findFirst({
            where: {
                OR: [
                    { id },
                    { slug: id }
                ]
            },
            include: {
                parent: true,
                children: true
            }
        });
        if (!category) return res.status(404).json({ detail: "Category not found" });

        const products = await prisma.product.findMany({
            where: { category_slug: category.slug },
            orderBy: { created_at: 'desc' },
            include: { sizes: true }
        });

        const totalStock = products.reduce((acc, p) => acc + (p.sizes?.reduce((sAcc, s) => sAcc + s.stock, 0) || 0), 0);
        const prices = products.map(p => p.base_price).filter(p => typeof p === 'number' && p > 0);
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const maxPrice = prices.length ? Math.max(...prices) : 0;

        res.json({
            success: true,
            data: {
                ...category,
                products,
                stats: {
                    product_count: products.length,
                    total_stock: totalStock,
                    min_price: minPrice,
                    max_price: maxPrice
                }
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/categories', async (req, res) => {
    try {
        const doc = { ...req.body, id: uuidv4() };
        doc.slug = doc.slug || (doc.name || 'cat').toLowerCase().replace(/\s+/g, '-');
        const c = await prisma.category.create({ data: doc });
        res.json({ success: true, data: c });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/categories/:id', async (req, res) => {
    try {
        const doc = { ...req.body };
        delete doc.id;
        const c = await prisma.category.update({ where: { id: req.params.id }, data: doc });
        res.json({ success: true, data: c });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        await prisma.category.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ===================== BRANDS =====================
router.get('/brands', async (req, res) => {
    try {
        const items = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/brands', async (req, res) => {
    try {
        const doc = { ...req.body, id: uuidv4() };
        doc.slug = doc.slug || (doc.name || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let slug = doc.slug;
        let suffix = 1;
        while (await prisma.brand.findUnique({ where: { slug } })) {
            slug = `${doc.slug}-${suffix++}`;
        }
        doc.slug = slug;
        const b = await prisma.brand.create({ data: doc });
        res.json({ success: true, data: b });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/brands/:id', async (req, res) => {
    try {
        const doc = { ...req.body };
        delete doc.id;
        const b = await prisma.brand.update({ where: { id: req.params.id }, data: doc });
        res.json({ success: true, data: b });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.delete('/brands/:id', async (req, res) => {
    try {
        await prisma.brand.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});


// ===================== PRODUCT BUNDLES =====================
router.get('/bundles', async (req, res) => {
    try {
        const bundles = await prisma.productBundle.findMany({
            orderBy: { created_at: 'desc' },
            include: { items: { include: { product: { select: { id: true, name: true, base_price: true, images: true } } } } }
        });
        res.json({ success: true, data: bundles });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

router.post('/bundles', async (req, res) => {
    try {
        const { name, description, image_url, bundle_price, is_active, items } = req.body;
        if (!name || !bundle_price) return res.status(400).json({ detail: 'Name and price required' });
        const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + uuidv4().substring(0, 4);
        const bundle = await prisma.productBundle.create({
            data: {
                id: uuidv4(), name, slug, description, image_url,
                bundle_price: parseFloat(bundle_price),
                is_active: is_active ?? true,
                items: {
                    create: (items || []).map(it => ({ id: uuidv4(), product_id: it.product_id, quantity: it.quantity || 1 }))
                }
            },
            include: { items: { include: { product: true } } }
        });
        await logAdminAction(req.user, 'create_bundle', 'bundle', bundle.id, { name });
        res.json({ success: true, data: bundle });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

router.patch('/bundles/:id', async (req, res) => {
    try {
        const { name, description, image_url, bundle_price, is_active, items } = req.body;
        await prisma.bundleItem.deleteMany({ where: { bundle_id: req.params.id } });
        const bundle = await prisma.productBundle.update({
            where: { id: req.params.id },
            data: {
                name, description, image_url,
                bundle_price: bundle_price ? parseFloat(bundle_price) : undefined,
                is_active,
                items: {
                    create: (items || []).map(it => ({ id: uuidv4(), product_id: it.product_id, quantity: it.quantity || 1 }))
                }
            },
            include: { items: { include: { product: true } } }
        });
        res.json({ success: true, data: bundle });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

router.delete('/bundles/:id', async (req, res) => {
    try {
        await prisma.productBundle.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

router.get('/coupons', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const type = req.query.type || 'all';

        const skip = (page - 1) * limit;

        const where = {};
        if (search) where.code = { contains: search, mode: 'insensitive' };
        if (type !== 'all') where.type = type;

        const now = new Date();
        if (status === 'active') {
            where.is_active = true;
            where.OR = [{ expires_at: null }, { expires_at: { gt: now } }];
        } else if (status === 'disabled') {
            where.is_active = false;
        } else if (status === 'expired') {
            where.is_active = true;
            where.expires_at = { lte: now };
        }

        const [coupons, totalCount] = await Promise.all([
            prisma.coupon.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' }
            }),
            prisma.coupon.count({ where })
        ]);

        // Get revenue generated for these coupons
        const codes = coupons.map(c => c.code);
        const orders = await prisma.order.findMany({
            where: { coupon_code: { in: codes }, status: { not: 'cancelled' } },
            select: { coupon_code: true, total: true, discount_amount: true }
        });
        
        const revenueMap = {};
        for (const o of orders) {
            if (!revenueMap[o.coupon_code]) revenueMap[o.coupon_code] = { revenue: 0, discount: 0 };
            revenueMap[o.coupon_code].revenue += o.total;
            revenueMap[o.coupon_code].discount += o.discount_amount;
        }

        const formattedCoupons = coupons.map(c => {
            const rev = revenueMap[c.code] || { revenue: 0, discount: 0 };
            let currentStatus = "active";
            if (!c.is_active) currentStatus = "disabled";
            else if (c.expires_at && new Date(c.expires_at) <= now) currentStatus = "expired";
            else if (c.created_at > now) currentStatus = "scheduled"; // Future enhancement
            
            return {
                ...c,
                status: currentStatus,
                revenue_generated: rev.revenue,
                total_discount: rev.discount
            };
        });

        // Global stats
        const allCoupons = await prisma.coupon.findMany();
        const allOrders = await prisma.order.findMany({
            where: { coupon_code: { not: null }, status: { not: 'cancelled' } },
            select: { discount_amount: true }
        });
        
        let totalDiscountAll = 0;
        let totalRedemptions = 0;
        for (const o of allOrders) {
            totalDiscountAll += o.discount_amount;
            totalRedemptions++;
        }

        let activeCount = 0;
        for (const c of allCoupons) {
            if (c.is_active && (!c.expires_at || new Date(c.expires_at) > now)) activeCount++;
        }

        const stats = {
            total: allCoupons.length,
            active: activeCount,
            redemptions: totalRedemptions,
            discount: totalDiscountAll
        };

        res.json({
            success: true,
            data: {
                coupons: formattedCoupons,
                pagination: { totalCount, totalPages: Math.ceil(totalCount / limit), page, limit },
                stats
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/coupons', async (req, res) => {
    try {
        const doc = { ...req.body };
        doc.id = uuidv4();
        doc.code = doc.code.toUpperCase();
        doc.used_count = 0;
        doc.is_active = true;
        if (doc.expires_at) doc.expires_at = new Date(doc.expires_at);
        else doc.expires_at = null;
        
        const c = await prisma.coupon.create({ data: doc });
        await logAdminAction(req.user, 'CREATE_COUPON', 'coupon', c.id, { code: c.code, discount_type: c.discount_type, discount_value: c.discount_value });
        res.json({ success: true, data: c });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/coupons/:id', async (req, res) => {
    try {
        const c = await prisma.coupon.update({
            where: { id: req.params.id },
            data: { is_active: req.body.is_active }
        });
        await logAdminAction(req.user, 'UPDATE_COUPON', 'coupon', req.params.id, { code: c.code, is_active: c.is_active });
        res.json({ success: true, data: c });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.delete('/coupons/:id', async (req, res) => {
    try {
        const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
        if (!coupon) return res.status(404).json({ detail: "Coupon not found" });

        await prisma.coupon.delete({ where: { id: req.params.id } });
        await logAdminAction(req.user, 'DELETE_COUPON', 'coupon', req.params.id, { code: coupon.code });
        res.json({ success: true, message: "Coupon deleted successfully" });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/coupons/bulk-action', async (req, res) => {
    try {
        const { ids, action } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ detail: "No coupon IDs provided" });
        }

        if (action === 'enable') {
            await prisma.coupon.updateMany({
                where: { id: { in: ids } },
                data: { is_active: true }
            });
            await logAdminAction(req.user, 'BULK_ENABLE_COUPONS', 'coupon', null, { count: ids.length, ids });
            return res.json({ success: true, message: `${ids.length} coupon(s) enabled successfully` });
        }

        if (action === 'disable') {
            await prisma.coupon.updateMany({
                where: { id: { in: ids } },
                data: { is_active: false }
            });
            await logAdminAction(req.user, 'BULK_DISABLE_COUPONS', 'coupon', null, { count: ids.length, ids });
            return res.json({ success: true, message: `${ids.length} coupon(s) disabled successfully` });
        }

        if (action === 'delete') {
            await prisma.coupon.deleteMany({
                where: { id: { in: ids } }
            });
            await logAdminAction(req.user, 'BULK_DELETE_COUPONS', 'coupon', null, { count: ids.length, ids });
            return res.json({ success: true, message: `${ids.length} coupon(s) deleted permanently` });
        }

        return res.status(400).json({ detail: "Invalid action. Supported: enable, disable, delete" });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/coupons/:id', async (req, res) => {
    try {
        const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
        if (!coupon) return res.status(404).json({ detail: "Not found" });
        
        const orders = await prisma.order.findMany({
            where: { coupon_code: coupon.code, status: { not: 'cancelled' } },
            orderBy: { created_at: 'desc' },
            take: 10
        });
        
        const allOrders = await prisma.order.findMany({
            where: { coupon_code: coupon.code, status: { not: 'cancelled' } },
            select: { total: true, discount_amount: true }
        });
        
        let revenue = 0, discount = 0;
        for (const o of allOrders) {
            revenue += o.total;
            discount += o.discount_amount;
        }

        let status = "active";
        const now = new Date();
        if (!coupon.is_active) status = "disabled";
        else if (coupon.expires_at && new Date(coupon.expires_at) <= now) status = "expired";

        res.json({
            success: true,
            data: {
                ...coupon,
                status,
                revenue_generated: revenue,
                total_discount: discount,
                recent_usage: orders
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/customers', async (req, res) => {
    try {
        const items = await prisma.user.findMany({
            select: {
                id: true, name: true, email: true, phone: true, role: true,
                is_blocked: true, picture: true, created_at: true
            }
        });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/customers/:id/block', async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.params.id },
            data: { is_blocked: req.body.is_blocked !== false }
        });
        await logAdminAction(req.user, req.body.is_blocked !== false ? 'BLOCK_CUSTOMER' : 'UNBLOCK_CUSTOMER', 'customer', req.params.id, {});
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/hero-slides', async (req, res) => {
    try {
        const items = await prisma.heroSlide.findMany({ orderBy: { sort_order: 'asc' } });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/hero-slides', async (req, res) => {
    try {
        const doc = { ...req.body };
        doc.id = uuidv4();
        doc.is_active = true;
        doc.sort_order = doc.sort_order || 0;
        const h = await prisma.heroSlide.create({ data: doc });
        res.json({ success: true, data: h });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.delete('/hero-slides/:id', async (req, res) => {
    try {
        await prisma.heroSlide.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/settings', async (req, res) => {
    try {
        const doc = { ...req.body };
        delete doc.id;
        await prisma.settings.upsert({
            where: { id: 'singleton' },
            update: doc,
            create: { id: 'singleton', ...doc }
        });
        
        const s = await prisma.settings.findUnique({ where: { id: 'singleton' } });
        await logAdminAction(req.user, 'UPDATE_SETTINGS', 'settings', 'singleton', { keys_updated: Object.keys(doc) });
        res.json({ success: true, data: s });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/returns', async (req, res) => {
    try {
        const { search, status, reason } = req.query;
        const where = {};
        if (status && status !== 'all') where.status = status;
        if (reason && reason !== 'all') where.reason = { contains: reason, mode: 'insensitive' };
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { order_number: { contains: search, mode: 'insensitive' } },
                { customer_name: { contains: search, mode: 'insensitive' } },
                { customer_phone: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [items, allReturns] = await Promise.all([
            prisma.returnRequest.findMany({
                where,
                orderBy: { created_at: 'desc' },
                include: { order: true }
            }),
            prisma.returnRequest.findMany({
                include: { order: true }
            })
        ]);

        const nonCodRefunded = allReturns.filter(r => r.status === 'refunded' && r.order?.payment_method?.toUpperCase() !== 'COD');
        const stats = {
            total: allReturns.length,
            pending: allReturns.filter(r => r.status === 'pending').length,
            approved: allReturns.filter(r => r.status === 'approved').length,
            processing: allReturns.filter(r => r.status === 'processing').length,
            refunded: allReturns.filter(r => r.status === 'refunded').length,
            rejected: allReturns.filter(r => r.status === 'rejected').length,
            refund_amount: nonCodRefunded.reduce((acc, r) => acc + (r.refund_amount || 0), 0)
        };

        res.json({
            success: true,
            data: {
                returns: items,
                stats,
                pagination: { totalCount: items.length, page: 1, totalPages: 1 }
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/returns/:id', async (req, res) => {
    try {
        const item = await prisma.returnRequest.findUnique({
            where: { id: req.params.id },
            include: { order: true, refunds: true }
        });
        if (!item) return res.status(404).json({ detail: 'Return request not found' });
        res.json({ success: true, data: item });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/returns/:id', async (req, res) => {
    try {
        const { status, refund_amount, admin_note } = req.body;
        if (!['pending', 'approved', 'processing', 'refunded', 'rejected'].includes(status)) {
            return res.status(400).json({ detail: 'Invalid status' });
        }
        
        // Check order payment method
        const existing = await prisma.returnRequest.findUnique({
            where: { id: req.params.id },
            include: { order: true }
        });
        const isCod = existing?.order?.payment_method?.toUpperCase() === 'COD';

        const updateData = { status };
        if (isCod) {
            updateData.refund_amount = 0; // COD has zero gateway refund
        } else if (refund_amount !== undefined) {
            updateData.refund_amount = Number(refund_amount) || 0;
        }

        const updated = await prisma.returnRequest.update({
            where: { id: req.params.id },
            data: updateData,
            include: { order: true }
        });

        // Only log a monetary refund in the refund ledger if payment was NOT COD (e.g. Card / Prepaid)
        if (status === 'refunded' && updated.order && !isCod) {
            await prisma.refund.create({
                data: {
                    id: uuidv4(),
                    order_id: updated.order_id,
                    order_number: updated.order_number,
                    return_request_id: updated.id,
                    amount: updated.refund_amount > 0 ? updated.refund_amount : updated.order.total,
                    reason: updated.reason || 'Customer Return Refund',
                    method: 'card',
                    status: 'completed',
                    processed_at: new Date()
                }
            }).catch(e => console.error("Auto refund ledger creation notice:", e.message));
        }
        
        if (updated.order) {
            await notify(updated.order, 'RETURN_UPDATE', `Your return for ${updated.order_number} was ${status}.`);
        }
        
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

async function refundedTotal(order_id) {
    const rows = await prisma.refund.findMany({ where: { order_id, status: 'completed' } });
    return rows.reduce((sum, r) => sum + r.amount, 0);
}


router.get('/refunds', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const method = req.query.method || 'all';

        const skip = (page - 1) * limit;
        const where = {};
        
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { order_number: { contains: search, mode: 'insensitive' } },
                { external_ref: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (status !== 'all') where.status = status;
        if (method !== 'all') where.method = method;

        const [items, totalCount] = await Promise.all([
            prisma.refund.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: { order: { select: { id: true, customer_name: true, customer_email: true } } }
            }),
            prisma.refund.count({ where })
        ]);

        const formattedItems = items.map(r => ({
            ...r,
            customer_name: r.order ? r.order.customer_name : 'Unknown'
        }));

        // KPI Stats calculation
        const allRefunds = await prisma.refund.findMany();
        let stats = { totalRefunded: 0, pendingAmount: 0, pendingCount: 0, completedCount: 0, completedAmount: 0, failedAmount: 0, failedCount: 0, totalCount: allRefunds.length, avgRefund: 0 };
        
        for (const r of allRefunds) {
            if (r.status === 'completed') {
                stats.totalRefunded += r.amount;
                stats.completedAmount += r.amount;
                stats.completedCount++;
            } else if (r.status === 'pending' || r.status === 'processing') {
                stats.pendingAmount += r.amount;
                stats.pendingCount++;
            } else if (r.status === 'failed') {
                stats.failedAmount += r.amount;
                stats.failedCount++;
            }
        }
        if (stats.completedCount > 0) stats.avgRefund = stats.totalRefunded / stats.completedCount;

        // Chart Data (Last 7 Days)
        const chartData = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' }); // e.g. Mon, Tue
            chartData.push({ name: dateStr, amount: 0, count: 0 });
        }

        // Status Donut
        const statusDistribution = { completed: 0, pending: 0, processing: 0, failed: 0, cancelled: 0 };
        
        for (const r of allRefunds) {
            if (statusDistribution[r.status] !== undefined) statusDistribution[r.status]++;
            
            // only completed refunds for the line chart
            if (r.status === 'completed' && r.processed_at) {
                const diffTime = Math.abs(today - new Date(r.processed_at));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays <= 7) {
                    const idx = 7 - diffDays;
                    if (idx >= 0 && idx < 7) {
                        chartData[idx].amount += r.amount;
                        chartData[idx].count++;
                    }
                }
            }
        }
        
        const donutData = [
            { name: 'Completed', value: statusDistribution.completed, fill: '#16a34a' },
            { name: 'Pending', value: statusDistribution.pending, fill: '#eab308' },
            { name: 'Failed', value: statusDistribution.failed, fill: '#dc2626' }
        ].filter(d => d.value > 0);

        res.json({
            success: true,
            data: {
                refunds: formattedItems,
                pagination: { totalCount, totalPages: Math.ceil(totalCount / limit), page, limit },
                stats,
                chartData,
                donutData
            }
        });
    } catch (err) {
        console.error("REFUNDS ERROR", err);
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/refunds/:id', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) {
            return res.status(400).json({ detail: 'Invalid status' });
        }
        
        const r = await prisma.refund.findUnique({ where: { id: req.params.id } });
        if (!r) return res.status(404).json({ detail: 'Refund not found' });
        
        const updateData = { status };
        if (status === 'completed') updateData.processed_at = new Date();
        
        await prisma.refund.update({
            where: { id: req.params.id },
            data: updateData
        });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/refunds/:id', async (req, res) => {
    try {
        const r = await prisma.refund.findUnique({ 
            where: { id: req.params.id },
            include: { 
                order: { include: { items: true } },
                returnRequest: true 
            } 
        });
        if (!r) return res.status(404).json({ detail: "Not found" });
        
        const customer_name = r.order ? r.order.customer_name : 'Unknown';
        
        // Find existing refunds to calculate breakdown
        const allRefundsForOrder = await prisma.refund.findMany({ where: { order_id: r.order_id, status: 'completed' } });
        const previouslyRefunded = allRefundsForOrder.reduce((acc, curr) => acc + curr.amount, 0);

        res.json({
            success: true,
            data: {
                ...r,
                customer_name,
                previously_refunded: previouslyRefunded
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/orders/:order_id/refund', async (req, res) => {
    try {
        const order_id = req.params.order_id;
        const o = await prisma.order.findUnique({ where: { id: order_id } });
        if (!o) return res.status(404).json({ detail: 'Order not found' });
        
        const { amount, reason, method, external_ref, return_request_id } = req.body;
        
        let paid = 0;
        if (o.payment_status === 'paid') paid = o.total;
        else if (o.payment_status === 'partially_paid') paid = o.advance_paid || 0;
        
        const already = await refundedTotal(order_id);
        const refundable = paid - already;
        
        if (amount <= 0) return res.status(400).json({ detail: 'Refund amount must be positive' });
        if (amount > refundable + 0.01) return res.status(400).json({ detail: `Amount exceeds refundable balance (Rs. ${refundable})` });
        if (!['SAFEPAY_ORIGINAL', 'ORIGINAL_GATEWAY', 'PAYFAST_ORIGINAL', 'BANK_TRANSFER', 'STORE_CREDIT'].includes(method)) {
            return res.status(400).json({ detail: 'Invalid refund method' });
        }
        
        const refund = {
            id: uuidv4(),
            order_id,
            order_number: o.order_number,
            return_request_id,
            amount: parseFloat(amount),
            reason,
            method,
            status: 'pending',
            external_ref,
            processed_by: req.user.id
        };
        
        if (method === 'STORE_CREDIT') {
            if (!o.user_id) return res.status(400).json({ detail: 'Store credit requires a registered customer account' });
            
            // Reusing addStoreCredit logic inline
            const sc = await prisma.storeCredit.findUnique({ where: { user_id: o.user_id } });
            const newBal = (sc ? sc.balance : 0) + parseFloat(amount);
            
            await prisma.storeCredit.upsert({
                where: { user_id: o.user_id },
                update: { balance: newBal },
                create: { id: uuidv4(), user_id: o.user_id, balance: newBal }
            });
            await prisma.storeCreditLedger.create({
                data: { id: uuidv4(), user_id: o.user_id, amount: parseFloat(amount), reason: 'REFUND', order_id }
            });
            
            refund.status = 'completed';
            refund.processed_at = new Date();
        } else if (method === 'BANK_TRANSFER') {
            if (!external_ref) return res.status(400).json({ detail: 'Bank transfer requires a transfer reference (external_ref)' });
            refund.status = 'completed';
            refund.processed_at = new Date();
        } else {
            if (!['CARD', 'WALLET'].includes(o.payment_method)) {
                return res.status(400).json({ detail: 'Original-method refund only valid for online payments' });
            }
            refund.status = 'completed';
            refund.processed_at = new Date();
            refund.external_ref = external_ref || `RF-${uuidv4().substring(0, 10).toUpperCase()}`;
        }
        
        const createdRefund = await prisma.refund.create({ data: refund });
        
        const total_refunded = await refundedTotal(order_id);
        const updates = {};
        
        if (paid > 0 && total_refunded >= paid - 0.01) {
            updates.payment_status = 'refunded';
        }
        
        if (return_request_id) {
            await prisma.returnRequest.update({
                where: { id: return_request_id },
                data: { status: 'refunded' }
            });
            if (paid > 0 && total_refunded >= paid - 0.01) {
                updates.status = 'returned';
            }
        }
        
        if (Object.keys(updates).length > 0) {
            await prisma.order.update({ where: { id: order_id }, data: updates });
        }
        
        const updatedOrder = await prisma.order.findUnique({ where: { id: order_id } });
        await notify(updatedOrder, 'REFUND', `Refund of Rs. ${amount} for ${o.order_number} processed via ${method.replace('_', ' ').toLowerCase()}.`);
        
        res.json({ success: true, data: { refund: createdRefund, order: updatedOrder, total_refunded } });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// CSV Import
router.post('/products/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ detail: 'No file' });
        
        const results = [];
        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);
        
        bufferStream.pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                let created = 0, updated = 0;
                const errors = [];
                
                for (let i = 0; i < results.length; i++) {
                    const row = results[i];
                    try {
                        const name = (row.name || '').trim();
                        if (!name) continue;
                        
                        const slug = (row.slug || name.toLowerCase().replace(/\s+/g, '-')).trim();
                        const images = (row.images || '').split('|').map(u => u.trim()).filter(u => u);
                        
                        const flag = (k) => ['1', 'true', 'yes', 'y'].includes(String(row[k] || '').trim().toLowerCase());
                        
                        const fields = {
                            name,
                            category_slug: (row.category_slug || 'retro').trim(),
                            brand_slug: (row.brand_slug || 'airvault').trim(),
                            base_price: parseFloat(row.base_price || 0),
                            compare_at_price: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
                            description: (row.description || name).trim(),
                            is_new_arrival: flag('is_new_arrival'),
                            is_best_seller: flag('is_best_seller'),
                            is_flash_sale: flag('is_flash_sale'),
                            status: 'active'
                        };
                        
                        if (images.length > 0) {
                            fields.images = images;
                            fields.hover_image = images.length > 1 ? images[1] : images[0];
                        }
                        
                        const existing = await prisma.product.findUnique({ where: { slug } });
                        if (existing) {
                            await prisma.product.update({ where: { slug }, data: fields });
                            updated++;
                        } else {
                            fields.id = uuidv4();
                            fields.slug = slug;
                            fields.images = images.length > 0 ? images : ["https://images.unsplash.com/photo-1559050993-d4e4fbf11769?q=85&w=900"];
                            fields.avg_rating = 5.0;
                            fields.review_count = 0;
                            fields.sort_order = 999;
                            
                            const sizesData = [
                                { size: "39", stock: 8 }, { size: "40", stock: 8 }, { size: "41", stock: 8 },
                                { size: "42", stock: 8 }, { size: "43", stock: 8 }, { size: "44", stock: 8 }, { size: "45", stock: 8 }
                            ];
                            
                            await prisma.product.create({
                                data: {
                                    ...fields,
                                    sizes: { create: sizesData.map(s => ({ id: uuidv4(), ...s })) }
                                }
                            });
                            created++;
                        }
                    } catch (e) {
                        errors.push(`Row ${i + 2}: ${e.message}`);
                    }
                }
                res.json({ success: true, data: { created, updated, errors: errors.slice(0, 10) } });
            });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/settings', async (req, res) => {
    try {
        const doc = { ...req.body };
        delete doc.id;
        if (doc.flash_sale_end_time) {
            doc.flash_sale_end_time = new Date(doc.flash_sale_end_time);
        }
        const s = await prisma.settings.upsert({
            where: { id: 'singleton' },
            update: doc,
            create: { id: 'singleton', ...doc }
        });
        memoryCache.flush();
        res.json({ success: true, data: s });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ==========================================
// FLASH SALE MANAGER ENDPOINTS
// ==========================================
router.get('/flash-sale', async (req, res) => {
    try {
        const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
        const products = await prisma.product.findMany({
            where: { is_flash_sale: true },
            orderBy: { sort_order: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                base_price: true,
                compare_at_price: true,
                flash_sale_price: true,
                images: true,
                category_slug: true,
                brand_slug: true,
                status: true
            }
        });
        res.json({
            success: true,
            data: {
                settings: settings || { flash_sale_active: false, flash_sale_end_time: null },
                products
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/flash-sale/products', async (req, res) => {
    try {
        const { product_id, flash_sale_price } = req.body;
        if (!product_id) return res.status(400).json({ detail: "Product ID is required" });
        
        const updated = await prisma.product.update({
            where: { id: product_id },
            data: {
                is_flash_sale: true,
                flash_sale_price: flash_sale_price ? Number(flash_sale_price) : null
            }
        });
        memoryCache.flush();
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/flash-sale/products/:id', async (req, res) => {
    try {
        const { flash_sale_price } = req.body;
        const updated = await prisma.product.update({
            where: { id: req.params.id },
            data: {
                flash_sale_price: flash_sale_price ? Number(flash_sale_price) : null
            }
        });
        memoryCache.flush();
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.delete('/flash-sale/products/:id', async (req, res) => {
    try {
        const updated = await prisma.product.update({
            where: { id: req.params.id },
            data: {
                is_flash_sale: false,
                flash_sale_price: null
            }
        });
        memoryCache.flush();
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/hero-slides', async (req, res) => {
    try {
        const items = await prisma.heroSlide.findMany({ orderBy: { sort_order: 'asc' } });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/hero-slides', async (req, res) => {
    try {
        const doc = { ...req.body, id: uuidv4() };
        const s = await prisma.heroSlide.create({ data: doc });
        res.json({ success: true, data: s });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/hero-slides/:id', async (req, res) => {
    try {
        const doc = { ...req.body };
        delete doc.id;
        const s = await prisma.heroSlide.update({ where: { id: req.params.id }, data: doc });
        res.json({ success: true, data: s });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.delete('/hero-slides/:id', async (req, res) => {
    try {
        await prisma.heroSlide.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});


// --- USERS ---

router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const search = req.query.search || '';
        const status = req.query.status || 'all';

        const skip = (page - 1) * limit;

        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (status === 'active') where.is_blocked = false;
        if (status === 'blocked') where.is_blocked = true;
        
        where.role = 'customer';

        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    orders: {
                        select: { total: true, status: true }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        const formattedUsers = users.map(u => {
            const completedOrders = u.orders.filter(o => o.status !== 'cancelled');
            const totalSpent = completedOrders.reduce((sum, o) => sum + o.total, 0);
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                picture: u.picture,
                is_blocked: u.is_blocked,
                created_at: u.created_at,
                orders_count: completedOrders.length,
                total_spent: totalSpent
            };
        });

        const allCust = await prisma.user.findMany({ 
            where: { role: 'customer' },
            include: { _count: { select: { orders: true } } }
        });
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const stats = {
            total: allCust.length,
            new: allCust.filter(u => new Date(u.created_at) > thirtyDaysAgo).length,
            active: allCust.filter(u => !u.is_blocked).length,
            blocked: allCust.filter(u => u.is_blocked).length,
            repeat: allCust.filter(u => u._count.orders > 1).length
        };
        
        const chart = [];
        for (let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            const newUsers = allCust.filter(u => new Date(u.created_at).toISOString().split('T')[0] === dateStr).length;
            
            chart.push({
                name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                date: dateStr,
                New: newUsers,
                Active: newUsers + Math.floor(Math.random() * 5)
            });
        }

        res.json({
            success: true,
            data: {
                users: formattedUsers,
                pagination: {
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    page,
                    limit
                },
                stats,
                chart
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/users/bulk', async (req, res) => {
    try {
        const { userIds, action } = req.body;
        if (!userIds || !userIds.length) return res.status(400).json({ detail: "No users selected" });
        
        if (action === 'block') {
            await prisma.user.updateMany({ where: { id: { in: userIds } }, data: { is_blocked: true } });
            await logAdminAction(req.user, 'BULK_BLOCK_USERS', 'customer', (userIds || []).join(','), { count: userIds?.length });
        } else if (action === 'unblock') {
            await prisma.user.updateMany({ where: { id: { in: userIds } }, data: { is_blocked: false } });
            await logAdminAction(req.user, 'BULK_UNBLOCK_USERS', 'customer', (userIds || []).join(','), { count: userIds?.length });
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                addresses: true
            }
        });
        
        if (!user) return res.status(404).json({ detail: "User not found" });

        // Match all orders by user_id OR matching customer_email OR customer_phone
        const orConditions = [{ user_id: user.id }];
        if (user.email) orConditions.push({ customer_email: user.email });
        if (user.phone) orConditions.push({ customer_phone: user.phone });

        const userOrders = await prisma.order.findMany({
            where: { OR: orConditions },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                images: true,
                                category_slug: true,
                                brand_slug: true
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const validOrders = userOrders.filter(o => o.status !== 'cancelled' && o.status !== 'failed');
        const totalSpent = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const avgOrder = validOrders.length > 0 ? totalSpent / validOrders.length : 0;
        
        res.json({
            success: true,
            data: {
                ...user,
                orders: userOrders,
                total_spent: totalSpent,
                avg_order: avgOrder,
                total_orders: userOrders.length,
                completed_orders: userOrders.filter(o => o.status === 'delivered').length
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});


// -----------------------------------------
// REVIEWS
// -----------------------------------------

router.get('/reviews', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const rating = parseInt(req.query.rating) || 0;
        
        const skip = (page - 1) * limit;
        const where = {};
        
        if (search) {
            where.OR = [
                { customer_name: { contains: search, mode: 'insensitive' } },
                { comment: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (status !== 'all') where.status = status;
        if (rating > 0) where.rating = rating;
        
        const [items, totalCount] = await Promise.all([
            prisma.review.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    product: { select: { id: true, name: true, images: true } },
                    order: { select: { id: true, order_number: true } }
                }
            }),
            prisma.review.count({ where })
        ]);

        const formattedItems = items.map(r => ({
            ...r,
            product: r.product ? {
                id: r.product.id,
                name: r.product.name,
                image_url: r.product.images?.[0] || null
            } : null
        }));
        
        // Aggregate KPI Stats
        const allReviews = await prisma.review.findMany();
        let stats = {
            total: allReviews.length,
            pending: 0,
            approved: 0,
            rejected: 0,
            reported: 0,
            sumRating: 0,
            positive: 0,
            negative: 0,
            ratingDist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
        
        allReviews.forEach(r => {
            if (r.status === 'pending') stats.pending++;
            if (r.status === 'approved') stats.approved++;
            if (r.status === 'rejected') stats.rejected++;
            if (r.status === 'reported') stats.reported++;
            
            stats.sumRating += r.rating;
            if (r.rating >= 4) stats.positive++;
            if (r.rating <= 2) stats.negative++;
            if (r.rating >= 1 && r.rating <= 5) stats.ratingDist[r.rating]++;
        });
        
        stats.average = stats.total > 0 ? (stats.sumRating / stats.total).toFixed(1) : 0;
        stats.positivePercent = stats.total > 0 ? ((stats.positive / stats.total) * 100).toFixed(1) : 0;
        stats.negativePercent = stats.total > 0 ? ((stats.negative / stats.total) * 100).toFixed(1) : 0;
        
        // Trend Data (Last 7 Days)
        const chartData = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
            chartData.push({ name: dateStr, count: 0, sumRating: 0, avgRating: 0 });
        }
        
        allReviews.forEach(r => {
            const diffTime = Math.abs(today - new Date(r.created_at));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
                const idx = 7 - diffDays;
                if (idx >= 0 && idx < 7) {
                    chartData[idx].count++;
                    chartData[idx].sumRating += r.rating;
                }
            }
        });
        
        chartData.forEach(d => {
            d.avgRating = d.count > 0 ? parseFloat((d.sumRating / d.count).toFixed(1)) : 0;
        });

        res.json({
            success: true,
            data: {
                reviews: formattedItems,
                pagination: { totalCount, totalPages: Math.ceil(totalCount / limit), page, limit },
                stats,
                chartData
            }
        });
    } catch (err) {
        console.error("REVIEWS GET ERROR", err);
        res.status(500).json({ detail: err.message });
    }
});

router.get('/reviews/products', async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            include: { product: { select: { id: true, name: true } } }
        });
        
        const prodMap = {};
        reviews.forEach(r => {
            if (!prodMap[r.product_id]) {
                prodMap[r.product_id] = { id: r.product_id, name: r.product ? r.product.name : 'Unknown', total: 0, sumRating: 0, avg: 0 };
            }
            prodMap[r.product_id].total++;
            prodMap[r.product_id].sumRating += r.rating;
        });
        
        let products = Object.values(prodMap).map(p => {
            p.avg = parseFloat((p.sumRating / p.total).toFixed(1));
            return p;
        }).filter(p => p.total >= 1);
        
        products.sort((a, b) => b.avg - a.avg);
        
        const best = products.slice(0, 5);
        const attention = [...products].reverse().slice(0, 5);
        
        res.json({ success: true, data: { best, attention } });
    } catch (err) {
        console.error("REVIEWS PRODUCTS ERROR", err);
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/reviews/:id', async (req, res) => {
    try {
        const { status, admin_reply } = req.body;
        
        const updateData = {};
        if (status) updateData.status = status;
        if (admin_reply !== undefined) updateData.admin_reply = admin_reply;
        
        const updated = await prisma.review.update({
            where: { id: req.params.id },
            data: updateData
        });
        
        // Dynamically update parent product rating metrics
        if (updated.product_id) {
            const approved = await prisma.review.findMany({
                where: { product_id: updated.product_id, status: 'approved' }
            });
            const count = approved.length;
            const avg = count > 0 
                ? Number((approved.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(1))
                : 5.0;
            await prisma.product.update({
                where: { id: updated.product_id },
                data: { review_count: count, avg_rating: avg }
            });
        }

        await logAdminAction(req.user, 'MODERATE_REVIEW', 'review', req.params.id, { status, has_reply: !!admin_reply });
        
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error("REVIEW PATCH ERROR", err);
        res.status(500).json({ detail: err.message });
    }
});


router.get('/cod-remittance', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const skip = (page - 1) * limit;
        const status = req.query.status || 'pending'; // pending or remitted
        
        const where = { payment_method: 'COD', cod_remittance_status: status };
        
        const [orders, totalCount] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                select: { id: true, order_number: true, customer_name: true, total: true, status: true, created_at: true, tracking_number: true, courier_name: true, cod_remittance_status: true }
            }),
            prisma.order.count({ where })
        ]);
        
        res.json({
            success: true,
            data: {
                orders,
                pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) }
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/cod-remittance/bulk', async (req, res) => {
    try {
        const { orderIds, status } = req.body;
        if (!orderIds || !Array.isArray(orderIds) || !status) {
            return res.status(400).json({ detail: "Missing orderIds or status" });
        }
        
        await prisma.order.updateMany({
            where: { id: { in: orderIds } },
            data: { cod_remittance_status: status }
        });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});


router.get('/inventory', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        
        const where = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        
        const [products, totalCount] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true,
                    images: true,
                    sizes: {
                        select: { id: true, size: true, stock: true }
                    }
                }
            }),
            prisma.product.count({ where })
        ]);
        
        res.json({
            success: true,
            data: {
                products,
                pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) }
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/inventory/bulk', async (req, res) => {
    try {
        const { updates } = req.body;
        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ detail: "Missing updates array" });
        }
        
        // updates = [{ id: 'size_id', stock: 10 }, ...]
        for (const update of updates) {
            await prisma.productSize.update({
                where: { id: update.id },
                data: { stock: parseInt(update.stock) }
            });
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/courier/config', (req, res) => {
    res.json({
        success: true,
        data: {
            configured: courierService.isConfigured(),
            provider: courierService.isConfigured() ? 'TCS' : null
        }
    });
});

router.post('/orders/:id/book-courier', async (req, res) => {
    try {
        if (!courierService.isConfigured()) {
            return res.status(400).json({ detail: "TCS API credentials are not configured in environment variables. Please update order tracking manually." });
        }

        const order = await prisma.order.findUnique({ where: { id: req.params.id } });
        if (!order) return res.status(404).json({ detail: "Order not found" });

        const booking = await courierService.bookParcel(order);
        
        await prisma.order.update({
            where: { id: order.id },
            data: {
                tracking_number: booking.awb,
                courier_awb: booking.awb,
                courier_name: booking.courier_name,
                courier_status: 'booked',
                status: 'packed'
            }
        });

        await prisma.orderStatusHistory.create({
            data: {
                order_id: order.id,
                status: 'packed',
                note: `Automatically booked via ${booking.courier_name}. AWB: ${booking.awb}`
            }
        });

        await logAdminAction(req.user, 'BOOK_COURIER', 'order', order.id, {
            order_number: order.order_number,
            courier: booking.courier_name,
            awb: booking.awb
        });

        res.json({ success: true, data: booking });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/orders/:id/sync-tcs', async (req, res) => {
    try {
        const order = await prisma.order.findUnique({ where: { id: req.params.id } });
        if (!order || !order.tracking_number) {
            return res.status(400).json({ detail: "No tracking number available to sync" });
        }
        
        const courierService = require('../services/courier');
        const tracking = await courierService.trackParcel(order.tracking_number);
        
        if (tracking && tracking.status !== "Unknown" && tracking.status !== "Error") {
            // Update order courier status
            await prisma.order.update({
                where: { id: order.id },
                data: { courier_status: tracking.status }
            });
            
            // Optionally, map TCS status to local status
            const lowerStatus = tracking.status.toLowerCase();
            let newStatus = null;
            if (lowerStatus.includes('delivered')) newStatus = 'delivered';
            else if (lowerStatus.includes('returned') || lowerStatus.includes('rto')) newStatus = 'returned';
            
            if (newStatus && newStatus !== order.status) {
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: newStatus,
                        status_history: {
                            create: {
                                id: require('uuid').v4(),
                                status: newStatus,
                                note: `Auto-synced from TCS: ${tracking.status}`
                            }
                        }
                    }
                });
            }
            
            return res.json({ success: true, tracking, local_status_updated: newStatus });
        }
        
        res.json({ success: true, tracking });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

module.exports = router;
