const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const IMG = {
    "aj4": "https://images.unsplash.com/photo-1640016713197-76fe85053279?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "aj4b": "https://images.unsplash.com/photo-1612902377668-68ec50954ad9?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "dunk": "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "dunkb": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "runner": "https://images.unsplash.com/photo-1746206673199-5b75dcec1018?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "runnerb": "https://images.unsplash.com/photo-1587587448924-b5a1db520d29?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "slide": "https://images.pexels.com/photos/18110858/pexels-photo-18110858.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "slideb": "https://images.pexels.com/photos/16350687/pexels-photo-16350687.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "black": "https://images.unsplash.com/photo-1786379582186-83ef57a1c420?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "whitelow": "https://images.unsplash.com/photo-1559050993-d4e4fbf11769?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "adidas": "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "athletic": "https://images.pexels.com/photos/14212621/pexels-photo-14212621.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "eqt": "https://images.unsplash.com/photo-1597892657493-6847b9640bac?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "aj1": "https://images.unsplash.com/photo-1556906781-9a412961c28c?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "grayrun": "https://images.unsplash.com/photo-1562183241-b937e95585b6?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "yeezy": "https://images.unsplash.com/photo-1645106281638-79585657aa4e?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "retro": "https://images.pexels.com/photos/4061385/pexels-photo-4061385.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "street": "https://images.unsplash.com/photo-1641997465126-c73cc4070337?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"
};

const HERO_SLIDES = [
    { title: "STREET REVOLUTION", subtitle: "High-heat streetwear silhouettes & retro re-issues engineered for urban dominance across Pakistan.", button_text: "SHOP NEW RELEASES", link: "/new-arrivals", image_url: "https://images.unsplash.com/photo-1615440321519-dda3d4b5ccab?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600", sort_order: 0 },
    { title: "RETRO LOWS & COURT MASTERS", subtitle: "Timeless terrace vibes, chunkier midsoles, and everyday luxury crafted for maximum comfort.", button_text: "EXPLORE RETRO KICKS", link: "/collections/retro", image_url: "https://images.unsplash.com/photo-1670948516733-0220701ea0de?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600", sort_order: 1 },
    { title: "MAX SPEED CLOUD RUNNERS", subtitle: "Engineered propulsion foam and hyper-breathable knit. Designed for the track, styled for the street.", button_text: "DISCOVER RUNNERS", link: "/collections/runners", image_url: "https://images.unsplash.com/photo-1597892657493-6847b9640bac?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600", sort_order: 2 }
];

const CATEGORIES = [
    { name: "Retro & High Tops", slug: "retro", image_url: IMG.retro, sort_order: 0 },
    { name: "Everyday Streetwear", slug: "streetwear", image_url: IMG.street, sort_order: 1 },
    { name: "Performance Runners", slug: "runners", image_url: IMG.grayrun, sort_order: 2 },
    { name: "Recovery Slides & Foam", slug: "slides", image_url: IMG.slide, sort_order: 3 }
];

const BRANDS = [
    { name: "AirVault", slug: "airvault" },
    { name: "Terrace Co", slug: "terrace-co" },
    { name: "CloudStride", slug: "cloudstride" },
    { name: "Oasis", slug: "oasis" }
];

const EU_SIZES = ["39", "40", "41", "42", "43", "44", "45", "46"];

function getSizes(lowStock = false) {
    return EU_SIZES.map(s => ({
        id: uuidv4(),
        size: s,
        stock: lowStock && ["42", "43"].includes(s) ? (s === "42" ? 3 : 2) : 8
    }));
}

const _PRODUCTS = [
    ["AJ-4 Retro 'White Oreo' Premium", "aj4-retro-white-oreo", "retro", "airvault", 8999, 14500, "aj4", "aj4b", ["featured", "new", "best"]],
    ["Dunk Low 'Coastline Blue'", "dunk-low-coastline-blue", "streetwear", "terrace-co", 7499, 11999, "dunk", "dunkb", ["featured", "flash", "best"]],
    ["CloudStratus Surge Pro Runner", "cloudstratus-surge-pro", "runners", "cloudstride", 9250, 15000, "runner", "runnerb", ["featured", "new"]],
    ["Oasis Foam Recovery Slides", "oasis-foam-slides", "slides", "oasis", 3899, 5500, "slide", "slideb", ["best", "flash"]],
    ["Court Master Black Panther", "court-master-black-panther", "retro", "airvault", 8250, 12500, "black", "aj1", ["new", "best"]],
    ["Terrace Classic White Low", "terrace-classic-white-low", "streetwear", "terrace-co", 6999, 9999, "whitelow", "adidas", ["featured", "new"]],
    ["EQT Street Support ADV", "eqt-street-support-adv", "streetwear", "terrace-co", 7899, 10999, "eqt", "street", ["flash"]],
    ["Velocity Gray Road Runner", "velocity-gray-road-runner", "runners", "cloudstride", 8499, 13000, "grayrun", "runner", ["new", "best"]],
    ["AJ-1 Retro High 'Ember'", "aj1-retro-high-ember", "retro", "airvault", 10500, 16500, "aj1", "aj4", ["featured", "flash", "best"]],
    ["Boost Knit Cloud Runner", "boost-knit-cloud-runner", "runners", "cloudstride", 9899, 14999, "yeezy", "grayrun", ["new"]],
    ["Studio Athletic Trainer", "studio-athletic-trainer", "streetwear", "terrace-co", 6499, 8999, "athletic", "whitelow", ["best"]],
    ["Adi Mono Panel Low", "adi-mono-panel-low", "streetwear", "terrace-co", 7299, 10500, "adidas", "black", ["new"]],
    ["Oasis Cloud Slide Mono", "oasis-cloud-slide-mono", "slides", "oasis", 3499, 4999, "slideb", "slide", ["flash"]],
    ["AJ-4 Shadow Grail", "aj4-shadow-grail", "retro", "airvault", 11250, 17000, "aj4b", "aj4", ["featured", "best"]],
    ["Dunk High 'Blue Terrace'", "dunk-high-blue-terrace", "retro", "terrace-co", 8799, 12999, "dunkb", "dunk", ["new", "best"]],
    ["CloudStride Marathon Elite", "cloudstride-marathon-elite", "runners", "cloudstride", 10999, 16000, "runnerb", "runner", ["featured", "flash"]]
];

