/* ════════════════════════════════════════════════════════
   FOROMANE FILTERS - Filters bar, category & location sheets
   ════════════════════════════════════════════════════════
   Last rebuilt: 2026-05-26 */

let promoTypeIdx = 0;
const promoTypes = ['Buy New', 'Buy Used', 'To Rent', 'For Auction'];

let selectedCategories = []; // Multi-select array for categories
let userInterestsCollapsed = true; // User Interests collapsible state
let currentLocationMode = 'placeA';
let selectedPlaceA = 'Nation Wide';
let selectedPlaceB = 'All Area';
let locationData = null;
let currentCountry = 'botswana';

function openPromoTypeModal() {
  const container = document.getElementById('promo-type-options');
  const types = ['Buy New', 'Buy Used', 'To Rent', 'For Auction'];
  container.innerHTML = types.map(type => {
    const isSelected = type === promoTypes[promoTypeIdx];
    return `<div style="padding:14px 16px; border-bottom:1px solid var(--grey-light); font-size:15px; cursor:pointer; ${isSelected ? 'background:var(--orange-light); font-weight:600; color:var(--orange);' : ''}" onclick="selectPromoType('${type}')">${type}${isSelected ? ' <img src="assets/icons/solid/check-2_orange.webp" style="width:16px;height:16px;float:right;">' : ''}</div>`;
  }).join('');
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

window.setSearchMode = setSearchMode;
window.doSearch = doSearch;
window.confirmPriceFilter = confirmPriceFilter;
window.openPromoTypeModal = openPromoTypeModal;
window.openSearchModal = openSearchModal;
window.selectPromoType = selectPromoType;
window.renderBrandList = renderBrandList;
window.selectBrand = selectBrand;
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
window.openCountryPicker = openCountryPicker;
window.selectCountry = selectCountry;

let currentSearchMode = 'all';
let _brandSearchActive = false;

function setSearchMode(mode) {
  if (mode === 'az') {
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    if (input) input.style.display = 'none';
    if (results) {
      var letters = [];
      for (var i = 65; i <= 90; i++) letters.push(String.fromCharCode(i));
      letters.push('#');
      results.innerHTML = '<div class="az-grid">' +
        letters.map(function(l) {
          return '<button class="az-grid-btn" onclick="selectAlphaLetter(\'' + l + '\')">' + l + '</button>';
        }).join('') +
      '</div>';
      results.style.display = '';
    }
    var pills = document.querySelectorAll('#view-search .pill');
    pills.forEach(function(p) {
      p.classList.toggle('active', p.textContent.trim() === 'A-Z');
    });
    return;
  }
  var prevMode = currentSearchMode;
  currentSearchMode = mode;
  var pills = document.querySelectorAll('#view-search .pill');
  pills.forEach(function(p) {
    p.classList.toggle('active', p.textContent.toLowerCase() === mode);
  });

  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  if (!input || !results) return;

  input.style.display = '';
  results.style.display = '';

  if (mode === 'brand') {
    input.placeholder = 'Search brands...';
    input.value = '';
    _brandSearchActive = false;
    renderBrandList('');
  } else {
    input.placeholder = 'Search by name, brand, or store...';
    if (prevMode === 'brand' || _brandSearchActive) {
      input.value = '';
      _brandSearchActive = false;
    }
    doSearch(input.value);
  }
}

function selectAlphaLetter(letter) {
  goTo('view-directory');
  var tab = document.getElementById('nav-directory');
  if (tab) tab.click();
  setTimeout(function() { scrollToAlpha(letter); }, 200);
}
window.selectAlphaLetter = selectAlphaLetter;

function openSearchModal() {
  currentSearchMode = 'all';
  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  if (input) input.value = '';
  if (results) results.innerHTML = '';
  if (input) input.style.display = '';
  if (results) results.style.display = '';

  var pills = document.querySelectorAll('#view-search .pill');
  pills.forEach(function(p) { p.classList.remove('active'); });
  var allPill = pills[0];
  if (allPill) allPill.classList.add('active');

  goTo('view-search');
  if (input) setTimeout(function() { input.focus(); }, 200);
}

function renderBrandList(filterText) {
  var results = document.getElementById('search-results');
  if (!results) return;
  var brands = (window.ITEM_BRANDS && window.ITEM_BRANDS.brands) || [];
  var q = (filterText || '').toLowerCase().trim();
  var filtered = q ? brands.filter(function(b) { return b.name.toLowerCase().indexOf(q) !== -1; }) : brands;
  filtered.sort(function(a, b) { return a.name.localeCompare(b.name); });

  if (filtered.length === 0) {
    results.innerHTML = '<p style="color:var(--grey-dark);font-size:13px;text-align:center;padding:20px;">No brands found</p>';
    return;
  }

  var promos = window._promos || [];
  var promoCounts = {};
  promos.forEach(function(p) { if (p.brand) { var k = p.brand.toLowerCase().trim(); promoCounts[k] = (promoCounts[k] || 0) + 1; } });

  results.innerHTML = filtered.map(function(b) {
    var k = b.name.toLowerCase();
    var count = promoCounts[k] || 0;
    var nameEsc = b.name.replace(/'/g, "\\'");
    return '<div style="padding:12px 10px;border-bottom:1px solid var(--grey-light);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="selectBrand(\'' + nameEsc + '\')">' +
      '<span style="font-weight:600;font-size:18px;">' + b.name + '</span>' +
      '<span style="color:var(--orange);font-size:12px;font-weight:600;">' + count + '</span>' +
    '</div>';
  }).join('');
}

function selectBrand(brandName) {
  var input = document.getElementById('search-input');
  if (input) {
    input.value = brandName;
    input.placeholder = 'Search by name, brand, or store...';
  }
  _brandSearchActive = true;
  currentSearchMode = 'brand';
  doSearch(brandName);
}

function doSearch(query) {
  var results = document.getElementById('search-results');
  if (!results) return;

  if (currentSearchMode === 'brand') {
    if (!_brandSearchActive) {
      renderBrandList(query);
      return;
    }
    if (!query || !query.trim()) {
      _brandSearchActive = false;
      renderBrandList('');
      return;
    }
  }

  var minVal = parseFloat(document.getElementById('price-min') ? document.getElementById('price-min').value : '') || 0;
  var maxVal = parseFloat(document.getElementById('price-max') ? document.getElementById('price-max').value : '') || Infinity;

  if (!query || query.trim() === '') {
    if (minVal > 0 || maxVal < Infinity) {
      query = ''; // allow price-only filtering
    } else {
      results.innerHTML = '<p style="color:var(--grey-dark);font-size:13px;text-align:center;padding:20px;">Type to search promos...</p>';
      return;
    }
  }
  var q = query.toLowerCase();
  var pool = window._promos || [];
  var matches = pool.filter(function(p) {
    var price = p.price || 0;
    var inPriceRange = price >= minVal && price <= maxVal;
    if (!inPriceRange) return false;

    if (!q) return true; // price-only filter

    var brand = p.brand || '';
    var title = p.title || '';
    var bizName = p.businessName || '';
    var cat = p.category || '';
    var desc = p.desc || '';

    if (currentSearchMode === 'brand') return brand.toLowerCase().indexOf(q) !== -1;
    if (currentSearchMode === 'business') return bizName.toLowerCase().indexOf(q) !== -1;

    return title.toLowerCase().indexOf(q) !== -1 ||
           brand.toLowerCase().indexOf(q) !== -1 ||
           bizName.toLowerCase().indexOf(q) !== -1 ||
           cat.toLowerCase().indexOf(q) !== -1 ||
           desc.toLowerCase().indexOf(q) !== -1;
  });

  if (matches.length === 0) {
    results.innerHTML = '<p style="color:var(--grey-dark);font-size:13px;text-align:center;padding:20px;">No results found</p>';
    return;
  }

  results.innerHTML = matches.map(function(p) {
    var brandHtml = p.brand ? '<span style="color:var(--orange);font-weight:700;cursor:pointer;" onclick="event.stopPropagation();doSearch(\'' + p.brand.replace(/'/g, "\\'") + '\');document.getElementById(\'search-input\').value=\'' + p.brand.replace(/'/g, "\\'") + '\';setSearchMode(\'brand\');">\ud83c\udff7\ufe0f ' + p.brand + '</span>' : '';

    return '<div style="padding:10px;border-bottom:1px solid var(--grey-light);cursor:pointer;" onclick="goTo(\'view-promos\');setTimeout(function(){var el=document.getElementById(\'promo-' + p.id + '\');if(el){el.scrollIntoView({behavior:\'smooth\'});el.classList.add(\'open\');}},200);">' +
      '<div style="font-size:14px;font-weight:600;">' + p.title + '</div>' +
      '<div style="font-size:12px;color:var(--grey-dark);">' +
        p.category + ' \u00b7 ' + p.businessName + ' \u00b7 P' + (p.price || 0).toFixed(2) +
        (brandHtml ? '<br>' + brandHtml : '') +
      '</div>' +
    '</div>';
  }).join('');
}

function confirmPriceFilter() {
  var minVal = document.getElementById('price-min') ? document.getElementById('price-min').value || '0' : '0';
  var maxVal = document.getElementById('price-max') ? document.getElementById('price-max').value || 'Any' : 'Any';
  showToast('Price filter: P' + minVal + ' \u2013 P' + maxVal);
  doSearch(document.getElementById('search-input') ? document.getElementById('search-input').value : '');
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
  body.innerHTML = '<div style="padding:14px 16px;border-bottom:1px solid var(--grey-light);cursor:pointer;font-size:15px;font-weight:600;background:' + (selectedCategories.length === 0 ? 'var(--orange-light)' : 'transparent') + ';" onclick="toggleCategoryCheckbox(\'all\', \'All Services\', true)">' +
    '<input type="checkbox" ' + (selectedCategories.length === 0 ? 'checked' : '') + ' style="margin-right:10px;accent-color:var(--orange);">All Services' +
  '</div>';
  cats.forEach(function(c) {
    var checked = selectedCategories.some(function(s) { return s.id === c.id; });
    body.innerHTML += '<div style="padding:10px 16px;border-bottom:1px solid var(--grey-light);font-size:14px;cursor:pointer;" onclick="toggleCategoryCheckbox(\'' + c.id + '\',\'' + c.name.replace(/'/g, "\\'") + '\',' + (!checked) + ')">' +
      '<input type="checkbox" ' + (checked ? 'checked' : '') + ' style="margin-right:10px;accent-color:var(--orange);" onclick="event.stopPropagation(); toggleCategoryCheckbox(\'' + c.id + '\',\'' + c.name.replace(/'/g, "\\'") + '\',this.checked)">' + c.name +
    '</div>';
  });
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
  if (currentCountry === 'zimbabwe') return [];
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

/* ─── COUNTRY PICKER ─── */
function selectCountry(country) {
  currentCountry = country;
  localStorage.setItem('foromane_country', country);
  window.locationData = null;
  locationData = null;
  var flag = document.getElementById('country-flag');
  if (flag) {
    flag.src = 'assets/icons/circle-flag-of-' + country + '.webp';
  }
  closeModal('country-picker-modal');
  selectedPlaceA = 'Nation Wide';
  selectedPlaceB = 'All Area';
  var btn = document.getElementById('place-a-btn');
  if (btn) btn.textContent = 'Nation Wide';
  var proBtn = document.getElementById('place-a-btn-pro');
  if (proBtn) proBtn.textContent = 'Nation Wide';
  var bBtn = document.getElementById('place-b-btn');
  if (bBtn) bBtn.textContent = 'All Area';
  if (typeof renderPromos === 'function') renderPromos();
  if (typeof renderDirectory === 'function') renderDirectory();
}

function openCountryPicker() {
  var existing = document.getElementById('country-picker-modal');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'country-picker-modal';
  overlay.innerHTML =
    '<div class="modal-sheet" style="max-width:320px;margin:auto;">' +
      '<div class="modal-header">' +
        '<span class="modal-title">Select Country</span>' +
        '<button class="modal-close" onclick="closeModal(\'country-picker-modal\')"><img src="assets/icons/solid/xmark_orange.webp" style="width:18px;height:18px;display:block;"></button>' +
      '</div>' +
      '<div class="modal-body" style="padding:8px 0;">' +
        '<div onclick="selectCountry(\'botswana\')" style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;border-bottom:1px solid var(--grey-light);' + (currentCountry === 'botswana' ? 'background:var(--orange-light);font-weight:600;' : '') + '">' +
          '<img src="assets/icons/circle-flag-of-botswana.webp" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">' +
          '<span>Botswana</span>' +
          (currentCountry === 'botswana' ? ' <span style="margin-left:auto;color:var(--orange);">\u2713</span>' : '') +
        '</div>' +
        '<div onclick="selectCountry(\'zimbabwe\')" style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;' + (currentCountry === 'zimbabwe' ? 'background:var(--orange-light);font-weight:600;' : '') + '">' +
          '<img src="assets/icons/circle-flag-of-zimbabwe.webp" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">' +
          '<span>Zimbabwe</span>' +
          (currentCountry === 'zimbabwe' ? ' <span style="margin-left:auto;color:var(--orange);">\u2713</span>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  openModal('country-picker-modal');
}

/* ─── LOCATION FILTER SHEET ─── */
function ensureLocationsLoaded() {
  if (window.locationData) return Promise.resolve(window.locationData);
  if (currentCountry === 'zimbabwe') {
    if (window.ZIMBABWE_LOCATIONS_DATA) {
      window.locationData = window.ZIMBABWE_LOCATIONS_DATA;
      locationData = window.ZIMBABWE_LOCATIONS_DATA;
      return Promise.resolve(window.locationData);
    }
    return fetch('zimbabwe_locations.json').then(function(r) { return r.json(); }).then(function(d) {
      window.locationData = d;
      locationData = d;
      return d;
    }).catch(function() {
      showToast('Could not load Zimbabwe locations');
      return { districts: [] };
    });
  }
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
    html += 'details[open] > summary { color: var(--orange); font-weight: 600; }';
    html += 'details[open] > summary .loc-count { color: var(--orange) !important; }';
    html += 'details:not([open]) > summary { color: inherit; font-weight: normal; }';
    html += 'details:not([open]) > summary .loc-count { color: var(--grey-dark); }';
    html += '</style>';

    html += '<div style="margin:0 16px;border-bottom:1px solid var(--grey-light);"></div>';
    var displayTowns = [];
    if (currentCountry === 'zimbabwe') {
      var pinnedCities = ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Kwekwe', 'Kadoma', 'Chinhoyi', 'Masvingo', 'Marondera'];
      districts.forEach(function(d) {
        if (!d.towns || d.towns.length === 0) return;
        d.towns.forEach(function(t) {
          displayTowns.push({ name: t.name, areas: t.areas || [] });
        });
      });
      var pinned = [], rest = [];
      displayTowns.forEach(function(t) {
        if (pinnedCities.indexOf(t.name) !== -1) pinned.push(t);
        else rest.push(t);
      });
      pinned.sort(function(a, b) { return pinnedCities.indexOf(a.name) - pinnedCities.indexOf(b.name); });
      rest.sort(function(a, b) { return a.name.localeCompare(b.name); });
      displayTowns = pinned.concat(rest);
    } else {
      districts.forEach(function(d) {
        if (!d.towns || d.towns.length === 0) return;
        d.towns.forEach(function(t) {
          displayTowns.push({ name: t.name, areas: t.areas || [] });
        });
      });
    }
    displayTowns.forEach(function(t) {
      var town = t.name;
      var areas = t.areas || [];
      var areaCount = areas.length;
      var isSelected = selectedPlaceA === town;
      html += '<details style="padding:0 16px;">';
      html += '<summary style="padding:14px 0;cursor:pointer;font-size:15px;display:flex;justify-content:space-between;align-items:center;' + (isSelected ? 'background:var(--orange-light);font-weight:600;' : '') + '">' +
        '<span>' + town + '</span>' +
        '<span class="loc-count" style="font-size:12px;color:var(--grey-dark);">' + areaCount + '</span>' +
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
// Always start on Botswana regardless of previous selection
(function initFlag() {
  var flag = document.getElementById('country-flag');
  if (flag) flag.src = 'assets/icons/circle-flag-of-botswana.webp';
  window.locationData = null;
  locationData = null;
})();
