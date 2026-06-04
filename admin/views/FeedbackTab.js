/* ═══════════════════════════════════════════════════════
   FEEDBACK TAB - User bug reports & feedback
   ═══════════════════════════════════════════════════════ */

const FeedbackTab = {
  render(container) {
    container.innerHTML = `
      <div style="margin-bottom:12px;">
        <span style="font-size:14px;font-weight:600;">USER FEEDBACK</span>
        <span id="fb-count-badge" style="background:var(--orange);color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;margin-left:8px;">loading...</span>
      </div>
      <div id="fb-filters" style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">
        <button class="pill active" data-status="all" onclick="FeedbackTab.setFilter('all')">All</button>
        <button class="pill" data-status="pending" onclick="FeedbackTab.setFilter('pending')">Pending</button>
        <button class="pill" data-status="acknowledged" onclick="FeedbackTab.setFilter('acknowledged')">Acknowledged</button>
        <button class="pill" data-status="resolved" onclick="FeedbackTab.setFilter('resolved')">Resolved</button>
        <button class="pill" data-status="dismissed" onclick="FeedbackTab.setFilter('dismissed')">Dismissed</button>
      </div>
      <div id="fb-type-filters" style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">
        <button class="pill active" data-type="all" onclick="FeedbackTab.setTypeFilter('all')">All Types</button>
        <button class="pill" data-type="bug" onclick="FeedbackTab.setTypeFilter('bug')">🐛 Bug</button>
        <button class="pill" data-type="feature" onclick="FeedbackTab.setTypeFilter('feature')">💡 Feature</button>
        <button class="pill" data-type="feedback" onclick="FeedbackTab.setTypeFilter('feedback')">💬 Feedback</button>
        <button class="pill" data-type="other" onclick="FeedbackTab.setTypeFilter('other')">Other</button>
      </div>
      <div id="feedback-list"><div style="text-align:center;padding:30px;color:var(--grey-dark);">Loading...</div></div>
    `;
    this._statusFilter = 'all';
    this._typeFilter = 'all';
    this.load();
  },

  setFilter(status) {
    this._statusFilter = status;
    document.querySelectorAll('#fb-filters .pill').forEach(function(b) {
      b.classList.toggle('active', b.dataset.status === status);
    });
    this.load();
  },

  setTypeFilter(type) {
    this._typeFilter = type;
    document.querySelectorAll('#fb-type-filters .pill').forEach(function(b) {
      b.classList.toggle('active', b.dataset.type === type);
    });
    this.load();
  },

  async load() {
    var listEl = document.getElementById('feedback-list');
    var badgeEl = document.getElementById('fb-count-badge');
    if (!listEl) return;
    try {
      var status = this._statusFilter !== 'all' ? this._statusFilter : null;
      var allItems = typeof window.getFeedback === 'function'
        ? await window.getFeedback({ status: status, limit: 200 })
        : JSON.parse(localStorage.getItem('foromane_feedback') || '[]').reverse();
      if (this._typeFilter !== 'all') {
        allItems = allItems.filter(function(f) { return f.category === this._typeFilter; }.bind(this));
      }
      if (badgeEl) badgeEl.textContent = allItems.length;
      listEl.innerHTML = allItems.length === 0
        ? '<div style="text-align:center;padding:30px;color:var(--grey-dark);">No feedback</div>'
        : allItems.map(function(f) { return FeedbackTab.renderCard(f); }).join('');
    } catch (e) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#c62828;">Error: ' + e.message + '</div>';
    }
  },

  renderCard(f) {
    var catIcon = f.category === 'bug' ? '🐛' : f.category === 'feature' ? '💡' : f.category === 'feedback' ? '💬' : '📝';
    var statusBadge = f.status === 'pending'
      ? '<span style="background:#fff3e0;color:#e65100;padding:1px 6px;border-radius:8px;font-size:10px;">Pending</span>'
      : f.status === 'acknowledged'
        ? '<span style="background:#e3f2fd;color:#1565c0;padding:1px 6px;border-radius:8px;font-size:10px;">Acknowledged</span>'
        : f.status === 'resolved'
          ? '<span style="background:#e8f5e9;color:#2e7d32;padding:1px 6px;border-radius:8px;font-size:10px;">Resolved</span>'
          : '<span style="background:#f5f5f5;color:#666;padding:1px 6px;border-radius:8px;font-size:10px;">Dismissed</span>';
    var timeStr = f.createdAt && f.createdAt.toDate ? f.createdAt.toDate().toLocaleString() : (f.timestamp ? new Date(f.timestamp).toLocaleString() : '');
    var actionBtns = f.status === 'pending' ? `
      <div style="display:flex;gap:6px;margin-top:8px;">
        <button class="btn-sm" style="background:#e3f2fd;color:#1565c0;border:1px solid #1565c0;" onclick="FeedbackTab.acknowledge('${f.id}')">Acknowledge</button>
        <button class="btn-sm" style="background:#e8f5e9;color:#2e7d32;border:1px solid #2e7d32;" onclick="FeedbackTab.resolve('${f.id}')">Resolve</button>
        <button class="btn-sm" style="background:#f5f5f5;color:#666;border:1px solid #ccc;" onclick="FeedbackTab.dismiss('${f.id}')">Dismiss</button>
      </div>
    ` : '';
    return '<div class="approval-card" style="' + (f.status !== 'pending' ? 'opacity:0.7;' : '') + '">' +
      '<div class="approval-header">' +
      '<div class="approval-icon" style="background:#f5f5f5;font-size:16px;">' + catIcon + '</div>' +
      '<div class="approval-info">' +
      '<div class="approval-title">' + (f.userName || 'Anonymous') + ' · ' + (f.userId || '') + '</div>' +
      '<div class="approval-meta">' + f.message + '</div>' +
      (f.contactInfo ? '<div class="approval-meta" style="font-size:11px;color:var(--grey-dark);">Contact: ' + f.contactInfo + '</div>' : '') +
      '<div class="approval-date">' + timeStr + ' · ' + statusBadge + '</div>' +
      '</div>' +
      '</div>' +
      actionBtns +
      '</div>';
  },

  async acknowledge(id) {
    if (typeof window.reviewFeedback === 'function') {
      try { await window.reviewFeedback(id, 'acknowledged', ''); showToast('Acknowledged'); this.load(); }
      catch (e) { showToast('Error: ' + e.message); }
    }
  },

  async resolve(id) {
    var note = prompt('Resolution note (optional):');
    if (note === null) return;
    if (typeof window.reviewFeedback === 'function') {
      try { await window.reviewFeedback(id, 'resolved', note || ''); showToast('Resolved'); this.load(); }
      catch (e) { showToast('Error: ' + e.message); }
    }
  },

  async dismiss(id) {
    var note = prompt('Dismissal note (optional):');
    if (note === null) return;
    if (typeof window.reviewFeedback === 'function') {
      try { await window.reviewFeedback(id, 'dismissed', note || ''); showToast('Dismissed'); this.load(); }
      catch (e) { showToast('Error: ' + e.message); }
    }
  }
};

window.FeedbackTab = FeedbackTab;
