// account-views.js — add-item modal, artwork submission, area/category pills, promo requests UI
(function(){
  let _selectedCategories = [];
  let _gpsLat = null;
  let _gpsLng = null;

  function getAllCategories() {
    return (window.FOROMANE_PRODUCT_CATEGORIES && window.FOROMANE_PRODUCT_CATEGORIES.categories) || [];
  }

  function getAllTowns() {
    const loc = window.LOCATIONS;
    if (!loc || !loc.districts) return [];
    const towns = [];
    loc.districts.forEach(d => (d.towns || []).forEach(t => towns.push(t.name)));
    return towns;
  }

  function getAreasForTown(townName) {
    const loc = window.LOCATIONS;
    if (!loc || !loc.districts) return [];
    const areas = [];
    loc.districts.forEach(d => (d.towns || []).forEach(t => {
      if (t.name === townName && t.areas) areas.push(...t.areas);
    }));
    return areas;
  }

  function getCurrentUser() {
    const u = (window.User && window.User.current) || null;
    return u || { name: 'You', id: localStorage.getItem('foromane_userId') || 'guest' };
  }

  function syncBoostCounter() {
    const key = 'foromane_boosts_remaining';
    let b = parseInt(localStorage.getItem(key) || '12', 10);
    b = Math.max(0, b);
    ['boost-counter', 'boost-counter-modal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(b);
    });
    return b;
  }

  function getBusinessCategories() {
    const biz = getCurrentUser().business;
    if (biz && biz.category) return [biz.category];
    return [];
  }

  /* ─── CATEGORY PILLS ─── */
  function renderItemCategoryPills() {
    const container = document.getElementById('item-category-pills');
    if (!container) return;
    container.innerHTML = '';
    _selectedCategories = [];
    const cats = getAllCategories();
    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'pill';
      btn.textContent = cat.name;
      btn.dataset.id = cat.id;
      btn.onclick = () => toggleItemCategoryPill(btn);
      container.appendChild(btn);
    });
    updateCategoryDisplay();
  }

  function toggleItemCategoryPill(btn) {
    btn.classList.toggle('pill-selected');
    const id = btn.dataset.id;
    const name = btn.textContent;
    if (btn.classList.contains('pill-selected')) {
      if (!_selectedCategories.find(c => c.id === id)) _selectedCategories.push({ id, name });
    } else {
      _selectedCategories = _selectedCategories.filter(c => c.id !== id);
    }
    updateCategoryDisplay();
    updatePromoCostEstimate();
  }

  function updateCategoryDisplay() {
    const el = document.getElementById('item-cat-display');
    if (!el) return;
    const count = _selectedCategories.length;
    el.textContent = count === 0 ? '' : count + ' categor' + (count === 1 ? 'y selected' : 'ies selected');
  }

  /* ─── AREA PILLS ─── */
  let _selectedAreas = [];

  window.openItemAreaSelector = function() {
    const town = document.getElementById('item-town') ? document.getElementById('item-town').value : 'Gaborone';
    const areas = getAreasForTown(town);
    const existing = document.getElementById('area-selector-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'area-selector-overlay';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'block';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-header">
          <span class="modal-title">Select Areas in ${town}</span>
          <button class="modal-close" onclick="closeModal('area-selector-overlay')"><img src="assets/icons/solid/xmark_orange.webp" style="width:18px;height:18px;"></button>
        </div>
        <div class="modal-body">
          <div id="area-pills-container" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;"></div>
          <button class="btn" onclick="applyAreaSelection()">Apply (${_selectedAreas.length} selected)</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const container = document.getElementById('area-pills-container');
    areas.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'pill' + (_selectedAreas.includes(a) ? ' pill-selected' : '');
      btn.textContent = a;
      btn.onclick = () => {
        btn.classList.toggle('pill-selected');
        const name = btn.textContent;
        if (btn.classList.contains('pill-selected')) {
          if (!_selectedAreas.includes(name)) _selectedAreas.push(name);
        } else {
          _selectedAreas = _selectedAreas.filter(x => x !== name);
        }
        const apply = overlay.querySelector('.btn');
        if (apply) apply.textContent = 'Apply (' + _selectedAreas.length + ' selected)';
      };
      container.appendChild(btn);
    });
  };

  window.applyAreaSelection = function() {
    closeModal('area-selector-overlay');
    const display = document.getElementById('item-area-display');
    if (display) display.textContent = _selectedAreas.length ? _selectedAreas.join(', ') : '';
    const btn = document.getElementById('item-area-btn');
    if (btn) btn.textContent = _selectedAreas.length ? 'Areas (' + _selectedAreas.length + ')' : 'Select areas';
  };

  /* ─── GPS PIN ─── */
  window.pinItemLocation = function() {
    if (!navigator.geolocation) { showToast('Geolocation not supported'); return; }
    showToast('Getting location...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        _gpsLat = pos.coords.latitude;
        _gpsLng = pos.coords.longitude;
        const display = document.getElementById('item-gps-display');
        if (display) {
          display.textContent = '\uD83D\uDCCD ' + _gpsLat.toFixed(4) + ', ' + _gpsLng.toFixed(4) + ' · Radius: ' + (document.getElementById('item-gps-radius') ? document.getElementById('item-gps-radius').value || '2' : '2') + ' km';
          display.style.display = 'block';
        }
        showToast('Location pinned');
      },
      err => { showToast('Could not get location: ' + err.message); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  window.clearItemLocation = function() {
    _gpsLat = null;
    _gpsLng = null;
    const display = document.getElementById('item-gps-display');
    if (display) { display.textContent = ''; display.style.display = 'none'; }
    const radius = document.getElementById('item-gps-radius');
    if (radius) radius.value = '';
  };

  /* ─── OPEN ADD ITEM MODAL ─── */
  window.openAddItemModal = function(categoryName){
    const user = getCurrentUser();
    const sheet = document.getElementById('add-item-modal');
    if (!sheet) return;
    sheet.style.display = 'block';

  const creator = document.getElementById('add-item-creator');
  if (creator) creator.textContent = 'Creator: ' + user.name;

  // Show "Allow staff edits" checkbox only for owners, hide for staff
  var staffCheckRow = document.getElementById('item-allow-staff-edits');
  if (staffCheckRow) {
    staffCheckRow.closest('label').style.display = UserState.businessRole === 'staff' ? 'none' : '';
  }

    renderItemCategoryPills();
    /* pre-select category if provided */
    if (categoryName) {
      const pills = document.querySelectorAll('#item-category-pills .pill');
      pills.forEach(p => {
        if (p.textContent.trim() === categoryName) {
          toggleItemCategoryPill(p);
        }
      });
    }
    populateTownSelects();

    _selectedAreas = [];
    const areaBtn = document.getElementById('item-area-btn');
    if (areaBtn) areaBtn.textContent = 'Select areas';
    const areaDisp = document.getElementById('item-area-display');
    if (areaDisp) areaDisp.textContent = '';

    clearItemLocation();

    document.getElementById('add-item-promo-unlocked').style.display = 'none';
    document.getElementById('add-item-promo-locked').style.display = 'block';

    document.getElementById('item-title').focus();
  };

  /* ─── SAVE ADD ITEM ─── */
  window.saveAddItem = function(){
    const title = document.getElementById('item-title') ? document.getElementById('item-title').value.trim() : '';
    if (!title) { showToast('Please enter an item title'); return; }

    const user = getCurrentUser();
    const brand = document.getElementById('item-brand-input') ? document.getElementById('item-brand-input').value.trim() : '';
    const item = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: title,
      brand: brand,
      desc: document.getElementById('item-desc') ? document.getElementById('item-desc').value : '',
      creatorId: user.id,
      creatorName: user.name,
      allowStaffEdits: document.getElementById('item-allow-staff-edits') ? document.getElementById('item-allow-staff-edits').checked : false,
      categories: _selectedCategories.map(c => c.name),
      town: document.getElementById('item-town') ? document.getElementById('item-town').value : 'Gaborone',
      areas: _selectedAreas,
      gpsLat: _gpsLat,
      gpsLng: _gpsLng,
      gpsRadius: parseFloat(document.getElementById('item-gps-radius') ? document.getElementById('item-gps-radius').value : 0) || 0,
      tags: Array.from(document.querySelectorAll('#item-tag-container .tag')).map(t => t.textContent.trim()).filter(Boolean),
      price: parseFloat(document.getElementById('item-price') ? document.getElementById('item-price').value : 0) || 0,
      unit: document.getElementById('item-unit') ? document.getElementById('item-unit').value : 'each',
      variables: getVariables(),
      tierType: document.getElementById('item-tier-type') ? document.getElementById('item-tier-type').value : 'none',
      discountType: document.getElementById('item-discount-type') ? document.getElementById('item-discount-type').value : 'none',
      discountValue: parseFloat(document.getElementById('item-discount-value') ? document.getElementById('item-discount-value').value : 0) || 0,
      region: document.getElementById('item-region') ? document.getElementById('item-region').value : 'local',
      startDate: document.getElementById('item-start-date') ? document.getElementById('item-start-date').value : '',
      endDate: document.getElementById('item-end-date') ? document.getElementById('item-end-date').value : '',
      inCatalogue: true,
      createdAt: Date.now()
    };

    const items = JSON.parse(localStorage.getItem('foromane_items') || '[]');
    items.push(item);
    localStorage.setItem('foromane_items', JSON.stringify(items));

    if (brand && !isBrandPredefined(brand)) {
      upsertPendingBrand(brand, _selectedCategories.map(function(c) { return c.name; }), user.id);
    }

    showToast('Item saved to catalogue');
    updateMyCatalogueList();

    document.getElementById('add-item-promo-locked').style.display = 'none';
    document.getElementById('add-item-promo-unlocked').style.display = 'block';
  };

  function getVariables() {
    const rows = document.querySelectorAll('#item-variables-container .variable-row');
    const vars = [];
    rows.forEach(r => {
      const nameInput = r.querySelector('.var-name');
      const priceInput = r.querySelector('.var-price');
      if (nameInput && priceInput) vars.push({ name: nameInput.value, price: parseFloat(priceInput.value) || 0 });
    });
    return vars;
  }

  function updateMyCatalogueList() {
    const container = document.getElementById('my-catalogue-list');
    if (!container) return;
    const items = JSON.parse(localStorage.getItem('foromane_items') || '[]');
    if (items.length === 0) {
      container.innerHTML = '<p style="font-size:13px;color:var(--grey-dark);padding-top:8px;margin-bottom:12px;">No items in catalogue yet.</p>';
      return;
    }
    container.innerHTML = items.map((item, i) =>
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--grey-light);font-size:13px;">' +
      '<span>' + item.title + '</span>' +
      '<span style="color:var(--grey-dark);font-size:12px;">P' + item.price.toFixed(2) + '</span>' +
      '</div>'
    ).join('');
  }

  /* ─── DELETE ADD ITEM ─── */
  window.deleteAddItem = function(){
    const items = JSON.parse(localStorage.getItem('foromane_items') || '[]');
    if (items.length === 0) {
      document.getElementById('item-title').value = '';
      document.getElementById('item-desc').value = '';
      document.getElementById('item-price').value = '';
      document.getElementById('item-tag-container').innerHTML = '';
      showToast('Form cleared');
      return;
    }
    items.pop();
    localStorage.setItem('foromane_items', JSON.stringify(items));
    showToast('Last item removed');
    updateMyCatalogueList();
    document.getElementById('add-item-promo-unlocked').style.display = 'none';
    document.getElementById('add-item-promo-locked').style.display = 'block';
  };

  /* ─── CATALOGUE ACTIONS SHEET ─── */
  window.openCatalogueActions = function(){
    const user = getCurrentUser();
    const biz = user.business;
    if (!biz) { showToast('Register a business first'); return; }

    const existing = document.getElementById('catalogue-actions-overlay');
    if (existing) existing.remove();

    const init = biz.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const col = window.APP_COLORS[init.charCodeAt(0) % window.APP_COLORS.length];
    const nameEsc = biz.name.replace(/'/g, "\\'");

    const overlay = document.createElement('div');
    overlay.id = 'catalogue-actions-overlay';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.5);';
    overlay.onclick = function(e) { if (e.target === this) this.remove(); };
    overlay.innerHTML =
      '<div class="modal-sheet" style="width:100%;max-width:500px;border-radius:20px 20px 0 0;background:white;padding:24px 20px 20px;">' +
        '<div style="text-align:center;margin-bottom:20px;">' +
          '<div style="width:40px;height:4px;background:#ddd;border-radius:2px;margin:0 auto 12px;"></div>' +
          '<span style="font-size:17px;font-weight:700;color:var(--grey-dark);">Catalogue</span>' +
        '</div>' +
        '<button class="btn" style="width:100%;padding:14px;margin-bottom:10px;font-weight:600;text-align:left;display:flex;align-items:center;gap:12px;font-size:14px;" onclick="this.closest(\'.modal-overlay\').remove();openBizCatalogue(\'biz_user\',\'' + nameEsc + '\',\'' + biz.town + '\',\'' + (biz.phone || '') + '\',\'' + col + '\',\'' + init + '\')">' +
          '<span style="width:28px;height:28px;border-radius:50%;background:var(--orange);color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;"><i class="fas fa-eye"></i></span> View Catalogue' +
        '</button>' +
        '<button class="btn" style="width:100%;padding:14px;margin-bottom:10px;font-weight:600;text-align:left;display:flex;align-items:center;gap:12px;font-size:14px;background:rgba(253,118,0,0.06);border:1px solid var(--orange);" onclick="this.closest(\'.modal-overlay\').remove();openAddItemWithCategory()">' +
          '<span style="width:28px;height:28px;border-radius:50%;background:var(--orange);color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;"><i class="fas fa-plus"></i></span> Add Item' +
        '</button>' +
        '<button class="btn" style="width:100%;padding:14px;margin-bottom:10px;font-weight:600;text-align:left;display:flex;align-items:center;gap:12px;font-size:14px;background:rgba(253,118,0,0.06);border:1px solid var(--orange);" onclick="this.closest(\'.modal-overlay\').remove();openAddItemWithCategory()">' +
          '<span style="width:28px;height:28px;border-radius:50%;background:var(--orange);color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;"><i class="fas fa-plus-circle"></i></span> Create New Catalogue' +
        '</button>' +
        '<button class="btn-outline" style="width:100%;padding:14px;font-size:14px;" onclick="this.closest(\'.modal-overlay\').remove()">Cancel</button>' +
      '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function(){ overlay.style.display = 'flex'; });
  };

  /* ─── CATEGORY SELECTOR FOR ADD ITEM ─── */
  window.openAddItemWithCategory = function(){
    const cats = getAllCategories();
    if (cats.length === 0) { showToast('No categories available'); return; }

    const existing = document.getElementById('add-item-cat-selector-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'add-item-cat-selector-overlay';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
    overlay.onclick = function(e) { if (e.target === this) this.remove(); };

    const catHtml = cats.map(function(c){
      return '<button class="pill" style="font-size:13px;padding:10px 16px;text-align:left;width:100%;border:1px solid #eee;border-radius:8px;background:white;cursor:pointer;display:flex;align-items:center;gap:10px;" onclick="this.closest(\'.modal-overlay\').remove();openAddItemModal(\'' + c.name.replace(/'/g,"\\'") + '\')">' +
        '<span style="width:24px;height:24px;border-radius:50%;background:var(--orange-light);color:var(--orange);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;font-weight:700;">' + c.name.charAt(0) + '</span>' +
        '<span>' + c.name + '</span>' +
        (c.children && c.children.length ? '<span style="margin-left:auto;font-size:11px;color:#999;">' + c.children.length + ' sub</span>' : '') +
      '</button>';
    }).join('');

    overlay.innerHTML =
      '<div class="modal-sheet" style="width:95%;max-width:500px;border-radius:20px;background:white;display:flex;flex-direction:column;max-height:80vh;">' +
        '<div class="modal-header" style="padding:16px 20px;border-bottom:1px solid var(--grey-light);display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="font-size:17px;font-weight:700;">Select a Category</span>' +
          '<button class="modal-close" style="background:none;border:none;cursor:pointer;padding:5px;" onclick="this.closest(\'.modal-overlay\').remove()"><img src="assets/icons/solid/xmark_orange.webp" style="width:20px;height:20px;display:block;"></button>' +
        '</div>' +
        '<div class="modal-body" style="overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;">' + catHtml + '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function(){ overlay.style.display = 'flex'; });
  };

  /* ─── TOWN SELECT POPULATION ─── */
  function populateTownSelects(){
    const towns = getAllTowns();
    const selects = document.querySelectorAll('select[id$="-town"], select[id="item-town"]');
    selects.forEach(s => {
      s.innerHTML = '';
      towns.forEach(tn => {
        const opt = document.createElement('option');
        opt.value = tn;
        opt.textContent = tn;
        s.appendChild(opt);
      });
      s.value = 'Gaborone';
    });
  }

  /* ─── ARTWORK SUBMISSION (Facebook Boost) ─── */
  let _artworkItems = [];
  let _artCategoryBrowserItemIdx = -1;
  let _artCurrentItemIdx = 0;

  const LINK_LABELS = {
    website:'Website', email:'Email', call:'Call', whatsapp:'WhatsApp',
    instagram:'Instagram', tiktok:'TikTok', snapchat:'Snapchat', linkedin:'LinkedIn'
  };
  const ALL_LINK_TYPES = Object.keys(LINK_LABELS);

  const ART_MAX_TAGS = 30;

  function _genThumbnail(file, maxW) {
    return new Promise(resolve => {
      maxW = maxW || 200;
      const r = new FileReader();
      r.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          const c = document.createElement('canvas');
          const s = Math.min(1, maxW / img.width);
          c.width = img.width * s;
          c.height = img.height * s;
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
      };
      r.readAsDataURL(file);
    });
  }

  function _getAvailableDates() {
    const dayMap = [
      { name:'Monday', num:1 }, { name:'Wednesday', num:3 }, { name:'Friday', num:5 }
    ];
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() + 1);
    const out = [];
    for (let d = 0; d < 28; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + d);
      const dn = date.getDay();
      for (const day of dayMap) {
        if (dn === day.num) {
          out.push({
            dateStr: date.toISOString().split('T')[0],
            dayName: day.name,
            display: date.toLocaleString('default',{weekday:'short'})+' '+date.getDate()+' '+date.toLocaleString('default',{month:'short'})
          });
        }
      }
    }
    return out;
  }

  function _escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function _hasUnsavedArtwork() {
    return _artworkItems.some(i => i.title || i.facebookLink || i.scheduledDate);
  }

  function _clearArtworkState() {
    _artworkItems = [];
    _artCurrentItemIdx = 0;
    window.removeEventListener('beforeunload', _artBeforeUnload);
    const container = document.getElementById('art-item-details');
    if (container) container.innerHTML = '';
    _renderSummary();
  }

  function _artBeforeUnload(e) {
    if (_hasUnsavedArtwork()) {
      e.preventDefault();
      e.returnValue = '';
    }
  }

  /* ─── ARTWORK ONBOARDING ─── */
  var _artOnboardingStep = 0;
  var ARTWORK_ONBOARDING_STEPS = [
    { icon: '\uD83D\uDCF7', title: 'Add Your Images', desc: 'Tap the + button to add up to 12 artwork images. Each image becomes a card where you fill in the details for your Facebook boost.' },
    { icon: '\u270F\uFE0F', title: 'Fill in Details', desc: 'Add a title, description, and Facebook link (required) for each item. You can also add optional links, pick a category, and add #tags.' },
    { icon: '\uD83D\uDCC5', title: 'Pick a Schedule Date', desc: 'Choose from available boost dates \u2014 Mondays, Wednesdays, and Fridays in the next 4 weeks. Each item must have its own date.' },
    { icon: '\uD83D\uDE80', title: 'Submit for Boosts', desc: 'Each item costs 1 boost. Review your items, swipe through them to check everything, then tap Submit to send for admin approval.' }
  ];

  window.showArtworkOnboarding = function() {
    _artOnboardingStep = 0;
    renderArtworkOnboardingStep();
    openModal('art-onboarding-modal');
  };

  function renderArtworkOnboardingStep() {
    var step = ARTWORK_ONBOARDING_STEPS[_artOnboardingStep];
    document.getElementById('art-onboarding-icon').textContent = step.icon;
    document.getElementById('art-onboarding-title').textContent = step.title;
    document.getElementById('art-onboarding-desc').textContent = step.desc;
    for (var i = 0; i < ARTWORK_ONBOARDING_STEPS.length; i++) {
      var dot = document.getElementById('art-odot-' + i);
      if (dot) dot.style.background = i === _artOnboardingStep ? 'var(--orange)' : 'var(--grey-light)';
    }
    var btn = document.getElementById('art-onboarding-btn');
    if (_artOnboardingStep === ARTWORK_ONBOARDING_STEPS.length - 1) {
      btn.textContent = 'Get Started';
    } else {
      btn.textContent = 'Next';
    }
  }

  window.nextArtworkOnboardingStep = function() {
    _artOnboardingStep++;
    if (_artOnboardingStep >= ARTWORK_ONBOARDING_STEPS.length) {
      closeArtworkOnboarding();
      return;
    }
    renderArtworkOnboardingStep();
  };

  window.closeArtworkOnboarding = function() {
    closeModal('art-onboarding-modal');
  };

  function _syncItemFromDom() {
    const container = document.getElementById('art-item-details');
    if (!container) return;
    container.querySelectorAll('.art-item-card').forEach(card => {
      const idx = parseInt(card.dataset.itemIdx);
      if (isNaN(idx) || !_artworkItems[idx]) return;
      const titleEl = card.querySelector('.art-title-input');
      const descEl = card.querySelector('.art-desc-input');
      const fbEl = card.querySelector('.art-fb-input');
      const catEl = card.querySelector('.art-cat-select');
      if (titleEl) _artworkItems[idx].title = titleEl.value;
      if (descEl) _artworkItems[idx].description = descEl.value;
      if (fbEl) _artworkItems[idx].facebookLink = fbEl.value;
      if (catEl && catEl.value) _artworkItems[idx].category = catEl.value;
      const checkedDate = card.querySelector('.art-date-radio:checked');
      if (checkedDate) {
        _artworkItems[idx].scheduledDate = checkedDate.value;
        _artworkItems[idx].scheduledDay = checkedDate.dataset.day || '';
      }
      card.querySelectorAll('.art-link-input').forEach(inp => {
        const linkKey = inp.dataset.link;
        if (linkKey) _artworkItems[idx].links[linkKey] = inp.value;
      });
    });
  }

  function _renderItemDetails() {
    const container = document.getElementById('art-item-details');
    if (!container) return;
    _syncItemFromDom();

    if (_artworkItems.length === 0) {
      container.innerHTML = '';
      _renderSummary();
      return;
    }

    if (_artCurrentItemIdx >= _artworkItems.length) _artCurrentItemIdx = _artworkItems.length - 1;
    if (_artCurrentItemIdx < 0) _artCurrentItemIdx = 0;

    const idx = _artCurrentItemIdx;
    const item = _artworkItems[idx];
    const total = _artworkItems.length;

    const dates = _getAvailableDates();
    const weeks = [];
    for (let i = 0; i < dates.length; i += 3) {
      weeks.push(dates.slice(i, i + 3));
    }

    function _populateItemCatSelect(sel, itm) {
      if (!sel) return;
      sel.innerHTML = '';
      const bizCats = typeof getBusinessCategories === 'function' ? getBusinessCategories() : [];
      const cats = typeof getAllCategories === 'function' ? getAllCategories() : [];
      const noneOpt = document.createElement('option');
      noneOpt.value = '';
      noneOpt.textContent = 'Select category...';
      sel.appendChild(noneOpt);
      (bizCats.length ? cats.filter(c => bizCats.includes(c.name)) : cats).forEach(c => {
        const o = document.createElement('option');
        o.value = c.id || c.name;
        o.textContent = c.name;
        if (itm.category === (c.id || c.name)) o.selected = true;
        sel.appendChild(o);
      });
    }

    const added = Object.keys(item.links);
    const avail = ALL_LINK_TYPES.filter(l => !added.includes(l));
    const linkRows = added.map(k => {
      const label = LINK_LABELS[k] || k;
      return `<div style="display:flex;align-items:center;gap:6px;margin-top:6px;">
        <span style="font-size:11px;font-weight:600;color:#3f3f46;min-width:70px;text-transform:uppercase;letter-spacing:0.5px;">${label}</span>
        <input type="text" class="art-link-input" data-item="${idx}" data-link="${k}" value="${_escHtml(item.links[k]||'')}" placeholder="${label} URL" style="flex:1;padding:8px 10px;border:1px solid #d4d4d8;border-radius:6px;font-size:12px;color:#18181b;outline:none;box-sizing:border-box;transition:border-color 0.15s ease;" onfocus="this.style.borderColor='var(--orange,#f97316)'" onblur="this.style.borderColor='#d4d4d8'">
        <button type="button" class="art-remove-link" data-item="${idx}" data-link="${k}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px;padding:2px;line-height:1;">✕</button>
      </div>`;
    }).join('');

    const addLinkHtml = avail.length > 0
      ? `<select class="art-add-link" data-item="${idx}" style="width:100%;margin-top:6px;padding:8px 12px;font-size:12px;font-weight:500;border:1px dashed #d4d4d8;border-radius:6px;background:#fff;color:var(--orange);cursor:pointer;outline:none;box-sizing:border-box;text-align:center;transition:border-color 0.15s ease;" onfocus="this.style.borderColor='var(--orange,#f97316)'" onblur="this.style.borderColor='#d4d4d8'">
          <option value="">+ Add Link</option>
          ${avail.map(l => `<option value="${l}">${LINK_LABELS[l]}</option>`).join('')}
         </select>`
      : '';

    const weekHtml = weeks.map((weekDates, wi) => {
      const isLast = wi === weeks.length - 1;
      const rows = weekDates.map(d => {
        const checked = item.scheduledDate === d.dateStr ? ' checked' : '';
        const takenByOther = _artworkItems.some((o, oi) => oi !== idx && o.scheduledDate === d.dateStr);
        const disabled = takenByOther ? ' disabled' : '';
        return `<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #e4e4e7;border-radius:6px;font-size:13px;color:#27272a;background:#fafafa;cursor:${takenByOther?'not-allowed':'pointer'};max-width:100%;box-sizing:border-box;${takenByOther?'opacity:0.4;pointer-events:none;':''}">
          <input type="radio" class="art-date-radio" name="art-date-${idx}" value="${d.dateStr}" data-day="${d.dayName}" data-item="${idx}"${checked}${disabled} style="position:absolute;opacity:0;width:0;height:0;pointer-events:none;">
          <span class="art-custom-radio" style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:4px;border:2px solid ${checked?'#fd7600':'#d4d4d8'};background:${checked?'#fd7600':'#fff'};flex-shrink:0;transition:all 0.1s;">${checked?'<span style="color:#fff;font-size:12px;line-height:1;">✓</span>':''}</span>
          <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.display}</span>
        </label>`;
      }).join('');
      return `<div style="margin-bottom:${isLast?'4px':'12px'};">
        <div style="font-size:11px;font-weight:700;color:#a1a1aa;text-transform:uppercase;margin-bottom:6px;letter-spacing:0.5px;">Week ${wi+1}</div>
        <div style="display:flex;flex-direction:column;gap:4px;">${rows}</div>
      </div>`;
    }).join('');

    const tags = item.tags || [];
    const tagPills = tags.map((t, ti) =>
      `<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;margin:2px;background:rgba(253,118,0,0.12);color:var(--orange);border-radius:12px;font-size:11px;font-weight:600;">
        ${_escHtml(t)}
        <button type="button" class="art-tag-remove" data-item="${idx}" data-tag-idx="${ti}" style="background:none;border:none;color:var(--orange);cursor:pointer;font-size:14px;line-height:1;padding:0;">✕</button>
      </span>`
    ).join('');
    const tagsFull = tags.length >= ART_MAX_TAGS;

    const isOpen = cardHasOpen(idx);

    const html = `
      <div class="art-item-card${isOpen?' open':''}" data-item-idx="${idx}" style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.05);margin-bottom:12px;overflow:hidden;max-width:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

        <div class="art-item-header" onclick="toggleArtItem(this)" style="display:flex;align-items:center;gap:12px;padding:12px;cursor:pointer;user-select:none;background:#fafafa;border-bottom:1px solid #e4e4e7;">
          <img src="${item.thumbnail}" onclick="showArtworkImagePreview(this.src,${idx})" style="width:42px;height:42px;object-fit:cover;border-radius:8px;flex-shrink:0;border:1px solid #e4e4e7;cursor:pointer;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:#18181b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;">${_escHtml(item.title) || 'Untitled'}</div>
            <div style="font-size:11px;color:#71717a;">${item.scheduledDate || 'No date set'}</div>
          </div>
          <button type="button" class="art-remove-item" onclick="removeArtworkItem(event,${idx})" style="width:28px;height:28px;border-radius:50%;background:#fee2e2;border:none;color:#ef4444;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:0;line-height:1;">✕</button>
        </div>

        <div class="art-item-body" style="padding:16px;overflow-x:hidden;${isOpen?'':'display:none;'}">

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding:8px 12px;background:#f4f4f5;border-radius:8px;">
            <button type="button" class="art-prev-item" data-item="${idx}" style="background:none;border:none;font-size:12px;color:#71717a;cursor:pointer;padding:4px;${idx===0?'visibility:hidden;':''}">◀</button>
            <span style="font-size:12px;font-weight:600;color:#27272a;letter-spacing:0.5px;">Item ${idx+1} of ${total}</span>
            <button type="button" class="art-next-item" data-item="${idx}" style="background:none;border:none;font-size:12px;color:#71717a;cursor:pointer;padding:4px;${idx>=total-1?'visibility:hidden;':''}">▶</button>
          </div>

          <div style="margin-bottom:14px;">
            <label style="font-size:11px;font-weight:600;color:#3f3f46;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">Title *</label>
            <input type="text" class="art-title-input" data-item="${idx}" value="${_escHtml(item.title)}" placeholder="Image title" style="width:100%;padding:10px 12px;border:1px solid #d4d4d8;border-radius:6px;font-size:13px;font-weight:500;color:#18181b;box-sizing:border-box;outline:none;transition:border-color 0.15s ease;" oninput="liveUpdateTitle(this,${idx})" onfocus="this.style.borderColor='var(--orange,#f97316)'" onblur="this.style.borderColor='#d4d4d8'">
          </div>

          <div style="margin-bottom:14px;">
            <label style="font-size:11px;font-weight:600;color:#3f3f46;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">Description</label>
            <textarea class="art-desc-input" data-item="${idx}" placeholder="Describe this image (optional)" style="width:100%;padding:10px 12px;border:1px solid #d4d4d8;border-radius:6px;font-size:13px;color:#18181b;resize:vertical;min-height:54px;box-sizing:border-box;outline:none;transition:border-color 0.15s ease;" onfocus="this.style.borderColor='var(--orange,#f97316)'" onblur="this.style.borderColor='#d4d4d8'">${_escHtml(item.description)}</textarea>
          </div>

          <div style="margin-bottom:16px;">
            <label style="font-size:11px;font-weight:600;color:#3f3f46;display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Schedule Date *</label>
            ${weekHtml}
          </div>

          <div style="margin-bottom:14px;">
            <label style="font-size:11px;font-weight:600;color:#3f3f46;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">Facebook Link *</label>
            <input type="url" class="art-fb-input" data-item="${idx}" value="${_escHtml(item.facebookLink)}" placeholder="https://facebook.com/..." style="width:100%;padding:10px 12px;border:1px solid #d4d4d8;border-radius:6px;font-size:13px;color:#18181b;box-sizing:border-box;outline:none;transition:border-color 0.15s ease;" onfocus="this.style.borderColor='var(--orange,#f97316)'" onblur="this.style.borderColor='#d4d4d8'">
          </div>

          <div class="art-links-section" style="margin-bottom:14px;padding-top:10px;border-top:1px solid #f4f4f5;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:11px;font-weight:600;color:#3f3f46;text-transform:uppercase;letter-spacing:0.5px;">Additional Links</span>
            </div>
            ${linkRows}
            ${addLinkHtml}
          </div>

          <div style="margin-bottom:14px;">
            <label style="font-size:11px;font-weight:600;color:#3f3f46;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px;">Category *</label>
            <select class="art-cat-select" data-item="${idx}" style="width:100%;padding:10px 12px;border:1px solid #d4d4d8;border-radius:6px;font-size:13px;color:#18181b;background-color:#fff;outline:none;box-sizing:border-box;transition:border-color 0.15s ease;" onfocus="this.style.borderColor='var(--orange,#f97316)'" onblur="this.style.borderColor='#d4d4d8'"></select>
          </div>

          <div style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:11px;font-weight:600;color:#3f3f46;text-transform:uppercase;letter-spacing:0.5px;">Tags <span style="font-weight:400;color:#a1a1aa;margin-left:2px;">${tags.length}/${ART_MAX_TAGS}</span></span>
              <button type="button" class="art-browse-cats" data-item="${idx}" onclick="openArtCategoryBrowser(${idx})" style="background:none;border:1px solid var(--orange);color:var(--orange);border-radius:6px;padding:4px 8px;font-size:11px;font-weight:500;cursor:pointer;">Browse</button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">${tagPills}</div>
            ${tagsFull ? '<div style="font-size:10px;color:#a1a1aa;">Max tags reached</div>'
              : `<div style="display:flex;gap:6px;">
                  <input type="text" class="art-tag-input" data-item="${idx}" placeholder="Type #tag and press Enter" style="flex:1;padding:8px 12px;border:1px solid #d4d4d8;border-radius:6px;font-size:13px;color:#18181b;outline:none;box-sizing:border-box;transition:border-color 0.15s ease;" onfocus="this.style.borderColor='var(--orange,#f97316)'" onblur="this.style.borderColor='#d4d4d8'">
                  <button type="button" class="art-tag-add" data-item="${idx}" style="background:var(--orange);color:#fff;border:none;border-radius:6px;padding:8px 14px;font-size:16px;line-height:1;font-weight:600;cursor:pointer;">+</button>
                 </div>`}
          </div>

        </div>
      </div>`;

    container.innerHTML = html;

    container.querySelectorAll('.art-cat-select').forEach(sel => {
      const i = parseInt(sel.dataset.item);
      if (!isNaN(i) && _artworkItems[i]) _populateItemCatSelect(sel, _artworkItems[i]);
    });

    _renderSummary();
  }

  function cardHasOpen(idx) {
    const card = document.querySelector(`.art-item-card[data-item-idx="${idx}"]`);
    if (card) return card.classList.contains('open');
    return true;
  }

  function _renderSummary() {
    const summary = document.getElementById('art-summary');
    const text = document.getElementById('art-summary-text');
    const boostCount = document.getElementById('boost-counter-modal');
    if (!summary || !text) return;
    if (_artworkItems.length === 0) { summary.style.display = 'none'; return; }
    summary.style.display = 'block';
    const valid = _artworkItems.filter(i => i.title && i.facebookLink && i.scheduledDate).length;
    const key = 'foromane_boosts_remaining';
    const remaining = parseInt(localStorage.getItem(key) || '12', 10);
    text.textContent = _artworkItems.length+' item'+(_artworkItems.length!==1?'s':'')+' · '+_artworkItems.length+' boost'+
      (_artworkItems.length!==1?'s':'')+(valid<_artworkItems.length?' · '+valid+'/'+_artworkItems.length+' complete':'');
    if (boostCount) {
      boostCount.textContent = _artworkItems.length + ' boost' + (_artworkItems.length!==1?'s':'') + ' needed · ' + remaining + ' available';
    }
  }

  function addArtworkTag(idx, tag) {
    if (!_artworkItems[idx]) return;
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('#')) {
      addArtworkTag(idx, '#' + trimmed);
      return;
    }
    if (_artworkItems[idx].tags.length >= ART_MAX_TAGS) {
      showToast('Max ' + ART_MAX_TAGS + ' tags per item');
      return;
    }
    if (_artworkItems[idx].tags.includes(trimmed)) {
      showToast('Tag already added');
      return;
    }
    _artworkItems[idx].tags.push(trimmed);
    _renderItemDetails();
  }

  function removeArtworkTag(idx, tagIdx) {
    if (!_artworkItems[idx]) return;
    _artworkItems[idx].tags.splice(tagIdx, 1);
    _renderItemDetails();
  }

  function _renderCategoryBrowser(idx) {
    const modal = document.getElementById('art-category-browser');
    if (!modal) return;
    _artCategoryBrowserItemIdx = idx;
    const list = modal.querySelector('.art-category-browser-list');
    if (!list) return;
    const cats = typeof getAllCategories === 'function' ? getAllCategories() : [];
    const chosen = (_artworkItems[idx] && _artworkItems[idx].tags) || [];

    function isChosen(name) { return chosen.includes('#' + name); }

    let treeHtml = '';
    const topLevel = cats.filter(c => !c.parentId && !c.parent);
    const childMap = {};
    cats.forEach(c => {
      const p = c.parentId || c.parent;
      if (p) {
        if (!childMap[p]) childMap[p] = [];
        childMap[p].push(c);
      }
    });

    function renderBranch(node, depth) {
      const indent = depth * 20;
      const checked = isChosen(node.name) ? ' checked' : '';
      const children = childMap[node.id] || childMap[node.name] || [];
      let h = `<div style="padding-left:${indent}px;margin:2px 0;">
        <label style="font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px;">
          <input type="checkbox" class="art-cat-browser-cb" value="${_escHtml(node.name)}"${checked}>
          ${_escHtml(node.name)}
        </label>`;
      children.forEach(ch => { h += renderBranch(ch, depth + 1); });
      h += '</div>';
      return h;
    }

    topLevel.forEach(c => { treeHtml += renderBranch(c, 0); });
    list.innerHTML = treeHtml || '<p style="color:#999;text-align:center;">No categories available.</p>';
  }

  window.openArtCategoryBrowser = function(idx) {
    _renderCategoryBrowser(idx);
    openModal('art-category-browser');
  };

  window.closeArtCategoryBrowser = function() {
    closeModal('art-category-browser');
  };

  window.applyArtCategoryTags = function() {
    const modal = document.getElementById('art-category-browser');
    if (!modal) return;
    const idx = _artCategoryBrowserItemIdx;
    if (idx < 0 || !_artworkItems[idx]) return;
    const checks = modal.querySelectorAll('.art-cat-browser-cb:checked');
    checks.forEach(cb => {
      const tagName = '#' + cb.value;
      if (!_artworkItems[idx].tags.includes(tagName) && _artworkItems[idx].tags.length < ART_MAX_TAGS) {
        _artworkItems[idx].tags.push(tagName);
      }
    });
    _artCategoryBrowserItemIdx = -1;
    closeModal('art-category-browser');
    _renderItemDetails();
  };

  window.renderArtCategoryBrowser = function(idx) {
    _renderCategoryBrowser(idx);
  };

  window.toggleArtItem = function(headerEl) {
    const card = headerEl.closest('.art-item-card');
    if (!card) return;
    card.classList.toggle('open');
    const body = card.querySelector('.art-item-body');
    const chevron = card.querySelector('.art-chevron');
    if (body) {
      body.style.display = card.classList.contains('open') ? '' : 'none';
    }
    if (chevron) {
      chevron.style.transform = card.classList.contains('open') ? 'rotate(0deg)' : 'rotate(-90deg)';
    }
  };

  /* ─── OPEN VIEW ─── */
  window.openArtworkSubmission = function() {
    if (typeof goTo !== 'function') return;
    const existing = document.getElementById('view-artwork-submission');
    if (!existing) return;
    _artworkItems = [];
    _artCurrentItemIdx = 0;
    syncBoostCounter();
    const fileInput = document.getElementById('art-file-input');
    if (fileInput) fileInput.value = '';
    const details = document.getElementById('art-item-details');
    if (details) details.innerHTML = '';
    _renderItemDetails();
    const summary = document.getElementById('art-summary');
    if (summary) summary.style.display = 'none';
    _renderSummary();
    window.addEventListener('beforeunload', _artBeforeUnload);
    goTo('view-artwork-submission');
  };

  /* ─── HANDLE FILE UPLOAD ─── */
  window.handleArtworkFiles = async function(files) {
    if (!files || files.length === 0) return;
    const max = 12;
    const remaining = max - _artworkItems.length;
    const toAdd = Math.min(remaining, files.length);
    for (let i = 0; i < toAdd; i++) {
      const f = files[i];
      const thumb = await _genThumbnail(f);
      _artworkItems.push({
        file: f,
        thumbnail: thumb,
        title: '',
        description: '',
        facebookLink: '',
        links: {},
        scheduledDate: '',
        scheduledDay: '',
        category: '',
        tags: []
      });
    }
    if (_artworkItems.length >= max) showToast('Max 12 images reached');
    _artCurrentItemIdx = _artworkItems.length - toAdd;
    _renderItemDetails();
  };

  /* ─── SUBMIT ─── */
  window.submitArtwork = function() {
    (async function() {
      _syncItemFromDom();

      if (_artworkItems.length === 0) { showToast('Please add at least 1 image (max 12)'); return; }

      if (window.ForomaneCadence) {
        var cd = window.ForomaneCadence.getCurrentCadenceDay();
        if (cd === 'off' || cd === 'maintenance') {
          var next = window.ForomaneCadence.getNextCadenceDay();
          var msg = 'Artwork goes live on Mon/Wed/Fri. Your submission will appear on the next cadence day';
          if (next) msg += ' (' + window.ForomaneCadence.formatShortDate(next) + ')';
          if (!confirm(msg + '.\n\nSubmit anyway?')) return;
        }
      }

      const missing = [];
      _artworkItems.forEach((item, idx) => {
        const errs = [];
        if (!item.title) errs.push('title');
        if (!item.facebookLink) errs.push('Facebook link');
        if (!item.scheduledDate) errs.push('schedule date');
        if (!item.category) errs.push('category');
        if (errs.length) missing.push('Item ' + (idx + 1) + ': missing ' + errs.join(', '));
      });
      if (missing.length) { showToast(missing[0]); return; }

      const user = getCurrentUser();
      const biz = user.business || {};

      const key = 'foromane_boosts_remaining';
      let boostsLeft = parseInt(localStorage.getItem(key) || '12', 10);
      if (boostsLeft < _artworkItems.length) {
        showToast('Not enough boosts. You need ' + _artworkItems.length + ' but only ' + boostsLeft + ' remaining.');
        return;
      }

      boostsLeft = Math.max(0, boostsLeft - _artworkItems.length);
      localStorage.setItem(key, String(boostsLeft));
      syncBoostCounter();

      const submission = {
        id: 'sub_' + Date.now(),
        userId: user.id,
        businessName: biz.name || user.name,
        category: '', /* per-item category below */
        status: 'pending',
        createdAt: Date.now(),
        items: _artworkItems.map(item => ({
          id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          thumbnail: item.thumbnail,
          title: item.title,
          description: item.description,
          facebookLink: item.facebookLink,
          links: Object.assign({}, item.links),
          scheduledDate: item.scheduledDate,
          scheduledDay: item.scheduledDay,
          category: item.category,
          tags: item.tags.slice(),
          status: 'pending'
        }))
      };

      const subs = JSON.parse(localStorage.getItem('foromane_artwork_submissions') || '[]');
      subs.push(submission);
      localStorage.setItem('foromane_artwork_submissions', JSON.stringify(subs));

      showToast(_artworkItems.length + ' item' + (_artworkItems.length !== 1 ? 's' : '') + ' submitted. Boosts left: ' + boostsLeft);

      const _filesForUpload = _artworkItems.filter(i => i.file).map(i => i.file);
      _clearArtworkState();
      if (typeof goBack === 'function') goBack();

      /* background upload of full-res files if online */
      if (_filesForUpload.length > 0) {
        try {
          if (navigator.onLine) {
            const uploadUrl = (window.UPLOAD_SERVER_URL || 'http://localhost:3001') + '/upload-artwork';
            const form = new FormData();
            form.append('submissionId', submission.id);
            form.append('category', submission.category);
            form.append('userId', user.id);
            form.append('businessName', biz.name || user.name);
            submission.items.forEach(item => { form.append('itemIds', item.id); });
            _filesForUpload.forEach(f => form.append('files', f, f.name));
            await fetch(uploadUrl, { method: 'POST', body: form }).catch(() => {});
          }
        } catch (_e) {}
      }
    })();
  };

  /* ─── CANCEL ─── */
  window.cancelArtworkSubmission = function() {
    if (_hasUnsavedArtwork()) {
      if (!confirm('You have unsaved changes. Discard them and leave?')) return;
    }
    _clearArtworkState();
    if (typeof goBack === 'function') goBack();
  };

  window.showArtworkImagePreview = function(src, idx) {
    var overlay = document.createElement('div');
    overlay.id = 'art-preview-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;';
    overlay.onclick = function(e) { if (e.target === overlay) document.body.removeChild(overlay); };
    var img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'max-width:100%;max-height:calc(100% - 80px);border-radius:8px;display:block;object-fit:contain;cursor:pointer;';
    img.onclick = function() { document.body.removeChild(overlay); };
    overlay.appendChild(img);
    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:12px;margin-top:16px;width:100%;max-width:320px;flex-shrink:0;';
    btnRow.innerHTML =
      '<button onclick="changeArtworkImage(' + idx + ')" style="flex:1;height:44px;border:none;border-radius:8px;background:var(--orange);color:#fff;font-size:14px;font-weight:600;cursor:pointer;">Change</button>' +
      '<button onclick="deleteArtworkFromPreview(' + idx + ')" style="flex:1;height:44px;border:none;border-radius:8px;background:var(--orange);color:#fff;font-size:14px;font-weight:600;cursor:pointer;">Delete</button>';
    overlay.appendChild(btnRow);
    document.body.appendChild(overlay);
  };

  window.changeArtworkImage = async function(idx) {
    if (idx < 0 || idx >= _artworkItems.length) return;
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var thumb = await _genThumbnail(file);
      _artworkItems[idx].file = file;
      _artworkItems[idx].thumbnail = thumb;
      closeArtPreview();
      _renderItemDetails();
    };
    input.click();
  };

  window.deleteArtworkFromPreview = function(idx) {
    if (idx < 0 || idx >= _artworkItems.length) return;
    _artworkItems.splice(idx, 1);
    if (_artCurrentItemIdx >= _artworkItems.length) {
      _artCurrentItemIdx = Math.max(0, _artworkItems.length - 1);
    }
    closeArtPreview();
    _renderItemDetails();
  };

  function closeArtPreview() {
    var ov = document.getElementById('art-preview-overlay');
    if (ov) document.body.removeChild(ov);
  }

  window.removeArtworkItem = function(e, idx) {
    e.stopPropagation();
    if (idx < 0 || idx >= _artworkItems.length) return;
    _artworkItems.splice(idx, 1);
    if (_artCurrentItemIdx >= _artworkItems.length) {
      _artCurrentItemIdx = Math.max(0, _artworkItems.length - 1);
    }
    _renderItemDetails();
  };

  window.liveUpdateTitle = function(el, idx) {
    if (!_artworkItems[idx]) return;
    _artworkItems[idx].title = el.value;
    var card = el.closest('.art-item-card');
    if (card) {
      var headerTitle = card.querySelector('.art-item-header > div:nth-child(2) > div:first-child');
      if (headerTitle) headerTitle.textContent = el.value || 'Untitled';
    }
  };

  /* ─── EVENT DELEGATION for dynamic item fields ─── */
  document.addEventListener('change', function(e) {
    const target = e.target;
    const idx = parseInt(target.dataset.item);
    if (isNaN(idx) || !_artworkItems[idx]) return;

    if (target.classList.contains('art-date-radio')) {
      _artworkItems[idx].scheduledDate = target.value;
      _artworkItems[idx].scheduledDay = target.dataset.day || '';
      _renderItemDetails();
    }
    if (target.classList.contains('art-add-link') && target.value) {
      const linkType = target.value;
      _artworkItems[idx].links[linkType] = '';
      _renderItemDetails();
    }
    if (target.classList.contains('art-cat-select')) {
      _artworkItems[idx].category = target.value;
    }
  });

  document.addEventListener('input', function(e) {
    const target = e.target;
    const idx = parseInt(target.dataset.item);
    if (isNaN(idx) || !_artworkItems[idx]) return;
    if (target.classList.contains('art-title-input')) _artworkItems[idx].title = target.value;
    else if (target.classList.contains('art-desc-input')) _artworkItems[idx].description = target.value;
    else if (target.classList.contains('art-fb-input')) _artworkItems[idx].facebookLink = target.value;
    else if (target.classList.contains('art-link-input')) {
      const linkKey = target.dataset.link;
      if (linkKey) _artworkItems[idx].links[linkKey] = target.value;
    }
  });

  document.addEventListener('click', function(e) {
    const target = e.target;
    if (target.classList.contains('art-remove-link')) {
      const idx = parseInt(target.dataset.item);
      const linkKey = target.dataset.link;
      if (!isNaN(idx) && _artworkItems[idx] && linkKey) {
        delete _artworkItems[idx].links[linkKey];
        _renderItemDetails();
      }
    }
    if (target.classList.contains('art-tag-remove')) {
      const idx = parseInt(target.dataset.item);
      const tagIdx = parseInt(target.dataset.tagIdx);
      if (!isNaN(idx) && !isNaN(tagIdx)) {
        removeArtworkTag(idx, tagIdx);
      }
    }
    if (target.classList.contains('art-tag-add')) {
      const idx = parseInt(target.dataset.item);
      const card = target.closest('.art-item-card');
      const input = card ? card.querySelector('.art-tag-input') : null;
      if (input && input.value.trim()) {
        addArtworkTag(idx, input.value.trim());
        input.value = '';
        input.focus();
      }
    }
    if (target.classList.contains('art-prev-item')) {
      if (_artCurrentItemIdx > 0) {
        _artCurrentItemIdx--;
        _renderItemDetails();
      }
    }
    if (target.classList.contains('art-next-item')) {
      if (_artCurrentItemIdx < _artworkItems.length - 1) {
        _artCurrentItemIdx++;
        _renderItemDetails();
      }
    }
    if (target.classList.contains('art-cancel-btn')) {
      window.cancelArtworkSubmission();
    }
    if (target.classList.contains('art-submit-btn')) {
      window.submitArtwork();
    }
    if (target.classList.contains('art-add-item-btn')) {
      const fileInput = document.getElementById('art-file-input');
      if (fileInput) fileInput.click();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const target = e.target;
      if (target.classList.contains('art-tag-input')) {
        e.preventDefault();
        const idx = parseInt(target.dataset.item);
        if (!isNaN(idx) && target.value.trim()) {
          addArtworkTag(idx, target.value.trim());
          target.value = '';
        }
      }
    }
  });

  window.addArtworkTag = addArtworkTag;
  window.removeArtworkTag = removeArtworkTag;

  window.hasUnsavedArtwork = _hasUnsavedArtwork;
  window.clearUnsavedArtwork = _clearArtworkState;

  /* ─── ADD ITEM via + button ─── */
  window.addArtworkItem = function() {
    const fileInput = document.getElementById('art-file-input');
    if (fileInput) fileInput.click();
  };

  /* ─── PROMO REQUESTS VIEW ─── */
  window.renderPromoRequests = function(){
    const modal = document.getElementById('promo-requests-view') || createPromoRequestsView();
    openModal('promo-requests-view');
    setTimeout(() => { try { window.renderPromoRequestsList && window.renderPromoRequestsList(); } catch(e){} }, 60);
  };

  function createPromoRequestsView(){
    const div = document.createElement('div');
    div.id = 'promo-requests-view';
    div.className = 'modal-overlay';
    div.style.cssText = 'align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
    div.innerHTML =
      '<div class="modal-sheet" style="width:95%;max-width:600px;border-radius:16px;background:white;display:flex;flex-direction:column;max-height:85vh;">' +

        '<div class="modal-header" style="padding:20px;border-bottom:1px solid var(--grey-light);display:flex;justify-content:space-between;align-items:center;">' +
          '<div>' +
            '<h2 class="modal-title" style="font-size:18px;font-weight:800;margin:0;">Promo Requests</h2>' +
            '<span style="font-size:12px;color:var(--grey-dark);">Admin Control Panel</span>' +
          '</div>' +
          '<button class="modal-close" onclick="closeModal(\'promo-requests-view\')" style="background:none;border:none;cursor:pointer;padding:5px;"><img src="assets/icons/solid/xmark_orange.webp" style="width:20px;height:20px;"></button>' +
        '</div>' +

        '<div style="display:flex;gap:10px;padding:12px 20px;background:#f9f9f9;border-bottom:1px solid var(--grey-light);">' +
          '<div style="font-size:11px;font-weight:700;color:var(--orange);background:var(--orange-light);padding:4px 8px;border-radius:4px;">PENDING: <span id="count-pending">0</span></div>' +
          '<div style="font-size:11px;font-weight:700;color:var(--grey-dark);">TOTAL: <span id="count-total">0</span></div>' +
        '</div>' +

        '<div class="modal-body" id="promo-requests-list" style="overflow-y:auto;padding:16px;background:#fdfdfd;flex-grow:1;">' +
          '<div id="requests-empty-state" style="text-align:center;padding:40px 20px;color:var(--grey-dark);"><p style="font-size:14px;">No pending promo requests found.</p></div>' +
        '</div>' +

      '</div>';
    document.body.appendChild(div);
    return div;
  }

  /* ─── INIT ─── */
  document.addEventListener('DOMContentLoaded', function(){
    window.LOCATIONS = window.LOCATIONS_DATA || { districts: [] };
    populateTownSelects();
    syncBoostCounter();
    updateMyCatalogueList();

    /* Populate register modal nationality dropdown */
    var natSel = document.getElementById('id-nationality');
    if (natSel && window.NATIONALITIES_DATA && natSel.options.length <= 1) {
      window.NATIONALITIES_DATA.forEach(function(item) {
        var opt = document.createElement('option');
        opt.value = item.nationality;
        opt.textContent = item.country + ' (' + item.nationality + ')';
        natSel.appendChild(opt);
      });
    }
    /* Populate register modal town dropdown */
    if (typeof window.populateTownDropdown === 'function') {
      window.populateTownDropdown();
    }
    /* Load crowd-sourced area submissions */
    if (typeof window.loadSubmittedAreas === 'function') {
      window.loadSubmittedAreas();
    }
    /* Load verified brands from Firestore */
    if (typeof window.loadVerifiedBrands === 'function') {
      window.loadVerifiedBrands().then(function(verified) {
        if (verified && verified.length > 0) {
          var existing = window.ITEM_BRANDS || { brands: [] };
          var existingNames = {};
          existing.brands.forEach(function(b) { existingNames[b.name.toLowerCase().trim()] = true; });
          verified.forEach(function(vb) {
            if (!existingNames[vb.name.toLowerCase().trim()]) {
              existing.brands.push({ name: vb.name, categories: vb.categories || [] });
            }
          });
          window.ITEM_BRANDS = existing;
        }
      }).catch(function(){});
    }
  });

  /* ─── BRAND REGISTRY ─── */
  function getBrandRegistry() {
    try { return JSON.parse(localStorage.getItem('foromane_brand_registry') || '{}'); }
    catch(e) { return {}; }
  }
  function saveBrandRegistry(reg) {
    localStorage.setItem('foromane_brand_registry', JSON.stringify(reg));
  }

  function isBrandPredefined(name) {
    if (!window.ITEM_BRANDS || !window.ITEM_BRANDS.brands) return false;
    return window.ITEM_BRANDS.brands.some(function(b) { return b.name.toLowerCase() === name.toLowerCase(); });
  }

  function getBrandPool() {
    var pool = [];
    if (window.ITEM_BRANDS && window.ITEM_BRANDS.brands) {
      pool = pool.concat(window.ITEM_BRANDS.brands.map(function(b) { return { name: b.name, categories: b.categories, source: 'predefined' }; }));
    }
    var reg = getBrandRegistry();
    Object.keys(reg).forEach(function(key) {
      var entry = reg[key];
      if (entry && entry.verified) {
        if (!pool.some(function(b) { return b.name.toLowerCase() === entry.name.toLowerCase(); })) {
          pool.push({ name: entry.name, categories: entry.categories || [], source: 'verified' });
        }
      }
    });
    return pool;
  }

  function upsertPendingBrand(name, categories, userId) {
    if (!name || !userId) return;
    var reg = getBrandRegistry();
    var key = name.trim().toLowerCase();
    if (reg[key]) {
      if (reg[key].addedByUserIds.indexOf(userId) === -1) {
        reg[key].addedByUserIds.push(userId);
      }
      if (reg[key].addedByUserIds.length >= 25) {
        reg[key].verified = true;
      }
    } else {
      reg[key] = {
        name: name.trim(),
        categories: categories || [],
        addedByUserIds: [userId],
        verified: false
      };
    }
    saveBrandRegistry(reg);
  }

  /* ─── BRAND SEARCH DROPDOWN ─── */
  var _brandSearchTimer = null;

  window.onBrandSearchInput = function(value) {
    if (_brandSearchTimer) clearTimeout(_brandSearchTimer);
    _brandSearchTimer = setTimeout(function() {
      var dropdown = document.getElementById('item-brand-dropdown');
      if (!dropdown) return;
      if (!value || value.trim() === '') {
        dropdown.style.display = 'none';
        return;
      }
      var v = value.trim().toLowerCase();
      var pool = getBrandPool();
      var selectedCats = (typeof _selectedCategories !== 'undefined' && _selectedCategories.length > 0)
        ? _selectedCategories.map(function(c) { return c.name.toLowerCase(); }) : [];
      var exact = null;
      var matches = pool.filter(function(b) {
        var match = b.name.toLowerCase().indexOf(v) !== -1;
        if (match && b.name.toLowerCase() === v) exact = b;
        return match;
      });
      matches.sort(function(a, b) {
        var aExact = a.name.toLowerCase() === v ? 0 : 1;
        var bExact = b.name.toLowerCase() === v ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        if (selectedCats.length > 0) {
          var aCat = a.categories.some(function(c) { return selectedCats.indexOf(c.toLowerCase()) !== -1; }) ? 0 : 1;
          var bCat = b.categories.some(function(c) { return selectedCats.indexOf(c.toLowerCase()) !== -1; }) ? 0 : 1;
          if (aCat !== bCat) return aCat - bCat;
        }
        return a.name.localeCompare(b.name);
      });
      var html = '';
      matches.forEach(function(b) {
        html += '<div class="brand-dropdown-item" onmousedown="selectBrandSuggestion(\'' + b.name.replace(/'/g, "\\'") + '\')">' + b.name + '</div>';
      });
      var isNew = !exact && v.length > 0;
      if (isNew) {
        html += '<div class="brand-dropdown-item add-new" onmousedown="selectBrandSuggestion(\'' + v.replace(/'/g, "\\'") + '\')">+ Add &quot;' + v + '&quot; as new brand</div>';
      }
      if (!html) {
        html += '<div class="brand-dropdown-item" style="color:var(--grey-dark);cursor:default;">' +
          '+ Add &quot;' + v + '&quot; as new brand' +
        '</div>';
      }
      dropdown.innerHTML = html;
      dropdown.style.display = '';
    }, 100);
  };

  window.onBrandSearchFocus = function() {
    var input = document.getElementById('item-brand-input');
    var dropdown = document.getElementById('item-brand-dropdown');
    if (!input || !dropdown) return;
    if (input.value.trim() === '') {
      dropdown.style.display = 'none';
    } else {
      window.onBrandSearchInput(input.value);
    }
  };

  window.onBrandSearchBlur = function() {
    setTimeout(function() {
      var dropdown = document.getElementById('item-brand-dropdown');
      if (dropdown) dropdown.style.display = 'none';
    }, 200);
  };

  window.selectBrandSuggestion = function(name) {
    var input = document.getElementById('item-brand-input');
    var dropdown = document.getElementById('item-brand-dropdown');
    if (input) input.value = name;
    if (dropdown) dropdown.style.display = 'none';
  };

  window.ForomaneAccountViews = {
    openAddItemModal: window.openAddItemModal,
    saveAddItem: window.saveAddItem,
    deleteAddItem: window.deleteAddItem,
    openArtworkSubmission: window.openArtworkSubmission,
    renderPromoRequests: window.renderPromoRequests
  };
})();
