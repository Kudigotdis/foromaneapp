/* ═══════════════════════════════════════════════════════
   SUPER ADMIN DASHBOARD - Main Controller
   ═══════════════════════════════════════════════════════ */

const Admin = {
  data: null,

  async init() {
    this.data = new window.AdminData();
    await this.data.fetchFirestoreData();
    this.injectStyles();
    this.render();
  },

  injectStyles() {
    if (document.getElementById('admin-super-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'admin-super-styles';
    styles.textContent = `
      .super-admin-header {
        background: var(--orange);
        padding: 16px;
        color: #fff;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .super-admin-title {
        font-family: var(--font-head);
        font-size: 20px;
        font-weight: 700;
        margin: 0;
      }
      .super-admin-sub {
        font-size: 12px;
        opacity: 0.8;
        margin-top: 4px;
      }
      
      .super-accordion {
        border-bottom: 1px solid var(--grey-light);
      }
      .super-accordion-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        background: #fff;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
      }
      .super-accordion-header:hover {
        background: var(--grey-light);
      }
      .super-accordion-icon {
        transition: transform 0.2s;
      }
      .super-accordion.open .super-accordion-icon {
        transform: rotate(180deg);
      }
      .super-accordion-content {
        display: none;
        padding: 0 16px 16px;
        background: var(--bg);
      }
      .super-accordion.open .super-accordion-content {
        display: block;
      }
      
      .section-title {
        font-size: 11px;
        font-weight: 600;
        color: var(--grey-dark);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 16px 0 8px;
      }
      
      .kpi-card {
        background: #fff;
        border-radius: 10px;
        padding: 12px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
      .kpi-num {
        font-family: var(--font-head);
        font-size: 22px;
        font-weight: 800;
      }
      .kpi-label {
        font-size: 11px;
        color: var(--grey-dark);
        margin-top: 2px;
      }
      
      .pill {
        padding: 6px 12px;
        border-radius: 20px;
        border: 1px solid var(--grey-light);
        background: #fff;
        font-size: 12px;
        cursor: pointer;
        color: var(--grey-dark);
      }
      .pill.active {
        background: var(--orange);
        border-color: var(--orange);
        color: #fff;
      }
      
      .payment-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 16px;
      }
      .payment-item {
        background: #fff;
        border-radius: 8px;
        padding: 10px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
      .payment-logo { margin-bottom: 4px; }
      .payment-amount { font-weight: 700; font-size: 14px; color: var(--orange); }
      .payment-count { font-size: 10px; color: var(--grey-dark); }
      
      .expiring-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #fff;
        padding: 10px 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
      .expiring-title { font-weight: 600; font-size: 13px; }
      .expiring-meta { font-size: 11px; color: var(--grey-dark); margin-top: 2px; }
      .expiring-actions { display: flex; gap: 6px; }
      
      .client-row {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #fff;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
      .client-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        font-size: 14px;
        flex-shrink: 0;
      }
      .client-info { flex: 1; min-width: 0; }
      .client-name { font-weight: 600; font-size: 13px; }
      .client-meta { font-size: 11px; color: var(--grey-dark); margin-top: 2px; }
      .client-role { font-size: 10px; color: var(--orange); margin-top: 2px; }
      .client-actions { display: flex; gap: 6px; }
      
      .btn-sm {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        cursor: pointer;
        border: 1px solid var(--border);
        background: #fff;
      }
      
      .approval-card {
        background: #fff;
        border-radius: 10px;
        padding: 12px;
        margin-bottom: 10px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        border-left: 3px solid var(--orange);
      }
      .approval-header { display: flex; gap: 10px; }
      .approval-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
      }
      .type-promo { background: #fff3e0; }
      .type-payment { background: #e8f5ec; }
      .type-artwork { background: #e3f0fb; }
      .type-onboarding { background: #f3e5f5; }
      .approval-title { font-weight: 600; font-size: 13px; }
      .approval-meta { font-size: 12px; color: var(--grey-dark); margin-top: 2px; }
      .approval-date { font-size: 11px; color: var(--grey-mid); margin-top: 4px; }
      .approval-actions { display: flex; gap: 8px; margin-top: 10px; }
      .btn-approve { background: #2e7d32; color: #fff; border: none; }
      .btn-reject { background: #c62828; color: #fff; border: none; }
      .status-pending { color: #f57c00; }
      .status-approved { color: #2e7d32; }
      .status-rejected { color: #c62828; }
      
      .fb-day-section { margin-bottom: 16px; }
      .fb-day-header { font-weight: 700; font-size: 13px; color: var(--orange); margin-bottom: 8px; }
      .fb-slot-row {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #fff;
        padding: 8px 10px;
        border-radius: 6px;
        margin-bottom: 4px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.06);
      }
      .fb-slot-date { font-weight: 600; font-size: 12px; width: 24px; }
      .fb-slot-posts { flex: 1; display: flex; flex-wrap: wrap; gap: 4px; }
      .fb-post-chip { background: var(--orange-light); color: var(--orange); padding: 2px 6px; border-radius: 4px; font-size: 10px; }
      .fb-slot-empty { font-size: 11px; color: var(--grey-mid); }
      
      .unassigned-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #fff;
        padding: 10px 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
      .unassigned-biz { font-weight: 600; font-size: 13px; }
      .unassigned-meta { font-size: 11px; color: var(--grey-dark); margin-top: 2px; }
      
      .search-box {
        position: relative;
        margin-bottom: 12px;
      }
      .search-box input {
        width: 100%;
        padding: 10px 12px 10px 36px;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 13px;
      }
      .search-box i {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--grey-mid);
      }
      
      .alpha-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 12px;
      }
      .alpha-btn {
        width: 26px;
        height: 26px;
        border-radius: 4px;
        border: 1px solid var(--border);
        background: #fff;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        color: var(--grey-mid);
      }
      .alpha-btn.active { background: var(--orange); color: #fff; border-color: var(--orange); }
      .alpha-btn.has-biz { color: var(--dark); border-color: #ccc; }
      
      .biz-row {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #fff;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        cursor: pointer;
      }
      .biz-avatar {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        font-size: 14px;
        flex-shrink: 0;
      }
      .biz-details { flex: 1; min-width: 0; }
      .biz-name { font-weight: 600; font-size: 13px; }
      .biz-meta { font-size: 11px; color: var(--grey-dark); margin-top: 2px; }
      .biz-stats { display: flex; gap: 12px; font-size: 11px; margin-top: 4px; }
      .biz-active { color: #2e7d32; }
      
      .month-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #fff;
        padding: 10px 12px;
        border-radius: 8px;
        margin-bottom: 6px;
        cursor: pointer;
        box-shadow: 0 1px 2px rgba(0,0,0,0.06);
      }
      .month-name { font-weight: 600; font-size: 13px; }
      .month-arrow { font-size: 10px; color: var(--grey-mid); }
      
      .admin-row {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #fff;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
      .admin-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        font-size: 14px;
      }
      .admin-info { flex: 1; }
      .admin-name { font-weight: 600; font-size: 13px; }
      .admin-meta { font-size: 11px; color: var(--grey-dark); margin-top: 2px; }
      .admin-badges { margin-right: 8px; }
      .super-badge { background: var(--orange); color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
      .btn-remove { background: #c62828; color: #fff; border: none; }
      
      .client-avatar-wrap { flex-shrink: 0; }
      .client-avatar, .client-avatar-fallback, .admin-avatar-fallback {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        font-size: 14px;
      }
      
      .client-search-box {
        position: relative;
        margin-bottom: 12px;
      }
      .client-search-box input {
        width: 100%;
        padding: 10px 12px 10px 36px;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 13px;
      }
      .client-search-box i {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--grey-mid);
      }
      .client-search-box i.fa-times {
        position: absolute;
        right: 12px;
        left: auto;
        cursor: pointer;
        color: var(--grey-mid);
      }
      
      .biz-card-modal {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 1000;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .biz-card-modal.open { display: flex; }
      .biz-card-content {
        background: #fff;
        border-radius: 16px;
        width: 100%;
        max-width: 400px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      }
      .biz-card-header {
        background: var(--orange);
        padding: 16px;
        color: #fff;
        border-radius: 16px 16px 0 0;
      }
      .biz-card-header-row { display: flex; align-items: center; gap: 12px; }
      .biz-card-avatar {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 18px;
        color: var(--orange);
      }
      .biz-card-name { font-size: 18px; font-weight: 700; }
      .biz-card-meta { font-size: 12px; opacity: 0.8; margin-top: 2px; }
      .biz-card-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 28px;
        height: 28px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
      }
      .biz-card-body { padding: 16px; }
      .biz-card-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 16px;
      }
      .biz-card-stat {
        background: var(--bg);
        padding: 12px;
        border-radius: 8px;
        text-align: center;
      }
      .biz-card-stat-num { font-size: 20px; font-weight: 800; color: var(--orange); }
      .biz-card-stat-label { font-size: 10px; color: var(--grey-dark); }
      .biz-card-tabs {
        display: flex;
        gap: 4px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }
      .biz-card-tab {
        padding: 6px 12px;
        border-radius: 20px;
        border: 1px solid var(--border);
        background: #fff;
        font-size: 11px;
        cursor: pointer;
      }
      .biz-card-tab.active {
        background: var(--orange);
        border-color: var(--orange);
        color: #fff;
      }
      .biz-card-section { margin-bottom: 12px; }
      .biz-card-section-title {
        font-size: 11px;
        font-weight: 600;
        color: var(--grey-dark);
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .biz-card-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid var(--grey-light);
        font-size: 13px;
      }
      .biz-card-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }
      .biz-card-actions button {
        flex: 1;
        padding: 10px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      .biz-card-suspend { background: #fff3e0; color: #e65100; border: 1px solid #e65100; }
      .biz-card-ban { background: #ffebee; color: #c62828; border: 1px solid #c62828; }
      
      .user-search-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        cursor: pointer;
        background: #fff;
        border-radius: 6px;
      }
      .user-search-row:hover { background: var(--grey-light); }
      .user-search-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 600;
        font-size: 12px;
      }
      .user-search-info { font-size: 13px; }
    `;
    document.head.appendChild(styles);
  },

  render() {
    const container = document.getElementById('admin-content');
    if (!container) return;

    this.data.refresh();
    const state = window.AdminState;

    const sections = [
      { id: 'client_list', title: 'Client List', icon: '👥', badge: `${this.data.getUsers().length} users · ${this.data.getBusinesses().length} businesses` },
      { id: 'overview', title: 'Overview', icon: '📊', badge: '' },
      { id: 'approvals', title: 'Approvals', icon: '✅', badge: this.data.getGlobalStats().pendingApprovals },
      { id: 'payments', title: 'Payments', icon: '💳', badge: '' },
      { id: 'moderation', title: 'Moderation', icon: '🚩', badge: '' },
      { id: 'feedback', title: 'Feedback', icon: '💬', badge: '' },
      { id: 'facebook', title: 'Facebook Packaging', icon: '📅', badge: '' },
      { id: 'directory', title: 'Directory', icon: '🔍', badge: this.data.getBusinesses().length },
      { id: 'analytics', title: 'Analytics', icon: '📈', badge: '' },
      { id: 'push_broadcast', title: 'Push Broadcast', icon: '🔔', badge: '' },
      { id: 'audit_log', title: 'Audit Log', icon: '📋', badge: '' },
      { id: 'error_log', title: 'Error Log', icon: '⚠️', badge: '' },
      { id: 'admin_mgmt', title: 'Admin Management', icon: '⚙️', badge: '' }
    ];

    container.innerHTML = `
      <div class="super-admin-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h2 class="super-admin-title">Super Admin</h2>
            <p class="super-admin-sub">Platform Management</p>
          </div>
          <button class="btn-sm" style="background:rgba(255,255,255,0.2);color:#fff;border:none;" onclick="navTab('view-account','nav-account')">Logout</button>
        </div>
      </div>
      <div style="background:var(--bg);min-height:calc(100vh - 80px);">
        ${sections.map(s => this.renderSectionOuter(s.id, s.title, s.icon, s.badge, state.activeSection === s.id)).join('')}
      </div>
    `;

    if (state.activeSection && window[this._tabName(state.activeSection)]) {
      this.renderSectionContentDOM(state.activeSection);
    }
  },

  _tabName(id) {
    var map = {
      client_list: 'ClientListTab',
      overview: 'OverviewTab',
      approvals: 'ApprovalsTab',
      payments: 'PaymentTab',
      moderation: 'ModerationTab',
      feedback: 'FeedbackTab',
      facebook: 'FacebookCalendarTab',
      directory: 'DirectoryTab',
      analytics: 'AnalyticsTab',
      audit_log: 'AuditLogTab',
      error_log: 'ErrorLogTab',
      push_broadcast: 'PushBroadcastTab',
      admin_mgmt: 'AdminManagementTab'
    };
    return map[id] || '';
  },

  renderSectionOuter(id, title, icon, badge, isOpen) {
    return `
      <div class="super-accordion ${isOpen ? 'open' : ''}" data-section="${id}">
        <div class="super-accordion-header" onclick="AdminState.toggleSection('${id}')">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:16px;">${icon}</span>
            <span>${title}</span>
            ${badge ? `<span style="background:var(--orange);color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;">${badge}</span>` : ''}
          </div>
          <i class="fas fa-chevron-down super-accordion-icon"></i>
        </div>
        <div class="super-accordion-content"></div>
      </div>
    `;
  },

  renderSectionContentDOM(sectionId) {
    var contentEl = document.querySelector('.super-accordion.open .super-accordion-content');
    if (!contentEl) return;
    if (sectionId === 'client_list') {
      window.ClientListTab.render(contentEl);
    } else {
      contentEl.innerHTML = this.renderSectionContent(sectionId);
    }
  },

  renderSectionContent(id) {
    switch (id) {
      case 'client_list': return this.renderClientList();
      case 'overview': return this.renderOverview();
      case 'approvals': return this.renderApprovals();
      case 'payments': return this.renderPayments();
      case 'moderation': return this.renderModeration();
      case 'feedback': return this.renderFeedback();
      case 'facebook': return this.renderFacebook();
      case 'directory': return this.renderDirectory();
      case 'analytics': return this.renderAnalytics();
      case 'audit_log': return this.renderAuditLog();
      case 'error_log': return this.renderErrorLog();
      case 'push_broadcast': return this.renderPushBroadcast();
      case 'admin_mgmt': return this.renderAdminMgmt();
      default: return '';
    }
  },

  renderClientList() {
    const container = document.createElement('div');
    window.ClientListTab.render(container);
    return container.innerHTML;
  },

  renderOverview() {
    const container = document.createElement('div');
    window.OverviewTab.render(container);
    return container.innerHTML;
  },

  renderApprovals() {
    const container = document.createElement('div');
    window.ApprovalsTab.render(container);
    return container.innerHTML;
  },

  renderModeration() {
    const container = document.createElement('div');
    window.ModerationTab.render(container);
    return container.innerHTML;
  },

  renderPayments() {
    const container = document.createElement('div');
    window.PaymentTab.render(container);
    return container.innerHTML;
  },

  renderFeedback() {
    const container = document.createElement('div');
    window.FeedbackTab.render(container);
    return container.innerHTML;
  },

  renderAuditLog() {
    const container = document.createElement('div');
    window.AuditLogTab.render(container);
    return container.innerHTML;
  },

  renderErrorLog() {
    const container = document.createElement('div');
    window.ErrorLogTab.render(container);
    return container.innerHTML;
  },

  renderPushBroadcast() {
    const container = document.createElement('div');
    window.PushBroadcastTab.render(container);
    return container.innerHTML;
  },

  renderFacebook() {
    const container = document.createElement('div');
    window.FacebookCalendarTab.render(container);
    return container.innerHTML;
  },

  renderDirectory() {
    const container = document.createElement('div');
    window.DirectoryTab.render(container);
    return container.innerHTML;
  },

  renderAnalytics() {
    const container = document.createElement('div');
    window.AnalyticsTab.render(container);
    return container.innerHTML;
  },

  renderAdminMgmt() {
    const container = document.createElement('div');
    window.AdminManagementTab.render(container);
    return container.innerHTML;
  },

  showBusinessCard(bizId) {
    const stats = this.data.getBusinessStats(bizId);
    if (!stats) return;
    
    const biz = stats.biz;
    const modal = document.getElementById('biz-card-modal') || this.createBizCardModal();
    document.body.appendChild(modal);
    
    modal.innerHTML = `
      <div class="biz-card-content">
        <div class="biz-card-header">
          <div class="biz-card-header-row">
            <div class="biz-card-avatar">${biz.initials || 'B'}</div>
            <div>
              <div class="biz-card-name">${biz.name || 'Unknown'}</div>
              <div class="biz-card-meta">${biz.location || ''} · ${biz.phone || ''}</div>
            </div>
          </div>
          <div class="biz-card-close" onclick="this.closest('.biz-card-modal').classList.remove('open')">✕</div>
        </div>
        <div class="biz-card-body">
          <div style="margin-bottom:8px;">
            <span style="background:var(--orange-light);color:var(--orange);padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;">${biz.subscription || 'basic'}</span>
          </div>
          
          <div class="biz-card-stats">
            <div class="biz-card-stat">
              <div class="biz-card-stat-num">P${stats.totalSpend || 0}</div>
              <div class="biz-card-stat-label">Total Spent</div>
            </div>
            <div class="biz-card-stat">
              <div class="biz-card-stat-num">${stats.activeCount || 0}</div>
              <div class="biz-card-stat-label">Active</div>
            </div>
            <div class="biz-card-stat">
              <div class="biz-card-stat-num">${stats.totalPromos || 0}</div>
              <div class="biz-card-stat-label">Promos</div>
            </div>
          </div>
          
          <div class="biz-card-section">
            <div class="biz-card-section-title">PROMOS (${stats.promos?.length || 0})</div>
            ${(stats.promos || []).slice(0, 5).map(p => `
              <div class="biz-card-item">
                <span>${p.title || 'Untitled'}</span>
                <span style="color:${p.promo?.status === 'active' ? '#2e7d32' : 'var(--grey-dark)'}">${p.promo?.status || 'active'}</span>
              </div>
            `).join('')}
            ${(stats.promos || []).length > 5 ? `<div style="font-size:11px;color:var(--grey-dark);text-align:center;padding:8px;">+${stats.promos.length - 5} more</div>` : ''}
          </div>
          
          <div class="biz-card-section">
            <div class="biz-card-section-title">STAFF (${stats.staff?.length || 0})</div>
            ${(stats.staff || []).map(s => `
              <div class="biz-card-item">
                <span>${s.name || 'Unknown'}</span>
                <span style="font-size:11px;color:var(--grey-dark)">${s.role || 'Staff'}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="biz-card-actions">
            ${biz.status === 'banned' ? `
              <button class="btn-sm" onclick="Admin.data.reactivateUser('${biz.ownerId || ''}')" style="background:#e8f5e9;color:#2e7d32;">Reactivate Business</button>
            ` : `
              <button class="biz-card-suspend" onclick="Admin.suspendBusinessCard('${stats.staff && stats.staff[0] ? stats.staff[0].id : ''}')">Suspend Related</button>
              <button class="biz-card-ban" onclick="Admin.banBusiness('${biz.id}')">Ban Business</button>
            `}
          </div>
        </div>
      </div>
    `;
    
    modal.classList.add('open');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('open'); };
  },
  
  createBizCardModal() {
    const div = document.createElement('div');
    div.id = 'biz-card-modal';
    div.className = 'biz-card-modal';
    return div;
  },

  showUserDetail(userId) {
    const user = this.data.userMap[userId];
    if (!user) return;
    
    const assoc = this.data.associations[userId];
    const biz = assoc ? this.data.businessMap[assoc.businessId] : null;
    
    const safeName = user.name ? encodeURIComponent(user.name.replace(/\s+/g, ' ')) : '';
    const imgSrc = window.assetUrl(user.image || (safeName ? 'assets/images/profile_pictures_dummy/' + safeName + '.jpg' : 'assets/images/profile_pictures_dummy/demo-profile.jpg'));
    
    const modal = document.getElementById('user-detail-modal') || this.createUserDetailModal();
    document.body.appendChild(modal);
    
    var status = user.status || 'active';
    var statusBadge = status === 'active' ? '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;">Active</span>'
      : status === 'suspended' ? '<span style="background:#fff3e0;color:#e65100;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;">Suspended</span>'
      : status === 'banned' ? '<span style="background:#ffebee;color:#c62828;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;">Banned</span>'
      : '';

    var displayName = (user.firstName || '') + ' ' + (user.surname || '');
    if (!displayName.trim()) displayName = user.name || 'Unknown';
    var usernameLine = user.username ? '<div class="biz-card-item"><span>Username</span><span>@' + user.username + '</span></div>' : '';
    var userEmail = user.email || user.cloudEmail || '';
    
    var regDate = '';
    if (user.createdAt) {
      var s = user.createdAt.seconds || user.createdAt._seconds;
      if (s) { var d = new Date(s * 1000); regDate = d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    }
    
    // ── Personal info ──
    var personalHtml = '';
    if (user.dateOfBirth || user.gender || user.nationality || user.race) {
      personalHtml = '<div class="biz-card-section"><div class="biz-card-section-title">PERSONAL INFO</div>' +
        (user.dateOfBirth ? '<div class="biz-card-item"><span>Date of Birth</span><span>' + user.dateOfBirth + '</span></div>' : '') +
        (user.gender ? '<div class="biz-card-item"><span>Gender</span><span>' + user.gender + '</span></div>' : '') +
        (user.nationality ? '<div class="biz-card-item"><span>Nationality</span><span>' + user.nationality + '</span></div>' : '') +
        (user.race ? '<div class="biz-card-item"><span>Race</span><span>' + user.race + '</span></div>' : '') +
      '</div>';
    }
    
    // ── Contacts ──
    var contacts = user.contacts || { mobiles: [], whatsapps: [], social: {} };
    var contactHtml = '<div class="biz-card-section"><div class="biz-card-section-title">CONTACT</div>' +
      (user.primaryMobile ? '<div class="biz-card-item"><span>Primary Mobile</span><span>' + user.primaryMobile + '</span></div>' : (user.phone ? '<div class="biz-card-item"><span>Primary Mobile</span><span>' + user.phone + '</span></div>' : '')) +
      (user.primaryWhatsApp ? '<div class="biz-card-item"><span>Primary WhatsApp</span><span>' + user.primaryWhatsApp + '</span></div>' : '');
    
    if (contacts.mobiles && contacts.mobiles.length > 0) {
      contacts.mobiles.forEach(function(m, i) {
        if (m.number && !(i === 0 && user.primaryMobile && m.number === user.primaryMobile)) {
          var label = m.isPrimary ? 'Mobile (Primary)' : 'Mobile ' + (i + 1);
          contactHtml += '<div class="biz-card-item"><span>' + label + '</span><span>' + (m.countryCode || '') + m.number + '</span></div>';
        }
      });
    }
    if (contacts.whatsapps && contacts.whatsapps.length > 0) {
      contacts.whatsapps.forEach(function(w, i) {
        if (w.number && !(i === 0 && user.primaryWhatsApp && w.number === user.primaryWhatsApp)) {
          var label = w.isPrimary ? 'WhatsApp (Primary)' : 'WhatsApp ' + (i + 1);
          contactHtml += '<div class="biz-card-item"><span>' + label + '</span><span>' + (w.countryCode || '') + w.number + '</span></div>';
        }
      });
    }
    contactHtml += (userEmail ? '<div class="biz-card-item"><span>Email</span><span>' + userEmail + '</span></div>' : '') +
      '<div class="biz-card-item"><span>Registered</span><span>' + (regDate || 'N/A') + '</span></div>' +
    '</div>';
    
    // ── Location ──
    var loc = user.location || {};
    var townVal = loc.town || user.town || '';
    var areaVal = loc.area || '';
    var locationHtml = '';
    if (townVal || areaVal) {
      locationHtml = '<div class="biz-card-section"><div class="biz-card-section-title">LOCATION</div>' +
        (townVal ? '<div class="biz-card-item"><span>Village/Town/City</span><span>' + townVal + '</span></div>' : '') +
        (areaVal ? '<div class="biz-card-item"><span>Area/Neighbourhood</span><span>' + areaVal + '</span></div>' : '') +
      '</div>';
    }
    
    // ── Social Media ──
    var social = contacts.social || {};
    var socialKeys = Object.keys(social);
    var socialHtml = '';
    if (socialKeys.length > 0) {
      socialHtml = '<div class="biz-card-section"><div class="biz-card-section-title">SOCIAL MEDIA</div>';
      socialKeys.forEach(function(platform) {
        var val = social[platform];
        if (val) socialHtml += '<div class="biz-card-item"><span style="text-transform:capitalize;">' + platform + '</span><span>' + val + '</span></div>';
      });
      socialHtml += '</div>';
    }
    
    // ── Interests/Categories ──
    var interests = user.interests || [];
    var interestsHtml = '';
    if (interests.length > 0) {
      interestsHtml = '<div class="biz-card-section"><div class="biz-card-section-title">INTERESTS / CATEGORIES</div>' +
        '<div style="padding:4px 0;display:flex;flex-wrap:wrap;gap:6px;">' +
        interests.map(function(c) {
          var name = c.name || c;
          return '<span style="background:var(--orange-light);color:var(--orange);padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;">' + name + '</span>';
        }).join('') +
        '</div></div>';
    }
    
    // ── Pro Account info ──
    var proHtml = '';
    var isPro = user.role === 'Tradesperson (Contractor)' || user.role === 'Business & Materials Supplier' || user.role === 'Pro' || user.role === 'Professional';
    if (isPro) {
      proHtml = '<div class="biz-card-section"><div class="biz-card-section-title">PRO ACCOUNT</div>' +
        '<div class="biz-card-item"><span>Trade Role</span><span>' + (user.role || 'N/A') + '</span></div>' +
        (user.tradeCategory ? '<div class="biz-card-item"><span>Trade Category</span><span>' + user.tradeCategory + '</span></div>' : '') +
        (user.specialty ? '<div class="biz-card-item"><span>Specialty</span><span>' + user.specialty + '</span></div>' : '');
      if (user.businessInfo && user.businessInfo.name) {
        proHtml += '<div class="biz-card-item"><span>Business Name</span><span>' + user.businessInfo.name + '</span></div>';
      }
      if (user.skills && user.skills.length > 0) {
        proHtml += '<div class="biz-card-item"><span>Skills</span><span>' + user.skills.join(', ') + '</span></div>';
      }
      proHtml += '</div>';
    }
    
    // ── Businesses ──
    var bizHtml = '';
    if (biz) {
      bizHtml = '<div class="biz-card-section"><div class="biz-card-section-title">BUSINESS</div>' +
        '<div class="biz-card-item"><span>' + biz.name + '</span><span style="text-transform:capitalize;">' + (assoc?.role || 'Owner') + '</span></div>' +
      '</div>';
    }

    modal.innerHTML =
      '<div class="biz-card-content">' +
        '<div class="biz-card-header">' +
          '<div class="biz-card-header-row">' +
            '<img src="' + imgSrc + '" style="width:48px;height:48px;border-radius:12px;object-fit:cover;"' +
              ' onerror="this.outerHTML=\'<div class=\\\'biz-card-avatar\\\'>' + (user.initials || 'U') + '</div>\'">' +
            '<div>' +
              '<div class="biz-card-name">' + displayName + '</div>' +
              '<div class="biz-card-meta">' + userEmail + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="biz-card-close" onclick="this.closest(\'.biz-card-modal\').classList.remove(\'open\')">\u2715</div>' +
        '</div>' +
        '<div class="biz-card-body">' +
          '<div style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
            '<span style="background:var(--orange-light);color:var(--orange);padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;">' + (user.role || 'General User') + '</span>' +
            statusBadge +
          '</div>' +
          usernameLine +
          personalHtml +
          contactHtml +
          locationHtml +
          socialHtml +
          interestsHtml +
          proHtml +
          bizHtml +
          '<div class="biz-card-actions">' +
            (status === 'active'
              ? '<button class="biz-card-suspend" onclick="Admin.suspendUser(\'' + userId + '\')">Suspend</button>' +
                '<button class="biz-card-ban" onclick="Admin.banUser(\'' + userId + '\')">Ban</button>'
              : status === 'suspended'
              ? '<button class="biz-card-suspend" onclick="Admin.banUser(\'' + userId + '\')" style="background:#ffebee;color:#c62828;border-color:#c62828;">Ban</button>' +
                '<button class="btn-sm" onclick="Admin.reactivateUser(\'' + userId + '\')" style="background:#e8f5e9;color:#2e7d32;">Reactivate</button>'
              : status === 'banned'
              ? '<button class="btn-sm" onclick="Admin.reactivateUser(\'' + userId + '\')" style="background:#e8f5e9;color:#2e7d32;">Reactivate</button>'
              : '') +
          '</div>' +
        '</div>' +
      '</div>';
    
    modal.classList.add('open');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('open'); };
  },

  createUserDetailModal() {
    const div = document.createElement('div');
    div.id = 'user-detail-modal';
    div.className = 'biz-card-modal';
    return div;
  },

  showProDetail(proId) {
    const pro = this.data.userMap[proId];
    if (!pro) return;
    
    const safeName = pro.name ? encodeURIComponent(pro.name.replace(/\s+/g, ' ')) : '';
    const imgSrc = window.assetUrl(pro.image || (safeName ? `assets/images/profile_pictures_dummy/${safeName}.jpg` : `assets/images/profile_pictures_dummy/demo-profile.jpg`));
    
    const modal = document.getElementById('pro-detail-modal') || this.createProDetailModal();
    document.body.appendChild(modal);
    
    modal.innerHTML = `
      <div class="biz-card-content">
        <div class="biz-card-header">
          <div class="biz-card-header-row">
            <img src="${imgSrc}" style="width:48px;height:48px;border-radius:12px;object-fit:cover;"
              onerror="this.outerHTML='<div class=\\'biz-card-avatar\\'>${pro.initials || 'P'}</div>'">
            <div>
              <div class="biz-card-name">${pro.name || 'Unknown'}</div>
              <div class="biz-card-meta">${pro.specialty || pro.role || 'Pro'}</div>
            </div>
          </div>
          <div class="biz-card-close" onclick="this.closest('.biz-card-modal').classList.remove('open')">✕</div>
        </div>
        <div class="biz-card-body">
          <div class="biz-card-section">
            <div class="biz-card-section-title">CONTACT</div>
            <div class="biz-card-item"><span>Phone</span><span>${pro.phone || 'N/A'}</span></div>
            <div class="biz-card-item"><span>Email</span><span>${pro.email || 'N/A'}</span></div>
            <div class="biz-card-item"><span>Location</span><span>${pro.town || pro.location || 'N/A'}</span></div>
          </div>
        </div>
      </div>
    `;
    
    modal.classList.add('open');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('open'); };
  },

  createProDetailModal() {
    const div = document.createElement('div');
    div.id = 'pro-detail-modal';
    div.className = 'biz-card-modal';
    return div;
  },

  async approveRequest(type, id) {
    if (type === 'promo') this.data.approvePromoRequest(id);
    else if (type === 'payment') this.data.approvePaymentRequest(id);
    else if (type === 'artwork') this.data.approveArtwork(id);
    else if (type === 'onboarding') {
      if (window.approveOnboarding) {
        showToast('Activating business in cloud...');
        await window.approveOnboarding(id);
        await this.data.fetchFirestoreData();
      }
    }
    if (window.auditLog) window.auditLog('approve_' + type, { itemId: id }).catch(function(){});
    this.render();
  },

  viewPaymentProof(paymentId) {
    const payment = this.data.paymentRequests.find(p => p.id === paymentId);
    if (!payment || !payment.image) {
      showToast('No proof image available');
      return;
    }
    
    const modal = document.getElementById('payment-proof-modal') || this.createPaymentProofModal();
    document.body.appendChild(modal);
    
    modal.innerHTML = `
      <div class="biz-card-content" style="max-width:350px;">
        <div class="biz-card-header">
          <div class="biz-card-name">Payment Proof</div>
          <div class="biz-card-close" onclick="this.closest('.biz-card-modal').classList.remove('open')">✕</div>
        </div>
        <div class="biz-card-body" style="text-align:center;">
          <img src="${payment.image}" style="max-width:100%;border-radius:8px;margin-bottom:12px;"
            onerror="this.outerHTML='<div style=\\'padding:40px;color:var(--grey-dark);\\'>Image not available</div>'">
          <div style="font-size:13px;">
            <div><strong>${payment.method}</strong> · P${payment.amount}</div>
            <div style="color:var(--grey-dark);margin-top:4px;">${payment.purpose || ''}</div>
          </div>
        </div>
      </div>
    `;
    
    modal.classList.add('open');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('open'); };
  },

  createPaymentProofModal() {
    const div = document.createElement('div');
    div.id = 'payment-proof-modal';
    div.className = 'biz-card-modal';
    return div;
  },

  rejectRequest(type, id) {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    if (type === 'promo') this.data.rejectPromoRequest(id, reason);
    else if (type === 'payment') this.data.rejectPaymentRequest(id, reason);
    else if (type === 'artwork') this.data.rejectArtwork(id, reason);
    else if (type === 'onboarding') {
       // Onboarding rejection logic: For now we just update status to rejected
    }
    if (window.auditLog) window.auditLog('reject_' + type, { itemId: id, reason: reason }).catch(function(){});
    this.render();
  },

  async suspendUser(userId) {
    var reason = prompt('Reason for suspension:');
    if (reason === null) return;
    await this.data.suspendUser(userId, reason || 'No reason given');
    if (window.auditLog) window.auditLog('suspend', { userId: userId, reason: reason }).catch(function(){});
    this.render();
  },

  async banUser(userId) {
    if (!confirm('Ban this user permanently? This action can be reversed.')) return;
    var reason = prompt('Reason for ban:');
    if (reason === null) return;
    await this.data.banUser(userId, reason || 'No reason given');
    if (window.auditLog) window.auditLog('ban', { userId: userId, reason: reason }).catch(function(){});
    this.render();
  },

  async reactivateUser(userId) {
    if (!confirm('Reactivate this user?')) return;
    await this.data.reactivateUser(userId);
    if (window.auditLog) window.auditLog('reactivate', { userId: userId }).catch(function(){});
    this.render();
  },

  approveArtworkItem(submissionId, itemId) {
    if (this.data.approveArtworkItem(submissionId, itemId)) {
      showToast('Item approved');
      this.render();
    } else {
      showToast('Could not approve item');
    }
  },

  rejectArtworkItem(submissionId, itemId) {
    const reason = prompt('Rejection reason (optional):');
    if (this.data.rejectArtworkItem(submissionId, itemId, reason || '')) {
      showToast('Item rejected');
      this.render();
    } else {
      showToast('Could not reject item');
    }
  },

  showAddAdminModal() {
    const modal = document.getElementById('add-admin-modal');
    if (modal) modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
  },

  addAdmin(userId) {
    this.data.addAdmin(userId);
    this.render();
    showToast('Admin added successfully');
  },

  removeAdmin(userId) {
    if (!confirm('Remove this admin?')) return;
    const removed = this.data.removeAdmin(userId);
    if (removed) {
      this.render();
      showToast('Admin removed');
    } else {
      alert('Cannot remove Super Admin');
    }
  },

  assignArtwork(submissionId, itemId, businessName, title, selectIdx) {
    const selectEl = document.getElementById(`assign-select-${selectIdx}`);
    const slot = selectEl ? selectEl.value : '';
    if (!slot) {
      showToast('Please select a day');
      return;
    }

    const state = window.AdminState;
    const year = parseInt(state.fbCalendarMonth.split('-')[0]);
    const month = parseInt(state.fbCalendarMonth.split('-')[1]) - 1;

    const slotDays = { 'Monday': 1, 'Wednesday': 3, 'Friday': 5 };
    const dayOfWeek = slotDays[slot];

    const now = new Date(year, month, 1);
    let foundDate = null;
    for (let d = new Date(now); d.getMonth() === month; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === dayOfWeek) {
        foundDate = d.toISOString().split('T')[0];
        break;
      }
    }

    if (!foundDate) {
      showToast('No available date this month');
      return;
    }

    const schedule = JSON.parse(localStorage.getItem('foromane_facebook_schedule') || '[]');
    schedule.push({
      date: foundDate,
      slot: slot,
      submissionId: submissionId,
      itemId: itemId,
      businessName: businessName,
      title: title || businessName,
      createdAt: Date.now()
    });

    localStorage.setItem('foromane_facebook_schedule', JSON.stringify(schedule));
    showToast(`Assigned to ${slot} ${foundDate}`);
    this.render();
  },

  async registerAdmin(userId) {
    if (!userId) { showToast('No user ID'); return; }
    if (typeof window.registerAdmin === 'function') {
      try {
        await window.registerAdmin(userId);
        showToast('Registered as admin! Refreshing...');
        this.render();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    } else {
      showToast('Admin registration unavailable');
    }
  },

  refresh() {
    this.render();
  }
};

window.Admin = Admin;