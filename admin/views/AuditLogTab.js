/* ═══════════════════════════════════════════════════════
   AUDIT LOG TAB - Admin action trail
   ═══════════════════════════════════════════════════════ */

const AuditLogTab = {
  render(container) {
    container.innerHTML = `
      <div style="margin-bottom:12px;">
        <span style="font-size:14px;font-weight:600;">AUDIT LOG</span>
        <span style="background:var(--orange);color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;margin-left:8px;">live</span>
      </div>
      <div id="audit-filter-bar" style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">
        <button class="pill active" data-action="all" onclick="AuditLogTab.setFilter('all')">All</button>
        <button class="pill" data-action="approve" onclick="AuditLogTab.setFilter('approve')">Approvals</button>
        <button class="pill" data-action="reject" onclick="AuditLogTab.setFilter('reject')">Rejections</button>
        <button class="pill" data-action="suspend" onclick="AuditLogTab.setFilter('suspend')">Suspensions</button>
        <button class="pill" data-action="ban" onclick="AuditLogTab.setFilter('ban')">Bans</button>
        <button class="pill" data-action="reactivate" onclick="AuditLogTab.setFilter('reactivate')">Reactivations</button>
        <button class="pill" data-action="flag" onclick="AuditLogTab.setFilter('flag')">Flags</button>
      </div>
      <div id="audit-log-list"><div style="text-align:center;padding:30px;color:var(--grey-dark);">Loading...</div></div>
    `;
    this._currentFilter = 'all';
    this.load();
  },

  setFilter(action) {
    this._currentFilter = action;
    document.querySelectorAll('#audit-filter-bar .pill').forEach(function(b) {
      b.classList.toggle('active', b.dataset.action === action);
    });
    this.load();
  },

  async load() {
    var listEl = document.getElementById('audit-log-list');
    if (!listEl) return;
    try {
      var logs = typeof window.getAuditLogs === 'function'
        ? await window.getAuditLogs({ limit: 100 })
        : JSON.parse(localStorage.getItem('foromane_audit_log') || '[]').reverse();
      if (this._currentFilter && this._currentFilter !== 'all') {
        logs = logs.filter(function(l) { return l.action && l.action.indexOf(this._currentFilter) !== -1; }.bind(this));
      }
      listEl.innerHTML = logs.length === 0
        ? '<div style="text-align:center;padding:30px;color:var(--grey-dark);">No audit log entries</div>'
        : logs.map(function(l) { return AuditLogTab.renderEntry(l); }).join('');
    } catch (e) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#c62828;">Error: ' + e.message + '</div>';
    }
  },

  renderEntry(l) {
    var actionIcon = '📋';
    if (l.action && l.action.indexOf('approve') !== -1) actionIcon = '✅';
    else if (l.action && l.action.indexOf('reject') !== -1) actionIcon = '❌';
    else if (l.action && l.action.indexOf('suspend') !== -1) actionIcon = '⛔';
    else if (l.action && l.action.indexOf('ban') !== -1) actionIcon = '🚫';
    else if (l.action && l.action.indexOf('reactivate') !== -1) actionIcon = '🔄';
    else if (l.action && l.action.indexOf('flag') !== -1) actionIcon = '🚩';
    var timeStr = l.createdAt && l.createdAt.toDate ? l.createdAt.toDate().toLocaleString() : (l.timestamp ? new Date(l.timestamp).toLocaleString() : '');
    var detailStr = '';
    if (l.details) {
      if (typeof l.details === 'object') detailStr = JSON.stringify(l.details).slice(0, 200);
      else detailStr = String(l.details).slice(0, 200);
    }
    return '<div class="approval-card">' +
      '<div class="approval-header">' +
      '<div class="approval-icon" style="background:#f5f5f5;font-size:16px;">' + actionIcon + '</div>' +
      '<div class="approval-info">' +
      '<div class="approval-title">' + (l.action || 'Unknown') + '</div>' +
      '<div class="approval-meta">User: ' + (l.userId || 'system') + ' · Role: ' + (l.userRole || 'N/A') + '</div>' +
      (detailStr ? '<div class="approval-meta" style="font-size:11px;color:var(--grey-dark);">' + detailStr + '</div>' : '') +
      '<div class="approval-date">' + timeStr + '</div>' +
      '</div>' +
      '</div>' +
      '</div>';
  }
};

window.AuditLogTab = AuditLogTab;
