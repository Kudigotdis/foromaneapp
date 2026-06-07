/* ════════════════════════════════════════════════════════
   FOROMANE PROMOS - Feed rendering, KPI, status tracking,
   countdown timer, tags display
   ════════════════════════════════════════════════════════ */

function openBizFromPromo(businessId, businessName) {
  let biz = window.SAMPLE_BUSINESSES.find(b => b.id === businessId || b.name === businessName);
  if (!biz) biz = window.SAMPLE_BUSINESSES.find(b => b.name === businessName);
  if (biz) {
    openBizProfile(biz.id, biz.name, biz.initials, biz.color, biz.location, biz.phone || '', biz.public, biz.description || '', false);
  } else {
    openBizProfile(businessId, businessName, '', '#999', '', '', false, '', false);
  }
}

/* ─── PROMO STATUS CHECKER ─── */
function checkPromoStatuses() {
  const now = new Date();
  let changed = false;

  (window._promos || []).forEach(p => {
    if (!p.promo) return;
    if (p.promo.status === 'active' && p.promo.expiresAt) {
      const expires = new Date(p.promo.expiresAt);
      if (now >= expires) {
        p.promo.status = 'ended';
        p.promo.active = false;
        changed = true;
      }
    }
  });

  if (changed) {
    renderPromos();
  }
}

// Check every 60 seconds
setInterval(checkPromoStatuses, 60000);

