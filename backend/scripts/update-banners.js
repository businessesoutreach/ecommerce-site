require('dotenv').config({ path: 'h:/SAMI ULLAH/SITES/ecommerce/backend/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Updating Hero Slides and Category Banners in database...');

  // 1. Hero Slides
  await prisma.heroSlide.updateMany({
    where: { title: 'STREET REVOLUTION' },
    data: { image_url: 'https://res.cloudinary.com/p1w5xus9/image/upload/v1787734227/solekicks/banners/hero_1_street_revolution.png' }
  });
  await prisma.heroSlide.updateMany({
    where: { title: 'RETRO LOWS & COURT MASTERS' },
    data: { image_url: 'https://res.cloudinary.com/p1w5xus9/image/upload/v1787734295/solekicks/banners/hero_2_retro_lows.png' }
  });
  await prisma.heroSlide.updateMany({
    where: { title: 'MAX SPEED CLOUD RUNNERS' },
    data: { image_url: 'https://res.cloudinary.com/p1w5xus9/image/upload/v1787734370/solekicks/banners/hero_3_cloud_runners.png' }
  });

  // 2. Categories
  await prisma.category.update({
    where: { slug: 'retro' },
    data: { image_url: 'https://res.cloudinary.com/p1w5xus9/image/upload/v1787734431/solekicks/categories/category_retro.png' }
  });
  await prisma.category.update({
    where: { slug: 'streetwear' },
    data: { image_url: 'https://res.cloudinary.com/p1w5xus9/image/upload/v1787734495/solekicks/categories/category_streetwear.png' }
  });
  await prisma.category.update({
    where: { slug: 'runners' },
    data: { image_url: 'https://res.cloudinary.com/p1w5xus9/image/upload/v1787734563/solekicks/categories/category_runners.png' }
  });
  await prisma.category.update({
    where: { slug: 'slides' },
    data: { image_url: 'https://res.cloudinary.com/p1w5xus9/image/upload/v1787734640/solekicks/categories/category_slides.png' }
  });

  console.log('Successfully updated Hero Slides and Category Banners!');
}

run()
  .catch(err => {
    console.error('Error updating banners:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

