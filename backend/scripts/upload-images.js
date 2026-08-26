/**
 * upload-images.js
 * Uploads all generated images from frontend/public/images/ to Cloudinary
 * Run: node scripts/upload-images.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGES_DIR = path.join(__dirname, '../../frontend/public/images');
const MANIFEST_PATH = path.join(__dirname, 'image-manifest.json');

async function uploadFile(filePath, folder) {
  const publicId = path.basename(filePath, path.extname(filePath));
  console.log(  Uploading ...);
  const result = await cloudinary.uploader.upload(filePath, {
    folder: solekicks/,
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    quality: 'auto:best',
  });
  return result.secure_url;
}

async function scanDir(dir, folder, manifest) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      await scanDir(fullPath, ${folder}/, manifest);
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry)) {
      const url = await uploadFile(fullPath, folder);
      manifest[fullPath.replace(/\\/g, '/')] = url;
    }
  }
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error('Images directory not found: ' + IMAGES_DIR);
    process.exit(1);
  }
  const manifest = {};
  console.log('Starting Cloudinary upload...\n');
  await scanDir(IMAGES_DIR, '', manifest);
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(\nUploaded  images.);
  console.log('Manifest saved to: ' + MANIFEST_PATH);
}

main().catch(err => { console.error('Upload failed:', err.message); process.exit(1); });
