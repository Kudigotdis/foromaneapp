/* ═══════════════════════════════════════════════════════
   CLIENT LIST TAB - Users, Businesses, Pros
   ═══════════════════════════════════════════════════════ */

function _formatDate(ts) {
  if (!ts) return '';
  var s = ts.seconds || ts._seconds;
  if (!s) {
    if (typeof ts === 'number') s = Math.floor(ts / 1000);
    else return '';
  }
  var d = new Date(s * 1000);
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function _daysAgo(ts) {
  if (!ts) return null;
  var s = ts.seconds || ts._seconds;
  if (!s) return null;
  var now = Date.now() / 1000;
  var diff = now - s;
  if (diff < 900) return 'online';
  if (diff < 86400) return 'today';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return null;
}

const ClientListTab = {
  render(container) {
    const data = window.Admin.data;
    const state = window.AdminState;
    const users = data.getUsers();
    const businesses = data.getBusinesses();
    const pros = data.getPros();

    if (!container.querySelector('.admin-pills')) {
      container.innerHTML = `
        <div class="admin-pills"></div>
        <div class="client-search-box">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search users..." value="${state.searchQuery}">
          <i class="fas fa-times clear-search" style="display:${state.searchQuery ? '' : 'none'};"></i>
        </div>
        <div class="admin-results"></div>
      `;
      var input = container.querySelector('.client-search-box input');
      input.addEventListener('input', function() {
        AdminState.searchQuery = this.value;
        ClientListTab.renderResults(container);
      });
      container.querySelector('.clear-search').addEventListener('click', function() {
        AdminState.searchQuery = '';
        container.querySelector('.client-search-box input').value = '';
        ClientListTab.renderResults(container);
      });
    }

    container.querySelector('.admin-pills').innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <button class="pill ${state.clientListSub === 'users' ? 'active' : ''}" 
          onclick="AdminState.setClientSub('users')">Users (${users.length})</button>
        <button class="pill ${state.clientListSub === 'businesses' ? 'active' : ''}" 
          onclick="AdminState.setClientSub('businesses')">Businesses (${businesses.length})</button>
        <button class="pill ${state.clientListSub === 'pros' ? 'active' : ''}" 
          onclick="AdminState.setClientSub('pros')">Pros (${pros.length})</button>
      </div>`;

    container.querySelector('.client-search-box input').value = state.searchQuery;
    container.querySelector('.clear-search').style.display = state.searchQuery ? '' : 'none';

    this.renderResults(container);
  },

  renderResults(container) {
    const data = window.Admin.data;
    const state = window.AdminState;
    const users = data.getUsers();
    const businesses = data.getBusinesses();
    const pros = data.getPros();

    var resultsDiv = container.querySelector('.admin-results');
    if (resultsDiv) {
      resultsDiv.innerHTML = this.renderContent(state.clientListSub, users, businesses, pros);
    }
  },

  renderContent(sub, users, businesses, pros) {
    if (sub === 'users') return this.renderUsers(users);
    if (sub === 'businesses') return this.renderBusinesses(businesses);
    if (sub === 'pros') return this.renderPros(pros);
    return '';
  },

  getAvatarHtml(name, initials, color, image) {
    const safeName = name ? encodeURIComponent(name.replace(/\s+/g, ' ')) : '';
    const imgSrc = image || (safeName ? 'assets/images/profile_pictures_dummy/' + safeName + '.jpg' : 'assets/images/profile_pictures_dummy/demo-profile.jpg');
    return '<img src="' + imgSrc + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;display:block;"' +
      ' onerror="this.outerHTML=\'<div class=\\\\\'client-avatar-fallback\\\\\' style=\\\\\'background:' + (color || '#2a4a8c') + ';\\\\\'>' + (initials || 'U') + '</div>\'">';
  },

  renderUsers(users) {
    const state = window.AdminState;
    let filtered = users;

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = users.filter(function(u) {
        return (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.town && u.town.toLowerCase().includes(q)) ||
          (u.id && u.id.toLowerCase().includes(q)) ||
          (u.cloudEmail && u.cloudEmail.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q));
      });
    }

    if (filtered.length === 0) {
      return '<div style="text-align:center;padding:30px;color:var(--grey-dark);">No users found</div>';
    }

    return '<div class="admin-user-list">' + filtered.map(function(u) {
      var status = u.status || 'active';
      var statusBadge = status === 'active' ? '' : status === 'suspended'
        ? '<span style="background:#fff3e0;color:#e65100;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:6px;">Suspended</span>'
        : '<span style="background:#ffebee;color:#c62828;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:6px;">Banned</span>';

      var freshness = _daysAgo(u.createdAt);
      var freshnessBadge = freshness === 'online'
        ? '<span style="background:#e8f5e9;color:#2e7d32;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:6px;">● Online</span>'
        : freshness === 'today'
        ? '<span style="background:#e8f5e9;color:#2e7d32;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:6px;">Today</span>'
        : '';

      var displayName = (u.firstName || '') + ' ' + (u.surname || '');
      if (!displayName.trim()) displayName = u.name || 'Unknown';
      var usernameHtml = u.username ? '<div class="client-meta" style="color:var(--grey-dark);font-size:12px;">@' + u.username + '</div>' : '';
      var phoneHtml = (u.primaryMobile || u.phone || '') ? '<div class="client-meta" style="font-size:12px;"><span style="color:var(--grey-dark);">📞</span> ' + (u.primaryMobile || u.phone) + '</div>' : '';
      var waHtml = u.primaryWhatsApp ? '<div class="client-meta" style="font-size:12px;"><span style="color:var(--grey-dark);">💬</span> ' + u.primaryWhatsApp + '</div>' : '';
      var townVal = (u.location && u.location.town) || u.town || '';
      var areaVal = (u.location && u.location.area) || '';
      var townHtml = townVal ? '<div class="client-meta" style="font-size:12px;"><span style="color:var(--grey-dark);">📍</span> ' + townVal + '</div>' : '';
      var areaHtml = areaVal ? '<div class="client-meta" style="font-size:12px;"><span style="color:var(--grey-dark);">📍</span> ' + areaVal + '</div>' : '';

      return '<div class="client-row" onclick="Admin.showUserDetail(\'' + u.id + '\')" style="cursor:pointer;">' +
        '<div class="client-avatar-wrap">' +
          this.getAvatarHtml(u.name, u.initials, u.color, u.image) +
        '</div>' +
        '<div class="client-info">' +
          '<div class="client-name">' + displayName + statusBadge + freshnessBadge + '</div>' +
          usernameHtml +
          phoneHtml +
          waHtml +
          townHtml +
          areaHtml +
        '</div>' +
      '</div>';
    }, this).join('') + '</div>';
  },

  renderBusinesses(businesses) {
    const state = window.AdminState;
    let filtered = businesses;

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = businesses.filter(function(b) {
        return (b.name && b.name.toLowerCase().includes(q)) ||
          (b.category && b.category.toLowerCase().includes(q)) ||
          (b.location && b.location.toLowerCase().includes(q));
      });
    }

    if (state.alphaFilter) {
      filtered = filtered.filter(function(b) { return b.name && b.name.toUpperCase().startsWith(state.alphaFilter); });
    }

    if (filtered.length === 0) {
      return '<div style="text-align:center;padding:30px;color:var(--grey-dark);">No businesses found</div>';
    }

    return filtered.map(function(b) {
      return '<div class="client-row">' +
        '<div class="client-avatar-wrap">' +
          '<div class="client-avatar" style="background:' + (b.color || '#fd7600') + '; overflow:hidden;">' +
            (b.logo ? '<img src="' + b.logo + '" style="width:100%;height:100%;object-fit:cover;display:block;">' : (b.initials || 'B')) +
          '</div>' +
        '</div>' +
        '<div class="client-info">' +
          '<div class="client-name">' + (b.name || 'Unknown') + '</div>' +
          '<div class="client-meta">' + (b.category || '') + ' · ' + (b.location || '') + '</div>' +
          '<div class="client-role">' + (b.subscription || 'basic') + ' · P' + (b.totalSpend || 0) + ' spent</div>' +
        '</div>' +
        '<div class="client-actions">' +
          '<span style="font-size:11px;color:var(--orange);margin-right:8px;">' + (b.activePromos || 0) + ' active</span>' +
          '<button class="btn-sm" onclick="AdminState.setAnalyticsBiz(\'' + b.id + '\');AdminState.toggleSection(\'analytics\')">Stats</button>' +
        '</div>' +
      '</div>';
    }).join('');
  },

  renderPros(pros) {
    const state = window.AdminState;
    let filtered = pros;

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = pros.filter(function(p) {
        return (p.name && p.name.toLowerCase().includes(q)) ||
          (p.specialty && p.specialty.toLowerCase().includes(q));
      });
    }

    if (filtered.length === 0) {
      return '<div style="text-align:center;padding:30px;color:var(--grey-dark);">No pros found</div>';
    }

    return filtered.map(function(p) {
      return '<div class="client-row">' +
        '<div class="client-avatar-wrap">' +
          this.getAvatarHtml(p.name, p.initials, p.color, p.image) +
        '</div>' +
        '<div class="client-info">' +
          '<div class="client-name">' + (p.name || 'Unknown') + '</div>' +
          '<div class="client-meta">' + (p.specialty || p.role || '') + ' · ' + (p.location || '') + '</div>' +
        '</div>' +
        '<div class="client-actions">' +
          '<button class="btn-sm" onclick="Admin.showProDetail(\'' + p.id + '\')">View</button>' +
        '</div>' +
      '</div>';
    }, this).join('');
  }
};

window.ClientListTab = ClientListTab;
