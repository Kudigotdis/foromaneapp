/* ═══════════════════════════════════════════════════════
   ERROR LOG TAB - Client-side error monitoring
   ═══════════════════════════════════════════════════════ */

const ErrorLogTab = {
  render(container) {
    container.innerHTML = `
      <div style="margin-bottom:12px;">
        <span style="font-size:14px;font-weight:600;">ERROR LOG</span>
        <span id="error-count-badge" style="background:#c62828;color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;margin-left:8px;">0</span>
        <button class="btn-sm" style="margin-left:8px;background:#f5f5f5;border:1px solid #ddd;" onclick="ErrorLogTab.clear()">Clear</button>
      </div>
      <div id="error-log-list"><div style="text-align:center;padding:30px;color:var(--grey-dark);">Loading...</div></div>
    `;
    this.load();
  },

  async load() {
    var listEl = document.getElementById('error-log-list');
    var badgeEl = document.getElementById('error-count-badge');
    if (!listEl) return;
    var errors = typeof window.getLocalErrorLog === 'function'
      ? window.getLocalErrorLog()
      : [];
    if (badgeEl) badgeEl.textContent = errors.length;
    listEl.innerHTML = errors.length === 0
      ? '<div style="text-align:center;padding:30px;color:var(--grey-dark);">No errors captured</div>'
      : errors.slice().reverse().map(function(e) { return ErrorLogTab.renderEntry(e); }).join('');
  },

  renderEntry(e) {
    var timeStr = e.timestamp ? new Date(e.timestamp).toLocaleString() : '';
    return '<div class="approval-card" style="border-left:3px solid #c62828;">' +
      '<div class="approval-header">' +
      '<div class="approval-icon" style="background:#ffebee;font-size:16px;">⚠️</div>' +
      '<div class="approval-info">' +
      '<div class="approval-title" style="color:#c62828;">' + (e.source || 'error') + '</div>' +
      '<div class="approval-meta">' + (e.message || '').slice(0, 300) + '</div>' +
      (e.stack ? '<div class="approval-meta" style="font-size:10px;color:#999;font-family:monospace;white-space:pre-wrap;max-height:60px;overflow:hidden;">' + e.stack.slice(0, 300) + '</div>' : '') +
      (e.userId ? '<div class="approval-meta" style="font-size:10px;color:var(--grey-dark);">User: ' + e.userId + ' · ' + timeStr + '</div>' : '<div class="approval-date">' + timeStr + '</div>') +
      '</div>' +
      '</div>' +
      '</div>';
  },

  clear() {
    if (typeof window.clearLocalErrorLog === 'function') window.clearLocalErrorLog();
    this.load();
  }
};

window.ErrorLogTab = ErrorLogTab;
