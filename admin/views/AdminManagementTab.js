/* ═══════════════════════════════════════════════════════
   ADMIN MANAGEMENT TAB - List, add, remove admins
   ═══════════════════════════════════════════════════════ */

const AdminManagementTab = {
  render(container) {
    const data = window.Admin.data;
    const admins = data.getAdmins();
    const isSuperAdmin = data.isSuperAdmin();

    container.innerHTML = `
      <div class="section-title">CURRENT ADMINS</div>
      <div class="admin-list">
        ${admins.map(a => this.renderAdminRow(a, isSuperAdmin)).join('')}
      </div>
      ${admins.length === 0 && window.UserState && window.UserState.id !== 'guest' ? `
        <div style="margin-top:16px;padding:12px;background:#fff3e0;border-radius:8px;text-align:center;">
          <p style="font-size:13px;margin-bottom:8px;">No admins configured in Firestore yet.</p>
          <button class="btn" onclick="Admin.registerAdmin('${window.UserState.id}')" style="background:var(--orange);color:#fff;border:none;">
            <i class="fas fa-shield-alt"></i> Register as First Admin
          </button>
        </div>
      ` : ''}
      ${isSuperAdmin ? `
        <div style="margin-top:16px;">
          <button class="btn" onclick="Admin.showAddAdminModal()">
            <i class="fas fa-plus"></i> Add Admin
          </button>
        </div>
        <div id="add-admin-modal" style="display:none;margin-top:16px;">
          <input type="text" id="new-admin-search" placeholder="Search users..." 
            style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:10px;">
          <div id="user-search-results" style="max-height:200px;overflow-y:auto;"></div>
        </div>
      ` : '<div style="margin-top:16px;color:var(--grey-dark);font-size:13px;">Only Super Admin can manage admins</div>'}
    `;

    if (isSuperAdmin) {
      const searchInput = document.getElementById('new-admin-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => this.searchUsers(e.target.value));
      }
    }
  },

  getAvatarHtml(name, initials, color, image = null) {
    const safeName = name ? encodeURIComponent(name.replace(/\s+/g, ' ')) : '';
    const imgSrc = image || (safeName ? `assets/images/profile_pictures_dummy/${safeName}.jpg` : `assets/images/profile_pictures_dummy/demo-profile.jpg`);
    return `<img src="${imgSrc}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;display:block;"
      onerror="this.outerHTML='<div class=\\'admin-avatar-fallback\\' style=\\'background:${color || '#2a2a2a'};\\'>${initials || 'A'}</div>'">`;
  },

  renderAdminRow(admin, isSuperAdmin) {
    return `
      <div class="admin-row">
        <div class="admin-avatar-wrap">
          ${this.getAvatarHtml(admin.name, admin.initials, admin.color, admin.image)}
        </div>
        <div class="admin-info">
          <div class="admin-name">${admin.name || 'Unknown'}</div>
          <div class="admin-meta">${admin.email || ''} · ${admin.role || ''}</div>
        </div>
        <div class="admin-badges">
          ${admin.isSuperAdmin ? '<span class="super-badge">Super Admin</span>' : ''}
        </div>
        <div class="admin-actions">
          ${!admin.isSuperAdmin && isSuperAdmin ? `
            <button class="btn-sm btn-remove" onclick="Admin.removeAdmin('${admin.id}')">Remove</button>
          ` : ''}
        </div>
      </div>
    `;
  },

  searchUsers(query) {
    const data = window.Admin.data;
    const results = document.getElementById('user-search-results');
    if (!results) return;

    if (!query || query.length < 2) {
      results.innerHTML = '';
      return;
    }

    const q = query.toLowerCase();
    const users = data.getUsers().filter(u => 
      u.name?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q)
    ).slice(0, 10);

    if (users.length === 0) {
      results.innerHTML = '<div style="padding:10px;color:var(--grey-dark);">No users found</div>';
      return;
    }

    results.innerHTML = users.map(u => {
      const safeName = u.name ? encodeURIComponent(u.name.replace(/\s+/g, ' ')) : '';
      const imgSrc = u.image || (safeName ? `assets/images/profile_pictures_dummy/${safeName}.jpg` : `assets/images/profile_pictures_dummy/demo-profile.jpg`);
      return `
        <div class="user-search-row" onclick="Admin.addAdmin('${u.id}')">
          <div class="user-search-avatar-wrap">
            <img src="${imgSrc}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;display:block;"
              onerror="this.outerHTML='<div style=\\'width:32px;height:32px;border-radius:50%;background:${u.color || '#2a4a8c'};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;\\'>${u.initials || 'U'}</div>'">
          </div>
          <div class="user-search-info">
            <div>${u.name || 'Unknown'}</div>
            <div style="font-size:11px;color:var(--grey-dark);">${u.email || ''}</div>
          </div>
        </div>
      `;
    }).join('');
  }
};

window.AdminManagementTab = AdminManagementTab;