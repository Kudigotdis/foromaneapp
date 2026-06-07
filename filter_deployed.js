/* ════════════════════════════════════════════════════════
   FOROMANE FILTERS - Filters bar, category & location sheets
   ════════════════════════════════════════════════════════ */

let promoTypeIdx = 0;
const promoTypes = ['Buy New', 'Buy Used', 'To Rent', 'For Auction'];

let selectedCategories = []; // Multi-select array for categories
let userInterestsCollapsed = true; // User Interests collapsible state
let currentLocationMode = 'placeA';
let selectedPlaceA = 'Nation Wide';
let selectedPlaceB = 'All Area';
let locationData = null;

function openPromoTypeModal() {
  const container = document.getElementById('promo-type-options');
  const types = ['Buy New', 'Buy Used', 'To Rent', 'For Auction'];
  container.innerHTML = types.map(type => {
    const isSelected = type === promoTypes[promoTypeIdx];
    return `<div style="padding:14px 16px; border-bottom:1px solid var(--grey-light); font-size:15px; cursor:pointer; ${isSelected ? 'background:var(--orange-light); font-weight:600; color:var(--orange);' : ''}" onclick="selectPromoType('${type}')">${type}${isSelected ? ' <img src="assets/icons/solid/check-2_orange.webp" style="width:16px;height:16px;float:right;">' : ''}</div>`;
  }).join('');
  openModal('promo-type-modal');
}

function selectPromoType(type) {
  var idx = promoTypes.indexOf(type);
  if (idx !== -1) promoTypeIdx = idx;
  document.getElementById('promo-type-btn').textContent = promoTypes[promoTypeIdx];
  closeModal('promo-type-modal');
  if (typeof renderPromos === 'function') renderPromos();
}

/* ─── NEAR ME (Geolocation) ─── */
var FOROMANE_TOWN_COORDS = {
  'Gaborone': { lat: -24.6282, lng: 25.9231 },
  'Francistown': { lat: -21.1706, lng: 27.5144 },
  'Maun': { lat: -19.9833, lng: 23.4167 },
  'Serowe': { lat: -22.3864, lng: 26.7108 },
  'Molepolole': { lat: -24.4066, lng: 25.4951 },
  'Kanye': { lat: -24.9667, lng: 25.3333 },
  'Kasane': { lat: -17.8167, lng: 25.1500 },
  'Palapye': { lat: -22.5461, lng: 27.1306 },
  'Lobatse': { lat: -25.2167, lng: 25.6667 },
  'Ramotswa': { lat: -24.8667, lng: 25.8667 },
  'Mogoditshane': { lat: -24.6269, lng: 25.8656 },
  'Tlokweng': { lat: -24.6667, lng: 25.9667 }
};

function haversineKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestTown(lat, lng) {
  var nearest = null;
  var minDist = Infinity;
  for (var town in FOROMANE_TOWN_COORDS) {
    if (FOROMANE_TOWN_COORDS.hasOwnProperty(town)) {
      var c = FOROMANE_TOWN_COORDS[town];
      var dist = haversineKm(lat, lng, c.lat, c.lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = town;
      }
    }
  }
  return { town: nearest, distance: minDist };
}


function nearMe(btn) {
  if (!navigator.geolocation) {
    showToast('Geolocation not available on this device');
    if (btn) btn.innerHTML = '<i class="fas fa-location-dot" style="font-size:12px;"></i>';
    return;
  }

  navigator.geolocation.getCurrentPosition(function(pos) {
    var result = findNearestTown(pos.coords.latitude, pos.coords.longitude);
    if (result.town && result.distance < 100) {
      selectedPlaceA = result.town;
      selectedPlaceB = 'All Area';
      document.getElementById('place-a-btn').textContent = selectedPlaceA;
      document.getElementById('place-a-btn-pro').textContent = selectedPlaceA;
      document.getElementById('place-b-btn').textContent = 'All Area';
      showToast('Showing results near ' + result.town);
      renderPromos();
      renderDirectory();
    } else {
      showToast('Could not detect nearby town. Try selecting one manually.');
    }
    if (btn) btn.innerHTML = '<i class="fas fa-location-dot" style="font-size:12px;"></i>';
  }, function(err) {
    showToast('Location access denied. Enable GPS to use Near Me.');
    if (btn) btn.innerHTML = '<i class="fas fa-location-dot" style="font-size:12px;"></i>';
  }, { enableHighAccuracy: false, timeout: 10000 });
}

