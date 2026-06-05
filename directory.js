/* ════════════════════════════════════════════════════════
   FOROMANE DIRECTORY - Business & Pro listings with A-Z nav
   ════════════════════════════════════════════════════════ */

let dirMode = localStorage.getItem('foromane_dirMode') || 'companies';
let selectedTrades = [];

var UNCLAIMED_LOGO = 'assets/images/company_logos_dummy/foromane_logo_thumbnail_unclaimed_business.webp';

function _expandUnclaimed(tuple) {
  return {
    id: tuple[0],
    name: tuple[1],
    category: tuple[2],
    location: tuple[3],
    phone: tuple[4],
    initials: tuple[5],
    color: tuple[6],
    logo: UNCLAIMED_LOGO,
    isUnclaimed: true
  };
}

// ── Claimed business state ────────────────────────────
var _claimedCache = null;
var _claimsLoaded = false;

function _loadClaims() {
  if (_claimsLoaded) return Promise.resolve(undefined);
  try {
    _claimedCache = JSON.parse(localStorage.getItem('foromane_claims') || '{}');
  } catch(e) {
    _claimedCache = {};
  }
  _claimsLoaded = true;
  if (typeof _getFirebase !== 'function') return Promise.resolve(undefined);
  return _getFirebase().then(function(fb) {
    if (!fb || !fb.firestore) return;
    var C = fb.firestore;
    return C.getDocs(C.collection(fb.db, 'claims')).then(function(snap) {
      snap.forEach(function(d) {
        var data = d.data();
        _claimedCache[d.id] = { userId: data.userId, userName: data.userName, claimedAt: data.claimedAt };
      });
      try { localStorage.setItem('foromane_claims', JSON.stringify(_claimedCache)); } catch(e2) {}
    }).catch(function(err) {
      console.warn('Firestore claims sync failed:', err.message);
    });
  });
}

function isBusinessClaimed(bizId) {
  return !!(window._claimedCache && window._claimedCache[bizId]);
}

function claimBusiness(bizId, bizName) {
  var us = window.UserState;
  if (!us || !us.id || us.id === 'guest') {
    showToast('Please log in to claim a business');
    return;
  }
  if (isBusinessClaimed(bizId)) {
    showToast('This business has already been claimed');
    return;
  }
  var claimData = {
    userId: us.id,
    userName: us.name || 'Unknown',
    businessName: bizName,
    businessId: bizId,
    claimedAt: new Date().toISOString()
  };
  _claimedCache[bizId] = claimData;
  try { localStorage.setItem('foromane_claims', JSON.stringify(_claimedCache)); } catch(e) {}
  if (typeof _getFirebase !== 'function') {
    showToast('Business claimed! It will be verified soon.');
    return;
  }
  _getFirebase().then(function(fb) {
    if (!fb || !fb.firestore) {
      showToast('Business claimed (offline — will sync later)');
      return;
    }
    var C = fb.firestore;
    C.setDoc(C.doc(fb.db, 'claims', bizId), {
      userId: us.id,
      userName: us.name || 'Unknown',
      businessName: bizName,
      claimedAt: C.Timestamp.fromDate(new Date())
    }).then(function() {
      showToast('Business claimed successfully!');
    }).catch(function(err) {
      console.warn('Firestore claim failed, saved locally:', err.message);
    });
  });
}

// ── Lazy-loading unclaimed business data (all chunks in parallel, one render) ──
var _unclaimedDataLoading = {};

function _ensureUnclaimedData(country) {
  var isZw = country === 'zimbabwe';
  var key = isZw ? 'zw' : 'bw';
  var arr = isZw ? window.UNCLAIMED_ZIMBABWE_BUSINESSES : window.UNCLAIMED_BOTSWANA_BUSINESSES;
  if (arr && arr._chunksDone) return true;
  if (_unclaimedDataLoading[key]) return false;
  _unclaimedDataLoading[key] = true;

  var base = isZw ? 'data/unclaimed_zimbabwe_businesses_' : 'data/unclaimed_botswana_businesses_';
  var totalChunks = 0;
  var loadedCount = 0;

  function _expandAndRender() {
    var target = isZw ? window.UNCLAIMED_ZIMBABWE_BUSINESSES : window.UNCLAIMED_BOTSWANA_BUSINESSES;
    if (target) {
      for (var ci = 0; ci < target.length; ci++) {
        if (Array.isArray(target[ci])) target[ci] = _expandUnclaimed(target[ci]);
      }
      target._chunksDone = 1;
    }
    delete _unclaimedDataLoading[key];
    renderDirectory();
  }

  // Load chunk 1 first to discover total chunks from embedded _chunksTotal
  var s = document.createElement('script');
  s.src = base + '1.js';
  s.onload = function() {
    var target = isZw ? window.UNCLAIMED_ZIMBABWE_BUSINESSES : window.UNCLAIMED_BOTSWANA_BUSINESSES;
    totalChunks = (target && target._chunksTotal) || 1;
    loadedCount = 1;
    for (var i = 2; i <= totalChunks; i++) {
      var t = document.createElement('script');
      t.src = base + i + '.js';
      t.onload = function() { loadedCount++; if (loadedCount >= totalChunks) _expandAndRender(); };
      t.onerror = function() { loadedCount++; if (loadedCount >= totalChunks) _expandAndRender(); };
      document.head.appendChild(t);
    }
    if (totalChunks <= 1) _expandAndRender();
  };
  s.onerror = function() {
    delete _unclaimedDataLoading[key];
    renderDirectory();
  };
  document.head.appendChild(s);

  return false;
}

const DIR_TYPES = ['Suppliers', 'Pros', 'Council & Public'];

function openDirTypeModal() {
  const container = document.getElementById('dir-type-options');
  container.innerHTML = DIR_TYPES.map(type => {
    const isSelected = type === dirModeLabels[dirMode];
    return '<div style="padding:14px 16px; border-bottom:1px solid rgba(0,0,0,0.2); font-size:15px; cursor:pointer;' + (isSelected ? ' background:var(--orange-light); font-weight:600; color:var(--orange);' : '') + '" onclick="selectDirType(\'' + type + '\')">' + type + (isSelected ? ' <img src="assets/icons/solid/check-2_orange.webp" style="width:16px;height:16px;float:right;">' : '') + '</div>';
  }).join('');
  openModal('dir-type-modal');
}

function selectDirType(label) {
  const modeMap = { 'Suppliers': 'companies', 'Pros': 'pros', 'Council & Public': 'council' };
  dirMode = modeMap[label] || 'companies';
  localStorage.setItem('foromane_dirMode', dirMode);
  document.getElementById('dir-type-btn').textContent = label;
  closeModal('dir-type-modal');

  var serviceRow = document.getElementById('service-and-location-filter-row');
  var tradesmanRow = document.getElementById('tradesman-type-and-location-filter-row');
  if (dirMode === 'pros') {
    if (serviceRow) serviceRow.style.display = 'none';
    if (tradesmanRow) tradesmanRow.style.display = '';
  } else {
    if (serviceRow) serviceRow.style.display = '';
    if (tradesmanRow) tradesmanRow.style.display = 'none';
  }

  renderDirectory();
}

const dirModeLabels = { 'companies': 'Suppliers', 'pros': 'Pros', 'council': 'Council & Public' };

var dirBtn = document.getElementById('dir-type-btn');
if (dirBtn) dirBtn.textContent = dirModeLabels[dirMode] || 'Suppliers';

function getTradeKeys() {
  return window.TRADE_SPECIFIC ? Object.keys(window.TRADE_SPECIFIC) : [];
}

function formatTradeKey(key) {
  return key.split('_').map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
}

function openTradesmenSheet() {
  renderTradesmenCheckboxes();
  openModal('tradesmen-modal');
}

function renderTradesmenCheckboxes() {
  var body = document.getElementById('tradesmen-sheet-body');
  if (!body) return;
  var keys = getTradeKeys();
  var allChecked = selectedTrades.length === 0;
  var html = '<div style="padding:14px 16px; border-bottom:1px solid rgba(0,0,0,0.2); cursor:pointer; font-size:15px; font-weight:600; background:' + (allChecked ? 'var(--orange-light)' : 'transparent') + ';" onclick="toggleTradesmenCheckbox(\'All Tradesmen\', true)">' +
    '<input type="checkbox" ' + (allChecked ? 'checked' : '') + ' style="margin-right:10px; accent-color:var(--orange);">All Tradesmen' +
  '</div>';
  keys.forEach(function(key) {
    var isChecked = selectedTrades.indexOf(key) !== -1;
    var label = formatTradeKey(key);
    html += '<div style="padding:10px 16px; border-bottom:1px solid rgba(0,0,0,0.2); font-size:14px; cursor:pointer;" onclick="toggleTradesmenCheckbox(\'' + key.replace(/'/g, "\\'") + '\', ' + (!isChecked) + ')">' +
      '<input type="checkbox" ' + (isChecked ? 'checked' : '') + ' style="margin-right:10px; accent-color:var(--orange);" onclick="event.stopPropagation(); toggleTradesmenCheckbox(\'' + key.replace(/'/g, "\\'") + '\', this.checked)">' + label +
    '</div>';
  });
  body.innerHTML = html;
}

function toggleTradesmenCheckbox(key, isChecked) {
  if (key === 'All Tradesmen') {
    selectedTrades = [];
    renderTradesmenCheckboxes();
    return;
  }
  if (isChecked) {
    if (selectedTrades.indexOf(key) === -1) selectedTrades.push(key);
  } else {
    selectedTrades = selectedTrades.filter(function(t) { return t !== key; });
  }
  renderTradesmenCheckboxes();
}

function updateTradesmenFilterText() {
  var btn = document.getElementById('tradesmen-filter-btn');
  if (!btn) return;
  if (selectedTrades.length === 0) {
    btn.textContent = 'All Tradesmen';
  } else if (selectedTrades.length === 1) {
    btn.textContent = formatTradeKey(selectedTrades[0]);
  } else {
    btn.textContent = '+' + selectedTrades.length + ' Tradesmen';
  }
}

function applyTradesmenFilter() {
  updateTradesmenFilterText();
  closeModal('tradesmen-modal');
  renderDirectory();
}

window.openTradesmenSheet = openTradesmenSheet;
window.toggleTradesmenCheckbox = toggleTradesmenCheckbox;
window.applyTradesmenFilter = applyTradesmenFilter;

function renderDirectory() {
  const el = document.getElementById('directory-list');
  if (!el) return;

  if (dirMode === 'pros') {
    renderPros(el);
    return;
  }

  if (dirMode === 'council') {
    el.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--grey-dark);"><i class="fas fa-building" style="font-size:40px;margin-bottom:12px;display:block;color:var(--grey-mid);"></i><p style="font-size:15px;font-weight:600;margin-bottom:4px;">No Council & Public accounts yet</p><p style="font-size:13px;">Register your organisation to appear here.</p></div>';
    return;
  }

  _loadClaims();

  if (!_ensureUnclaimedData(currentCountry)) {
    el.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--grey-dark);"><i class="fas fa-spinner fa-pulse" style="font-size:28px;margin-bottom:12px;display:block;color:var(--orange);"></i><p style="font-size:14px;">Loading directory...</p></div>';
    return;
  }

  let businesses;
  if (currentCountry === 'zimbabwe') {
    businesses = window.ZIMBABWE_BUSINESSES ? [...window.ZIMBABWE_BUSINESSES] : [];
    (window.UNCLAIMED_ZIMBABWE_BUSINESSES || []).forEach(function(uz) { if (!businesses.some(function(b) { return b.id === uz.id; })) businesses.push(uz); });
    if (businesses.length === 0) {
      el.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--grey-dark);"><i class="fas fa-address-book" style="font-size:40px;margin-bottom:12px;display:block;color:var(--grey-mid);"></i><p style="font-size:15px;font-weight:600;margin-bottom:4px;">Zimbabwe coming soon</p><p style="font-size:13px;">Supplier listings will appear here once they are registered in Zimbabwe.</p></div>';
      return;
    }
  } else {
    businesses = [...window.SAMPLE_BUSINESSES];
    (window.UNCLAIMED_BOTSWANA_BUSINESSES || []).forEach(function(ub) { if (!businesses.some(function(b) { return b.id === ub.id; })) businesses.push(ub); });
  }

  if (UserState.hasBusiness()) {
    const biz = UserState.business;
    const isPublic = biz.subscription === 'full' || biz.subscription === 'catalogue';
    if (businesses.some(b => b.id === biz.id || b.name === biz.name)) {
      // already in SAMPLE_BUSINESSES, skip duplicate
    } else {
    businesses.push({
      id: 'biz_user',
      name: biz.name,
      category: biz.category,
      location: biz.town,
      initials: biz.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      color: window.APP_COLORS[biz.name.charCodeAt(0) % window.APP_COLORS.length],
      phone: biz.phone || '',
      public: isPublic,
      description: biz.description || '',
      isUserBiz: true,
      subscription: biz.subscription || 'free'
    });
    }
  }

  if (selectedCategories.length > 0) {
    businesses = businesses.filter(function(b) {
      return selectedCategories.some(function(c) { return c.name === b.category; });
    });
  }

  if (selectedPlaceA !== 'Nation Wide') {
    businesses = businesses.filter(function(b) { return (b.town || b.location) === selectedPlaceA; });
  }

  if (businesses.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--grey-dark);"><i class="fas fa-address-book" style="font-size:40px;margin-bottom:12px;display:block;color:var(--grey-mid);"></i><p>No businesses yet.</p></div>';
    return;
  }

  businesses.sort((a, b) => a.name.localeCompare(b.name));

  // ── Virtual scroller: build layout, render visible slice ──
  const HEADER_H = 36;
  const CARD_H = 84;
  var letterGroups = {};
  businesses.forEach(function(b) {
    var firstChar = b.name.charAt(0).toUpperCase();
    var letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
    if (!letterGroups[letter]) letterGroups[letter] = [];
    letterGroups[letter].push(b);
  });

  var sortedLetters = Object.keys(letterGroups).sort(function(a, b) {
    if (a === '#') return -1;
    if (b === '#') return 1;
    return a < b ? -1 : 1;
  });

  var top = 0;
  _dirRows = [];
  sortedLetters.forEach(function(letter) {
    _dirRows.push({ type: 'header', letter: letter, top: top, height: HEADER_H });
    top += HEADER_H;
    letterGroups[letter].forEach(function(biz) {
      _dirRows.push({ type: 'card', biz: biz, top: top, height: CARD_H });
      top += CARD_H;
    });
  });
  _dirTotalH = top;

  var scroller = el.parentElement;
  if (scroller) _dirScrollEl = scroller;

  // Inner container sizing
  el.style.cssText = 'position:relative;height:' + _dirTotalH + 'px;padding:0;';

  // Floating sticky header
  var fh = document.getElementById('dir-floating-header');
  if (!fh) {
    fh = document.createElement('div');
    fh.id = 'dir-floating-header';
    fh.style.cssText = 'position:sticky;top:0;z-index:3;padding:8px 16px 4px;font-family:var(--font-head);font-size:18px;font-weight:700;color:var(--orange);background:var(--bg);display:none;';
    scroller.insertBefore(fh, el);
  }

  // Scroll handler
  scroller.onscroll = _onDirScroll;

  _onDirScroll();
}

