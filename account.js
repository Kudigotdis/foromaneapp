/* ════════════════════════════════════════════════════════
   FOROMANE ACCOUNT - Personal details, contacts, location, interests, favourites
   ════════════════════════════════════════════════════════ */

let _pendingEdit = null;
window._regModeInterests = false;

function genId() {
  return '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function toggleSubAcc(header) {
  var parent = header.parentElement;
  var container = parent.parentElement;
  var siblings = container.children;
  for (var i = 0; i < siblings.length; i++) {
    if (siblings[i] !== parent && siblings[i].classList) {
      siblings[i].classList.remove('open');
    }
  }
  parent.classList.toggle('open');
}

// ─── NATIONALITIES DATA ───
var NATIONALITIES_DATA = [
  {"country": "Afghanistan", "nationality": "Afghan"}, {"country": "Albania", "nationality": "Albanian"}, {"country": "Algeria", "nationality": "Algerian"}, {"country": "Andorra", "nationality": "Andorran"}, {"country": "Angola", "nationality": "Angolan"},
  {"country": "Antigua and Barbuda", "nationality": "Antiguan, Barbudan"}, {"country": "Argentina", "nationality": "Argentine"}, {"country": "Armenia", "nationality": "Armenian"}, {"country": "Australia", "nationality": "Australian"}, {"country": "Austria", "nationality": "Austrian"},
  {"country": "Azerbaijan", "nationality": "Azerbaijani"}, {"country": "Bahamas", "nationality": "Bahamian"}, {"country": "Bahrain", "nationality": "Bahraini"}, {"country": "Bangladesh", "nationality": "Bangladeshi"}, {"country": "Barbados", "nationality": "Barbadian"},
  {"country": "Belarus", "nationality": "Belarusian"}, {"country": "Belgium", "nationality": "Belgian"}, {"country": "Belize", "nationality": "Belizean"}, {"country": "Benin", "nationality": "Beninese"}, {"country": "Bhutan", "nationality": "Bhutanese"},
  {"country": "Bolivia", "nationality": "Bolivian"}, {"country": "Bosnia and Herzegovina", "nationality": "Bosnian, Herzegovinian"}, {"country": "Botswana", "nationality": "Motswana (Botswanan)"}, {"country": "Brazil", "nationality": "Brazilian"}, {"country": "Brunei", "nationality": "Bruneian"},
  {"country": "Bulgaria", "nationality": "Bulgarian"}, {"country": "Burkina Faso", "nationality": "Burkinab\u00e9"}, {"country": "Burundi", "nationality": "Burundian"}, {"country": "Cabo Verde", "nationality": "Cabo Verdean"}, {"country": "Cambodia", "nationality": "Cambodian"},
  {"country": "Cameroon", "nationality": "Cameroonian"}, {"country": "Canada", "nationality": "Canadian"}, {"country": "Central African Republic", "nationality": "Central African"}, {"country": "Chad", "nationality": "Chadian"}, {"country": "Chile", "nationality": "Chilean"},
  {"country": "China", "nationality": "Chinese"}, {"country": "Colombia", "nationality": "Colombian"}, {"country": "Comoros", "nationality": "Comoran"}, {"country": "Congo (Congo-Brazzaville)", "nationality": "Congolese"}, {"country": "Costa Rica", "nationality": "Costa Rican"},
  {"country": "Croatia", "nationality": "Croatian"}, {"country": "Cuba", "nationality": "Cuban"}, {"country": "Cyprus", "nationality": "Cypriot"}, {"country": "Czechia (Czech Republic)", "nationality": "Czech"}, {"country": "Democratic Republic of the Congo", "nationality": "Congolese"},
  {"country": "Denmark", "nationality": "Danish"}, {"country": "Djibouti", "nationality": "Djiboutian"}, {"country": "Dominica", "nationality": "Dominican"}, {"country": "Dominican Republic", "nationality": "Dominican"}, {"country": "Ecuador", "nationality": "Ecuadorian"},
  {"country": "Egypt", "nationality": "Egyptian"}, {"country": "El Salvador", "nationality": "Salvadoran"}, {"country": "Equatorial Guinea", "nationality": "Equatoguinean"}, {"country": "Eritrea", "nationality": "Eritrean"}, {"country": "Estonia", "nationality": "Estonian"},
  {"country": "Eswatini (fmr. Swaziland)", "nationality": "Swazi"}, {"country": "Ethiopia", "nationality": "Ethiopian"}, {"country": "Fiji", "nationality": "Fijian"}, {"country": "Finland", "nationality": "Finnish"}, {"country": "France", "nationality": "French"},
  {"country": "Gabon", "nationality": "Gabonese"}, {"country": "Gambia", "nationality": "Gambian"}, {"country": "Georgia", "nationality": "Georgian"}, {"country": "Germany", "nationality": "German"}, {"country": "Ghana", "nationality": "Ghanaian"},
  {"country": "Greece", "nationality": "Greek"}, {"country": "Grenada", "nationality": "Grenadian"}, {"country": "Guatemala", "nationality": "Guatemalan"}, {"country": "Guinea", "nationality": "Guinean"}, {"country": "Guinea-Bissau", "nationality": "Bissau-Guinean"},
  {"country": "Guyana", "nationality": "Guyanese"}, {"country": "Haiti", "nationality": "Haitian"}, {"country": "Honduras", "nationality": "Honduran"}, {"country": "Hungary", "nationality": "Hungarian"}, {"country": "Iceland", "nationality": "Icelandic"},
  {"country": "India", "nationality": "Indian"}, {"country": "Indonesia", "nationality": "Indonesian"}, {"country": "Iran", "nationality": "Iranian"}, {"country": "Iraq", "nationality": "Iraqi"}, {"country": "Ireland", "nationality": "Irish"},
  {"country": "Israel", "nationality": "Israeli"}, {"country": "Italy", "nationality": "Italian"}, {"country": "Jamaica", "nationality": "Jamaican"}, {"country": "Japan", "nationality": "Japanese"}, {"country": "Jordan", "nationality": "Jordanian"},
  {"country": "Kazakhstan", "nationality": "Kazakhstani"}, {"country": "Kenya", "nationality": "Kenyan"}, {"country": "Kiribati", "nationality": "I-Kiribati"}, {"country": "Kuwait", "nationality": "Kuwaiti"}, {"country": "Kyrgyzstan", "nationality": "Kyrgyzstani"},
  {"country": "Laos", "nationality": "Lao"}, {"country": "Latvia", "nationality": "Latvian"}, {"country": "Lebanon", "nationality": "Lebanese"}, {"country": "Lesotho", "nationality": "Mosotho (Lesothan)"}, {"country": "Liberia", "nationality": "Liberian"},
  {"country": "Libya", "nationality": "Libyan"}, {"country": "Liechtenstein", "nationality": "Liechtensteiner"}, {"country": "Lithuania", "nationality": "Lithuanian"}, {"country": "Luxembourg", "nationality": "Luxembourgish"}, {"country": "Madagascar", "nationality": "Malagasy"},
  {"country": "Malawi", "nationality": "Malawian"}, {"country": "Malaysia", "nationality": "Malaysian"}, {"country": "Maldives", "nationality": "Maldivian"}, {"country": "Mali", "nationality": "Malian"}, {"country": "Malta", "nationality": "Maltese"},
  {"country": "Marshall Islands", "nationality": "Marshallese"}, {"country": "Mauritania", "nationality": "Mauritanian"}, {"country": "Mauritius", "nationality": "Mauritian"}, {"country": "Mexico", "nationality": "Mexican"}, {"country": "Micronesia", "nationality": "Micronesian"},
  {"country": "Moldova", "nationality": "Moldovan"}, {"country": "Monaco", "nationality": "Monegasque"}, {"country": "Mongolia", "nationality": "Mongolian"}, {"country": "Montenegro", "nationality": "Montenegrin"}, {"country": "Morocco", "nationality": "Moroccan"},
  {"country": "Mozambique", "nationality": "Mozambican"}, {"country": "Myanmar (formerly Burma)", "nationality": "Burmese"}, {"country": "Namibia", "nationality": "Namibian"}, {"country": "Nauru", "nationality": "Nauruan"}, {"country": "Nepal", "nationality": "Nepali"},
  {"country": "Netherlands", "nationality": "Dutch"}, {"country": "New Zealand", "nationality": "New Zealander"}, {"country": "Nicaragua", "nationality": "Nicaraguan"}, {"country": "Niger", "nationality": "Nigerien"}, {"country": "Nigeria", "nationality": "Nigerian"},
  {"country": "North Korea", "nationality": "North Korean"}, {"country": "North Macedonia", "nationality": "Macedonian"}, {"country": "Norway", "nationality": "Norwegian"}, {"country": "Oman", "nationality": "Omani"}, {"country": "Pakistan", "nationality": "Pakistani"},
  {"country": "Palau", "nationality": "Palauan"}, {"country": "Palestine State", "nationality": "Palestinian"}, {"country": "Panama", "nationality": "Panamanian"}, {"country": "Papua New Guinea", "nationality": "Papua New Guinean"}, {"country": "Paraguay", "nationality": "Paraguayan"},
  {"country": "Peru", "nationality": "Peruvian"}, {"country": "Philippines", "nationality": "Filipino"}, {"country": "Poland", "nationality": "Polish"}, {"country": "Portugal", "nationality": "Portuguese"}, {"country": "Qatar", "nationality": "Qatari"},
  {"country": "Romania", "nationality": "Romanian"}, {"country": "Russia", "nationality": "Russian"}, {"country": "Rwanda", "nationality": "Rwandan"}, {"country": "Saint Kitts and Nevis", "nationality": "Kittitian or Nevisian"}, {"country": "Saint Lucia", "nationality": "Saint Lucian"},
  {"country": "Saint Vincent and the Grenadines", "nationality": "Saint Vincentian"}, {"country": "Samoa", "nationality": "Samoan"}, {"country": "San Marino", "nationality": "Sammarinese"}, {"country": "Sao Tome and Principe", "nationality": "Sao Tomean"}, {"country": "Saudi Arabia", "nationality": "Saudi"},
  {"country": "Senegal", "nationality": "Senegalese"}, {"country": "Serbia", "nationality": "Serbian"}, {"country": "Seychelles", "nationality": "Seychellois"}, {"country": "Sierra Leone", "nationality": "Sierra Leonean"}, {"country": "Singapore", "nationality": "Singaporean"},
  {"country": "Slovakia", "nationality": "Slovak"}, {"country": "Slovenia", "nationality": "Slovenian"}, {"country": "Solomon Islands", "nationality": "Solomon Islander"}, {"country": "Somalia", "nationality": "Somali"}, {"country": "South Africa", "nationality": "South African"},
  {"country": "South Korea", "nationality": "South Korean"}, {"country": "South Sudan", "nationality": "South Sudanese"}, {"country": "Spain", "nationality": "Spanish"}, {"country": "Sri Lanka", "nationality": "Sri Lankan"}, {"country": "Sudan", "nationality": "Sudanese"},
  {"country": "Suriname", "nationality": "Surinamese"}, {"country": "Sweden", "nationality": "Swedish"}, {"country": "Switzerland", "nationality": "Swiss"}, {"country": "Syria", "nationality": "Syrian"}, {"country": "Tajikistan", "nationality": "Tajikistani"},
  {"country": "Tanzania", "nationality": "Tanzanian"}, {"country": "Thailand", "nationality": "Thai"}, {"country": "Timor-Leste", "nationality": "Timorese"}, {"country": "Togo", "nationality": "Togolese"}, {"country": "Tonga", "nationality": "Tongan"},
  {"country": "Trinidad and Tobago", "nationality": "Trinidadian or Tobagonian"}, {"country": "Tunisia", "nationality": "Tunisian"}, {"country": "Turkey", "nationality": "Turkish"}, {"country": "Turkmenistan", "nationality": "Turkmen"}, {"country": "Tuvalu", "nationality": "Tuvaluan"},
  {"country": "Uganda", "nationality": "Ugandan"}, {"country": "Ukraine", "nationality": "Ukrainian"}, {"country": "United Arab Emirates", "nationality": "Emirati"}, {"country": "United Kingdom", "nationality": "British"}, {"country": "United States of America", "nationality": "American"},
  {"country": "Uruguay", "nationality": "Uruguayan"}, {"country": "Uzbekistan", "nationality": "Uzbekistani"}, {"country": "Vanuatu", "nationality": "Ni-Vanuatu"}, {"country": "Vatican City", "nationality": "Vatican"}, {"country": "Venezuela", "nationality": "Venezuelan"},
  {"country": "Vietnam", "nationality": "Vietnamese"}, {"country": "Yemen", "nationality": "Yemeni"}, {"country": "Zambia", "nationality": "Zambian"}, {"country": "Zimbabwe", "nationality": "Zimbabwean"}
];

// ─── PERSONAL DETAILS ───
function renderPersonalDetails() {
  const body = document.getElementById('personal-details-body');
  if (!body) return;
  body.innerHTML = renderIdentitySection() + renderContactSection() + renderLocationSection() + renderSocialSection() + renderCategoriesSection();
  populateTownDropdown();
  populateAreaDropdown(UserState.location.town || 'Gaborone');
}

