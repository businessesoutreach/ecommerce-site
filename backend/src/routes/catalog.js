const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../db');
const { getOptionalUser } = require('../middleware/auth');

const router = express.Router();

router.get('/products', async (req, res) => {
    try {
        const { category, brand, size, search, flag, min_price, max_price, sort = 'featured', page = 1, limit = 24 } = req.query;
        
        const where = { status: 'active' };
        
        if (category) where.category_slug = { in: category.split(',') };
        if (brand) where.brand_slug = { in: brand.split(',') };
        if (search) where.name = { contains: search, mode: 'insensitive' };
        if (flag === 'new') where.is_new_arrival = true;
        if (flag === 'flash') where.is_flash_sale = true;
        if (flag === 'best') where.is_best_seller = true;
        if (flag === 'featured') where.is_featured = true;
        if (size) {
            where.sizes = {
                some: {
                    size: size,
                    stock: { gt: 0 }
                }
            };
        }
        if (min_price || max_price) {
            where.base_price = {};
            if (min_price) where.base_price.gte = parseFloat(min_price);
            if (max_price) where.base_price.lte = parseFloat(max_price);
        }

        let orderBy = {};
        if (sort === 'price_asc') orderBy = { base_price: 'asc' };
        else if (sort === 'price_desc') orderBy = { base_price: 'desc' };
        else if (sort === 'newest') orderBy = { created_at: 'desc' };
        else if (sort === 'rating') orderBy = { avg_rating: 'desc' };
        else orderBy = { sort_order: 'asc' };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const [items, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy,
                skip,
                take,
                include: { sizes: true }
            }),
            prisma.product.count({ where })
        ]);

        res.json({ success: true, data: items, total, page: parseInt(page) });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/products/:slug', async (req, res) => {
    try {
        const p = await prisma.product.findUnique({
            where: { slug: req.params.slug },
            include: { sizes: true }
        });
        if (!p) return res.status(404).json({ detail: 'Product not found' });
        res.json({ success: true, data: p });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/products/:id/related', async (req, res) => {
    try {
        const p = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (!p) return res.status(404).json({ detail: 'Not found' });
        
        const items = await prisma.product.findMany({
            where: {
                category_slug: p.category_slug,
                id: { not: p.id },
                status: 'active'
            },
            take: 8,
            include: { sizes: true }
        });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/products/:id/reviews', async (req, res) => {
    try {
        const items = await prisma.review.findMany({
            where: { product_id: req.params.id, status: 'approved' },
            orderBy: { created_at: 'desc' }
        });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.post('/products/:id/reviews', getOptionalUser, async (req, res) => {
    try {
        const { customer_name, rating, comment, image_urls = [] } = req.body;
        const r = Math.max(1, Math.min(5, parseInt(rating)));

        const doc = await prisma.review.create({
            data: {
                id: uuidv4(),
                product_id: req.params.id,
                user_id: req.user ? req.user.id : null,
                customer_name,
                rating: r,
                comment,
                image_urls,
                status: 'pending'
            }
        });
        res.json({ success: true, data: doc });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const items = await prisma.category.findMany({
            where: { is_active: true },
            orderBy: { sort_order: 'asc' }
        });
        for (const c of items) {
            c.product_count = await prisma.product.count({
                where: { category_slug: c.slug, status: 'active' }
            });
        }
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/categories/:slug', async (req, res) => {
    try {
        const c = await prisma.category.findUnique({ where: { slug: req.params.slug } });
        if (!c) return res.status(404).json({ detail: 'Not found' });
        res.json({ success: true, data: c });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/brands', async (req, res) => {
    try {
        const items = await prisma.brand.findMany();
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/search', async (req, res) => {
    try {
        const q = req.query.q || '';
        if (!q) return res.json({ success: true, data: [] });
        
        const items = await prisma.product.findMany({
            where: {
                name: { contains: q, mode: 'insensitive' },
                status: 'active'
            },
            take: 8,
            include: { sizes: true }
        });
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/bundles', async (req, res) => {
    try {
        const bundles = await prisma.productBundle.findMany({
            where: { is_active: true },
            orderBy: { created_at: 'desc' },
            include: { items: { include: { product: { select: { id: true, name: true, base_price: true, images: true, slug: true } } } } }
        });
        res.json({ success: true, data: bundles });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

module.exports = router;
