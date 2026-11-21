const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding test product bundles...');

  const aj4 = await prisma.product.findFirst({ where: { name: { contains: 'White Oreo' } } });
  const dunkLow = await prisma.product.findFirst({ where: { name: { contains: 'Coastline Blue' } } });
  const cloudStratus = await prisma.product.findFirst({ where: { name: { contains: 'CloudStratus' } } });
  const velocity = await prisma.product.findFirst({ where: { name: { contains: 'Velocity Gray' } } });
  const dunkHigh = await prisma.product.findFirst({ where: { name: { contains: 'Blue Terrace' } } });
  const courtMaster = await prisma.product.findFirst({ where: { name: { contains: 'Court Master' } } });

  const bundlesToCreate = [];

  if (aj4 && dunkLow) {
    bundlesToCreate.push({
      id: uuidv4(),
      name: "The Ultimate Streetwear Duo: AJ-4 Retro & Dunk Low",
      slug: "ultimate-streetwear-duo-aj4-dunk-low",
      description: "Double up on iconic streetwear grails. Pair the clean monochromatic AJ-4 White Oreo with Coastline Blue Dunk Lows for everyday rotation.",
      bundle_price: 13999,
      is_active: true,
      items: [
        { id: uuidv4(), product_id: aj4.id, quantity: 1 },
        { id: uuidv4(), product_id: dunkLow.id, quantity: 1 }
      ]
    });
  }

  if (cloudStratus && velocity) {
    bundlesToCreate.push({
      id: uuidv4(),
      name: "Pro Marathon & Road Runner Performance Pack",
      slug: "pro-marathon-road-runner-pack",
      description: "Engineered for high-mileage athletes. Experience max-cushion responsive energy return on morning training and road races.",
      bundle_price: 14999,
      is_active: true,
      items: [
        { id: uuidv4(), product_id: cloudStratus.id, quantity: 1 },
        { id: uuidv4(), product_id: velocity.id, quantity: 1 }
      ]
    });
  }

  if (dunkHigh && courtMaster) {
    bundlesToCreate.push({
      id: uuidv4(),
      name: "Heritage Court & Stealth Leather Twin Pack",
      slug: "heritage-court-stealth-leather-pack",
      description: "Timeless court silhouette meets all-black stealth street styling. Premium ankle collar support and rugged leather build.",
      bundle_price: 14499,
      is_active: true,
      items: [
        { id: uuidv4(), product_id: dunkHigh.id, quantity: 1 },
        { id: uuidv4(), product_id: courtMaster.id, quantity: 1 }
      ]
    });
  }

  for (const b of bundlesToCreate) {
    const existing = await prisma.productBundle.findUnique({ where: { slug: b.slug } });
    if (!existing) {
      await prisma.productBundle.create({
        data: {
          id: b.id,
          name: b.name,
          slug: b.slug,
          description: b.description,
          bundle_price: b.bundle_price,
          is_active: b.is_active,
          items: {
            create: b.items
          }
        }
      });
      console.log('Created bundle:', b.name);
    } else {
      console.log('Bundle already exists:', b.name);
    }
  }

  const all = await prisma.productBundle.findMany({ include: { items: true } });
  console.log(`Finished seeding! Total bundles now: ${all.length}`);
  await prisma.$disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