function renderIdentitySection() {
  const s = UserState;
  var nationalityOptions = '';
  NATIONALITIES_DATA.forEach(function(item) {
    var sel = s.nationality === item.nationality ? 'selected' : '';
    nationalityOptions += '<option value="' + item.nationality.replace(/"/g,'&quot;') + '" ' + sel + '>' + item.country + ' (' + item.nationality + ')</option>';
  });
  return `<div class="sub-accordion" id="acct-identity">
    <div class="sub-accordion-header" onclick="toggleSubAcc(this)">Identity</div>
    <div class="sub-accordion-body" id="acct-identity-body">
      <div class="field-row">
        <input type="text" class="field-input" id="id-firstname" placeholder="First Name" value="${(s.firstName||'').replace(/"/g,'&quot;')}" oninput="updateIdentityField('firstName', this.value)">
      </div>
      <div class="field-row">
        <input type="text" class="field-input" id="id-surname" placeholder="Surname" value="${(s.surname||'').replace(/"/g,'&quot;')}" oninput="updateIdentityField('surname', this.value)">
      </div>
      <div class="field-row">
        <input type="text" class="field-input" id="id-username" placeholder="Username / Handle" value="${(s.username||'').replace(/"/g,'&quot;')}" onchange="updateIdentityField('username', this.value)">
      </div>
      <div class="field-row">
        <input type="date" class="field-input" id="id-dob" value="${(s.dateOfBirth||'').replace(/"/g,'&quot;')}" onchange="updateIdentityField('dateOfBirth', this.value)">
      </div>
      <div class="field-row">
        <div class="gender-toggle">
          <button class="gender-btn ${s.gender==='Male'?'active':''}" onclick="updateGender('Male')">Male</button>
          <button class="gender-btn ${s.gender==='Female'?'active':''}" onclick="updateGender('Female')">Female</button>
        </div>
      </div>
      <div class="field-row">
        <select class="field-input" id="id-nationality" onchange="updateIdentityField('nationality', this.value)">
          <option value="" disabled ${s.nationality?'':'selected'}>Select Nationality</option>
          ${nationalityOptions}
        </select>
      </div>
      <div class="field-row">
        <input type="text" class="field-input" id="id-race" placeholder="Race" value="${(s.race||'').replace(/"/g,'&quot;')}" onchange="updateIdentityField('race', this.value)">
      </div>
    </div>
  </div>`;
}

function renderLocationSection() {
  var townVal = (UserState.location.town||'Gaborone').replace(/"/g,'&quot;');
  var areaVal = (UserState.location.area||'').replace(/"/g,'&quot;');
  return `<div class="sub-accordion" id="acct-location">
    <div class="sub-accordion-header" onclick="toggleSubAcc(this)">Location</div>
    <div class="sub-accordion-body" id="acct-location-body">
      <div class="field-row" id="acct-loc-town-row" style="position:relative;">
          <input type="text" class="field-input" id="loc-town" placeholder="Town / Village / City" value="${townVal}" oninput="onTownInput(this.value)" onfocus="showDropdown('loc-town-dropdown')" onblur="setTimeout(function(){hideDropdown('loc-town-dropdown')},180)" autocomplete="off">
          <div class="custom-dropdown" id="loc-town-dropdown"></div>
        <div class="add-entry-btn" id="add-town-container" style="display:none;margin-top:4px;width:100%;" onclick="submitNewTown()">
          <i class="fas fa-plus-circle"></i> Add "<span id="add-town-name"></span>" to database
        </div>
      </div>
      <div class="field-row" id="acct-loc-area-row" style="position:relative;">
          <input type="text" class="field-input" id="loc-area" placeholder="Area / Neighbourhood" value="${areaVal}" oninput="onAreaInput(this.value)" onfocus="showDropdown('loc-area-dropdown')" onblur="setTimeout(function(){hideDropdown('loc-area-dropdown')},180)" autocomplete="off">
          <div class="custom-dropdown" id="loc-area-dropdown"></div>
        <div class="add-entry-btn" id="add-area-container" style="display:none;margin-top:4px;width:100%;" onclick="submitNewArea()">
          <i class="fas fa-plus-circle"></i> Add "<span id="add-area-name"></span>" to database
        </div>
      </div>
      <div class="field-row" id="acct-loc-gps-row">
        <input type="text" class="field-input" id="loc-gps" placeholder="Google GPS Link" value="${(UserState.location.gps||'').replace(/"/g,'&quot;')}" onchange="updateLocationField('gps', this.value)">
      </div>
      <div class="field-row" id="acct-loc-maps-row">
        <button class="add-entry-btn" onclick="openGpsMap()"><i class="fas fa-map-marked-alt"></i> Open in Google Maps</button>
      </div>
    </div>
  </div>`;
}

var regCountry = 'botswana';
window.submittedAreasCache = window.submittedAreasCache || [];
window.submittedTownsCache = window.submittedTownsCache || [];

function getLocationData() {
  return regCountry === 'zimbabwe'
    ? (window.ZIMBABWE_LOCATIONS_DATA || { districts: [] })
    : (window.LOCATIONS_DATA || { districts: [] });
}

function getMergedTowns() {
  var data = getLocationData();
  var towns = [];
  for (var d = 0; d < data.districts.length; d++) {
    var townList = data.districts[d].towns || [];
    for (var t = 0; t < townList.length; t++) {
      if (towns.indexOf(townList[t].name) === -1) towns.push(townList[t].name);
    }
  }
  for (var s = 0; s < window.submittedTownsCache.length; s++) {
    if (window.submittedTownsCache[s].country === regCountry) {
      if (towns.indexOf(window.submittedTownsCache[s].town) === -1) {
        towns.push(window.submittedTownsCache[s].town);
      }
    }
  }
  towns.sort();
  return towns;
}

function getMergedAreas(townName) {
  var data = getLocationData();
  var areas = [];
  for (var d = 0; d < data.districts.length; d++) {
    var towns = data.districts[d].towns || [];
    for (var t = 0; t < towns.length; t++) {
      if (towns[t].name === townName) {
        areas = (towns[t].areas || []).slice();
        break;
      }
    }
    if (areas.length) break;
  }
  for (var s = 0; s < window.submittedAreasCache.length; s++) {
    if (window.submittedAreasCache[s].country === regCountry && window.submittedAreasCache[s].town === townName) {
      if (areas.indexOf(window.submittedAreasCache[s].area) === -1) {
        areas.push(window.submittedAreasCache[s].area);
      }
    }
  }
  return areas;
}

// ─── Custom dropdown helpers ───

function showDropdown(id) {
  var el = document.getElementById(id);
  if (el && el.children.length > 0) el.classList.add('show');
}

function hideDropdown(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

function selectDropdownItem(inputId, dropdownId, value) {
  document.getElementById(inputId).value = value;
  hideDropdown(dropdownId);
  if (inputId === 'loc-town') {
    onTownChange(value);
    onTownInput(value);
  } else {
    onAreaChange(value);
    onAreaInput(value);
  }
  hideDropdown(dropdownId);
}

function renderDropdownItems(dropdownId, items, inputId, filter) {
  var el = document.getElementById(dropdownId);
  if (!el) return;
  var f = filter ? filter.toLowerCase() : '';
  var matched = items.filter(function(i) { return !f || i.toLowerCase().indexOf(f) !== -1; });
  if (matched.length === 0) { el.innerHTML = ''; el.classList.remove('show'); return; }
  el.innerHTML = matched.map(function(i) {
    return '<div class="custom-dropdown-item" onmousedown="event.preventDefault();selectDropdownItem(\'' + inputId + '\',\'' + dropdownId + '\',\'' + i.replace(/'/g,"\\'").replace(/"/g,'&quot;') + '\')">' + i.replace(/</g,'&lt;') + '</div>';
  }).join('');
  el.classList.add('show');
}

// ─── Country ───

function onCountryChange(country) {
  regCountry = country;
  populateTownDropdown();
  var townInput = document.getElementById('loc-town');
  var areaInput = document.getElementById('loc-area');
  if (townInput) townInput.value = '';
  if (areaInput) areaInput.value = '';
  var areaDd = document.getElementById('loc-area-dropdown');
  if (areaDd) areaDd.innerHTML = '';
  document.getElementById('add-town-container').style.display = 'none';
  document.getElementById('add-area-container').style.display = 'none';
}

// ─── Village / Town / City ───

function populateTownDropdown() {
  renderDropdownItems('loc-town-dropdown', getMergedTowns(), 'loc-town', '');
  hideDropdown('loc-town-dropdown');
}

function onTownInput(value) {
  renderDropdownItems('loc-town-dropdown', getMergedTowns(), 'loc-town', value);
  var container = document.getElementById('add-town-container');
  var nameSpan = document.getElementById('add-town-name');
  if (!container || !nameSpan) return;
  if (!value.trim()) { container.style.display = 'none'; return; }
  var merged = getMergedTowns();
  var exists = merged.some(function(t) { return t.toLowerCase() === value.trim().toLowerCase(); });
  if (exists) {
    container.style.display = 'none';
  } else {
    nameSpan.textContent = value.trim();
    container.style.display = 'block';
  }
}

function onTownChange(value) {
  var prev = UserState.location.town;
  if (value === prev) return;
  UserState.updateLocation('town', value);
  UserState.updateLocation('area', '');
  var areaInput = document.getElementById('loc-area');
  if (areaInput) areaInput.value = '';
  populateAreaDropdown(value);
  document.getElementById('add-town-container').style.display = 'none';
  document.getElementById('add-area-container').style.display = 'none';
}

function submitNewTown() {
  var nameSpan = document.getElementById('add-town-name');
  var townInput = document.getElementById('loc-town');
  if (!nameSpan || !townInput) return;
  var townName = nameSpan.textContent.trim();
  if (!townName) return;
  var merged = getMergedTowns();
  if (merged.indexOf(townName) !== -1) {
    document.getElementById('add-town-container').style.display = 'none';
    showToast('This town is already in the database');
    return;
  }
  window.submittedTownsCache.push({ country: regCountry, town: townName });
  townInput.value = townName;
  onTownChange(townName);
  document.getElementById('add-town-container').style.display = 'none';
  showToast('"' + townName + '" added to database');
  if (typeof window.submitAreaToFirestore === 'function') {
    window.submitAreaToFirestore(regCountry, townName, '');
  }
}

// ─── Area / Neighbourhood ───

function populateAreaDropdown(townName) {
  renderDropdownItems('loc-area-dropdown', getMergedAreas(townName), 'loc-area', '');
  hideDropdown('loc-area-dropdown');
}

function onAreaInput(value) {
  renderDropdownItems('loc-area-dropdown', getMergedAreas(document.getElementById('loc-town').value), 'loc-area', value);

  var container = document.getElementById('add-area-container');
  var nameSpan = document.getElementById('add-area-name');
  if (!container || !nameSpan) return;
  if (!value.trim()) { container.style.display = 'none'; return; }
  var dd = document.getElementById('loc-area-dropdown');
  var exists = false;
  if (dd) {
    for (var i = 0; i < dd.children.length; i++) {
      if (dd.children[i].textContent.toLowerCase() === value.trim().toLowerCase()) { exists = true; break; }
    }
  }
  if (exists) {
    container.style.display = 'none';
  } else {
    nameSpan.textContent = value.trim();
    container.style.display = 'block';
  }
}

function onAreaChange(value) {
  UserState.updateLocation('area', value);
}

function submitNewArea() {
  var nameSpan = document.getElementById('add-area-name');
  var areaInput = document.getElementById('loc-area');
  var townInput = document.getElementById('loc-town');
  if (!nameSpan || !areaInput || !townInput) return;
  var areaName = nameSpan.textContent.trim();
  var townName = townInput.value.trim();
  if (!areaName || !townName) return;
  var merged = getMergedAreas(townName);
  if (merged.indexOf(areaName) !== -1) {
    document.getElementById('add-area-container').style.display = 'none';
    showToast('This area is already in the database');
    return;
  }
  window.submittedAreasCache.push({ country: regCountry, town: townName, area: areaName });
  areaInput.value = areaName;
  onAreaChange(areaName);
  document.getElementById('add-area-container').style.display = 'none';
  showToast('"' + areaName + '" added to database');
  if (typeof window.submitAreaToFirestore === 'function') {
    window.submitAreaToFirestore(regCountry, townName, areaName);
  }
}

function renderContactSection() {
  return `<div class="sub-accordion" id="acct-contact">
    <div class="sub-accordion-header" onclick="toggleSubAcc(this)">Contact</div>
    <div class="sub-accordion-body" id="acct-contact-body">
      ${renderMobileEntries()}
      ${renderWhatsAppEntries()}
      ${renderWhatsAppVerificationSection()}
    </div>
  </div>`;
}

function renderSocialSection() {
  const s = UserState;
  const platforms = [
    {key:'facebook',    placeholder:'Facebook (username or URL)'},
    {key:'twitter',     placeholder:'Twitter / X'},
    {key:'instagram',   placeholder:'Instagram'},
    {key:'tiktok',      placeholder:'TikTok'},
    {key:'snapchat',    placeholder:'Snapchat'},
    {key:'youtube',     placeholder:'YouTube'},
    {key:'pinterest',   placeholder:'Pinterest'},
    {key:'linkedin',    placeholder:'LinkedIn'},
    {key:'telegram',    placeholder:'Telegram'},
  ];
  const html = platforms.map(p =>
    `<div class="field-row">
      <input type="text" class="field-input" id="social_${p.key}" placeholder="${p.placeholder}" value="${(s.contacts.social[p.key]||'').replace(/"/g,'&quot;')}" onchange="updateSocialField('${p.key}', this.value)">
    </div>`
  ).join('');
  return `<div class="sub-accordion" id="acct-social">
    <div class="sub-accordion-header" onclick="toggleSubAcc(this)">Social Media</div>
    <div class="sub-accordion-body" id="acct-social-body">${html}</div>
  </div>`;
}

function renderMobileEntries() {
  const mobiles = UserState.contacts.mobiles;
  let html = `<div class="sub-accordion" id="acct-mobile"><div class="sub-accordion-header" onclick="toggleSubAcc(this)">Mobile Numbers</div><div class="sub-accordion-body" id="acct-mobile-body">`;
  mobiles.forEach(m => {
    html += `<div class="contact-entry">
      <button class="star-btn ${m.isPrimary?'active':'inactive'}" onclick="setPrimaryMobile('${m.id}')">${m.isPrimary?'★':'☆'}</button>${m.isPrimary?' <span style="font-size:11px;color:var(--orange);font-weight:600;">Main Contact</span>':''}
      <label>Title</label><input value="${(m.title||'').replace(/"/g,'&quot;')}" onchange="updateMobileField('${m.id}','title',this.value)" placeholder="e.g. Primary, Work, Home">
      <label>Network</label><select onchange="updateMobileField('${m.id}','network',this.value)"><option value="BTC" ${m.network==='BTC'?'selected':''}>BTC</option><option value="Mascom" ${m.network==='Mascom'?'selected':''}>Mascom</option><option value="Orange" ${m.network==='Orange'?'selected':''}>Orange</option></select>
      <label>Number</label><input value="${(m.number||'').replace(/"/g,'&quot;')}" onchange="updateMobileField('${m.id}','number',this.value)" placeholder="71234567">
      <button class="remove-btn" onclick="removeMobileEntry('${m.id}')"><img src="assets/icons/solid/xmark_orange.webp" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"> Remove</button>
    </div>`;
  });
  html += `<button class="add-entry-btn" onclick="addMobileEntry()"><i class="fas fa-plus"></i> Add Mobile Number</button></div></div>`;
  return html;
}

function renderWhatsAppEntries() {
  const was = UserState.contacts.whatsapps;
  let html = `<div class="sub-accordion" id="acct-whatsapp"><div class="sub-accordion-header" onclick="toggleSubAcc(this)">WhatsApp Numbers</div><div class="sub-accordion-body" id="acct-whatsapp-body">`;
  was.forEach(w => {
    html += `<div class="contact-entry">
      <button class="star-btn ${w.isPrimary?'active':'inactive'}" onclick="setPrimaryWhatsApp('${w.id}')">${w.isPrimary?'★':'☆'}</button>${w.isPrimary?' <span style="font-size:11px;color:var(--orange);font-weight:600;">Main Contact</span>':''}
      <label>Title</label><input value="${(w.title||'').replace(/"/g,'&quot;')}" onchange="updateWhatsAppField('${w.id}','title',this.value)" placeholder="e.g. Primary, Work">
      <label>Country Code</label><input value="${(w.countryCode||'+267').replace(/"/g,'&quot;')}" onchange="updateWhatsAppField('${w.id}','countryCode',this.value)" placeholder="+267">
      <label>Number</label><input value="${(w.number||'').replace(/"/g,'&quot;')}" onchange="updateWhatsAppField('${w.id}','number',this.value)" placeholder="71234567">
      <button class="remove-btn" onclick="removeWhatsAppEntry('${w.id}')"><img src="assets/icons/solid/xmark_orange.webp" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"> Remove</button>
    </div>`;
  });
  html += `<button class="add-entry-btn" onclick="addWhatsAppEntry()"><i class="fas fa-plus"></i> Add WhatsApp Number</button></div></div>`;
  return html;
}

function getPrimaryWhatsAppNumber() {
  var was = UserState.contacts.whatsapps || [];
  var primary = was.find(function(w) { return w.isPrimary; }) || was[0];
  if (!primary || !primary.countryCode || !primary.number) return '';
  return (primary.countryCode + primary.number).trim();
}

function renderWhatsAppVerificationSection() {
  var phone = getPrimaryWhatsAppNumber();
  if (!phone) {
    return `<div style="padding:12px 0 0;font-size:16px;color:var(--grey-dark);">Add a WhatsApp number to enable WhatsApp sharing features.</div>`;
  }
  if (UserState.isVerified) {
    return `<div style="padding:12px 0 0;border-top:1px solid #f3f4f6;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;color:#16a34a;">✔</span>
        <div>
          <div style="font-size:14px;font-weight:700;color:#111;">WhatsApp Connected</div>
          <div style="font-size:12px;color:var(--grey-dark);">Your primary WhatsApp number is linked to your profile.</div>
        </div>
      </div>
    </div>`;
  }
  return `<div style="padding:12px 0 0;border-top:1px solid #f3f4f6;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <span style="font-size:18px;color:var(--orange);">📱</span>
        <div>
          <div style="font-size:14px;font-weight:700;color:#111;">WhatsApp Connected</div>
          <div style="font-size:12px;color:var(--grey-dark);">${phone.replace(/</g,'&lt;')}</div>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;padding-top:10px;border-top:1px solid #f3f4f6;">
        <button class="btn-outline btn-sm" onclick="window.open('https://wa.me/26771829765','_blank')">
          <i class="fab fa-whatsapp"></i> Contact Foromane
        </button>
      </div>
    </div>`;
}

function markUserAsVerified() {
  UserState.setVerified(true);
  if (window.ForomaneDB && window.ForomaneDB.db && UserState.id && UserState.id !== 'guest') {
    window.ForomaneDB.get('profiles', UserState.id).then(function(profile) {
      if (!profile) return;
      profile.verified = true;
      profile.verificationStatus = 'verified';
      window.ForomaneDB.put('profiles', profile).catch(function(err) { console.warn('Failed to persist local verification:', err); });
    }).catch(function(err) { console.warn('Failed to load profile for verification update:', err); });
  }
  if (typeof window.updateFirebaseUserVerification === 'function' && UserState.id && UserState.id !== 'guest') {
    window.updateFirebaseUserVerification(UserState.id, true).catch(function(err) {
      console.warn('Failed to update remote verification status:', err);
    });
  }
}

function renderCategoriesSection() {
  const cats = UserState.interests;
  const count = cats.length;
  const pills = cats.map(c => `<span class="category-pill">${c.replace(/"/g,'&quot;')}</span>`).join('');
  return `<div class="sub-accordion" id="acct-categories">
    <div class="sub-accordion-header" onclick="toggleSubAcc(this)">Categories</div>
    <div class="sub-accordion-body" id="acct-categories-body">
      <div style="color:var(--orange);font-size:14px;font-weight:600;padding:8px 0 4px;">${count} Selected</div>
      <div class="category-pills">${pills || '<span style="font-size:13px;color:var(--grey-dark);font-style:italic;">No categories selected</span>'}</div>
      <button style="width:100%;margin-top:8px;padding:10px;background:var(--orange);color:white;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;" onclick="window._regModeInterests=false;goTo('view-user-interests');renderInterestsPage();">Tap to manage categories</button>
    </div>
  </div>`;
}

function updateIdentityField(key, value) {
  UserState.updateIdentity(key, value);
  updateAccountHero();
}

function updateGender(val) {
  UserState.gender = val;
  UserState.updateIdentity('gender', val);
  localStorage.setItem('foromane_gender', val);
  var registerView = document.getElementById('view-register');
  if (registerView) {
    registerView.querySelectorAll('.gender-btn').forEach(function(b) {
      b.classList.toggle('active', b.textContent.trim() === val);
    });
  }
  var personalBody = document.getElementById('personal-details-body');
  if (personalBody) {
    personalBody.querySelectorAll('.gender-btn').forEach(function(b) {
      b.classList.toggle('active', b.textContent.trim() === val);
    });
  }
  updateRegTally();
}

function updateLocationField(key, value) {
  UserState.updateLocation(key, value);
}

function updateSocialField(platform, value) {
  UserState.updateSocial(platform, value);
}

// ─── Race multi-select ───
function initRaceChips() {
  var saved = UserState.race || localStorage.getItem('foromane_race') || '';
  var chips = document.querySelectorAll('#race-checkboxes .race-chip');
  chips.forEach(function(el) { el.classList.remove('active'); });
  var firstVal = saved ? saved.split(',')[0].trim() : '';
  chips.forEach(function(el) {
    if (el.textContent.trim() === firstVal) el.classList.add('active');
  });
  var otherInput = document.getElementById('id-race-other');
  if (otherInput) {
    if (firstVal === 'Other') {
      otherInput.style.display = 'block';
      var otherParts = saved.split(',').slice(1).join(',').trim();
      if (otherParts) otherInput.value = otherParts;
    } else {
      otherInput.style.display = 'none';
      otherInput.value = '';
    }
  }
}

function toggleRace(value, el) {
  var chips = document.querySelectorAll('#race-checkboxes .race-chip');
  var clicked = el || Array.from(chips).find(function(c) { return c.textContent.trim() === value; });
  if (!clicked) return;
  var wasActive = clicked.classList.contains('active');
  chips.forEach(function(c) { c.classList.remove('active'); });
  if (!wasActive) {
    clicked.classList.add('active');
  }
  var otherInput = document.getElementById('id-race-other');
  if (otherInput) {
    otherInput.style.display = (!wasActive && value === 'Other') ? 'block' : 'none';
    if (value !== 'Other' || wasActive) otherInput.value = '';
  }
  updateRaceFromChips();
  updateRegTally();
}

function updateRaceOther(val) {
  updateRaceFromChips();
}

function updateRaceFromChips() {
  var chips = document.querySelectorAll('#race-checkboxes .race-chip');
  var raceStr = '';
  chips.forEach(function(el) {
    if (el.classList.contains('active')) {
      var v = el.textContent.trim();
      if (v === 'Other') {
        var otherVal = document.getElementById('id-race-other')?.value.trim();
        raceStr = otherVal || 'Other';
      } else {
        raceStr = v;
      }
    }
  });
  updateIdentityField('race', raceStr);
}

// ─── Register modal: DOB dropdowns ───
function populateDobDropdowns() {
  var daySelect = document.getElementById('dob-day');
  var yearSelect = document.getElementById('dob-year');
  if (!daySelect || !yearSelect) return;
  if (daySelect.options.length > 1) return;
  for (var d = 1; d <= 31; d++) {
    var opt = document.createElement('option');
    opt.value = d.toString().padStart(2, '0');
    opt.textContent = opt.value;
    daySelect.appendChild(opt);
  }
  var cy = new Date().getFullYear();
  for (var y = cy - 12; y >= cy - 100; y--) {
    var opt2 = document.createElement('option');
    opt2.value = y.toString();
    opt2.textContent = y;
    yearSelect.appendChild(opt2);
  }
}
function syncDobToNative() {
  var d = document.getElementById('dob-day').value;
  var m = document.getElementById('dob-month').value;
  var y = document.getElementById('dob-year').value;
  var native = document.getElementById('id-dob');
  if (!native) return;
  if (d && m && y) {
    native.value = y + '-' + m + '-' + d;
    native.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// ─── Register modal: photo upload ───
function handleRegPhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('reg-photo-preview');
    const placeholder = document.getElementById('reg-photo-placeholder');
    preview.src = e.target.result;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
    updateRegTally();
  };
  reader.readAsDataURL(file);
}

// ─── Register modal: requirement tally ───
function updateRegTally() {
  const fields = {
    'Photo': !!document.getElementById('reg-photo-preview')?.src,
    'First Name': document.getElementById('id-firstname')?.value.trim(),
    'Surname': document.getElementById('id-surname')?.value.trim(),
    'Username': document.getElementById('id-username')?.value.trim(),
    'DOB': document.getElementById('id-dob')?.value,
    'Gender': UserState.gender,
    'Nationality': document.getElementById('id-nationality')?.value,
    'Race': (function(){ var c=document.querySelectorAll('#race-checkboxes .race-chip.active'); return c.length>0; })(),
    'Mobile': UserState.contacts.mobiles.length > 0,
    'WhatsApp': UserState.contacts.whatsapps.length > 0,
  };
  let done = 0, total = 0;
  for (const val of Object.values(fields)) {
    total++;
    if (val && val !== '') done++;
  }

  const btn = document.getElementById('reg-submit-btn');
  if (btn) {
    if (done === total) {
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    } else {
      btn.style.opacity = '0.4';
      btn.style.pointerEvents = 'none';
    }
  }
}

// ─── Register modal: mobile entries ───
function buildCountryCodeOptions(selected) {
  var opts = '<option value="">Country Code</option>';
  var codes = window.COUNTRY_CODES || {};
  var keys = Object.keys(codes).sort(function(a, b) {
    var na = a.replace(/[^0-9]/g, '');
    var nb = b.replace(/[^0-9]/g, '');
    return parseInt(na, 10) - parseInt(nb, 10);
  });
  keys.forEach(function(code) {
    var name = codes[code];
    var names = Array.isArray(name) ? name.join(', ') : name;
    opts += '<option value="' + code + '"' + (code === selected ? ' selected' : '') + '>' + code + ' (' + names + ')</option>';
  });
  return opts;
}

function renderRegMobileEntries() {
  const container = document.getElementById('reg-mobile-entries');
  if (!container) return;
  const mobiles = UserState.contacts.mobiles;
  let html = '';
  mobiles.forEach(m => {
    html += `<div class="contact-entry">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <button type="button" class="star-btn ${m.isPrimary?'active':'inactive'}" onclick="setPrimaryMobile('${m.id}');renderRegMobileEntries();updateRegTally();">
          <i class="fa-solid fa-star"></i> ${m.isPrimary?'Primary Line':'Set as Primary'}
        </button>
      </div>
      <div class="entry-field-stack">
        <select style="text-align:center;text-align-last:center;-webkit-appearance:none;-moz-appearance:none;appearance:none;" onchange="updateMobileField('${m.id}','countryCode',this.value);updateRegTally();">
          ${buildCountryCodeOptions(m.countryCode||'+267')}
        </select>
        <input type="tel" placeholder="Mobile Number" value="${(m.number||'').replace(/"/g,'&quot;')}" oninput="updateMobileField('${m.id}','number',this.value);updateRegTally();">
      </div>
    </div>`;
  });
  html += `<button class="add-entry-btn" onclick="addMobileEntry();renderRegMobileEntries();updateRegTally();"><i class="fa-solid fa-plus"></i> Add Mobile Number</button>`;
  container.innerHTML = html;
}

function renderRegWhatsAppEntries() {
  const container = document.getElementById('reg-whatsapp-entries');
  if (!container) return;
  const was = UserState.contacts.whatsapps;
  let html = '';
  was.forEach(w => {
    html += `<div class="contact-entry">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <button type="button" class="star-btn ${w.isPrimary?'active':'inactive'}" onclick="setPrimaryWhatsApp('${w.id}');renderRegWhatsAppEntries();updateRegTally();">
          <i class="fa-solid fa-star"></i> ${w.isPrimary?'Primary WhatsApp':'Set Primary'}
        </button>
      </div>
      <div class="entry-field-stack">
        <select style="text-align:center;text-align-last:center;-webkit-appearance:none;-moz-appearance:none;appearance:none;" onchange="updateWhatsAppField('${w.id}','countryCode',this.value);updateRegTally();">
          ${buildCountryCodeOptions(w.countryCode||'+267')}
        </select>
        <input type="tel" placeholder="WhatsApp Number" value="${(w.number||'').replace(/"/g,'&quot;')}" oninput="updateWhatsAppField('${w.id}','number',this.value);updateRegTally();">
      </div>
    </div>`;
  });
  html += `<button class="add-entry-btn" onclick="addWhatsAppEntry();renderRegWhatsAppEntries();updateRegTally();"><i class="fa-solid fa-plus"></i> Add WhatsApp Number</button>`;
  container.innerHTML = html;
}

function renderProAccountSection() {
  const s = UserState;
  const isPro = s.isTradesperson();
  const hasProListing = !!getClaimedProId(s.id);
  return `<div class="sub-accordion">
    <div class="sub-accordion-header pro-header" onclick="toggleSubAcc(this)">Pro Account</div>
    <div class="sub-accordion-body">
      <div style="padding:8px 0;">
        ${hasProListing
          ? '<div class="pro-card-header" style="display:flex;flex-direction:column;align-items:stretch;gap:8px;padding:10px 0;"><span style="font-size:13px;color:white;background:var(--green, #27ae60);font-weight:600;text-align:center;padding:12px;border-radius:4px;display:block;">Pro Account Active</span><button class="btn-outline btn-sm" onclick="goTo(\'view-pro-dashboard\')" style="text-align:center;">Manage</button></div>'
          : '<p style="font-size:13px;color:var(--grey-dark);margin-bottom:10px;">Activate your Pro account to get discovered by customers looking for your services.</p>' +
            '<button class="btn btn-sm" style="background:var(--orange);color:white;border:none;padding:10px 16px;border-radius:1px;cursor:pointer;width:100%;font-weight:600;" onclick="goTo(\'view-pro-dashboard\')"><i class="fas fa-user-tie"></i> Activate Pro Account</button>'
        }
      </div>
    </div>
  </div>`;
}

// ─── INLINE EDITING ───
function editField(el) {
  const field = el.dataset.field;
  const section = el.dataset.section || 'identity';
  const oldVal = el.dataset.value || '';
  const parent = el.parentNode;

  if (_pendingEdit) cancelField(_pendingEdit);

  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldVal;
  input.style.cssText = 'width:100%;margin:4px 0;padding:8px 10px;border:1px solid var(--orange);border-radius:6px;font-size:14px;box-sizing:border-box;background:white;';
  input.dataset.oldVal = oldVal;
  input.dataset.field = field;
  input.dataset.section = section;

  const restoreP = () => {
    const p = document.createElement('p');
    p.className = 'editable';
    p.style.cssText = 'padding:8px 0;margin:0;font-size:14px;cursor:pointer;';
    p.textContent = oldVal || '(tap to edit)';
    p.dataset.field = field;
    p.dataset.section = section;
    p.dataset.value = oldVal;
    p.onclick = () => editField(p);
    parent.replaceChild(p, input);
    _pendingEdit = null;
  };

  input.onblur = () => {
    const newVal = input.value.trim();
    if (newVal !== oldVal) {
      showInlineSave(parent, input, field, section, oldVal, newVal, restoreP);
    } else {
      restoreP();
    }
  };

  input.onkeydown = (e) => {
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') { restoreP(); showToast('Cancelled'); }
  };

  parent.replaceChild(input, el);
  _pendingEdit = { field, oldVal, restoreP };
  input.focus();
  input.select();
}

function showInlineSave(parent, input, field, section, oldVal, newVal, restoreP) {
  let bar = parent.querySelector('.save-bar');
  if (bar) bar.remove();

  bar = document.createElement('div');
  bar.className = 'save-bar';
  bar.innerHTML = `<span>✓ Save changes?</span><button class="save-btn" onclick="confirmField('${field}','${section}','${newVal.replace(/'/g,"\\'")}','${oldVal.replace(/'/g,"\\'")}',this)">Save</button><button class="cancel-btn" onclick="cancelField(this)">Cancel</button>`;
  parent.appendChild(bar);
}

/* ─── AGENT VERIFICATION PORTAL ─── */

function renderAgentPortal() {
  const s = UserState;
  const isAdmin = s.role === 'Administrator';
  
  if (!isAdmin) return ''; // Only admins can see the portal for now

  return `<div class="sub-accordion">
    <div class="sub-accordion-header" onclick="toggleSubAcc(this)">
      <div style="display:flex; align-items:center; gap:8px;">
         <span>🛠️</span> Foromane Agent Portal
      </div>
    </div>
    <div class="sub-accordion-body">
      <div style="padding:10px 0;">
        <label>Verify User Account</label>
        <div style="display:flex; gap:6px; margin-top:4px;">
          <input type="text" id="agent-user-search" placeholder="User ID or Phone" style="flex:1; font-size:12px;">
          <button class="btn-sm" style="background:var(--orange); color:white;" onclick="agentVerifyUser()">Verify</button>
        </div>
        <p style="font-size:10px; color:var(--grey-dark); margin-top:4px;">Scan user ID to unlock VIP features.</p>
      </div>
    </div>
  </div>`;
}

async function agentVerifyUser() {
  const input = document.getElementById('agent-user-search');
  const userId = input.value.trim();
  if (!userId) return showToast("Enter a User ID");

  showToast("Verifying user...");
  // In a real app, this would update Firestore. For now, we simulate success.
  setTimeout(() => {
    showToast("✅ User Verified Successfully!");
    input.value = "";
  }, 1000);
}

/* ─── SYNC TRIGGER ─── */

async function triggerPlatformSync() {
  if (!window.ForomaneMediaCache) return showToast("Sync Engine not ready");
  
  showToast("🔄 Starting Platform Sync...");
  try {
    await window.ForomaneMediaCache.syncFromManifest('manifest.json', (progress) => {
       console.log(`Sync Progress: ${progress}%`);
    });
    showToast("✅ Assets Synced Offline!");
  } catch (e) {
    showToast("❌ Sync Failed: " + e.message);
  }
}

function confirmField(field, section, newVal, oldVal, btn) {
  if (section === 'location') {
    UserState.updateLocation(field, newVal);
  } else if (section === 'social') {
    UserState.updateSocial(field, newVal);
  } else {
    UserState.updateIdentity(field, newVal);
    if (field === 'firstName' || field === 'surname') updateAccountHero();
  }

  const input = btn?.closest('.save-bar')?.previousElementSibling;
  if (input && input.tagName === 'INPUT') {
    const p = document.createElement('p');
    p.className = 'editable';
    p.style.cssText = 'padding:8px 0;margin:0;font-size:14px;cursor:pointer;';
    p.textContent = newVal || '(tap to edit)';
    p.dataset.field = field;
    p.dataset.section = section;
    p.dataset.value = newVal;
    p.onclick = () => editField(p);
    input.parentNode.replaceChild(p, input);
  }

  const bar = btn?.closest('.save-bar');
  if (bar) bar.remove();
  _pendingEdit = null;
  showToast('Saved!');
}

function cancelField(el) {
  const bar = el?.closest ? el.closest('.save-bar') : null;
  if (bar) {
    const input = bar.previousElementSibling;
    if (input && input.tagName === 'INPUT') {
      const p = document.createElement('p');
      p.className = 'editable';
      p.style.cssText = 'padding:8px 0;margin:0;font-size:14px;cursor:pointer;';
      p.textContent = input.dataset.oldVal || '(tap to edit)';
      p.dataset.field = input.dataset.field;
      p.dataset.section = input.dataset.section;
      p.dataset.value = input.dataset.oldVal;
      p.onclick = () => editField(p);
      input.parentNode.replaceChild(p, input);
    }
    bar.remove();
  }
  _pendingEdit = null;
}

// ─── DATE FIELD ───
function editDateField(el) {
  const field = el.dataset.field;
  const oldVal = el.dataset.value || '';
  const parent = el.parentNode;

  const input = document.createElement('input');
  input.type = 'date';
  input.value = oldVal;
  input.style.cssText = 'width:100%;margin:4px 0;padding:8px 10px;border:1px solid var(--orange);border-radius:6px;font-size:14px;box-sizing:border-box;background:white;';

  const restore = () => {
    const p = document.createElement('p');
    p.className = 'editable';
    p.style.cssText = 'padding:8px 0;margin:0;font-size:14px;cursor:pointer;';
    p.textContent = oldVal || '(tap to edit)';
    p.dataset.field = field;
    p.dataset.value = oldVal;
    p.onclick = () => editDateField(p);
    parent.replaceChild(p, input);
  };

  input.onchange = () => {
    const newVal = input.value;
    if (newVal !== oldVal) {
      UserState.updateIdentity(field, newVal);
      showToast('Saved!');
    }
    const p = document.createElement('p');
    p.className = 'editable';
    p.style.cssText = 'padding:8px 0;margin:0;font-size:14px;cursor:pointer;';
    p.textContent = newVal || '(tap to edit)';
    p.dataset.field = field;
    p.dataset.value = newVal;
    p.onclick = () => editDateField(p);
    parent.replaceChild(p, input);
  };

  input.onblur = () => {
    if (!input.value) { restore(); }
  };

  parent.replaceChild(input, el);
  input.focus();
  input.showPicker?.();
}

// ─── GENDER ───
function setGender(val) {
  UserState.updateIdentity('gender', val);
  const btns = document.querySelectorAll('.gender-toggle button');
  btns.forEach(b => b.classList.toggle('active', b.textContent === val));
  showToast('Saved!');
}

// ─── LOCATION TOWN (dropdown from LOCATIONS_DATA) ───
async function editLocationTown(el) {
  const oldVal = el.dataset.value || 'Gaborone';
  const parent = el.parentNode;

  // Ensure locations are loaded
  if (!window.LOCATIONS_DATA && !window.locationData) {
    await ensureLocationsLoaded();
  }
  const data = window.LOCATIONS_DATA || window.locationData || { districts: [] };
  const towns = new Set();
  data.districts.forEach(d => d.towns.forEach(t => towns.add(t.name)));
  const sorted = [...towns].sort();

  const select = document.createElement('select');
  select.style.cssText = 'width:100%;margin:4px 0;padding:8px 10px;border:1px solid var(--orange);border-radius:6px;font-size:14px;box-sizing:border-box;background:white;';
  sorted.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    if (t === oldVal) opt.selected = true;
    select.appendChild(opt);
  });

  const restore = () => {
    const p = document.createElement('p');
    p.className = 'editable';
    p.style.cssText = 'padding:8px 0;margin:0;font-size:14px;cursor:pointer;';
    p.textContent = oldVal;
    p.dataset.field = 'town';
    p.dataset.section = 'location';
    p.dataset.value = oldVal;
    p.onclick = () => editLocationTown(p);
    parent.replaceChild(p, select);
  };

  select.onchange = () => {
    const newVal = select.value;
    UserState.updateLocation('town', newVal);
    UserState.location.area = '';
    UserState._persistLocation();
    showToast('Saved!');
    renderPersonalDetails();
  };

  parent.replaceChild(select, el);
  select.focus();
}

// ─── LOCATION AREA (dependent dropdown) ───
async function editLocationArea(el) {
  const oldVal = el.dataset.value || '';
  const parent = el.parentNode;
  const selectedTown = UserState.location.town || 'Gaborone';

  if (!window.LOCATIONS_DATA && !window.locationData) {
    await ensureLocationsLoaded();
  }
  const data = window.LOCATIONS_DATA || window.locationData || { districts: [] };
  let areas = [];
  for (const d of data.districts) {
    const town = d.towns.find(t => t.name === selectedTown);
    if (town) { areas = town.areas || []; break; }
  }

  const select = document.createElement('select');
  select.style.cssText = 'width:100%;margin:4px 0;padding:8px 10px;border:1px solid var(--orange);border-radius:6px;font-size:14px;box-sizing:border-box;background:white;';
  const allOpt = document.createElement('option');
  allOpt.value = '';
  allOpt.textContent = 'All Area';
  if (!oldVal) allOpt.selected = true;
  select.appendChild(allOpt);
  areas.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    if (a === oldVal) opt.selected = true;
    select.appendChild(opt);
  });

  const restore = () => {
    const p = document.createElement('p');
    p.className = 'editable';
    p.style.cssText = 'padding:8px 0;margin:0;font-size:14px;cursor:pointer;';
    p.textContent = oldVal || '(tap to edit)';
    p.dataset.field = 'area';
    p.dataset.section = 'location';
    p.dataset.value = oldVal;
    p.onclick = () => editLocationArea(p);
    parent.replaceChild(p, select);
  };

  select.onchange = () => {
    const newVal = select.value;
    UserState.updateLocation('area', newVal);
    showToast('Saved!');
    renderPersonalDetails();
  };

  parent.replaceChild(select, el);
  select.focus();
}