/* ─── FORMAT REMAINING TIME ─── */
function getPromoRemaining(expiresAt) {
  if (!expiresAt) return { text: '', expired: true };
  const now = new Date();
  const end = new Date(expiresAt);
  const diff = end - now;
  if (diff <= 0) return { text: 'Ended', expired: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return { text: days + 'd ' + hours + 'h remaining', expired: false };
  if (hours > 0) return { text: hours + 'h ' + mins + 'm remaining', expired: false };
  return { text: mins + 'm remaining', expired: false };
}

/* ─── RENDER KPI ─── */
function renderKpiStrip(kpi) {
  if (!kpi) return '';
  const v = kpi.views || 0;
  const l = kpi.likes || 0;
  const i = kpi.interactions || 0;
  return '<div class="promo-kpi">' +
    '<span><span class="kpi-icon">\ud83d\udc41</span> ' + v + '</span>' +
    '<span><span class="kpi-icon">\u2764\ufe0f</span> ' + l + '</span>' +
    '<span><span class="kpi-icon">\ud83d\udccb</span> ' + i + '</span>' +
    '</div>';
}

/* ─── RENDER TAGS ─── */
function renderPromoTags(tags) {
  if (!tags || tags.length === 0) return '';
  const maxTags = 3;
  const overflow = tags.length - maxTags;
  return '<div class="promo-tags">' +
    tags.map(function(t, i) {
      return '<span class="promo-tag' + (i >= maxTags ? ' promo-tag-hidden' : '') + '">' + t + '</span>';
    }).join('') +
    (overflow > 0 ? '<span class="promo-tag promo-tag-more" onclick="this.parentElement.classList.toggle(\'expanded\')">+' + overflow + '</span>' : '') +
    '</div>';
}

function getPromoImgMode() {
  return window.FOROMANE_IMG_MODE || {
    getImgSrc: function(originalUrl) {
      return originalUrl || 'assets/media/foromane_place_holder_image_blank.webp';
    },
    needsAsyncResolve: function() {
      return false;
    },
    resolve: async function(originalUrl) {
      return originalUrl || 'assets/media/no_link.png';
    }
  };
}

/* ─── BATCH RENDER STATE ─── */
var _promoPage = 0;
const PROMO_BATCH_SIZE = 24;

function formatPromoLocation(loc) {
  if (typeof loc === 'object' && loc) {
    return (loc.town || '') + (loc.area ? ' | ' + loc.area : '');
  }
  return loc || '';
}

function _renderPromoCard(p, imgMode) {
  const isOwnPromo = p.businessId === 'biz_user';
  const status = p.promo ? getPromoRemaining(p.promo.expiresAt) : { text: '', expired: false };
  const kpiHtml = renderKpiStrip(p.kpi);

  const card = document.createElement('div');
  card.className = 'promo-card';
  card.id = 'promo-' + p.id;

  let statusBadge = status.expired
    ? '<div class="promo-status-badge ended">Ended</div>'
    : (status.text ? '<div class="promo-status-badge active">' + status.text + '</div>' : '');

  let imgHtml;
  if (p.images && p.images.length > 1) {
    imgHtml = '<div class="promo-carousel" id="carousel-' + p.id + '">';
    p.images.forEach(function(img) {
      var src = imgMode.getImgSrc(img);
      imgHtml += '<img src="' + src + '" class="promo-img" alt="' + p.title + '" onerror="this.src=\'assets/media/no_link.png\'" loading="lazy" width="800" height="800"' +
        (imgMode.needsAsyncResolve(img) ? ' data-original-url="' + img.replace(/"/g, '&quot;') + '"' : '') + '>';
    });
    imgHtml += '</div>' +
      '<div class="carousel-dots" id="dots-' + p.id + '">';
    p.images.forEach(function(_, i) {
      imgHtml += '<span class="carousel-dot' + (i === 0 ? ' active' : '') + '" onclick="scrollCarouselTo(\'' + p.id + '\',' + i + ')"></span>';
    });
    imgHtml += '</div>';
  } else if (p.images && p.images.length === 1) {
    var img = p.images[0];
    var src = imgMode.getImgSrc(img);
    imgHtml = '<img src="' + src + '" class="promo-img" alt="' + p.title + '" onerror="this.src=\'assets/media/no_link.png\'" loading="lazy" width="800" height="800"' +
      (imgMode.needsAsyncResolve(img) ? ' data-original-url="' + img.replace(/"/g, '&quot;') + '"' : '') + '>';
  } else {
    imgHtml = '<div class="promo-img-ph ' + (p.bg || 'img-amber') + '"><span class="promo-img-emoji">' + (p.emoji || '\ud83d\udce6') + '</span></div>';
  }

  card.innerHTML =
    '<div class="promo-img-wrap" onclick="trackPromoView(\'' + p.id + '\'); togglePromo(\'' + p.id + '\')">' +
      imgHtml +
    '</div>' +
    '<div class="promo-details">' +
      '<div class="promo-supplier" onclick="openBizFromPromo(\'' + p.businessId + '\',\'' + p.businessName.replace(/'/g,"\\'") + '\')">' +
        (function(bId, init, col){ var logo = window.getBusinessLogo(bId); return logo ? '<img src="' + logo + '" class="avatar-square" style="object-fit:cover;" alt="" onerror="this.outerHTML=\'<div class=avatar-square style=background:' + col + ';>' + init + '</div>\'">' : '<div class="avatar-square" style="background:' + col + ';">' + init + '</div>'; })(p.businessId, p.businessInit, p.businessColor) +
        '<div>' +
          '<div style="font-size:16px;" id="promo-biz-name-' + p.id + '">' + p.businessName + '</div>' +
          '<div style="font-size:13px;color:var(--grey-dark);font-weight:400;" id="promo-biz-loc-' + p.id + '">' + formatPromoLocation(p.location) + '</div>' +
        '</div>' +
      '</div>' +
      (isOwnPromo ? '<div style="font-size:10px;color:var(--orange);font-weight:600;margin-bottom:4px;">Your Promo</div>' : '') +
      '<div class="promo-title">' + p.title + '</div>' +
      (p.brand ? '<div class="promo-brand"><i class="fas fa-tag" style="margin-right:4px;font-size:11px;"></i>' + p.brand + '</div>' : '') +
      '<div class="promo-desc">' + (p.desc || '') + '</div>' +
      '<div class="qty-row">' +
        '<div class="qty-price"><div>P <span class="cp">' + ((p.basePrice || p.price || 0) * (p.qty || 1)).toFixed(2) + '</span></div><div style="font-size:12px;font-weight:400;color:var(--orange);margin-top:2px;">' + (p.unit || 'each') + '</div></div>' +
        '<div class="qty-controls">' +
          '<button class="qty-btn" onclick="changeQty(\'' + p.id + '\',-1,' + (p.basePrice || p.price || 0) + ',this)">\u2212</button>' +
          '<span class="qv" style="min-width:20px;text-align:center;">' + (p.qty || 1) + '</span>' +
          '<button class="qty-btn" onclick="changeQty(\'' + p.id + '\',1,' + (p.basePrice || p.price || 0) + ',this)">+</button>' +
        '</div>' +
      '</div>' +

      (isOwnPromo ? kpiHtml : '') +

      (isOwnPromo && p.promo ? '<div class="promo-cost-info">Cost: P ' + (p.promo.cost || p.cost || 0).toFixed(2) + '</div>' : '') +

      '<div class="promo-actions">' + statusBadge +
        '<button class="action-btn" onclick="addToNote(\'' + p.id + '\')"><img src="assets/icons/solid/add-to-note_orange.webp" style="height:16px;vertical-align:middle;object-fit:contain;"></button>' +
        '<span class="action-divider">|</span>' +
        '<button class="action-btn" onclick="sharePromo(\'' + p.id + '\')"><img src="assets/icons/solid/share-nodes_whatsapp_green.webp" style="width:14px;height:14px;vertical-align:middle;"></button>' +
        (isOwnPromo || window.Auth?.isAdmin() ?
        '<span class="action-divider">|</span><button class="action-btn" onclick="openFbPromo(\'' + p.id + '\')"><img src="assets/icons/facebook_icon_f.webp" style="height:14px;vertical-align:middle;object-fit:contain;"></button>' : '') +
        (isOwnPromo ? '' :
        '<span class="action-divider">|</span><button class="action-btn ' + (p.liked ? 'liked' : '') + '" id="like-' + p.id + '" onclick="toggleLike(\'' + p.id + '\', this)">' +
          '<img src="assets/icons/heart_' + (p.liked ? 'active' : 'inactive') + '_icon.webp" style="width:16px;height:16px;vertical-align:middle;" loading="lazy">' +
        '</button>') +
      '</div>' +
    '</div>';

  if (card.querySelector('[data-original-url]')) {
    setTimeout(function() {
      var imgs = card.querySelectorAll('.promo-img[data-original-url]');
      for (var j = 0; j < imgs.length; j++) {
        (function(img) {
          img.classList.add('promo-img-loading');
          imgMode.resolve(img.getAttribute('data-original-url')).then(function(resolved) {
            img.classList.remove('promo-img-loading');
            if (resolved) img.src = resolved;
          });
        })(imgs[j]);
      }
    }, 0);
  }

  return card;
}

/* ─── MAIN RENDER (batched) ─── */
function renderPromos() {
  const feed = document.getElementById('promo-feed');
  if (!feed) return;

  const mode = window.FOROMANE_IMG_MODE ? window.FOROMANE_IMG_MODE.current : 'live';
  if (mode === 'text-mode' || mode === 'lite') {
    renderTextPromos();
    return;
  }

  const imgMode = getPromoImgMode();
  var promos = (typeof applyFilters === 'function') ? applyFilters() : (window._promos || []);

  if (window.ForomaneCadence) {
    var dayCats = window.ForomaneCadence.getCurrentDayCategories();
    if (dayCats.length > 0) {
      promos = promos.slice().sort(function(a, b) {
        var aMatch = dayCats.indexOf(a.category) >= 0 || dayCats.indexOf(a.businessName) >= 0;
        var bMatch = dayCats.indexOf(b.category) >= 0 || dayCats.indexOf(b.businessName) >= 0;
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    }
  }

  if (promos.length === 0) {
    if (currentCountry === 'zimbabwe') {
      feed.innerHTML =
        '<div style="text-align:center;padding:48px 16px;color:var(--grey-dark);">' +
        '<div style="font-size:40px;margin-bottom:12px;display:block;color:var(--grey-mid);">\ud83c\udff1</div>' +
        '<p style="font-size:15px;font-weight:600;margin-bottom:6px;">Zimbabwe coming soon</p>' +
        '<p style="font-size:13px;">Foromane hasn\u2019t launched in Zimbabwe yet. Be the first to create a listing when we arrive!</p>' +
        '</div>';
    } else {
      feed.innerHTML =
        '<div style="text-align:center;padding:48px 16px;color:var(--grey-dark);">' +
        '<div style="font-size:40px;margin-bottom:12px;display:block;color:var(--grey-mid);">\ud83d\udce2</div>' +
        '<p style="font-size:15px;font-weight:600;margin-bottom:6px;">No promos yet</p>' +
        '<p style="font-size:13px;">Switch to a Business account to add items and boost them to the Promos feed!</p>' +
        '<button class="btn btn-sm" style="margin-top:16px;max-width:200px;margin-left:auto;margin-right:auto;" onclick="openSwitcher()">Switch Account</button>' +
        '</div>';
    }
    return;
  }

  feed.innerHTML = '';
  _promoPage = 0;
  _appendPromoBatch(promos, imgMode, feed);
}

function _appendPromoBatch(promos, imgMode, feed) {
  var fragment = document.createDocumentFragment();
  var start = _promoPage * PROMO_BATCH_SIZE;
  var end = Math.min(start + PROMO_BATCH_SIZE, promos.length);
  var batch = promos.slice(start, end);

  for (var i = 0; i < batch.length; i++) {
    fragment.appendChild(_renderPromoCard(batch[i], imgMode));
  }

  feed.appendChild(fragment);

  if (end < promos.length) {
    var moreBtn = document.createElement('button');
    moreBtn.className = 'promo-load-more';
    moreBtn.textContent = 'Show more (' + (promos.length - end) + ' left)';
    moreBtn.onclick = function() {
      moreBtn.remove();
      _promoPage++;
      _appendPromoBatch(promos, imgMode, feed);
    };
    feed.appendChild(moreBtn);
  }
}

window.renderPromos = renderPromos;

/* ─── TRACK PROMO VIEW ─── */
const _viewedPromos = JSON.parse(localStorage.getItem('_viewedPromos') || '{}');

async function trackPromoView(id) {
  const idStr = String(id);
  if (_viewedPromos[idStr]) return;
  _viewedPromos[idStr] = true;
  localStorage.setItem('_viewedPromos', JSON.stringify(_viewedPromos));

  UserState.kpi.views++;
  try { await ForomaneDB.put('kpi', { id: UserState.id, ...UserState.kpi }); } catch(e) {}
  updateKPI();

  // Track per-promo KPI
  const p = window._promos.find(x => String(x.id) === idStr);
  if (p && p.kpi) {
    p.kpi.views = (p.kpi.views || 0) + 1;
    try { await ForomaneDB.put('promos', p); } catch(e) {}
    // Enqueue promo KPI update for sync
    try {
      if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') {
        await window.SyncQueue.enqueue('promos_update', { id: p.id, kpi: p.kpi }, { clientId: UserState.id });
        if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{});
      }
    } catch(e) { console.warn('Failed to enqueue promo view update:', e); }
  }
}

function togglePromo(id) {
  const cards = document.querySelectorAll('.promo-card.open');
  const current = document.getElementById('promo-' + id);
  if (!current) return;
  const wasOpen = current.classList.contains('open');
  cards.forEach(c => c.classList.remove('open'));
  if (!wasOpen) {
    current.classList.add('open');
    current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (document.querySelector('.promo-card.open')) {
    window.togglePromoShell(true);
  } else {
    window.togglePromoShell(false);
  }
}

/* ─── TEXT PROMO CARD (for text-mode / lite) ─── */

function renderTextPromos() {
  var feed = document.getElementById('promo-feed');
  if (!feed) return;
  var promos = (typeof applyFilters === 'function') ? applyFilters() : (window._promos || []);
  if (promos.length === 0) {
    feed.innerHTML =
      '<div style="text-align:center;padding:48px 16px;color:var(--grey-dark);">' +
      '<p style="font-size:14px;font-weight:600;">No promos available in this mode</p>' +
      '</div>';
    return;
  }
  feed.innerHTML = '';
  promos.forEach(function(p) {
    var isOwnPromo = p.businessId === 'biz_user';
    var status = p.promo ? getPromoRemaining(p.promo.expiresAt) : { text: '', expired: false };
    var statusBadge = status.expired
      ? '<div class="promo-status-badge ended">Ended</div>'
      : (status.text ? '<div class="promo-status-badge active">' + status.text + '</div>' : '');
    var card = document.createElement('div');
    card.className = 'promo-text-card';
    card.id = 'ptext-' + p.id;
    card.innerHTML =
      '<div class="promo-text-main" onclick="toggleTextPromo(\'' + p.id + '\')">' +
        '<div class="promo-title">' + p.title + '</div>' +
        '<div class="qty-row" style="margin-top:0;">' +
'<div class="qty-price"><div>P <span class="cp">' + ((p.basePrice || p.price || 0) * (p.qty || 1)).toFixed(2) + '</span></div><div style="font-size:12px;font-weight:400;color:var(--orange);margin-top:2px;">' + (p.unit || 'each') + '</div></div>' +
          '<div class="qty-controls">' +
            '<button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + p.id + '\',-1,' + (p.basePrice || p.price || 0) + ',this)">\u2212</button>' +
            '<span class="qv" style="min-width:20px;text-align:center;">' + (p.qty || 1) + '</span>' +
            '<button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + p.id + '\',1,' + (p.basePrice || p.price || 0) + ',this)">+</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="promo-text-extra">' +
        '<div class="promo-text-thumb-flex">' +
          (function(bId){ var logo = window.getBusinessLogo(bId); return logo ? '<img src="' + logo + '" class="promo-text-thumb" alt="">' : ''; })(p.businessId) +
          '<div class="promo-text-biz-info" onclick="openBizFromPromo(\'' + p.businessId + '\',\'' + (p.businessName || '').replace(/'/g,"\\'") + '\')">' +
            '<div class="promo-text-biz-name">' + (p.businessName || 'Unknown') + '</div>' +
            '<div class="promo-text-biz-location">' + (typeof p.location === 'object' && p.location ? (p.location.town || '') + (p.location.area ? ' \u00B7 ' + p.location.area : '') : (p.location || 'Category: ' + (p.category || 'General'))) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="promo-desc">' + (p.desc || '') + '</div>' +
        '<div class="promo-actions">' + statusBadge +
          '<button class="action-btn" onclick="addToNote(\'' + p.id + '\')"><img src="assets/icons/solid/add-to-note_orange.webp" style="height:16px;vertical-align:middle;object-fit:contain;"></button>' +
          '<span class="action-divider">|</span>' +
          '<button class="action-btn" onclick="sharePromo(\'' + p.id + '\')"><img src="assets/icons/solid/share-nodes_whatsapp_green.webp" style="width:14px;height:14px;vertical-align:middle;"></button>' +
          (isOwnPromo || window.Auth?.isAdmin() ?
          '<span class="action-divider">|</span><button class="action-btn" onclick="openFbPromo(\'' + p.id + '\')"><img src="assets/icons/facebook_icon_f.webp" style="height:14px;vertical-align:middle;object-fit:contain;"></button>' : '') +
          (isOwnPromo ? '' :
          '<span class="action-divider">|</span><button class="action-btn ' + (p.liked ? 'liked' : '') + '" id="like-' + p.id + '" onclick="toggleLike(\'' + p.id + '\', this)">' +
            '<img src="assets/icons/heart_' + (p.liked ? 'active' : 'inactive') + '_icon.webp" style="width:16px;height:16px;vertical-align:middle;" loading="lazy">' +
          '</button>') +
        '</div>' +
      '</div>';
    feed.appendChild(card);
  });
}

function toggleTextPromo(id) {
  var cards = document.querySelectorAll('.promo-text-card.open');
  var current = document.getElementById('ptext-' + id);
  if (!current) return;
  var wasOpen = current.classList.contains('open');
  cards.forEach(function(c) { c.classList.remove('open'); });
  if (!wasOpen) current.classList.add('open');
}

function changeQty(promoId, delta, basePrice, btn) {
  var card = btn ? btn.closest('.promo-card, .promo-text-card') : null;
  if (!card) card = document.getElementById('promo-' + promoId) || document.getElementById('ptext-' + promoId) || document.getElementById('bizp-' + promoId);
  if (!card) return;
  const qv = card.querySelector('.qv');
  const cp = card.querySelector('.cp');
  let q = parseInt(qv.innerText) + delta;
  if (q < 1) q = 1;
  qv.innerText = q;
  cp.innerText = (q * basePrice).toFixed(2);
  const p = window._promos.find(x => String(x.id) === String(promoId));
  if (p) {
    p.qty = q;
    if (p.kpi) p.kpi.interactions = (p.kpi.interactions || 0) + 1;
  }
}

async function toggleLike(id, btnEl) {
  const p = window._promos.find(x => String(x.id) === String(id));
  if (!p) return;
  p.liked = !p.liked;

  const btn = btnEl || document.getElementById('like-' + id);
  if (btn) {
    btn.className = 'action-btn' + (p.liked ? ' liked' : '');
    btn.innerHTML = '<img src="assets/icons/heart_' + (p.liked ? 'active' : 'inactive') + '_icon.webp" style="width:16px;height:16px;vertical-align:middle;" loading="lazy">';
  }

  if (p.liked) {
    UserState.kpi.likes++;
    if (p.kpi) p.kpi.likes = (p.kpi.likes || 0) + 1;
  } else {
    UserState.kpi.likes = Math.max(0, UserState.kpi.likes - 1);
    if (p.kpi) p.kpi.likes = Math.max(0, (p.kpi.likes || 0) - 1);
  }

  try { await ForomaneDB.put('promos', p); } catch(e) { console.error('Failed to save like to DB:', e); }
  try {
    if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') {
      await window.SyncQueue.enqueue('promos_update', { id: p.id, liked: p.liked, kpi: p.kpi }, { clientId: UserState.id });
      if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{});
    }
  } catch(e) { console.warn('Failed to enqueue promo like update:', e); }
  updateKPI();

  var likedPromos = JSON.parse(localStorage.getItem('foromane_liked_promos') || '[]');
  if (p.liked) {
    if (likedPromos.indexOf(id) === -1) likedPromos.push(id);
  } else {
    likedPromos = likedPromos.filter(function(pid) { return pid !== id; });
  }
  localStorage.setItem('foromane_liked_promos', JSON.stringify(likedPromos));
}

function openAddToNoteModal(promoId) {
  const p = window._promos.find(x => String(x.id) === String(promoId));
  if (!p) return;
  const card = document.getElementById('promo-' + promoId);
  if (!card) return;
  const qv = card.querySelector('.qv');
  const qty = parseInt(qv.innerText);
  window._pendingPromoItem = { promoId, qty, promo: p };
  openModal('add-to-note-modal');
}

async function createNewNoteWithItem() {
  closeModal('add-to-note-modal');
  const item = window._pendingPromoItem;
  if (!item) return;
  const note = { id: 'note_' + Date.now(), title: 'New Note', thumbnail: '', body: '', userId: UserState.id, items: [] };
  note.items.push({
    title: item.promo.title, emoji: item.promo.emoji || '\ud83d\udce6',
    price: item.promo.basePrice || item.promo.price || 0,
    unit: item.promo.unit || 'each', business: item.promo.businessName, qty: item.qty
  });
  window._notes.push(note);
  try { await ForomaneDB.put('notes', note); } catch(e) { console.error('Failed to save note:', e); }
  try {
    if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') {
      await window.SyncQueue.enqueue('notes', note, { clientId: UserState.id });
      if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{});
    }
  } catch(e) { console.warn('Failed to enqueue note for sync:', e); }
  if (item.promo.kpi) item.promo.kpi.addedToNotes = (item.promo.kpi.addedToNotes || 0) + 1;
  UserState.kpi.noteAdds++;
  updateKPI();
  renderNotes();
  openNote(note.id);
}

function openNoteSelection() {
  closeModal('add-to-note-modal');
  renderNoteSelection();
  goTo('view-select-note-to-update');
}

function renderNoteSelection() {
  const el = document.getElementById('note-selection-list');
  if (!el) return;
  const uid = UserState.id;
  const userNotes = (window._notes || []).filter(function(n) { return n.userId === uid; });
  if (userNotes.length === 0) {
    el.innerHTML =
      '<div style="text-align:center;padding:32px 16px;color:var(--grey-dark);">' +
      '<p style="font-size:14px;margin-bottom:12px;">You don\'t have any notes yet.</p>' +
      '</div>';
    return;
  }
  el.innerHTML = userNotes.map(function(note) {
    var count = note.items.reduce(function(s, i) { return s + (i.qty || 1); }, 0);
    var total = note.items.reduce(function(s, i) { return s + (i.price * (i.qty || 1)); }, 0);
    return '<div class="note-select-row" onclick="addItemToNote(\'' + note.id + '\')">' +
      '<div style="font-size:24px;">' + (note.items[0] ? (note.items[0].emoji || '\ud83d\udccb') : '\ud83d\udccb') + '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:14px;font-weight:600;">' + (note.title || 'Untitled') + '</div>' +
        '<div style="font-size:11px;color:var(--grey-dark);">' + count + ' items \u00b7 P ' + total.toFixed(2) + '</div>' +
      '</div>' +
      '<span style="font-size:18px;color:var(--orange);">\u203A</span>' +
    '</div>';
  }).join('');
}

async function addItemToNote(noteId) {
  const item = window._pendingPromoItem;
  if (!item) return;
  const note = window._notes.find(function(n) { return n.id === noteId; });
  if (!note) return;
  note.items.push({
    title: item.promo.title, emoji: item.promo.emoji || '\ud83d\udce6',
    price: item.promo.basePrice || item.promo.price || 0,
    unit: item.promo.unit || 'each', business: item.promo.businessName, qty: item.qty
  });
  try { await ForomaneDB.put('notes', note); } catch(e) { console.error('Failed to save note:', e); }
  try {
    if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') {
      await window.SyncQueue.enqueue('notes', note, { clientId: UserState.id });
      if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{});
    }
  } catch(e) { console.warn('Failed to enqueue note for sync:', e); }
  if (item.promo.kpi) item.promo.kpi.addedToNotes = (item.promo.kpi.addedToNotes || 0) + 1;
  UserState.kpi.noteAdds++;
  updateKPI();
  renderNotes();
  showToast('\u2705 Added to note!');
  goBack();
}

// Legacy alias for backward compatibility
async function addToNote(promoId) {
  openAddToNoteModal(promoId);
}

function sharePromo(id) {
  const p = window._promos.find(x => String(x.id) === String(id));
  if (!p) return;
  const text = 'Check out: ' + p.title + ' - P' + ((p.basePrice || p.price || 0)).toFixed(2) + ' ' + (p.unit || 'each') + ' from ' + p.businessName + ' on Foromane Construction Hub!';
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
}

/* ─── CAROUSEL HELPERS ─── */
function scrollCarouselTo(promoId, index) {
  var carousel = document.getElementById('carousel-' + promoId);
  if (!carousel) return;
  var imgs = carousel.querySelectorAll('img');
  if (imgs[index]) {
    imgs[index].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }
}

function updateCarouselDots(promoId) {
  var carousel = document.getElementById('carousel-' + promoId);
  var dots = document.getElementById('dots-' + promoId);
  if (!carousel || !dots) return;
  var idx = Math.round(carousel.scrollLeft / (carousel.clientWidth || 1));
  if (idx >= dots.children.length) idx = dots.children.length - 1;
  if (idx < 0) idx = 0;
  Array.from(dots.children).forEach(function(d, i) {
    d.classList.toggle('active', i === idx);
  });
}

// Bind scroll listener via mutation observer for dynamically rendered carousels
document.addEventListener('scroll', function(e) {
  var target = e.target;
  if (target && target.classList && target.classList.contains('promo-carousel')) {
    updateCarouselDots(target.id.replace('carousel-', ''));
  }
}, true);

/* ─── INIT ─── */
window._promos = [];
if (typeof loadDemoExtraData === 'function') {
  loadDemoExtraData().then(function() {
    window._promos = [...(window.SAMPLE_PROMOS || [])];
    if (typeof renderPromos === 'function') renderPromos();
    if (typeof checkPromoStatuses === 'function') checkPromoStatuses();
  });
}
window.togglePromo = togglePromo;
window.changeQty = changeQty;
window.toggleLike = toggleLike;
window.addToNote = addToNote;
window.openAddToNoteModal = openAddToNoteModal;
window.createNewNoteWithItem = createNewNoteWithItem;
window.openNoteSelection = openNoteSelection;
window.addItemToNote = addItemToNote;
window.sharePromo = sharePromo;
window.renderTextPromos = renderTextPromos;
window.toggleTextPromo = toggleTextPromo;
window.trackPromoView = trackPromoView;
window.checkPromoStatuses = checkPromoStatuses;

/* ─── FACEBOOK PROMO → redirects to new artwork submission ─── */
function openFbPromo(promoId) {
  openArtworkSubmission();
}

function submitFbPromo() {
  // Legacy — redirect to artwork submission
  openArtworkSubmission();
}

window.openFbPromo = openFbPromo;
window.submitFbPromo = submitFbPromo;

/* ─── QUICK ADD TO NOTE (from catalogue) ─── */
async function addToNoteQuick(id, title, price, unit, business) {
  if (window.Auth?.isGuest()) { showToast('Create a profile to save notes'); return; }
  let note = window._notes.find(n => n.title === 'Saved from Catalogue');
  if (!note) {
    note = { id: 'note_' + Date.now(), title: 'Saved from Catalogue', userId: UserState.id, items: [] };
    window._notes.push(note);
    try { await ForomaneDB.put('notes', note); } catch(e) {}
  }
  note.items.push({ title: title, emoji: '📦', price: price, unit: unit, business: business, qty: 1 });
  try { await ForomaneDB.put('notes', note); } catch(e) { console.error('Failed to save note:', e); }
  renderNotes();
  showToast('✅ Added to note!');
}

window.addToNoteQuick = addToNoteQuick;
window.getPromoRemaining = getPromoRemaining;
window.openBizFromPromo = openBizFromPromo;
