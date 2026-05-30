const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '_optimized');
const MANIFEST = path.join(OUT, 'image-manifest.json');

const MAX_WIDTH = 800;
const QUALITY = 78;

const IMAGE_DIRS = [
  'assets/images/categories_examples',
  'assets/images/profile_pictures_dummy',
  'assets/images/company_logos_dummy',
  'assets/categories',
  'assets/media',
  'assets/icons',
];

const KEEP_ORIGINAL = [
  'assets/media/no_link.png',
  'assets/media/offline-mode-image.png',
  'assets/media/foromane_place_holder_image.webp',
  'assets/media/foromane_place_holder_image_blank.webp',
  'assets/media/foromane_place_holder_image_blog_image_placeholder.webp',
  'assets/media/foromane_place_holder_image_blog_image_placeholder_2.webp',
  'assets/media/foromane_place_holder_image_blog_image_placeholder_3.webp',
];

const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

const EXT_MAP = {
  '.jpg': '.webp',
  '.jpeg': '.webp',
  '.png': '.webp',
  '.webp': '.webp',
  '.avif': '.webp',
};

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function getFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await getFiles(full);
      files.push(...sub);
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

async function optimizeImage(src, relPath) {
  const ext = path.extname(src).toLowerCase();
  if (!SUPPORTED.has(ext)) return null;

  const outName = path.basename(src, path.extname(src)) + '.webp';
  const relDir = path.dirname(relPath);

  // Keep the directory structure but under _optimized
  const outDir = path.join(OUT, relDir);
  await ensureDir(outDir);
  const dest = path.join(outDir, outName);

  try {
    const metadata = await sharp(src).metadata();
    const needsResize = metadata.width > MAX_WIDTH || metadata.height > MAX_WIDTH;

    let pipeline = sharp(src);
    if (needsResize) {
      pipeline = pipeline.resize({
        width: MAX_WIDTH,
        height: MAX_WIDTH,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    await pipeline.webp({ quality: QUALITY, effort: 4 }).toFile(dest);

    const originalSize = fs.statSync(src).size;
    const newSize = fs.statSync(dest).size;

    return {
      original: relPath,
      optimized: path.join(relDir, outName).replace(/\\/g, '/'),
      originalSize,
      newSize,
      saved: originalSize - newSize,
    };
  } catch (err) {
    console.error(`  ✗ Error processing ${relPath}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🔍 Scanning image directories...\n');

  const allFiles = [];
  for (const dir of IMAGE_DIRS) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) {
      console.log(`  ⚠ Directory not found: ${dir}`);
      continue;
    }
    const files = await getFiles(fullDir);
    allFiles.push(...files.map(f => ({
      fullPath: f,
      relPath: path.relative(ROOT, f).replace(/\\/g, '/'),
    })));
  }

  console.log(`  Found ${allFiles.length} files across ${IMAGE_DIRS.length} directories.\n`);

  const manifest = { generated: new Date().toISOString(), files: {} };
  let processed = 0;
  let skipped = 0;
  let totalOriginalSize = 0;
  let totalNewSize = 0;

  for (const { fullPath, relPath } of allFiles) {
    // Skip files that should keep original
    if (KEEP_ORIGINAL.includes(relPath)) {
      // Copy as-is
      const dest = path.join(OUT, relPath);
      await ensureDir(path.dirname(dest));
      fs.copyFileSync(fullPath, dest);
      manifest.files[relPath] = relPath;
      skipped++;
      continue;
    }

    const ext = path.extname(relPath).toLowerCase();
    if (!SUPPORTED.has(ext)) {
      skipped++;
      continue;
    }

    process.stdout.write(`  ${relPath}... `);
    const result = await optimizeImage(fullPath, relPath);
    if (result) {
      manifest.files[result.original] = result.optimized;
      totalOriginalSize += result.originalSize;
      totalNewSize += result.newSize;
      processed++;
      const pct = ((1 - result.newSize / result.originalSize) * 100).toFixed(1);
      process.stdout.write(`✓ (${(result.newSize / 1024).toFixed(1)}KB, -${pct}%)\n`);
    } else {
      skipped++;
      process.stdout.write(`✗\n`);
    }
  }

  await ensureDir(OUT);
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

  console.log('\n═══════════════════════════════════════');
  console.log('  Results:');
  console.log(`  Files processed:    ${processed}`);
  console.log(`  Files skipped:      ${skipped}`);
  console.log(`  Total original:     ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Total optimized:    ${(totalNewSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Total saved:        ${((totalOriginalSize - totalNewSize) / 1024 / 1024).toFixed(2)} MB (${((1 - totalNewSize / totalOriginalSize) * 100).toFixed(1)}%)`);
  console.log(`  Manifest:           ${MANIFEST}`);
  console.log('═══════════════════════════════════════\n');
}

main().catch(console.error);
