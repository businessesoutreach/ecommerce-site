const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cache = {
    data: {},
    timestamp: {}
};
const TTL = 5 * 60 * 1000; // 5 minutes

function getCache(key) {
    if (cache.data[key] && (Date.now() - cache.timestamp[key] < TTL)) return cache.data[key];
    return null;
}
function setCache(key, data) {
    cache.data[key] = data;
    cache.timestamp[key] = Date.now();
}
function clearCache(key) {
    delete cache.data[key];
    delete cache.timestamp[key];
}

// ==========================================
// HOMEPAGE SECTIONS
// ==========================================
router.get('/homepage-sections', async (req, res) => {
    try {
        const cached = getCache('homepage-sections');
        if (cached) return res.json({ success: true, data: cached });

        let sections = await prisma.homepageSection.findMany({
            orderBy: { sort_order: 'asc' }
        });

        // Initialize default sections if missing
        if (sections.length === 0) {
            const defaults = [
                { type: 'hero', is_active: true, sort_order: 1 },
                { type: 'categories', is_active: true, sort_order: 2 },
                { type: 'new_arrivals', is_active: true, sort_order: 3 },
                { type: 'best_sellers', is_active: true, sort_order: 4 },
                { type: 'promotional_banner', is_active: true, sort_order: 5 },
                { type: 'trending', is_active: false, sort_order: 6 },
                { type: 'flash_sale', is_active: true, sort_order: 7 },
                { type: 'testimonials', is_active: true, sort_order: 8 }
            ];
            await prisma.homepageSection.createMany({ data: defaults });
            sections = await prisma.homepageSection.findMany({ orderBy: { sort_order: 'asc' } });
        }
        setCache('homepage-sections', sections);
        res.json({ success: true, data: sections });
    } catch (err) {
        console.error("CMS HOMEPAGE SECTIONS GET ERROR", err);
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/homepage-sections/reorder', async (req, res) => {
    try {
        const { orderedIds } = req.body;
        for (let i = 0; i < orderedIds.length; i++) {
            await prisma.homepageSection.update({
                where: { id: orderedIds[i] },
                data: { sort_order: i + 1 }
            });
        }
        clearCache('homepage-sections');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.patch('/homepage-sections/:id', async (req, res) => {
    try {
        const { is_active, settings } = req.body;
        const data = {};
        if (is_active !== undefined) data.is_active = is_active;
        if (settings !== undefined) data.settings = settings;

        const section = await prisma.homepageSection.update({
            where: { id: req.params.id },
            data
        });
        clearCache('homepage-sections');
        res.json({ success: true, data: section });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ==========================================
// PROMO BANNERS
// ==========================================
router.get('/promo-banners', async (req, res) => {
    try {
        const cached = getCache('promo-banners');
        if (cached) return res.json({ success: true, data: cached });

        const items = await prisma.promoBanner.findMany({ orderBy: { start_date: 'desc' } });
        setCache('promo-banners', items);
        res.json({ success: true, data: items });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

router.post('/promo-banners', async (req, res) => {
    try {
        const item = await prisma.promoBanner.create({ data: req.body });
        clearCache('promo-banners');
        res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

router.patch('/promo-banners/:id', async (req, res) => {
    try {
        const item = await prisma.promoBanner.update({ where: { id: req.params.id }, data: req.body });
        clearCache('promo-banners');
        res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

router.delete('/promo-banners/:id', async (req, res) => {
    try {
        await prisma.promoBanner.delete({ where: { id: req.params.id } });
        clearCache('promo-banners');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

// ==========================================
// TESTIMONIALS
// ==========================================
router.get('/testimonials', async (req, res) => {
    try {
        const cached = getCache('testimonials');
        if (cached) return res.json({ success: true, data: cached });

        const items = await prisma.testimonial.findMany();
        setCache('testimonials', items);
        res.json({ success: true, data: items });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

router.post('/testimonials', async (req, res) => {
    try {
        const item = await prisma.testimonial.create({ data: req.body });
        clearCache('testimonials');
        res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

router.patch('/testimonials/:id', async (req, res) => {
    try {
        const item = await prisma.testimonial.update({ where: { id: req.params.id }, data: req.body });
        clearCache('testimonials');
        res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

router.delete('/testimonials/:id', async (req, res) => {
    try {
        await prisma.testimonial.delete({ where: { id: req.params.id } });
        clearCache('testimonials');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

// ==========================================
// STATIC PAGES
// ==========================================
router.get('/pages', async (req, res) => {
    try {
        const cached = getCache('pages');
        if (cached) return res.json({ success: true, data: cached });

        const items = await prisma.staticPage.findMany();
        setCache('pages', items);
        res.json({ success: true, data: items });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

router.post('/pages', async (req, res) => {
    try {
        const item = await prisma.staticPage.create({ data: req.body });
        clearCache('pages');
        res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

router.patch('/pages/:id', async (req, res) => {
    try {
        const item = await prisma.staticPage.update({ where: { id: req.params.id }, data: req.body });
        clearCache('pages');
        res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

router.delete('/pages/:id', async (req, res) => {
    try {
        await prisma.staticPage.delete({ where: { id: req.params.id } });
        clearCache('pages');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

// ==========================================
// SEO CONFIG
// ==========================================
router.get('/seo', async (req, res) => {
    try {
        const cached = getCache('seo');
        if (cached) return res.json({ success: true, data: cached });

        let config = await prisma.seoConfig.findUnique({ where: { id: "singleton" } });
        if (!config) {
            config = await prisma.seoConfig.create({ data: { id: "singleton" } });
        }
        setCache('seo', config);
        res.json({ success: true, data: config });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

router.patch('/seo', async (req, res) => {
    try {
        const config = await prisma.seoConfig.update({
            where: { id: "singleton" },
            data: req.body
        });
        clearCache('seo');
        res.json({ success: true, data: config });
    } catch (err) { res.status(500).json({ detail: err.message }); }
});

module.exports = router;
