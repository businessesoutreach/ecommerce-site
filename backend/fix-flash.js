const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log("Resetting all flash sales...");
  await prisma.product.updateMany({ data: { is_flash_sale: false, flash_sale_price: null } });
  
  const products = await prisma.product.findMany({ take: 4, where: { status: 'active' } });
  console.log(`Setting ${products.length} products to flash sale...`);
  
  for (const product of products) {
    const discountedPrice = Math.floor(product.base_price * 0.70);
    await prisma.product.update({
      where: { id: product.id },
      data: { is_flash_sale: true, flash_sale_price: discountedPrice }
    });
  }
  console.log("Done.");
}
main().finally(() => prisma.$disconnect());
