/**
 * Converts unclaimed business CSV files to chunked JavaScript files (~300KB each).
 * Usage: node tools/convert-unclaimed-csv.js
 *
 * Reads:
 *   data/unclaimed business database/unclaimed_botswana_business_directory.csv
 *   data/unclaimed business database/unclaimed_zimbabwe_business_directory.csv
 *
 * Writes (per country, numbered chunks):
 *   data/unclaimed_botswana_businesses_1.js
 *   data/unclaimed_botswana_businesses_2.js
 *   ...
 *   data/unclaimed_zimbabwe_businesses_1.js
 *   data/unclaimed_zimbabwe_businesses_2.js
 *   ...
 */

const fs = require('fs');
const path = require('path');

const APP_COLORS = ['#fd7600','#009144','#003DA5','#8c2d1a','#1a6b5a','#6b3a8c','#1a4b8c','#2a4a8c','#4a6b3a','#8c5a2d'];
const UNCLAIMED_LOGO = 'assets/images/company_logos_dummy/foromane_logo_thumbnail_unclaimed_business.webp';
const TARGET_CHUNK_SIZE = 300 * 1024; // 300 KB

function generateInitials(name) {
  if (!name) return '--';
  var parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  var n = parts[0] || '';
  return n.slice(0, 2).toUpperCase() || '--';
}

function pickColor(name) {
  if (!name) return APP_COLORS[0];
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % APP_COLORS.length;
  }
  return APP_COLORS[hash];
}

