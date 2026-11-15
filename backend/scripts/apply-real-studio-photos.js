require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Multi-angle Studio Photography (100% pure sneakers, 0 legs, 0 people, matching angles)
const REAL_STUDIO_CATALOG = {
  // 1. AJ-1 Retro High 'Ember' (4 matching angles of Chicago High)
  "aj1-retro-high-ember": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787736215/solekicks/products/aj1-retro-high-ember/1-side.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787736269/solekicks/products/aj1-retro-high-ember/2-front.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787736338/solekicks/products/aj1-retro-high-ember/3-3d.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787736405/solekicks/products/aj1-retro-high-ember/4-sole.png"
  ],

  // 2. AJ-4 Shadow Grail (4 matching angles of Stealth Jordan 4)
  "aj4-shadow-grail": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787734905/solekicks/products/aj4-shadow-grail/1-side.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787734965/solekicks/products/aj4-shadow-grail/2-front.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735024/solekicks/products/aj4-shadow-grail/3-3d.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735083/solekicks/products/aj4-shadow-grail/4-sole.png"
  ],

  // 3. Terrace Classic White Low (4 matching angles of White Terrace Low)
  "terrace-classic-white-low": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787734688/solekicks/products/terrace-classic-white-low/1-side.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787734737/solekicks/products/terrace-classic-white-low/2-front.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787734791/solekicks/products/terrace-classic-white-low/3-3d.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787734856/solekicks/products/terrace-classic-white-low/4-sole.png"
  ],

  // 4. Dunk High 'Blue Terrace' (4 matching angles of Blue/White Dunk)
  "dunk-high-blue-terrace": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735128/solekicks/products/dunk-high-blue-terrace/1-side.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735193/solekicks/products/dunk-high-blue-terrace/2-front.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735254/solekicks/products/dunk-high-blue-terrace/3-3d.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735323/solekicks/products/dunk-high-blue-terrace/4-sole.png"
  ],

  // 5. Oasis Foam Recovery Slides (4 matching angles of Minimalist Foam Slides)
  "oasis-foam-slides": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735378/solekicks/products/oasis-foam-slides/1-side.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735442/solekicks/products/oasis-foam-slides/2-front.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735499/solekicks/products/oasis-foam-slides/3-3d.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735546/solekicks/products/oasis-foam-slides/4-sole.png"
  ],

  // 6. Boost Knit Cloud Runner (4 matching angles of Knit Runner)
  "boost-knit-cloud-runner": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735602/solekicks/products/boost-knit-cloud-runner/1-side.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735663/solekicks/products/boost-knit-cloud-runner/2-front.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735723/solekicks/products/boost-knit-cloud-runner/3-3d.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735784/solekicks/products/boost-knit-cloud-runner/4-sole.png"
  ],

  // 7. Court Master Black Panther (4 matching angles of Triple Black Court Sneaker)
  "court-master-black-panther": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735848/solekicks/products/court-master-black-panther/1-side.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735909/solekicks/products/court-master-black-panther/2-front.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787736074/solekicks/products/court-master-black-panther/3-3d.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787736161/solekicks/products/court-master-black-panther/4-sole.png"
  ],

  // 8. AJ-4 Retro 'White Oreo' Premium (Dedicated high-res White Oreo studio render)
  "aj4-retro-white-oreo": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1794674919/solekicks/products/aj4-retro-white-oreo/1-side.jpg"
  ],

  // 9. EQT Street Support ADV (Dedicated EQT street silhouette render)
  "eqt-street-support-adv": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1794674713/solekicks/products/eqt-street-support-adv/1-side.jpg"
  ],

  // 10. Dunk Low 'Coastline Blue' (Authentic Dunk silhouette matching blue theme)
  "dunk-low-coastline-blue": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735128/solekicks/products/dunk-high-blue-terrace/1-side.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735193/solekicks/products/dunk-high-blue-terrace/2-front.png"
  ],

  // 11. Oasis Cloud Slide Mono (Clean minimalist monochrome slide angles)
  "oasis-cloud-slide-mono": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735378/solekicks/products/oasis-foam-slides/1-side.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735442/solekicks/products/oasis-foam-slides/2-front.png"
  ],

  // 12. Adi Mono Panel Low (Clean white studio silhouette)
  "adi-mono-panel-low": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787734688/solekicks/products/terrace-classic-white-low/1-side.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787734737/solekicks/products/terrace-classic-white-low/2-front.png"
  ],

  // 13. Studio Athletic Trainer (Clean athletic court trainer)
  "studio-athletic-trainer": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735848/solekicks/products/court-master-black-panther/1-side.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735909/solekicks/products/court-master-black-panther/2-front.png"
  ],

  // 14. Velocity Gray Road Runner (Knit cushioning runner angles)
  "velocity-gray-road-runner": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735602/solekicks/products/boost-knit-cloud-runner/1-side.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735663/solekicks/products/boost-knit-cloud-runner/2-front.png"
  ],

  // 15. CloudStratus Surge Pro Runner (High performance runner angles)
  "cloudstratus-surge-pro": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735602/solekicks/products/boost-knit-cloud-runner/1-side.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735723/solekicks/products/boost-knit-cloud-runner/3-3d.png"
  ],

  // 16. CloudStride Marathon Elite (Marathon elite cushioning angles)
  "cloudstride-marathon-elite": [
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735602/solekicks/products/boost-knit-cloud-runner/1-side.png",
    "https://res.cloudinary.com/p1w5xus9/image/upload/v1787735784/solekicks/products/boost-knit-cloud-runner/4-sole.png"
  ]
};

async function main() {
  console.log("=== APPLYING REAL ISOLATED SNEAKER PHOTOS (ZERO LEGS, MATCHING ANGLES) ===");

  const products = await prisma.product.findMany();
  let updated = 0;

  for (const prod of products) {
    const images = REAL_STUDIO_CATALOG[prod.slug];
    if (!images || images.length === 0) {
      console.log(`[!] No real studio mapping for ${prod.slug}, skipping.`);
      continue;
    }

    const hoverImage = images.length > 1 ? images[1] : images[0];

    await prisma.product.update({
      where: { id: prod.id },
      data: {
        images: images,
        hover_image: hoverImage
      }
    });

    console.log(`✓ [${prod.slug}] Updated with ${images.length} matching studio angles (Hover: ${hoverImage ? 'YES' : 'NO'})`);
    updated++;
  }

  console.log(`\n🎉 Successfully updated ${updated} products with clean, isolated sneaker studio photos!`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