// ── Virtual scroller state ──
var _dirRows = [];
var _dirTotalH = 0;
var _dirScrollEl = null;

function _onDirScroll() {
  if (!_dirScrollEl || _dirRows.length === 0) return;
  var el = document.getElementById('directory-list');
  if (!el) return;

  var st = _dirScrollEl.scrollTop;
  var vh = _dirScrollEl.clientHeight;
  var BUFFER = 400;
  var startY = Math.max(0, st - BUFFER);
  var endY = st + vh + BUFFER;
  var rows = _dirRows;

  // Binary search first visible row
  var lo = 0, hi = rows.length;
  while (lo < hi) {
    var mid = (lo + hi) >> 1;
    if (rows[mid].top + rows[mid].height < startY) lo = mid + 1;
    else hi = mid;
  }
  var si = lo;

  var ei = si;
  while (ei < rows.length && rows[ei].top < endY) ei++;

  // Build HTML for visible slice
  var html = '';
  for (var i = si; i < ei; i++) {
    var r = rows[i];
    if (r.type === 'header') {
      html += '<div style="position:absolute;top:' + r.top + 'px;left:0;right:0;height:' + r.height + 'px;padding:8px 16px 4px;font-family:var(--font-head);font-size:18px;font-weight:700;color:var(--orange);background:var(--bg);z-index:2;">' + r.letter + '</div>';
    } else {
      html += _vsCardHtml(r.biz, r.top, r.height);
    }
  }
  el.innerHTML = html;

  // Update floating header
  var fh = document.getElementById('dir-floating-header');
  if (!fh) return;
  var topIdx = lo;
  var headerIdx = -1;
  for (var j = topIdx; j >= 0; j--) {
    if (rows[j].type === 'header') { headerIdx = j; break; }
  }
  if (headerIdx >= 0) {
    fh.textContent = rows[headerIdx].letter;
    fh.style.display = '';
  } else {
    fh.style.display = 'none';
  }
}

function _vsCardHtml(b, top, height) {
  var ddId = 'dd-' + b.id;
  var nameEsc = b.name.replace(/'/g, "\\'");
  var locEsc = (b.location || '').replace(/'/g, "\\'");
  var phoneClean = b.phone ? b.phone.replace(/[^0-9]/g, '') : '';
  var bIdHtml = '<button class="fav-toggle-btn" onclick="event.stopPropagation();toggleFavDir(this,\'' + b.id + '\')">' +
    '<img src="assets/icons/' + (UserState.isFavourite(b.id) ? 'heart_active_icon' : 'heart_inactive_icon') + '.webp" style="width:22px;height:22px;display:block;" loading="lazy">' +
  '</button>';

  var claimedBadge = (b.isUnclaimed && isBusinessClaimed(b.id))
    ? '<span style="font-size:10px;color:var(--green,#27ae60);font-weight:600;background:#e8f5e9;padding:1px 6px;border-radius:3px;margin-left:6px;">Claimed</span>'
    : '';

  var avatarHtml = b.logo
    ? '<div class="logo-trigger-wrapper" onclick="event.stopPropagation();openBizProfile(\'' + b.id + '\',\'' + nameEsc + '\',\'' + (b.initials||'') + '\',\'' + (b.color||'#999') + '\',\'' + locEsc + '\',\'' + (b.phone||'') + '\',\'' + (b.public!==false) + '\',\'\',' + (b.isUserBiz?'true':'false') + ')">' +
      '<img src="' + window.assetUrl(b.logo) + '" class="dir-avatar" style="object-fit:cover;" alt="" loading="lazy" width="48" height="48" onerror="this.outerHTML=\'<div class=dir-avatar style=background:' + b.color + ';>' + b.initials + '</div>\'">' +
      '</div>'
    : '<div class="logo-trigger-wrapper" onclick="event.stopPropagation();openBizProfile(\'' + b.id + '\',\'' + nameEsc + '\',\'' + (b.initials||'') + '\',\'' + (b.color||'#999') + '\',\'' + locEsc + '\',\'' + (b.phone||'') + '\',\'' + (b.public!==false) + '\',\'\',' + (b.isUserBiz?'true':'false') + ')">' +
      '<div class="dir-avatar" style="background:' + b.color + ';">' + b.initials + '</div>' +
      '</div>';

  return '<div class="dir-card-group" style="position:absolute;top:' + top + 'px;left:16px;right:16px;height:' + height + 'px;">' +
    '<div class="dir-card" onclick="toggleDirDropdown(\'' + ddId + '\')">' +
      avatarHtml +
      '<div class="dir-info">' +
        '<h3 style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + b.name + claimedBadge + '</h3>' +
        '<p>' + (b.category || '') + ' \u00B7 ' + (b.location || '') + '</p>' +
      '</div>' +
      bIdHtml +
    '</div>' +
    '<div class="dropdown-actions-container" id="' + ddId + '">' +
      _buildDirCardDropdownHtml(b.id, nameEsc, phoneClean, locEsc, false, b.isUserBiz, b.isUnclaimed) +
    '</div>' +
  '</div>';
}

// Override scrollToAlpha to use virtual scroller positions
var _scrollToAlphaOrig = scrollToAlpha;
scrollToAlpha = function(letter) {
  var rows = _dirRows;
  if (rows.length > 0) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].type === 'header' && rows[i].letter === letter) {
        var scroller = _dirScrollEl || document.querySelector('.dir-scroll');
        if (scroller) { scroller.scrollTop = rows[i].top; return; }
        break;
      }
    }
  }
  // Fallback
  if (typeof _scrollToAlphaOrig === 'function') _scrollToAlphaOrig(letter);
};

