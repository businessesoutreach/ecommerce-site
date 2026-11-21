const prisma = require('../src/db');
const { v4: uuidv4 } = require('uuid');

async function seedReviews() {
    console.log("Seeding rich authentic reviews across sneaker catalog...");

    const products = await prisma.product.findMany();
    const orders = await prisma.order.findMany({ take: 10 });

    if (products.length === 0) {
        console.log("No products found.");
        return;
    }

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const sampleReviews = [
        {
            customer_name: "Bilal Ahmed Khan",
            rating: 5,
            comment: "Absolutely top notch quality! The leather on the Dunk Low is buttery smooth and the stitching is flawless. Delivered to Gulberg Lahore in 48 hours via TCS COD.",
            status: "approved",
            admin_reply: "Thank you so much Bilal! We inspect every pair before dispatching to ensure top tier standards. Enjoy rocking them!",
            daysAgo: 1,
            product_slug_substr: "dunk-low"
        },
        {
            customer_name: "Saad Farooq",
            rating: 5,
            comment: "The AJ-4 White Oreo is unreal in person. Air cushioning feels plush, and the cement speckles on the eyelets are crisp. Came with extra laces and sticker pack.",
            status: "approved",
            admin_reply: "Appreciate the love Saad! The White Oreo is definitely one of our all-time Grails. Wear them in good health!",
            daysAgo: 2,
            product_slug_substr: "aj-4-retro"
        },
        {
            customer_name: "Zainab Mir",
            rating: 5,
            comment: "Bought the Oasis Slides for post-gym recovery and lounging. Easily the softest EVA foam footbed I've experienced. Fits true to size.",
            status: "approved",
            admin_reply: null,
            daysAgo: 2,
            product_slug_substr: "oasis"
        },
        {
            customer_name: "Usman Ghani",
            rating: 4,
            comment: "Boost knit runner is super breathable for Karachi humidity. Soles grip well on wet tiles. Only deduction is box had a minor crease from courier transit.",
            status: "approved",
            admin_reply: "Thanks Usman! We have upgraded our outer protective courier bubble wrap to keep boxes mint. Glad the runners are performing great!",
            daysAgo: 3,
            product_slug_substr: "boost-knit"
        },
        {
            customer_name: "Omer Hashmi",
            rating: 5,
            comment: "Terrace Classic White Low is clean, minimal, and matches with everything from chinos to denim. Insole arch support is surprisingly good for a court shoe.",
            status: "approved",
            admin_reply: null,
            daysAgo: 3,
            product_slug_substr: "terrace"
        },
        {
            customer_name: "Hamza Siddiqui",
            rating: 5,
            comment: "Ordered CloudStratus Surge Pro for morning 10K runs in F-9 park Islamabad. Energy return is legit and heel lockdown is snug without pinching.",
            status: "approved",
            admin_reply: null,
            daysAgo: 4,
            product_slug_substr: "cloudstratus"
        },
        {
            customer_name: "Daniyal Qureshi",
            rating: 4,
            comment: "Court Master Black Panther edition looks aggressive on feet. Solid ankle collar padding. Needs a day or two of wear to break in the forefoot leather.",
            status: "approved",
            admin_reply: null,
            daysAgo: 4,
            product_slug_substr: "court-master"
        },
        {
            customer_name: "Mustafa Javed",
            rating: 5,
            comment: "AJ-1 Retro High Ember colorway is fire. Red leather hue matches the product photos exactly. 10/10 shopping experience.",
            status: "approved",
            admin_reply: "Love to hear that Mustafa! The Ember High is iconic. Thanks for choosing SoleVault PK!",
            daysAgo: 5,
            product_slug_substr: "aj-1"
        },
        {
            customer_name: "Arham Sheikh",
            rating: 4,
            comment: "Velocity Gray Road Runner is featherlight. Ideal daily beater for university and walking. Delivery was prompt.",
            status: "approved",
            admin_reply: null,
            daysAgo: 5,
            product_slug_substr: "velocity"
        },
        {
            customer_name: "Fahad Tariq",
            rating: 5,
            comment: "EQT Street ADV support is top tier. The neoprene sockliner wraps the foot comfortably and the lacing cage locks the heel in place.",
            status: "approved",
            admin_reply: null,
            daysAgo: 6,
            product_slug_substr: "eqt"
        },
        {
            customer_name: "Shahmir Raza",
            rating: 3,
            comment: "Sneakers look good overall but size 42 was a bit narrow for my wide feet. Exchanged for 43 smoothly through WhatsApp support.",
            status: "approved",
            admin_reply: "We appreciate your honest feedback Shahmir! We recommend going half-to-one size up for wide feet. Glad the exchange team took care of you quickly!",
            daysAgo: 6,
            product_slug_substr: "adi-mono"
        },
        {
            customer_name: "Talha Mehmood",
            rating: 5,
            comment: "Dunk High Blue Terrace hits different. Colors pop nicely with baggier cargos. Authentic packaging and receipt included.",
            status: "approved",
            admin_reply: null,
            daysAgo: 7,
            product_slug_substr: "dunk-high"
        },
        // Pending Reviews needing admin review/approval
        {
            customer_name: "Kashif Nisar",
            rating: 5,
            comment: "Just unboxed my AJ-4 Shadow Grail. Hands down the cleanest black and charcoal suede pair in my rotation. Super hyped to wear them this weekend!",
            status: "pending",
            admin_reply: null,
            daysAgo: 0,
            product_slug_substr: "shadow"
        },
        {
            customer_name: "Areeba Shah",
            rating: 4,
            comment: "CloudStride Marathon Elite arrived today in Multan. Extremely lightweight and springy foam. Can't wait to test on long distance run tomorrow.",
            status: "pending",
            admin_reply: null,
            daysAgo: 0,
            product_slug_substr: "cloudstride"
        },
        {
            customer_name: "Waleed Anis",
            rating: 5,
            comment: "Studio Athletic Trainer has great flat base stability for squats and deadlifts in the gym. Grip pattern doesn't slip at all.",
            status: "pending",
            admin_reply: null,
            daysAgo: 1,
            product_slug_substr: "studio"
        },
        {
            customer_name: "Naveed Akram",
            rating: 4,
            comment: "Ordered Oasis Cloud Slide in Mono Black. Super comfortable for home and casual runs. Quick COD verification call from customer rep.",
            status: "pending",
            admin_reply: null,
            daysAgo: 1,
            product_slug_substr: "oasis"
        },
        // Reported / Flagged reviews
        {
            customer_name: "Anonymous User",
            rating: 1,
            comment: "Fake discount advertising, checkout prices changed. spam link: http://external-offer-scam.test",
            status: "reported",
            report_reason: "Spam link and inappropriate promotion",
            admin_reply: null,
            daysAgo: 2,
            product_slug_substr: "dunk"
        },
        {
            customer_name: "ShoeCollector99",
            rating: 2,
            comment: "Courier rider was late by 3 hours after sending delivery SMS. The sneakers themselves are nice though.",
            status: "reported",
            report_reason: "Delivery complaint unrelated to product quality",
            admin_reply: null,
            daysAgo: 3,
            product_slug_substr: "aj-4"
        },
        // Rejected review
        {
            customer_name: "Bot1234",
            rating: 1,
            comment: "test 123 asdfasdfasdf qwerty",
            status: "rejected",
            admin_reply: null,
            daysAgo: 5,
            product_slug_substr: "adi-mono"
        }
    ];

    let inserted = 0;
    for (let i = 0; i < sampleReviews.length; i++) {
        const item = sampleReviews[i];
        
        // Find matching product
        const matchedProduct = products.find(p => p.slug.includes(item.product_slug_substr)) || products[i % products.length];
        const matchedOrder = orders[i % orders.length];

        const createdAt = new Date(now - (item.daysAgo * day) - Math.floor(Math.random() * 3600000 * 6));

        await prisma.review.create({
            data: {
                id: uuidv4(),
                product_id: matchedProduct.id,
                order_id: item.status === 'approved' ? matchedOrder?.id : null,
                customer_name: item.customer_name,
                rating: item.rating,
                comment: item.comment,
                status: item.status,
                admin_reply: item.admin_reply,
                report_reason: item.report_reason || null,
                created_at: createdAt
            }
        });
        inserted++;
    }

    console.log(`Successfully created ${inserted} rich reviews!`);

    // Recalculate avg_rating and review_count on all products
    console.log("Recalculating avg_rating and review_count on all products...");
    for (const p of products) {
        const approvedReviews = await prisma.review.findMany({
            where: { product_id: p.id, status: 'approved' }
        });
        const count = approvedReviews.length;
        const avg = count > 0 
            ? Number((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
            : 5.0;

        await prisma.product.update({
            where: { id: p.id },
            data: { avg_rating: avg, review_count: count }
        });
    }

    console.log("Done updating product rating metrics!");
}

seedReviews()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
