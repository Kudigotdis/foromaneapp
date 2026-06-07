/* ════════════════════════════════════════════════════════
   FOROMANE MEDIA CACHE - IndexedDB blob cache for promo media
   + FOROMANE_IMG_MODE — Online/Offline/Saved mode controller
   ════════════════════════════════════════════════════════ */

const ForomaneMediaCache = {
  async init() {},

  async get(url) {
    return window.ForomaneDB.get('mediaCache', url);
  },

  async put(url, blob, contentType) {
    return window.ForomaneDB.put('mediaCache', {
      url: url,
      blob: blob,
      contentType: contentType || blob.type || 'image/png',
      cachedAt: Date.now(),
      size: blob.size
    });
  },

  async delete(url) {
    return window.ForomaneDB.delete('mediaCache', url);
  },

  async clear() {
    return window.ForomaneDB.clear('mediaCache');
  },

  async cacheImage(url) {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error('Fetch failed: ' + response.status);
    const blob = await response.blob();
    await this.put(url, blob);
    return blob;
  },

  /**
   * TASK 1: Weekly Package Manifest Sync
   * Fetches a list of URLs and caches them sequentially.
   */
  async syncFromManifest(manifestUrl, onProgress) {
    try {
      const response = await fetch(manifestUrl);
      const urls = await response.json();
      
      if (!Array.isArray(urls)) throw new Error('Invalid manifest format');

      let completed = 0;
      for (const url of urls) {
        const cached = await this.get(url);
        if (!cached) {
          try {
            await this.cacheImage(url);
          } catch (e) {
            console.warn(`Failed to cache ${url}:`, e);
          }
        }
        completed++;
        if (onProgress) onProgress(completed, urls.length);
      }
      return { total: urls.length, cached: completed };
    } catch (error) {
      console.error('Manifest Sync Error:', error);
      throw error;
    }
  },

  async cacheAll(promos, onProgress) {
    const urls = new Set();
    (promos || []).forEach(p => {
      (p.images || []).forEach(img => {
        if (img && !img.startsWith('data:')) urls.add(img);
      });
    });
    const arr = Array.from(urls);
    let completed = 0;
    for (const url of arr) {
      const cached = await this.get(url);
      if (!cached) {
        try { await this.cacheImage(url); } catch(e) { /* skip unfetchable */ }
      }
      completed++;
      if (onProgress) onProgress(completed, arr.length);
    }
    return { total: arr.length, cached: completed };
  },

  async getInfo() {
    const all = await window.ForomaneDB.getAll('mediaCache');
    let totalSize = 0;
    (all || []).forEach(entry => totalSize += (entry.size || 0));
    return { count: (all || []).length, totalSizeBytes: totalSize, totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2) };
  }
};

window.ForomaneMediaCache = ForomaneMediaCache;

/* ─── IMAGE MODE CONTROLLER ─── */