function renderPros(el) {
  if (currentCountry === 'zimbabwe') {
    el.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--grey-dark);"><i class="fas fa-user-tie" style="font-size:40px;margin-bottom:12px;display:block;color:var(--grey-mid);"></i><p style="font-size:15px;font-weight:600;margin-bottom:4px;">Zimbabwe coming soon</p><p style="font-size:13px;">Professional listings will appear here once they are registered in Zimbabwe.</p></div>';
    return;
  }
  var allProfiles = window.DEMO_PROFILES || [];
  var pros = allProfiles.filter(function(p) {
    return p.role === 'Tradesperson (Contractor)' || p.role === 'Business & Materials Supplier';
  });
  if (selectedTrades.length > 0) {
    pros = pros.filter(function(p) {
      return selectedTrades.some(function(tradeKey) {
        var pId = p.id || '';
        var pName = (p.name || '').toLowerCase();
        var tradeWords = tradeKey.replace(/_/g, ' ').toLowerCase();
        return pId.toLowerCase().indexOf(tradeKey.replace(/_.*$/, '')) !== -1 || tradeWords.split(' ').some(function(w) { return pName.indexOf(w) !== -1; });
      });
    });
  }
  if (pros.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--grey-dark);"><i class="fas fa-user-tie" style="font-size:40px;margin-bottom:12px;display:block;color:var(--grey-mid);"></i><p>No pros listed yet.</p></div>';
    return;
  }

  pros.sort(function(a, b) { return a.name.localeCompare(b.name); });
  el.innerHTML = '';
  var letterGroups = {};

  pros.forEach(function(p) {
    var firstChar = p.name.charAt(0).toUpperCase();
    var letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
    if (!letterGroups[letter]) letterGroups[letter] = [];
    letterGroups[letter].push(p);
  });

  var sortedLettersPros = Object.keys(letterGroups).sort();
  sortedLettersPros.forEach(function(letter, idx) {
    var letterHeader = document.createElement('div');
    letterHeader.id = letter === '#' ? 'alpha-hash' : 'alpha-' + letter;
    letterHeader.style.cssText = 'padding:8px 16px 4px; font-family:var(--font-head); font-size:18px; font-weight:700; color:var(--orange); background:var(--bg); position:sticky; top:0; z-index:2;';
    letterHeader.textContent = letter;
    el.appendChild(letterHeader);

    letterGroups[letter].forEach(function(p) {
      var ddId = 'dd-pro-' + p.id;
      var nameEsc = (p.name || '').replace(/'/g, "\\'");
      var locEsc = (p.town || '').replace(/'/g, "\\'");
      var phoneClean = (p.phone || '').replace(/[^0-9]/g, '');

      var d = document.createElement('div');
      d.className = 'dir-card';
      var roleName = p.role || '';
      var locStr = p.town || '';
      var init = p.initials || (p.name ? p.name.split(' ').map(function(w) { return w[0]; }).join('').slice(0, 2).toUpperCase() : '?');
      var col = p.color || window.APP_COLORS[init.charCodeAt(0) % window.APP_COLORS.length];
      var profileImg = p.image || null;
      var avatarHtml = profileImg
        ? '<div class="logo-trigger-wrapper"><img src="' + window.assetUrl(profileImg) + '" class="dir-avatar" style="object-fit:cover;" alt="" loading="lazy" width="48" height="48" onerror="this.outerHTML=\'<div class=dir-avatar style=background:' + col + ';>' + init + '</div>\'"></div>'
        : '<div class="logo-trigger-wrapper"><div class="dir-avatar" style="background:' + col + ';">' + init + '</div></div>';
      d.innerHTML =
        avatarHtml +
        '<div class="dir-info">' +
          '<h3>' + p.name + '</h3>' +
          '<p>' + roleName + ' &middot; ' + locStr + '</p>' +
        '</div>' +
        '<button class="fav-toggle-btn" onclick="event.stopPropagation();toggleFavDir(this,\'' + p.id + '\')">' +
          '<img src="assets/icons/' + (UserState.isFavourite(p.id) ? 'heart_active_icon' : 'heart_inactive_icon') + '.webp" style="width:22px;height:22px;display:block;" loading="lazy">' +
        '</button>';

      var trigger = d.querySelector('.logo-trigger-wrapper');
      if (trigger) {
        trigger.onclick = function(e) {
          e.stopPropagation();
          openProProfile(p.id);
        };
      }

      d.onclick = function() { toggleDirDropdown(ddId); };

      var dd = document.createElement('div');
      dd.className = 'dropdown-actions-container';
      dd.id = ddId;
      dd.innerHTML = _buildDirCardDropdownHtml(p.id, nameEsc, phoneClean, locEsc, true, false, false);

      var w = document.createElement('div');
      w.className = 'dir-card-group';
      w.appendChild(d);
      w.appendChild(dd);
      el.appendChild(w);
    });

    if (idx < sortedLettersPros.length - 1) {
      var divider = document.createElement('hr');
      divider.style.cssText = 'margin:0;border:none;border-top:1px solid rgba(0,0,0,0.05);';
      el.appendChild(divider);
    }
  });

}

function scrollToAlpha(letter) {
  var id = letter === '#' ? 'alpha-hash' : 'alpha-' + letter;
  var section = document.getElementById(id);
  if (!section) return;
  var scrollContainer = document.querySelector('.dir-scroll');
  if (scrollContainer) {
    scrollContainer.scrollTop = section.offsetTop - scrollContainer.offsetTop;
  } else {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function openBizProfile(bizId, name, init, color, location, phone, isPublic, description, isUserBiz) {
  // Track the view in Firestore
  if (window.recordInteraction) {
     window.recordInteraction(bizId, 'views').catch(e => console.warn("KPI update failed", e));
  }
  
  const content = document.getElementById('biz-profile-content');
  if (!content) return;

  const isOwner = isUserBiz === true;

  let biz = window.SAMPLE_BUSINESSES.find(b => b.id === bizId || b.name === name);
  if (!biz) biz = (window.ZIMBABWE_BUSINESSES || []).find(b => b.id === bizId || b.name === name);
  if (!biz) biz = (window.UNCLAIMED_BOTSWANA_BUSINESSES || []).find(b => b.id === bizId || b.name === name);
  if (!biz) biz = (window.UNCLAIMED_ZIMBABWE_BUSINESSES || []).find(b => b.id === bizId || b.name === name);
  if (!biz && isOwner && UserState.hasBusiness()) {
    biz = UserState.business;
  }

  var isUnclaimedBiz = biz && biz.isUnclaimed === true;
  var isAlreadyClaimed = isUnclaimedBiz && window.isBusinessClaimed(bizId);

  const categories = biz && biz.categories ? biz.categories : (biz && biz.category ? [biz.category] : []);
  const catCount = categories.length;
  const cataloguePublic = biz && biz.cataloguePublic !== undefined ? biz.cataloguePublic : (isOwner ? (UserState.business && (UserState.business.subscription === 'full' || UserState.business.subscription === 'catalogue')) : true);

  let promos = window._promos.filter(p => p.businessId === bizId || p.businessName === name);
  const promoCount = promos.length;

  // Gather items for Brands count
  var bizItemsAll = (window.DEMO_CATALOGUE_ITEMS || []).filter(function(i) { return i.businessId === bizId || i.businessName === name; });
  if (isOwner) {
    try {
      var userItems = JSON.parse(localStorage.getItem('foromane_items') || '[]');
      userItems.forEach(function(i) { bizItemsAll.push(i); });
    } catch(e) {}
  }
  var brandSet = {};
  bizItemsAll.forEach(function(i) { if (i.brand && i.brand.trim()) brandSet[i.brand.trim().toLowerCase()] = i.brand.trim(); });
  var brandCount = Object.keys(brandSet).length;

  const phoneClean = phone ? phone.replace(/[^0-9+]/g, '') : '';
  const phoneWa = phone ? phone.replace(/[^0-9]/g, '') : '';
  const nameEsc = name.replace(/'/g, "\\'");
  const locationEsc = location.replace(/'/g, "\\'");

  // Store data for bottom-bar dropdowns
  var bizContacts = (isOwner && UserState.business && UserState.business.contacts) ? UserState.business.contacts : null;
  _bizDropdownData = { bizId: bizId, name: name, phone: phoneClean, phoneWa: phoneWa, location: location, contacts: bizContacts };

  const catItems = categories.map(c => `<div class="biz-cat-line" onclick="event.stopPropagation();openBizCatalogue('${bizId}','${nameEsc}','${locationEsc}','${phoneWa}','${color}','${init}','${c.replace(/'/g, "\\'")}')">${c}</div>`).join('');

  var bizLogo = window.getBusinessLogo(bizId);
  var bizLogo2 = window.getBusinessLogo2(bizId);
  var previewSrc = bizLogo2 || bizLogo;
  var avatarHtml = bizLogo
    ? '<img src="' + bizLogo + '" class="biz-avatar-img" alt="' + nameEsc + '" onclick="event.stopPropagation();openBizLogoPreview(\'' + previewSrc.replace(/'/g,"\\'") + '\',\'' + nameEsc + '\')" loading="lazy" width="80" height="80">'
    : '<div class="biz-avatar-img" style="background:' + color + ';">' + init + '</div>';

  // Location breakdown: extract town and area
  var townPart = location || '';
  var areaPart = '';
  if (biz && biz.location) {
    townPart = biz.location;
  }
  // Try to split location into town and area
  var locParts = townPart.split(',').map(function(s) { return s.trim(); });
  if (locParts.length > 1) {
    townPart = locParts[0];
    areaPart = locParts.slice(1).join(' \u00B7 ');
  } else {
    townPart = locParts[0];
    areaPart = '';
  }

  content.innerHTML = `
    <div style="padding:12px;">
      <div class="biz-header-card" id="biz-header-${bizId}">
        <div class="biz-header-card-inner">
          ${avatarHtml}
          <div class="biz-header-details" onclick="toggleBizCategories('${bizId}')">
            <div class="biz-header-name">${name}</div>
            <div class="biz-header-location">${townPart}${areaPart ? ' <span style="opacity:0.4;">\u00B7</span> ' + areaPart : ''}</div>
          </div>
        </div>
        ${description ? '<p class="biz-desc-text">' + description + '</p>' : ''}
        ${catCount > 0 ? '<div class="biz-categories-accordion">' + catItems + '</div>' : ''}
      </div>
    </div>
    ${buildCondensedHoursHtml(biz)}
    <div class="accordion">
      <div class="accordion-header" onclick="openBizPromos('${bizId}','${nameEsc}')">
        <span><i class="fas fa-bullhorn" style="color:var(--orange);margin-right:8px;"></i> Promos</span>
        <span style="color:var(--orange);font-size:14px;font-weight:700;">${promoCount}</span>
      </div>
    </div>
    <div class="accordion">
      <div class="accordion-header" onclick="openBizCatalogue('${bizId}','${nameEsc}','${locationEsc}','${phoneWa}','${color}','${init}')">
        <span><i class="fas fa-store" style="color:var(--orange);margin-right:8px;"></i> Catalogue</span>
        <span style="color:var(--orange);font-size:14px;font-weight:700;">${catCount}</span>
      </div>
    </div>
    <div class="accordion">
      <div class="accordion-header" onclick="openBizBrands('${bizId}','${nameEsc}','${locationEsc}','${phoneWa}','${color}','${init}')">
        <span><i class="fas fa-tag" style="color:var(--orange);margin-right:8px;"></i> Brands</span>
        <span style="color:var(--orange);font-size:14px;font-weight:700;">${brandCount}</span>
      </div>
    </div>
    ${isUnclaimedBiz ? (isAlreadyClaimed
      ? '<div style="text-align:center;padding:8px 16px;margin:8px 12px;background:#e8f5e9;border-radius:8px;font-size:13px;color:var(--green,#27ae60);font-weight:600;"><i class="fas fa-check-circle"></i> This business has been claimed</div>'
      : '<div style="text-align:center;padding:12px 16px;margin:8px 12px;background:#fff3e0;border-radius:8px;"><p style="font-size:13px;color:var(--grey-dark);margin:0 0 8px;">Is this your business? Claim it to manage your profile, promos and catalogue.</p><button class="btn" onclick="event.stopPropagation();claimBusiness(\'' + bizId + '\',\'' + nameEsc + '\');goTo(\'view-directory\')" style="padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;"><i class="fas fa-hand-paper"></i> Claim this Business</button></div>')
    : ''}
    <div style="text-align:center;padding:6px 0;">
      <span style="font-size:11px;color:var(--grey-dark);cursor:pointer;" onclick="reportBusiness('${bizId}','${nameEsc}')">Report this business</span>
    </div>
    <div class="biz-bottom-wrapper">
      <div class="biz-bottom-bar">
        <div id="biz-bar-actions">
          <img src="assets/icons/Call_on.webp" class="biz-bar-icon" onclick="toggleBizDropdown('call')">
          <img src="assets/icons/facebook_icon_on.webp" class="biz-bar-icon" onclick="toggleBizDropdown('facebook')">
          <img src="assets/icons/GPS_On.webp" class="biz-bar-icon" onclick="toggleBizDropdown('gps')">
          <img src="assets/icons/whatsApp_icon_on.webp" class="biz-bar-icon" onclick="toggleBizDropdown('whatsapp')">
          <img src="assets/icons/${UserState.isFavourite(bizId) ? 'heart_active_icon' : 'heart_inactive_icon'}.webp" class="biz-bar-icon" onclick="toggleFavBiz('${bizId}')" id="biz-heart-icon">
        </div>
      </div>
      ${_renderDropdownContainers()}
    </div>
  `;

  goTo('view-business');
}

function reportBusiness(bizId, bizName) {
  if (window.UserState && (window.UserState.id === 'guest' || !window.UserState.id)) {
    showToast('Please log in to report content');
    return;
  }
  var reason = prompt('Why are you reporting this business? (e.g., "Scam", "Incorrect info", "Spam")');
  if (!reason || reason.trim() === '') return;
  var details = prompt('Any additional details? (optional)');
  if (details === null) details = '';
  if (typeof window.flagContent === 'function') {
    window.flagContent('business', bizId, reason.trim(), details.trim()).then(function(result) {
      showToast('Thank you. This business has been reported.');
    }).catch(function(e) {
      showToast('Report failed: ' + e.message);
    });
  } else {
    showToast('Reporting is unavailable offline. Please try again when connected.');
  }
}

function toggleBizCategories(bizId) {
  var card = document.getElementById('biz-header-' + bizId);
  if (!card) return;
  card.classList.toggle('open');
}

function openBizLogoPreview(src, name) {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
  overlay.onclick = function() { document.body.removeChild(overlay); };
  overlay.innerHTML = '<img src="' + src.replace(/'/g,"\\'") + '" style="max-width:90%;max-height:90%;border-radius:8px;object-fit:contain;" alt="' + name.replace(/'/g,"\\'") + '">';
  document.body.appendChild(overlay);
}

function getProDemoProjects(proId, pro) {
  var saved = getProProfile(proId);
  if (saved && saved.projects && saved.projects.length > 0) return saved.projects;
  var name = pro.name || '';
  var imgBase = 'assets/images/categories_examples';
  var demos = [
    { id: 'p1', title: name + ' Job 1', desc: 'Completed project for a client in ' + (pro.location && pro.location.town || 'Gaborone') + '.', image: imgBase + '/boards-timber/timber/structural-timber/000002.webp' },
    { id: 'p2', title: name + ' Job 2', desc: 'Ongoing project showcasing professional expertise.', image: imgBase + '/attire-uniform/corporate-uniforms/shirts/000001.jpg' },
    { id: 'p3', title: name + ' Job 3', desc: 'Before and after transformation. Customer was very satisfied.', image: imgBase + '/attire-uniform/workwear/high-vis/000001.webp' },
    { id: 'p4', title: name + ' Job 4', desc: 'Another successful project completed in record time.', image: imgBase + '/attire-uniform/workwear/safety-boots/000001.jpg' }
  ];
  return demos;
}

function getProDemoRate(proId, pro) {
  var saved = getProProfile(proId);
  if (saved && saved.rateType && saved.rate) return { type: saved.rateType, amount: saved.rate };
  var cat = pro.tradeCategory || '';
  if (cat.indexOf('Automotive') > -1 || cat.indexOf('Transport') > -1) return { type: 'hourly', amount: 350 };
  if (cat.indexOf('Electrical') > -1 || cat.indexOf('Plumbing') > -1 || cat.indexOf('HVAC') > -1) return { type: 'hourly', amount: 400 };
  if (cat.indexOf('Building') > -1 || cat.indexOf('Civil') > -1 || cat.indexOf('Construction') > -1) return { type: 'hourly', amount: 300 };
  if (cat.indexOf('Cleaning') > -1 || cat.indexOf('Delivery') > -1) return { type: 'hourly', amount: 180 };
  if (cat.indexOf('Design') > -1 || cat.indexOf('Tech') > -1) return { type: 'fixed', amount: 1500 };
  return { type: 'quote', amount: 0 };
}

function getProDemoServices(proId, pro) {
  var saved = window.getProServices(proId);
  if (saved && saved.length > 0) return saved;
  var skills = pro.skills || [];
  var imgBase = 'assets/images/categories_examples';
  var defaultImgs = [
    imgBase + '/access-control-security/biometric-access/security_biometric_fingerprint.jpg',
    imgBase + '/attire-uniform/corporate-uniforms/shirts/000001.jpg',
    imgBase + '/attire-uniform/workwear/high-vis/000001.webp',
    imgBase + '/attire-uniform/workwear/safety-boots/000001.jpg'
  ];
  return skills.slice(0, 6).map(function(s, i) {
    return {
      id: 'svc-' + i,
      name: s,
      desc: 'Professional ' + s.toLowerCase() + ' service. Quality work guaranteed with years of experience.',
      price: 'P' + (Math.floor(Math.random() * 800) + 200),
      image: defaultImgs[i % defaultImgs.length]
    };
  });
}

function openProImagePreview(src, name) {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
  overlay.onclick = function() { document.body.removeChild(overlay); };
  overlay.innerHTML = '<img src="' + src.replace(/'/g,"\\'") + '" style="max-width:92%;max-height:92%;border-radius:4px;object-fit:contain;" alt="' + name.replace(/'/g,"\\'") + '">';
  document.body.appendChild(overlay);
}

function _getProData(proId) {
  var profile = (window.DEMO_PROFILES || []).find(function(p) { return p.id === proId; });
  if (!profile) return null;
  var isSupplier = profile.role === 'Business & Materials Supplier';
  var bizInfo = profile.businessInfo || null;
  var tradeName = isSupplier ? (bizInfo ? bizInfo.name + ' — ' + profile.role : profile.role) : profile.role;
  var locStr = profile.town || '';
  var proInit = profile.initials || (profile.name ? profile.name.split(' ').map(function(w) { return w[0]; }).join('').slice(0, 2).toUpperCase() : '?');
  var proCol = profile.color || window.APP_COLORS[proInit.charCodeAt(0) % window.APP_COLORS.length];
  var proImg = profile.image || null;
  var proBizLogo = isSupplier && bizInfo ? (bizInfo.logo || null) : null;
  var phoneRaw = profile.phone || (bizInfo ? bizInfo.phone : '') || '';
  var phoneClean = phoneRaw.replace(/[^0-9+]/g, '');
  var phoneWa = phoneRaw.replace(/[^0-9]/g, '');
  var description = isSupplier && bizInfo ? (bizInfo.description || '') : '';
  var rating = 0;
  return {
    id: profile.id, name: profile.name, nameEsc: profile.name.replace(/'/g, "\\'"),
    role: profile.role, tradeName: tradeName, locStr: locStr,
    proInit: proInit, proCol: proCol, proImg: proImg, proBizLogo: proBizLogo,
    phoneClean: phoneClean, phoneWa: phoneWa, description: description, rating: rating
  };
}

window.openProProfile = window.openProProfile || function(proId) {
  const content = document.getElementById('pro-profile-content');
  if (!content) return;

  var pro = _getProData(proId);
  if (!pro) { showToast('Professional not found'); return; }

  var avatarHtml = pro.proBizLogo
    ? '<img src="' + pro.proBizLogo + '" class="pro-avatar" style="object-fit:cover;" onclick="openProImagePreview(\'' + pro.proBizLogo.replace(/'/g,"\\'") + '\',\'' + pro.nameEsc + '\')" alt="" loading="lazy" width="80" height="80">'
    : pro.proImg
    ? '<img src="' + pro.proImg + '" class="pro-avatar" style="object-fit:cover;" onclick="openProImagePreview(\'' + pro.proImg.replace(/'/g,"\\'") + '\',\'' + pro.nameEsc + '\')" alt="" loading="lazy" width="80" height="80">'
    : '<div class="pro-avatar pro-avatar-initials" style="background:' + pro.proCol + ';">' + pro.proInit + '</div>';

  var starsHtml = pro.rating
    ? '\u2B50'.repeat(Math.floor(pro.rating)) + ' <span style="font-size:12px;color:var(--grey-dark);font-weight:600;">' + pro.rating.toFixed(1) + '</span>'
    : '';

  var skillsBody = '';

  var projectsBody = '<div class="project-carousel">' +
    '<div class="project-card">' +
      '<div class="project-card-body"><p style="font-size:12px;color:var(--grey-dark);">No projects listed yet.</p></div>' +
    '</div>' +
  '</div>';

  var ratesBody = '<div class="rates-card">' +
    '<div class="rate-row"><span class="rate-label">Rate</span><span class="rate-value">Contact for pricing</span></div>' +
    (pro.locStr ? '<div class="rate-row"><span class="rate-label">Service Area</span><span class="rate-value" style="font-size:13px;color:var(--text-main);font-weight:400;">' + pro.locStr + '</span></div>' : '') +
  '</div>';

  var servicesBody = '<div class="services-grid">' +
    '<div style="text-align:center;padding:16px;font-size:12px;color:var(--grey-dark);">No services listed.</div>' +
  '</div>';

  var descHtml = pro.description
    ? '<p style="font-size:13px;color:var(--text-sub);padding:0 16px 10px;line-height:1.4;">' + pro.description + '</p>'
    : '';

  _bizDropdownData = { bizId: pro.id, name: pro.name, phone: pro.phoneClean, phoneWa: pro.phoneWa, location: pro.locStr };

  content.innerHTML =
    '<div style="padding:10px 12px 0;">' +
      '<div class="pro-header-card">' +
        avatarHtml +
        '<div class="pro-details">' +
          '<h2>' + pro.name + '</h2>' +
          '<div class="pro-trade">' + pro.tradeName + '</div>' +
          '<div class="pro-location"><i class="fas fa-map-marker-alt" style="color:var(--orange);margin-right:4px;"></i>' + pro.locStr + '</div>' +
          (starsHtml ? '<div style="margin-top:4px;font-size:14px;">' + starsHtml + '</div>' : '') +
        '</div>' +
      '</div>' +
      descHtml +
      '<div class="accordion">' +
        '<div class="accordion-header" onclick="toggleAcc(this)">' +
          '<span><i class="fas fa-list" style="color:var(--orange);margin-right:8px;"></i> Skills</span>' +
          '<span class="chevron" style="color:var(--grey-dark);font-size:12px;">\u25BC</span>' +
        '</div>' +
        '<div class="accordion-body">' + skillsBody + '</div>' +
      '</div>' +
      '<div class="accordion">' +
        '<div class="accordion-header" onclick="toggleAcc(this)">' +
          '<span><i class="fas fa-images" style="color:var(--orange);margin-right:8px;"></i> Projects</span>' +
          '<span class="chevron" style="color:var(--grey-dark);font-size:12px;">\u25BC</span>' +
        '</div>' +
        '<div class="accordion-body">' + projectsBody + '</div>' +
      '</div>' +
      '<div class="accordion">' +
        '<div class="accordion-header" onclick="toggleAcc(this)">' +
          '<span><i class="fas fa-tag" style="color:var(--orange);margin-right:8px;"></i> Rates</span>' +
          '<span class="chevron" style="color:var(--grey-dark);font-size:12px;">\u25BC</span>' +
        '</div>' +
        '<div class="accordion-body">' + ratesBody + '</div>' +
      '</div>' +
      '<div class="accordion">' +
        '<div class="accordion-header" onclick="toggleAcc(this)">' +
          '<span><i class="fas fa-concierge-bell" style="color:var(--orange);margin-right:8px;"></i> Services</span>' +
          '<span class="chevron" style="color:var(--grey-dark);font-size:12px;">\u25BC</span>' +
        '</div>' +
        '<div class="accordion-body">' + servicesBody + '</div>' +
      '</div>' +
    '</div>';

  goTo('view-pro-profile');
};

window.calculateProCost = function(hourlyRate) {
  var hours = parseFloat(document.getElementById('rate-hours-input').value) || 1;
  var total = hourlyRate * hours;
  document.getElementById('rate-calc-result').textContent = 'P' + total.toFixed(2);
};

function openBizPromos(bizId, businessName) {
  const promos = window._promos.filter(p => p.businessId === bizId || p.businessName === businessName);
  let biz = window.SAMPLE_BUSINESSES.find(b => b.id === bizId || b.name === businessName);
  if (!biz) biz = (window.ZIMBABWE_BUSINESSES || []).find(b => b.id === bizId || b.name === businessName);
  const view = document.getElementById('view-business-promos');
  if (!view) return;

  const isOwner = bizId === 'biz_user';
  const pro = !biz ? (window.DEMO_PROFILES || []).find(function(p) { return p.id === bizId || p.name === businessName; }) : null;
  const targetView = pro ? 'view-pro-profile' : 'view-business';
  const loc = biz ? biz.location : (pro ? pro.town : '');
  const init = biz ? biz.initials : (pro ? (pro.initials || (pro.name ? pro.name.split(' ').map(function(w){return w[0]}).join('').slice(0,2).toUpperCase() : '?')) : '?');
  const color = biz ? biz.color : (pro ? (pro.color || '#999') : '#999');
  var bizLogo = biz ? window.getBusinessLogo(bizId) : null;
  var proImg = pro ? (pro.image || null) : null;
  var bizThumbHtml = bizLogo
    ? '<img src="' + bizLogo + '" class="biz-profile-thumb" style="object-fit:cover;" alt="" loading="lazy" width="48" height="48">'
    : proImg
    ? '<img src="' + proImg.replace(/'/g, "\\'") + '" class="biz-profile-thumb" style="object-fit:cover;" alt="" loading="lazy" width="48" height="48">'
    : '<div class="biz-profile-thumb" style="background:' + color + ';">' + init + '</div>';

  let promoHtml = '';

  if (promos.length === 0) {
    promoHtml = '<p style="text-align:center;padding:32px;color:var(--grey-dark);font-size:14px;">No active promos for this business.</p>';
  } else {
    promos.forEach(p => {
      const promoStatus = p.promo ? getPromoRemaining(p.promo.expiresAt) : { text: 'Active', expired: false };
      let statusBadge = '';
      if (isOwner) {
        if (promoStatus.expired) {
          statusBadge = '<div class="promo-status-badge ended">Ended</div>';
        } else {
          statusBadge = '<div class="promo-status-badge active">' + promoStatus.text + '</div>';
        }
      }

      let imgHtml;
      if (p.images && p.images.length > 1) {
        imgHtml = '<div class="promo-carousel" id="carousel-' + p.id + '">';
        p.images.forEach(function(img) {
          var src = FOROMANE_IMG_MODE.getImgSrc(img);
          imgHtml += '<img src="' + src + '" class="promo-img" alt="' + p.title + '" onerror="this.src=\'assets/media/no_link.png\'" loading="lazy" width="800" height="800"' +
            (FOROMANE_IMG_MODE.needsAsyncResolve(img) ? ' data-original-url="' + img.replace(/"/g, '&quot;') + '"' : '') + '>';
        });
        imgHtml += '</div>' +
          '<div class="carousel-dots" id="dots-' + p.id + '">';
        p.images.forEach(function(_, i) {
          imgHtml += '<span class="carousel-dot' + (i === 0 ? ' active' : '') + '" onclick="scrollCarouselTo(\'' + p.id + '\',' + i + ')"></span>';
        });
        imgHtml += '</div>';
      } else if (p.images && p.images.length === 1) {
        var img = p.images[0];
        var src = FOROMANE_IMG_MODE.getImgSrc(img);
        imgHtml = '<img src="' + src + '" class="promo-img" alt="' + p.title + '" onerror="this.src=\'assets/media/no_link.png\'" loading="lazy" width="800" height="800"' +
          (FOROMANE_IMG_MODE.needsAsyncResolve(img) ? ' data-original-url="' + img.replace(/"/g, '&quot;') + '"' : '') + '>';
      } else {
        imgHtml = '<div class="promo-img-ph ' + (p.bg || 'img-amber') + '"><span class="promo-img-emoji">' + (p.emoji || '\ud83d\udce6') + '</span></div>';
      }

      const kpi = p.kpi || {};
      const kpiHtml = '<div class="promo-kpi"><span><span class="kpi-icon">\ud83d\udc41</span> ' + (kpi.views||0) + '</span><span><span class="kpi-icon">\u2764\ufe0f</span> ' + (kpi.likes||0) + '</span><span><span class="kpi-icon">\ud83d\udccb</span> ' + (kpi.addedToNotes||0) + '</span></div>';

      promoHtml +=
        '<div class="promo-card" id="bizp-' + p.id + '">' +
          '<div class="promo-img-wrap" onclick="trackPromoView(\'' + p.id + '\'); toggleBizPromo(\'' + p.id + '\')">' +
            imgHtml +
            statusBadge +
          '</div>' +
          '<div class="promo-details" onclick="toggleBizPromo(\'' + p.id + '\')">' +
            '<div class="promo-supplier" onclick="event.stopPropagation();goBack()">' +
              (bizLogo
                ? '<img src="' + bizLogo + '" class="avatar-square" style="object-fit:cover;" alt="" loading="lazy" width="48" height="48">'
                : '<div class="avatar-square" style="background:' + (p.businessColor || '#999') + ';">' + (p.businessInit || '?') + '</div>') +
              '<div>' +
                '<div style="font-size:14px;">' + (p.businessName || businessName) + '</div>' +
                '<div style="font-size:11px;color:var(--grey-dark);font-weight:400;">' + (p.location || (biz ? biz.location : '')) + '</div>' +
              '</div>' +
            '</div>' +
            (isOwner ? '<div style="font-size:10px;color:var(--orange);font-weight:600;margin-bottom:4px;">Your Promo</div>' : '') +
            '<div class="promo-title">' + p.title + '</div>' +
            '<div class="promo-desc">' + (p.desc || '') + '</div>' +
            '<div class="qty-row">' +
              '<div class="qty-price">P <span class="cp">' + ((p.basePrice || p.price || 0) * (p.qty || 1)).toFixed(2) + '</span> <span style="font-size:12px;font-weight:400;color:var(--orange);">' + (p.unit || 'each') + '</span></div>' +
              '<div class="qty-controls">' +
                '<button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + p.id + '\',-1,' + (p.basePrice || p.price || 0) + ',this)">\u2212</button>' +
                '<span class="qv" style="min-width:20px;text-align:center;font-weight:600;">' + (p.qty || 1) + '</span>' +
                '<button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + p.id + '\',1,' + (p.basePrice || p.price || 0) + ',this)">+</button>' +
              '</div>' +
            '</div>' +
            (isOwner ? kpiHtml : '') +
            (isOwner && p.promo ? '<div class="promo-cost-info">Cost: P ' + (p.promo.cost || 0).toFixed(2) + '</div>' : '') +
            '<div class="promo-actions">' +
              '<button class="action-btn" onclick="event.stopPropagation();addToNote(\'' + p.id + '\')"><img src="assets/icons/solid/add-to-note_orange.webp" style="height:16px;vertical-align:middle;object-fit:contain;"></button>' +
              '<button class="action-btn" onclick="event.stopPropagation();sharePromo(\'' + p.id + '\')"><img src="assets/icons/solid/share-nodes_whatsapp_green.webp" style="width:14px;height:14px;vertical-align:middle;"></button>' +
              (isOwner || window.Auth?.isAdmin() ?
              '<button class="action-btn" onclick="event.stopPropagation();openFbPromo(\'' + p.id + '\')"><img src="assets/icons/facebook_icon_f.webp" style="height:14px;vertical-align:middle;object-fit:contain;"></button>' : '') +
              (isOwner ? '' :
              '<button class="action-btn' + (p.liked ? ' liked' : '') + '" id="like-' + p.id + '" onclick="event.stopPropagation();toggleLike(\'' + p.id + '\', this)">' +
                '<img src="assets/icons/heart_' + (p.liked ? 'active' : 'inactive') + '_icon.webp" style="width:16px;height:16px;vertical-align:middle;" loading="lazy">' +
              '</button>') +
            '</div>' +
          '</div>' +
        '</div>';
    });
  }

  view.innerHTML = `
    <div id="biz-promos-content" style="flex:1;overflow-y:auto;padding:12px;">
      ${promoHtml}
    </div>
    <div class="biz-profile-card-nav" onclick="goTo('${targetView}')">
      ${bizThumbHtml}
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${businessName}</div>
        <div style="font-size:12px;color:var(--orange);font-weight:600;">${promos.length} Active Promo${promos.length !== 1 ? 's' : ''}</div>
      </div>
      <span style="font-size:20px;color:rgba(255,255,255,0.3);margin-left:8px;">›</span>
    </div>
  `;

  // Phase 2: async resolve saved-mode images
  setTimeout(function() {
    var imgs = view.querySelectorAll('.promo-img[data-original-url]');
    for (var j = 0; j < imgs.length; j++) {
      (function(img) {
        FOROMANE_IMG_MODE.resolve(img.getAttribute('data-original-url')).then(function(resolved) {
          if (resolved) img.src = resolved;
        });
      })(imgs[j]);
    }
  }, 0);

  goTo('view-business-promos');
}

function openBizCatalogue(bizId, businessName, location, phoneWa, color, init, selectedCat) {
  const view = document.getElementById('view-business-catalogue');
  if (!view) return;

  let biz = window.SAMPLE_BUSINESSES.find(b => b.id === bizId || b.name === businessName);
  if (!biz) biz = (window.ZIMBABWE_BUSINESSES || []).find(b => b.id === bizId || b.name === businessName);
  const pro = !biz ? (window.DEMO_PROFILES || []).find(function(p) { return p.id === bizId || p.name === businessName; }) : null;
  const isOwner = bizId === 'biz_user' || (biz && biz.id === 'biz_user');
  const cataloguePublic = biz && biz.cataloguePublic !== undefined ? biz.cataloguePublic : true;
  const loc = location || (biz ? biz.location : '');

  // Store data for bottom-bar dropdowns
  var catPhoneClean = biz ? biz.phone.replace(/[^0-9+]/g, '') : '+26770000000';
  var catPhoneWaClean = phoneWa || (biz ? biz.phone.replace(/[^0-9]/g, '') : '26770000000');
  _bizDropdownData = { bizId: bizId, name: businessName, phone: catPhoneClean, phoneWa: catPhoneWaClean, location: loc };


  var bizLogo2 = window.getBusinessLogo(bizId);
  var bizThumbHtml2 = bizLogo2
    ? '<img src="' + bizLogo2 + '" class="biz-profile-thumb" style="object-fit:cover;" alt="" loading="lazy" width="48" height="48">'
    : '<div class="biz-profile-thumb" style="background:' + color + ';">' + init + '</div>';

  const targetCatView = pro ? 'view-pro-profile' : 'view-business';
  const navHtml = `
    <div class="biz-profile-card-nav" onclick="goTo('${targetCatView}')">
      ${bizThumbHtml2}
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${businessName}</div>
        <div style="font-size:12px;color:var(--orange);font-weight:600;" id="catalogue-nav-label">Catalogue</div>
      </div>
    </div>
  `;

  if (!cataloguePublic && !isOwner) {
    const nameEsc = (businessName || '').replace(/'/g, "\\'");
    view.innerHTML = `
      <div style="flex:1;overflow-y:auto;padding:16px;">
        <button onclick="goBack()" class="back-btn" style="margin-bottom:16px;"><i class="fas fa-arrow-left"></i> Back</button>
        <div style="text-align:center; padding:32px 16px;">
          <div style="font-size:48px; margin-bottom:16px;">\ud83d\udd12</div>
          <h3 style="font-family:var(--font-head);font-size:20px;font-weight:700;margin-bottom:8px;">Catalogue Private</h3>
          <p style="font-size:14px;color:var(--grey-dark);margin-bottom:20px;">
            This catalogue is currently private.<br>
            WhatsApp the business and ask them to<br>
            publicise their catalogue.
          </p>
          <button class="btn" onclick="requestCatalogueAccess('${nameEsc}','${phoneWa}')">
            <img src="assets/icons/whatsApp_icon_on.webp" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;"> Send WhatsApp Message
          </button>
        </div>
      </div>
      ${navHtml}
    `;
    goTo('view-business-catalogue');
    return;
  }

  var items = [];
  if (isOwner) {
    const userItems = window._userItems || [];
    const realBizId = biz && biz.id;
    const demoItems = (window.DEMO_CATALOGUE_ITEMS || []).filter(function(it) { return it.businessId === realBizId; });
    items = userItems.concat(demoItems);
  } else {
    const promos = window._promos.filter(function(p) { return p.businessId === bizId || p.businessName === businessName; });
    const realBizId = biz && biz.id;
    const demoItems = (window.DEMO_CATALOGUE_ITEMS || []).filter(function(it) { return it.businessId === realBizId || it.businessName === businessName; });
    items = promos.concat(demoItems);
  }

  // Build category map using main categories from FOROMANE_PRODUCT_CATEGORIES
  var catMap = {};
  items.forEach(function(it) {
    var mainCat = _itemToMainCategory(it.category);
    if (!catMap[mainCat]) catMap[mainCat] = [];
    catMap[mainCat].push(it);
  });

  _bizCatalogueState = {
    bizId: bizId, businessName: businessName, location: loc,
    phoneWa: phoneWa, color: color, init: init,
    isOwner: isOwner, items: items, catMap: catMap,
    isPro: !!pro, selectedCat: null
  };

  var existing = window._catalogueItems || [];
  var merged = new Map();
  existing.forEach(function(i) { merged.set(i.id, i); });
  items.forEach(function(i) { merged.set(i.id, i); });
  window._catalogueItems = Array.from(merged.values());

  // Set up the shell with content and bottom nav, then render categories
  view.innerHTML = '<div id="biz-catalogue-content" style="flex:1;overflow-y:auto;padding:12px;"></div>' + navHtml;
  goTo('view-business-catalogue');
  renderCatalogueCategories();
  if (selectedCat && _bizCatalogueState && _bizCatalogueState.catMap[selectedCat]) {
    setTimeout(function() { selectCatalogueCategory(selectedCat); }, 50);
  }
}

/* ─── BRANDS ─── */
var _bizBrandsState = null;

function openBizBrands(bizId, businessName, location, phoneWa, color, init) {
  var view = document.getElementById('view-business-brands');
  if (!view) return;

  let biz = window.SAMPLE_BUSINESSES.find(function(b) { return b.id === bizId || b.name === businessName; });
  if (!biz) biz = (window.ZIMBABWE_BUSINESSES || []).find(function(b) { return b.id === bizId || b.name === businessName; });
  var isOwner = bizId === 'biz_user' || (biz && biz.id === 'biz_user');

  // Gather items
  var items = [];
  if (isOwner) {
    var userItems = window._userItems || [];
    var realBizId = biz && biz.id;
    var demoItems = (window.DEMO_CATALOGUE_ITEMS || []).filter(function(it) { return it.businessId === realBizId; });
    items = userItems.concat(demoItems);
  } else {
    var promos = window._promos.filter(function(p) { return p.businessId === bizId || p.businessName === businessName; });
    var realBizId = biz && biz.id;
    var demoItems = (window.DEMO_CATALOGUE_ITEMS || []).filter(function(it) { return it.businessId === realBizId || it.businessName === businessName; });
    items = promos.concat(demoItems);
  }

  // Gather unique brands
  var brandMap = {};
  items.forEach(function(it) {
    if (it.brand && it.brand.trim()) {
      var key = it.brand.trim().toLowerCase();
      if (!brandMap[key]) brandMap[key] = { name: it.brand.trim(), items: [] };
      brandMap[key].items.push(it);
    }
  });
  var brands = Object.keys(brandMap).sort().map(function(k) { return brandMap[k]; });

  var bizLogo2 = window.getBusinessLogo(bizId);
  var navThumbHtml = bizLogo2
    ? '<img src="' + bizLogo2 + '" class="biz-profile-thumb" style="object-fit:cover;" alt="" loading="lazy" width="48" height="48">'
    : '<div class="biz-profile-thumb" style="background:' + color + ';">' + init + '</div>';
  var bizNameEsc2 = (businessName || '').replace(/'/g, "\\'");

  var navHtml = '<div class="biz-profile-card-nav" onclick="goTo(\'view-business\')">' +
    navThumbHtml +
    '<div style="flex:1;min-width:0;">' +
      '<div style="font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + bizNameEsc2 + '</div>' +
      '<div style="font-size:12px;color:var(--orange);font-weight:600;">Brands</div>' +
    '</div>' +
  '</div>';

  // Build vertical brand list
  var listHtml = brands.map(function(b) {
    var nameEsc = b.name.replace(/'/g, "\\'");
    return '<div class="cat-vert-row" onclick="selectBizBrand(\'' + nameEsc + '\')">' +
      '<span>' + b.name + '</span>' +
      '<span style="color:var(--orange);font-size:14px;font-weight:700;">' + b.items.length + '</span>' +
    '</div>';
  }).join('') || '<div style="text-align:center;padding:32px;color:var(--grey-dark);">No brands found.</div>';

  view.innerHTML =
    '<div style="flex:1;overflow-y:auto;padding:12px;">' +
      '<div class="cat-vert-list">' + listHtml + '</div>' +
    '</div>' +
    navHtml;

  _bizBrandsState = {
    bizId: bizId, businessName: businessName, location: location,
    phoneWa: phoneWa, color: color, init: init,
    isOwner: isOwner, brandMap: brandMap
  };

  goTo('view-business-brands');
}

function selectBizBrand(brandName) {
  if (!_bizBrandsState) return;
  var view = document.getElementById('view-business-brands-listed');
  if (!view) return;

  var brandKey = brandName.toLowerCase().trim();
  var brandData = _bizBrandsState.brandMap[brandKey];
  if (!brandData) { showToast('Brand not found'); return; }

  var items = brandData.items;
  var state = _bizBrandsState;

  var bizLogo2 = window.getBusinessLogo(state.bizId);
  var navThumbHtml = bizLogo2
    ? '<img src="' + bizLogo2 + '" class="biz-profile-thumb" style="object-fit:cover;" alt="" loading="lazy" width="48" height="48">'
    : '<div class="biz-profile-thumb" style="background:' + state.color + ';">' + state.init + '</div>';
  var bizNameEsc2 = (state.businessName || '').replace(/'/g, "\\'");

  var navHtml = '<div class="biz-profile-card-nav" onclick="goTo(\'view-business\')">' +
    navThumbHtml +
    '<div style="flex:1;min-width:0;">' +
      '<div style="font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + bizNameEsc2 + '</div>' +
      '<div style="font-size:12px;color:var(--orange);font-weight:600;">' + brandName + '</div>' +
    '</div>' +
  '</div>';

  var listedHtml = '<div id="biz-listed-items" style="flex:1;overflow-y:auto;padding:12px;">';

  items.forEach(function(it) {
    var price = (it.pricingResult && it.pricingResult.unitPrice) || it.basePrice || it.price || 0;
    var unit = it.unit || 'each';
    var img = it.images && it.images[0] ? it.images[0] : '';
    var isMyItem = state.isOwner && (it.businessId === 'biz_user' || !it.businessId);
    var isStaffRestricted = window.UserState && UserState.businessRole === 'staff' && !it.allowStaffEdits;
    var nameEsc = (it.title || '').replace(/'/g, "\\'");

    var imgHtml;
    if (img) {
      imgHtml = '<img src="' + img + '" class="promo-img" alt="' + nameEsc + '" onerror="this.src=\'assets/media/no_link.png\'" loading="lazy" width="800" height="800">';
    } else {
      imgHtml = '<div class="promo-img-ph ' + (it.bg || 'img-amber') + '"><span class="promo-img-emoji">' + (it.emoji || '\ud83d\udce6') + '</span></div>';
    }

    listedHtml +=
      '<div class="promo-card" id="bizp-' + it.id + '">' +
        '<div class="promo-img-wrap" onclick="trackPromoView(\'' + it.id + '\'); toggleBizPromo(\'' + it.id + '\')">' +
          imgHtml +
        '</div>' +
        '<div class="promo-details" onclick="toggleBizPromo(\'' + it.id + '\')">' +
          '<div class="promo-supplier" onclick="event.stopPropagation();goBack()">' +
            (bizLogo2
              ? '<img src="' + bizLogo2 + '" class="avatar-square" style="object-fit:cover;" alt="" loading="lazy" width="48" height="48">'
              : '<div class="avatar-square" style="background:' + (state.color || '#999') + ';">' + (state.init || '?') + '</div>') +
            '<div>' +
              '<div style="font-size:14px;">' + (state.businessName || '') + '</div>' +
              '<div style="font-size:11px;color:var(--grey-dark);font-weight:400;">' + (state.location || '') + '</div>' +
            '</div>' +
          '</div>' +
          (isMyItem ? '<div style="font-size:10px;color:var(--orange);font-weight:600;margin-bottom:4px;">Your Item</div>' : '') +
          '<div class="promo-title">' + (it.title || '') + '</div>' +
          (it.brand ? '<div class="promo-brand"><i class="fas fa-tag" style="margin-right:4px;font-size:11px;"></i>' + it.brand + '</div>' : '') +
          '<div class="promo-desc">' + (it.desc || '') + '</div>' +
          '<div class="qty-row">' +
            '<div class="qty-price">P <span class="cp">' + (price * (it.qty || 1)).toFixed(2) + '</span> <span style="font-size:12px;font-weight:400;color:var(--orange);">' + unit + '</span></div>' +
            '<div class="qty-controls">' +
              '<button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + it.id + '\',-1,' + price + ',this)">\u2212</button>' +
              '<span class="qv" style="min-width:20px;text-align:center;font-weight:600;">' + (it.qty || 1) + '</span>' +
              '<button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + it.id + '\',1,' + price + ',this)">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="promo-actions">' +
            '<button class="action-btn" onclick="event.stopPropagation();addToNote(\'' + it.id + '\')"><img src="assets/icons/solid/add-to-note_orange.webp" style="height:16px;vertical-align:middle;object-fit:contain;"></button>' +
            '<button class="action-btn" onclick="event.stopPropagation();sharePromo(\'' + it.id + '\')"><img src="assets/icons/solid/share-nodes_whatsapp_green.webp" style="width:14px;height:14px;vertical-align:middle;"></button>' +
            (isMyItem || window.Auth?.isAdmin() ?
            '<button class="action-btn" onclick="event.stopPropagation();openFbPromo(\'' + it.id + '\')"><img src="assets/icons/facebook_icon_f.webp" style="height:14px;vertical-align:middle;object-fit:contain;"></button>' : '') +
            (isMyItem ? '' :
            '<button class="action-btn' + (it.liked ? ' liked' : '') + '" id="like-' + it.id + '" onclick="event.stopPropagation();toggleLike(\'' + it.id + '\', this)">' +
              '<img src="assets/icons/heart_' + (it.liked ? 'active' : 'inactive') + '_icon.webp" style="width:16px;height:16px;vertical-align:middle;" loading="lazy">' +
            '</button>') +
          '</div>' +
          (isMyItem && !isStaffRestricted ?
          '<div style="display:flex;gap:8px;margin-top:8px;">' +
            '<button class="action-btn" style="flex:1;justify-content:center;" onclick="event.stopPropagation();editPromo(\'' + it.id + '\')"><img src="assets/icons/solid/pen_orange.webp" style="height:14px;vertical-align:middle;"> Edit</button>' +
            '<button class="action-btn" style="flex:1;justify-content:center;" onclick="event.stopPropagation();deleteItem(\'' + it.id + '\')"><img src="assets/icons/solid/delete_icon_orange.webp" style="height:14px;vertical-align:middle;"> Delete</button>' +
          '</div>' : '') +
        '</div>' +
      '</div>';
  });

  listedHtml += '</div>';

  view.innerHTML = listedHtml + navHtml;
  goTo('view-business-brands-listed');
}

function requestCatalogueAccess(businessName, phone) {
  const text = 'Hello ' + businessName + ', I found you on Foromane Construction Hub and would like to view your full catalogue. Could you please make your catalogue public so I can see all your products? Thank you.';
  window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(text), '_blank');
}

function toggleFavBiz(bizId) {
  closeBizDropdowns();
  UserState.toggleFavourite(bizId);
  const src = 'assets/icons/' + (UserState.isFavourite(bizId) ? 'heart_active_icon' : 'heart_inactive_icon') + '.webp';
  var icon = document.getElementById('biz-heart-icon');
  if (icon) icon.src = src;
  icon = document.getElementById('pro-heart-icon');
  if (icon) icon.src = src;
  icon = document.getElementById('biz-listed-heart-icon');
  if (icon) icon.src = src;
  // Also update directory list heart icons
  document.querySelectorAll('.dir-card button img').forEach(function(img) {
    var btn = img.closest('button');
    if (btn && btn.getAttribute('onclick') && btn.getAttribute('onclick').includes("'" + bizId + "'")) {
      img.src = src;
    }
  });
}

function callBusiness(phone) {
  if (!phone) { showToast('No phone number available'); return; }
  window.open(`tel:${phone}`);
}

function openWhatsApp(phone, businessName) {
  if (!phone) { showToast('No phone number available'); return; }
  const text = `Hello ${businessName}, I found you on Foromane Construction Hub and would like to inquire about your products.`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
}

function openFacebook(businessName) {
  window.open(`https://www.facebook.com/search/top?q=${encodeURIComponent(businessName)}`, '_blank');
}

function openMaps(name, location) {
  const query = `${name} ${location} Botswana`;
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
}

function shareBusiness(name, location) {
  const text = `Check out ${name} in ${location} on Foromane Construction Hub!`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function toggleFavDir(btn, id) {
  UserState.toggleFavourite(id);
  const img = btn.querySelector('img');
  if (img) {
    img.src = 'assets/icons/' + (UserState.isFavourite(id) ? 'heart_active_icon' : 'heart_inactive_icon') + '.webp';
  }
}

function _buildDirCardDropdownHtml(bizId, name, phone, location, isPro, isUserBiz, isUnclaimed) {
  var nameEsc = (name || '').replace(/'/g, "\\'");
  var locEsc = (location || '').replace(/'/g, "\\'");
  var phoneStr = phone || '';
  var hasPhone = phoneStr.length > 0;
  var hasName = nameEsc.length > 0;
  var hasLocation = locEsc.length > 0;

  var callIcon = hasPhone ? 'Call_on.webp' : 'Call_Off.webp';
  var fbIcon = hasName ? 'facebook_icon_on.webp' : 'facebook_icon_off.webp';
  var gpsIcon = hasLocation ? 'GPS_On.webp' : 'GPS_Off.webp';
  var waIcon = hasPhone ? 'whatsApp_icon_on.webp' : 'whatsApp_icon_off.webp';

  var profileAction;
  if (isPro) {
    profileAction = 'openProProfile(\'' + bizId + '\')';
  } else {
    profileAction = 'openBizProfile(\'' + bizId + '\',\'' + nameEsc + '\',\'\',\'\',\'' + locEsc + '\',\'' + phoneStr + '\',false,\'\',' + (isUserBiz ? 'true' : 'false') + ')';
  }

  return '<div class="dropdown-inner">' +
    '<a class="action-option-btn" onclick="event.stopPropagation();closeDirDropdowns();callBusiness(\'' + phoneStr + '\')"><img src="assets/icons/' + callIcon + '" alt="Call"></a>' +
    '<a class="action-option-btn" onclick="event.stopPropagation();closeDirDropdowns();openFacebook(\'' + nameEsc + '\')"><img src="assets/icons/' + fbIcon + '" alt="Facebook"></a>' +
    '<a class="action-option-btn" onclick="event.stopPropagation();closeDirDropdowns();openMaps(\'' + nameEsc + '\',\'' + locEsc + '\')"><img src="assets/icons/' + gpsIcon + '" alt="GPS"></a>' +
    '<a class="action-option-btn" onclick="event.stopPropagation();closeDirDropdowns();openWhatsApp(\'' + phoneStr + '\',\'' + nameEsc + '\')"><img src="assets/icons/' + waIcon + '" alt="WhatsApp"></a>' +
    '<a class="action-option-btn" onclick="event.stopPropagation();closeDirDropdowns();' + profileAction + '"><img src="assets/icons/solid/briefcase_icon_view_profile.webp" alt="Profile" style="width:20px;height:20px;display:block;"></a>' +
    '</div>';
}

function toggleDirDropdown(id) {
  var el = document.getElementById(id);
  if (!el) return;
  if (el.classList.contains('open')) {
    el.classList.remove('open');
  } else {
    closeDirDropdowns();
    el.classList.add('open');
  }
}

function closeDirDropdowns() {
  document.querySelectorAll('.dropdown-actions-container.open').forEach(function(el) {
    el.classList.remove('open');
  });
}

function toggleBizPromo(id) {
  var current = document.getElementById('bizp-' + id);
  if (!current) return;
  const wasOpen = current.classList.contains('open');
  document.querySelectorAll('#view-business-promos .promo-card.open, #view-biz-catalogue-listed-catalogue .promo-card.open').forEach(c => c.classList.remove('open'));
  if (!wasOpen) current.classList.add('open');
  if (document.querySelector('.promo-card.open')) {
    window.togglePromoShell(true);
  } else {
    window.togglePromoShell(false);
  }
}

/* ─── BOTTOM BAR DROPDOWN HELPERS ─── */
var _bizDropdownData = null;
let _bizCatalogueState = null;
var _bizDropdownActive = null;

function _getBizDropdownItems(type) {
  var d = _bizDropdownData;
  if (!d) return [];
  var contacts = d.contacts;
  var typeKey = type === 'call' ? 'calls' : type;
  var entries = (contacts && contacts[typeKey]) || null;
  if (!entries || entries.length === 0) {
    // Fallback: single entry from basic phone if available
    if (type === 'call' && d.phone) return [{ label: 'Call', action: 'call', phone: d.phone }];
    if (type === 'whatsapp' && d.phoneWa) return [{ label: 'WhatsApp', action: 'whatsapp', phone: d.phoneWa, name: d.name }];
    if (type === 'facebook' && d.name) return [{ label: 'Search Facebook', action: 'facebook', query: d.name }];
    if (type === 'gps' && d.location) return [{ label: 'View Location', action: 'maps', name: d.name, location: d.location }];
    return [{ label: 'No ' + type + ' entries', action: '', phone: '' }];
  }
  var actionMap = { call: 'call', facebook: 'facebook', gps: 'maps', whatsapp: 'whatsapp' };
  return entries.map(function(e) {
    var action = actionMap[type] || '';
    var item = { label: e.title || type.charAt(0).toUpperCase() + type.slice(1), action: action };
    if (type === 'call' || type === 'whatsapp') { item.phone = e.value || ''; item.name = d.name; }
    if (type === 'facebook') { item.query = e.value || d.name; }
    if (type === 'gps') { item.location = e.value || d.location; item.name = d.name; }
    return item;
  });
}

function _renderDropdownContainers() {
  return '<div id="dd-call" class="biz-dropdown-container"><div class="biz-dropdown-inner"></div></div>' +
    '<div id="dd-facebook" class="biz-dropdown-container biz-dd-facebook"><div class="biz-dropdown-inner"></div></div>' +
    '<div id="dd-gps" class="biz-dropdown-container"><div class="biz-dropdown-inner"></div></div>' +
    '<div id="dd-whatsapp" class="biz-dropdown-container biz-dd-whatsapp"><div class="biz-dropdown-inner"></div></div>';
}

function toggleBizDropdown(type) {
  var container = document.getElementById('dd-' + type);
  if (!container) return;

  // If tapping same icon, close it
  if (_bizDropdownActive === type) {
    container.classList.remove('active');
    _bizDropdownActive = null;
    return;
  }

  // Close all dropdowns
  document.querySelectorAll('.biz-dropdown-container').forEach(function(el) {
    el.classList.remove('active');
  });

  // Populate items if empty
  var inner = container.querySelector('.biz-dropdown-inner');
  if (inner && !inner.hasChildNodes()) {
    var items = _getBizDropdownItems(type);
    inner.innerHTML = items.map(function(i) {
      var p1 = (i.phone || i.query || '').replace(/'/g, "\\'");
      var p2 = (i.name || '').replace(/'/g, "\\'");
      var p3 = (i.location || '').replace(/'/g, "\\'");
      var label = i.label.replace(/'/g, "\\'");
      var iconName = i.action === 'call' ? 'phone-alt' : i.action === 'facebook' ? 'facebook-f' : i.action === 'maps' ? 'map-marker-alt' : i.action === 'whatsapp' ? 'whatsapp' : 'store';
      var sub = '';
      if (i.action === 'call' && i.phone) sub = 'Call for inquiries';
      else if (i.action === 'whatsapp' && i.phone) sub = 'Message for inquiries';
      else if (i.action === 'maps' && i.location) sub = i.location;
      return '<div class="biz-dd-row" onclick="closeBizDropdowns();doBizDropdownAction(\'' + i.action + '\',\'' + p1 + '\',\'' + p2 + '\',\'' + p3 + '\')">' +
        '<div class="biz-dd-icon">' + (i.action === 'facebook' ? '<img src="assets/icons/facebook_icon_f.webp" style="width:20px;height:20px;object-fit:contain;">' : i.action === 'whatsapp' ? '<img src="assets/icons/whatsapp_icon_1.webp" style="width:20px;height:20px;object-fit:contain;">' : '<i class="fas fa-' + iconName + '"></i>') + '</div>' +
        '<div class="biz-dd-text"><h4>' + label + '</h4>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
      '</div>';
    }).join('');
  }

  container.classList.add('active');
  _bizDropdownActive = type;
}

function closeBizDropdowns() {
  document.querySelectorAll('.biz-dropdown-container').forEach(function(el) {
    el.classList.remove('active');
  });
  _bizDropdownActive = null;
}

function doBizDropdownAction(action, p1, p2, p3) {
  closeBizDropdowns();
  if (action === 'call')        callBusiness(p1);
  else if (action === 'facebook') openFacebook(p1);
  else if (action === 'maps')    openMaps(p2, p3);
  else if (action === 'whatsapp') openWhatsApp(p1, p2);
  else if (action === 'bizpage') {
    var d = _bizDropdownData;
    if (d) openBizProfile(d.bizId, d.name, '', '', d.location, d.phone, false, '', false);
  }
}

/* ─── CATALOGUE CATEGORY DRILL-DOWN ─── */
function _itemToMainCategory(itemCategory) {
  if (!itemCategory || !window.FOROMANE_PRODUCT_CATEGORIES) return 'Other';
  var cats = window.FOROMANE_PRODUCT_CATEGORIES.categories;
  for (var mi = 0; mi < cats.length; mi++) {
    if (cats[mi].name === itemCategory) return cats[mi].name;
    var subs = cats[mi].children || [];
    for (var si = 0; si < subs.length; si++) {
      if (subs[si].name === itemCategory) return cats[mi].name;
      var leaves = subs[si].children || [];
      for (var li = 0; li < leaves.length; li++) {
        if (leaves[li].name === itemCategory) return cats[mi].name;
      }
    }
  }
  return 'Other';
}

function renderCatalogueCategories() {
  var state = _bizCatalogueState;
  if (!state) return;
  var content = document.getElementById('biz-catalogue-content');
  if (!content) return;

  var label = document.getElementById('catalogue-nav-label');
  if (label) label.textContent = 'Catalogue';

  var catKeys = Object.keys(state.catMap);
  if (catKeys.length === 0) {
    var emptyMsg = state.isOwner
      ? '<div style="text-align:center;padding:40px 16px;color:var(--grey-dark);"><div style="font-size:40px;margin-bottom:12px;">📦</div><p style="font-size:14px;font-weight:600;">Your catalogue is empty</p><p style="font-size:12px;margin-top:4px;">Add items to showcase your products.</p></div>'
      : '<div style="text-align:center;padding:40px 16px;color:var(--grey-dark);"><div style="font-size:40px;margin-bottom:12px;">📦</div><p style="font-size:14px;font-weight:600;">No catalogue items yet</p><p style="font-size:12px;margin-top:4px;">Check back later or contact the business.</p></div>';
    content.innerHTML = emptyMsg + (state.isOwner ? '<button class="btn" style="width:100%;" onclick="openItemModal()">+ Add to Catalogue</button>' : '');
    return;
  }

  catKeys.sort();
  var html = '<div style="margin-bottom:12px;font-size:14px;font-weight:600;color:var(--grey-dark);">' + catKeys.length + ' categor' + (catKeys.length === 1 ? 'y' : 'ies') + '</div>';
  html += '<div class="cat-vert-list">';
  catKeys.forEach(function(cat) {
    var count = state.catMap[cat].length;
    html += '<div class="cat-vert-row" onclick="selectCatalogueCategory(\'' + cat.replace(/'/g, "\\'") + '\')">' +
      '<div class="cat-vert-name">' + cat + '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<div class="cat-vert-count">' + count + '</div>' +
        '<span class="cat-vert-arrow">\u203A</span>' +
      '</div>' +
      '</div>';
  });
  html += '</div>';

  if (state.isOwner) {
    html += '<button class="btn" style="width:100%;margin-top:16px;" onclick="openItemModal()">+ Add to Catalogue</button>';
  }
  content.innerHTML = html;
}

function renderCatalogueListedItems(selectedCat) {
  var state = _bizCatalogueState;
  if (!state) return;
  var view = document.getElementById('view-biz-catalogue-listed-catalogue');
  if (!view) return;

  var catItems = state.catMap[selectedCat] || [];

  var listedHtml = '';

  // Items list
  listedHtml += '<div id="biz-listed-items" style="flex:1;overflow-y:auto;padding:12px;">';

  if (catItems.length === 0) {
    listedHtml += '<div style="text-align:center;padding:32px 16px;color:var(--grey-dark);"><p>No items in this category.</p></div>';
  } else {
    var bizLogo = window.getBusinessLogo(state.bizId);
    catItems.forEach(function(it) {
      var price = (it.pricingResult && it.pricingResult.unitPrice) || it.basePrice || it.price || 0;
      var unit = it.unit || 'each';
      var img = it.images && it.images[0] ? it.images[0] : '';
      var isMyItem = state.isOwner && (it.businessId === 'biz_user' || !it.businessId);
      var isStaffRestricted = UserState.businessRole === 'staff' && !it.allowStaffEdits;
      var nameEsc = (it.title || '').replace(/'/g, "\\'");

      var imgHtml;
      if (img) {
        imgHtml = '<img src="' + img + '" class="promo-img" alt="' + nameEsc + '" onerror="this.src=\'assets/media/no_link.png\'" loading="lazy" width="800" height="800">';
      } else {
        imgHtml = '<div class="promo-img-ph ' + (it.bg || 'img-amber') + '"><span class="promo-img-emoji">' + (it.emoji || '\ud83d\udce6') + '</span></div>';
      }

      listedHtml +=
        '<div class="promo-card" id="bizp-' + it.id + '">' +
          '<div class="promo-img-wrap" onclick="trackPromoView(\'' + it.id + '\'); toggleBizPromo(\'' + it.id + '\')">' +
            imgHtml +
          '</div>' +
          '<div class="promo-details" onclick="toggleBizPromo(\'' + it.id + '\')">' +
            '<div class="promo-supplier" onclick="event.stopPropagation();goBack()">' +
              (bizLogo
                ? '<img src="' + bizLogo + '" class="avatar-square" style="object-fit:cover;" alt="" loading="lazy" width="48" height="48">'
                : '<div class="avatar-square" style="background:' + (state.color || '#999') + ';">' + (state.init || '?') + '</div>') +
              '<div>' +
                '<div style="font-size:14px;">' + (state.businessName || '') + '</div>' +
                '<div style="font-size:11px;color:var(--grey-dark);font-weight:400;">' + (state.location || '') + '</div>' +
              '</div>' +
            '</div>' +
            (isMyItem ? '<div style="font-size:10px;color:var(--orange);font-weight:600;margin-bottom:4px;">Your Item</div>' : '') +
            '<div class="promo-title">' + (it.title || '') + '</div>' +
            (it.brand ? '<div class="promo-brand"><i class="fas fa-tag" style="margin-right:4px;font-size:11px;"></i>' + it.brand + '</div>' : '') +
            '<div class="promo-desc">' + (it.desc || '') + '</div>' +
            '<div class="qty-row">' +
              '<div class="qty-price">P <span class="cp">' + (price * (it.qty || 1)).toFixed(2) + '</span> <span style="font-size:12px;font-weight:400;color:var(--orange);">' + unit + '</span></div>' +
              '<div class="qty-controls">' +
                '<button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + it.id + '\',-1,' + price + ',this)">\u2212</button>' +
                '<span class="qv" style="min-width:20px;text-align:center;font-weight:600;">' + (it.qty || 1) + '</span>' +
                '<button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + it.id + '\',1,' + price + ',this)">+</button>' +
              '</div>' +
            '</div>' +
            '<div class="promo-actions">' +
              '<button class="action-btn" onclick="event.stopPropagation();addToNote(\'' + it.id + '\')"><img src="assets/icons/solid/add-to-note_orange.webp" style="height:16px;vertical-align:middle;object-fit:contain;"></button>' +
              '<button class="action-btn" onclick="event.stopPropagation();sharePromo(\'' + it.id + '\')"><img src="assets/icons/solid/share-nodes_whatsapp_green.webp" style="width:14px;height:14px;vertical-align:middle;"></button>' +
              (isMyItem || window.Auth?.isAdmin() ?
              '<button class="action-btn" onclick="event.stopPropagation();openFbPromo(\'' + it.id + '\')"><img src="assets/icons/facebook_icon_f.webp" style="height:14px;vertical-align:middle;object-fit:contain;"></button>' : '') +
              (isMyItem ? '' :
              '<button class="action-btn' + (it.liked ? ' liked' : '') + '" id="like-' + it.id + '" onclick="event.stopPropagation();toggleLike(\'' + it.id + '\', this)">' +
                '<img src="assets/icons/heart_' + (it.liked ? 'active' : 'inactive') + '_icon.webp" style="width:16px;height:16px;vertical-align:middle;" loading="lazy">' +
              '</button>') +
            '</div>' +
            (isMyItem && !isStaffRestricted ?
            '<div style="display:flex;gap:8px;margin-top:8px;">' +
              '<button class="action-btn" style="flex:1;justify-content:center;" onclick="event.stopPropagation();editPromo(\'' + it.id + '\')"><img src="assets/icons/solid/pen_orange.webp" style="height:14px;vertical-align:middle;"> Edit</button>' +
              '<button class="action-btn" style="flex:1;justify-content:center;" onclick="event.stopPropagation();deleteItem(\'' + it.id + '\')"><img src="assets/icons/solid/delete_icon_orange.webp" style="height:14px;vertical-align:middle;"> Delete</button>' +
            '</div>' : '') +
          '</div>' +
        '</div>';
    });
  }

  listedHtml += '</div>';

  // Bottom business nav bar (navigates back to view-business)
  var stateData = _bizCatalogueState;
  if (stateData) {
    var bizLogo2 = window.getBusinessLogo(stateData.bizId);
    var navThumbHtml = bizLogo2
      ? '<img src="' + bizLogo2 + '" class="biz-profile-thumb" style="object-fit:cover;" alt="" loading="lazy" width="48" height="48">'
      : '<div class="biz-profile-thumb" style="background:' + stateData.color + ';">' + stateData.init + '</div>';
    var bizNameEsc2 = (stateData.businessName || '').replace(/'/g, "\\'");
    var navTargetView2 = stateData.isPro ? 'view-pro-profile' : 'view-business';
    listedHtml += '<div class="biz-profile-card-nav" onclick="goTo(\'' + navTargetView2 + '\')">' +
      navThumbHtml +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + bizNameEsc2 + '</div>' +
        '<div style="font-size:12px;color:var(--orange);font-weight:600;" id="catalogue-nav-label">Catalogue</div>' +
      '</div>' +
    '</div>';
  }

  view.innerHTML = listedHtml;
}

function selectCatalogueCategory(mainCat) {
  if (!_bizCatalogueState) return;
  _bizCatalogueState.selectedCat = mainCat;
  goTo('view-biz-catalogue-listed-catalogue');
  renderCatalogueListedItems(mainCat);
}

function backToCatalogueCategories() {
  if (!_bizCatalogueState) return;
  _bizCatalogueState.selectedCat = null;
  goTo('view-business-catalogue');
  renderCatalogueCategories();
}

/* ─── REQUEST QUOTE & INQUIRY INBOX ─── */
function getInquiries() {
  try { return JSON.parse(localStorage.getItem('foromane_inquiries')) || []; }
  catch { return []; }
}

function saveInquiries(inquiries) {
  localStorage.setItem('foromane_inquiries', JSON.stringify(inquiries));
}

function requestQuote(businessName, phone, itemTitle, businessId, userId) {
  if (!phone) { showToast('Contact info not available'); return; }
  var userName = (window.UserState && UserState.name) || 'A Foromane user';
  var text = 'Hello ' + businessName + ', I found you on Foromane Construction Hub and would like to request a quote' +
    (itemTitle ? ' for ' + itemTitle : '') +
    '. Please let me know your pricing and availability. Thank you!';
  window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(text), '_blank');

  // Record the inquiry
  var inquiries = getInquiries();
  inquiries.push({
    id: 'inq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    businessId: businessId || '',
    businessName: businessName,
    itemTitle: itemTitle || '',
    userId: (window.UserState && UserState.id) || 'guest',
    userName: userName,
    phone: phone,
    createdAt: Date.now(),
    status: 'sent'
  });
  saveInquiries(inquiries);
  showToast('Quote request sent via WhatsApp');
}

function renderAlphaNav(el, useHash) {
  if (!el) return;
  var letters = ['#'];
  for (var i = 65; i <= 90; i++) letters.push(String.fromCharCode(i));
  var html = '<div class="alpha-nav" style="display:flex;flex-wrap:wrap;gap:4px;padding:8px 12px;position:sticky;top:0;z-index:3;background:var(--bg);border-bottom:1px solid rgba(0,0,0,0.2);">';
  html += letters.map(function(l) {
    return '<button class="alpha-btn" style="flex:0 0 auto;width:32px;height:32px;border:1px solid #ddd;border-radius:50%;background:#fff;color:var(--grey-dark);font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;" onclick="scrollToAlpha(\'' + l + '\')" title="Jump to ' + l + '">' + l + '</button>';
  }).join('');
  html += '</div>';
  el.insertAdjacentHTML('afterbegin', html);
}

window.requestQuote = requestQuote;
window.getInquiries = getInquiries;
window.renderAlphaNav = renderAlphaNav;
window.renderDirectory = renderDirectory;
window.openBizProfile = openBizProfile;
window.openBizPromos = openBizPromos;
window.openBizCatalogue = openBizCatalogue;
window.requestCatalogueAccess = requestCatalogueAccess;
window.scrollToAlpha = scrollToAlpha;
window.callBusiness = callBusiness;
window.openWhatsApp = openWhatsApp;
window.openFacebook = openFacebook;
window.openMaps = openMaps;
window.shareBusiness = shareBusiness;
window.toggleFavDir = toggleFavDir;
window.toggleFavBiz = toggleFavBiz;
window.openDirTypeModal = openDirTypeModal;
window.selectDirType = selectDirType;
window.toggleBizPromo = toggleBizPromo;
// openProProfile preserved from pro.js (enhanced version with skills, rates, etc.)
window.toggleBizDropdown = toggleBizDropdown;
window.closeBizDropdowns = closeBizDropdowns;
window.selectCatalogueCategory = selectCatalogueCategory;
window.renderCatalogueListedItems = renderCatalogueListedItems;
window.backToCatalogueCategories = backToCatalogueCategories;
function catItemQty(id, delta, basePrice, btn) { changeQty(id, delta, basePrice, btn); }
window.catItemQty = catItemQty;
window.toggleBizPromo = toggleBizPromo;
window.isBusinessClaimed = isBusinessClaimed;
window.claimBusiness = claimBusiness;

/* ─── RETAIL HOURS DISPLAY ─── */
function formatTime24(val) {
  if (!val) return '';
  var parts = val.split(':');
  if (parts.length < 2) return val;
  var h = parseInt(parts[0], 10);
  var m = parts[1];
  var ampm = h >= 12 ? 'p.m.' : 'a.m.';
  var h12 = h % 12 || 12;
  return h12 + ':' + m + ' ' + ampm;
}

function hoursRangeStr(h) {
  if (h.closed) return 'Closed';
  var parts = [];
  if (h.open && h.close) {
    var t = formatTime24(h.open) + ' \u2013 ' + formatTime24(h.close);
    if (h.breakStart && h.breakEnd) {
      t += ' <span class="break-sep">\u00B7</span> break ' + formatTime24(h.breakStart) + ' \u2013 ' + formatTime24(h.breakEnd);
    }
    parts.push(t);
  } else if (h.open && !h.close) {
    parts.push('From ' + formatTime24(h.open));
  } else if (!h.open && h.close) {
    parts.push('Until ' + formatTime24(h.close));
  }
  return parts.join(', ') || 'Closed';
}

function buildCondensedHoursHtml(biz) {
  if (!biz || !biz.retailHours) return '';
  var rh = biz.retailHours;
  if (!rh.branches || rh.branches.length === 0) return '';
  var allDayNames = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  var dayLabel = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday', sunday:'Sunday' };
  var branchSelectHtml = '';
  var hasMultiple = rh.branches.length > 1;
  if (hasMultiple) {
    branchSelectHtml += '<select class="retail-hours-branch-selector" onchange="switchRetailHoursBranch(this.value)">';
    rh.branches.forEach(function(b, i) {
      branchSelectHtml += '<option value="' + i + '">' + (b.name || 'Branch ' + (i + 1)) + '</option>';
    });
    branchSelectHtml += '</select>';
  }
  var listHtml = '';
  rh.branches.forEach(function(b, bi) {
    var style = bi > 0 ? ' style="display:none;"' : '';
    listHtml += '<div class="retail-hours-branch-data" data-branch-idx="' + bi + '"' + style + '>';
    listHtml += '<div class="retail-hours-list">';
    var ranges = [];
    var currentRange = null;
    allDayNames.forEach(function(d, idx) {
      var h = null;
      b.hours.forEach(function(entry) { if (entry.day === d) h = entry; });
      if (!h) h = { day: d, open: null, breakStart: null, breakEnd: null, close: null, closed: true };
      var key = hoursRangeStr(h);
      if (currentRange && currentRange.key === key) {
        currentRange.endIdx = idx;
      } else {
        if (currentRange) ranges.push(currentRange);
        currentRange = { key: key, startIdx: idx, endIdx: idx, hours: h };
      }
    });
    if (currentRange) ranges.push(currentRange);
    ranges.forEach(function(r) {
      var dayStr = dayLabel[allDayNames[r.startIdx]];
      if (r.endIdx > r.startIdx) {
        dayStr = dayLabel[allDayNames[r.startIdx]] + ' \u2013 ' + dayLabel[allDayNames[r.endIdx]];
      }
      var cls = r.hours.closed ? ' closed' : '';
      listHtml += '<div class="retail-hours-row' + cls + '"><span class="retail-hours-days">' + dayStr + '</span><span class="retail-hours-times">' + r.key + '</span></div>';
    });
    listHtml += '</div>';
    if (b.exceptions && b.exceptions.length > 0) {
      listHtml += '<div class="retail-hours-exceptions">';
      listHtml += '<div class="retail-hours-exception-title">\u26A0\uFE0F Exception Hours</div>';
      b.exceptions.forEach(function(ex) {
        var exDate = ex.date;
        try {
          var d = new Date(ex.date + 'T00:00:00');
          var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          exDate = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
        } catch(e) {}
        var exCls = ex.closed ? ' closed' : '';
        var exTimes = ex.closed ? 'Closed' : (ex.open && ex.close ? formatTime24(ex.open) + ' \u2013 ' + formatTime24(ex.close) : '');
        listHtml += '<div class="retail-hours-row exception' + exCls + '"><span class="retail-hours-days">' + exDate + '</span><span class="retail-hours-times">' + exTimes + ' <span class="exception-label">' + (ex.label || '') + '</span></span></div>';
      });
      listHtml += '</div>';
    }
    listHtml += '</div>';
  });
  return '<div class="accordion">' +
    '<div class="accordion-header" onclick="toggleAcc(this)">' +
      '<span><i class="fas fa-clock" style="color:var(--orange);margin-right:8px;"></i> Retail Hours</span>' +
      '<span class="chevron">\u203A</span>' +
    '</div>' +
    '<div class="accordion-body retail-hours-body">' +
      branchSelectHtml +
      listHtml +
    '</div>' +
  '</div>';
}

function switchRetailHoursBranch(val) {
  var idx = parseInt(val, 10);
  var all = document.querySelectorAll('.retail-hours-branch-data');
  all.forEach(function(el) { el.style.display = 'none'; });
  var target = document.querySelector('.retail-hours-branch-data[data-branch-idx="' + idx + '"]');
  if (target) target.style.display = 'block';
}
window.switchRetailHoursBranch = switchRetailHoursBranch;