function openGpsMap() {
  const town = UserState.location.town || 'Gaborone';
  const area = UserState.location.area || '';
  const q = encodeURIComponent([area, town, 'Botswana'].filter(Boolean).join(', '));
  window.open(`https://maps.google.com/maps?q=${q}`, '_blank');
}

// ─── CONTACT MANAGEMENT ───
function addMobileEntry() {
  const m = { id: genId(), title: '', network: 'BTC', countryCode: '+267', number: '', isPrimary: false };
  UserState.addMobile(m);
  renderPersonalDetails();
  document.querySelectorAll('.sub-accordion-header').forEach(h => {
    if (h.textContent.includes('Contact')) h.parentElement.classList.add('open');
    if (h.textContent.includes('Mobile Numbers')) h.parentElement.classList.add('open');
  });
}

function removeMobileEntry(id) {
  UserState.removeMobile(id);
  renderPersonalDetails();
  document.querySelectorAll('.sub-accordion-header').forEach(h => {
    if (h.textContent.includes('Contact')) h.parentElement.classList.add('open');
    if (h.textContent.includes('Mobile Numbers')) h.parentElement.classList.add('open');
  });
  showToast('Removed');
}

function setPrimaryMobile(id) {
  UserState.setPrimaryMobile(id);
  renderPersonalDetails();
  document.querySelectorAll('.sub-accordion-header').forEach(h => {
    if (h.textContent.includes('Contact')) h.parentElement.classList.add('open');
    if (h.textContent.includes('Mobile Numbers')) h.parentElement.classList.add('open');
  });
  showToast('Primary updated');
}

// ─── PAYMENT PROOF / PROMO REQUESTS ───
window._paymentProofPending = null;

function openPaymentProofModal(method, amount, purpose) {
  const modal = document.getElementById('payment-proof-modal');
  if (!modal) return;
  const instEl = document.getElementById('payment-proof-instructions');
  const methodNames = { BTC: 'BTC Smega', Mascom: 'Mascom Myzaka', Orange: 'Orange Money' };
  const displayMethod = methodNames[method] || method;
  const isMobile = ['BTC','Mascom','Orange'].includes(method);
  if (isMobile) {
    instEl.innerHTML = `Pay P${amount} via <strong>${displayMethod}</strong> for ${purpose}. After payment, upload a screenshot or send proof via WhatsApp.`;
  } else {
    instEl.innerHTML = `Pay P${amount} via bank transfer for ${purpose}.<br><strong>FNB Botswana &middot; Game City Branch</strong><br>Account Name: Foromane Investments<br><br>After payment, upload proof or send via WhatsApp.`;
  }
  openModal('payment-proof-modal');
  window._paymentProofPending = { method, amount: Number(amount), purpose };
}

function handleProofFileInput(files) {
  if (!files || files.length === 0) return;
  const f = files[0];
  const reader = new FileReader();
  reader.onload = e => {
    const imgData = e.target.result;
    const preview = document.getElementById('payment-proof-preview');
    preview.innerHTML = '';
    const img = document.createElement('img'); img.src = imgData; img.style.width = '140px'; img.style.height = '140px'; img.style.objectFit = 'cover'; img.style.borderRadius = '6px';
    preview.appendChild(img);
    window._paymentProofPending.image = imgData;
  };
  reader.readAsDataURL(f);
}

function sendPaymentWhatsApp() {
  if (!window._paymentProofPending) return showToast('No payment selected');
  const { method, amount, purpose } = window._paymentProofPending;
  const text = `I have paid P${amount} via ${method} for ${purpose}. User ID: ${UserState.id}`;
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  showToast('WhatsApp opened. Send proof message to Foromane.');
}

function submitPaymentProof() {
  if (!window._paymentProofPending) return showToast('No payment to submit');
  const payload = {
    id: genId(),
    userId: UserState.id,
    method: window._paymentProofPending.method,
    amount: window._paymentProofPending.amount,
    purpose: window._paymentProofPending.purpose,
    image: window._paymentProofPending.image || null,
    status: 'pending',
    createdAt: Date.now()
  };
  const reqs = JSON.parse(localStorage.getItem('foromane_payment_requests') || '[]');
  reqs.push(payload);
  localStorage.setItem('foromane_payment_requests', JSON.stringify(reqs));
  window._paymentProofPending = null;
  document.getElementById('payment-proof-preview').innerHTML = '';
  closeModal('payment-proof-modal');
  showToast('Payment proof submitted. Pending admin review.');
  // If admin view is open, refresh
  try { window.renderPromoRequestsList && window.renderPromoRequestsList(); } catch(e){}
}

function createPromoRequest(obj) {
  const reqs = JSON.parse(localStorage.getItem('foromane_promo_requests') || '[]');
  const payload = {
    id: obj.id || genId(),
    title: obj.title || '',
    desc: obj.desc || '',
    category: obj.category || 'General',
    amount: obj.cost || (obj.promo && obj.promo.cost) || 0,
    durationDays: (obj.promo && obj.promo.days) || obj.days || 3,
    userId: UserState.id,
    businessName: (UserState.business && UserState.business.name) || obj.businessName || 'Unknown',
    status: 'pending',
    createdAt: Date.now(),
    _promoPayload: obj
  };
  reqs.push(payload);
  localStorage.setItem('foromane_promo_requests', JSON.stringify(reqs));
  showToast('Promo request submitted. Pending admin review.');
}

function renderPromoRequestsList() {
  const container = document.getElementById('promo-requests-list');
  if (!container) return;
  const reqs = JSON.parse(localStorage.getItem('foromane_promo_requests') || '[]');
  const paymentReqs = JSON.parse(localStorage.getItem('foromane_payment_requests') || '[]');
  const all = reqs.concat(paymentReqs);

  const pendingCount = all.filter(r => r.status === 'pending').length;
  const totalEl = document.getElementById('count-total');
  const pendingEl = document.getElementById('count-pending');
  if (totalEl) totalEl.textContent = all.length;
  if (pendingEl) pendingEl.textContent = pendingCount;

  if (all.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--grey-dark);"><p style="font-size:14px;">No pending promo requests found.</p></div>';
    return;
  }

  container.innerHTML = all.map(r => {
    const date = new Date(r.createdAt).toLocaleDateString();
    const statusLabel = r.status.charAt(0).toUpperCase() + r.status.slice(1);
    const sc = {
      pending: { bg: '#fff8e1', color: '#ffa000' },
      approved: { bg: '#e8f5e9', color: '#2e7d32' },
      rejected: { bg: '#ffebee', color: '#f44336' }
    }[r.status] || { bg: '#f5f5f5', color: '#666' };
    const imgSrc = r.image || '';
    const category = r.purpose || r.method || 'Payment';
    const methodName = r.method || 'Bank Transfer';

    return '<div class="promo-card" style="background:white;border:1px solid var(--grey-light);border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 2px 4px rgba(0,0,0,0.02);">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">' +
        '<div>' +
          '<div style="font-weight:700;font-size:14px;color:#111;">User: ' + r.userId + '</div>' +
          '<div style="font-size:11px;color:var(--grey-dark);">' + date + '</div>' +
        '</div>' +
        '<span style="background:' + sc.bg + ';color:' + sc.color + ';font-size:10px;font-weight:800;padding:4px 8px;border-radius:6px;text-transform:uppercase;">' + statusLabel + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:12px;background:#f9f9f9;padding:10px;border-radius:8px;margin-bottom:12px;">' +
        (imgSrc ? '<img src="' + imgSrc + '" style="width:60px;height:60px;border-radius:6px;object-fit:cover;background:#eee;" loading="lazy" width="60" height="60">' : '<div style="width:60px;height:60px;border-radius:6px;background:#eee;display:flex;align-items:center;justify-content:center;font-size:20px;">\ud83d\udcc4</div>') +
        '<div style="flex:1;">' +
          '<div style="font-size:12px;font-weight:600;color:var(--grey-dark);margin-bottom:2px;">Category</div>' +
          '<div style="font-size:13px;color:#333;">' + category + '</div>' +
          '<div style="font-size:12px;margin-top:4px;color:var(--orange);font-weight:600;">Method: ' + methodName + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button class="btn" onclick="approveRequest(\'' + r.id + '\')" style="flex:2;font-size:12px;padding:10px;background:#4CAF50;">Approve</button>' +
        (imgSrc ? '<button class="btn-outline" onclick="viewProof(\'' + r.id + '\')" style="flex:1;font-size:12px;padding:10px;">View Proof</button>' : '') +
        '<button class="btn-outline" onclick="rejectRequestPrompt(\'' + r.id + '\')" style="flex:1;font-size:12px;padding:10px;color:#f44336;border-color:#ffebee;">Reject</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function markDriveRecordReviewed(id) {
  const key = 'foromane_drive_records_reviewed';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  if (!arr.includes(id)) arr.push(id);
  localStorage.setItem(key, JSON.stringify(arr));
  showToast('Marked as reviewed');
  renderPromoRequestsList();
}

function approveRequest(id) {
  const prs = JSON.parse(localStorage.getItem('foromane_promo_requests') || '[]');
  const pidx = prs.findIndex(p=>p.id===id);
  if (pidx !== -1) {
    prs[pidx].status = 'approved';
    localStorage.setItem('foromane_promo_requests', JSON.stringify(prs));
    // Push to promos feed
    pushToPromosFeed(prs[pidx]);
    showToast('Promo request approved');
    renderPromoRequestsList();
    return;
  }
  const pays = JSON.parse(localStorage.getItem('foromane_payment_requests') || '[]');
  const p2 = pays.findIndex(p=>p.id===id);
  if (p2 !== -1) {
    pays[p2].status = 'approved';
    localStorage.setItem('foromane_payment_requests', JSON.stringify(pays));
    showToast('Payment approved');
    renderPromoRequestsList();
    return;
  }
  showToast('Request not found');
}

function pushToPromosFeed(req) {
  const promos = window._promos || JSON.parse(localStorage.getItem('foromane_promos') || '[]');

  /* full promo payload from paid-request flow — use directly */
  if (req._promoPayload) {
    const promo = Object.assign({}, req._promoPayload);
    promo.promo = promo.promo || {};
    promo.promo.status = 'active';
    promo.promo.expiresAt = Date.now() + (promo.promo.days || 3) * 86400000;
    promos.push(promo);
    window._promos = promos;
    localStorage.setItem('foromane_promos', JSON.stringify(promos));
    return;
  }

  /* fallback: build minimal promo from request fields */
  const expiresAt = Date.now() + (req.durationDays || 3) * 86400000;
  const promo = {
    id: req.id || 'promo_' + Date.now(),
    title: req.title || req.purpose || 'Promoted Item',
    desc: req.desc || '',
    category: req.category || 'General',
    businessName: req.businessName || req.userId || 'Business',
    promo: {
      status: 'active',
      expiresAt: expiresAt,
      cost: req.amount || 0,
      durationDays: req.durationDays || 3
    },
    kpi: { views: 0, likes: 0, addedToNotes: 0 },
    createdAt: Date.now()
  };
  promos.push(promo);
  window._promos = promos;
  localStorage.setItem('foromane_promos', JSON.stringify(promos));
}

function rejectRequestPrompt(id) {
  const reason = prompt('Enter rejection reason:');
  if (!reason) return;
  rejectRequest(id, reason);
}

function rejectRequest(id, reason) {
  const prs = JSON.parse(localStorage.getItem('foromane_promo_requests') || '[]');
  const pidx = prs.findIndex(p=>p.id===id);
  if (pidx !== -1) { prs[pidx].status = 'rejected'; prs[pidx].reason = reason; localStorage.setItem('foromane_promo_requests', JSON.stringify(prs)); showToast('Promo request rejected'); renderPromoRequestsList(); return; }
  const pays = JSON.parse(localStorage.getItem('foromane_payment_requests') || '[]');
  const p2 = pays.findIndex(p=>p.id===id);
  if (p2 !== -1) { pays[p2].status = 'rejected'; pays[p2].reason = reason; localStorage.setItem('foromane_payment_requests', JSON.stringify(pays)); showToast('Payment rejected'); renderPromoRequestsList(); return; }
  showToast('Request not found');
}

window.openPaymentProofModal = openPaymentProofModal;
window.handleProofFileInput = handleProofFileInput;
window.sendPaymentWhatsApp = sendPaymentWhatsApp;
window.submitPaymentProof = submitPaymentProof;
window.createPromoRequest = createPromoRequest;
window.renderPromoRequestsList = renderPromoRequestsList;
window.approveRequest = approveRequest;
window.rejectRequestPrompt = rejectRequestPrompt;

// ─── BOOST COUNTER HELPERS ───
window.getBoostCounter = function() {
  var b = parseInt(localStorage.getItem('foromane_boosts_remaining') || '12', 10);
  if (window.ForomaneCadence && window.ForomaneCadence.isMaintenanceWindow()) {
    if (b < 12) {
      b = 12;
      localStorage.setItem('foromane_boosts_remaining', '12');
      var _lm = localStorage.getItem('foromane_boost_last_reset') || '';
      var _thisMonth = new Date().getMonth() + '-' + new Date().getFullYear();
      if (_lm !== _thisMonth) {
        localStorage.setItem('foromane_boost_last_reset', _thisMonth);
        showToast('Boosts reset to 12 for the new month');
      }
    }
  }
  return Math.max(0, b);
};

window.decrementBoostCounter = function() {
  let b = window.getBoostCounter();
  b = Math.max(0, b - 1);
  localStorage.setItem('foromane_boosts_remaining', String(b));
  ['boost-counter', 'boost-counter-modal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(b);
  });
  return b;
};


function updateMobileField(id, field, value) {
  const m = UserState.contacts.mobiles.find(x => x.id === id);
  if (m) { m[field] = value; UserState._persistContacts(); }
}

function addWhatsAppEntry() {
  const w = { id: genId(), title: '', countryCode: '+267', number: '', isPrimary: false };
  UserState.addWhatsApp(w);
  renderPersonalDetails();
  document.querySelectorAll('.sub-accordion-header').forEach(h => {
    if (h.textContent.includes('Contact')) h.parentElement.classList.add('open');
    if (h.textContent.includes('WhatsApp Numbers')) h.parentElement.classList.add('open');
  });
}

function removeWhatsAppEntry(id) {
  UserState.removeWhatsApp(id);
  renderPersonalDetails();
  document.querySelectorAll('.sub-accordion-header').forEach(h => {
    if (h.textContent.includes('Contact')) h.parentElement.classList.add('open');
    if (h.textContent.includes('WhatsApp Numbers')) h.parentElement.classList.add('open');
  });
  showToast('Removed');
}

function setPrimaryWhatsApp(id) {
  UserState.setPrimaryWhatsApp(id);
  renderPersonalDetails();
  document.querySelectorAll('.sub-accordion-header').forEach(h => {
    if (h.textContent.includes('Contact')) h.parentElement.classList.add('open');
    if (h.textContent.includes('WhatsApp Numbers')) h.parentElement.classList.add('open');
  });
  showToast('Primary updated');
}

function updateWhatsAppField(id, field, value) {
  const w = UserState.contacts.whatsapps.find(x => x.id === id);
  if (w) { w[field] = value; UserState._persistContacts(); }
}