const FOROMANE_IMG_MODE = {
  current: localStorage.getItem('foromane_img_mode') || 'live',

  _VISUAL: { live: 1, saved: 1 },
  _TEXT: { 'text-mode': 1, lite: 1 },

  set(mode) {
    var prev = this.current;
    this.current = mode;
    localStorage.setItem('foromane_img_mode', mode);
    this.updateUI();
    var label = document.getElementById('data-mode-label');
    if (label) {
      var names = { 'live': 'Live', 'text-mode': 'Text Mode', 'saved': 'Saved', 'lite': 'Lite' };
      label.textContent = names[mode] || mode;
    }
    // In-place refresh when switching between visual modes (live ↔ saved)
    if (this._VISUAL[prev] && this._VISUAL[mode]) {
      this.refreshPromoImages();
    } else if (typeof renderPromos === 'function') {
      renderPromos();
    }
  },

  getImgSrc(originalUrl) {
    if (!originalUrl) return '';
    if (originalUrl.startsWith('data:')) return originalUrl;
    if (this.current === 'live') return originalUrl;
    if (this.current === 'text-mode' || this.current === 'lite') return '';
    if (this.current === 'saved') {
      if (location.protocol === 'file:' && !originalUrl.startsWith('http')) return originalUrl;
      return 'assets/media/foromane_place_holder_image.webp';
    }
    return 'assets/media/offline-mode-image.png';
  },

  needsAsyncResolve(originalUrl) {
    if (!originalUrl || originalUrl.startsWith('data:')) return false;
    if (this.current !== 'saved') return false;
    if (location.protocol === 'file:' && !originalUrl.startsWith('http')) return false;
    return true;
  },

  /**
   * TASK 3: Smart Fallback
   * Checks assets/categories/ (Live) before defaulting to cache.
   */
  async resolve(originalUrl) {
    if (!originalUrl) return '';
    
    // Skip cache for Data URLs entirely
    if (originalUrl.startsWith('data:')) return originalUrl;
    
    if (this.current === 'live') return originalUrl;
    if (this.current === 'text-mode' || this.current === 'lite') return '';

    if (this.current === 'saved') {
      if (originalUrl.startsWith('assets/categories/')) return originalUrl;
      if (location.protocol === 'file:' && !originalUrl.startsWith('http')) return originalUrl;

      const result = await ForomaneMediaCache.get(originalUrl);
      if (result) return URL.createObjectURL(result.blob);

      if (navigator.onLine) {
        try {
          const blob = await ForomaneMediaCache.cacheImage(originalUrl);
          return URL.createObjectURL(blob);
        } catch(e) {
          return 'assets/media/no_link.png';
        }
      }
      return 'assets/media/no_link.png';
    }
    return 'assets/media/no_link.png';
  },

  async resolveAll(images) {
    const results = {};
    for (const url of images) {
      results[url] = await this.resolve(url);
    }
    return results;
  },

  updateUI() {
    var label = document.getElementById('data-mode-label');
    if (label) {
      var names = { 'live': 'Live', 'text-mode': 'Text Mode', 'saved': 'Saved', 'lite': 'Lite' };
      label.textContent = names[this.current] || this.current;
    }
  },

  refreshPromoImages() {
    var cards = document.querySelectorAll('.promo-card');
    if (!cards.length) return;
    var self = this;
    cards.forEach(function(card) {
      var imgs = card.querySelectorAll('.promo-img');
      imgs.forEach(function(img) {
        var origUrl = img.getAttribute('data-original-url') || img.src;
        if (!origUrl || origUrl.startsWith('data:') || origUrl.startsWith('assets/media/')) return;
        if (!img.getAttribute('data-original-url')) img.setAttribute('data-original-url', origUrl);
        var newSrc = self.getImgSrc(origUrl);
        if (newSrc) img.src = newSrc;
        if (self.needsAsyncResolve(origUrl)) {
          img.classList.add('promo-img-loading');
          self.resolve(origUrl).then(function(resolved) {
            img.classList.remove('promo-img-loading');
            if (resolved) img.src = resolved;
          });
        }
      });
    });
  }
};

window.FOROMANE_IMG_MODE = FOROMANE_IMG_MODE;

async function downloadMediaPackage() {
  var allPromos = [].concat(window._promos || [], window._userItems || []);
  var statusEl = document.getElementById('media-cache-status');
  if (!allPromos.length) {
    if (statusEl) statusEl.textContent = 'No media';
    showToast('No promos to cache');
    return;
  }
  var count = 0;
  allPromos.forEach(function(p) {
    if (p.images) count += p.images.filter(function(i) { return i && !i.startsWith('data:'); }).length;
  });
  if (!count) {
    if (statusEl) statusEl.textContent = '0';
    showToast('All media already local');
    return;
  }
  if (statusEl) statusEl.textContent = '0/' + count + '...';
  await ForomaneMediaCache.cacheAll(allPromos, function(done, total) {
    if (statusEl) statusEl.textContent = done + '/' + total;
  });
  var info = await ForomaneMediaCache.getInfo();
  if (statusEl) statusEl.textContent = info.count + ' (' + info.totalSizeMB + 'MB)';
  showToast('Media cached: ' + info.count + ' files (' + info.totalSizeMB + 'MB)');
}

window.downloadMediaPackage = downloadMediaPackage;

/* ─── DATA MODE MODAL ─── */

const DATA_MODE_EXPLAINERS = {
  'live': 'Full images loaded from the internet.\nRequires an active data connection.\nBest for real-time browsing.',
  'text-mode': 'Promo cards in text-only format.\nFast browsing with minimal data usage.\nIdeal for slow or limited connections.',
  'saved': 'Full promos with images stored on your device.\nIncludes product photos and complete details.\nBrowse offline with the richest experience.',
  'lite': 'Text-only promo data stored on your device.\nMinimal storage with essential details.\nPerfect for quick offline access.'
};