window.setSearchMode = setSearchMode;
window.doSearch = doSearch;
window.nearMe = nearMe;
window.openPromoTypeModal = openPromoTypeModal;
window.openSearchModal = openSearchModal;
window.selectPromoType = selectPromoType;
window.toggleUserInterestsCollapsed = typeof toggleUserInterestsCollapsed !== 'undefined'
  ? toggleUserInterestsCollapsed : function(){};
window.toggleCategoryCheckbox = typeof toggleCategoryCheckbox !== 'undefined'
  ? toggleCategoryCheckbox : function(){};
window.applyCategoryFilter = typeof applyCategoryFilter !== 'undefined'
  ? applyCategoryFilter : function(){};
window.renderCategoryCheckboxes = typeof renderCategoryCheckboxes !== 'undefined'
  ? renderCategoryCheckboxes : function(){};
window.toggleUserInterests = typeof toggleUserInterests !== 'undefined'
  ? toggleUserInterests : function(){};
window.toggleCategoryChildren = typeof toggleCategoryChildren !== 'undefined'
  ? toggleCategoryChildren : function(){};
window.updateCategoryFilterText = typeof updateCategoryFilterText !== 'undefined'
  ? updateCategoryFilterText : function(){};
window.loadCategoriesFromDB = typeof loadCategoriesFromDB !== 'undefined'
  ? loadCategoriesFromDB : function(){};
window.openCategorySheet = openCategorySheet;
window.openLocationSheet = openLocationSheet;
window.applyCategoryFilter = applyCategoryFilter;
window.updateCategoryFilterText = updateCategoryFilterText;
window.selectNationWide = selectNationWide;

let currentSearchMode = 'all';
function setSearchMode(mode) {
  currentSearchMode = mode;
  const pills = document.querySelectorAll('#search-modal .pill');
  pills.forEach(p => {
    p.classList.toggle('active', p.textContent.toLowerCase() === mode || (mode === 'az' && p.textContent.toLowerCase() === 'a-z'));
  });

  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const grid = document.getElementById('az-grid');

  if (mode === 'az') {
    input.style.display = 'none';
    results.style.display = 'none';
    grid.style.display = '';
    if (!grid.querySelector('#az-grid-letters').children.length) {
      buildAZGrid();
    }
  } else {
    input.style.display = '';
    results.style.display = '';
    grid.style.display = 'none';
    doSearch(input.value);
  }
}

function buildAZGrid() {
  const container = document.getElementById('az-grid-letters');
  const letters = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  container.innerHTML = letters.map(l => {
    const lnk = l === '#' ? 'hash' : l;
    return '<div class="az-letter" data-letter="' + l + '" onclick="selectAlphaLetter(\'' + l + '\')">' + l + '</div>';
  }).join('');
}

function selectAlphaLetter(letter) {
  closeModal('search-modal');
  var tab = document.getElementById('nav-directory');
  if (tab) tab.click();
  setTimeout(function() { scrollToAlpha(letter); }, 100);
}

function openSearchModal() {
  currentSearchMode = 'all';
  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  var grid = document.getElementById('az-grid');
  input.value = '';
  results.innerHTML = '';
  input.style.display = '';
  results.style.display = '';
  grid.style.display = 'none';

  const pills = document.querySelectorAll('#search-modal .pill');
  pills.forEach(p => p.classList.remove('active'));
  const allPill = pills[0];
  if (allPill) allPill.classList.add('active');

  openModal('search-modal');
  input.focus();
}