// ─── LIKED PAGE ───
function renderLikedList(mode) {
  var titleEl = document.getElementById('liked-page-title');
  if (titleEl) titleEl.textContent = mode === 'promos' ? 'Liked Promos' : mode === 'products' ? 'Liked Products' : mode === 'tradesmen' ? 'Liked Tradesmen' : 'Liked Suppliers';

  var list = document.getElementById('favourite-suppliers-list');
  if (!list) return;

  var favIds = UserState.favouriteSuppliers;

  if (mode === 'products') {
    var likedItems = JSON.parse(localStorage.getItem('foromane_liked_items') || '[]');
    if (likedItems.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:32px 16px;color:var(--grey-dark);"><i class="fas fa-box" style="font-size:40px;margin-bottom:12px;display:block;color:var(--grey-mid);"></i><p style="font-weight:600;">No liked products yet</p><p style="font-size:13px;margin-top:4px;">Browse the catalogue and heart items you like.</p></div>';
    } else {
      var html = likedItems.map(function(id) {
        var i = _resolveCatalogueItem(id);
        var price = i.basePrice || i.price || 0;
        var unit = i.unit || 'each';
        var total = (price * (i.qty || 1)).toFixed(2);
        var bizEsc = (i.businessName || '').replace(/'/g, "\\'");
        return '<div class="promo-text-card" id="ptext-' + i.id + '">' +
          '<div class="promo-text-main" onclick="toggleTextPromo(\'' + i.id + '\')">' +
            '<div class="promo-title">' + (i.title || i.name || i.id) + '</div>' +
            '<div class="qty-row" style="margin-top:0;">' +
              '<div class="qty-price">P <span class="cp">' + total + '</span> <span style="font-size:12px;font-weight:400;color:var(--orange);">' + unit + '</span></div>' +
              '<div class="qty-controls">' +
                '<button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + i.id + '\',-1,' + price + ',this)">\u2212</button>' +
                '<span class="qv" style="min-width:20px;text-align:center;">' + (i.qty || 1) + '</span>' +
                '<button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + i.id + '\',1,' + price + ',this)">+</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="promo-text-extra">' +
            '<div class="promo-text-thumb-flex">' +
              (function(bId){ var logo = window.getBusinessLogo(bId); return logo ? '<img src="' + logo + '" class="promo-text-thumb" alt="" loading="lazy" width="48" height="48">' : ''; })(i.businessId) +
              '<div class="promo-text-biz-info" onclick="openBizFromPromo(\'' + (i.businessId || '') + '\',\'' + (bizEsc || '') + '\')">' +
                '<div class="promo-text-biz-name">' + (i.businessName || 'Unknown') + '</div>' +
                '<div class="promo-text-biz-location">' + (typeof i.location === 'object' && i.location ? (i.location.town || '') : (i.location || 'Category: ' + (i.category || 'General'))) + '</div>' +
              '</div>' +
            '</div>' +
            (i.desc ? '<div class="promo-desc">' + i.desc + '</div>' : '') +
            '<div class="promo-actions">' +
              '<button class="action-btn" onclick="addToNote(\'' + i.id + '\')"><img src="assets/icons/solid/add-to-note_orange.webp" style="height:16px;vertical-align:middle;object-fit:contain;"></button>' +
              '<span class="action-divider">|</span>' +
              '<button class="action-btn" onclick="sharePromo(\'' + i.id + '\')"><img src="assets/icons/solid/share-nodes_whatsapp_green.webp" style="width:14px;height:14px;vertical-align:middle;"></button>' +
              '<span class="action-divider">|</span>' +
              '<button class="action-btn liked" id="like-' + i.id + '" onclick="handleProdLike(\'' + i.id + '\', this)">' +
                '<img src="assets/icons/heart_active_icon.webp" style="width:16px;height:16px;vertical-align:middle;" loading="lazy">' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
      list.innerHTML = html;
    }
    return;
  }

  if (mode === 'promos') {
    var likedPromos = JSON.parse(localStorage.getItem('foromane_liked_promos') || '[]');
    if (likedPromos.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:32px 16px;color:var(--grey-dark);"><i class="fas fa-bullhorn" style="font-size:40px;margin-bottom:12px;display:block;color:var(--grey-mid);"></i><p style="font-weight:600;">No liked promos yet</p><p style="font-size:13px;margin-top:4px;">Browse promos and heart the ones you like.</p></div>';
    } else {
      var allPromos = window._promos || [];
      var promoHtml = '';
      likedPromos.forEach(function(pid) {
        var p = allPromos.find(function(x) { return String(x.id) === String(pid); });
        if (!p) return;
        var status = p.promo ? window.getPromoRemaining(p.promo.expiresAt) : { text: '', expired: false };
        var statusBadge = status.expired
          ? '<div class="promo-status-badge ended">Ended</div>'
          : (status.text ? '<div class="promo-status-badge active">' + status.text + '</div>' : '');
        var isOwnPromo = p.businessId === 'biz_user';
        var price = p.basePrice || p.price || 0;
        var total = (price * (p.qty || 1)).toFixed(2);
        var bizName = p.businessName || '';
        var title = p.title || 'Promo';
        promoHtml +=
          '<div class="promo-text-card" id="ptext-' + p.id + '">' +
            '<div class="promo-text-main" onclick="toggleTextPromo(\'' + p.id + '\')">' +
              '<div class="promo-title">' + title + '</div>' +
              '<div class="qty-row" style="margin-top:0;">' +
                '<div class="qty-price">P <span class="cp">' + total + '</span> <span style="font-size:12px;font-weight:400;color:var(--orange);">' + (p.unit || 'each') + '</span></div>' +
                '<div class="qty-controls">' +
                  '<button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + p.id + '\',-1,' + price + ',this)">\u2212</button>' +
                  '<span class="qv" style="min-width:20px;text-align:center;">' + (p.qty || 1) + '</span>' +
                  '<button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + p.id + '\',1,' + price + ',this)">+</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="promo-text-extra">' +
              '<div class="promo-text-thumb-flex">' +
                (function(bId){ var logo = window.getBusinessLogo(bId); return logo ? '<img src="' + logo + '" class="promo-text-thumb" alt="" loading="lazy" width="48" height="48">' : ''; })(p.businessId) +
                '<div class="promo-text-biz-info" onclick="openBizFromPromo(\'' + (p.businessId || '') + '\',\'' + (bizName.replace(/'/g,"\\'") || '') + '\')">' +
                  '<div class="promo-text-biz-name">' + bizName + '</div>' +
                  '<div class="promo-text-biz-location">' + (typeof p.location === 'object' && p.location ? (p.location.town || '') + (p.location.area ? ' · ' + p.location.area : '') : (p.location || 'Category: ' + (p.category || 'General'))) + '</div>' +
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
            '</div>' +
          '</div>';
      });
      list.innerHTML = promoHtml || '<div style="text-align:center;padding:32px 16px;color:var(--grey-dark);"><p style="font-weight:600;">No liked promos yet</p></div>';
    }
    return;
  }

  var allProfiles = window.DEMO_PROFILES || [];
  var allBiz = [...(window.SAMPLE_BUSINESSES || [])];
  if (UserState.hasBusiness()) {
    var biz = UserState.business;
    allBiz.push({
      id: 'biz_user', name: biz.name, category: biz.category, location: biz.town,
      initials: biz.name.split(' ').map(function(w){return w[0]}).join('').slice(0,2).toUpperCase(),
      color: window.APP_COLORS[biz.name.charCodeAt(0) % window.APP_COLORS.length],
      phone: biz.phone || '', public: true, description: ''
    });
  }

  var items;
  if (mode === 'tradesmen') {
    items = allProfiles.filter(function(p) {
      return favIds.indexOf(p.id) !== -1 && p.role === 'Tradesperson (Contractor)';
    });
  } else {
    var bizItems = allBiz.filter(function(b) { return favIds.indexOf(b.id) !== -1; });
    var profileSuppliers = allProfiles.filter(function(p) {
      return favIds.indexOf(p.id) !== -1 && p.role === 'Business & Materials Supplier';
    });
    items = bizItems.concat(profileSuppliers);
  }

  if (items.length === 0) {
    var modeLabel = mode === 'tradesmen' ? 'tradesmen' : 'suppliers';
    list.innerHTML = '<div style="text-align:center;padding:32px 16px;color:var(--grey-dark);"><i class="fas fa-heart" style="font-size:40px;margin-bottom:12px;display:block;color:var(--grey-mid);"></i><p style="font-weight:600;">No liked ' + modeLabel + ' yet</p><p style="font-size:13px;margin-top:4px;">Browse the directory and heart the ones you like.</p></div>';
    return;
  }

  items.sort(function(a, b) { return a.name.localeCompare(b.name); });
  list.innerHTML = items.map(function(item) {
    var init = item.initials || item.name.split(' ').map(function(w){return w[0]}).join('').slice(0,2).toUpperCase();
    var col = item.color || window.APP_COLORS[init.charCodeAt(0) % window.APP_COLORS.length];
    var loc = item.town || item.location || '';
    var role = item.role || item.category || '';
    var profileImg = item.image || (mode !== 'tradesmen' ? item.logo : null) || null;
    var avatarHtml = profileImg
      ? '<img src="' + profileImg + '" class="dir-avatar" style="object-fit:cover;" alt="" onerror="this.outerHTML=\'' + init + '\'" loading="lazy" width="48" height="48">'
      : '<div class="dir-avatar" style="background:' + col + ';">' + init + '</div>';
    var onClick = mode === 'tradesmen'
      ? 'openProProfile(\'' + item.id + '\')'
      : 'openBizProfile(\'' + item.id + '\',\'' + item.name.replace(/'/g,"\\'") + '\',\'' + init + '\',\'' + col + '\',\'' + loc + '\',\'' + (item.phone || '') + '\')';
    return '<div class="dir-card" onclick="' + onClick + '">' +
      avatarHtml +
      '<div class="dir-info"><h3>' + item.name + '</h3><p>' + role + ' · ' + loc + '</p></div>' +
      '<button onclick="event.stopPropagation();toggleFavDir(this,\'' + item.id + '\');renderLikedList(\'' + mode + '\')" style="background:none;border:none;cursor:pointer;padding:4px 8px;flex-shrink:0;margin-left:auto;" title="Remove">' +
        '<img src="assets/icons/heart_active_icon.webp" style="width:22px;height:22px;display:block;" loading="lazy">' +
      '</button></div>';
  }).join('');
}

function _resolveCatalogueItem(id) {
  if (window.DEMO_CATALOGUE_ITEMS) {
    var found = window.DEMO_CATALOGUE_ITEMS.find(function(i) { return i.id === id; });
    if (found) return found;
  }
  if (window._promos) {
    var found = window._promos.find(function(i) { return String(i.id) === String(id); });
    if (found) return found;
  }
  return { id: id, title: id, name: id, category: 'Other' };
}

function showLikedCategoryItems(catName) {
  var list = document.getElementById('favourite-suppliers-list');
  if (!list) return;
  var likedItems = JSON.parse(localStorage.getItem('foromane_liked_items') || '[]');
  var items = likedItems.map(function(id) {
    return _resolveCatalogueItem(id);
  }).filter(function(i) { return i.category === catName; });

  if (items.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--grey-dark);"><p>No items in this category.</p></div>';
    return;
  }

  list.innerHTML = '<div style="padding:4px 0;">' +
    '<button onclick="renderLikedList(\'products\')" style="background:none;border:none;color:var(--orange);cursor:pointer;font-size:13px;margin-bottom:8px;">← Back to Categories</button>' +
    items.map(function(i) {
      var isOwnPromo = i.businessId === 'biz_user';
      var price = i.basePrice || i.price || 0;
      var total = (price * (i.qty || 1)).toFixed(2);
      var bizName = i.businessName || '';
      var title = i.title || 'Item';
      return '<div class="promo-text-card" id="ptext-' + i.id + '">' +
        '<div class="promo-text-main" onclick="toggleTextPromo(\'' + i.id + '\')">' +
          '<div class="promo-title">' + title + '</div>' +
          '<div class="qty-row" style="margin-top:0;">' +
            '<div class="qty-price">P <span class="cp">' + total + '</span> <span style="font-size:12px;font-weight:400;color:var(--orange);">' + (i.unit || 'each') + '</span></div>' +
            '<div class="qty-controls">' +
              '<button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + i.id + '\',-1,' + price + ',this)">\u2212</button>' +
              '<span class="qv" style="min-width:20px;text-align:center;">' + (i.qty || 1) + '</span>' +
              '<button class="qty-btn" onclick="event.stopPropagation();changeQty(\'' + i.id + '\',1,' + price + ',this)">+</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="promo-text-extra">' +
          '<div class="promo-text-thumb-flex">' +
            (function(bId){ var logo = window.getBusinessLogo(bId); return logo ? '<img src="' + logo + '" class="promo-text-thumb" alt="" loading="lazy" width="48" height="48">' : ''; })(i.businessId) +
            '<div class="promo-text-biz-info" onclick="openBizFromPromo(\'' + (i.businessId || '') + '\',\'' + (bizName.replace(/'/g,"\\'") || '') + '\')">' +
              '<div class="promo-text-biz-name">' + (bizName || 'Unknown') + '</div>' +
              '<div class="promo-text-biz-location">' + (typeof i.location === 'object' && i.location ? (i.location.town || '') : (i.location || 'Category: ' + (i.category || 'General'))) + '</div>' +
            '</div>' +
          '</div>' +
          (i.desc ? '<div class="promo-desc">' + i.desc + '</div>' : '') +
          '<div class="promo-actions">' +
            '<button class="action-btn" onclick="addToNote(\'' + i.id + '\')"><img src="assets/icons/solid/add-to-note_orange.webp" style="height:16px;vertical-align:middle;object-fit:contain;"></button>' +
            '<span class="action-divider">|</span>' +
            '<button class="action-btn" onclick="sharePromo(\'' + i.id + '\')"><img src="assets/icons/solid/share-nodes_whatsapp_green.webp" style="width:14px;height:14px;vertical-align:middle;"></button>' +
            (isOwnPromo || window.Auth?.isAdmin() ?
            '<span class="action-divider">|</span><button class="action-btn" onclick="openFbPromo(\'' + i.id + '\')"><img src="assets/icons/facebook_icon_f.webp" style="height:14px;vertical-align:middle;object-fit:contain;"></button>' : '') +
            (isOwnPromo ? '' :
            '<span class="action-divider">|</span><button class="action-btn liked" id="like-' + i.id + '" onclick="handleProdLike(\'' + i.id + '\', this)">' +
              '<img src="assets/icons/heart_active_icon.webp" style="width:16px;height:16px;vertical-align:middle;" loading="lazy">' +
            '</button>') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
}

function handleProdLike(id, btnEl) {
  var p = window._promos ? window._promos.find(function(x) { return String(x.id) === String(id); }) : null;
  if (p) { window.toggleLike(id, btnEl); }
  var liked = JSON.parse(localStorage.getItem('foromane_liked_items') || '[]');
  var idx = liked.indexOf(id);
  if (idx !== -1) { liked.splice(idx, 1); localStorage.setItem('foromane_liked_items', JSON.stringify(liked)); }
  renderLikedList('products');
}

window.handleProdLike = handleProdLike;

function closeLikedAccordion() {
  var body = document.getElementById('fav-suppliers-accordion-body');
  if (body) {
    var acc = body.closest('.accordion');
    if (acc) acc.classList.remove('open');
  }
}

function renderFavouriteSuppliers() {
  renderLikedList('suppliers');
}

function removeFavourite(id) {
  UserState.toggleFavourite(id);
  renderFavouriteSuppliers();
  showToast('Removed from favourites');
}

// ─── INTERESTS PAGE ───
function renderInterestsPage() {
  const body = document.getElementById('interests-page-body');
  if (!body) return;
  const data = window.FOROMANE_PRODUCT_CATEGORIES;
  if (!data || !data.categories) {
    body.innerHTML = '<p style="padding:20px;text-align:center;color:var(--grey-dark);">Categories not loaded</p>';
    return;
  }

  // Update top bar and bottom bar based on mode
  var titleEl = document.getElementById('interests-title');
  var subtitleEl = document.getElementById('interests-subtitle');
  var backBtn = document.getElementById('interests-back-btn');
  var saveBtn = document.getElementById('interests-save-btn');
  var closeBtn = document.getElementById('interests-close-btn');

  if (window._regModeInterests) {
    if (titleEl) titleEl.textContent = 'Select Your Interests';
    if (subtitleEl) { subtitleEl.style.display = 'block'; subtitleEl.textContent = 'Choose at least 5 main categories'; }
    if (backBtn) { backBtn.style.display = 'inline-flex'; backBtn.onclick = cancelRegInterests; }
    if (saveBtn) { saveBtn.style.display = 'inline-flex'; saveBtn.onclick = saveInterestsFromPage; }
    if (closeBtn) { closeBtn.style.display = 'inline-flex'; closeBtn.onclick = closeRegInterests; }
    renderRegModeInterests(body, data);
  } else {
    if (titleEl) titleEl.textContent = 'My Interests';
    if (subtitleEl) subtitleEl.style.display = 'none';
    if (backBtn) { backBtn.style.display = 'inline-flex'; backBtn.onclick = function() { goBack(); }; }
    if (saveBtn) { saveBtn.style.display = 'inline-flex'; saveBtn.onclick = saveInterestsFromPage; }
    if (closeBtn) closeBtn.style.display = 'none';
    renderEditModeInterests(body, data);
  }
}

function renderRegModeInterests(body, data) {
  const allCatNames = data.categories.map(c => c.name);
  const allSelected = allCatNames.every(n => UserState.interests.includes(n));
  let html = `<div style="padding:8px 16px;border-bottom:1px solid var(--grey-light);cursor:pointer;font-size:15px;font-weight:600;background:${allSelected ? 'var(--orange-light)' : 'transparent'};" onclick="toggleAllInterests()">
    <input type="checkbox" ${allSelected ? 'checked' : ''} style="margin-right:10px;accent-color:var(--orange);">All Interests
  </div>`;
  data.categories.forEach(function(cat) {
    const isChecked = allSelected || UserState.interests.includes(cat.name);
    const safeName = cat.name.replace(/'/g, "\\'");
    html += `<div style="padding:10px 16px;border-bottom:1px solid var(--grey-light);cursor:pointer;font-size:14px;display:flex;align-items:center;" onclick="event.stopPropagation();toggleInterestCheckbox('${safeName}', this.querySelector('input').checked)">
      <input type="checkbox" ${isChecked ? 'checked' : ''} style="margin-right:8px;accent-color:var(--orange);" onclick="event.stopPropagation();toggleInterestCheckbox('${safeName}', this.checked)">${cat.name}
    </div>`;
  });
  body.innerHTML = html;
}

function renderEditModeInterests(body, data) {
  const allCats = [];
  data.categories.forEach(function(cat) {
    if (cat.children) {
      cat.children.forEach(function(sub) { allCats.push(sub.name); });
    } else {
      allCats.push(cat.name);
    }
  });
  const allSelected = allCats.every(n => UserState.interests.includes(n));
  let html = `<div style="padding:12px 16px;border-bottom:1px solid var(--grey-light);cursor:pointer;font-size:15px;font-weight:600;background:${allSelected ? 'var(--orange-light)' : 'transparent'};" onclick="toggleAllInterests()">
    <input type="checkbox" ${allSelected ? 'checked' : ''} style="margin-right:10px;accent-color:var(--orange);">All Interests
  </div>`;

  const renderItem = (cat, level) => {
    const indent = (level - 1) * 16;
    const isChecked = UserState.interests.includes(cat.name);
    const hasChildren = cat.children && cat.children.length > 0;
    const safeName = cat.name.replace(/'/g, "\\'");
    const childId = 'int-ch-' + (cat.slug || cat.id || safeName).replace(/[^a-z0-9-]/gi, '');

    const rowClick = hasChildren
      ? `event.stopPropagation();toggleCategoryChildren('${childId}')`
      : `event.stopPropagation();toggleInterestCheckbox('${safeName}', this.querySelector('input').checked)`;

    let itemHtml = `<div style="padding:8px 16px;border-bottom:1px solid var(--grey-light);cursor:pointer;font-size:14px;padding-left:${indent + 16}px;display:flex;align-items:center;" onclick="${rowClick}">
      <input type="checkbox" ${isChecked ? 'checked' : ''} style="margin-right:8px;" onclick="event.stopPropagation();toggleInterestCheckbox('${safeName}', this.checked)">${cat.name}
    </div>`;

    if (hasChildren) {
      itemHtml += `<div id="${childId}" style="display:none;">`;
      cat.children.forEach(child => { itemHtml += renderItem(child, level + 1); });
      itemHtml += `</div>`;
    }
    return itemHtml;
  };

  data.categories.forEach(cat => { html += renderItem(cat, 1); });
  body.innerHTML = html;
  if (window._expandedInterestSubs) {
    window._expandedInterestSubs.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
  }
}

function toggleInterestCheckbox(name, checked) {
  if (checked) {
    if (!UserState.interests.includes(name)) UserState.interests.push(name);
  } else {
    UserState.interests = UserState.interests.filter(c => c !== name);
  }
  renderInterestsPage();
}

function toggleAllInterests() {
  const allCats = [];
  const data = window.FOROMANE_PRODUCT_CATEGORIES || { categories: [] };
  if (window._regModeInterests) {
    data.categories.forEach(function(cat) { allCats.push(cat.name); });
  } else {
    data.categories.forEach(function(cat) {
      if (cat.children) {
        cat.children.forEach(function(sub) { allCats.push(sub.name); });
      } else {
        allCats.push(cat.name);
      }
    });
  }
  const allSelected = allCats.every(n => UserState.interests.includes(n));
  if (allSelected) {
    UserState.interests = UserState.interests.filter(n => !allCats.includes(n));
  } else {
    allCats.forEach(function(n) {
      if (!UserState.interests.includes(n)) UserState.interests.push(n);
    });
  }
  renderInterestsPage();
}

function toggleCategoryChildren(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
    if (!window._expandedInterestSubs) window._expandedInterestSubs = new Set();
    if (el.style.display === 'block') {
      window._expandedInterestSubs.add(id);
    } else {
      window._expandedInterestSubs.delete(id);
    }
  }
}

function saveInterestsFromPage() {
  if (window._regModeInterests) {
    var count = UserState.interests.length;
    if (count < 5) {
      showToast('Please select at least 5 main categories.');
      return;
    }
    UserState._persistInterests();
    showToast('Interests saved!');
    window._regModeInterests = false;
    goBack();
    return;
  }
  UserState._persistInterests();
  showToast('Interests saved!');
  goTo('view-account');
}

function cancelRegInterests() {
  window._regModeInterests = false;
  goBack();
}

function closeRegInterests() {
  cancelRegInterests();
}

// ─── ACCOUNT UI ───
function updateAccountHero() {
  const s = UserState;
  const isGuest = s.id === 'guest';
  const isAdmin = s.role === 'Administrator';
  const name = isGuest ? 'Browse as Guest' : ((s.firstName + ' ' + s.surname).trim() || s.name);
  const initials = isGuest ? '?' : (isAdmin ? 'AD' : name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase());
  const color = isGuest ? '#999' : (isAdmin ? '#2a2a2a' : window.APP_COLORS[initials.charCodeAt(0) % window.APP_COLORS.length]);
  const avatar = document.getElementById('acct-avatar');
  avatar.style.background = 'white';
  avatar.style.color = color;

    var customAvatar = s.customAvatar || localStorage.getItem('foromane_custom_avatar_' + s.id);
  if (customAvatar) {
    avatar.innerHTML = '<img src="' + customAvatar + '" style="width:120px;height:120px;border-radius:10px;object-fit:cover;display:block;border:3px solid rgba(200,200,200,0.2);" loading="lazy" width="120" height="120">';
    avatar.onclick = function() { document.getElementById('acct-avatar-input').click(); };
  } else if (isGuest) {
    avatar.innerHTML = '<img src="' + window.assetUrl('assets/images/company_logos_dummy/foromane_logo_thumbnail.webp') + '" style="width:120px;height:120px;border-radius:10px;object-fit:cover;display:block;border:3px solid rgba(200,200,200,0.2);" loading="lazy" width="120" height="120">';
    avatar.onclick = null;
  } else if (isAdmin) {
    avatar.innerHTML = initials;
    avatar.onclick = function() { document.getElementById('acct-avatar-input').click(); };
  } else {
    const demoAcc = window.DEMO_PROFILES ? window.DEMO_PROFILES.find(a => a.id === s.id) : null;
    const fallbackImage = `assets/images/profile_pictures_dummy/${encodeURIComponent(name)}.jpg`;
    const imgSrc = window.assetUrl((demoAcc && demoAcc.image) || (demoAcc && demoAcc.logo) || fallbackImage);
    avatar.innerHTML = '<img src="' + imgSrc + '" style="width:120px;height:120px;border-radius:10px;object-fit:cover;display:block;border:3px solid rgba(200,200,200,0.2);" onerror="this.outerHTML=\'' + initials + '\'" loading="lazy" width="120" height="120">';
    avatar.onclick = function() { document.getElementById('acct-avatar-input').click(); };
  }

  document.getElementById('acct-name').textContent = name;
  var role = isAdmin ? 'Administrator' : s.role;
  if (!isGuest && s.isVerified) {
    role += ' · Verified';
  }
  document.getElementById('acct-role').textContent = role;
  const noteCount = (window._notes || []).filter(function(n) { return n.userId === s.id; }).length;
  const el = document.getElementById('pro-notes-count');
  if (el) el.textContent = noteCount + ' note' + (noteCount !== 1 ? 's' : '');

  var hero = document.querySelector('.profile-hero');
  var chevron = hero ? hero.querySelector('.chevron') : null;
  if (isGuest) {
    if (hero) hero.onclick = null;
    if (chevron) chevron.style.display = 'none';
  } else {
    if (hero) hero.onclick = function() { toggleAcc(this); renderPersonalDetails(); };
    if (chevron) chevron.style.display = '';
  }
}

function handleAvatarChange(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var dataUrl = e.target.result;
    var avatar = document.getElementById('acct-avatar');
    avatar.innerHTML = '<img src="' + dataUrl + '" style="width:120px;height:120px;border-radius:10px;object-fit:cover;display:block;border:3px solid rgba(200,200,200,0.2);" loading="lazy" width="120" height="120">';
    localStorage.setItem('foromane_custom_avatar_' + UserState.id, dataUrl);
    if (UserState.customAvatar !== undefined) UserState.customAvatar = dataUrl;
  };
  reader.readAsDataURL(file);
}

// ─── SWITCHER HELPERS ───
function getSwitcherImg(id, name) {
  if (id === 'guest') return '<img src="assets/images/company_logos_dummy/foromane_logo_thumbnail.webp" class="switcher-profile-img" loading="lazy" width="48" height="48">';
  if (id === 'admin') return '';
  var p = window.DEMO_PROFILES ? window.DEMO_PROFILES.find(function(a) { return a.id === id || a.name === name; }) : null;
  var src = window.assetUrl((p && p.image) || 'assets/images/profile_pictures_dummy/' + id + '-avatar.jpg');
  return '<img src="' + src + '" class="switcher-profile-img" onerror="this.outerHTML=\'\'" loading="lazy" width="48" height="48">';
}

function renderSwitcherOption(id, name, role, initials, color, extraAttr) {
  const noteCount = (window._notes || []).filter(function(n) { return n.userId === id; }).length;
  const isActive = UserState.id === id;
  var clickHandler = extraAttr || (' onclick="switchTo(\'' + id + '\')" ');
  var checkHtml = isActive ? '<i class="fas fa-check-circle switcher-check"></i>' : '';
  var img = getSwitcherImg(id, name);
  return '<div class="switcher-option"' + clickHandler + '>' +
    '<div class="switcher-avatar" style="background:' + color + ';">' + (img || initials) + '</div>' +
    '<div class="switcher-info"><h4>' + name + '</h4><p>' + role + '</p></div>' +
    '<div style="display:flex;align-items:center;gap:8px;margin-left:auto;"><span class="note-count-badge">' + noteCount + '</span>' + checkHtml + '</div>' +
  '</div>';
}

function openSwitcher() {
  const list = document.getElementById('switcher-list');
  if (!list) return;

  var html = '';

  // 1. Browse as Guest
  html += renderSwitcherOption('guest', 'Browse as Guest', 'Browser', '?', '#999');

  // 2. Divider
  html += '<div class="switcher-section-divider"></div>';

  // 3. Featured header
  html += '<div class="switcher-section-header">Featured</div>';

  // 4. Admin
  html += '<div class="switcher-option" onclick="event.stopPropagation();closeSwitcher();openModal(\'admin-pw-modal\')">' +
    '<div class="switcher-avatar" style="background:#2a2a2a;">AD</div>' +
    '<div class="switcher-info"><h4>Admin</h4><p>Administrator</p></div>' +
    '<i class="fas fa-lock" style="color:var(--grey-mid);margin-left:auto;font-size:14px;"></i>' +
  '</div>';

  // 5. Group all DEMO_ACCOUNTS by business association
  var grouped = {};
  var unassociated = [];
  window.DEMO_ACCOUNTS.forEach(function(a) {
    if (a.id === 'guest' || a.id === 'admin') return;
    var assoc = window.BUSINESS_ASSOCIATIONS ? window.BUSINESS_ASSOCIATIONS[a.id] : null;
    if (assoc) {
      if (!grouped[assoc.businessId]) grouped[assoc.businessId] = [];
      grouped[assoc.businessId].push(a);
    } else {
      unassociated.push(a);
    }
  });

  Object.keys(grouped).sort().forEach(function(bizId) {
    var biz = window.SAMPLE_BUSINESSES.find(function(b) { return b.id === bizId; });
    if (!biz) return;
    html += '<div class="switcher-section-header" style="font-size:10px;padding-top:2px;">' + biz.name + '</div>';
    grouped[bizId].forEach(function(a) {
      html += renderSwitcherOption(a.id, a.name, a.role, a.initials, a.color);
    });
  });

  // 6. Unassociated Demo Accounts
  if (unassociated.length > 0) {
    html += '<div class="switcher-section-header" style="font-size:10px;padding-top:2px;">Other Accounts</div>';
    unassociated.forEach(function(a) {
      html += renderSwitcherOption(a.id, a.name, a.role, a.initials, a.color);
    });
  }

  // 7. Divider + Other Accounts button
  html += '<div class="switcher-section-divider"></div>';
  html += '<div class="switcher-other-btn" onclick="event.stopPropagation();closeSwitcher();openOtherUsers();">Other Accounts <span style="font-size:16px;">\u2192</span></div>';

  // 8. Logout
  html += '<div class="switcher-other-btn" onclick="event.stopPropagation();logoutUser();" style="margin-top:4px;color:#c00;">Logout</div>';
  html += '<div class="switcher-other-btn" onclick="event.stopPropagation();closeSwitcher();openFeedbackModal();" style="margin-top:2px;font-size:12px;color:var(--grey-dark);">Send Feedback</div>';
  html += '<div class="switcher-other-btn" onclick="event.stopPropagation();closeSwitcher();openLegalModal(\'terms\');" style="margin-top:2px;font-size:12px;color:var(--grey-dark);">Terms of Service</div>';
  html += '<div class="switcher-other-btn" onclick="event.stopPropagation();closeSwitcher();openLegalModal(\'privacy\');" style="margin-top:2px;font-size:12px;color:var(--grey-dark);">Privacy Policy</div>';

  list.innerHTML = html;
  openModal('switcher-modal');
}

function openFeedbackModal() {
  var existing = document.getElementById('feedback-modal');
  if (existing) { openModal('feedback-modal'); return; }
  var modal = document.createElement('div');
  modal.id = 'feedback-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:380px;">
      <div class="modal-header">
        <h3>Send Feedback</h3>
        <i class="fas fa-times" onclick="closeModal('feedback-modal')"></i>
      </div>
      <div class="modal-body">
        <select id="fb-category" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:10px;">
          <option value="feedback">Feedback</option>
          <option value="bug">Bug Report</option>
          <option value="feature">Feature Request</option>
          <option value="other">Other</option>
        </select>
        <textarea id="fb-message" placeholder="Tell us what's on your mind..." style="width:100%;min-height:100px;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:10px;resize:vertical;"></textarea>
        <input id="fb-contact" type="text" placeholder="Your email or WhatsApp (optional)" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:10px;">
        <div id="fb-error" style="color:#c62828;font-size:12px;display:none;margin-bottom:8px;"></div>
        <button class="btn" onclick="sendFeedback()" style="width:100%;background:var(--orange);color:#fff;border:none;padding:12px;border-radius:8px;font-weight:600;">Submit</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  openModal('feedback-modal');
}

// ==========================================
// LEGAL MODALS (Terms of Service & Privacy Policy)
// ==========================================

function openLegalModal(type) {
  var modalId = type === 'privacy' ? 'privacy-modal' : 'terms-modal';
  var existing = document.getElementById(modalId);
  if (existing) { openModal(modalId); return; }
  var modal = document.createElement('div');
  modal.id = modalId;
  modal.className = 'modal';
  var content = type === 'privacy' ? `
    <div class="modal-content" style="max-width:500px;">
      <div class="modal-header">
        <h3>Privacy Policy</h3>
        <i class="fas fa-times" onclick="closeModal('${modalId}')"></i>
      </div>
      <div class="modal-body" style="max-height:70vh;overflow-y:auto;font-size:13px;line-height:1.6;color:#333;">
        <p><strong>Last updated:</strong> June 2026</p>
        <p>Foromane (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) respects your privacy. This policy explains how we collect, use, and protect your personal information.</p>
        <h4>1. Information We Collect</h4>
        <p>We collect information you provide directly: name, email, phone number, WhatsApp number, location, business details, and profile photos. We also collect usage data such as promo views, likes, and interactions.</p>
        <h4>2. How We Use Your Information</h4>
        <p>We use your information to operate the Foromane platform, process promo requests, verify your identity via WhatsApp, and improve our services. Your business listing is visible to other users as part of the directory.</p>
        <h4>3. Data Storage</h4>
        <p>Your data is stored securely using Firebase (Google Cloud) and locally on your device via IndexedDB. We retain your data for as long as your account is active.</p>
        <h4>4. Data Sharing</h4>
        <p>We do not sell your personal data. Business information you choose to list is shared publicly within the Foromane directory. We may share data with service providers (Firebase, Google Cloud) necessary to operate the platform.</p>
        <h4>5. Your Rights</h4>
        <p>You can request a copy of your data via the &ldquo;Export My Data&rdquo; feature in your account settings. You may delete your account by contacting us on WhatsApp at +267 71829765.</p>
        <h4>6. Contact</h4>
        <p>For privacy concerns, WhatsApp +267 71829765 or email foromane@gmail.com</p>
      </div>
    </div>
  ` : `
    <div class="modal-content" style="max-width:500px;">
      <div class="modal-header">
        <h3>Terms of Service</h3>
        <i class="fas fa-times" onclick="closeModal('${modalId}')"></i>
      </div>
      <div class="modal-body" style="max-height:70vh;overflow-y:auto;font-size:13px;line-height:1.6;color:#333;">
        <p><strong>Last updated:</strong> June 2026</p>
        <p>By using Foromane, you agree to these terms. If you do not agree, do not use the platform.</p>
        <h4>1. Account Registration</h4>
        <p>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your login credentials.</p>
        <h4>2. User Conduct</h4>
        <p>You agree not to use Foromane for unlawful purposes, to harass others, to post false or misleading information, or to engage in any activity that disrupts the platform.</p>
        <h4>3. Business Listings</h4>
        <p>Business owners are responsible for the accuracy of their listings. Foromane reserves the right to remove or suspend listings that violate our policies.</p>
        <h4>4. Promotions & Payments</h4>
        <p>Promo requests are subject to approval. Payment proof must be submitted for paid promotions. Refunds are handled on a case-by-case basis.</p>
        <h4>5. Intellectual Property</h4>
        <p>Content you submit (logos, images, descriptions) remains yours. You grant Foromane a license to display this content on the platform.</p>
        <h4>6. Limitation of Liability</h4>
        <p>Foromane is provided &ldquo;as is&rdquo; without warranties. We are not liable for damages arising from your use of the platform.</p>
        <h4>7. Changes</h4>
        <p>We may update these terms at any time. Continued use after changes constitutes acceptance.</p>
      </div>
    </div>
  `;
  modal.innerHTML = content;
  document.body.appendChild(modal);
  openModal(modalId);
}

// ==========================================
// PUSH NOTIFICATIONS
// ==========================================

async function requestNotificationPermission() {
  if (!('Notification' in window)) { console.warn('Notifications not supported'); return false; }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') { showToast('Notifications were blocked. Update your browser settings to enable them.'); return false; }
  var permission = await Notification.requestPermission();
  if (permission === 'granted') {
    showToast('Notifications enabled');
    return true;
  }
  return false;
}

function showLocalNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body: body, icon: '/assets/icons/icon-192.png' });
  } catch (e) { console.warn('Notification failed:', e); }
}

// Register service worker for push notifications
if ('serviceWorker' in navigator && !window._swRegistered) {
  window._swRegistered = true;
  navigator.serviceWorker.register('/sw.js').catch(function(e) {
    console.warn('Service worker registration failed:', e);
  });
}

window.openLegalModal = openLegalModal;
window.requestNotificationPermission = requestNotificationPermission;
window.showLocalNotification = showLocalNotification;

async function sendFeedback() {
  var category = document.getElementById('fb-category').value;
  var message = document.getElementById('fb-message').value.trim();
  var contactInfo = document.getElementById('fb-contact').value.trim();
  var errorEl = document.getElementById('fb-error');
  if (!message || message.length < 3) {
    errorEl.textContent = 'Please write a message (at least 3 characters).';
    errorEl.style.display = 'block';
    return;
  }
  errorEl.style.display = 'none';
  if (typeof window.submitFeedback === 'function') {
    try {
      await window.submitFeedback(category, message, contactInfo);
      closeModal('feedback-modal');
      showToast('Feedback submitted! Thank you.');
    } catch (e) {
      errorEl.textContent = e.message || 'Failed to submit feedback.';
      errorEl.style.display = 'block';
    }
  } else {
    // Offline fallback: store locally
    var feedback = JSON.parse(localStorage.getItem('foromane_feedback') || '[]');
    feedback.push({ category: category, message: message, contactInfo: contactInfo, timestamp: Date.now(), userId: UserState.id, userName: UserState.name, status: 'pending' });
    localStorage.setItem('foromane_feedback', JSON.stringify(feedback));
    closeModal('feedback-modal');
    showToast('Feedback saved locally. It will sync when online.');
  }
}

function closeSwitcher() { closeModal('switcher-modal'); }

function logoutUser() {
  closeSwitcher();
  UserState.clear();
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  document.getElementById('view-welcome')?.classList.add('active');
  if (typeof manageUI === 'function') manageUI('view-welcome');
  if (window.updateAccountUI) updateAccountUI();
  window._appEntered = false;
}

async function switchTo(id) {
  const account = window.DEMO_ACCOUNTS.find(a => a.id === id);
  if (!account) { closeSwitcher(); return; }
  await saveKpiToDB();
  UserState.set(account.id, account.name, account.role, '', account.town, '');
  localStorage.setItem('foromane_userId', id);
  updateAccountHero();

  // Handle admin specially (password gate)
  if (id === 'admin') {
    closeSwitcher();
    openModal('admin-pw-modal');
    return;
  }

  // Data-driven business resolution via BUSINESS_ASSOCIATIONS
  var assoc = window.BUSINESS_ASSOCIATIONS ? window.BUSINESS_ASSOCIATIONS[id] : null;
  if (assoc) {
    var biz = window.SAMPLE_BUSINESSES.find(function(b) { return b.id === assoc.businessId; });
    if (biz) {
      UserState.business = {
        id: biz.id, name: biz.name, category: biz.category,
        town: biz.location.split(',').pop().trim(),
        phone: biz.phone || '', subscription: biz.subscription || 'free',
        logo: biz.logo || '',
        description: biz.description || '',
        logoLandscape: biz.logoLandscape || '',
        categories: biz.categories || [biz.category].filter(Boolean),
        contacts: { calls: [], facebook: [], gps: [], whatsapp: [] }
      };
      UserState.businessRole = assoc.role;
      renderBusinessCard();
    }
    UserState.kpi = { ads: 0, views: 0, likes: 0, noteAdds: 0, interactions: 0 };
    UserState.interests = biz ? [biz.category] : [];
  } else if (id === 'guest') {
    UserState.business = null;
    resetBusinessCard();
    UserState.kpi = { ads: 0, views: 0, likes: 0, noteAdds: 0, interactions: 0 };
    UserState.interests = [];
  } else if (id === 'trade') {
    UserState.business = null;
    resetBusinessCard();
    UserState.kpi = { ads: 0, views: 45, likes: 12, noteAdds: 8, interactions: 0 };
    UserState.interests = ['Paint', 'Plumbing', 'Electrical'];
  } else if (id === 'general') {
    UserState.business = null;
    resetBusinessCard();
    UserState.kpi = { ads: 0, views: 12, likes: 3, noteAdds: 5, interactions: 0 };
    UserState.interests = ['Tiles & Flooring', 'Lighting', 'Paint'];
  } else if (id === 'user-gerald') {
    UserState.business = null;
    resetBusinessCard();
    UserState.kpi = { ads: 2, views: 68, likes: 15, noteAdds: 11, interactions: 0 };
    UserState.interests = ['Building Materials', 'Cement & Aggregates', 'Steel & Metal Products'];
  } else {
    UserState.business = null;
    resetBusinessCard();
    UserState.kpi = { ads: 0, views: 0, likes: 0, noteAdds: 0, interactions: 0 };
    UserState.interests = [];
  }
  saveKpiToDB(); updateKPI(); updateAccountUI(); closeSwitcher();
  reloadNotesForUser();
  showToast(`Switched to ${account.name}`);
  goTo('view-account');
}

// ─── OTHER USERS (from DEMO_PROFILES) ───
function openOtherUsers() {
  var coreIds = window.DEMO_ACCOUNTS.map(function(a) { return a.id; });
  var allProfiles = window.DEMO_PROFILES || [];
  var filtered = allProfiles.filter(function(p) { return !coreIds.includes(p.id); });

  filtered.sort(function(a, b) { return a.name.localeCompare(b.name); });

  window._otherUsersData = filtered;
  renderOtherUsersList(filtered);

  var letters = [...new Set(filtered.map(function(p) { return p.name[0].toUpperCase(); }))].sort();
  renderOtherUsersAlpha(letters);

  openModal('other-users-modal');
}

function renderOtherUsersList(profiles) {
  var list = document.getElementById('other-users-list');
  if (!list) return;

  if (!profiles || profiles.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--grey-dark);font-size:14px;">No accounts found.</div>';
    return;
  }

  var grouped = {};
  profiles.forEach(function(p) {
    var letter = p.name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(p);
  });

  var html = '';
  Object.keys(grouped).sort().forEach(function(letter) {
    html += '<div class="other-user-section-label" id="other-section-' + letter + '">' + letter + '</div>';
    grouped[letter].forEach(function(p) {
      var isActive = UserState.id === p.id;
      html += '<div class="other-user-item" onclick="switchToOtherUser(\'' + p.id + '\')">' +
        '<div class="other-user-avatar" style="background:' + p.color + ';">' + p.initials + '</div>' +
        '<div class="other-user-info"><h4>' + p.name + '</h4><p>' + p.role + ' \u00b7 ' + p.town + '</p></div>' +
        (isActive ? '<i class="fas fa-check-circle switcher-check" style="margin-left:auto;"></i>' : '') +
      '</div>';
    });
  });

  list.innerHTML = html;
}

function renderOtherUsersAlpha(letters) {
  var strip = document.getElementById('other-users-alpha');
  if (!strip) return;
  strip.innerHTML = letters.map(function(l) {
    return '<a href="#" onclick="event.preventDefault();scrollToOtherSection(\'' + l + '\')">' + l + '</a>';
  }).join('');
}

function scrollToOtherSection(letter) {
  var el = document.getElementById('other-section-' + letter);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filterOtherUsers(search) {
  var term = search.toLowerCase().trim();
  var all = window._otherUsersData || [];
  var filtered = term
    ? all.filter(function(p) { return p.name.toLowerCase().includes(term) || p.role.toLowerCase().includes(term) || p.town.toLowerCase().includes(term); })
    : all;
  renderOtherUsersList(filtered);
  var letters = [...new Set(filtered.map(function(p) { return p.name[0].toUpperCase(); }))].sort();
  renderOtherUsersAlpha(letters);
}

async function switchToOtherUser(id) {
  var allProfiles = window.DEMO_PROFILES || [];
  var profile = allProfiles.find(function(p) { return p.id === id; });
  if (!profile) return;

  await saveKpiToDB();

  UserState.set(profile.id, profile.name, profile.role, '', profile.town, profile.phone || '');
  UserState.firstName = profile.firstName || '';
  UserState.surname = profile.surname || '';
  localStorage.setItem('foromane_userId', profile.id);

  var assoc = window.BUSINESS_ASSOCIATIONS ? window.BUSINESS_ASSOCIATIONS[id] : null;
  if (assoc) {
    var biz = window.SAMPLE_BUSINESSES.find(function(b) { return b.id === assoc.businessId; });
    if (biz) {
      UserState.business = {
        id: biz.id, name: biz.name, category: biz.category,
        town: biz.location.split(',').pop().trim(),
        phone: biz.phone || '', subscription: biz.subscription || 'free',
        logo: biz.logo || '',
        description: biz.description || '',
        logoLandscape: biz.logoLandscape || '',
        categories: biz.categories || [biz.category].filter(Boolean),
        contacts: { calls: [], facebook: [], gps: [], whatsapp: [] }
      };
      UserState.businessRole = assoc.role;
      renderBusinessCard();
    }
    UserState.kpi = { ads: 0, views: 0, likes: 0, noteAdds: 0, interactions: 0 };
    UserState.interests = biz ? [biz.category] : [];
  } else {
    UserState.business = null;
    resetBusinessCard();
    UserState.kpi = { ads: 0, views: 0, likes: 0, noteAdds: 0, interactions: 0 };
    UserState.interests = [];
  }

  updateAccountHero();
  saveKpiToDB();
  updateKPI();
  updateAccountUI();
  renderAccount();
  closeModal('other-users-modal');
  reloadNotesForUser();
  showToast('Switched to ' + profile.name);
  goTo('view-account');
}

async function saveKpiToDB() {
  try {
    await ForomaneDB.put('kpi', { id: UserState.id, ...UserState.kpi });
    try {
      if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') {
        await window.SyncQueue.enqueue('kpi', { id: UserState.id, ...UserState.kpi }, { clientId: UserState.id });
        if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{});
      }
    } catch(e) { console.warn('Failed to enqueue KPI for sync:', e); }
  } catch(e) { console.error('Failed to save KPI to DB:', e); }
}

// ─── ROLE-BASED ACCORDION RENDERERS ───

function renderNotesAccordion() {
  var body = document.getElementById('notes-accordion-body');
  if (!body) return;
  if (UserState.isBrowser()) {
    body.innerHTML = '<div style="padding-top:8px;text-align:center;">' +
      '<p style="font-size:13px;color:var(--grey-dark);margin-bottom:12px;">Save and organise items from promos and catalogue. Create a profile to use Notes.</p>' +
      '<button class="btn btn-sm" onclick="goTo(\'view-register\');initRegisterView();" style="margin-bottom:8px;">Create Profile</button>' +
      '<button class="btn-outline btn-sm" onclick="goTo(\'view-login\')">Sign In</button>' +
    '</div>';
  } else {
    body.innerHTML = '<div style="padding-top:8px;display:flex;flex-direction:column;gap:8px;">' +
      '<button class="btn btn-sm" onclick="navTab(\'view-notes\',\'nav-notes\')">View Notes</button>' +
      '<button class="btn btn-sm" onclick="openModal(\'buy-notes-modal\')">Buy Notes</button>' +
    '</div>';
  }
}

function renderFavSuppliersAccordion() {
  var body = document.getElementById('fav-suppliers-accordion-body');
  if (!body) return;
  if (UserState.isBrowser()) {
    body.innerHTML = '<div style="padding-top:8px;text-align:center;">' +
      '<p style="font-size:13px;color:var(--grey-dark);margin-bottom:12px;">Like products, tradesmen, and suppliers for quick access. Create a profile to unlock this feature.</p>' +
      '<button class="btn btn-sm" onclick="goTo(\'view-register\');initRegisterView();" style="margin-bottom:8px;">Create Profile</button>' +
      '<button class="btn-outline btn-sm" onclick="goTo(\'view-login\')">Sign In</button>' +
    '</div>';
  } else {
    var favIds = UserState.favouriteSuppliers;
    var allProfs = window.DEMO_PROFILES || [];
    var allBizs = window.SAMPLE_BUSINESSES || [];
    var tradesmenCount = allProfs.filter(function(p) {
      return favIds.indexOf(p.id) !== -1 && p.role === 'Tradesperson (Contractor)';
    }).length;
    var suppliersCount = allBizs.filter(function(b) { return favIds.indexOf(b.id) !== -1; }).length
      + allProfs.filter(function(p) { return favIds.indexOf(p.id) !== -1 && p.role === 'Business & Materials Supplier'; }).length;
    var promosCount = JSON.parse(localStorage.getItem('foromane_liked_promos') || '[]').length;
    var likedItemsCount = JSON.parse(localStorage.getItem('foromane_liked_items') || '[]').length;
    body.innerHTML = '<div style="padding-top:8px;display:flex;flex-direction:column;gap:8px;">' +
      '<button class="btn" style="background:var(--orange);color:white;border:none;padding:12px;border-radius:1px;cursor:pointer;font-size:14px;font-weight:600;width:100%;" onclick="renderLikedList(\'promos\');goTo(\'view-favourite-suppliers\')"><i class="fas fa-bullhorn"></i> Promos' + (promosCount > 0 ? ' <span style="background:rgba(255,255,255,0.3);padding:2px 8px;border-radius:10px;font-size:12px;">' + promosCount + '</span>' : '') + '</button>' +
      '<button class="btn" style="background:var(--orange);color:white;border:none;padding:12px;border-radius:1px;cursor:pointer;font-size:14px;font-weight:600;width:100%;" onclick="renderLikedList(\'products\');goTo(\'view-favourite-suppliers\')"><i class="fas fa-box"></i> Products' + (likedItemsCount > 0 ? ' <span style="background:rgba(255,255,255,0.3);padding:2px 8px;border-radius:10px;font-size:12px;">' + likedItemsCount + '</span>' : '') + '</button>' +
      '<button class="btn" style="background:var(--orange);color:white;border:none;padding:12px;border-radius:1px;cursor:pointer;font-size:14px;font-weight:600;width:100%;" onclick="renderLikedList(\'tradesmen\');goTo(\'view-favourite-suppliers\')"><i class="fas fa-user-tie"></i> Tradesmen' + (tradesmenCount > 0 ? ' <span style="background:rgba(255,255,255,0.3);padding:2px 8px;border-radius:10px;font-size:12px;">' + tradesmenCount + '</span>' : '') + '</button>' +
      '<button class="btn" style="background:var(--orange);color:white;border:none;padding:12px;border-radius:1px;cursor:pointer;font-size:14px;font-weight:600;width:100%;" onclick="renderLikedList(\'suppliers\');goTo(\'view-favourite-suppliers\')"><i class="fas fa-store"></i> Suppliers' + (suppliersCount > 0 ? ' <span style="background:rgba(255,255,255,0.3);padding:2px 8px;border-radius:10px;font-size:12px;">' + suppliersCount + '</span>' : '') + '</button>' +
    '</div>';
  }
}

function renderBusinessCardHTML(biz) {
  if (!biz) return '<p style="font-size:13px;color:var(--grey-dark);padding-top:8px;margin-bottom:12px;">No business registered yet.</p>' +
    '<button class="btn" style="background:var(--orange);color:white;border:none;padding:12px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;width:100%;margin-bottom:8px;" onclick="openCreateBiz()"><i class="fas fa-plus"></i> + List Business</button>' +
    '<button class="btn-outline btn-sm" onclick="openJoinBusiness()" style="width:100%;"><i class="fas fa-user-plus"></i> Join Business</button>';
  
  var init = biz.name.split(' ').map(function(w) { return w[0]; }).join('').slice(0, 2).toUpperCase();

  var col = window.APP_COLORS[init.charCodeAt(0) % window.APP_COLORS.length];
  var nameEsc = biz.name.replace(/'/g, "\\'");
  var isStaff = UserState.businessRole === 'staff';

  var logoHtml = biz.logo
    ? '<img src="' + biz.logo + '" class="biz-logo-img" style="width:44px;height:44px;border-radius:6px;object-fit:cover;" loading="lazy" width="44" height="44">'
    : '<div class="biz-logo" style="background:' + col + ';">' + init + '</div>';

  var headerHtml = '<div class="listed-header">Listed</div>' +
    '<div class="biz-card-header" style="cursor:pointer;" onclick="toggleBizActions()">' +
      logoHtml +
      '<div class="biz-name-wrap"><h3>' + biz.name + '</h3><p>' + (biz.category || '') + ' \u00B7 ' + biz.town + '</p></div>' +
    '</div>';

  var actionsHtml = isStaff
    ? '<div style="padding:8px 16px;border-top:1px solid var(--grey-light);font-size:12px;color:var(--grey-dark);"><span style="background:var(--grey-light);padding:4px 8px;border-radius:4px;">Staff \u00B7 View only</span></div>'
    : '<div id="biz-actions-body" style="display:none;padding:10px 16px;border-top:1px solid var(--grey-light);">' +
        '<div class="biz-actions-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
          '<button class="biz-action-btn" onclick="openArtworkSubmission()"><i class="fab fa-facebook"></i> Facebook Boost</button>' +
          '<button class="biz-action-btn" onclick="openPromoModal()"><i class="fas fa-bullhorn"></i> Promos</button>' +
          '<button class="biz-action-btn" onclick="openCatalogueActions()"><i class="fas fa-list"></i> Catalogue</button>' +
          '<button class="biz-action-btn" onclick="openBusinessStaff(\'' + (biz.id || 'biz_user') + '\',\'' + nameEsc + '\')"><i class="fas fa-user-cog"></i> Staff</button>' +
          '<button class="biz-action-btn" onclick="renderPromoRequestsList()"><i class="fas fa-receipt"></i> Requests</button>' +
        '</div>' +
      '</div>';

  return headerHtml + actionsHtml;
}

function renderBusinessAccordion() {
  var body = document.getElementById('biz-accordion-body');
  if (!body) return;
  var s = UserState;

  if (s.isBrowser()) {
    body.innerHTML = '<div style="padding-top:8px;text-align:center;">' +
      '<p style="font-size:13px;color:var(--grey-dark);margin-bottom:12px;">List your business on Foromane to reach customers across Botswana. Create a profile to get started.</p>' +
      '<button class="btn" style="background:var(--orange);color:white;border:none;padding:12px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;width:100%;margin-bottom:8px;" onclick="goTo(\'view-register\');initRegisterView();">Create Profile</button>' +
      '<button class="btn-outline btn-sm" onclick="renderDirectory()" style="display:block;text-align:center;">Browse Directory</button>' +
    '</div>';
    return;
  }

  var hasBusiness = !!s.business;
  var isStaff = s.businessRole === 'staff';
  var biz = s.business;

  var html = '<div style="padding-top:8px;">' +
    renderProAccountSection();

  if (hasBusiness) {
    html += '<div style="border-top:1px solid var(--grey-light);margin-top:12px;padding-top:8px;" id="biz-card-content">' +
      renderBusinessCardHTML(biz) +
    '</div>';
  } else if (isStaff) {
    html += '<div style="border-top:1px solid var(--grey-light);margin-top:12px;padding-top:12px;">' +
      '<p style="font-size:13px;color:var(--grey-dark);">No business associated.</p>' +
    '</div>';
  }

  html +=
    '<div style="border-top:1px solid var(--grey-light);margin-top:12px;padding-top:10px;display:flex;flex-direction:column;gap:8px;">' +
      '<button onclick="openCreateBiz()" style="background:rgba(253,118,0,0.05);color:var(--orange);border:1px solid var(--orange);padding:12px;border-radius:1px;cursor:pointer;font-size:14px;font-weight:600;width:100%;"><i class="fas fa-plus"></i> Add Business</button>' +
      '<button onclick="openJoinBusiness()" style="background:rgba(253,118,0,0.05);color:var(--orange);border:1px solid var(--orange);padding:12px;border-radius:1px;cursor:pointer;font-size:14px;font-weight:600;width:100%;"><i class="fas fa-user-plus"></i> Join Business</button>' +
    '</div>';

  html += '</div>';
  body.innerHTML = html;
}

function renderProAccountPage() {
  var content = document.getElementById('pro-account-content');
  if (!content) return;
  var s = UserState;
  var isPro = s.isTradesperson();
  var claimedProId = getClaimedProId ? getClaimedProId(s.id) : null;
  var proListing = claimedProId && getProListing ? getProListing(claimedProId) : null;
  var profile = claimedProId && getProProfile ? getProProfile(claimedProId) : null;
  var services = claimedProId && window.getProServices ? getProServices(claimedProId) : [];

  var skills = profile ? profile.skills || [] : [];
  var portfolio = profile ? profile.portfolio || [] : [];
  var rateType = profile ? profile.rateType : 'quote';
  var rateVal = profile ? profile.rate : '';
  var availability = profile ? profile.availability : 'available';

  var tradeDisplayName = profile ? profile.primaryTrade || (listing ? listing.primaryTrade : '') : '';
  var availableSkills = [];
  if (window.SkillRatings && tradeDisplayName) {
    availableSkills = SkillRatings.getSkillsForTrade(tradeDisplayName);
  }
  if ((!availableSkills || availableSkills.length === 0) && tradeDisplayName && window.TRADE_TO_SKILL_KEY) {
    var upperKey = window.TRADE_TO_SKILL_KEY[tradeDisplayName];
    if (upperKey && window.TRADESMAN_SKILLS) {
      availableSkills = window.TRADESMAN_SKILLS[upperKey] || [];
    }
  }
  var skillsHtml = availableSkills.length > 0
    ? availableSkills.map(function(skillKey) {
        var checked = skills.indexOf(skillKey) !== -1 ? 'checked' : '';
        var displayName = window.SkillRatings ? SkillRatings.getSkillDisplayName(skillKey) : skillKey;
        return '<label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:13px;cursor:pointer;">' +
          '<input type="checkbox" ' + checked + ' onchange="toggleProSkill(\'' + skillKey + '\', this.checked)" style="accent-color:var(--orange);">' +
          '<span>' + displayName + '</span></label>';
      }).join('')
    : '<p style="font-size:12px;color:var(--grey-dark);padding:6px 0;">No skills defined for your trade yet.</p>';

  var projectsHtml = portfolio.length > 0
    ? portfolio.map(function(p, i) {
        var imgHtml = p.image ? '<img src="' + p.image.replace(/'/g, "\\'") + '" alt="' + (p.title || '').replace(/'/g, "\\'") + '" style="width:100%;max-height:180px;object-fit:cover;border-radius:4px;margin-top:6px;" loading="lazy">' : '';
        var videoHtml = p.videoUrl ? '<div style="margin-top:4px;"><a href="' + p.videoUrl.replace(/'/g, "\\'") + '" target="_blank" style="font-size:12px;color:var(--orange);"><i class="fab fa-facebook"></i> View Video</a></div>' : '';
        return '<div style="padding:8px;border:1px solid var(--grey-light);border-radius:8px;margin-bottom:6px;font-size:13px;">' +
          '<div style="display:flex;justify-content:space-between;">' +
            '<strong>' + (p.title || 'Project') + '</strong>' +
            '<span style="color:#e74c3c;cursor:pointer;font-size:14px;" onclick="removeProProjectInline(' + i + ')">✕</span>' +
          '</div>' +
          (p.description ? '<p style="font-size:12px;color:var(--grey-dark);margin:4px 0 0;">' + p.description + '</p>' : '') +
          imgHtml + videoHtml +
        '</div>';
      }).join('')
    : '<p style="font-size:12px;color:var(--grey-dark);padding:6px 0;">No projects added yet.</p>';

  var servicesHtml = services.length > 0
    ? services.map(function(svc) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid var(--grey-light);">' +
          '<div><div style="font-weight:600;font-size:13px;">' + svc.title + '</div>' +
          (svc.price ? '<div style="font-size:12px;color:var(--orange);">' + svc.price + '</div>' : '') +
          '</div>' +
          '<span style="color:#e74c3c;cursor:pointer;font-size:14px;" onclick="removeProServiceInline(' + (services.indexOf(svc)) + ')">✕</span>' +
        '</div>';
      }).join('')
    : '<p style="font-size:12px;color:var(--grey-dark);padding:6px 0;">No services added yet.</p>';

  var rateLabel = rateType === 'hourly' ? 'Per Hour' : rateType === 'fixed' ? 'Fixed Price' : 'Quote';
  var availLabel = availability === 'available' ? 'Available' : availability === 'busy' ? 'Busy' : 'Not Taking Jobs';
  var availColor = availability === 'available' ? 'var(--green, #27ae60)' : availability === 'busy' ? 'var(--orange)' : '#e74c3c';

  var html = '<div style="padding:12px;">' +
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">' +
      '<button onclick="goBack()" class="biz-back-round"><img src="assets/icons/solid/chevron-left_white.webp" style="width:16px;height:16px;display:block;"></button>' +
      '<span style="font-size:18px;font-weight:700;">Pro Account</span>' +
    '</div>' +
    '<div class="biz-header-card" style="padding:16px;border:1px solid var(--grey-light);border-radius:12px;margin-bottom:16px;">' +
      '<div style="display:flex;align-items:center;gap:12px;">' +
        '<div class="profile-avatar" style="width:120px;height:120px;font-size:56px;background:' + (proListing ? (proListing.color || '#fd7600') : '#fd7600') + ';">' +
          (proListing ? (proListing.initials || s.name.split(' ').map(function(w){return w[0]}).join('').slice(0,2).toUpperCase()) : '?') +
        '</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:16px;font-weight:700;">' + (proListing ? proListing.name : s.name) + '</div>' +
          '<div style="font-size:13px;color:var(--grey-dark);">' + (proListing ? (proListing.primaryTrade || 'Tradesperson') : 'Tradesperson') + '</div>' +
        '</div>' +
        (claimedProId ? '<span style="font-size:11px;color:var(--green, #27ae60);font-weight:600;background:#e8f5e9;padding:3px 8px;border-radius:4px;">Active</span>' : '') +
      '</div>' +
    '</div>' +
    '<div class="accordion" style="margin-bottom:8px;">' +
      '<div class="accordion-header" onclick="toggleAcc(this)"><span><i class="fas fa-id-card" style="color:var(--orange);margin-right:8px;"></i> Trade Identity</span></div>' +
      '<div class="accordion-body" style="padding:8px 12px;">' +
        '<label>First Name</label>' +
        '<input id="pro-trade-firstname" value="' + (claimedProId && profile ? (profile.firstName || (proListing ? proListing.name.split(' ')[0] || '' : '')) : '') + '" style="width:100%;padding:6px;border:1px solid var(--grey-light);border-radius:4px;font-size:12px;margin-bottom:8px;box-sizing:border-box;" placeholder="First name">' +
        '<label>Surname</label>' +
        '<input id="pro-trade-surname" value="' + (claimedProId && profile ? (profile.surname || (proListing ? proListing.name.split(' ').slice(1).join(' ') || '' : '')) : '') + '" style="width:100%;padding:6px;border:1px solid var(--grey-light);border-radius:4px;font-size:12px;box-sizing:border-box;" placeholder="Surname">' +
      '</div>' +
    '</div>';

  if (claimedProId) {
    html +=
      '<div class="accordion" style="margin-bottom:8px;">' +
        '<div class="accordion-header" onclick="toggleAcc(this)"><span><i class="fas fa-tools" style="color:var(--orange);margin-right:8px;"></i> Skills (' + skills.length + ')</span></div>' +
        '<div class="accordion-body" style="padding:8px 12px;">' +
          '<div id="pro-skills-inline-list">' + skillsHtml + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="accordion" style="margin-bottom:8px;">' +
        '<div class="accordion-header" onclick="toggleAcc(this)"><span><i class="fas fa-images" style="color:var(--orange);margin-right:8px;"></i> Projects (' + portfolio.length + ')</span></div>' +
        '<div class="accordion-body" style="padding:8px 12px;">' +
          '<div id="pro-projects-inline-list">' + projectsHtml + '</div>' +
          '<button onclick="openAddProProjectInline()" style="width:100%;display:flex;align-items:center;justify-content:center;gap:6px;background:var(--orange);color:white;border:none;padding:10px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;"><i class="fas fa-plus"></i> Add Project</button>' +
        '</div>' +
      '</div>' +
      '<div class="accordion" style="margin-bottom:8px;">' +
        '<div class="accordion-header" onclick="toggleAcc(this)"><span><i class="fas fa-tag" style="color:var(--orange);margin-right:8px;"></i> Rates</span></div>' +
        '<div class="accordion-body" style="padding:8px 12px;">' +
          '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
            '<div style="flex:1;">' +
              '<label style="font-size:11px;color:var(--grey-dark);">Rate Type</label>' +
              '<select id="pro-rate-type-inline" onchange="saveProRatesInline()" style="width:100%;padding:6px;border:1px solid var(--grey-light);border-radius:4px;font-size:12px;">' +
                '<option value="quote"' + (rateType === 'quote' ? ' selected' : '') + '>Quote</option>' +
                '<option value="hourly"' + (rateType === 'hourly' ? ' selected' : '') + '>Hourly</option>' +
                '<option value="fixed"' + (rateType === 'fixed' ? ' selected' : '') + '>Fixed</option>' +
              '</select>' +
            '</div>' +
            '<div style="flex:1;">' +
              '<label style="font-size:11px;color:var(--grey-dark);">Rate (Pula)</label>' +
              '<input id="pro-rate-value-inline" value="' + rateVal + '" onchange="saveProRatesInline()" placeholder="0" style="width:100%;padding:6px;border:1px solid var(--grey-light);border-radius:4px;font-size:12px;">' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<label style="font-size:11px;color:var(--grey-dark);">Availability</label>' +
            '<select id="pro-avail-inline" onchange="saveProRatesInline()" style="width:100%;padding:6px;border:1px solid var(--grey-light);border-radius:4px;font-size:12px;">' +
              '<option value="available"' + (availability === 'available' ? ' selected' : '') + '>Available</option>' +
              '<option value="busy"' + (availability === 'busy' ? ' selected' : '') + '>Busy</option>' +
              '<option value="not_taking"' + (availability === 'not_taking' ? ' selected' : '') + '>Not Taking Jobs</option>' +
            '</select>' +
          '</div>' +
          '<div style="margin-top:8px;padding:6px 10px;border-radius:6px;font-size:12px;background:var(--orange-light);">' +
            'Current: <strong>' + rateLabel + '</strong>' + (rateVal ? ' · P' + rateVal : '') +
            ' · <span style="color:' + availColor + ';">' + availLabel + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="accordion" style="margin-bottom:8px;">' +
        '<div class="accordion-header" onclick="toggleAcc(this)"><span><i class="fas fa-concierge-bell" style="color:var(--orange);margin-right:8px;"></i> Services (' + services.length + ')</span></div>' +
        '<div class="accordion-body" style="padding:8px 12px;">' +
          '<div id="pro-services-inline-list">' + servicesHtml + '</div>' +
          '<div style="border-top:1px solid var(--grey-light);padding-top:8px;margin-top:4px;">' +
            '<input id="pro-srv-title-inline" placeholder="Service title" style="width:100%;padding:6px;border:1px solid var(--grey-light);border-radius:4px;font-size:12px;margin-bottom:4px;box-sizing:border-box;">' +
            '<div style="display:flex;gap:6px;">' +
              '<input id="pro-srv-price-inline" placeholder="Price (e.g. P250/hr)" style="flex:1;padding:6px;border:1px solid var(--grey-light);border-radius:4px;font-size:12px;">' +
              '<button class="btn-sm" onclick="addProServiceInline()" style="background:var(--orange);color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">+ Add</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">' +
        '<button class="btn" style="background:var(--orange);color:white;border:none;padding:12px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;" onclick="openProEditor()"><i class="fas fa-edit"></i> Edit Profile</button>' +
        '<button class="btn-outline" style="padding:12px;border-radius:8px;cursor:pointer;font-size:14px;" onclick="openProProfile(\'' + claimedProId + '\')"><i class="fas fa-eye"></i> View Public Profile</button>' +
      '</div>';
  } else {
    html += '<div style="text-align:center;padding:24px 0;">' +
      '<p style="font-size:14px;color:var(--grey-dark);margin-bottom:16px;">Activate your Pro account to get discovered by customers. You\'ll appear in the directory when people search for your trade.</p>' +
      '<button class="btn" style="background:var(--orange);color:white;border:none;padding:14px 24px;border-radius:8px;cursor:pointer;font-size:15px;font-weight:600;" onclick="activateProAccount()"><i class="fas fa-user-tie"></i> Activate Pro Account</button>' +
    '</div>';
  }

  html += '</div>';
  content.innerHTML = html;
}

var _accDropdownActive = null;

function toggleAccountDropdown(type) {
  var container = document.getElementById('dd-acc-' + type);
  if (!container) return;

  if (_accDropdownActive === type) {
    container.classList.remove('active');
    _accDropdownActive = null;
    return;
  }

  document.querySelectorAll('#view-account .biz-dropdown-container').forEach(function(el) {
    el.classList.remove('active');
  });

  var inner = container.querySelector('.biz-dropdown-inner');
  if (inner && !inner.hasChildNodes()) {
    var items = [];
    if (type === 'call') {
      var mobiles = UserState.contacts.mobiles || [];
      if (mobiles.length === 0) {
        items.push({ label: 'No phone numbers', action: '', phone: '' });
      } else {
        mobiles.forEach(function(m, i) {
          items.push({ label: 'Mobile ' + (i + 1) + (m.isPrimary ? ' (Primary)' : ''), action: 'call', phone: m.number });
        });
      }
    } else if (type === 'facebook') {
      var fb = UserState.contacts.social.facebook || '';
      if (fb) {
        items.push({ label: 'Facebook Page', action: 'facebook', query: fb });
      } else {
        items.push({ label: 'No Facebook linked', action: '', phone: '' });
      }
    } else if (type === 'whatsapp') {
      var was = UserState.contacts.whatsapps || [];
      if (was.length === 0) {
        items.push({ label: 'No WhatsApp numbers', action: '', phone: '' });
      } else {
        was.forEach(function(w, i) {
          items.push({ label: 'WhatsApp ' + (i + 1) + (w.isPrimary ? ' (Primary)' : ''), action: 'whatsapp', phone: w.number, name: UserState.name });
        });
      }
    }

    inner.innerHTML = items.map(function(i) {
      var p1 = (i.phone || i.query || '').replace(/'/g, "\\'");
      var p2 = (i.name || '').replace(/'/g, "\\'");
      var iconName = i.action === 'call' ? 'phone-alt' : i.action === 'facebook' ? 'facebook-f' : i.action === 'whatsapp' ? 'whatsapp' : 'info-circle';
      var sub = '';
      if (i.action === 'call' && i.phone) sub = i.phone;
      else if (i.action === 'whatsapp' && i.phone) sub = i.phone;
      else if (i.action === 'facebook' && i.query) sub = 'Open Facebook';
      var clickHandler = '';
      if (i.action === 'call') clickHandler = "closeAccountDropdowns();window.open('tel:" + p1 + "')";
      else if (i.action === 'whatsapp') clickHandler = "closeAccountDropdowns();window.open('https://wa.me/" + p1.replace(/\+/g,'') + "?text=" + encodeURIComponent('Hello ' + p2 + ', I found you on Foromane Construction Hub.') + "','_blank')";
      else if (i.action === 'facebook') clickHandler = "closeAccountDropdowns();window.open('https://www.facebook.com/search/top?q=" + encodeURIComponent(p1) + "','_blank')";
      else clickHandler = 'closeAccountDropdowns()';
      return '<div class="biz-dd-row" onclick="' + clickHandler + '">' +
        '<div class="biz-dd-icon">' + (i.action === 'facebook' ? '<img src="assets/icons/facebook_icon_f.webp" style="width:20px;height:20px;object-fit:contain;">' : i.action === 'whatsapp' ? '<img src="assets/icons/whatsapp_icon_1.webp" style="width:20px;height:20px;object-fit:contain;">' : '<i class="fas fa-' + iconName + '"></i>') + '</div>' +
        '<div class="biz-dd-text"><h4>' + i.label + '</h4>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
      '</div>';
    }).join('');
  }

  container.classList.add('active');
  _accDropdownActive = type;
}

function closeAccountDropdowns() {
  document.querySelectorAll('#view-account .biz-dropdown-container').forEach(function(el) {
    el.classList.remove('active');
  });
  _accDropdownActive = null;
}

function addProSkillInline() {
  var input = document.getElementById('pro-skill-inline-input');
  if (!input) return;
  var skill = input.value.trim();
  if (!skill) { showToast('Enter a skill'); return; }
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var profile = getProProfile(claimedProId) || {};
  if (!profile.skills) profile.skills = [];
  if (profile.skills.indexOf(skill) === -1) profile.skills.push(skill);
  saveProProfile(claimedProId, profile);
  input.value = '';
  renderProAccountPage();
  showToast('Skill added');
}

function removeProSkillInline(skill) {
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var profile = getProProfile(claimedProId) || {};
  if (!profile.skills) return;
  profile.skills = profile.skills.filter(function(s) { return s !== skill; });
  saveProProfile(claimedProId, profile);
  renderProAccountPage();
  showToast('Skill removed');
}

function toggleProSkill(skillKey, checked) {
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var profile = getProProfile(claimedProId) || {};
  if (!profile.skills) profile.skills = [];
  if (checked) {
    if (profile.skills.indexOf(skillKey) === -1) profile.skills.push(skillKey);
  } else {
    profile.skills = profile.skills.filter(function(s) { return s !== skillKey; });
  }
  saveProProfile(claimedProId, profile);
  renderProAccountPage();
}

function openAddProProjectInline() {
  var modal = document.getElementById('generic-modal');
  if (!modal) return;
  document.getElementById('generic-modal-title').textContent = 'Add Project';
  document.getElementById('generic-modal-body').innerHTML =
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<label>Project Title</label><input id="pro-project-title-inline" style="padding:9px 10px;border:1px solid var(--grey-light);border-radius:6px;font-size:13px;">' +
      '<label>Description</label><textarea id="pro-project-desc-inline" rows="3" style="padding:9px 10px;border:1px solid var(--grey-light);border-radius:6px;font-size:13px;box-sizing:border-box;resize:vertical;font-family:var(--font-main);"></textarea>' +
      '<label>Image URL</label><input id="pro-project-image-inline" placeholder="https://..." style="padding:9px 10px;border:1px solid var(--grey-light);border-radius:6px;font-size:13px;">' +
      '<label>Video URL (Facebook / YouTube)</label><input id="pro-project-video-inline" placeholder="https://..." style="padding:9px 10px;border:1px solid var(--grey-light);border-radius:6px;font-size:13px;">' +
      '<div style="display:flex;gap:8px;">' +
        '<button class="btn btn-sm" onclick="saveProProjectInline()" style="flex:1;background:var(--orange);color:white;border:none;padding:9px 14px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">Add Project</button>' +
        '<button class="btn-outline btn-sm" onclick="closeModal(\'generic-modal\')" style="padding:9px 14px;border-radius:6px;cursor:pointer;font-size:13px;">Cancel</button>' +
      '</div>' +
    '</div>';
  openModal('generic-modal');
}

function saveProProjectInline() {
  var title = document.getElementById('pro-project-title-inline')?.value.trim();
  if (!title) { showToast('Enter a project title'); return; }
  var desc = document.getElementById('pro-project-desc-inline')?.value.trim() || '';
  var image = document.getElementById('pro-project-image-inline')?.value.trim() || '';
  var videoUrl = document.getElementById('pro-project-video-inline')?.value.trim() || '';
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var profile = getProProfile(claimedProId) || {};
  if (!profile.portfolio) profile.portfolio = [];
  profile.portfolio.push({ title: title, description: desc, image: image, videoUrl: videoUrl });
  saveProProfile(claimedProId, profile);
  closeModal('generic-modal');
  renderProAccountPage();
  showToast('Project added');
}

function removeProProjectInline(index) {
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var profile = getProProfile(claimedProId) || {};
  if (!profile.portfolio) return;
  profile.portfolio.splice(index, 1);
  saveProProfile(claimedProId, profile);
  renderProAccountPage();
  showToast('Project removed');
}

function saveProRatesInline() {
  var rateType = document.getElementById('pro-rate-type-inline')?.value;
  var rate = document.getElementById('pro-rate-value-inline')?.value || '';
  var availability = document.getElementById('pro-avail-inline')?.value;
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var profile = getProProfile(claimedProId) || {};
  profile.rateType = rateType;
  profile.rate = rate;
  profile.availability = availability;
  saveProProfile(claimedProId, profile);
  renderProAccountPage();
  showToast('Rates updated');
}

function addProServiceInline() {
  var title = document.getElementById('pro-srv-title-inline')?.value.trim();
  if (!title) { showToast('Enter a service title'); return; }
  var price = document.getElementById('pro-srv-price-inline')?.value.trim() || 'Quote';
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var services = getProServices(claimedProId) || [];
  services.push({ id: 'srv_' + Date.now(), title: title, price: price });
  saveProServices(claimedProId, services);
  document.getElementById('pro-srv-title-inline').value = '';
  document.getElementById('pro-srv-price-inline').value = '';
  renderProAccountPage();
  showToast('Service added');
}

function removeProServiceInline(idx) {
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var services = getProServices(claimedProId) || [];
  services.splice(idx, 1);
  saveProServices(claimedProId, services);
  renderProAccountPage();
  showToast('Service removed');
}

function activateProAccount() {
  var s = UserState;
  if (s.id === 'guest') {
    showToast('Create a profile first');
    goTo('view-register');initRegisterView();
    return;
  }
  s.role = 'Tradesperson (Contractor)';
  localStorage.setItem('foromane_role', 'Tradesperson (Contractor)');
  var demoPros = window.DEMO_PROFILES || [];
  var existing = demoPros.find(function(p) { return p.id === s.id; });
  if (existing && !getClaimedProId(s.id)) {
    var assoc = getProAssociations();
    assoc[s.id] = { proId: existing.id, role: 'owner' };
    saveProAssociations(assoc);
    var profile = defaultProProfile ? defaultProProfile(existing) : {};
    saveProProfile(existing.id, profile);
  }
  renderProAccountPage();
  updateAccountHero();
  renderDirectory();
  showToast('Pro account activated!');
}
window.renderProAccountPage = renderProAccountPage;
window.activateProAccount = activateProAccount;
window.toggleAccountDropdown = toggleAccountDropdown;
window.closeAccountDropdowns = closeAccountDropdowns;

function renderAccount() {
  renderNotesAccordion();
  renderFavSuppliersAccordion();
  renderBusinessAccordion();
}

function updateAccountUI() {
  updateAccountHero();
  renderOfflineSyncStatusBanner();
  const isGuest = UserState.id === 'guest';
  const isAdmin = UserState.role === 'Administrator';
  const guestCta = document.getElementById('guest-cta');

  const adminDash = document.getElementById('admin-dashboard-entry');
  if (adminDash) adminDash.style.display = isAdmin ? 'block' : 'none';

  var delRow = document.getElementById('delete-account-row');
  if (delRow) delRow.style.display = (isGuest || isAdmin) ? 'none' : '';

  if (isGuest) {
    if (guestCta) guestCta.style.display = 'block';
  } else {
    if (guestCta) guestCta.style.display = 'none';
  }

  renderAccount();
  if (window.renderBudgetSummary) window.renderBudgetSummary();
}

function toggleBizActions() {
  const body = document.getElementById('biz-actions-body');
  if (!body) return;
  body.style.display = body.style.display !== 'none' ? 'none' : 'block';
}

function renderBusinessCard() {
  const biz = UserState.business;
  if (!biz) return;
  const init = biz.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const col = window.APP_COLORS[init.charCodeAt(0) % window.APP_COLORS.length];
  const isPublic = biz.subscription === 'catalogue';
  const nameEsc = biz.name.replace(/'/g, "\\'");
  const isStaff = UserState.businessRole === 'staff';
  const bizDesc = (biz.description || '').replace(/'/g, "\\'");
  const logoHtml = biz.logo
    ? '<img src="' + biz.logo + '" class="biz-logo-img" style="width:44px;height:44px;border-radius:6px;object-fit:cover;" loading="lazy" width="44" height="44">'
    : '<div class="biz-logo" style="background:' + col + ';">' + init + '</div>';
  const actionsHtml = isStaff
    ? '<div style="padding:8px 16px;border-top:1px solid var(--grey-light);font-size:12px;color:var(--grey-dark);"><span style="background:var(--grey-light);padding:4px 8px;border-radius:4px;">Staff \u00B7 View only</span> <button class="btn-sm" style="margin-left:8px;background:var(--orange);color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;" onclick="openBusinessStaff(\'' + (biz.id || 'biz_user') + '\',\'' + nameEsc + '\')">Staff Panel</button></div>'
    : '<div id="biz-actions-body" style="display:none;padding:10px 16px;border-top:1px solid var(--grey-light);">' +
        '<div class="biz-actions-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
          '<button class="biz-action-btn" onclick="openBizProfile(\'biz_user\',\'' + nameEsc + '\',\'' + init + '\',\'' + col + '\',\'' + biz.town + '\',\'' + (biz.phone || '') + '\',' + isPublic + ',\'' + bizDesc + '\',true)"><i class="fas fa-eye"></i> View Profile</button>' +
          '<button class="biz-action-btn" onclick="openCatalogueActions()"><i class="fas fa-list"></i> Catalogue</button>' +
          '<button class="biz-action-btn" onclick="openPromoModal()"><i class="fas fa-bullhorn"></i> Promos</button>' +
          '<button class="biz-action-btn" onclick="openBusinessStaff(\'' + (biz.id || 'biz_user') + '\',\'' + nameEsc + '\')"><i class="fas fa-user-cog"></i> Staff</button>' +
        '</div>' +
      '</div>';
  const el = document.getElementById('biz-card-content');
  if (el) el.innerHTML =
    '<div class="listed-header">Listed</div>' +
    '<div class="biz-card-header" style="cursor:pointer;" onclick="toggleBizActions()">' +
      logoHtml +
      '<div class="biz-name-wrap"><h3>' + biz.name + '</h3><p>' + biz.category + ' \u00B7 ' + biz.town + '</p></div>' +
    '</div>' + actionsHtml;
}

function resetBusinessCard() {
  var el = document.getElementById('biz-card-content');
  if (!el) return;
  el.innerHTML = '<p style="font-size:13px;color:var(--grey-dark);padding-top:8px;margin-bottom:12px;">No business registered yet.</p>' +
    '<button class="btn btn-sm" onclick="openCreateBiz()" style="margin-bottom:6px;width:100%;">+ List Business</button>' +
    '<button class="btn-outline btn-sm" onclick="openCreateProProfile()" style="width:100%;margin-bottom:4px;"><i class="fas fa-user-tie"></i> List as Pro</button>' +
    '<button class="btn-outline btn-sm" onclick="openJoinBusiness()" style="width:100%;"><i class="fas fa-user-plus"></i> Join Business</button>';
}

function renderOfflineSyncStatusBanner() {
  var banner = document.getElementById('offline-sync-status-banner');
  var text = document.getElementById('offline-sync-status-text');
  var action = document.getElementById('offline-sync-status-action');
  var secondary = document.getElementById('offline-sync-status-secondary-action');
  if (!banner || !text || !action || !secondary) return;

  if (UserState.syncStatus === 'pending') {
    banner.style.display = '';
    text.innerHTML = 'Your profile is saved locally and will sync automatically when online. Review status or retry sync manually if needed.';
    action.textContent = 'Review status';
    secondary.textContent = 'Retry sync';
    action.onclick = openOfflineSyncReview;
    secondary.onclick = retryOfflineSync;
    return;
  }

  if (UserState.syncStatus === 'conflict') {
    banner.style.display = '';
    text.innerHTML = 'This profile has a credential conflict and requires review before it can sync to the cloud.';
    action.textContent = 'Review conflict';
    secondary.textContent = 'Retry sync';
    action.onclick = openOfflineSyncReview;
    secondary.onclick = retryOfflineSync;
    return;
  }

  banner.style.display = 'none';
}

function openOfflineSyncReview() {
  var titleEl = document.getElementById('generic-modal-title');
  var bodyEl = document.getElementById('generic-modal-body');
  if (!titleEl || !bodyEl) return;

  var status = UserState.syncStatus;
  var html = '<div style="display:flex;flex-direction:column;gap:14px;">';

  if (status === 'pending') {
    titleEl.textContent = 'Offline Sync Pending';
    html += '<p>Your profile is currently stored locally and will be synced when the app detects an online connection.</p>';
    html += '<p><strong>Profile:</strong> ' + escapeHtml(UserState.name || UserState.id || 'Unknown') + '</p>';
    html += '<p><strong>State:</strong> Pending upload</p>';
  } else if (status === 'conflict') {
    titleEl.textContent = 'Offline Sync Conflict';
    html += '<p>There is a conflict with your offline profile credentials. Review the details below before retrying sync.</p>';
    if (UserState.conflictType) {
      html += '<p><strong>Conflict type:</strong> ' + escapeHtml(UserState.conflictType) + '</p>';
    }
    if (UserState.conflictValue) {
      html += '<p><strong>Conflict value:</strong> ' + escapeHtml(UserState.conflictValue) + '</p>';
    }
    if (UserState.conflictExistingProfileId) {
      html += '<p><strong>Existing account:</strong> ' + escapeHtml(UserState.conflictExistingProfileId) + '</p>';
    }
    if (UserState.syncError) {
      html += '<p><strong>Last error:</strong> ' + escapeHtml(UserState.syncError) + '</p>';
    }
    if (UserState.conflictType) {
      var conflictLabel = UserState.conflictType === 'phone' ? 'mobile number' :
                          UserState.conflictType === 'whatsapp' ? 'WhatsApp number' :
                          UserState.conflictType;
      var inputType = (UserState.conflictType === 'phone' || UserState.conflictType === 'whatsapp') ? 'tel' : 'text';
      html += '<div style="display:flex;flex-direction:column;gap:8px;">' +
              '<label for="offline-conflict-value">New ' + escapeHtml(conflictLabel) + '</label>' +
              '<input id="offline-conflict-value" type="' + inputType + '" value="' + escapeHtml(UserState.conflictValue || '') + '" placeholder="Enter a different ' + escapeHtml(conflictLabel) + '" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;">' +
              '<small style="color:#666;line-height:1.4;">Use a different value that is not already registered.</small>' +
              '</div>';
    }
  } else {
    titleEl.textContent = 'Offline Sync Status';
    html += '<p>No pending offline profile sync is currently active.</p>';
  }

  html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">';
  if (status === 'conflict') {
    html += '<button class="btn" onclick="resolveOfflineConflict();">Resolve conflict</button>';
  }
  html += '<button class="btn" onclick="retryOfflineSync();">Retry Sync</button>';
  if (status === 'conflict') {
    html += '<button class="btn-outline" onclick="discardOfflineSyncProfile();">Discard Local Profile</button>';
  }
  html += '<button class="btn-outline" onclick="closeModal(\'generic-modal\');">Close</button>';
  html += '</div>';
  html += '</div>';

  bodyEl.innerHTML = html;
  openModal('generic-modal');
}

async function retryOfflineSync() {
  try {
    if (typeof window.syncPendingOfflineProfiles !== 'function') {
      throw new Error('Offline sync helper unavailable');
    }
    var result = await window.syncPendingOfflineProfiles();
    if (result && result.synced > 0) {
      showToast(result.synced + ' profile(s) synced successfully');
      closeModal('generic-modal');
    }
    if (result && result.conflicts > 0) {
      showToast(result.conflicts + ' profile(s) still require review');
    }
    if (typeof window.refreshCurrentOfflineProfileState === 'function') {
      await window.refreshCurrentOfflineProfileState();
    }
    updateAccountUI();
  } catch (err) {
    console.warn('Retry offline sync failed:', err);
    showToast('Retry failed. Check console for details.');
  }
}

async function resolveOfflineConflict() {
  try {
    if (typeof window.updateOfflineProfileCredential !== 'function') {
      throw new Error('Conflict resolution helper unavailable');
    }
    var type = UserState.conflictType;
    var input = document.getElementById('offline-conflict-value');
    if (!input) {
      throw new Error('Conflict value input not found.');
    }
    var newValue = input.value.trim();
    if (!newValue) {
      showToast('Enter a new ' + type + ' to resolve the conflict.');
      return;
    }
    await window.updateOfflineProfileCredential(UserState.id, type, newValue);
    if (typeof window.refreshCurrentOfflineProfileState === 'function') {
      await window.refreshCurrentOfflineProfileState();
    }
    updateAccountUI();
    showToast('Conflict updated. Retry sync now.');
    openOfflineSyncReview();
  } catch (err) {
    console.warn('Resolve offline conflict failed:', err);
    showToast(err.message || 'Could not resolve conflict');
  }
}

async function discardOfflineSyncProfile() {
  try {
    if (typeof window.discardPendingOfflineProfile !== 'function') {
      throw new Error('Discard helper unavailable');
    }
    await window.discardPendingOfflineProfile(UserState.id);
    showToast('Local offline profile discarded');
    UserState.clear();
    location.reload();
  } catch (err) {
    console.warn('Failed to discard offline profile:', err);
    showToast('Could not discard offline profile');
  }
}

async function updateKPI() {
  var el;
  el = document.getElementById('kpi-ads'); if (el) el.textContent = UserState.kpi.ads;
  el = document.getElementById('kpi-views'); if (el) el.textContent = UserState.kpi.views;
  el = document.getElementById('kpi-likes'); if (el) el.textContent = UserState.kpi.likes;
  el = document.getElementById('kpi-note-adds'); if (el) el.textContent = UserState.kpi.noteAdds;
  await saveKpiToDB();
}

function readFileAsDataURL(file) {
  return new Promise(function(resolve) {
    if (!file) { resolve(''); return; }
    var reader = new FileReader();
    reader.onload = function(e) { resolve(e.target.result); };
    reader.readAsDataURL(file);
  });
}

function handleBizLogoUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  readFileAsDataURL(file).then(function(url) {
    if (url) {
      var img = document.getElementById('biz-thumb-img');
      if (img) img.src = url;
    }
  });
}
function handleBizLandscapeUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  var lfEl = document.getElementById('biz-landscape-filename');
  if (lfEl) lfEl.textContent = 'Tap to view landscape logo';
  readFileAsDataURL(file).then(function(url) {
    if (url) {
      var img = document.getElementById('biz-landscape-img');
      var placeholder = document.getElementById('biz-landscape-placeholder');
      if (img) { img.src = url; img.style.display = 'block'; }
      if (placeholder) placeholder.style.display = 'none';
    }
  });
}

function openCreateBiz() {
  var biz = UserState.business;
  var isEdit = !!biz;
  var titleEl = document.getElementById('biz-modal-title');
  if (titleEl) titleEl.textContent = isEdit ? 'Business Details' : 'Add Business';

  document.getElementById('biz-name').value = biz ? (biz.name || '') : '';
  document.getElementById('biz-description').value = biz ? (biz.description || '') : '';

  var thumbImg = document.getElementById('biz-thumb-img');
  if (thumbImg) {
    thumbImg.src = biz && biz.logo ? biz.logo : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  var landscapeImg = document.getElementById('biz-landscape-img');
  var placeholder = document.getElementById('biz-landscape-placeholder');
  if (landscapeImg && placeholder) {
    if (biz && biz.logoLandscape) {
      landscapeImg.src = biz.logoLandscape;
      landscapeImg.style.display = 'block';
      placeholder.style.display = 'none';
    } else {
      landscapeImg.src = '';
      landscapeImg.style.display = 'none';
      placeholder.style.display = 'flex';
    }
  }

  var lfEl = document.getElementById('biz-landscape-filename');
  if (lfEl) {
    lfEl.textContent = biz && biz.logoLandscape ? 'Tap to view landscape logo' : '';
  }

  var catCount = document.getElementById('biz-cat-count');
  var cats = (biz && biz.categories) || [];
  if (catCount) catCount.textContent = cats.length + ' selected.';

  renderBizContactSection();
  renderBizHoursSection();

  var staffNotice = document.getElementById('biz-staff-notice');
  if (staffNotice) {
    staffNotice.style.display = UserState.businessRole === 'staff' ? 'block' : 'none';
  }

  openModal('biz-modal');
}

async function saveBusiness() {
  var name = document.getElementById('biz-name').value.trim();
  var description = document.getElementById('biz-description').value.trim();

  if (!name) { showToast('Please enter a business name'); return; }

  var logoInput = document.getElementById('biz-logo-input');
  var landscapeInput = document.getElementById('biz-landscape-input');
  var logoFile = logoInput && logoInput.files[0] ? logoInput.files[0] : null;
  var landscapeFile = landscapeInput && landscapeInput.files[0] ? landscapeInput.files[0] : null;

  var oldLogo = UserState.business ? UserState.business.logo : '';
  var oldLandscape = UserState.business ? UserState.business.logoLandscape : '';
  var logoDataUrl = logoFile ? await readFileAsDataURL(logoFile) : oldLogo;
  var landscapeDataUrl = landscapeFile ? await readFileAsDataURL(landscapeFile) : oldLandscape;

  var contacts = (UserState.business && UserState.business.contacts) || { calls: [], facebook: [], gps: [], whatsapp: [] };
  var categories = (UserState.business && UserState.business.categories) || [];
  var category = categories.length > 0 ? categories[0] : 'Timber & Boards';
  var town = UserState.business ? UserState.business.town : 'Gaborone';
  var phone = UserState.business ? UserState.business.phone : '';
  var bizId = UserState.business ? UserState.business.id : 'biz_user';
  var sub = UserState.business ? UserState.business.subscription : 'free';

  var retailHours = readBizHoursForm();

  UserState.business = {
    id: bizId, name: name, category: category,
    town: town, phone: phone, subscription: sub,
    logo: logoDataUrl, description: description,
    logoLandscape: landscapeDataUrl,
    categories: categories, contacts: contacts,
    retailHours: retailHours
  };
  UserState.businessRole = UserState.businessRole || 'owner';
  UserState.role = 'Business & Materials Supplier';
  localStorage.setItem('foromane_role', 'Business & Materials Supplier');
  updateAccountHero();

  if (!window.BUSINESS_ASSOCIATIONS) window.BUSINESS_ASSOCIATIONS = {};
  window.BUSINESS_ASSOCIATIONS[UserState.id] = { businessId: bizId, role: UserState.businessRole };

  var bizLocal = { id: bizId, ...UserState.business };

  try {
    if (window.syncBusinessOnboarding) {
      showToast('Syncing business...');
      var businessData = { name: name, category: category, town: town, phone: phone, subscription: sub, logoFile: logoFile, bannerFile: landscapeFile };
      await window.syncBusinessOnboarding(businessData);
    }
    await ForomaneDB.put('businesses', bizLocal);
  } catch (error) {
    console.error('Business save error:', error);
  }

  renderBusinessCard();
  closeModal('biz-modal');
  renderDirectory();
  showToast('Business saved');
}

function shareApp() {
  const text = "Check out Foromane Construction Hub - Botswana's premier B2B marketplace for building materials and trades!";
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

async function upgradeSubscription(tier) {
  if (!UserState.business) { showToast('Please add a business first'); return; }
  if (tier === 'boost') {
    UserState.business.subscription = 'boost';
    try { await ForomaneDB.put('businesses', { id: 'biz_user', ...UserState.business }); } catch(e) {}
    try { if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') { await window.SyncQueue.enqueue('businesses', { id: 'biz_user', ...UserState.business }, { clientId: UserState.id }); if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{}); } } catch(e) { console.warn('Failed to enqueue business update for sync:', e); }
    renderBusinessCard(); renderDirectory();
    showToast('✅ Directory & Boost activated! (P300/yr)');
  } else if (tier === 'catalogue') {
    UserState.business.subscription = 'catalogue';
    try { await ForomaneDB.put('businesses', { id: 'biz_user', ...UserState.business }); } catch(e) {}
      try { if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') { await window.SyncQueue.enqueue('businesses', { id: 'biz_user', ...UserState.business }, { clientId: UserState.id }); if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{}); } } catch(e) { console.warn('Failed to enqueue business update for sync:', e); }
    renderBusinessCard(); renderDirectory();
    showToast('✅ Public Catalogue activated! (P1,000)');
  }
  updateSubStatus();
}

function updateSubStatus() {
  const el = document.getElementById('sub-tier-name');
  if (!el || !UserState.business) return;
  const sub = UserState.business.subscription || 'free';
  const labels = { free: 'Free Onboarding', boost: 'Directory & Boost', catalogue: 'Public Catalogue' };
  el.textContent = labels[sub] || 'Free Plan';
}

// ─── SETTINGS FUNCTIONS ───
function installApp() {
  var prompt = window._installPrompt;
  if (prompt) {
    prompt.prompt();
    prompt.userChoice.then(function(result) {
      if (result.outcome === 'accepted') showToast('App installed!');
      else showToast('Install cancelled');
      window._installPrompt = null;
    });
  } else {
    showToast('App already installed or not supported');
  }
}

async function clearAppCache() {
  try {
    var stores = ['users','businesses','items','promos','notes','kpi','filters','profiles','credentials','mediaCache'];
    for (var i = 0; i < stores.length; i++) {
      if (ForomaneDB.db && ForomaneDB.db.objectStoreNames.contains(stores[i])) {
        await ForomaneDB.clear(stores[i]);
      }
    }
  } catch(e) { console.warn('Failed to clear some IndexedDB stores:', e); }

  try {
    var cacheKeys = await caches.keys();
    for (var j = 0; j < cacheKeys.length; j++) {
      await caches.delete(cacheKeys[j]);
    }
  } catch(e) { console.warn('Failed to clear caches:', e); }

  localStorage.clear();
  UserState.clear();
  showToast('Cache cleared');
}

function deleteAccount() {
  var isReal = window.Auth && window.Auth.isRealUser();
  if (!isReal) {
    showToast('Guest and demo accounts cannot be deleted');
    return;
  }
  openModal('delete-account-modal');
}

async function confirmDeleteAccount() {
  closeModal('delete-account-modal');

  try {
    var stores = ['users','businesses','items','promos','notes','kpi','filters','profiles','credentials','mediaCache'];
    for (var i = 0; i < stores.length; i++) {
      if (ForomaneDB.db && ForomaneDB.db.objectStoreNames.contains(stores[i])) {
        await ForomaneDB.clear(stores[i]);
      }
    }
  } catch(e) { console.warn('Failed to clear stores:', e); }

  try {
    var cacheKeys = await caches.keys();
    for (var j = 0; j < cacheKeys.length; j++) {
      await caches.delete(cacheKeys[j]);
    }
  } catch(e) { console.warn('Failed to clear caches:', e); }

  localStorage.clear();
  UserState.clear();
  showToast('Account deleted');

  document.getElementById('view-welcome')?.classList.add('active');
  var activeView = document.querySelector('.view.active');
  if (activeView) activeView.classList.remove('active');
  if (window.manageUI) manageUI('view-welcome');
}

// ─── PROFESSIONAL PROFILE ───

function getDefaultProProfile() {
  return {
    name: UserState.firstName + ' ' + UserState.surname,
    tradeCategory: '',
    phone: UserState.mobile || '',
    location: UserState.location.town || 'Gaborone',
    description: '',
    skills: [],
    projects: [],
    subscription: { type: '', expiresAt: null, status: 'pending' }
  };
}

function openCreateProProfile() {
  var existing = UserState.professional;
  var data = existing || getDefaultProProfile();
  var modal = document.getElementById('generic-modal');
  if (!modal) return;
  document.getElementById('generic-modal-title').textContent = existing ? 'Edit Professional Profile' : 'Create Professional Profile';
  document.getElementById('generic-modal-body').innerHTML =
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<label>Full Name</label><input id="pro-name" value="' + (data.name||'').replace(/"/g,'&quot;') + '" style="padding:8px;border:1px solid var(--grey-light);border-radius:6px;font-size:14px;">' +
      '<label>Trade Category</label><select id="pro-trade" style="padding:8px;border:1px solid var(--grey-light);border-radius:6px;font-size:14px;">' +
        ['Plumber','Electrician','Carpenter','Painter','Builder','Tiler','Roofer','Gardener','Welder','Other'].map(function(t) {
          return '<option value="' + t + '"' + (data.tradeCategory === t ? ' selected' : '') + '>' + t + '</option>';
        }).join('') +
      '</select>' +
      '<label>Phone</label><input id="pro-phone" value="' + (data.phone||'').replace(/"/g,'&quot;') + '" style="padding:8px;border:1px solid var(--grey-light);border-radius:6px;font-size:14px;">' +
      '<label>Location</label><input id="pro-location" value="' + (data.location||'').replace(/"/g,'&quot;') + '" style="padding:8px;border:1px solid var(--grey-light);border-radius:6px;font-size:14px;">' +
      '<label>Description</label><textarea id="pro-desc" rows="3" style="padding:8px;border:1px solid var(--grey-light);border-radius:6px;font-size:14px;">' + (data.description||'') + '</textarea>' +
      '<div style="background:var(--orange-light);border-radius:8px;padding:10px;font-size:12px;color:var(--orange);">' +
        '<strong>Pricing:</strong> P50.00 for 30 days or P400.00 for 1 year. Admin approval required.' +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button class="btn btn-sm" onclick="saveProProfile()" style="flex:1;">' + (existing ? 'Save Changes' : 'Submit for Approval') + '</button>' +
        '<button class="btn-outline btn-sm" onclick="closeModal(\'generic-modal\')">Cancel</button>' +
      '</div>' +
    '</div>';
  openModal('generic-modal');
}

function saveProProfile() {
  var name = document.getElementById('pro-name')?.value.trim();
  if (!name) { showToast('Please enter your name'); return; }
  var data = UserState.professional || getDefaultProProfile();
  data.name = name;
  data.tradeCategory = document.getElementById('pro-trade')?.value || '';
  data.phone = document.getElementById('pro-phone')?.value.trim() || '';
  data.location = document.getElementById('pro-location')?.value.trim() || '';
  data.description = document.getElementById('pro-desc')?.value.trim() || '';
  if (!data.subscription || !data.subscription.type) {
    data.subscription = { type: '30d', expiresAt: null, status: 'pending' };
  }
  UserState.professional = data;
  closeModal('generic-modal');
  renderBusinessAccordion();
  showToast('Professional profile saved! Pending admin approval.');
}

function renderProProfileAccordion() {
  var data = UserState.professional || getDefaultProProfile();
  var hasProfile = !!(data.name && data.tradeCategory);
  var skillsHtml = data.skills && data.skills.length
    ? data.skills.map(function(s) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--grey-light);font-size:13px;">' +
          '<span>' + s + '</span>' +
          '<span style="color:#e74c3c;cursor:pointer;font-size:12px;" onclick="removeProSkill(\'' + s.replace(/'/g,"\\'") + '\')">✕</span>' +
        '</div>';
      }).join('')
    : '<p style="font-size:12px;color:var(--grey-dark);">No skills added yet.</p>';
  var projectsHtml = data.projects && data.projects.length
    ? data.projects.map(function(p, i) {
        return '<div style="padding:8px;border:1px solid var(--grey-light);border-radius:8px;margin-bottom:8px;font-size:13px;">' +
          '<div style="display:flex;justify-content:space-between;"><strong>' + p.title + '</strong>' +
          '<span style="color:#e74c3c;cursor:pointer;" onclick="removeProProject(' + i + ')">✕</span></div>' +
          (p.description ? '<p style="font-size:12px;color:var(--grey-dark);margin:4px 0 0;">' + p.description + '</p>' : '') +
        '</div>';
      }).join('')
    : '<p style="font-size:12px;color:var(--grey-dark);">No projects added yet.</p>';
  return '<div class="sub-accordion">' +
    '<div class="sub-accordion-header" onclick="toggleSubAcc(this)">Professional Profile</div>' +
    '<div class="sub-accordion-body">' +
      (hasProfile
        ? '<div style="padding:8px 0;"><p><strong>' + data.name + '</strong> · ' + data.tradeCategory + '</p>' +
          '<p style="font-size:12px;color:var(--grey-dark);">' + data.location + (data.phone ? ' · ' + data.phone : '') + '</p>' +
          (data.description ? '<p style="font-size:12px;color:var(--grey-dark);margin-top:4px;">' + data.description + '</p>' : '') +
          '<button class="btn-outline btn-sm" onclick="openCreateProProfile()" style="margin-top:8px;width:100%;">Edit Profile</button>' +
          '<div style="margin-top:8px;font-size:11px;color:var(--orange);background:var(--orange-light);padding:6px 10px;border-radius:6px;">' +
            'Status: <strong>' + (data.subscription.status === 'approved' ? 'Approved' : 'Pending Approval') + '</strong>' +
          '</div></div>'
        : '<div style="padding:8px 0;text-align:center;">' +
          '<p style="font-size:13px;color:var(--grey-dark);margin-bottom:8px;">No professional profile yet.</p>' +
          '<button class="btn btn-sm" onclick="openCreateProProfile()">Create Professional Profile</button>' +
          '<p style="font-size:11px;color:var(--grey-dark);margin-top:8px;">P50/30d or P400/yr · Admin approval required</p></div>'
      ) +
      '<div class="sub-accordion" style="margin-top:8px;">' +
        '<div class="sub-accordion-header" onclick="toggleSubAcc(this)">Skills (' + (data.skills||[]).length + ')</div>' +
        '<div class="sub-accordion-body">' +
          skillsHtml +
          '<div style="display:flex;gap:6px;margin-top:8px;"><input id="new-skill-input" placeholder="Add a skill" style="flex:1;padding:6px 8px;border:1px solid var(--grey-light);border-radius:4px;font-size:12px;"><button class="btn-sm" onclick="addProSkill()" style="background:var(--orange);color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">Add</button></div>' +
        '</div>' +
      '</div>' +
      '<div class="sub-accordion" style="margin-top:4px;">' +
        '<div class="sub-accordion-header" onclick="toggleSubAcc(this)">Projects (' + (data.projects||[]).length + ')</div>' +
        '<div class="sub-accordion-body">' +
          projectsHtml +
          '<button class="btn-outline btn-sm" onclick="openAddProProject()" style="width:100%;margin-top:4px;">+ Add Project</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function addProSkill() {
  var input = document.getElementById('new-skill-input');
  if (!input) return;
  var skill = input.value.trim();
  if (!skill) { showToast('Enter a skill'); return; }
  var data = UserState.professional || getDefaultProProfile();
  if (!data.skills) data.skills = [];
  if (data.skills.indexOf(skill) === -1) data.skills.push(skill);
  UserState.professional = data;
  renderBusinessAccordion();
  showToast('Skill added');
}

function removeProSkill(skill) {
  var data = UserState.professional;
  if (!data || !data.skills) return;
  data.skills = data.skills.filter(function(s) { return s !== skill; });
  UserState.professional = data;
  renderBusinessAccordion();
  showToast('Skill removed');
}

function openAddProProject() {
  var modal = document.getElementById('generic-modal');
  if (!modal) return;
  document.getElementById('generic-modal-title').textContent = 'Add Project';
  document.getElementById('generic-modal-body').innerHTML =
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<label>Project Title</label><input id="pro-project-title" style="padding:8px;border:1px solid var(--grey-light);border-radius:6px;font-size:14px;">' +
      '<label>Description</label><textarea id="pro-project-desc" rows="3" style="padding:8px;border:1px solid var(--grey-light);border-radius:6px;font-size:14px;"></textarea>' +
      '<div style="display:flex;gap:8px;">' +
        '<button class="btn btn-sm" onclick="saveProProject()" style="flex:1;">Add Project</button>' +
        '<button class="btn-outline btn-sm" onclick="closeModal(\'generic-modal\')">Cancel</button>' +
      '</div>' +
    '</div>';
  openModal('generic-modal');
}

function saveProProject() {
  var title = document.getElementById('pro-project-title')?.value.trim();
  if (!title) { showToast('Enter a project title'); return; }
  var desc = document.getElementById('pro-project-desc')?.value.trim() || '';
  var data = UserState.professional || getDefaultProProfile();
  if (!data.projects) data.projects = [];
  data.projects.push({ title: title, description: desc });
  UserState.professional = data;
  closeModal('generic-modal');
  renderBusinessAccordion();
  showToast('Project added');
}

function removeProProject(index) {
  var data = UserState.professional;
  if (!data || !data.projects) return;
  data.projects.splice(index, 1);
  UserState.professional = data;
  renderBusinessAccordion();
  showToast('Project removed');
}

window.addProSkillInline = addProSkillInline;
window.removeProSkillInline = removeProSkillInline;
window.openAddProProjectInline = openAddProProjectInline;
window.saveProProjectInline = saveProProjectInline;
window.removeProProjectInline = removeProProjectInline;
window.saveProRatesInline = saveProRatesInline;
window.addProServiceInline = addProServiceInline;
window.removeProServiceInline = removeProServiceInline;

/* ─── LOGO PREVIEW ─── */
function openBizLandscapePreview() {
  var landscapeImg = document.getElementById('biz-landscape-img');
  var placeholder = document.getElementById('biz-landscape-placeholder');
  if (!landscapeImg) return;
  if (!landscapeImg.src || (placeholder && placeholder.style.display !== 'none')) { showToast('No landscape logo set'); return; }
  var img = document.getElementById('logo-preview-img');
  var overlay = document.getElementById('logo-preview-overlay');
  if (img && overlay) { img.src = landscapeImg.src; overlay.classList.add('open'); }
}
function closeLogoPreview() {
  var overlay = document.getElementById('logo-preview-overlay');
  if (overlay) overlay.classList.remove('open');
}
window.handleBizLogoUpload = handleBizLogoUpload;
window.handleBizLandscapeUpload = handleBizLandscapeUpload;
window.openBizLandscapePreview = openBizLandscapePreview;
window.closeLogoPreview = closeLogoPreview;

/* ─── BUSINESS CONTACT ENTRIES (add/remove like mobile entries) ─── */
var _nextBizContactId = 1;
function genBizContactId() { return 'bc_' + (_nextBizContactId++); }

function renderBizContactSection() {
  var body = document.getElementById('biz-contact-body');
  if (!body) return;
  var biz = UserState.business;
  var contacts = (biz && biz.contacts) || { calls: [], facebook: [], gps: [], whatsapp: [] };
  var types = [
    { key: 'calls', label: 'Call', icon: 'phone-alt', placeholder: '+267 7X XXX XXX' },
    { key: 'facebook', label: 'Facebook', icon: 'facebook-f', placeholder: 'Page name or URL' },
    { key: 'gps', label: 'GPS', icon: 'map-marker-alt', placeholder: 'Google Maps link' },
    { key: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', placeholder: '+267 7X XXX XXX' }
  ];
  var html = '<div style="padding-top:4px;">';
  types.forEach(function(t) {
    var entries = contacts[t.key] || [];
    html += '<div style="margin-bottom:10px;">' +
      '<div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;padding:4px 0;border-bottom:1px solid var(--grey-light);margin-bottom:4px;">' +
        '<i class="fas fa-' + t.icon + '" style="color:var(--orange);width:16px;"></i> ' + t.label +
        ' <span style="font-size:11px;color:var(--grey-dark);font-weight:400;">(' + entries.length + ')</span>' +
      '</div>';
    if (entries.length === 0) {
      html += '<p style="font-size:12px;color:var(--grey-dark);padding:4px 0;margin:0;">No ' + t.label.toLowerCase() + ' entries yet.</p>';
    } else {
      entries.forEach(function(e, i) {
        var idAttr = 'biz-cnt-' + t.key + '-' + i;
        html += '<div class="contact-entry" id="' + idAttr + '" style="padding:4px 0;">' +
          '<label style="font-size:11px;">Title</label>' +
          '<input value="' + (e.title || '').replace(/"/g,'&quot;') + '" onchange="updateBizContactField(\'' + t.key + '\',' + i + ',\'title\',this.value)" placeholder="e.g. ' + t.label + ' Department" style="width:100%;padding:6px 8px;border:1px solid var(--grey-light);border-radius:4px;font-size:12px;box-sizing:border-box;margin-bottom:2px;">' +
          '<label style="font-size:11px;">Value</label>' +
          '<input value="' + (e.value || '').replace(/"/g,'&quot;') + '" onchange="updateBizContactField(\'' + t.key + '\',' + i + ',\'value\',this.value)" placeholder="' + t.placeholder + '" style="width:100%;padding:6px 8px;border:1px solid var(--grey-light);border-radius:4px;font-size:12px;box-sizing:border-box;margin-bottom:2px;">' +
          '<button class="remove-btn" onclick="removeBizContactEntry(\'' + t.key + '\',' + i + ')" style="margin-top:2px;"><img src="assets/icons/solid/xmark_orange.webp" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"> Remove</button>' +
        '</div>';
      });
    }
    html += '<button class="add-entry-btn" onclick="addBizContactEntry(\'' + t.key + '\')" style="margin-top:2px;"><i class="fas fa-plus"></i> Add ' + t.label + '</button>' +
    '</div>';
  });
  html += '</div>';
  body.innerHTML = html;
}

function getBizContacts() {
  var biz = UserState.business;
  return (biz && biz.contacts) || { calls: [], facebook: [], gps: [], whatsapp: [] };
}

function setBizContacts(contacts) {
  if (!UserState.business) return;
  UserState.business.contacts = contacts;
}

function addBizContactEntry(type) {
  var contacts = getBizContacts();
  if (!contacts[type]) contacts[type] = [];
  contacts[type].push({ id: genBizContactId(), title: '', value: '' });
  setBizContacts(contacts);
  renderBizContactSection();
}
window.addBizContactEntry = addBizContactEntry;

function removeBizContactEntry(type, index) {
  var contacts = getBizContacts();
  if (!contacts[type]) return;
  contacts[type].splice(index, 1);
  setBizContacts(contacts);
  renderBizContactSection();
}
window.removeBizContactEntry = removeBizContactEntry;

function updateBizContactField(type, index, field, value) {
  var contacts = getBizContacts();
  if (!contacts[type] || !contacts[type][index]) return;
  contacts[type][index][field] = value;
  setBizContacts(contacts);
}
window.updateBizContactField = updateBizContactField;

/* ─── BUSINESS INTERESTS / SERVICE CATEGORIES ─── */
function renderBusinessInterestsPage() {
  var body = document.getElementById('biz-interests-page-body');
  if (!body) return;
  var biz = UserState.business;
  var selected = (biz && biz.categories) || [];
  var data = window.FOROMANE_PRODUCT_CATEGORIES;
  if (!data || !data.categories) {
    body.innerHTML = '<p style="padding:20px;text-align:center;color:var(--grey-dark);">Categories not loaded</p>';
    return;
  }

  var allSelected = selected.length === 0;
  var html = '<div style="padding:12px 16px;border-bottom:1px solid var(--grey-light);cursor:pointer;font-size:15px;font-weight:600;background:' + (allSelected ? 'var(--orange-light)' : 'transparent') + ';" onclick="toggleBizAllInterests()">' +
    '<input type="checkbox" ' + (allSelected ? 'checked' : '') + ' style="margin-right:10px;accent-color:var(--orange);">All Categories' +
  '</div>';

  var primaryName = selected.length > 0 ? selected[0] : '';
  var isPrimary = true;
  var hasAdditional = false;

  function renderItem(cat, level) {
    var indent = (level - 1) * 16;
    var isChecked = selected.indexOf(cat.name) !== -1;
    var hasChildren = cat.children && cat.children.length > 0;
    var safeName = cat.name.replace(/'/g, "\\'");
    var childId = 'biz-int-ch-' + (cat.slug || cat.id || safeName).replace(/[^a-z0-9-]/gi, '');

    var itemHtml = '<div style="padding:8px 16px;border-bottom:1px solid var(--grey-light);cursor:pointer;font-size:14px;padding-left:' + (indent + 16) + 'px;display:flex;align-items:center;" onclick="' +
      (hasChildren ? 'event.stopPropagation();toggleBizCategoryChildren(\'' + childId + '\')' : '') + '">' +
      '<input type="checkbox" ' + (isChecked ? 'checked' : '') + ' style="margin-right:8px;" onclick="event.stopPropagation();toggleBizInterestCheckbox(\'' + safeName + '\', this.checked)">' + cat.name +
    '</div>';

    if (hasChildren) {
      itemHtml += '<div id="' + childId + '" style="display:none;">';
      cat.children.forEach(function(child) { itemHtml += renderItem(child, level + 1); });
      itemHtml += '</div>';
    }
    return itemHtml;
  }

  // Primary Categories section
  html += '<div style="padding:10px 16px 4px;font-size:12px;font-weight:600;color:var(--grey-dark);text-transform:uppercase;letter-spacing:0.5px;">Primary Categories</div>';
  html += '<div style="padding:0 0 4px 16px;font-size:11px;color:var(--grey-dark);font-style:italic;">The first category selected is your primary. Sub-categories under it are free.</div>';

  var mainCats = data.categories;
  mainCats.forEach(function(cat) {
    html += renderItem(cat, 1);
  });

  // Additional Categories section
  html += '<div style="border-top:1px solid var(--grey-light);margin-top:10px;"></div>';
  html += '<div style="padding:10px 16px 4px;font-size:12px;font-weight:600;color:var(--grey-dark);text-transform:uppercase;letter-spacing:0.5px;">Additional Categories</div>';
  html += '<div style="padding:0 0 4px 16px;font-size:11px;color:var(--grey-dark);font-style:italic;">P50 per additional main category (once-off per year). Adding new ones requires payment &amp; admin approval.</div>';

  body.innerHTML = html;
}

function toggleBizInterestCheckbox(name, checked) {
  var biz = UserState.business;
  if (!biz) return;
  if (!biz.categories) biz.categories = [];
  if (checked) {
    if (biz.categories.indexOf(name) === -1) biz.categories.push(name);
  } else {
    biz.categories = biz.categories.filter(function(c) { return c !== name; });
  }
  renderBusinessInterestsPage();
}
window.toggleBizInterestCheckbox = toggleBizInterestCheckbox;

function toggleBizAllInterests() {
  var biz = UserState.business;
  if (!biz) return;
  var data = window.FOROMANE_PRODUCT_CATEGORIES;
  if (!data || !data.categories) return;
  var allNames = [];
  function collect(cats) {
    cats.forEach(function(c) {
      allNames.push(c.name);
      if (c.children) collect(c.children);
    });
  }
  collect(data.categories);
  var isAll = biz.categories.length === 0 || biz.categories.length >= allNames.length;
  biz.categories = isAll ? [] : allNames.slice();
  renderBusinessInterestsPage();
}
window.toggleBizAllInterests = toggleBizAllInterests;

function toggleBizCategoryChildren(childId) {
  var el = document.getElementById(childId);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
window.toggleBizCategoryChildren = toggleBizCategoryChildren;

function saveBizInterests() {
  var biz = UserState.business;
  if (!biz) return;
  // Auto-set primary category from first selected
  if (biz.categories && biz.categories.length > 0) {
    biz.category = biz.categories[0];
  }
  showToast('Categories saved');
  goBack();
}
window.saveBizInterests = saveBizInterests;

// ─── WINDOW EXPORTS ───
window.openSwitcher = openSwitcher;
window.closeSwitcher = closeSwitcher;
window.logoutUser = logoutUser;
window.switchTo = switchTo;
window.openOtherUsers = openOtherUsers;
window.switchToOtherUser = switchToOtherUser;
window.filterOtherUsers = filterOtherUsers;
window.scrollToOtherSection = scrollToOtherSection;
window.updateAccountUI = updateAccountUI;
window.updateKPI = updateKPI;
window.openCreateBiz = openCreateBiz;
window.saveBusiness = saveBusiness;
window.upgradeSubscription = upgradeSubscription;
window.updateSubStatus = updateSubStatus;
window.renderPersonalDetails = renderPersonalDetails;
window.renderFavouriteSuppliers = renderFavouriteSuppliers;
window.renderInterestsPage = renderInterestsPage;
window.renderBusinessInterestsPage = renderBusinessInterestsPage;
window.saveInterestsFromPage = saveInterestsFromPage;
window.toggleSubAcc = toggleSubAcc;
window.toggleBizActions = toggleBizActions;
window.editField = editField;
window.confirmField = confirmField;
window.cancelField = cancelField;
window.editLocationTown = editLocationTown;
window.editLocationArea = editLocationArea;
window.openGpsMap = openGpsMap;
window.setGender = setGender;
window.editDateField = editDateField;
window.addMobileEntry = addMobileEntry;
window.removeMobileEntry = removeMobileEntry;
window.setPrimaryMobile = setPrimaryMobile;
window.updateMobileField = updateMobileField;
window.addWhatsAppEntry = addWhatsAppEntry;
window.removeWhatsAppEntry = removeWhatsAppEntry;
window.setPrimaryWhatsApp = setPrimaryWhatsApp;
window.updateWhatsAppField = updateWhatsAppField;
window.markUserAsVerified = markUserAsVerified;
window.removeFavourite = removeFavourite;
window.toggleInterestCheckbox = toggleInterestCheckbox;
window.toggleAllInterests = toggleAllInterests;
window.toggleCategoryChildren = toggleCategoryChildren;

/* ─── Exports for view-register ─── */
window.NATIONALITIES_DATA = NATIONALITIES_DATA;
window.populateTownDropdown = populateTownDropdown;
window.populateAreaDropdown = populateAreaDropdown;
window.onTownChange = onTownChange;
window.updateIdentityField = updateIdentityField;
window.updateLocationField = updateLocationField;
window.updateSocialField = updateSocialField;
window.updateGender = updateGender;

function updateDriveRowUI(row) {
  if (!row) row = document.getElementById('drive-sync-row');
  if (!row) return;

  var isSignedIn = window.DriveAPI && typeof window.DriveAPI.isSignedIn === 'function' && window.DriveAPI.isSignedIn();

  if (isSignedIn) {
    row.innerHTML =
      '<i class="fab fa-google-drive" style="color:#34a853;width:20px;font-size:16px;"></i>' +
      '<span>Google Drive <span style="font-size:11px;color:#34a853;font-weight:600;">Synced</span></span>' +
      '<span style="margin-left:auto;color:var(--grey-dark);font-size:12px;"><i class="fas fa-sign-out-alt"></i></span>';
  } else {
    row.innerHTML =
      '<i class="fab fa-google-drive" style="color:var(--grey-dark);width:20px;font-size:16px;"></i>' +
      '<span>Sign in to Google Drive</span>' +
      '<span style="margin-left:auto;color:var(--orange);font-size:12px;"><i class="fas fa-chevron-right"></i></span>';
  }
}

async function toggleDriveSync() {
  if (!window.DriveAPI) {
    showToast('Drive API not loaded');
    return;
  }

  var isSignedIn = typeof window.DriveAPI.isSignedIn === 'function' && window.DriveAPI.isSignedIn();

  if (isSignedIn) {
    window.DriveAPI.signOut();
    showToast('Disconnected from Google Drive');
    updateDriveRowUI();
    return;
  }

  if (typeof window.DriveAPI.signIn !== 'function') {
    showToast('Drive sign-in not available');
    return;
  }

  try {
    showToast('Connecting to Google Drive...');
    await window.DriveAPI.signIn();
    showToast('Connected to Google Drive!');

    // Create folder for current user if they're a real user
    if (window.Auth && typeof window.Auth.isRealUser === 'function' && window.Auth.isRealUser()) {
      window.DriveAPI.ensureUserFolder(UserState.id).catch(function(e) {
        console.warn('Drive folder creation failed:', e);
      });
    }

    // Flush any pending sync items
    if (window.SyncQueue && typeof window.SyncQueue.flushAll === 'function') {
      window.SyncQueue.flushAll().catch(function(e) {
        console.warn('Sync flush after Drive sign-in failed:', e);
      });
    }
  } catch(e) {
    showToast('Drive sign-in failed: ' + (e.message || e));
    console.error('Drive sign-in error:', e);
  }
  updateDriveRowUI();
}

function updateDriveSyncUI() {
  var row = injectDriveRow();
  updateDriveRowUI(row);
}

/* ─── RETAIL HOURS FORM ─── */
var HOURS_DAY_KEYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
var HOURS_DAY_LABELS = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };

function renderBizHoursSection() {
  var body = document.getElementById('biz-hours-body');
  if (!body) return;
  var biz = UserState.business;
  var rh = biz ? (biz.retailHours || null) : null;
  var branches = (rh && rh.branches && rh.branches.length > 0) ? JSON.parse(JSON.stringify(rh.branches)) : [{ name: 'Main Branch', hours: [], exceptions: [] }];
  if (branches[0].hours.length === 0) {
    branches[0].hours = HOURS_DAY_KEYS.map(function(d) { return { day: d, open: '', breakStart: '', breakEnd: '', close: '', closed: false }; });
  }
  var html = '<div id="hours-branches-container">';
  branches.forEach(function(b, bi) {
    html += '<div class="hours-branch-panel" data-branch-index="' + bi + '">';
    html += '<div class="hours-branch-header">';
    html += '<input class="hours-branch-name" value="' + (b.name || '').replace(/"/g,'&quot;') + '" placeholder="Branch name" onchange="updateHoursBranchName(' + bi + ',this.value)">';
    if (branches.length > 1) {
      html += '<button class="hours-remove-btn" onclick="removeHoursBranch(' + bi + ')">Remove</button>';
    }
    html += '</div>';
    html += '<div class="hours-days-section">';
    b.hours.forEach(function(h, di) {
      var closed = h.closed ? ' checked' : '';
      var disabled = closed ? ' disabled' : '';
      html += '<div class="hours-day-row">';
      html += '<span class="hours-day-label">' + (HOURS_DAY_LABELS[h.day] || h.day) + '</span>';
      html += '<input type="time" class="hours-time-input hours-open" value="' + (h.open || '') + '"' + disabled + ' onchange="updateHoursField(' + bi + ',' + di + ',\'open\',this.value)">';
      html += '<span class="hours-break-sep">break</span>';
      html += '<input type="time" class="hours-time-input hours-break-start" value="' + (h.breakStart || '') + '"' + disabled + ' onchange="updateHoursField(' + bi + ',' + di + ',\'breakStart\',this.value)">';
      html += '<span class="hours-break-sep">to</span>';
      html += '<input type="time" class="hours-time-input hours-break-end" value="' + (h.breakEnd || '') + '"' + disabled + ' onchange="updateHoursField(' + bi + ',' + di + ',\'breakEnd\',this.value)">';
      html += '<input type="time" class="hours-time-input hours-close" value="' + (h.close || '') + '"' + disabled + ' onchange="updateHoursField(' + bi + ',' + di + ',\'close\',this.value)">';
      html += '<label class="hours-closed-toggle"><input type="checkbox"' + closed + ' onchange="updateHoursClosed(' + bi + ',' + di + ',this.checked)"> Closed</label>';
      html += '</div>';
    });
    html += '</div>';
    if (b.exceptions && b.exceptions.length > 0) {
      html += '<div class="hours-exceptions-section">';
      html += '<div class="hours-exceptions-title">Exceptions</div>';
      b.exceptions.forEach(function(ex, ei) {
        html += '<div class="hours-exception-row" data-ex-index="' + ei + '">';
        html += '<input type="date" class="hours-date-input" value="' + (ex.date || '') + '" onchange="updateHoursException(' + bi + ',' + ei + ',\'date\',this.value)">';
        html += '<input class="hours-label-input" placeholder="Label" value="' + (ex.label || '').replace(/"/g,'&quot;') + '" onchange="updateHoursException(' + bi + ',' + ei + ',\'label\',this.value)">';
        html += '<label class="hours-closed-toggle"><input type="checkbox"' + (ex.closed ? ' checked' : '') + ' onchange="updateHoursExceptionClosed(' + bi + ',' + ei + ',this.checked)"> Closed</label>';
        html += '<button class="hours-remove-btn" style="font-size:11px;" onclick="removeHoursException(' + bi + ',' + ei + ')">X</button>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '<button class="hours-add-btn" style="margin-top:6px;" onclick="addHoursException(' + bi + ')">+ Add Exception</button>';
    html += '</div>';
  });
  html += '</div>';
  html += '<button class="hours-add-btn" style="margin-top:2px;border-style:solid;" onclick="addHoursBranch()">+ Add Branch</button>';
  body.innerHTML = html;
  var statusEl = document.getElementById('hours-status');
  if (statusEl) {
    var count = branches.reduce(function(acc, b) { return acc + (b.exceptions ? b.exceptions.length : 0); }, 0);
    statusEl.textContent = branches.length + ' branch' + (branches.length > 1 ? 'es' : '') + (count > 0 ? ', ' + count + ' exception(s)' : '');
  }
}

function readBizHoursForm() {
  var container = document.getElementById('hours-branches-container');
  if (!container) return null;
  var panels = container.querySelectorAll('.hours-branch-panel');
  var branches = [];
  panels.forEach(function(panel) {
    var nameInput = panel.querySelector('.hours-branch-name');
    var name = nameInput ? nameInput.value.trim() : 'Main Branch';
    var dayRows = panel.querySelectorAll('.hours-day-row');
    var hours = [];
    dayRows.forEach(function(row) {
      var dayLabel = row.querySelector('.hours-day-label');
      var day = dayLabel ? dayLabel.textContent.toLowerCase() : '';
      var dayKey = { mon:'monday', tue:'tuesday', wed:'wednesday', thu:'thursday', fri:'friday', sat:'saturday', sun:'sunday' }[day] || day;
      var open = row.querySelector('.hours-open');
      var breakStart = row.querySelector('.hours-break-start');
      var breakEnd = row.querySelector('.hours-break-end');
      var close = row.querySelector('.hours-close');
      var closedCb = row.querySelector('.hours-closed-toggle input');
      var closed = closedCb ? closedCb.checked : false;
      hours.push({
        day: dayKey,
        open: closed ? null : (open ? open.value || null : null),
        breakStart: closed ? null : (breakStart ? breakStart.value || null : null),
        breakEnd: closed ? null : (breakEnd ? breakEnd.value || null : null),
        close: closed ? null : (close ? close.value || null : null),
        closed: closed
      });
    });
    var exceptionRows = panel.querySelectorAll('.hours-exception-row');
    var exceptions = [];
    exceptionRows.forEach(function(row) {
      var date = row.querySelector('.hours-date-input');
      var label = row.querySelector('.hours-label-input');
      var closedCb = row.querySelector('.hours-closed-toggle input');
      exceptions.push({
        date: date ? date.value : '',
        label: label ? label.value.trim() : '',
        closed: closedCb ? closedCb.checked : false,
        open: null,
        close: null
      });
    });
    branches.push({ name: name, hours: hours, exceptions: exceptions });
  });
  if (branches.length === 0 || !branches[0].hours.some(function(h) { return h.open || h.close || h.closed; })) return null;
  return { branches: branches };
}

function updateHoursField(bi, di, field, value) {
  var container = document.getElementById('hours-branches-container');
  if (!container) return;
  var panel = container.querySelectorAll('.hours-branch-panel')[bi];
  if (!panel) return;
  var rows = panel.querySelectorAll('.hours-day-row');
  var row = rows[di];
  if (!row) return;
  var inputMap = { open: 'hours-open', breakStart: 'hours-break-start', breakEnd: 'hours-break-end', close: 'hours-close' };
  var el = row.querySelector('.' + inputMap[field]);
  if (el) el.value = value;
}
window.updateHoursField = updateHoursField;

function updateHoursClosed(bi, di, checked) {
  var container = document.getElementById('hours-branches-container');
  if (!container) return;
  var panel = container.querySelectorAll('.hours-branch-panel')[bi];
  if (!panel) return;
  var rows = panel.querySelectorAll('.hours-day-row');
  var row = rows[di];
  if (!row) return;
  var inputs = row.querySelectorAll('.hours-time-input');
  inputs.forEach(function(inp) { inp.disabled = checked; if (checked) inp.value = ''; });
  var cb = row.querySelector('.hours-closed-toggle input');
  if (cb) cb.checked = checked;
}
window.updateHoursClosed = updateHoursClosed;

function addHoursBranch() {
  var container = document.getElementById('hours-branches-container');
  if (!container) return;
  var panels = container.querySelectorAll('.hours-branch-panel');
  var count = panels.length;
  var div = document.createElement('div');
  div.className = 'hours-branch-panel';
  div.setAttribute('data-branch-index', count);
  var header = document.createElement('div');
  header.className = 'hours-branch-header';
  header.innerHTML = '<input class="hours-branch-name" value="Branch ' + (count + 1) + '" placeholder="Branch name" onchange="updateHoursBranchName(' + count + ',this.value)">';
  header.innerHTML += '<button class="hours-remove-btn" onclick="removeHoursBranch(' + count + ')">Remove</button>';
  div.appendChild(header);
  var daysSection = document.createElement('div');
  daysSection.className = 'hours-days-section';
  HOURS_DAY_KEYS.forEach(function(d, di) {
    var row = document.createElement('div');
    row.className = 'hours-day-row';
    row.innerHTML = '<span class="hours-day-label">' + HOURS_DAY_LABELS[d] + '</span>';
    row.innerHTML += '<input type="time" class="hours-time-input hours-open" onchange="updateHoursField(' + count + ',' + di + ',\'open\',this.value)">';
    row.innerHTML += '<span class="hours-break-sep">break</span>';
    row.innerHTML += '<input type="time" class="hours-time-input hours-break-start" onchange="updateHoursField(' + count + ',' + di + ',\'breakStart\',this.value)">';
    row.innerHTML += '<span class="hours-break-sep">to</span>';
    row.innerHTML += '<input type="time" class="hours-time-input hours-break-end" onchange="updateHoursField(' + count + ',' + di + ',\'breakEnd\',this.value)">';
    row.innerHTML += '<input type="time" class="hours-time-input hours-close" onchange="updateHoursField(' + count + ',' + di + ',\'close\',this.value)">';
    row.innerHTML += '<label class="hours-closed-toggle"><input type="checkbox" onchange="updateHoursClosed(' + count + ',' + di + ',this.checked)"> Closed</label>';
    daysSection.appendChild(row);
  });
  div.appendChild(daysSection);
  var addEx = document.createElement('button');
  addEx.className = 'hours-add-btn';
  addEx.style.cssText = 'margin-top:6px;';
  addEx.textContent = '+ Add Exception';
  addEx.onclick = function() { addHoursException(count); };
  div.appendChild(addEx);
  container.appendChild(div);
  var statusEl = document.getElementById('hours-status');
  if (statusEl) {
    var totalBranches = container.querySelectorAll('.hours-branch-panel').length;
    statusEl.textContent = totalBranches + ' branches';
  }
}
window.addHoursBranch = addHoursBranch;

function removeHoursBranch(bi) {
  var container = document.getElementById('hours-branches-container');
  if (!container) return;
  var panels = container.querySelectorAll('.hours-branch-panel');
  if (panels.length <= 1) return;
  var panel = panels[bi];
  if (panel) panel.remove();
  var remaining = container.querySelectorAll('.hours-branch-panel');
  remaining.forEach(function(p, i) {
    p.setAttribute('data-branch-index', i);
    var nameInput = p.querySelector('.hours-branch-name');
    if (nameInput) nameInput.onchange = function(v) { updateHoursBranchName(i, v); };
    var removeBtn = p.querySelector('.hours-remove-btn');
    if (removeBtn) removeBtn.onclick = function() { removeHoursBranch(i); };
    var dayRows = p.querySelectorAll('.hours-day-row');
    dayRows.forEach(function(row, di) {
      var fields = ['open','breakStart','breakEnd','close'];
      fields.forEach(function(f) {
        var cls = { open:'hours-open', breakStart:'hours-break-start', breakEnd:'hours-break-end', close:'hours-close' }[f];
        var el = row.querySelector('.' + cls);
        if (el) el.onchange = function() { updateHoursField(i, di, f, el.value); };
      });
      var cb = row.querySelector('.hours-closed-toggle input');
      if (cb) cb.onchange = function() { updateHoursClosed(i, di, cb.checked); };
    });
    var addExBtn = p.querySelector('.hours-add-btn');
    if (addExBtn) addExBtn.onclick = function() { addHoursException(i); };
  });
  var statusEl = document.getElementById('hours-status');
  if (statusEl) {
    var rem = container.querySelectorAll('.hours-branch-panel').length;
    statusEl.textContent = rem + ' branch' + (rem > 1 ? 'es' : '');
  }
}
window.removeHoursBranch = removeHoursBranch;

function updateHoursBranchName(bi, value) {
  var container = document.getElementById('hours-branches-container');
  if (!container) return;
  var panels = container.querySelectorAll('.hours-branch-panel');
  var panel = panels[bi];
  if (!panel) return;
  var nameInput = panel.querySelector('.hours-branch-name');
  if (nameInput) nameInput.value = value;
}
window.updateHoursBranchName = updateHoursBranchName;

function addHoursException(bi) {
  var container = document.getElementById('hours-branches-container');
  if (!container) return;
  var panels = container.querySelectorAll('.hours-branch-panel');
  var panel = panels[bi];
  if (!panel) return;
  var exSection = panel.querySelector('.hours-exceptions-section');
  var placeholder;
  if (!exSection) {
    exSection = document.createElement('div');
    exSection.className = 'hours-exceptions-section';
    var title = document.createElement('div');
    title.className = 'hours-exceptions-title';
    title.textContent = 'Exceptions';
    exSection.appendChild(title);
    var addExBtn = panel.querySelector('.hours-add-btn');
    if (addExBtn) {
      panel.insertBefore(exSection, addExBtn);
    } else {
      panel.appendChild(exSection);
    }
  }
  var existingExceptions = exSection.querySelectorAll('.hours-exception-row');
  var ei = existingExceptions.length;
  var row = document.createElement('div');
  row.className = 'hours-exception-row';
  var exDate = new Date();
  var dateStr = exDate.getFullYear() + '-' + String(exDate.getMonth()+1).padStart(2,'0') + '-' + String(exDate.getDate()).padStart(2,'0');
  row.innerHTML = '<input type="date" class="hours-date-input" value="' + dateStr + '" onchange="updateHoursException(' + bi + ',' + ei + ',\'date\',this.value)">';
  row.innerHTML += '<input class="hours-label-input" placeholder="Label (e.g. Public Holiday)" onchange="updateHoursException(' + bi + ',' + ei + ',\'label\',this.value)">';
  row.innerHTML += '<label class="hours-closed-toggle"><input type="checkbox" checked onchange="updateHoursExceptionClosed(' + bi + ',' + ei + ',this.checked)"> Closed</label>';
  row.innerHTML += '<button class="hours-remove-btn" style="font-size:11px;" onclick="removeHoursException(' + bi + ',' + ei + ')">X</button>';
  exSection.appendChild(row);
  var statusEl = document.getElementById('hours-status');
  if (statusEl) statusEl.textContent = panels.length + ' branch' + (panels.length > 1 ? 'es' : '') + ', ' + (ei + 1) + ' exception(s)';
}
window.addHoursException = addHoursException;

function removeHoursException(bi, ei) {
  var container = document.getElementById('hours-branches-container');
  if (!container) return;
  var panels = container.querySelectorAll('.hours-branch-panel');
  var panel = panels[bi];
  if (!panel) return;
  var section = panel.querySelector('.hours-exceptions-section');
  if (!section) return;
  var rows = section.querySelectorAll('.hours-exception-row');
  var row = rows[ei];
  if (row) row.remove();
  var remaining = section.querySelectorAll('.hours-exception-row');
  remaining.forEach(function(r, idx) {
    var dateInput = r.querySelector('.hours-date-input');
    if (dateInput) dateInput.onchange = function() { updateHoursException(bi, idx, 'date', dateInput.value); };
    var labelInput = r.querySelector('.hours-label-input');
    if (labelInput) labelInput.onchange = function() { updateHoursException(bi, idx, 'label', labelInput.value); };
    var cb = r.querySelector('.hours-closed-toggle input');
    if (cb) cb.onchange = function() { updateHoursExceptionClosed(bi, idx, cb.checked); };
    var removeBtn = r.querySelector('.hours-remove-btn');
    if (removeBtn) removeBtn.onclick = function() { removeHoursException(bi, idx); };
  });
  if (remaining.length === 0) section.remove();
  var statusEl = document.getElementById('hours-status');
  if (statusEl) {
    var totalEx = 0;
    panels.forEach(function(p) { var s = p.querySelector('.hours-exceptions-section'); if (s) totalEx += s.querySelectorAll('.hours-exception-row').length; });
    statusEl.textContent = panels.length + ' branch' + (panels.length > 1 ? 'es' : '') + ', ' + totalEx + ' exception(s)';
  }
}
window.removeHoursException = removeHoursException;

function updateHoursException(bi, ei, field, value) {
  var container = document.getElementById('hours-branches-container');
  if (!container) return;
  var panels = container.querySelectorAll('.hours-branch-panel');
  var panel = panels[bi];
  if (!panel) return;
  var section = panel.querySelector('.hours-exceptions-section');
  if (!section) return;
  var rows = section.querySelectorAll('.hours-exception-row');
  var row = rows[ei];
  if (!row) return;
  if (field === 'date') {
    var inp = row.querySelector('.hours-date-input');
    if (inp) inp.value = value;
  } else if (field === 'label') {
    var inp = row.querySelector('.hours-label-input');
    if (inp) inp.value = value;
  }
}
window.updateHoursException = updateHoursException;

function updateHoursExceptionClosed(bi, ei, checked) {
  var container = document.getElementById('hours-branches-container');
  if (!container) return;
  var panels = container.querySelectorAll('.hours-branch-panel');
  var panel = panels[bi];
  if (!panel) return;
  var section = panel.querySelector('.hours-exceptions-section');
  if (!section) return;
  var rows = section.querySelectorAll('.hours-exception-row');
  var row = rows[ei];
  if (!row) return;
  var cb = row.querySelector('.hours-closed-toggle input');
  if (cb) cb.checked = checked;
}
window.updateHoursExceptionClosed = updateHoursExceptionClosed;

window.installApp = installApp;
window.clearAppCache = clearAppCache;
window.deleteAccount = deleteAccount;
window.confirmDeleteAccount = confirmDeleteAccount;
window.renderNotesAccordion = renderNotesAccordion;
window.renderFavSuppliersAccordion = renderFavSuppliersAccordion;
window.renderBusinessAccordion = renderBusinessAccordion;
window.renderAccount = renderAccount;

window.openCreateProProfile = openCreateProProfile;
window.saveProProfile = saveProProfile;
window.addProSkill = addProSkill;
window.removeProSkill = removeProSkill;
window.openAddProProject = openAddProProject;
window.saveProProject = saveProProject;
window.removeProProject = removeProProject;
window.renderAgentPortal = renderAgentPortal;
window.agentVerifyUser = agentVerifyUser;
window.triggerPlatformSync = triggerPlatformSync;
window.closeLikedAccordion = closeLikedAccordion;