function getCurrentWeekOfMonth() {
  var d = new Date();
  return Math.ceil(d.getDate() / 7);
}

function getMonthName() {
  return ['January','February','March','April','May','June','July','August','September','October','November','December'][new Date().getMonth()];
}

async function getPackageInfo(type) {
  if (!window.ForomaneDB || !window.ForomaneDB.db) return null;
  try {
    var pkg = await ForomaneDB.get('packages', 'foromane_' + type + '_package');
    return pkg || null;
  } catch(e) { return null; }
}

async function downloadPackage(type) {
  if (!window.ForomaneDB || !window.ForomaneDB.db) { showToast('Database not ready'); return; }
  var promos = window._promos || [];
  var pkg = {
    id: 'foromane_' + type + '_package',
    type: type,
    week: getCurrentWeekOfMonth(),
    month: getMonthName(),
    downloadedAt: Date.now(),
    promos: promos.map(function(p) {
      return {
        id: p.id, title: p.title, desc: p.desc || '', category: p.category || 'General',
        basePrice: p.basePrice || p.price || 0, price: p.price || p.basePrice || 0,
        unit: p.unit || 'each', qty: p.qty || 1,
        businessName: p.businessName, businessId: p.businessId,
        location: p.location || '', emoji: p.emoji || '',
        tags: p.tags || [], images: type === 'saved' ? (p.images || []) : []
      };
    })
  };
  var btn = document.getElementById('download-btn-' + type);
  try {
    await ForomaneDB.put('packages', pkg);
    if (type === 'saved') {
      if (btn) { btn.disabled = true; btn.innerHTML = 'Caching images...'; }
      await ForomaneMediaCache.cacheAll(promos, function(done, total) {
        if (btn) btn.innerHTML = 'Caching ' + done + '/' + total + '...';
      });
    }
    showToast(type === 'saved' ? 'Saved package downloaded!' : 'Lite package downloaded!');
    openDataModeModal();
  } catch(e) {
    console.error('Failed to save package:', e);
    showToast('Download failed');
    if (btn) { btn.disabled = false; btn.innerHTML = 'Retry'; }
  }
}

async function deletePackage(type) {
  if (!window.ForomaneDB || !window.ForomaneDB.db) return;
  try {
    await ForomaneDB.delete('packages', 'foromane_' + type + '_package');
    showToast('Package deleted');
    openDataModeModal();
  } catch(e) { console.error('Failed to delete package:', e); }
}

async function clearMediaCache() {
  if (!window.ForomaneMediaCache) return;
  try {
    var info = await window.ForomaneMediaCache.getInfo();
    if (!info || info.count === 0) { showToast('No cached media'); return; }
    await window.ForomaneMediaCache.clear();
    showToast('Cleared ' + info.count + ' cached images');
    openDataModeModal();
  } catch(e) { console.error('Failed to clear cache:', e); showToast('Failed to clear cache'); }
}

async function viewPackage(type) {
  var pkg = await getPackageInfo(type);
  if (!pkg) { showToast('No package found'); return; }
  window._promos = pkg.promos;
  FOROMANE_IMG_MODE.current = type === 'saved' ? 'saved' : 'lite';
  localStorage.setItem('foromane_img_mode', FOROMANE_IMG_MODE.current);
  var label = document.getElementById('data-mode-label');
  if (label) label.textContent = type === 'saved' ? 'Saved' : 'Lite';
  closeModal('data-mode-modal');
  if (typeof renderPromos === 'function') renderPromos();
}

function estimatePackageSize(promos, type) {
  var textBytes = 0;
  var imageCount = 0;
  (promos || []).forEach(function(p) {
    textBytes += (p.title || '').length;
    textBytes += (p.desc || '').length;
    textBytes += (p.businessName || '').length;
    textBytes += (p.location || '').length;
    textBytes += (p.category || '').length;
    textBytes += 20;
    if (type === 'saved' && p.images) {
      p.images.forEach(function(img) {
        if (img && !img.startsWith('data:')) imageCount++;
      });
    }
  });
  var kb = textBytes / 1024 + imageCount * 150;
  if (kb >= 1024) return (kb / 1024).toFixed(1) + ' MB';
  return Math.round(kb) + ' KB';
}

