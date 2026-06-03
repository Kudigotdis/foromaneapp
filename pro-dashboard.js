/* ==========================================================
   FOROMANE PRO DASHBOARD - Full pro account management
   Handles: profile, online status, skills, projects (img+video),
   rates, services, activation
   ========================================================== */

var DASH_ONLINE_KEY = 'foromane_pro_online';

function getOnlineStatus(proId) {
  try {
    var val = localStorage.getItem(DASH_ONLINE_KEY + '_' + proId);
    if (!val || val === 'false') return false;
    if (val === 'true') {
      var expiry = Date.now() + 900000;
      localStorage.setItem(DASH_ONLINE_KEY + '_' + proId, String(expiry));
      return true;
    }
    var expiry = Number(val);
    return !isNaN(expiry) && Date.now() < expiry;
  } catch { return false; }
}

function setOnlineStatus(proId, online) {
  try {
    if (online) {
      localStorage.setItem(DASH_ONLINE_KEY + '_' + proId, String(Date.now() + 900000));
    } else {
      localStorage.setItem(DASH_ONLINE_KEY + '_' + proId, 'false');
    }
  } catch {}
}

function getOnlineRemaining(proId) {
  try {
    var val = localStorage.getItem(DASH_ONLINE_KEY + '_' + proId);
    if (!val || val === 'false') return 0;
    if (val === 'true') return 900000;
    var expiry = Number(val);
    if (isNaN(expiry)) return 0;
    return Math.max(0, expiry - Date.now());
  } catch { return 0; }
}

function refreshOnlineExpiry(proId) {
  try {
    if (!proId) return;
    if (getOnlineStatus(proId)) {
      setOnlineStatus(proId, true);
    }
  } catch {}
}

