require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const STANDARDIZED_CATALOG = {
  "aj4-retro-white-oreo": {
    name: "AJ-4 Retro 'White Oreo' Premium",
    images: [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=85&w=1200",
      "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?q=85&w=1200",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=85&w=1200"
    ]
  },
  "dunk-low-coastline-blue": {
    name: "Dunk Low 'Coastline Blue'",
    images: [
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=85&w=1200",
      "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=85&w=1200",
      "https://images.unsplash.com/photo-1620138546344-7b2c38516fc5?q=85&w=1200"
    ]
  },
  "cloudstratus-surge-pro": {
    name: "CloudStratus Surge Pro Runner",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=85&w=1200",
      "https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=85&w=1200",
      "https://images.unsplash.com/photo-1562183241-b937e95585b6?q=85&w=1200"
    ]
  },
  "oasis-foam-slides": {
    name: "Oasis Foam Recovery Slides",
    images: [
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?q=85&w=1200",
      "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?q=85&w=1200",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=85&w=1200"
    ]
  },
  "court-master-black-panther": {
    name: "Court Master Black Panther",
    images: [
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=85&w=1200",
      "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?q=85&w=1200",
      "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=85&w=1200"
    ]
  },
  "terrace-classic-white-low": {
    name: "Terrace Classic White Low",
    images: [
      "https://images.unsplash.com/photo-1559050993-d4e4fbf11769?q=85&w=1200",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=85&w=1200",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=85&w=1200"
    ]
  },
  "eqt-street-support-adv": {
    name: "EQT Street Support ADV",
    images: [
      "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=85&w=1200",
      "https://images.unsplash.com/photo-1597892657493-6847b9640bac?q=85&w=1200",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=85&w=1200"
    ]
  },
  "velocity-gray-road-runner": {
    name: "Velocity Gray Road Runner",
    images: [
      "https://images.unsplash.com/photo-1539185441755-769473a23570?q=85&w=1200",
      "https://images.unsplash.com/photo-1562183241-b937e95585b6?q=85&w=1200",
      "https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=85&w=1200"
    ]
  },
  "aj1-retro-high-ember": {
    name: "AJ-1 Retro High 'Ember'",
    images: [
      "https://images.unsplash.com/photo-1556906781-9a412961c28c?q=85&w=1200",
      "https://images.unsplash.com/photo-1579338559194-a162d19bf842?q=85&w=1200",
      "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?q=85&w=1200"
    ]
  },
  "boost-knit-cloud-runner": {
    name: "Boost Knit Cloud Runner",
    images: [
      "https://images.unsplash.com/photo-1645106281638-79585657aa4e?q=85&w=1200",
      "https://images.unsplash.com/photo-1587587448924-b5a1db520d29?q=85&w=1200",
      "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=85&w=1200"
    ]
  },
  "studio-athletic-trainer": {
    name: "Studio Athletic Trainer",
    images: [
      "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=85&w=1200",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=85&w=1200",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=85&w=1200"
    ]
  },
  "adi-mono-panel-low": {
    name: "Adi Mono Panel Low",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=85&w=1200",
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=85&w=1200",
      "https://images.unsplash.com/photo-1559050993-d4e4fbf11769?q=85&w=1200"
    ]
  },
  "oasis-cloud-slide-mono": {
    name: "Oasis Cloud Slide Mono",
    images: [
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?q=85&w=1200",
      "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?q=85&w=1200",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=85&w=1200"
    ]
  },
  "aj4-shadow-grail": {
    name: "AJ-4 Shadow Grail",
    images: [
      "https://images.unsplash.com/photo-1640016713197-76fe85053279?q=85&w=1200",
      "https://images.unsplash.com/photo-1612902377668-68ec50954ad9?q=85&w=1200",
      "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=85&w=1200"
    ]
  },
  "dunk-high-blue-terrace": {
    name: "Dunk High 'Blue Terrace'",
    images: [
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=85&w=1200",
      "https://images.unsplash.com/photo-1620138546344-7b2c38516fc5?q=85&w=1200",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=85&w=1200"
    ]
  },
  "cloudstride-marathon-elite": {
    name: "CloudStride Marathon Elite",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=85&w=1200",
      "https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=85&w=1200",
      "https://images.unsplash.com/photo-1562183241-b937e95585b6?q=85&w=1200"
    ]
  }
};

async function main() {
  console.log("=== STARTING SNEAKER CATALOG STANDARDIZATION ===");
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products in database to process.`);

  let updatedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    const itemConfig = STANDARDIZED_CATALOG[prod.slug];

    if (!itemConfig) {
      console.log(`[${i + 1}/${products.length}] No custom config for ${prod.slug}, skipping.`);
      continue;
    }

    console.log(`\n[${i + 1}/${products.length}] Standardizing "${prod.name}" (${prod.slug})...`);
    const uploadedUrls = [];

    for (let imgIdx = 0; imgIdx < itemConfig.images.length; imgIdx++) {
      const srcUrl = itemConfig.images[imgIdx];
      const publicId = `${prod.slug}_angle_${imgIdx + 1}`;

      try {
        console.log(`  -> Uploading angle ${imgIdx + 1}/${itemConfig.images.length}...`);
        const uploadRes = await cloudinary.uploader.upload(srcUrl, {
          folder: 'solekicks/catalog',
          public_id: publicId,
          overwrite: true,
          transformation: [
            { width: 1000, height: 1000, crop: 'pad', background: 'white' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        });

        uploadedUrls.push(uploadRes.secure_url);
        console.log(`     OK: ${uploadRes.secure_url}`);
      } catch (uploadErr) {
        console.error(`     FAILED uploading angle ${imgIdx + 1}:`, uploadErr.message);
        uploadedUrls.push(srcUrl); // Fallback to source
      }
    }

    // Update DB record
    const hoverImage = uploadedUrls[1] || uploadedUrls[0];
    await prisma.product.update({
      where: { id: prod.id },
      data: {
        images: uploadedUrls,
        hover_image: hoverImage
      }
    });

    updatedCount++;
    console.log(`  ✓ Updated DB for "${prod.name}" with ${uploadedUrls.length} standardized angles.`);
  }

  console.log(`\n=== COMPLETED! Standardized ${updatedCount} products successfully. ===`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Fatal standardization error:", e);
  await prisma.$disconnect();
  process.exit(1);
});

