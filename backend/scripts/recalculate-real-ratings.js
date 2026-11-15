const { PrismaClient } = require('@prisma/client');

const localDbUrl = 'postgresql://postgres:%40Bahadurkhan7@localhost:5432/sneakpk?schema=public';
const remoteDirectUrl = 'postgresql://postgres.mpfwfcudwgyydxjxkyso:%40Bahadurkhan7@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

const local = new PrismaClient({ datasources: { db: { url: localDbUrl } } });
const remote = new PrismaClient({ datasources: { db: { url: remoteDirectUrl } } });

async function syncRatings(db, label) {
  console.log(`\n--- Recalculating Real Reviews for ${label} ---`);
  const products = await db.product.findMany();

  for (const p of products) {
    const reviews = await db.review.findMany({
      where: { product_id: p.id, status: 'approved' }
    });

    const count = reviews.length;
    const avg = count > 0 
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(1))
      : 5.0;

    await db.product.update({
      where: { id: p.id },
      data: {
        review_count: count,
        avg_rating: avg
      }
    });

    console.log(`✔ [${p.slug}] -> real review_count: ${count}, real avg_rating: ${avg} (was fake: ${p.review_count}, ${p.avg_rating})`);
  }
}

async function main() {
  await syncRatings(local, 'LOCAL DB');
  await syncRatings(remote, 'REMOTE SUPABASE DB');

  try {
    const memoryCache = require('../src/utils/cache');
    memoryCache.flush();
    console.log('\n✔ In-memory cache flushed.');
  } catch (_) {}

  await local.$disconnect();
  await remote.$disconnect();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
