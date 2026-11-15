const prisma = require('../src/db');

async function main() {
  console.log("Activating Flash Sale for 2 months...");

  // Two months from today (Nov 15, 2026 -> Jan 15, 2027)
  const twoMonthsLater = new Date();
  twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
  twoMonthsLater.setHours(23, 59, 59, 999);

  // 1. Update global store settings
  const settings = await prisma.settings.findFirst();
  if (settings) {
    await prisma.settings.update({
      where: { id: settings.id },
      data: {
        flash_sale_active: true,
        flash_sale_end_time: twoMonthsLater,
      },
    });
  } else {
    await prisma.settings.create({
      data: {
        id: "singleton",
        flash_sale_active: true,
        flash_sale_end_time: twoMonthsLater,
      },
    });
  }

  // 2. Select 8 flagship products across all 4 categories for the Flash Sale
  const flashSlugs = [
    "aj4-retro-white-oreo",       // Retro flagship
    "aj1-retro-high-ember",       // Retro flagship
    "dunk-low-coastline-blue",    // Streetwear
    "eqt-street-support-adv",     // Streetwear
    "cloudstride-marathon-elite", // Runner
    "cloudstratus-surge-pro",     // Runner
    "oasis-foam-slides",          // Slides
    "oasis-cloud-slide-mono",     // Slides
  ];

  // Set is_flash_sale: true for these 8 products
  await prisma.product.updateMany({
    where: { slug: { in: flashSlugs } },
    data: { is_flash_sale: true },
  });

  const updatedSettings = await prisma.settings.findFirst();
  const flashProducts = await prisma.product.findMany({
    where: { is_flash_sale: true },
    select: { name: true, slug: true, base_price: true, compare_at_price: true, category_slug: true },
  });

  console.log("Updated Settings:", {
    flash_sale_active: updatedSettings.flash_sale_active,
    flash_sale_end_time: updatedSettings.flash_sale_end_time,
  });
  console.log(`Flash Sale active with ${flashProducts.length} kicks:`);
  flashProducts.forEach((p, idx) => {
    console.log(`  ${idx + 1}. [${p.category_slug.toUpperCase()}] ${p.name} - Rs. ${p.base_price.toLocaleString()} (was Rs. ${p.compare_at_price.toLocaleString()})`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

