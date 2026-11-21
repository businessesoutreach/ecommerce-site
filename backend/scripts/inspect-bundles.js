const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const bundles = await prisma.productBundle.findMany({
    include: { items: { include: { product: true } } }
  });
  console.log('Existing bundles:', bundles.length);
  bundles.forEach(b => console.log('-', b.name, 'Price:', b.bundle_price, 'Items:', b.items.length));

  const products = await prisma.product.findMany({
    select: { id: true, name: true, base_price: true, images: true, category_slug: true, brand_slug: true }
  });
  console.log('Total available products:', products.length);
  products.slice(0, 10).forEach(p => console.log(p.id, '|', p.name, '|', p.base_price));

  await prisma.$disconnect();
}

run().catch(console.error);

