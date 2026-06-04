const child_process = require('child_process');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');

async function startProcess(cmd, args, opts = {}) {
  const p = child_process.spawn(cmd, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], ...opts });
  p.stdout.setEncoding('utf8');
  p.stderr.setEncoding('utf8');
  return p;
}

(async () => {
  console.log('Starting mock sync server...');
  const mock = await startProcess(process.execPath, [path.join(ROOT, 'mock-sync-server.js')]);

  mock.stdout.on('data', d => process.stdout.write('[mock] ' + d));
  mock.stderr.on('data', d => process.stderr.write('[mock:err] ' + d));

  console.log('Starting dev static server...');
  const dev = await startProcess(process.execPath, [path.join(ROOT, 'dev-server.js')]);
  dev.stdout.on('data', d => process.stdout.write('[dev] ' + d));
  dev.stderr.on('data', d => process.stderr.write('[dev:err] ' + d));

  // Wait briefly for servers to start
  await new Promise(r => setTimeout(r, 1200));

  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const pageErrors = [];

  page.on('console', msg => console.log('[page]', msg.text()));
  page.on('pageerror', err => {
    pageErrors.push(err && (err.stack || err.message) || String(err));
    console.error('[page:error]', err);
  });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('foromane_userId', 'general');
    localStorage.setItem('foromane_img_mode', 'saved');
  });

  const url = 'http://localhost:8080';
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Navigate from welcome view to promo feed (init() shows welcome by default)
  await page.evaluate(() => {
    if (typeof enterApp === 'function') enterApp();
    if (typeof renderPromos === 'function') renderPromos();
  });

  await page.waitForFunction(() => {
    return document.querySelectorAll('#promo-feed .promo-card').length > 0;
  }, { timeout: 10000 });

  const promoState = await page.evaluate(() => ({
    cardCount: document.querySelectorAll('#promo-feed .promo-card').length,
    imageCount: document.querySelectorAll('#promo-feed .promo-img, #promo-feed .promo-img-ph').length,
    imgModeReady: !!window.FOROMANE_IMG_MODE,
    mediaCacheReady: !!window.ForomaneMediaCache,
    feedText: document.getElementById('promo-feed')?.innerText.slice(0, 120) || ''
  }));

  if (pageErrors.length) {
    throw new Error('Page errors during startup:\n' + pageErrors.join('\n'));
  }
  if (!promoState.imgModeReady || !promoState.mediaCacheReady) {
    throw new Error('Media cache globals did not initialize: ' + JSON.stringify(promoState));
  }
  if (promoState.cardCount === 0 || promoState.imageCount === 0) {
    throw new Error('Promo feed did not render cards/images: ' + JSON.stringify(promoState));
  }
  console.log('Promo feed rendered:', JSON.stringify(promoState));

  // Load sw-register helper and register SW
  await page.evaluate(async () => {
    const txt = await fetch('/sw-register.js').then(r => r.text());
    eval(txt);
    const res = await registerForomaneSW();
    window._e2e_sw_res = res;
    return res;
  });

  // Ensure SyncQueue is available (load sync.js if necessary)
  const syncLoaded = await page.evaluate(async () => {
    if (!window.SyncQueue) {
      const txt = await fetch('/sync.js').then(r=>r.text());
      eval(txt);
    }
    // ensure endpoint uses same-origin proxy path (dev-server proxies to mock)
    if (window.SyncQueue) window.SyncQueue.syncEndpoint = '/sync/commit';
    return !!window.SyncQueue;
  });

  if (!syncLoaded) throw new Error('SyncQueue not available');

  // Enqueue a test item and flush
  await page.evaluate(async () => {
    const id = 'puppeteer_test_' + Date.now();
    await window.SyncQueue.enqueue('promos', { id, title: 'Puppeteer E2E Test' }, { clientId: 'puppeteer' });
    // flush immediately
    const res = await window.SyncQueue.flush();
    window._e2e_flush = res;
    return res;
  });
  // Inspect flush result from page
  const flushRes = await page.evaluate(() => window._e2e_flush || {});
  const processed = flushRes.processed || 0;
  if (processed > 0) {
    console.log('Flush processed items:', processed);
  } else {
    console.warn('Flush did not process items', flushRes);
  }

  await browser.close();

  mock.kill();
  dev.kill();

  if (processed === 0) process.exit(2);
  console.log('E2E Puppeteer test completed successfully');
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
