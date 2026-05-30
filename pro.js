/* ════════════════════════════════════════════════════════
   FOROMANE PRO - Tradesperson/Professional Profile Management
   ════════════════════════════════════════════════════════ */

// ─── Data model ───

if (!window.PRO_ASSOCIATIONS) {
  window.PRO_ASSOCIATIONS = {
    'trade': { proId: 'trade-5', role: 'owner' }
  };
}

function proAssocKey() { return 'foromane_pro_associations'; }
function proProfileKey(proId) { return 'foromane_pro_profile_' + proId; }
function proServicesKey(proId) { return 'foromane_pro_services_' + proId; }

function getProAssociations() {
  try {
    const stored = localStorage.getItem(proAssocKey());
    if (stored) return JSON.parse(stored);
    localStorage.setItem(proAssocKey(), JSON.stringify(window.PRO_ASSOCIATIONS));
    return window.PRO_ASSOCIATIONS;
  } catch { return window.PRO_ASSOCIATIONS || {}; }
}

function saveProAssociations(assoc) {
  localStorage.setItem(proAssocKey(), JSON.stringify(assoc));
  window.PRO_ASSOCIATIONS = assoc;
}

function getProProfile(proId) {
  try { return JSON.parse(localStorage.getItem(proProfileKey(proId))); }
  catch { return null; }
}

function saveProProfile(proId, data) {
  localStorage.setItem(proProfileKey(proId), JSON.stringify(data));
}

function getProServices(proId) {
  try { return JSON.parse(localStorage.getItem(proServicesKey(proId))) || []; }
  catch { return []; }
}

function saveProServices(proId, services) {
  localStorage.setItem(proServicesKey(proId), JSON.stringify(services));
}

function getClaimedProId(userId) {
  const assoc = getProAssociations();
  for (const uid in assoc) {
    if (uid === userId && assoc[uid].role === 'owner') return assoc[uid].proId;
  }
  return null;
}

function getProListing(proId) {
  var fromProfiles = (window.DEMO_PROFILES || []).find(function(p) { return p.id === proId; });
  if (fromProfiles) return fromProfiles;
  return (window.SAMPLE_PROFESSIONALS || []).find(p => p.id === proId) || null;
}

function defaultProProfile(proListing) {
  var locStr = '';
  if (proListing) {
    if (typeof proListing.location === 'object' && proListing.location) {
      locStr = proListing.location.town || '';
    } else if (proListing.town) {
      locStr = proListing.town;
    } else if (typeof proListing.location === 'string') {
      locStr = proListing.location.split(',').pop().trim();
    }
  }
  var isSupplier = proListing && proListing.role === 'Business & Materials Supplier';
  var bizInfo = proListing && proListing.businessInfo || null;
  return {
    trade: proListing ? (proListing.primaryTrade || proListing.trade || (isSupplier && bizInfo ? bizInfo.name + ' — Supplier' : '') || proListing.role || '') : '',
    tradeCategory: proListing ? (proListing.tradeCategory || (isSupplier && bizInfo && bizInfo.categories ? bizInfo.categories[0] : '') || '') : '',
    skills: proListing ? (proListing.skills || []) : [],
    description: proListing ? (proListing.description || (isSupplier && bizInfo ? bizInfo.description : '') || '') : '',
    serviceAreas: proListing ? [locStr] : [],
    rateType: 'quote',
    rate: '',
    availability: 'available',
    portfolio: []
  };
}

// Get unique trade categories
function getTradeCategories() {
  const cats = new Set();
  (window.SAMPLE_PROFESSIONALS || []).forEach(p => {
    if (p.tradeCategory) cats.add(p.tradeCategory);
  });
  return [...cats].sort();
}

function getSkillsForCategory(category) {
  const skills = new Set();
  (window.SAMPLE_PROFESSIONALS || []).forEach(p => {
    if (p.tradeCategory === category && p.skills) {
      p.skills.forEach(s => skills.add(s));
    }
  });
  return [...skills].sort();
}

// ─── Account accordion ───

function getProAccordionData() {
  const assoc = getProAssociations();
  const claimedProId = getClaimedProId(UserState.id);
  const proListing = claimedProId ? getProListing(claimedProId) : null;
  const profile = claimedProId ? getProProfile(claimedProId) : null;
  const services = claimedProId ? getProServices(claimedProId) : [];
  return { claimedProId, proListing, profile, services, assoc };
}