async function hashPassword(p) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(p, salt);
}

async function main() {
    console.log("Seeding database...");

    const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD || "Admin@123";
    
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
        await prisma.user.create({
            data: {
                id: uuidv4(),
                name: "Store Owner",
                email: adminEmail,
                password_hash: await hashPassword(adminPass),
                role: "admin",
                is_blocked: false
            }
        });
    }

    let customer = await prisma.user.findUnique({ where: { email: "customer@test.com" } });
    if (!customer) {
        await prisma.user.create({
            data: {
                id: uuidv4(),
                name: "Test Customer",
                email: "customer@test.com",
                password_hash: await hashPassword("Test@12345"),
                role: "customer",
                is_blocked: false
            }
        });
    }

    const settingsCount = await prisma.settings.count();
    if (settingsCount === 0) {
        await prisma.settings.create({
            data: {
                id: "singleton",
                announcement_text: "⚡ FLASH DROP: 15% OFF ORDERS OVER RS. 9,999 · FREE SHIPPING ON ORDERS OVER RS. 5,000 · 7-DAY EXCHANGE",
                announcement_active: true,
                free_shipping_min_amt: 5000,
                flat_shipping_fee: 250,
                advance_payment_threshold: 20000,
                advance_payment_percent: 10,
                cod_enabled: true,
                card_enabled: true,
                wallet_enabled: true,
                whatsapp_number: "923001234567",
                supported_countries: ["PK"]
            }
        });
    }

    const zoneCount = await prisma.shippingZone.count();
    if (zoneCount === 0) {
        await prisma.shippingZone.create({
            data: {
                id: uuidv4(),
                country_code: "PK",
                flat_fee: 250,
                free_shipping_min: 5000,
                is_active: true
            }
        });
    }

    const catCount = await prisma.category.count();
    if (catCount === 0) {
        for (const c of CATEGORIES) {
            await prisma.category.create({ data: { id: uuidv4(), is_active: true, ...c } });
        }
    }

    const brandCount = await prisma.brand.count();
    if (brandCount === 0) {
        for (const b of BRANDS) {
            await prisma.brand.create({ data: { id: uuidv4(), ...b } });
        }
    }

    const heroCount = await prisma.heroSlide.count();
    if (heroCount === 0) {
        for (const h of HERO_SLIDES) {
            await prisma.heroSlide.create({ data: { id: uuidv4(), is_active: true, ...h } });
        }
    }

    const prodCount = await prisma.product.count();
    if (prodCount === 0) {
        for (let i = 0; i < _PRODUCTS.length; i++) {
            const [name, slug, cat, brand, price, comp, pimg, himg, flags] = _PRODUCTS[i];
            
            const images = [IMG[pimg], IMG[himg]];
            if (IMG.street) images.push(IMG.street);
            if (IMG.black) images.push(IMG.black);
            
            await prisma.product.create({
                data: {
                    id: uuidv4(),
                    name,
                    slug,
                    category_slug: cat,
                    brand_slug: brand,
                    description: `The ${name} blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.`,
                    base_price: price,
                    compare_at_price: comp,
                    images,
                    hover_image: IMG[himg],
                    is_featured: flags.includes("featured"),
                    is_new_arrival: flags.includes("new"),
                    is_best_seller: flags.includes("best"),
                    is_flash_sale: flags.includes("flash"),
                    status: "active",
                    avg_rating: 4.6 + (i % 5) * 0.08,
                    review_count: 40 + i * 7,
                    sort_order: i,
                    sizes: {
                        create: getSizes(flags.includes("best"))
                    }
                }
            });
        }
    }

    const couponCount = await prisma.coupon.count();
    if (couponCount === 0) {
        const coupons = [
            { code: "STREET15", type: "percentage", value: 15, min_order_value: 9999 },
            { code: "JUTAY10", type: "percentage", value: 10, min_order_value: 0 },
            { code: "FLAT500", type: "flat", value: 500, min_order_value: 5000 }
        ];
        
        for (const c of coupons) {
            await prisma.coupon.create({
                data: {
                    id: uuidv4(),
                    ...c,
                    used_count: 0,
                    is_active: true
                }
            });
        }
    }

    const reviewCount = await prisma.review.count();
    if (reviewCount === 0) {
        const prods = await prisma.product.findMany({ take: 4 });
        const samples = [
            ["Hamza Tariq", 5, "Delivered in 2 days to DHA Lahore via COD! The cushioning is insane."],
            ["Zeeshan Malik", 5, "Size 43 fit true to chart. Exchange policy gave me full confidence."],
            ["Ali Raza", 5, "Hands down best sneaker cop in Pakistan. Packaging was top tier."]
        ];
        
        for (const p of prods) {
            for (const [name, rating, text] of samples) {
                await prisma.review.create({
                    data: {
                        id: uuidv4(),
                        product_id: p.id,
                        customer_name: name,
                        rating,
                        comment: text,
                        image_urls: [],
                        is_approved: true
                    }
                });
            }
        }
    }

    console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
