require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const OpenAI = require("openai");
const cloudinary = require("cloudinary").v2;
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const OUTPUT_DIR = path.join(__dirname, "../../frontend/public/images");
const MANIFEST_PATH = path.join(__dirname, "image-manifest.json");

const HERO_BANNERS = [
  { key: "hero_1_street_revolution", size: "1536x1024", prompt: "Photorealistic product photography. A pair of black and red retro high-top basketball sneakers floating against a pure matte black background with a subtle red neon glow underneath. Cinematic studio lighting. Only the shoes — no people, no text, no props, no floor." },
  { key: "hero_2_retro_lows", size: "1536x1024", prompt: "Photorealistic product photography. A pair of clean white low-top court sneakers on a seamless pure white background with soft studio lighting and subtle shadow. Only the shoes — no people, no text, no props." },
  { key: "hero_3_cloud_runners", size: "1536x1024", prompt: "Photorealistic product photography. A pair of neon blue and white performance running shoes floating against a deep charcoal background with electric blue glow. Only the shoes — no people, no text, no props." },
];

const CATEGORY_BANNERS = [
  { key: "category_retro", size: "1024x1536", prompt: "Photorealistic product photography. A pair of orange and black retro high-top basketball sneakers on a deep black background with dramatic spot lighting. Only the shoes — no people, no text, no floor." },
  { key: "category_streetwear", size: "1024x1536", prompt: "Photorealistic product photography. A clean white low-top sneaker at a dynamic angle on a light gray seamless background with soft studio lighting. Only the shoe — no people, no text, no props." },
  { key: "category_runners", size: "1024x1536", prompt: "Photorealistic product photography. A sleek neon green and black performance running shoe floating on a dark charcoal background with neon glow underneath. Only the shoe — no people, no text, no props." },
  { key: "category_slides", size: "1024x1536", prompt: "Photorealistic product photography. A pair of thick-soled foam recovery slides in warm beige/sand on a cream seamless background with soft natural lighting. Only the slides — no people, no text, no props." },
];

