require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { OpenAI } = require('openai');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function main() {
  console.log('Starting image generation script...');
  const products = await prisma.product.findMany({
    select: { id: true, name: true, category_slug: true, images: true }
  });

  console.log(`Found ${products.length} products to update.`);

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`\n[${i + 1}/${products.length}] Processing "${p.name}" (${p.category_slug})...`);

    try {
      // 1. Generate Image with DALL-E 3
      const prompt = `Professional studio product photography of a premium sneaker named '${p.name}'. The style is ${p.category_slug}. The sneaker is isolated perfectly on a clean, bright white background. High resolution, hyper-realistic, photorealistic, 4k, studio lighting, highly detailed. ONLY the sneaker, no text, no logos, no people.`;
      
      console.log(`  -> Generating image...`);
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024'
      });

      const imageUrl = response.data[0].url;
      console.log(`  -> Image generated successfully.`);

      // 2. Upload to Cloudinary
      console.log(`  -> Uploading to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(imageUrl, {
        folder: 'solekicks/products',
        public_id: `product_${p.id.substring(0, 8)}`,
        overwrite: true
      });

      const secureUrl = uploadResult.secure_url;
      console.log(`  -> Uploaded! URL: ${secureUrl}`);

      // 3. Update DB
      const newImages = [secureUrl];

      await prisma.product.update({
        where: { id: p.id },
        data: { images: newImages, hover_image: null }
      });

      console.log(`  -> Database updated for ${p.name}`);
      
    } catch (err) {
      console.error(`  -> ERROR processing ${p.name}:`, err.message);
    }
  }

  console.log('\nAll done!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
