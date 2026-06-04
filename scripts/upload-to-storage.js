/**
 * Upload optimized images to Firebase Storage.
 *
 * Prerequisites:
 *   1. Go to Firebase Console → Project Settings → Service Accounts
 *   2. Click "Generate new private key" → download JSON
 *   3. Save as service-account-key.json in the project root (or set GOOGLE_APPLICATION_CREDENTIALS)
 *
 * Usage:
 *   node scripts/upload-to-storage.js [--optimized-dir <path>] [--dry-run]
 *
 *   --optimized-dir : path to optimized images (default: ./_optimized)
 *   --dry-run       : preview what would be uploaded without uploading
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const PROJECT_ID = 'wirog-app-93318';
const STORAGE_BUCKET = 'wirog-app-93318.firebasestorage.app';
const SERVICE_ACCOUNT_KEY = path.join(ROOT, 'service-account-key.json');

const OPTIMIZED_DIR = path.join(ROOT, '_optimized');

const BASE_STORAGE_URL = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/`;

async function getAllFiles(dir, baseDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await getAllFiles(full, baseDir);
      files.push(...sub);
    } else if (entry.isFile()) {
      const relPath = path.relative(baseDir, full).replace(/\\/g, '/');
      const size = fs.statSync(full).size;
      files.push({ fullPath: full, relPath, size });
    }
  }
  return files;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const optimizedDir = args.includes('--optimized-dir')
    ? path.resolve(ROOT, args[args.indexOf('--optimized-dir') + 1])
    : OPTIMIZED_DIR;

  if (!fs.existsSync(optimizedDir)) {
    console.error(`✗ Optimized directory not found: ${optimizedDir}`);
    console.error('  Run scripts/optimize-images.js first.');
    process.exit(1);
  }

  if (!fs.existsSync(SERVICE_ACCOUNT_KEY)) {
    console.error(`✗ Service account key not found: ${SERVICE_ACCOUNT_KEY}`);
    console.error('  Download it from Firebase Console → Project Settings → Service Accounts');
    process.exit(1);
  }

  if (dryRun) {
    console.log('🔍 DRY RUN - no files will be uploaded\n');
  } else {
    console.log('☁️  Initializing Firebase Admin SDK...');
    const serviceAccount = require(SERVICE_ACCOUNT_KEY);
    initializeApp({ credential: cert(serviceAccount), storageBucket: STORAGE_BUCKET });
  }

  const files = await getAllFiles(optimizedDir, optimizedDir);
  console.log(`  Found ${files.length} files to upload\n`);

  // Exclude manifest.json from uploads
  const uploadFiles = files.filter(f => f.relPath !== 'image-manifest.json');

  let uploaded = 0;
  let totalBytes = 0;

  for (const { fullPath, relPath, size } of uploadFiles) {
    const destination = relPath; // preserve folder structure in bucket
    const publicUrl = BASE_STORAGE_URL + encodeURIComponent(destination) + '?alt=media';

    if (dryRun) {
      console.log(`  [DRY] ${relPath} → ${publicUrl}`);
      uploaded++;
      totalBytes += size;
      continue;
    }

    process.stdout.write(`  ☁️  ${relPath}... `);
    try {
      const bucket = getStorage().bucket();
      await bucket.upload(fullPath, {
        destination,
        public: true,
        metadata: {
          cacheControl: 'public, max-age=31536000, immutable',
          contentType: 'image/webp',
        },
      });
      process.stdout.write(`✓\n`);
      uploaded++;
      totalBytes += size;
    } catch (err) {
      process.stdout.write(`✗ ${err.message}\n`);
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`  Files uploaded:   ${uploaded}`);
  console.log(`  Total size:       ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  if (!dryRun) {
    console.log('\n  ✅ All images are now on Firebase Storage.');
    console.log('  🔄 Next step: update code references. Run the update script or manual edits.');
  }
  console.log('═══════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
