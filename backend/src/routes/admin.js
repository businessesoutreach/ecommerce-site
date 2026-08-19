const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const stream = require('stream');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../db');
const { getAdmin } = require('../middleware/auth');
const { notify } = require('../utils/notifications');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(getAdmin);

router.get('/analytics/overview', async (req, res) => {
    try {
        const orders = await prisma.order.findMany();
        const validOrders = orders.filter(o => o.status !== 'cancelled');
        
        const revenue = validOrders.reduce((sum, o) => sum + o.total, 0);
        const total_orders = orders.length;
        const aov = total_orders ? revenue / total_orders : 0;
        const pending = validOrders.filter(o => ['placed', 'confirmed'].includes(o.status)).length;
        
        const last30 = new Date();
        last30.setDate(last30.getDate() - 30);
        
        const recentOrders = validOrders.filter(o => o.created_at >= last30);
        const dailyMap = {};
        for (const o of recentOrders) {
            const d = o.created_at.toISOString().split('T')[0];
            dailyMap[d] = (dailyMap[d] || 0) + o.total;
        }
        
        const chart = Object.keys(dailyMap).sort().map(date => ({
            date,
            sales: Math.round(dailyMap[date])
        }));
        
        const products = await prisma.product.findMany({ include: { sizes: true } });
        const low_stock = products.filter(p => p.sizes.some(s => s.stock < 5)).map(p => ({
            id: p.id,
            name: p.name,
            total_stock: p.sizes.reduce((sum, s) => sum + s.stock, 0)
        })).sort((a, b) => a.total_stock - b.total_stock).slice(0, 10);
        
        const orderItems = await prisma.orderItem.findMany({
            where: { order: { status: { not: 'cancelled' } } }
        });
        
        const pcount = {};
        for (const oi of orderItems) {
            pcount[oi.product_id] = (pcount[oi.product_id] || 0) + oi.quantity;
        }
        
        const top_products = Object.entries(pcount).map(([id, sold]) => {
            const p = products.find(x => x.id === id);
            return {
                id,
                name: p ? p.name : 'Unknown',
                sold
            };
        }).sort((a, b) => b.sold - a.sold).slice(0, 5);
        
        res.json({
            success: true,
            data: { revenue, total_orders, aov, pending_orders: pending, chart, low_stock, top_products }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/products', async (req, res) => {
    try {
        const items = await prisma.product.findMany({
            orderBy: { sort_order: 'asc' },
            include: { sizes: true }
        });
        res.json({ success: true, data: items });
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
        res.json({ success: true, data: p });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.delete('/products/:id', async (req, res) => {
    try {
        await prisma.product.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/orders', async (req, res) => {
    try {
        const status = req.query.status;
        const where = status ? { status } : {};
        const items = await prisma.order.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: { items: true, status_history: true }
        });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/orders/:id/status', async (req, res) => {
    try {
        const { status, tracking_number, courier_name, note } = req.body;
        
        const updateData = { status };
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

router.get('/coupons', async (req, res) => {
    try {
        const items = await prisma.coupon.findMany();
        res.json({ success: true, data: items });
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
        
        const c = await prisma.coupon.create({ data: doc });
        res.json({ success: true, data: c });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.delete('/coupons/:id', async (req, res) => {
    try {
        await prisma.coupon.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/reviews', async (req, res) => {
    try {
        const items = await prisma.review.findMany({ orderBy: { created_at: 'desc' } });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/reviews/:id', async (req, res) => {
    try {
        await prisma.review.update({
            where: { id: req.params.id },
            data: { is_approved: req.body.is_approved !== false }
        });
        res.json({ success: true });
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
        res.json({ success: true, data: s });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/returns', async (req, res) => {
    try {
        const items = await prisma.returnRequest.findMany({ orderBy: { created_at: 'desc' } });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/returns/:id', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ detail: 'Invalid status' });
        }
        
        const rr = await prisma.returnRequest.findUnique({ where: { id: req.params.id } });
        if (!rr) return res.status(404).json({ detail: 'Return request not found' });
        if (rr.status !== 'pending') return res.status(400).json({ detail: `Return already ${rr.status}` });
        
        await prisma.returnRequest.update({
            where: { id: req.params.id },
            data: { status }
        });
        
        const updated = await prisma.returnRequest.findUnique({ where: { id: req.params.id } });
        const o = await prisma.order.findUnique({ where: { id: rr.order_id } });
        
        if (o) {
            await notify(o, 'RETURN_UPDATE', `Your return for ${o.order_number} was ${status}.`);
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
        const items = await prisma.refund.findMany({ orderBy: { created_at: 'desc' } });
        res.json({ success: true, data: items });
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
        if (!['PAYFAST_ORIGINAL', 'BANK_TRANSFER', 'STORE_CREDIT'].includes(method)) {
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

module.exports = router;
