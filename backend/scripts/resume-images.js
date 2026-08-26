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

// Only the 6 products that failed due to connection error
const REMAINING_PRODUCTS = [
  { id: "6e9dc20b-8ca1-4ece-8444-3f17f37edf31", key: "eqt-street-support-adv", name: "EQT Street Support ADV", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: black and white minimalist low-top trainer (EQT Support ADV style) with green accent stripe, lateral side view, white background. Only the shoe — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: black and white minimalist trainer (EQT style), front face-on view, dark background. Only the shoe — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: black and white minimalist trainer (EQT style), 3D quarter floating view with shadow, white background. Only the shoe — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: black and white minimalist trainer (EQT style), sole bottom view, white background. Only the shoe — no people, no text, no props." },
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
    { angle: "4-sole", prompt: "Photorealistic studio product photo: white and grey athletic trainer, sole view showing rubber outsole, white background. Only the shoe — no people, no text, no props." },
  ]},
  { id: "79b0c955-ebb3-4af8-ba1b-084a0bc8f20b", key: "adi-mono-panel-low", name: "Adi Mono Panel Low", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: all-white minimalist low-top sneaker with clean leather paneling (monochrome Adidas style), lateral side view, white seamless background, bright even lighting. Only the shoe — no people, no text, no props." },
    { angle: "2-front", prompt: "Photorealistic studio product photo: all-white minimalist low-top sneaker, front face-on view, light grey background. Only the shoe — no people, no text, no props." },
    { angle: "3-3d", prompt: "Photorealistic studio product photo: all-white minimalist low-top sneaker, 3D quarter floating view with shadow, white background. Only the shoe — no people, no text, no props." },
    { angle: "4-sole", prompt: "Photorealistic studio product photo: all-white minimalist low-top sneaker, sole view showing white herringbone outsole, white background. Only the shoe — no people, no text, no props." },
  ]},
  { id: "9e939ebd-aaad-466b-ac3b-05372981bc0b", key: "oasis-cloud-slide-mono", name: "Oasis Cloud Slide Mono", shots: [
    { angle: "1-side", prompt: "Photorealistic studio product photo: all-white monochrome thick-soled foam recovery slide with wide single strap, lateral side view, white seamless background. Only the slide — no people, no text, no props." },
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

async function generateAndSave(prompt, outputPath) {
  const response = await openai.images.generate({
    model: "dall-e-2",
    prompt,
    n: 1,
    size: "1024x1024",
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
  console.log("=== RESUMING — 6 remaining products ===\n");

  for (const product of REMAINING_PRODUCTS) {
    console.log(`Product: ${product.name}`);
    const productUrls = [];
    const productDir = path.join(OUTPUT_DIR, "products", product.key);
    fs.mkdirSync(productDir, { recursive: true });

    for (const shot of product.shots) {
      const outPath = path.join(productDir, `${shot.angle}.png`);
      console.log(`  Shot: ${shot.angle}...`);
      try {
        await generateAndSave(shot.prompt, outPath);
        const url = await uploadToCloudinary(outPath, `products/${product.key}`, shot.angle);
        productUrls.push(url);
        console.log(`    OK: ${url}`);
      } catch(e) {
        console.error(`    FAIL: ${e.message}`);
      }
      await sleep(15000);
    }

    if (productUrls.length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: { images: productUrls, hover_image: productUrls[1] || productUrls[0] },
      });
      console.log(`  DB: updated ${product.name} (${productUrls.length} images)\n`);
    } else {
      console.log(`  SKIP: no images generated for ${product.name}\n`);
    }
  }

  console.log("=== ALL DONE ===");
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