function formatRemaining(ms) {
  var totalSec = Math.max(0, Math.floor(ms / 1000));
  var min = Math.floor(totalSec / 60);
  var sec = totalSec % 60;
  return (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
}

function renderProDashboard() {
  var root = document.getElementById('pro-dashboard-content') || document.getElementById('pro-dashboard-root');
  if (!root) return;

  var s = UserState;
  if (!s || s.id === 'guest') {
    root.innerHTML =
      '<div style="padding:48px 16px;text-align:center;">' +
        '<p style="font-size:14px;color:var(--grey-dark);margin-bottom:16px;">Please log in to manage your Pro account.</p>' +
      '</div>';
    return;
  }

  var isPro = s.isTradesperson && s.isTradesperson();
  var claimedProId = getClaimedProId ? getClaimedProId(s.id) : null;
  var proListing = claimedProId && getProListing ? getProListing(claimedProId) : null;
  var profile = claimedProId && getProProfile ? getProProfile(claimedProId) : null;
  var services = claimedProId && getProServices ? getProServices(claimedProId) : [];
  var isOnline = claimedProId ? getOnlineStatus(claimedProId) : false;

  var skills = profile ? profile.skills || [] : [];
  var customSkills = profile ? profile.customSkills || [] : [];
  var portfolio = profile ? profile.portfolio || [] : [];
  var rateType = profile ? profile.rateType : 'quote';
  var rateVal = profile ? profile.rate : '';

  var tradeDisplayName = (profile && profile.trade) || (proListing ? (proListing.primaryTrade || '') : '') || '';
  var availableSkills = [];
  if (tradeDisplayName && window.TRADE_TO_SKILL_KEY) {
    var upperKey = window.TRADE_TO_SKILL_KEY[tradeDisplayName];
    if (upperKey && window.TRADESMAN_SKILLS) {
      availableSkills = window.TRADESMAN_SKILLS[upperKey] || [];
    }
  }

  var skillsHtml = availableSkills.length > 0 || customSkills.length > 0
    ? availableSkills.map(function(skillKey) {
        var checked = skills.indexOf(skillKey) !== -1 ? 'checked' : '';
        var displayName = window.SkillRatings ? SkillRatings.getSkillDisplayName(skillKey) : skillKey;
        return '<label class="skill-checkbox">' +
          '<input type="checkbox" ' + checked + ' onchange="window.dashToggleSkill(\'' + skillKey + '\', this.checked)">' +
          '<span>' + displayName + '</span></label>';
      }).join('') + customSkills.map(function(s) {
        return '<label class="skill-checkbox"><span>' + s + '</span></label>';
      }).join('')
    : '<div class="dash-empty" style="cursor:pointer;" onclick="window.openSkillsManager()">Tap to manage your skills \u2192</div>';

  var projectsHtml = portfolio.length > 0
    ? portfolio.map(function(p, i) {
        var imgHtml = p.image
          ? '<img src="' + p.image.replace(/'/g, "\\'") + '" alt="' + (p.title || '').replace(/'/g, "\\'") + '" onclick="window.open(\'' + p.image.replace(/'/g, "\\'") + '\',\'_blank\')" loading="lazy">'
          : '';
        var videoHtml = p.videoUrl
          ? '<div style="margin-top:4px;"><a href="' + p.videoUrl.replace(/'/g, "\\'") + '" target="_blank" style="font-size:12px;color:var(--orange);"><i class="fab fa-facebook"></i> View Video</a></div>'
          : '';
        return '<div class="project-card">' +
          '<div style="display:flex;justify-content:space-between;">' +
            '<strong>' + (p.title || 'Project') + '</strong>' +
            '<span style="color:#e74c3c;cursor:pointer;font-size:14px;" onclick="window.dashRemoveProject(' + i + ')">✕</span>' +
          '</div>' +
          (p.description ? '<p style="font-size:12px;color:var(--grey-dark);margin:4px 0 0;">' + p.description + '</p>' : '') +
          imgHtml +
          videoHtml +
        '</div>';
      }).join('')
    : '<div class="dash-empty">No projects yet. Add one below.</div>';

  var servicesHtml = services.length > 0
    ? services.map(function(svc, i) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid var(--grey-light);font-size:13px;">' +
          '<div><div style="font-weight:600;">' + svc.title + '</div>' +
          (svc.price ? '<div style="font-size:12px;color:var(--orange);">' + svc.price + '</div>' : '') +
          '</div>' +
          '<span style="color:#e74c3c;cursor:pointer;font-size:14px;" onclick="window.dashRemoveService(' + i + ')">✕</span>' +
        '</div>';
      }).join('')
    : '<div class="dash-empty">No services yet.</div>';

  var proName = proListing ? proListing.name : s.name;
  var proInit = proListing
    ? (proListing.initials || proName.split(' ').map(function(w){return w[0]}).join('').slice(0,2).toUpperCase())
    : s.name.split(' ').map(function(w){return w[0]}).join('').slice(0,2).toUpperCase();
  var proCol = proListing ? (proListing.color || '#fd7600') : '#fd7600';
  var proRole = tradeDisplayName || (proListing ? (proListing.primaryTrade || 'Tradesperson') : 'Tradesperson');

  var statusClass = isOnline ? 'online' : 'offline';
  var statusDot = isOnline ? '\u25CF' : '\u25CB';
  var statusText = isOnline ? 'Online' : 'Offline';

  // ── Header (no back button) ──
  var html =
    '<div class="dash-header" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--grey-light);">' +
      '<h1 style="font-size:18px;font-weight:700;margin:0;flex:1;">Pro Dashboard</h1>' +
    '</div>';

  if (!claimedProId) {
    if (isPro) {
      html +=
        '<div style="padding:32px 16px;text-align:center;">' +
          '<p style="font-size:14px;color:var(--grey-dark);margin-bottom:16px;">Link your Pro profile to start managing it.</p>' +
          '<button class="btn" onclick="window.dashActivatePro()" style="background:var(--orange);color:white;border:none;padding:14px 24px;border-radius:8px;cursor:pointer;font-size:15px;font-weight:600;"><i class="fas fa-user-tie"></i> Activate Pro Account</button>' +
        '</div>';
    } else {
      html +=
        '<div style="padding:32px 16px;text-align:center;">' +
          '<p style="font-size:14px;color:var(--grey-dark);margin-bottom:16px;">Activate your Pro account to get discovered by customers.</p>' +
          '<button class="btn" onclick="window.dashActivatePro()" style="background:var(--orange);color:white;border:none;padding:14px 24px;border-radius:8px;cursor:pointer;font-size:15px;font-weight:600;"><i class="fas fa-user-tie"></i> Activate Pro Account</button>' +
        '</div>';
    }
    html += '</div>';
    root.innerHTML = html;
    return;
  }

  // ── Profile Card ──
  html +=
    '<div class="profile-card" style="display:flex;align-items:center;gap:12px;padding:16px;border-bottom:1px solid var(--grey-light);">' +
      '<div class="profile-avatar" style="width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;flex-shrink:0;background:' + proCol + ';">' + proInit + '</div>' +
      '<div style="flex:1;">' +
        '<div style="font-size:16px;font-weight:700;">' + proName + '</div>' +
        '<div style="font-size:13px;color:var(--grey-dark);">' + proRole + '</div>' +
      '</div>' +
    '</div>';

  // ── Skills Card ──
  html +=
    '<div style="margin:12px 12px 0;background:#fff;border-radius:12px;border:1px solid var(--grey-light);box-shadow:0 1px 3px rgba(0,0,0,0.04);overflow:hidden;">' +
      '<div style="padding:12px 14px 4px;">' +
        '<h3 style="font-size:14px;font-weight:700;margin:0 0 8px;display:flex;align-items:center;gap:6px;cursor:pointer;" onclick="window.openSkillsManager()"><i class="fas fa-tools" style="color:var(--orange);"></i> Skills (' + (skills.length + customSkills.length) + ')</h3>' +
        '<div id="dash-skills-list">' + skillsHtml + '</div>' +
      '</div>' +
    '</div>';

  // ── Projects Card ──
  html +=
    '<div style="margin:12px 12px 0;background:#fff;border-radius:12px;border:1px solid var(--grey-light);box-shadow:0 1px 3px rgba(0,0,0,0.04);overflow:hidden;">' +
      '<div style="padding:12px 14px;">' +
        '<h3 style="font-size:14px;font-weight:700;margin:0 0 8px;display:flex;align-items:center;gap:6px;"><i class="fas fa-images" style="color:var(--orange);"></i> Projects (' + portfolio.length + ')</h3>' +
        '<div id="dash-projects-list">' + projectsHtml + '</div>' +
        '<div style="border-top:1px solid var(--grey-light);padding-top:10px;margin-top:8px;">' +
          '<button onclick="window.dashOpenProjectModal()" style="width:100%;display:flex;align-items:center;justify-content:center;gap:6px;background:var(--orange);color:white;border:none;padding:10px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;"><i class="fas fa-plus"></i> Add Project</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  // ── Services Card ──
  html +=
    '<div style="margin:12px 12px 0;background:#fff;border-radius:12px;border:1px solid var(--grey-light);box-shadow:0 1px 3px rgba(0,0,0,0.04);overflow:hidden;">' +
      '<div style="padding:12px 14px;">' +
        '<h3 style="font-size:14px;font-weight:700;margin:0 0 8px;display:flex;align-items:center;gap:6px;"><i class="fas fa-concierge-bell" style="color:var(--orange);"></i> Services (' + services.length + ')</h3>' +
        '<div id="dash-services-list">' + servicesHtml + '</div>' +
        '<div style="display:flex;gap:8px;margin-top:8px;">' +
          '<div style="flex:1;">' +
            '<input id="dash-srv-title" placeholder="Service title" style="width:100%;padding:9px 10px;border:1px solid var(--grey-light);border-radius:6px;font-size:13px;box-sizing:border-box;">' +
          '</div>' +
          '<div style="width:90px;flex-shrink:0;">' +
            '<input id="dash-srv-price" placeholder="Price" style="width:100%;padding:9px 10px;border:1px solid var(--grey-light);border-radius:6px;font-size:13px;box-sizing:border-box;">' +
          '</div>' +
          '<button class="btn-sm" onclick="window.dashAddService()" style="background:var(--orange);color:white;border:none;padding:9px 14px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;white-space:nowrap;">+ Add</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  // ── Action Buttons ──
  html +=
    '<div style="margin:12px 12px 80px;display:flex;flex-direction:column;gap:8px;">' +
      '<button onclick="window.openProEditor()" style="width:100%;padding:12px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;border:none;background:var(--orange);color:white;"><i class="fas fa-edit"></i> Edit Profile</button>' +
      '<button onclick="window.openProProfile(\'' + claimedProId + '\')" style="width:100%;padding:12px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;border:none;background:var(--orange);color:white;"><i class="fas fa-eye"></i> View Public Profile</button>' +
    '</div>';

  // ── Floating fixed bar (Back button + Online toggle) ──
  html +=
    '<div style="position:fixed;bottom:calc(56px + 20px);left:50%;transform:translateX(-50%);z-index:100;display:flex;align-items:center;gap:10px;box-shadow:0 2px 8px rgba(0,0,0,0.25);border-radius:1px;overflow:hidden;">' +
      '<button onclick="window.dashGoBack()" style="padding:12px 32px;background:var(--orange);color:white;border:none;cursor:pointer;font-size:14px;font-weight:600;">Back</button>' +
      (claimedProId ? '<div onclick="window.dashToggleOnline()" style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;padding:12px 16px;background:var(--orange);color:white;font-weight:600;">' + statusDot + ' ' + statusText + '</div>' : '') +
    '</div>';

  root.innerHTML = html;
}

// ─── Online Status Toggle ───
window.dashToggleOnline = function() {
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var current = getOnlineStatus(claimedProId);
  setOnlineStatus(claimedProId, !current);
  renderProDashboard();
  showToast(!current ? 'You are now online' : 'You are now offline');
};

// ─── Skills ───
window.dashToggleSkill = function(skillKey, checked) {
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
  renderProDashboard();
};

// ─── Projects (modal-based add/edit) ───
window.dashOpenProjectModal = function(index) {
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var profile = getProProfile(claimedProId) || {};
  var p = (typeof index === 'number' && profile.portfolio && profile.portfolio[index]) ? profile.portfolio[index] : null;

  var modal = document.getElementById('generic-modal');
  if (!modal) return;
  document.getElementById('generic-modal-title').textContent = p ? 'Edit Project' : 'Add Project';
  document.getElementById('generic-modal-body').innerHTML =
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<label>Project Title</label><input id="proj-modal-title" value="' + (p ? (p.title || '').replace(/"/g,'&quot;') : '') + '" style="padding:9px 10px;border:1px solid var(--grey-light);border-radius:6px;font-size:13px;box-sizing:border-box;">' +
      '<label>Description</label><textarea id="proj-modal-desc" rows="3" style="padding:9px 10px;border:1px solid var(--grey-light);border-radius:6px;font-size:13px;box-sizing:border-box;resize:vertical;font-family:var(--font-main);">' + (p ? (p.description || '').replace(/"/g,'&quot;') : '') + '</textarea>' +
      '<label>Image URL</label><input id="proj-modal-image" value="' + (p ? (p.image || '').replace(/"/g,'&quot;') : '') + '" placeholder="https://..." style="padding:9px 10px;border:1px solid var(--grey-light);border-radius:6px;font-size:13px;box-sizing:border-box;">' +
      '<label>Video URL (Facebook / YouTube)</label><input id="proj-modal-video" value="' + (p ? (p.videoUrl || '').replace(/"/g,'&quot;') : '') + '" placeholder="https://..." style="padding:9px 10px;border:1px solid var(--grey-light);border-radius:6px;font-size:13px;box-sizing:border-box;">' +
      '<div style="display:flex;gap:8px;">' +
        '<button class="btn btn-sm" onclick="window.dashSaveProject(' + (typeof index === 'number' ? index : '-1') + ')" style="flex:1;background:var(--orange);color:white;border:none;padding:9px 14px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">' + (p ? 'Update' : 'Add') + ' Project</button>' +
        '<button class="btn-outline btn-sm" onclick="closeModal(\'generic-modal\')" style="padding:9px 14px;border-radius:6px;cursor:pointer;font-size:13px;">Cancel</button>' +
      '</div>' +
    '</div>';
  openModal('generic-modal');
};

window.dashSaveProject = function(index) {
  var title = document.getElementById('proj-modal-title')?.value.trim();
  if (!title) { showToast('Enter a project title'); return; }
  var desc = document.getElementById('proj-modal-desc')?.value.trim() || '';
  var image = document.getElementById('proj-modal-image')?.value.trim() || '';
  var videoUrl = document.getElementById('proj-modal-video')?.value.trim() || '';

  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var profile = getProProfile(claimedProId) || {};
  if (!profile.portfolio) profile.portfolio = [];

  if (index >= 0 && index < profile.portfolio.length) {
    profile.portfolio[index] = { title: title, description: desc, image: image, videoUrl: videoUrl };
  } else {
    profile.portfolio.push({ title: title, description: desc, image: image, videoUrl: videoUrl });
  }
  saveProProfile(claimedProId, profile);
  closeModal('generic-modal');
  renderProDashboard();
  showToast(index >= 0 ? 'Project updated' : 'Project added');
};

window.dashRemoveProject = function(index) {
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var profile = getProProfile(claimedProId) || {};
  if (!profile.portfolio) return;
  profile.portfolio.splice(index, 1);
  saveProProfile(claimedProId, profile);
  renderProDashboard();
  showToast('Project removed');
};

// ─── Rates & Availability ───
window.dashSaveRates = function() {
  var rateType = document.getElementById('dash-rate-type')?.value;
  var rate = document.getElementById('dash-rate-value')?.value || '';
  var availability = document.getElementById('dash-avail')?.value;
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var profile = getProProfile(claimedProId) || {};
  profile.rateType = rateType;
  profile.rate = rate;
  profile.availability = availability;
  saveProProfile(claimedProId, profile);
  renderProDashboard();
};

// ─── Services ───
window.dashAddService = function() {
  var title = document.getElementById('dash-srv-title')?.value.trim();
  if (!title) { showToast('Enter a service title'); return; }
  var price = document.getElementById('dash-srv-price')?.value.trim() || 'Quote';
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var services = getProServices(claimedProId) || [];
  services.push({ id: 'srv_' + Date.now(), title: title, price: price });
  saveProServices(claimedProId, services);
  document.getElementById('dash-srv-title').value = '';
  document.getElementById('dash-srv-price').value = '';
  renderProDashboard();
  showToast('Service added');
};

window.dashRemoveService = function(idx) {
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var services = getProServices(claimedProId) || [];
  services.splice(idx, 1);
  saveProServices(claimedProId, services);
  renderProDashboard();
  showToast('Service removed');
};

// ─── Activate / Navigation ───
window.dashActivatePro = function() {
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
  renderProDashboard();
  if (window.renderDirectory) renderDirectory();
  showToast('Pro account activated!');
};

window.dashGoBack = function() {
  if (window.goBack) goBack();
};

// ─── Skills Manager Modal ───
window.openSkillsManager = function() {
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) { showToast('No pro listing claimed'); return; }
  var profile = getProProfile(claimedProId) || {};
  var proListing = getProListing(claimedProId);
  var tradeDisplayName = (profile && profile.trade) || (proListing ? (proListing.primaryTrade || '') : '') || '';
  var tradeKey = tradeDisplayName && window.TRADE_TO_SKILL_KEY ? window.TRADE_TO_SKILL_KEY[tradeDisplayName] : null;
  var allSkills = tradeKey && window.TRADESMAN_SKILLS ? window.TRADESMAN_SKILLS[tradeKey] || [] : [];
  var userSkills = profile.skills || [];
  var customSkills = profile.customSkills || [];

  var body = document.getElementById('skills-manager-body');
  if (!body) return;

  var html = '';

  // Trade name header
  if (tradeDisplayName) {
    html += '<div style="padding:8px 0 4px;font-size:12px;font-weight:600;color:var(--grey-dark);text-transform:uppercase;letter-spacing:0.5px;">' + tradeDisplayName + '</div>';
  } else {
    html += '<div style="padding:12px;text-align:center;font-size:13px;color:var(--grey-dark);">Set your trade in Edit Profile to see available skills.</div>';
  }

  // Existing skills as checkboxes
  allSkills.forEach(function(skillKey) {
    var displayName = window.SkillRatings ? SkillRatings.getSkillDisplayName(skillKey) : skillKey;
    var checked = userSkills.indexOf(skillKey) !== -1 ? 'checked' : '';
    html +=
      '<label style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--grey-light);cursor:pointer;font-size:13px;">' +
        '<input type="checkbox" class="dash-skill-cb" value="' + skillKey.replace(/'/g, "\\'") + '" ' + checked + ' style="accent-color:var(--orange);width:18px;height:18px;">' +
        '<span>' + displayName + '</span>' +
      '</label>';
  });

  // Custom skills section
  html +=
    '<div style="padding:12px 0 4px;font-size:12px;font-weight:600;color:var(--grey-dark);text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid var(--grey-light);margin-top:8px;">Custom Skills</div>' +
    '<div style="display:flex;gap:6px;margin-bottom:8px;">' +
      '<input id="dash-new-custom-skill" placeholder="Type a custom skill..." style="flex:1;padding:9px 10px;border:1px solid var(--grey-light);border-radius:6px;font-size:13px;box-sizing:border-box;">' +
      '<button onclick="window.dashAddCustomSkill()" style="background:var(--orange);color:white;border:none;padding:9px 14px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">+ Add</button>' +
    '</div>' +
    '<div id="dash-custom-skills-list">';

  customSkills.forEach(function(s, i) {
    html +=
      '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--grey-light);font-size:13px;">' +
        '<span style="flex:1;">' + s + '</span>' +
        '<span onclick="window.dashRemoveCustomSkill(' + i + ')" style="color:#e74c3c;cursor:pointer;font-size:14px;">✕</span>' +
      '</div>';
  });

  html += '</div>';

  // Save button
  html +=
    '<button onclick="window.dashSaveSkills()" style="width:100%;padding:12px;margin-top:12px;border-radius:1px;background:var(--orange);color:white;border:none;cursor:pointer;font-size:14px;font-weight:600;">Save Skills</button>';

  body.innerHTML = html;
  openModal('skills-manager-modal');
};

window.dashAddCustomSkill = function() {
  var input = document.getElementById('dash-new-custom-skill');
  if (!input) return;
  var val = input.value.trim();
  if (!val) { showToast('Enter a skill name'); return; }
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var profile = getProProfile(claimedProId) || {};
  if (!profile.customSkills) profile.customSkills = [];
  if (profile.customSkills.indexOf(val) !== -1) { showToast('Already added'); return; }
  profile.customSkills.push(val);
  saveProProfile(claimedProId, profile);
  input.value = '';
  openSkillsManager();
};

window.dashRemoveCustomSkill = function(index) {
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var profile = getProProfile(claimedProId) || {};
  if (!profile.customSkills) return;
  profile.customSkills.splice(index, 1);
  saveProProfile(claimedProId, profile);
  openSkillsManager();
};

window.dashSaveSkills = function() {
  var claimedProId = getClaimedProId ? getClaimedProId(UserState.id) : null;
  if (!claimedProId) return;
  var profile = getProProfile(claimedProId) || {};
  var checked = document.querySelectorAll('.dash-skill-cb:checked');
  profile.skills = [];
  checked.forEach(function(cb) { profile.skills.push(cb.value); });
  saveProProfile(claimedProId, profile);
  closeModal('skills-manager-modal');
  renderProDashboard();
  showToast('Skills saved');
};

window.renderProDashboard = renderProDashboard;