function escapeJs(str) {
  if (str == null) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function parseCSVRow(line) {
  var result = [];
  var current = '';
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

function serializeBusiness(b) {
  return '[' +
    JSON.stringify(b.id) + ',' +
    JSON.stringify(b.name) + ',' +
    JSON.stringify(b.category) + ',' +
    JSON.stringify(b.location) + ',' +
    JSON.stringify(b.phone) + ',' +
    JSON.stringify(b.initials) + ',' +
    JSON.stringify(b.color) +
  ']';
}

function convertCSVtoChunks(csvPath, idPrefix, outputDir, outputBaseName) {
  var csvContent = fs.readFileSync(csvPath, 'utf-8');
  var lines = csvContent.split(/\r?\n/).filter(function(l) { return l.trim(); });

  if (lines.length < 2) {
    console.error('ERROR: ' + csvPath + ' has fewer than 2 lines');
    return;
  }

  var headerLine = lines[0];
  var headers = parseCSVRow(headerLine).map(function(h) { return h.trim(); });

  var colMap = {};
  for (var i = 0; i < headers.length; i++) {
    colMap[headers[i].toLowerCase()] = i;
  }

  console.log('Headers: ' + JSON.stringify(headers));
  console.log('Rows to process: ' + (lines.length - 1));

  var rows = [];
  for (var r = 1; r < lines.length; r++) {
    var cells = parseCSVRow(lines[r]);

    var nameIdx = colMap['business_name'];
    var cityIdx = colMap['city'];
    var callIdx = colMap['call'];
    var catIdx = colMap['category'];
    var csvIdIdx = colMap['id'];

    if (nameIdx == null || cityIdx == null) continue;

    var name = (cells[nameIdx] || '').trim();
    var city = (cells[cityIdx] || '').trim();
    var call = (cells[callIdx] || '').trim();
    var category = (cells[catIdx] || '').trim();
    var csvId = (cells[csvIdIdx] || '').trim();

    if (!name) continue;
    if (call.toLowerCase() === 'no phone') call = '';

    var bizId = idPrefix + csvId;
    var initials = generateInitials(name);
    var color = pickColor(name);

    rows.push({
      id: bizId,
      name: name,
      category: category,
      location: city,
      phone: call,
      initials: initials,
      color: color,
      logo: UNCLAIMED_LOGO,
      isUnclaimed: true
    });
  }

  // Sort by name alphabetically (case-insensitive)
  rows.sort(function(a, b) { return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });

  console.log('Generated ' + rows.length + ' business objects, sorting by name');

  // Serialize each row and split into chunks by byte size
  var serialized = rows.map(function(r) { return serializeBusiness(r); });
  var totalBytes = serialized.reduce(function(sum, s) { return sum + Buffer.byteLength(s, 'utf-8') + 1; }, 0); // +1 for comma or newline

  // Always produce at least 2 chunks for any non-empty data
  var targetChunkBytes = Math.min(TARGET_CHUNK_SIZE, Math.ceil(totalBytes / 2));

  var chunks = [];
  var currentChunk = [];
  var currentSize = 0;
  // Overhead per chunk: IIFE wrapper + array literal + variable assignment
  var overheadPerChunk = 200; // bytes (estimate)

  for (var i = 0; i < serialized.length; i++) {
    var itemBytes = Buffer.byteLength(serialized[i], 'utf-8') + 1; // + comma
    var isLast = (i === serialized.length - 1);

    // If adding this item would exceed target, and we already have items in this chunk, finalize it
    if (currentChunk.length > 0 && currentSize + itemBytes + overheadPerChunk > targetChunkBytes) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentSize = 0;
    }
    currentChunk.push(serialized[i]);
    currentSize += itemBytes;
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  // If somehow we still only have 1 chunk (data is very small), force split at halfway
  if (chunks.length === 1 && rows.length > 1000) {
    var mid = Math.floor(chunks[0].length / 2);
    chunks = [chunks[0].slice(0, mid), chunks[0].slice(mid)];
  }

  var varName = idPrefix === 'unclaimed-bw-' ? 'UNCLAIMED_BOTSWANA_BUSINESSES' : 'UNCLAIMED_ZIMBABWE_BUSINESSES';
  var totalChunks = chunks.length;

  // Write each chunk as a separate JS file
  for (var c = 0; c < chunks.length; c++) {
    var chunkData = chunks[c];
    var chunkNum = c + 1;
    var chunkPath = outputDir + '/' + outputBaseName + '_' + chunkNum + '.js';

    var jsLines = ['/* Auto-generated from ' + path.basename(csvPath) + ' — chunk ' + chunkNum + '/' + totalChunks + ' */'];
    jsLines.push('(function(){');
    jsLines.push('var target = window.' + varName + ';');
    jsLines.push('if (!target) { target = []; window.' + varName + ' = target; }');
    jsLines.push('target._chunksTotal = ' + totalChunks + ';');
    jsLines.push('window._UNCLAIMED_LOADED = (window._UNCLAIMED_LOADED || 0) + 1;');
    jsLines.push('var data = [');

    for (var j = 0; j < chunkData.length; j++) {
      jsLines.push(chunkData[j] + (j < chunkData.length - 1 ? ',' : ''));
    }

    jsLines.push('];');
    jsLines.push('target.push.apply(target, data);');
    jsLines.push('})();');

    var output = jsLines.join('\n');
    fs.writeFileSync(chunkPath, output, 'utf-8');
    var sizeKB = (Buffer.byteLength(output, 'utf-8') / 1024).toFixed(1);
    console.log('  Chunk ' + chunkNum + ': ' + chunkData.length + ' items, ' + sizeKB + ' KB → ' + chunkPath);
  }

  console.log('Total: ' + totalChunks + ' chunks, ' + rows.length + ' businesses');
  return { totalChunks: totalChunks, varName: varName };
}

function main() {
  var baseDir = path.resolve(__dirname, '..');
  var dataDir = path.join(baseDir, 'data', 'unclaimed business database');
  var outputDir = path.join(baseDir, 'data');

  // Clean up old monolithic files
  var oldFiles = ['unclaimed_botswana_businesses.js', 'unclaimed_zimbabwe_businesses.js'];
  oldFiles.forEach(function(f) {
    var fp = path.join(outputDir, f);
    if (fs.existsSync(fp)) {
      fs.unlinkSync(fp);
      console.log('Removed old file: ' + f);
    }
  });

  // Also clean up old chunk files from previous runs
  var existingFiles = fs.readdirSync(outputDir);
  existingFiles.forEach(function(f) {
    if (/^unclaimed_(botswana|zimbabwe)_businesses_\d+\.js$/.test(f)) {
      fs.unlinkSync(path.join(outputDir, f));
      console.log('Removed old chunk: ' + f);
    }
  });

  // Convert Botswana CSV to chunks
  console.log('\n=== Botswana ===');
  convertCSVtoChunks(
    path.join(dataDir, 'unclaimed_botswana_business_directory.csv'),
    'unclaimed-bw-',
    outputDir,
    'unclaimed_botswana_businesses'
  );

  // Convert Zimbabwe CSV to chunks
  console.log('\n=== Zimbabwe ===');
  convertCSVtoChunks(
    path.join(dataDir, 'unclaimed_zimbabwe_business_directory.csv'),
    'unclaimed-zw-',
    outputDir,
    'unclaimed_zimbabwe_businesses'
  );
}

main();
