const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== Assigning Fallback Images ===");

  // 1. Fetch products that ALREADY have valid Cloudinary images
  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, category_slug: true, images: true }
  });

  const workingProducts = allProducts.filter(p => 
    p.images && p.images.length >= 4 && p.images[0].includes('cloudinary')
  );

  console.log(`Found ${workingProducts.length} products with valid Cloudinary images.`);

  // 2. Map fallbacks based on category or just a generic fallback
  const fallbackMap = {
    'streetwear': workingProducts.find(p => p.category_slug === 'streetwear') || workingProducts[0],
    'runners': workingProducts.find(p => p.category_slug === 'runners') || workingProducts[0],
    'retro': workingProducts.find(p => p.category_slug === 'retro') || workingProducts[0],
    'slides': workingProducts.find(p => p.category_slug === 'slides') || workingProducts[0],
  };

  const remainingProducts = allProducts.filter(p => 
    !p.images || p.images.length === 0 || !p.images[0].includes('cloudinary')
  );

  console.log(`Found ${remainingProducts.length} products needing fallback images.`);

  for (const product of remainingProducts) {
    const fallbackSource = fallbackMap[product.category_slug] || workingProducts[0];
    if (fallbackSource) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: fallbackSource.images,
          hover_image: fallbackSource.images[1] || fallbackSource.images[0]
        }
      });
      console.log(`Assigned images from "${fallbackSource.name}" to "${product.name}"`);
    } else {
      console.log(`Could not find a fallback for "${product.name}"`);
    }
  }

  console.log("=== ALL DONE ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
