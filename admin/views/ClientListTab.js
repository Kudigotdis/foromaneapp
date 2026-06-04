/* ═══════════════════════════════════════════════════════
   CLIENT LIST TAB - Users, Businesses, Pros
   ═══════════════════════════════════════════════════════ */

const ClientListTab = {
  render(container) {
    const data = window.Admin.data;
    const state = window.AdminState;
    const users = data.getUsers();
    const businesses = data.getBusinesses();
    const pros = data.getPros();

    container.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <button class="pill ${state.clientListSub === 'users' ? 'active' : ''}" 
          onclick="AdminState.setClientSub('users')">Users (${users.length})</button>
        <button class="pill ${state.clientListSub === 'businesses' ? 'active' : ''}" 
          onclick="AdminState.setClientSub('businesses')">Businesses (${businesses.length})</button>
        <button class="pill ${state.clientListSub === 'pros' ? 'active' : ''}" 
          onclick="AdminState.setClientSub('pros')">Pros (${pros.length})</button>
      </div>
      <div class="client-search-box">
        <i class="fas fa-search"></i>
        <input type="text" placeholder="Search ${state.clientListSub}..." value="${state.searchQuery}"
          oninput="AdminState.setSearch(this.value)">
        ${state.searchQuery ? `<i class="fas fa-times" onclick="AdminState.setSearch('')" style="cursor:pointer;"></i>` : ''}
      </div>
      ${this.renderContent(state.clientListSub, users, businesses, pros)}
    `;
  },

  renderContent(sub, users, businesses, pros) {
    if (sub === 'users') return this.renderUsers(users);
    if (sub === 'businesses') return this.renderBusinesses(businesses);
    if (sub === 'pros') return this.renderPros(pros);
    return '';
  },

  getAvatarHtml(name, initials, color, image = null, fallback = 'demo-profile') {
    const safeName = name ? encodeURIComponent(name.replace(/\s+/g, ' ')) : '';
    const imgSrc = image || (safeName ? `assets/images/profile_pictures_dummy/${safeName}.jpg` : `assets/images/profile_pictures_dummy/${fallback}.jpg`);
    return `<img src="${imgSrc}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;display:block;"
      onerror="this.outerHTML='<div class=\\'client-avatar-fallback\\' style=\\'background:${color || '#2a4a8c'};\\'>${initials || 'U'}</div>'">`;
  },

  renderUsers(users) {
    const state = window.AdminState;
    let filtered = users;
    
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = users.filter(u => 
        u.name?.toLowerCase().includes(q) || 
        u.email?.toLowerCase().includes(q) ||
        u.town?.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      return '<div style="text-align:center;padding:30px;color:var(--grey-dark);">No users found</div>';
    }

    return filtered.map(u => {
      var status = u.status || 'active';
      var statusBadge = status === 'active' ? '' : status === 'suspended'
        ? '<span style="background:#fff3e0;color:#e65100;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:6px;">Suspended</span>'
        : '<span style="background:#ffebee;color:#c62828;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:6px;">Banned</span>';
      return `
      <div class="client-row">
        <div class="client-avatar-wrap">
          ${this.getAvatarHtml(u.name, u.initials, u.color, u.image, 'demo-profile')}
        </div>
        <div class="client-info">
          <div class="client-name">${u.name || 'Unknown'}${statusBadge}</div>
          <div class="client-meta">${u.email || ''} · ${u.town || ''}</div>
          <div class="client-role">${u.role || 'General User'}</div>
        </div>
        <div class="client-actions">
          <button class="btn-sm" onclick="Admin.showUserDetail('${u.id}')">View</button>
        </div>
      </div>
    `}).join('');
  },

  renderBusinesses(businesses) {
    const state = window.AdminState;
    let filtered = businesses;
    
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = businesses.filter(b => 
        b.name?.toLowerCase().includes(q) || 
        b.category?.toLowerCase().includes(q) ||
        b.location?.toLowerCase().includes(q)
      );
    }

    if (state.alphaFilter) {
      filtered = filtered.filter(b => b.name?.toUpperCase().startsWith(state.alphaFilter));
    }

    if (filtered.length === 0) {
      return '<div style="text-align:center;padding:30px;color:var(--grey-dark);">No businesses found</div>';
    }

    return filtered.map(b => `
      <div class="client-row">
        <div class="client-avatar-wrap">
          <div class="client-avatar" style="background:${b.color || '#fd7600'}; overflow:hidden;">
            ${b.logo ? `<img src="${b.logo}" style="width:100%;height:100%;object-fit:cover;display:block;">` : (b.initials || 'B')}
          </div>
        </div>
        <div class="client-info">
          <div class="client-name">${b.name || 'Unknown'}</div>
          <div class="client-meta">${b.category || ''} · ${b.location || ''}</div>
          <div class="client-role">${b.subscription || 'basic'} · P${b.totalSpend || 0} spent</div>
        </div>
        <div class="client-actions">
          <span style="font-size:11px;color:var(--orange);margin-right:8px;">${b.activePromos || 0} active</span>
          <button class="btn-sm" onclick="AdminState.setAnalyticsBiz('${b.id}');AdminState.toggleSection('analytics')">Stats</button>
        </div>
      </div>
    `).join('');
  },

  renderPros(pros) {
    const state = window.AdminState;
    let filtered = pros;
    
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = pros.filter(p => 
        p.name?.toLowerCase().includes(q) || 
        p.specialty?.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      return '<div style="text-align:center;padding:30px;color:var(--grey-dark);">No pros found</div>';
    }

    return filtered.map(p => `
      <div class="client-row">
        <div class="client-avatar-wrap">
          ${this.getAvatarHtml(p.name, p.initials, p.color, p.image, 'demo-profile')}
        </div>
        <div class="client-info">
          <div class="client-name">${p.name || 'Unknown'}</div>
          <div class="client-meta">${p.specialty || p.role || ''} · ${p.location || ''}</div>
        </div>
        <div class="client-actions">
          <button class="btn-sm" onclick="Admin.showProDetail('${p.id}')">View</button>
        </div>
      </div>
    `).join('');
  }
};

window.ClientListTab = ClientListTab;