window.renderProAccordion = function() {
  const body = document.getElementById('pro-accordion-body');
  if (!body) return;
  const { claimedProId, proListing, profile, services } = getProAccordionData();

  const name = profile ? UserState.name : (proListing ? proListing.name : UserState.name);
  const trade = profile ? profile.trade : (proListing ? (proListing.primaryTrade || proListing.trade || 'Tradesperson') : 'Tradesperson');
  const skills = profile ? profile.skills : (proListing ? (proListing.skills || []) : []);
  const desc = profile ? profile.description : (proListing ? proListing.description : '');
  const rating = proListing ? proListing.rating : null;

  const initials = proListing && proListing.initials ? proListing.initials : (name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase());
  const color = proListing ? (proListing.color || '#fd7600') : '#fd7600';
  const avatarColor = profile && profile.tradeCategory ? '#fd7600' : color;

  const skillsHtml = skills.length > 0
    ? skills.map(s => `<span class="pill" style="font-size:10px;">${s}</span>`).join('')
    : '<span style="font-size:11px;color:var(--grey-dark);">No skills added yet</span>';

  const starsHtml = rating
    ? '<span style="font-size:13px;">' + '\u2B50'.repeat(Math.floor(Number(rating))) + ' ' + rating + '</span>'
    : '';

  const serviceCount = services.length;

  body.innerHTML = `
    <div style="padding-top:8px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div class="avatar" style="width:44px;height:44px;font-size:18px;background:${avatarColor};display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;font-weight:600;flex-shrink:0;">${initials}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:15px;">${name}</div>
          <div style="font-size:12px;color:var(--grey-dark);">${trade}</div>
          ${starsHtml ? '<div style="margin-top:2px;">' + starsHtml + '</div>' : ''}
        </div>
        ${claimedProId ? '<span style="font-size:11px;color:var(--green, #27ae60);font-weight:600;background:#e8f5e9;padding:3px 8px;border-radius:4px;">Claimed</span>' : '<span style="font-size:11px;color:var(--orange);font-weight:600;">Unclaimed</span>'}
      </div>
      ${desc ? '<p style="font-size:12px;color:var(--text-sub);margin-bottom:8px;">' + desc + '</p>' : ''}
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">${skillsHtml}</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${claimedProId
          ? '<button class="btn-outline btn-sm" onclick="openProEditor()"><i class="fas fa-edit"></i> Edit Pro Profile</button>' +
            '<button class="btn-outline btn-sm" onclick="openProServices()"><i class="fas fa-tools"></i> My Services (' + serviceCount + ')</button>' +
            '<button class="btn-outline btn-sm" onclick="openProProfile(\'' + claimedProId + '\')"><i class="fas fa-eye"></i> View My Profile</button>'
          : '<button class="btn btn-sm" onclick="openClaimProSearch()"><i class="fas fa-hand-point-up"></i> Claim a Pro Listing</button>'
        }
      </div>
    </div>
  `;
};

// ─── Pro profile editor modal ───

