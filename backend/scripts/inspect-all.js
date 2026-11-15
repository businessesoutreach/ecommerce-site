require('dotenv').config({ path: 'h:/SAMI ULLAH/SITES/ecommerce/backend/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const slides = await prisma.heroSlide.findMany();
  console.log('SLIDES:', JSON.stringify(slides.map(s => ({ title: s.title, img: s.image_url })), null, 2));

  const cats = await prisma.category.findMany();
  console.log('CATEGORIES:', JSON.stringify(cats.map(c => ({ name: c.name, img: c.image_url })), null, 2));

  const products = await prisma.product.findMany();
  console.log('PRODUCTS COUNT:', products.length);
  for (const p of products) {
    console.log(`- [${p.slug}] ${p.name}`);
    console.log(`  images (${p.images?.length || 0}):`, p.images);
  }
}

check().finally(() => prisma.$disconnect());

