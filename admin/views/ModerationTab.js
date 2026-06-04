/* ═══════════════════════════════════════════════════════
   MODERATION TAB - Flagged content queue for admin review
   ═══════════════════════════════════════════════════════ */

const ModerationTab = {
  render(container) {
    var state = window.AdminState;
    container.innerHTML = `
      <div style="margin-bottom:12px;">
        <span style="font-size:14px;font-weight:600;">FLAGGED CONTENT</span>
        <span id="flag-count-badge" style="background:var(--orange);color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;margin-left:8px;">loading...</span>
      </div>
      <div id="flag-filters" style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;">
        <button class="pill ${state.moderationFilter === 'all' ? 'active' : ''}"
          onclick="AdminState.setModerationFilter('all');ModerationTab.load()">All</button>
        <button class="pill ${state.moderationFilter === 'pending' ? 'active' : ''}"
          onclick="AdminState.setModerationFilter('pending');ModerationTab.load()">Pending</button>
        <button class="pill ${state.moderationFilter === 'dismissed' ? 'active' : ''}"
          onclick="AdminState.setModerationFilter('dismissed');ModerationTab.load()">Dismissed</button>
        <button class="pill ${state.moderationFilter === 'action_taken' ? 'active' : ''}"
          onclick="AdminState.setModerationFilter('action_taken');ModerationTab.load()">Actioned</button>
      </div>
      <div id="flag-list"></div>
    `;
    this.load();
  },

  async load() {
    var listEl = document.getElementById('flag-list');
    var badgeEl = document.getElementById('flag-count-badge');
    if (!listEl) return;
    if (typeof window.getFlaggedContent !== 'function') {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:var(--grey-dark);">Moderation backend not available</div>';
      return;
    }
    try {
      var state = window.AdminState;
      var flags = await window.getFlaggedContent(state.moderationFilter !== 'all' ? state.moderationFilter : null);
      if (badgeEl) {
        var totalEl = document.getElementById('flag-pending-count');
        var pending = flags.filter(function(f) { return f.status === 'pending'; }).length;
        badgeEl.textContent = flags.length + (pending > 0 ? ' (' + pending + ' new)' : '');
      }
      listEl.innerHTML = flags.length === 0
        ? '<div style="text-align:center;padding:30px;color:var(--grey-dark);">No flagged content</div>'
        : flags.map(function(f) { return ModerationTab.renderFlagCard(f); }).join('');
    } catch (e) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#c62828;">Error loading flags: ' + e.message + '</div>';
    }
  },

  renderFlagCard(f) {
    var typeIcon = f.type === 'promo' ? '\ud83d\udce2' : f.type === 'business' ? '\ud83c\udfea' : f.type === 'profile' ? '\ud83d\udc64' : '\ud83d\udc4d';
    var timeStr = f.createdAt && f.createdAt.toDate ? f.createdAt.toDate().toLocaleString() : (f.createdAt || '');
    var statusBadge = f.status === 'pending'
      ? '<span style="background:#fff3e0;color:#e65100;padding:1px 6px;border-radius:8px;font-size:10px;">Pending</span>'
      : f.status === 'dismissed'
        ? '<span style="background:#f5f5f5;color:#666;padding:1px 6px;border-radius:8px;font-size:10px;">Dismissed</span>'
        : '<span style="background:#e8f5e9;color:#2e7d32;padding:1px 6px;border-radius:8px;font-size:10px;">Actioned</span>';
    var actionBtns = f.status === 'pending' ? `
      <div style="display:flex;gap:6px;margin-top:8px;">
        <button class="btn-sm" style="background:#e8f5e9;color:#2e7d32;border:1px solid #2e7d32;" onclick="ModerationTab.dismissFlag('${f.id}')">Dismiss</button>
        <button class="btn-sm" style="background:#ffebee;color:#c62828;border:1px solid #c62828;" onclick="ModerationTab.takeAction('${f.id}')">Take Action</button>
      </div>
    ` : (f.reviewNote ? '<div style="font-size:11px;color:var(--grey-dark);margin-top:6px;">Note: ' + f.reviewNote + '</div>' : '');
    return '<div class="approval-card" style="' + (f.status !== 'pending' ? 'opacity:0.7;' : '') + '">' +
      '<div class="approval-header">' +
      '<div class="approval-icon" style="background:#f5f5f5;">' + typeIcon + '</div>' +
      '<div class="approval-info">' +
      '<div class="approval-title">Flagged ' + f.type + '</div>' +
      '<div class="approval-meta"><strong>Reason:</strong> ' + f.reason + '</div>' +
      '<div class="approval-meta"><strong>Target:</strong> ' + f.targetId + '</div>' +
      (f.details ? '<div class="approval-meta" style="font-size:11px;color:var(--grey-dark);">' + f.details + '</div>' : '') +
      '<div class="approval-date">' + timeStr + ' \u00b7 ' + statusBadge + '</div>' +
      '</div>' +
      '</div>' +
      actionBtns +
      '</div>';
  },

  async dismissFlag(flagId) {
    var note = prompt('Dismissal note (optional):');
    if (note === null) return;
    if (typeof window.dismissFlag === 'function') {
      try {
        await window.dismissFlag(flagId, note || '');
        showToast('Flag dismissed');
        this.load();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }
  },

  async takeAction(flagId) {
    if (!confirm('Mark this flag as action taken?')) return;
    var note = prompt('Action note (optional):');
    if (note === null) return;
    if (typeof window.takeActionOnFlag === 'function') {
      try {
        await window.takeActionOnFlag(flagId, note || '');
        showToast('Action recorded');
        this.load();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }
  }
};

window.ModerationTab = ModerationTab;