function doSearch(query) {
  const results = document.getElementById('search-results');
  if (!query || query.trim() === '') {
    results.innerHTML = '<p style="color:var(--grey-dark); font-size:13px; text-align:center; padding:20px;">Type to search promos...</p>';
    return;
  }
  const q = query.toLowerCase();
  const matches = window._promos.filter(p => {
    const brand = p.brand || '';
    const title = p.title || '';
    const bizName = p.businessName || '';
    const cat = p.category || '';
    const desc = p.desc || '';

    if (currentSearchMode === 'brand') return brand.toLowerCase().startsWith(q);
    if (currentSearchMode === 'business') return bizName.toLowerCase().startsWith(q);
    
    return title.toLowerCase().startsWith(q) ||
           brand.toLowerCase().startsWith(q) ||
           bizName.toLowerCase().startsWith(q) ||
           cat.toLowerCase().startsWith(q) ||
           desc.toLowerCase().startsWith(q);
  });

  if (matches.length === 0) {
    results.innerHTML = '<p style="color:var(--grey-dark); font-size:13px; text-align:center; padding:20px;">No results found</p>';
    return;
  }

  results.innerHTML = matches.map(p => {
    const brandHtml = p.brand ? '<span style="color:var(--orange); font-weight:700; cursor:pointer;" onclick="event.stopPropagation(); doSearch(\'' + p.brand.replace(/'/g, "\\'") + '\'); document.getElementById(\'search-input\').value=\'' + p.brand.replace(/'/g, "\\'") + '\'; setSearchMode(\'brand\');">\ud83c\udff7\ufe0f ' + p.brand + '</span>' : '';
    
    return '<div style="padding:10px; border-bottom:1px solid var(--grey-light); cursor:pointer;" onclick="closeModal(\'search-modal\'); document.getElementById(\'promo-' + p.id + '\').scrollIntoView({behavior:\'smooth\'}); document.getElementById(\'promo-' + p.id + '\').classList.add(\'open\');">' +
      '<div style="font-size:14px; font-weight:600;">' + p.title + '</div>' +
      '<div style="font-size:12px; color:var(--grey-dark);">' +
        p.category + ' \u00b7 ' + p.businessName + ' \u00b7 P' + (p.price || 0).toFixed(2) +
        (brandHtml ? '<br>' + brandHtml : '') +
      '</div>' +
    '</div>';
  }).join('');
}

/* ─── CATEGORY FILTER SHEET ─── */
function openCategorySheet() {
  var cats = window.FOROMANE_PRODUCT_CATEGORIES && window.FOROMANE_PRODUCT_CATEGORIES.categories;
  var body = document.getElementById('category-sheet-body');
  if (!body) return;
  if (!cats || cats.length === 0) {
    body.innerHTML = '<p style="padding:20px;text-align:center;color:var(--grey-dark);font-size:13px;">No categories available</p>';
    openModal('category-modal');
    return;
  }
  var html = '<div style="padding:14px 16px;border-bottom:1px solid var(--grey-light);cursor:pointer;font-size:15px;font-weight:600;background:' + (selectedCategories.length === 0 ? 'var(--orange-light)' : 'transparent') + ';" onclick="toggleCategoryCheckbox(\'all\', \'All Services\', true)">' +
    '<input type="checkbox" ' + (selectedCategories.length === 0 ? 'checked' : '') + ' style="margin-right:10px;accent-color:var(--orange);">All Services' +
  '</div>';

  function renderItem(cat, level) {
    var indent = (level - 1) * 16;
    var checked = selectedCategories.some(function(s) { return s.id === cat.id; });
    var hasChildren = cat.children && cat.children.length > 0;
    var safeName = (cat.name || '').replace(/'/g, "\\'");
    var safeId = (cat.id || '').replace(/'/g, "\\'");
    var childId = 'cat-ch-' + (cat.slug || cat.id || cat.name).replace(/[^a-z0-9-]/gi, '');

    if (hasChildren) {
      var rowHtml = '<div style="padding:10px 16px;border-bottom:1px solid var(--grey-light);font-size:14px;cursor:pointer;padding-left:' + (indent + 16) + 'px;display:flex;align-items:center;" onclick="event.stopPropagation();toggleCategoryChildren(\'' + childId + '\')">' +
        '<input type="checkbox" ' + (checked ? 'checked' : '') + ' style="margin-right:8px;accent-color:var(--orange);" onclick="event.stopPropagation();toggleCategoryCheckbox(\'' + safeId + '\',\'' + safeName + '\',this.checked)">' + cat.name +
      '</div>';
      rowHtml += '<div id="' + childId + '" style="display:none;">';
      cat.children.forEach(function(child) { rowHtml += renderItem(child, level + 1); });
      rowHtml += '</div>';
      return rowHtml;
    }

    return '<div style="padding:10px 16px;border-bottom:1px solid var(--grey-light);font-size:14px;cursor:pointer;padding-left:' + (indent + 16) + 'px;display:flex;align-items:center;" onclick="toggleCategoryCheckbox(\'' + safeId + '\',\'' + safeName + '\',' + (!checked) + ')">' +
      '<input type="checkbox" ' + (checked ? 'checked' : '') + ' style="margin-right:8px;accent-color:var(--orange);" onclick="event.stopPropagation();toggleCategoryCheckbox(\'' + safeId + '\',\'' + safeName + '\',this.checked)">' + cat.name +
    '</div>';
  }

  cats.forEach(function(c) { html += renderItem(c, 1); });
  body.innerHTML = html;
  if (window._expandedInterestSubs) {
    window._expandedInterestSubs.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
  }
  openModal('category-modal');
}

function toggleCategoryCheckbox(id, name, isChecked) {
  if (id === 'all') {
    selectedCategories = [];
    openCategorySheet();
    return;
  }
  if (isChecked) {
    if (!selectedCategories.some(function(s) { return s.id === id; })) {
      selectedCategories.push({ id: id, name: name });
    }
  } else {
    selectedCategories = selectedCategories.filter(function(s) { return s.id !== id; });
  }
  openCategorySheet();
}

function updateCategoryFilterText() {
  var btn = document.getElementById('category-filter-btn');
  if (!btn) return;
  if (selectedCategories.length === 0) {
    btn.textContent = 'All Services';
  } else if (selectedCategories.length === 1) {
    btn.textContent = selectedCategories[0].name;
  } else {
    btn.textContent = '+' + selectedCategories.length + ' Categories';
  }
}

function applyCategoryFilter() {
  updateCategoryFilterText();
  closeModal('category-modal');
  if (typeof window.currentView !== 'undefined' && window.currentView === 'view-directory') {
    if (typeof renderDirectory === 'function') renderDirectory();
  } else {
    if (typeof renderPromos === 'function') renderPromos();
  }
}

/* ─── APPLY FILTERS (category + location + promo type) ─── */
function applyFilters() {
  var items = window._promos || [];

  if (selectedCategories.length > 0) {
    items = items.filter(function(p) {
      return selectedCategories.some(function(c) { return c.name === p.category; });
    });
  }

  if (selectedPlaceA !== 'Nation Wide') {
    items = items.filter(function(p) { return p.location === selectedPlaceA; });
  }

  if (promoTypeIdx > 0) {
    var type = promoTypes[promoTypeIdx];
    items = items.filter(function(p) { return p.promoType === type; });
  }

  return items;
}

window.applyFilters = applyFilters;

/* ─── LOCATION FILTER SHEET ─── */
function ensureLocationsLoaded() {
  if (window.locationData) return Promise.resolve(window.locationData);
  var data = window.LOCATIONS_DATA;
  if (!data) {
    showToast('Could not load location data');
    return Promise.resolve({ districts: [] });
  }
  window.locationData = data;
  locationData = data;
  return Promise.resolve(data);
}

function openLocationSheet(mode) {
  currentLocationMode = mode;
  var title = document.getElementById('location-modal-title');
  if (title) title.textContent = 'Select Location';
  renderLocationSheet();
  openModal('location-modal');
}

function renderLocationSheet() {
  var body = document.getElementById('location-sheet-body');
  if (!body) return;
  ensureLocationsLoaded().then(function(data) {
    var districts = data.districts || [];
    var html = '';
    html += '<style>';
    html += 'details > summary { list-style: none; }';
    html += 'details > summary::-webkit-details-marker { display: none; }';
    html += 'details[open] .loc-arrow { transform: rotate(180deg); }';
    html += '.loc-arrow { transition: transform 0.2s ease; }';
    html += '</style>';

    html += '<div style="margin:0 16px;border-bottom:1px solid var(--grey-light);"></div>';
    html += '<div onclick="selectNationWide()" style="padding:14px 16px;cursor:pointer;font-size:15px;display:flex;justify-content:space-between;align-items:center;' + (selectedPlaceA === 'Nation Wide' ? 'background:var(--orange-light);font-weight:600;color:var(--orange);' : '') + '">' +
      '<span>Nation Wide</span>' +
      (selectedPlaceA === 'Nation Wide' ? '<span><img src="assets/icons/solid/check-2_orange.webp" style="width:16px;height:16px;"></span>' : '') +
    '</div>';
    html += '<div style="margin:0 16px;border-bottom:1px solid var(--grey-light);"></div>';
    districts.forEach(function(d) {
      if (!d.towns || d.towns.length === 0) return;
      d.towns.forEach(function(t) {
        var town = t.name;
        var areas = t.areas || [];
        var areaCount = areas.length;
        var isSelected = selectedPlaceA === town;
        html += '<details style="padding:0 16px;">';
        html += '<summary style="padding:14px 0;cursor:pointer;font-size:15px;display:flex;justify-content:space-between;align-items:center;' + (isSelected ? 'background:var(--orange-light);font-weight:600;' : '') + '">' +
          '<span>' + town + '</span>' +
          '<span style="font-size:12px;color:var(--grey-dark);">' + areaCount + '</span>' +
        '</summary>';
        html += '<div style="padding-left:32px;">';
        html += '<div style="padding:10px 0;font-size:14px;cursor:pointer;font-weight:500;" onclick="selectTownArea(\'' + town.replace(/'/g, "\\'") + '\',\'All Area\')">All Area</div>';
        areas.forEach(function(a) {
          var areaSelected = selectedPlaceB === a;
          html += '<div style="margin:0 16px 0 48px;border-top:1px solid var(--grey-light);"></div>';
          html += '<div style="padding:10px 0;font-size:14px;cursor:pointer;' + (areaSelected ? 'background:var(--orange-light);font-weight:600;color:var(--orange);' : '') + '" onclick="selectTownArea(\'' + town.replace(/'/g, "\\'") + '\',\'' + a.replace(/'/g, "\\'") + '\')">' +
            a +
            (areaSelected ? ' <img src="assets/icons/solid/check-2_orange.webp" style="width:16px;height:16px;float:right;">' : '') +
          '</div>';
        });
        html += '</div>';
        html += '</details>';
        html += '<div style="margin:0 16px;border-top:1px solid var(--grey-light);"></div>';
      });
    });
    body.innerHTML = html;
  });
}

function selectTownArea(town, area) {
  if (currentLocationMode === 'placeA') {
    selectedPlaceA = town;
    document.getElementById('place-a-btn').textContent = town;
    var proBtn = document.getElementById('place-a-btn-pro');
    if (proBtn) proBtn.textContent = town;
    selectedPlaceB = area;
    var bBtn = document.getElementById('place-b-btn');
    if (bBtn) bBtn.textContent = area;
  } else {
    selectedPlaceB = area;
    var bBtn = document.getElementById('place-b-btn');
    if (bBtn) bBtn.textContent = area;
  }
  closeModal('location-modal');
  if (typeof renderPromos === 'function') renderPromos();
  if (typeof renderDirectory === 'function') renderDirectory();
}

function selectNationWide() {
  selectedPlaceA = 'Nation Wide';
  selectedPlaceB = 'All Area';
  document.getElementById('place-a-btn').textContent = 'Nation Wide';
  var proBtn = document.getElementById('place-a-btn-pro');
  if (proBtn) proBtn.textContent = 'Nation Wide';
  var bBtn = document.getElementById('place-b-btn');
  if (bBtn) bBtn.textContent = 'All Area';
  if (typeof renderPromos === 'function') renderPromos();
  if (typeof renderDirectory === 'function') renderDirectory();
}

ensureLocationsLoaded();