async function openDataModeModal() {
  var body = document.getElementById('data-mode-body');
  if (!body) return;
  var current = FOROMANE_IMG_MODE.current;
  var sections = [
    { title: 'Online', modes: ['live', 'text-mode'] },
    { title: 'Offline', modes: ['saved', 'lite'] }
  ];
  var html = '';
  sections.forEach(function(section) {
    html += '<div class="section-title">' + section.title + '</div>';
    html += '<div class="mode-group">';
    section.modes.forEach(function(mode) {
      var active = mode === current;
      var label = mode === 'text-mode' ? 'Text Mode' : mode.charAt(0).toUpperCase() + mode.slice(1);
      var explainer = (DATA_MODE_EXPLAINERS[mode] || '').replace(/\n/g, '<br>');
      html += '<div class="data-mode-row' + (active ? ' active' : '') + '" onclick="selectDataMode(\'' + mode + '\')">';
      html += '<div class="mode-indicator"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>';
      html += '<div class="mode-content">';
      html += '<div class="mode-title">' + label + '</div>';
      html += '<div class="mode-desc">' + explainer + '</div>';
      if (mode === 'saved' || mode === 'lite') {
        html += '<div id="pkg-actions-' + mode + '" class="pkg-actions">';
        html += '<span style="font-size:11px;color:var(--grey-mid);">Checking...</span>';
        html += '</div>';
      }
      html += '</div></div>';
    });
    html += '</div>';
  });
  html += '<div class="section-title">Storage</div>';
  html += '<div style="padding:0 16px 8px;font-size:11px;color:var(--grey-mid);">';
  html += 'Cached media are stored in your browser for offline use.';
  html += ' <button onclick="clearMediaCache()" style="background:none;border:none;color:var(--accent);text-decoration:underline;cursor:pointer;padding:0;font:inherit;">Clear all cached media</button>';
  html += '</div>';
  body.innerHTML = html;

  ['saved', 'lite'].forEach(async function(type) {
    var container = document.getElementById('pkg-actions-' + type);
    if (!container) return;
    var pkg = await getPackageInfo(type);
    if (pkg) {
      var storageHtml = '';
      if (type === 'saved' && window.ForomaneMediaCache) {
        var info = await window.ForomaneMediaCache.getInfo();
        if (info && info.count > 0) {
          var s = info.totalSizeMB >= 1 ? info.totalSizeMB + ' MB' : Math.round(info.totalSizeBytes / 1024) + ' KB';
          storageHtml = '<div style="font-size:10px;color:var(--grey-mid);margin-top:4px;">' + info.count + ' images cached \u00b7 ' + s + '</div>';
        }
      }
      container.innerHTML =
        '<span style="font-size:11px;color:var(--grey-mid);">Week ' + pkg.week + ' - ' + pkg.month + '</span>' +
        storageHtml +
        '<div style="display:flex;gap:8px;margin-top:6px;">' +
        '<button class="btn-download" onclick="viewPackage(\'' + type + '\')" style="flex:1;justify-content:center;">View</button>' +
        '<button class="btn-download" onclick="deletePackage(\'' + type + '\')" style="flex:1;justify-content:center;background:transparent;color:var(--grey-dark);">Delete</button>' +
        '</div>';
    } else {
      var size = estimatePackageSize(window._promos, type);
      var week = getCurrentWeekOfMonth();
      var month = getMonthName();
      container.innerHTML =
        '<button class="btn-download" id="download-btn-' + type + '" onclick="event.stopPropagation();downloadPackage(\'' + type + '\')">' +
          '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>' +
          'Download Week ' + week + ' - ' + month + ' (' + size + ')' +
        '</button>';
    }
  });
  openModal('data-mode-modal');
}

function selectDataMode(mode) {
  closeModal('data-mode-modal');
  FOROMANE_IMG_MODE.set(mode);
}

window.DATA_MODE_EXPLAINERS = DATA_MODE_EXPLAINERS;
window.getCurrentWeekOfMonth = getCurrentWeekOfMonth;
window.getMonthName = getMonthName;
window.getPackageInfo = getPackageInfo;
window.downloadPackage = downloadPackage;
window.deletePackage = deletePackage;
window.viewPackage = viewPackage;
window.estimatePackageSize = estimatePackageSize;
window.openDataModeModal = openDataModeModal;
window.selectDataMode = selectDataMode;
window.clearMediaCache = clearMediaCache;