const PRODUCTS = [
  { id: "03a6adb6-43b1-4e6d-ac2d-cbbd25225e56", key: "terrace-classic-white-low", name: "Terrace Classic White Low", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: clean white low-top leather sneaker (Stan Smith style), perfect lateral side view, pure white seamless background, soft studio lighting. Only the shoe — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: clean white low-top leather sneaker (Stan Smith style), front face-on view, dark charcoal seamless background, dramatic lighting. Only the shoe — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: clean white low-top leather sneaker (Stan Smith style), dynamic 3D quarter-angle floating view with soft shadow, pure white background. Only the shoe — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: clean white low-top leather sneaker (Stan Smith style), sole bottom view showing white rubber outsole, white background, bright studio lighting. Only the shoe — no people, no text, no props." },
  ]},
  { id: "21831171-c6ee-43b2-aa57-ec97dd4cfda1", key: "aj4-shadow-grail", name: "AJ-4 Shadow Grail", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: black and grey retro basketball sneaker (Air Jordan 4 style) with mesh upper and wing eyelets, lateral side view, pure white background, dramatic studio lighting. Only the shoe — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: black and grey retro basketball sneaker (Air Jordan 4 style), front face-on view, deep black background. Only the shoe — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: black and grey retro basketball sneaker (Air Jordan 4 style), 3D quarter-angle floating view with dramatic shadow, white background. Only the shoe — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: black and grey retro basketball sneaker (Air Jordan 4 style), sole view showing herringbone pattern, white background. Only the shoe — no people, no text, no props." },
  ]},
  { id: "226c4d97-a6dc-44ae-b419-9815d44950dd", key: "dunk-high-blue-terrace", name: "Dunk High Blue Terrace", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: blue and white high-top sneaker (Dunk High style) with royal blue leather upper and white overlays, lateral side view, pure white background. Only the shoe — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: blue and white high-top sneaker (Dunk High style), front face-on view, navy blue background. Only the shoe — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: blue and white high-top sneaker (Dunk High style), 3D quarter-angle floating with shadow, white background. Only the shoe — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: blue and white high-top sneaker (Dunk High style), sole view, white background. Only the shoe — no people, no text, no props." },
  ]},
  { id: "2a765049-f077-4219-a35f-8dc5a7041d18", key: "oasis-foam-slides", name: "Oasis Foam Recovery Slides", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: thick-soled foam recovery slide in warm beige/sand color with wide strap, lateral side view, cream seamless background, soft studio lighting. Only the slide — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: thick-soled foam recovery slide in warm beige color, top-down view showing strap and footbed, cream background. Only the slide — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: pair of thick-soled foam recovery slides in warm beige, 3D quarter-angle floating view with soft shadow, cream white background. Only the slides — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: foam recovery slide bottom sole view showing textured rubber outsole in beige/sand, white background. Only the slide — no people, no text, no props." },
  ]},
  { id: "2b8f4197-1344-408a-8d22-f30c08554fca", key: "boost-knit-cloud-runner", name: "Boost Knit Cloud Runner", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: grey and white knit running shoe with thick foam boost midsole (Ultra Boost style), lateral side view, pure white background, professional studio lighting. Only the shoe — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: grey and white knit running shoe (Ultra Boost style), front face-on view, dark charcoal background. Only the shoe — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: grey and white knit running shoe (Ultra Boost style), 3D quarter floating angle with shadow, white background. Only the shoe — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: grey and white knit running shoe (Ultra Boost style), sole bottom view showing rubber outsole pattern, white background. Only the shoe — no people, no text, no props." },
  ]},
  { id: "f2d71e99-adac-4a72-81f2-3c477327f734", key: "court-master-black-panther", name: "Court Master Black Panther", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: all-black leather low-top sneaker with white rubber outsole (Court Master style), lateral side view, pure white background, soft dramatic lighting. Only the shoe — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: all-black leather low-top sneaker (Court Master style), front face-on view, black background. Only the shoe — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: all-black leather low-top sneaker (Court Master style), 3D quarter-angle floating view with shadow, white background. Only the shoe — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: all-black leather low-top sneaker (Court Master style), sole view showing white herringbone rubber outsole, white background. Only the shoe — no people, no text, no props." },
  ]},
  { id: "8410b4d6-d123-4e2c-bfac-ecd8235710f0", key: "aj1-retro-high-ember", name: "AJ-1 Retro High Ember", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: red and black retro high-top basketball sneaker (Air Jordan 1 style) with red leather upper and black swoosh, lateral side view, pure white background, dramatic studio lighting. Only the shoe — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: red and black retro high-top sneaker (Air Jordan 1 style), front face-on view, deep black background. Only the shoe — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: red and black retro high-top sneaker (Air Jordan 1 style), 3D quarter-angle floating with shadow, white background. Only the shoe — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: red and black retro high-top sneaker (Air Jordan 1 style), sole view showing red and black rubber outsole, white background. Only the shoe — no people, no text, no props." },
  ]},
  { id: "6e9dc20b-8ca1-4ece-8444-3f17f37edf31", key: "eqt-street-support-adv", name: "EQT Street Support ADV", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: black and white minimalist low-top trainer (EQT style) with green accent stripe, lateral side view, white background. Only the shoe — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: black and white minimalist trainer (EQT style), front face-on view, dark background. Only the shoe — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: black and white minimalist trainer (EQT style), 3D quarter floating view with shadow, white background. Only the shoe — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: black and white minimalist trainer (EQT style), sole view, white background. Only the shoe — no people, no text, no props." },
  ]},
  { id: "bb763f5b-6b03-4701-aff3-f46c3a0204c7", key: "velocity-gray-road-runner", name: "Velocity Gray Road Runner", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: grey and orange performance road running shoe with thick cushioned midsole, lateral side view, white background. Only the shoe — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: grey and orange road running shoe, front face-on view, dark charcoal background. Only the shoe — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: grey and orange road running shoe, 3D quarter-angle floating with dynamic shadow, white background. Only the shoe — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: grey and orange road running shoe, sole view showing rubber outsole, white background. Only the shoe — no people, no text, no props." },
  ]},
  { id: "3b10c7a8-9f3f-41fa-be19-d1204c4eb159", key: "studio-athletic-trainer", name: "Studio Athletic Trainer", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: clean white and light grey athletic training shoe with mesh upper and EVA sole, lateral side view, white seamless background. Only the shoe — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: white and grey athletic trainer, front face-on view, white background. Only the shoe — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: white and grey athletic trainer, 3D quarter floating view with shadow, white background. Only the shoe — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: white and grey athletic trainer, sole view, white background. Only the shoe — no people, no text, no props." },
  ]},
  { id: "79b0c955-ebb3-4af8-ba1b-084a0bc8f20b", key: "adi-mono-panel-low", name: "Adi Mono Panel Low", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: all-white minimalist low-top sneaker with clean leather paneling (monochrome style), lateral side view, white seamless background, bright even lighting. Only the shoe — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: all-white minimalist low-top sneaker, front face-on view, light grey background. Only the shoe — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: all-white minimalist low-top sneaker, 3D quarter floating view with shadow, white background. Only the shoe — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: all-white minimalist low-top sneaker, sole view showing white herringbone outsole, white background. Only the shoe — no people, no text, no props." },
  ]},
  { id: "9e939ebd-aaad-466b-ac3b-05372981bc0b", key: "oasis-cloud-slide-mono", name: "Oasis Cloud Slide Mono", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: all-white monochrome thick-soled foam recovery slide with wide strap, lateral side view, white seamless background. Only the slide — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: all-white foam recovery slide, top-down view showing strap and footbed, white background. Only the slide — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: all-white foam recovery slide, 3D quarter-angle floating view with shadow, white background. Only the slide — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: all-white foam recovery slide, sole view showing rubber outsole texture, white background. Only the slide — no people, no text, no props." },
  ]},
  { id: "f34cdaa3-d7dc-484a-8194-04a402096fd7", key: "cloudstride-marathon-elite", name: "CloudStride Marathon Elite", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: neon yellow and black elite marathon running shoe with lightweight mesh upper and carbon-fiber midsole, lateral side view, white seamless background, dramatic lighting. Only the shoe — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: neon yellow and black marathon running shoe, front face-on view, black background. Only the shoe — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: neon yellow and black marathon running shoe, 3D quarter-angle floating with neon glow halo and shadow, white background. Only the shoe — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: neon yellow and black marathon running shoe, sole view showing rubber outsole, white background. Only the shoe — no people, no text, no props." },
  ]},
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function generateAndSave(prompt, size, outputPath) {
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size,
    quality: "high",
    output_format: "png",
  });
  const b64 = response.data[0].b64_json;
  fs.writeFileSync(outputPath, Buffer.from(b64, "base64"));
}

