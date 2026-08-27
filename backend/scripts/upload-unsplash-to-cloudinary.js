require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 15 High-quality sneaker images from Unsplash (mix of retro, runner, streetwear, slides)
const SNEAKER_IMAGES = [
  "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1024&auto=format&fit=crop", // Retro / High
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1024&auto=format&fit=crop", // Red runner/street
  "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=1024&auto=format&fit=crop", // Clean white sneaker
  "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?q=80&w=1024&auto=format&fit=crop", // Retro Jordan
  "https://images.unsplash.com/photo-1579338559194-a162d19bf842?q=80&w=1024&auto=format&fit=crop", // Jordan
  "https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=1024&auto=format&fit=crop", // Runner
  "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1024&auto=format&fit=crop", // Lifestyle
  "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=1024&auto=format&fit=crop", // Streetwear dunk style
  "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1024&auto=format&fit=crop", // Vans/Street
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1024&auto=format&fit=crop", // Retro
  "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=1024&auto=format&fit=crop", // Sport
  "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?q=80&w=1024&auto=format&fit=crop", // Elegant casual
  "https://images.unsplash.com/photo-1620138546344-7b2c38516fc5?q=80&w=1024&auto=format&fit=crop", // Yellow/Blue streetwear
  "https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1024&auto=format&fit=crop", // General sneaker
  "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=1024&auto=format&fit=crop"  // Runner / Athletics
];

async function main() {
  console.log('Starting Cloudinary upload and DB update script...');
  const products = await prisma.product.findMany({
    select: { id: true, name: true, category_slug: true }
  });

  console.log(`Found ${products.length} products to update.`);

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const sourceUrl = SNEAKER_IMAGES[i % SNEAKER_IMAGES.length];
    
    console.log(`\n[${i + 1}/${products.length}] Processing "${p.name}"...`);

    try {
      console.log(`  -> Uploading to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(sourceUrl, {
        folder: 'solekicks/products',
        public_id: `product_${p.id.substring(0, 8)}`,
        overwrite: true
      });

      const secureUrl = uploadResult.secure_url;
      console.log(`  -> Uploaded! URL: ${secureUrl}`);

      // Update DB
      await prisma.product.update({
        where: { id: p.id },
        data: { 
            images: [secureUrl], 
            hover_image: null 
        }
      });

      console.log(`  -> Database updated for ${p.name}`);
      
    } catch (err) {
      console.error(`  -> ERROR processing ${p.name}:`, err.message);
    }
  }

  console.log('\nAll done! Cloudinary and Database have been fully updated.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