window.openProEditor = function() {
  const { claimedProId, proListing, profile } = getProAccordionData();
  if (!claimedProId) { showToast('No claimed pro listing'); return; }

  const p = profile || defaultProProfile(proListing);
  const categories = getTradeCategories();
  const catOptions = categories.map(c =>
    `<option value="${c}" ${p.tradeCategory === c ? 'selected' : ''}>${c}</option>`
  ).join('');

  var locForArea = '';
  if (proListing) {
    if (typeof proListing.location === 'object' && proListing.location) {
      locForArea = proListing.location.town || '';
    } else if (typeof proListing.location === 'string') {
      locForArea = proListing.location.split(',').pop().trim();
    }
  }
  const areas = locForArea || UserState.town;
  const areaHtml = `<input type="text" id="pro-service-areas" value="${(p.serviceAreas || []).join(', ')}" placeholder="e.g. Gaborone, Francistown" style="width:100%;padding:8px;font-size:13px;border:1px solid var(--grey-light);border-radius:6px;box-sizing:border-box;">`;

  const rateOptions = [
    { value: 'quote', label: 'Quote (customer asks)' },
    { value: 'hourly', label: 'Hourly Rate' },
    { value: 'fixed', label: 'Fixed Price' }
  ];
  const rateOptsHtml = rateOptions.map(r =>
    `<option value="${r.value}" ${p.rateType === r.value ? 'selected' : ''}>${r.label}</option>`
  ).join('');

  const availOptions = [
    { value: 'available', label: 'Available for jobs' },
    { value: 'busy', label: 'Busy - limited availability' },
    { value: 'not_taking', label: 'Not taking new jobs' }
  ];
  const availOptsHtml = availOptions.map(a =>
    `<option value="${a.value}" ${p.availability === a.value ? 'selected' : ''}>${a.label}</option>`
  ).join('');

  const skillsStr = (p.skills || []).join(', ');

  const overlay = document.createElement('div');
  overlay.id = 'pro-editor-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.display = 'block';
  overlay.innerHTML = `
    <div class="modal-sheet" style="max-height:90vh;overflow-y:auto;">
      <div class="modal-header">
        <span class="modal-title">Edit Pro Profile</span>
        <button class="modal-close" onclick="closeProEditor()"><img src="assets/icons/solid/xmark_orange.webp" style="width:18px;height:18px;"></button>
      </div>
      <div class="modal-body">
        <label>Trade / Profession</label>
        <input type="text" id="pro-edit-trade" value="${(p.trade || '').replace(/"/g, '&quot;')}" placeholder="e.g. Electrician, Plumber" style="width:100%;padding:8px;font-size:13px;border:1px solid var(--grey-light);border-radius:6px;box-sizing:border-box;margin-bottom:10px;">

        <label>Trade Category</label>
        <select id="pro-edit-category" style="width:100%;padding:8px;font-size:13px;border:1px solid var(--grey-light);border-radius:6px;box-sizing:border-box;margin-bottom:10px;">
          <option value="">Select category...</option>
          ${catOptions}
        </select>

        <label>Skills (comma-separated)</label>
        <input type="text" id="pro-edit-skills" value="${skillsStr.replace(/"/g, '&quot;')}" placeholder="e.g. Wiring, Installation, Troubleshooting" style="width:100%;padding:8px;font-size:13px;border:1px solid var(--grey-light);border-radius:6px;box-sizing:border-box;margin-bottom:10px;">

        <label>Description</label>
        <textarea id="pro-edit-desc" rows="3" placeholder="Describe your experience, certifications, etc." style="width:100%;padding:8px;font-size:13px;border:1px solid var(--grey-light);border-radius:6px;box-sizing:border-box;margin-bottom:10px;resize:vertical;">${(p.description || '').replace(/"/g, '&quot;')}</textarea>

        <label>Service Areas (comma-separated towns)</label>
        ${areaHtml}

        <div style="display:flex;gap:8px;margin:10px 0;">
          <div style="flex:1;">
            <label>Rate Type</label>
            <select id="pro-edit-rate-type" style="width:100%;padding:8px;font-size:13px;border:1px solid var(--grey-light);border-radius:6px;box-sizing:border-box;">${rateOptsHtml}</select>
          </div>
          <div style="flex:1;">
            <label>Rate (Pula)</label>
            <input type="number" id="pro-edit-rate" value="${p.rate || ''}" placeholder="0" style="width:100%;padding:8px;font-size:13px;border:1px solid var(--grey-light);border-radius:6px;box-sizing:border-box;">
          </div>
        </div>

        <label>Availability</label>
        <select id="pro-edit-avail" style="width:100%;padding:8px;font-size:13px;border:1px solid var(--grey-light);border-radius:6px;box-sizing:border-box;margin-bottom:16px;">${availOptsHtml}</select>

        <button class="btn" onclick="saveProEditor()" style="width:100%;">Save Profile</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
};

window.closeProEditor = function() {
  const el = document.getElementById('pro-editor-overlay');
  if (el) el.remove();
};

window.saveProEditor = function() {
  const { claimedProId, proListing } = getProAccordionData();
  if (!claimedProId) return;

  const trade = document.getElementById('pro-edit-trade').value.trim();
  const tradeCategory = document.getElementById('pro-edit-category').value;
  const skillsStr = document.getElementById('pro-edit-skills').value.trim();
  const description = document.getElementById('pro-edit-desc').value.trim();
  const areasStr = document.getElementById('pro-service-areas').value.trim();
  const rateType = document.getElementById('pro-edit-rate-type').value;
  const rate = document.getElementById('pro-edit-rate').value;
  const availability = document.getElementById('pro-edit-avail').value;

  const skills = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  const profile = {
    trade,
    tradeCategory,
    skills,
    description,
    serviceAreas: areasStr ? areasStr.split(',').map(s => s.trim()).filter(Boolean) : [],
    rateType,
    rate,
    availability,
    portfolio: []
  };

  saveProProfile(claimedProId, profile);
  closeProEditor();
  renderProAccordion();
  showToast('Pro profile saved!');
};

// ─── Claim Pro Listing ───

window.openClaimProSearch = function() {
  const overlay = document.createElement('div');
  overlay.id = 'claim-pro-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.display = 'block';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-header">
        <span class="modal-title">Claim a Pro Listing</span>
        <button class="modal-close" onclick="closeClaimProSearch()"><img src="assets/icons/solid/xmark_orange.webp" style="width:18px;height:18px;"></button>
      </div>
      <div class="modal-body">
        <p style="font-size:12px;color:var(--grey-dark);margin-bottom:10px;">Search for your professional listing and claim ownership.</p>
        <input type="text" id="claim-pro-search" placeholder="Search by name or trade..." style="width:100%;padding:10px;font-size:14px;border:1px solid var(--grey-light);border-radius:8px;box-sizing:border-box;" oninput="searchClaimablePros(this.value)">
        <div id="claim-pro-results" style="margin-top:12px;max-height:300px;overflow-y:auto;"></div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('claim-pro-search').focus();
};

window.closeClaimProSearch = function() {
  const el = document.getElementById('claim-pro-overlay');
  if (el) el.remove();
};

window.searchClaimablePros = function(term) {
  const t = term.toLowerCase().trim();
  const results = document.getElementById('claim-pro-results');
  if (!results) return;

  if (!t) {
    results.innerHTML = '<p style="font-size:13px;color:var(--grey-dark);text-align:center;padding:16px;">Type a name or trade to search</p>';
    return;
  }

  const all = window.SAMPLE_PROFESSIONALS || [];
  const assoc = getProAssociations();
  const claimedIds = new Set(Object.values(assoc).map(a => a.proId));

  const matched = all.filter(p =>
    p.name.toLowerCase().includes(t) || p.trade.toLowerCase().includes(t)
  );

  if (matched.length === 0) {
    results.innerHTML = '<p style="font-size:13px;color:var(--grey-dark);text-align:center;padding:16px;">No matching listings found</p>';
    return;
  }

  results.innerHTML = matched.map(p => {
    const alreadyClaimed = claimedIds.has(p.id);
    const isMine = assoc[UserState.id] && assoc[UserState.id].proId === p.id;
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid var(--grey-light);cursor:${(alreadyClaimed && !isMine) ? 'default' : 'pointer'};opacity:${(alreadyClaimed && !isMine) ? 0.5 : 1};" onclick="${(alreadyClaimed && !isMine) ? '' : "claimProListing('" + p.id + "','" + p.name.replace(/'/g, "\\'") + "')"}">
        <div class="avatar" style="width:36px;height:36px;font-size:14px;background:${p.color || '#888'};flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;font-weight:600;">${p.initials || p.name[0]}</div>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:14px;">${p.name}</div>
          <div style="font-size:11px;color:var(--grey-dark);">${p.trade} · ${p.location}</div>
        </div>
        ${isMine ? '<span style="font-size:11px;color:var(--green, #27ae60);font-weight:600;">Yours</span>' : (alreadyClaimed ? '<span style="font-size:11px;color:var(--grey-mid);font-weight:600;">Claimed</span>' : '<span style="font-size:11px;color:var(--orange);font-weight:600;">Claim</span>')}
      </div>
    `;
  }).join('');
};

