require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const cloudinary = require('../node_modules/cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const localDbUrl = 'postgresql://postgres:%40Bahadurkhan7@localhost:5432/sneakpk?schema=public';
const remoteDirectUrl = 'postgresql://postgres.mpfwfcudwgyydxjxkyso:%40Bahadurkhan7@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

const localPrisma = new PrismaClient({ datasources: { db: { url: localDbUrl } } });
const remotePrisma = new PrismaClient({ datasources: { db: { url: remoteDirectUrl } } });

async function uploadAndApply() {
  const images = [
    {
      slug: 'velocity-gray-road-runner',
      sourcePath: 'C:\\Users\\wahee\\.gemini\\antigravity\\brain\\2d10ec65-4fa3-46e2-b418-e3f80cedc611\\velocity_gray_road_runner_1794731407290.jpg',
      destDir: path.join(__dirname, '../../frontend/public/images/products/velocity-gray-road-runner'),
      publicId: '1-side',
    },
    {
      slug: 'cloudstratus-surge-pro',
      sourcePath: 'C:\\Users\\wahee\\.gemini\\antigravity\\brain\\2d10ec65-4fa3-46e2-b418-e3f80cedc611\\cloudstratus_surge_pro_runner_1794731439247.jpg',
      destDir: path.join(__dirname, '../../frontend/public/images/products/cloudstratus-surge-pro'),
      publicId: '1-side',
    }
  ];

  for (const item of images) {
    if (!fs.existsSync(item.sourcePath)) {
      console.error(`File not found: ${item.sourcePath}`);
      continue;
    }

    // Ensure frontend public directory exists and copy file
    if (!fs.existsSync(item.destDir)) {
      fs.mkdirSync(item.destDir, { recursive: true });
    }
    const localDest = path.join(item.destDir, `${item.publicId}.jpg`);
    fs.copyFileSync(item.sourcePath, localDest);
    console.log(`Saved local image to: ${localDest}`);

    // Upload to Cloudinary
    console.log(`Uploading ${item.slug} to Cloudinary...`);
    const uploadRes = await cloudinary.uploader.upload(item.sourcePath, {
      folder: `solekicks/products/${item.slug}`,
      public_id: item.publicId,
      overwrite: true,
      resource_type: 'image',
      quality: 'auto:best',
    });

    const secureUrl = uploadRes.secure_url;
    console.log(`✔ Uploaded to Cloudinary: ${secureUrl}`);

    // Update Local DB
    await localPrisma.product.update({
      where: { slug: item.slug },
      data: {
        images: [secureUrl],
        hover_image: secureUrl,
      }
    });
    console.log(`✔ Updated local DB for ${item.slug}`);

    // Update Remote Supabase DB
    const remoteProduct = await remotePrisma.product.findUnique({ where: { slug: item.slug } });
    if (remoteProduct) {
      await remotePrisma.product.update({
        where: { id: remoteProduct.id },
        data: {
          images: [secureUrl],
          hover_image: secureUrl,
        }
      });
      console.log(`✔ Updated Supabase DB for ${item.slug}`);
    } else {
      console.log(`⚠ Product ${item.slug} not found in Supabase DB.`);
    }
  }

  // Clear in-memory cache on local Express server
  try {
    const memoryCache = require('../src/utils/cache');
    memoryCache.flush();
    console.log('✔ Flushed in-memory cache');
  } catch (e) {
    console.log('Cache flush notice:', e.message);
  }

  await localPrisma.$disconnect();
  await remotePrisma.$disconnect();
  console.log('\nAll runner photos updated successfully!');
}

uploadAndApply().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
