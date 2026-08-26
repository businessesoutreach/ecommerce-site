/**
 * update-db-images.js
 * Reads image-manifest.json and updates the DB with Cloudinary URLs.
 * Run AFTER upload-images.js: node scripts/update-db-images.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const MANIFEST_PATH = path.join(__dirname, 'image-manifest.json');

function getUrl(manifest, ...keys) {
  for (const key of keys) {
    const found = Object.entries(manifest).find(([k]) => k.includes(key));
    if (found) return found[1];
  }
  return null;
}

function getProductUrls(manifest, slug) {
  return Object.entries(manifest)
    .filter(([k]) => k.includes(/products//))
    .map(([, v]) => v);
}

async function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('Manifest not found. Run upload-images.js first.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  console.log('Loaded manifest with', Object.keys(manifest).length, 'entries.\n');

  // --- Update Hero Slides ---
  const slides = await prisma.heroSlide.findMany({ orderBy: { sort_order: 'asc' } });
  const heroBanners = ['hero_1_street_revolution', 'hero_2_retro_lows', 'hero_3_cloud_runners'];
  for (let i = 0; i < slides.length; i++) {
    const key = heroBanners[i];
    const url = getUrl(manifest, key);
    if (url) {
      await prisma.heroSlide.update({ where: { id: slides[i].id }, data: { image_url: url } });
      console.log(Hero slide [] -> );
    }
  }

  // --- Update Categories ---
  const catMap = { retro: 'category_retro', streetwear: 'category_streetwear', runners: 'category_runners', slides: 'category_slides' };
  for (const [slug, imgKey] of Object.entries(catMap)) {
    const url = getUrl(manifest, imgKey);
    if (url) {
      await prisma.category.update({ where: { slug }, data: { image_url: url } });
      console.log(Category [] -> );
    }
  }

  // --- Update Products ---
  const productSlugMap = {
    'terrace-classic-white-low': '03a6adb6-43b1-4e6d-ac2d-cbbd25225e56',
    'aj4-shadow-grail': '21831171-c6ee-43b2-aa57-ec97dd4cfda1',
    'dunk-high-blue-terrace': '226c4d97-a6dc-44ae-b419-9815d44950dd',
    'oasis-foam-slides': '2a765049-f077-4219-a35f-8dc5a7041d18',
    'boost-knit-cloud-runner': '2b8f4197-1344-408a-8d22-f30c08554fca',
    'court-master-black-panther': 'f2d71e99-adac-4a72-81f2-3c477327f734',
    'aj1-retro-high-ember': '8410b4d6-d123-4e2c-bfac-ecd8235710f0',
    'eqt-street-support-adv': '6e9dc20b-8ca1-4ece-8444-3f17f37edf31',
    'velocity-gray-road-runner': 'bb763f5b-6b03-4701-aff3-f46c3a0204c7',
    'studio-athletic-trainer': '3b10c7a8-9f3f-41fa-be19-d1204c4eb159',
    'adi-mono-panel-low': '79b0c955-ebb3-4af8-ba1b-084a0bc8f20b',
    'oasis-cloud-slide-mono': '9e939ebd-aaad-466b-ac3b-05372981bc0b',
    'cloudstride-marathon-elite': 'f34cdaa3-d7dc-484a-8194-04a402096fd7',
  };

  for (const [slug, id] of Object.entries(productSlugMap)) {
    const urls = getProductUrls(manifest, slug);
    if (urls.length > 0) {
      await prisma.product.update({ where: { id }, data: { images: urls, hover_image: urls[1] || urls[0] } });
      console.log(Product [] ->  images);
    }
  }

  console.log('\nDatabase updated successfully!');
}

main().catch(err => { console.error(err); process.exit(1); }).finally(() => prisma.());