window.claimProListing = function(proId, proName) {
  const assoc = getProAssociations();
  if (assoc[UserState.id]) {
    if (assoc[UserState.id].proId === proId) {
      showToast('You already own this listing');
    } else {
      showToast('You can only claim one listing');
    }
    return;
  }

  assoc[UserState.id] = { proId, role: 'owner' };
  saveProAssociations(assoc);

  // Initialize profile from listing data
  const listing = getProListing(proId);
  const profile = defaultProProfile(listing);
  saveProProfile(proId, profile);

  closeClaimProSearch();
  renderProAccordion();
  showToast('Claimed ' + proName + '! You can now edit your profile.');
};

// ─── Pro Services ───

window.openProServices = function() {
  const { claimedProId, services } = getProAccordionData();
  if (!claimedProId) { showToast('No claimed pro listing'); return; }

  const listHtml = services.length === 0
    ? '<p style="font-size:13px;color:var(--grey-dark);text-align:center;padding:16px;">No services yet. Add your first service!</p>'
    : services.map((s, i) => `
      <div style="padding:10px;border-bottom:1px solid var(--grey-light);">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <div style="flex:1;">
            <div style="font-weight:600;font-size:14px;">${s.title}</div>
            <div style="font-size:12px;color:var(--grey-dark);margin-top:2px;">${s.description || ''}</div>
            <div style="font-size:12px;font-weight:600;color:var(--orange);margin-top:4px;">${s.price}</div>
          </div>
          <button style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:16px;padding:4px;" onclick="removeProService(${i})" title="Remove service">&times;</button>
        </div>
      </div>
    `).join('');

  const overlay = document.createElement('div');
  overlay.id = 'pro-services-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.display = 'block';
  overlay.innerHTML = `
    <div class="modal-sheet" style="max-height:90vh;overflow-y:auto;">
      <div class="modal-header">
        <span class="modal-title">My Services</span>
        <button class="modal-close" onclick="closeProServices()"><img src="assets/icons/solid/xmark_orange.webp" style="width:18px;height:18px;"></button>
      </div>
      <div class="modal-body">
        <div id="pro-services-list" style="margin-bottom:12px;">${listHtml}</div>
        <div style="border-top:1px solid var(--grey-light);padding-top:12px;">
          <input type="text" id="pro-srv-title" placeholder="Service title" style="width:100%;padding:8px;font-size:13px;border:1px solid var(--grey-light);border-radius:6px;box-sizing:border-box;margin-bottom:6px;">
          <textarea id="pro-srv-desc" rows="2" placeholder="Description (optional)" style="width:100%;padding:8px;font-size:13px;border:1px solid var(--grey-light);border-radius:6px;box-sizing:border-box;margin-bottom:6px;resize:vertical;"></textarea>
          <div style="display:flex;gap:6px;">
            <input type="text" id="pro-srv-price" placeholder="Price (e.g. P250/hr or Quote)" style="flex:1;padding:8px;font-size:13px;border:1px solid var(--grey-light);border-radius:6px;box-sizing:border-box;">
            <button class="btn-sm" style="background:var(--orange);color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;white-space:nowrap;" onclick="addProService()">+ Add</button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
};

window.closeProServices = function() {
  const el = document.getElementById('pro-services-overlay');
  if (el) el.remove();
};

window.addProService = function() {
  const { claimedProId, services } = getProAccordionData();
  if (!claimedProId) return;

  const title = document.getElementById('pro-srv-title').value.trim();
  const description = document.getElementById('pro-srv-desc').value.trim();
  const price = document.getElementById('pro-srv-price').value.trim() || 'Quote';

  if (!title) { showToast('Enter a service title'); return; }

  services.push({ id: 'srv_' + Date.now(), title, description, price });
  saveProServices(claimedProId, services);
  document.getElementById('pro-srv-title').value = '';
  document.getElementById('pro-srv-desc').value = '';
  document.getElementById('pro-srv-price').value = '';
  openProServices(); // re-render
};

window.removeProService = function(idx) {
  const { claimedProId, services } = getProAccordionData();
  if (!claimedProId) return;
  services.splice(idx, 1);
  saveProServices(claimedProId, services);
  openProServices(); // re-render
};

// ─── Pro profile view data merge ───

function getMergedProData(proId) {
  const listing = getProListing(proId);
  const profile = getProProfile(proId);
  const services = getProServices(proId);
  const assoc = getProAssociations();
  const claimedBy = Object.keys(assoc).find(uid => assoc[uid].proId === proId);
  const isMine = claimedBy === UserState.id;
  return { listing, profile, services, claimedBy, isMine };
}

// Hook into openProProfile — called from directory.js
window._openProProfileOriginal = window.openProProfile;
window.openProProfile = function(proId) {
  const { listing, profile, services, claimedBy, isMine } = getMergedProData(proId);
  if (!listing) { showToast('Professional not found'); return; }

  const content = document.getElementById('pro-profile-content');
  if (!content) return;

  const phoneClean = (profile && profile.phone) ? profile.phone.replace(/[^0-9+]/g, '') : (listing.phone ? listing.phone.replace(/[^0-9+]/g, '') : '');
  const phoneWa = phoneClean.replace(/[^0-9]/g, '');
  const nameEsc = listing.name.replace(/'/g, "\\'");
  var locStr = typeof listing.location === 'object' && listing.location
    ? (listing.location.town || '') + (listing.location.area ? ' \u00B7 ' + listing.location.area : '')
    : (listing.location || '');
  const locationEsc = locStr.replace(/'/g, "\\'");

  const mergedTrade = profile ? profile.trade : (listing.primaryTrade || listing.trade || '');
  const mergedSkills = profile ? profile.skills : (listing.skills || window.DEMO_PRO_SKILLS[proId] || []);
  const mergedDesc = profile ? profile.description : (listing.description || '');
  const mergedAreas = profile ? profile.serviceAreas : [];
  const mergedRate = profile ? { type: profile.rateType, rate: profile.rate } : null;

  const starsHtml = listing.rating
    ? '<span>' + '\u2B50'.repeat(Math.floor(Number(listing.rating))) + ' <span style="font-size:12px;color:var(--grey-dark);font-weight:600;">' + listing.rating + '</span></span>'
    : '';

  const rateHtml = mergedRate && mergedRate.rate
    ? '<span style="font-size:13px;font-weight:600;color:var(--orange);">' +
      (mergedRate.type === 'hourly' ? 'P' + mergedRate.rate + '/hr' : mergedRate.type === 'fixed' ? 'P' + mergedRate.rate + ' fixed' : 'Quote: P' + mergedRate.rate) +
      '</span>'
    : '';

  var isOnline = getOnlineStatus(proId);
  var remaining = getOnlineRemaining(proId);
  const availHtml = '<span style="font-size:12px;color:' + (isOnline ? 'var(--green, #27ae60)' : 'var(--grey-dark)') + ';">' +
    (isOnline ? '\u25CF Online' : '\u25CB Offline') +
    (isMine && isOnline ? ' <span id="pro-online-counter" style="font-size:11px;">(' + formatRemaining(remaining) + ')</span>' : '') +
    '</span>';

  // Skills accordion with star ratings
  var skillsAccHtml = mergedSkills.length > 0
    ? '<div class="accordion"><div class="accordion-header" onclick="toggleAcc(this)"><span><i class="fas fa-tools" style="color:var(--orange);margin-right:8px;"></i> Skills</span><span style="color:var(--orange);font-size:14px;font-weight:700;">' + mergedSkills.length + '</span></div><div class="accordion-body" style="padding:8px 12px;">' +
      mergedSkills.map(function(s) {
        var displayName = window.SkillRatings ? SkillRatings.getSkillDisplayName(s) : s;
        var rating = window.SkillRatings ? SkillRatings.getSkillRatings(proId, s) : null;
        var userRating = window.SkillRatings && UserState ? SkillRatings.getUserRating(proId, s, UserState.id) : null;
        var avg = rating ? parseFloat(rating.average) : 0;
        var count = rating ? rating.count : 0;
        var showRating = count >= 10;
        var canRate = UserState && UserState.id && UserState.id !== 'guest';
        var starsHtml = '';
        for (var i = 1; i <= 5; i++) {
          var fill = 'var(--grey-light)';
          if (showRating && i <= Math.round(avg)) fill = 'var(--orange)';
          else if (!showRating && userRating && i <= userRating) fill = 'var(--orange)';
          starsHtml += '<span style="color:' + fill + ';font-size:16px;cursor:' + (canRate ? 'pointer' : 'default') + ';" ' +
            (canRate ? 'onclick="rateSkillFromProfile(\'' + proId + '\',\'' + s.replace(/'/g, "\\'") + '\',' + i + ')"' : '') +
            '>\u2605</span>';
        }
        var labelHtml = showRating
          ? '<span style="font-size:11px;color:var(--grey-dark);margin-left:4px;">' + rating.average + ' (' + count + ')</span>'
          : (count > 0 ? '<span style="font-size:11px;color:var(--grey-dark);margin-left:4px;">(' + count + ' ratings)</span>' : '');
        return '<div style="padding:6px 0;border-bottom:1px solid var(--grey-light);">' +
          '<div style="font-size:13px;font-weight:500;">' + displayName + '</div>' +
          '<div style="display:flex;align-items:center;gap:2px;margin-top:2px;">' + starsHtml + labelHtml + '</div>' +
        '</div>';
      }).join('') + '</div></div>'
    : '';

  // Services accordion (always visible, like Projects)
  var servicesAccHtml = '<div class="accordion"><div class="accordion-header" onclick="toggleAcc(this)"><span><i class="fas fa-concierge-bell" style="color:var(--orange);margin-right:8px;"></i> Services</span><span style="color:var(--orange);font-size:14px;font-weight:700;">' + services.length + '</span></div><div class="accordion-body" style="padding:8px 12px;">' +
    (services.length > 0
      ? services.map(function(s) {
          return '<div class="biz-promo-card" style="margin-bottom:8px;padding:10px 12px;"><div style="font-weight:600;font-size:14px;">' + s.title + '</div>' + (s.description ? '<div style="font-size:12px;color:var(--grey-dark);margin-top:4px;">' + s.description + '</div>' : '') + (s.price ? '<div style="font-size:13px;font-weight:600;color:var(--orange);margin-top:6px;">' + s.price + '</div>' : '') + '</div>';
        }).join('')
      : '<p style="font-size:12px;color:var(--grey-dark);text-align:center;padding:16px;">No services listed yet.</p>'
    ) + '</div></div>';

  // Projects accordion
  var portfolio = profile ? profile.portfolio || [] : [];
  var projHtml = '<div class="accordion"><div class="accordion-header" onclick="toggleAcc(this)"><span><i class="fas fa-images" style="color:var(--orange);margin-right:8px;"></i> Projects</span><span style="color:var(--orange);font-size:14px;font-weight:700;">' + portfolio.length + '</span></div><div class="accordion-body" style="padding:8px 12px;">' +
    (portfolio.length > 0
      ? portfolio.map(function(p) {
          var imgHtml = p.image ? '<img src="' + p.image.replace(/'/g, "\\'") + '" alt="' + (p.title || '').replace(/'/g, "\\'") + '" style="width:100%;max-height:200px;object-fit:cover;border-radius:6px;margin-top:6px;" loading="lazy">' : '';
          var videoHtml = p.videoUrl ? '<div style="margin-top:4px;"><a href="' + p.videoUrl.replace(/'/g, "\\'") + '" target="_blank" style="font-size:12px;color:var(--orange);"><i class="fab fa-facebook"></i> View Video</a></div>' : '';
          return '<div style="padding:10px 0;border-bottom:1px solid var(--grey-light);">' +
            '<div style="font-weight:600;font-size:14px;">' + p.title + '</div>' +
            (p.description ? '<div style="font-size:12px;color:var(--grey-dark);margin-top:4px;">' + p.description + '</div>' : '') +
            imgHtml + videoHtml +
          '</div>';
        }).join('')
      : '<p style="font-size:12px;color:var(--grey-dark);text-align:center;padding:16px;">No projects listed yet.</p>'
    ) + '</div></div>';

  // Rates accordion
  var ratesAccHtml = mergedRate && mergedRate.rate
    ? '<div class="accordion"><div class="accordion-header" onclick="toggleAcc(this)"><span><i class="fas fa-tag" style="color:var(--orange);margin-right:8px;"></i> Rates</span></div><div class="accordion-body" style="padding:8px 12px;"><div class="biz-promo-card" style="margin-bottom:0;padding:10px 12px;"><div style="font-size:13px;color:var(--grey-dark);">' + (mergedRate.type === 'hourly' ? 'Hourly Rate' : mergedRate.type === 'fixed' ? 'Fixed Price' : 'Quote') + '</div><div style="font-size:18px;font-weight:700;color:var(--orange);">' + rateHtml + '</div></div></div></div>'
    : '';

  window._bizDropdownData = { bizId: proId, name: listing.name, phone: phoneClean, phoneWa, location: locStr };

  var proInit = listing.initials || (listing.name ? listing.name.split(' ').map(function(w) { return w[0]; }).join('').slice(0, 2).toUpperCase() : '?');
  var proCol = listing.color || window.APP_COLORS[proInit.charCodeAt(0) % window.APP_COLORS.length];
  var proImgSrc = (profile && profile.image) || listing.image || null;
  var avatarHtml = proImgSrc
    ? '<img src="' + proImgSrc.replace(/'/g, "\\'") + '" class="biz-avatar-img" style="object-fit:cover;" alt="" loading="lazy" width="80" height="80">'
    : '<div class="biz-avatar-img" style="background:' + proCol + ';">' + proInit + '</div>';

  // Split location for display
  var townPart = locStr;
  var areaPart = '';
  var locParts = locStr.split(',').map(function(s) { return s.trim(); });
  if (locParts.length > 1) {
    townPart = locParts[0];
    areaPart = locParts.slice(1).join(' \u00B7 ');
  }

  content.innerHTML =
    '<div style="padding:12px;">' +
      '<div class="biz-header-card">' +
        '<div class="biz-header-card-inner">' +
          avatarHtml +
          '<div class="biz-header-details">' +
            '<div class="biz-header-name">' + nameEsc + '</div>' +
            '<div class="biz-header-location">' + mergedTrade + (mergedTrade && townPart ? ' <span style="opacity:0.4;">\u00B7</span> ' : '') + townPart + (areaPart ? ' <span style="opacity:0.4;">\u00B7</span> ' + areaPart : '') + '</div>' +
            (availHtml ? '<div style="margin-top:4px;">' + availHtml + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      (starsHtml ? '<div style="margin-bottom:8px;">' + starsHtml + '</div>' : '') +
      (mergedDesc ? '<p class="biz-desc-text">' + mergedDesc + '</p>' : '') +
      (mergedAreas.length > 0 ? '<p style="font-size:12px;color:var(--grey-dark);margin:0 0 12px;"><i class="fas fa-map-pin" style="color:var(--orange);"></i> Service areas: ' + mergedAreas.join(', ') + '</p>' : '') +
      (isMine ? '<div style="margin-bottom:8px;"><button class="btn-sm" style="background:var(--orange);color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;" onclick="openProEditor()"><i class="fas fa-edit"></i> Edit Profile</button></div>' : '') +
      (!claimedBy && UserState.isTradesperson() && UserState.id !== 'guest' ? '<div style="margin-bottom:8px;"><button class="btn-sm" style="background:var(--orange);color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;" onclick="claimProListing(\'' + proId + '\',\'' + nameEsc + '\')"><i class="fas fa-hand-point-up"></i> Claim This Profile</button></div>' : '') +
    '</div>' +
    skillsAccHtml +
    projHtml +
    ratesAccHtml +
    servicesAccHtml +
    '<div class="accordion">' +
      '<div class="accordion-header" onclick="openBizPromos(\'' + proId + '\',\'' + nameEsc + '\')">' +
        '<span><i class="fas fa-bullhorn" style="color:var(--orange);margin-right:8px;"></i> Promos</span>' +
        '<span style="color:var(--orange);font-size:14px;font-weight:700;">' + (window._promos || []).filter(function(p) { return p.businessId === proId || p.businessName === listing.name; }).length + '</span>' +
      '</div>' +
    '</div>';

  var heartIcon = document.getElementById('biz-heart-icon');
  if (heartIcon) {
    heartIcon.setAttribute('onclick', "toggleFavBiz('" + proId + "')");
    var isFav = window.UserState && UserState.isFavourite(proId);
    heartIcon.src = 'assets/icons/' + (isFav ? 'heart_active_icon' : 'heart_inactive_icon') + '.webp';
  }

  if (window._onlineCounterInterval) clearInterval(window._onlineCounterInterval);
  window._onlineCounterInterval = null;
  if (isMine && getOnlineStatus(proId)) {
    window._onlineCounterInterval = setInterval(function() {
      var rem = getOnlineRemaining(proId);
      var el = document.getElementById('pro-online-counter');
      if (el) {
        el.textContent = '(' + formatRemaining(rem) + ')';
        if (rem <= 0) {
          clearInterval(window._onlineCounterInterval);
          window._onlineCounterInterval = null;
          // Re-render to show offline
          openProProfile(proId);
        }
      }
    }, 1000);
  }

  goTo('view-pro-profile');
};

function rateSkillFromProfile(proId, skillKey, stars) {
  if (!UserState || !UserState.id || UserState.id === 'guest') {
    showToast('Please log in to rate skills');
    return;
  }
  if (window.SkillRatings) {
    SkillRatings.rateSkill(proId, skillKey, stars, UserState.id);
    if (window.openProProfile) openProProfile(proId);
    showToast('Rated ' + stars + ' star' + (stars > 1 ? 's' : ''));
  }
}

