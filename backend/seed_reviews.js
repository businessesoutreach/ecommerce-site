const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ take: 5 });
  if (products.length === 0) {
    console.log("No products found.");
    process.exit(0);
  }

  const reviewsData = [
    { comment: "Great shoes!", rating: 5, status: "approved" },
    { comment: "Okay but size is small", rating: 3, status: "pending" },
    { comment: "Worst quality ever", rating: 1, status: "reported" },
    { comment: "Love it, highly recommend", rating: 5, status: "approved" },
    { comment: "Fast delivery", rating: 4, status: "approved" },
    { comment: "The color faded after one wash", rating: 2, status: "pending" },
  ];

  for (let i = 0; i < reviewsData.length; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const daysAgo = Math.floor(Math.random() * 7);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    await prisma.review.create({
      data: {
        product_id: product.id,
        customer_name: `Customer ${i+1}`,
        rating: reviewsData[i].rating,
        comment: reviewsData[i].comment,
        status: reviewsData[i].status,
        created_at: date
      }
    });
  }
  
  console.log("Seeded reviews!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