async function uploadToCloudinary(filePath, folder, publicId) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `solekicks/${folder}`,
    public_id: publicId,
    overwrite: true,
    resource_type: "image",
    quality: "auto:best",
  });
  return result.secure_url;
}

async function main() {
  const manifest = {};

  console.log("\n=== HERO BANNERS ===");
  fs.mkdirSync(path.join(OUTPUT_DIR, "banners"), { recursive: true });
  for (const item of HERO_BANNERS) {
    const outPath = path.join(OUTPUT_DIR, "banners", `${item.key}.png`);
    console.log(`Generating: ${item.key}...`);
    try {
      await generateAndSave(item.prompt, item.size, outPath);
      const url = await uploadToCloudinary(outPath, "banners", item.key);
      manifest[item.key] = url;
      console.log(`  OK: ${url}`);
    } catch(e) { console.error(`  FAIL: ${e.message}`); }
    await sleep(2000);
  }

  console.log("\n=== CATEGORY BANNERS ===");
  fs.mkdirSync(path.join(OUTPUT_DIR, "categories"), { recursive: true });
  for (const item of CATEGORY_BANNERS) {
    const outPath = path.join(OUTPUT_DIR, "categories", `${item.key}.png`);
    console.log(`Generating: ${item.key}...`);
    try {
      await generateAndSave(item.prompt, item.size, outPath);
      const url = await uploadToCloudinary(outPath, "categories", item.key);
      manifest[item.key] = url;
      console.log(`  OK: ${url}`);
    } catch(e) { console.error(`  FAIL: ${e.message}`); }
    await sleep(2000);
  }

  console.log("\n=== PRODUCT IMAGES ===");
  fs.mkdirSync(path.join(OUTPUT_DIR, "products"), { recursive: true });
  for (const product of PRODUCTS) {
    console.log(`\nProduct: ${product.name}`);
    const productUrls = [];
    const productDir = path.join(OUTPUT_DIR, "products", product.key);
    fs.mkdirSync(productDir, { recursive: true });
    for (const shot of product.shots) {
      const outPath = path.join(productDir, `${shot.angle}.png`);
      console.log(`  Shot: ${shot.angle}...`);
      try {
        await generateAndSave(shot.prompt, "1024x1024", outPath);
        const url = await uploadToCloudinary(outPath, `products/${product.key}`, shot.angle);
        productUrls.push(url);
        console.log(`    OK: ${url}`);
      } catch(e) { console.error(`    FAIL: ${e.message}`); }
      await sleep(2000);
    }
    if (productUrls.length > 0) {
      await prisma.product.update({ where: { id: product.id }, data: { images: productUrls, hover_image: productUrls[1] || productUrls[0] } });
      console.log(`  DB: updated ${product.name} (${productUrls.length} images)`);
    }
    manifest[product.key] = productUrls;
  }

  console.log("\n=== UPDATING HERO SLIDES IN DB ===");
  const slides = await prisma.heroSlide.findMany({ orderBy: { sort_order: "asc" } });
  const heroKeys = ["hero_1_street_revolution", "hero_2_retro_lows", "hero_3_cloud_runners"];
  for (let i = 0; i < slides.length; i++) {
    const url = manifest[heroKeys[i]];
    if (url) { await prisma.heroSlide.update({ where: { id: slides[i].id }, data: { image_url: url } }); console.log(`  Slide updated: ${slides[i].title}`); }
  }

  console.log("\n=== UPDATING CATEGORIES IN DB ===");
  for (const { slug, key } of [{ slug:"retro", key:"category_retro" }, { slug:"streetwear", key:"category_streetwear" }, { slug:"runners", key:"category_runners" }, { slug:"slides", key:"category_slides" }]) {
    const url = manifest[key];
    if (url) { await prisma.category.update({ where: { slug }, data: { image_url: url } }); console.log(`  Category updated: ${slug}`); }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log("\n=== DONE ===");
  console.log(`Manifest: ${MANIFEST_PATH}`);
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
