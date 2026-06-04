/* ═══════════════════════════════════════════════════════
   PAYMENT TAB - Payment requests & gateway status
   ═══════════════════════════════════════════════════════ */

const PaymentTab = {
  render(container) {
    container.innerHTML = `
      <div style="margin-bottom:12px;">
        <span style="font-size:14px;font-weight:600;">PAYMENTS</span>
        <span id="pay-count-badge" style="background:var(--orange);color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;margin-left:8px;">0</span>
      </div>
      <div id="pay-filters" style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">
        <button class="pill active" data-status="all" onclick="PaymentTab.setFilter('all')">All</button>
        <button class="pill" data-status="pending" onclick="PaymentTab.setFilter('pending')">Pending</button>
        <button class="pill" data-status="approved" onclick="PaymentTab.setFilter('approved')">Approved</button>
        <button class="pill" data-status="rejected" onclick="PaymentTab.setFilter('rejected')">Rejected</button>
      </div>
      <div id="payment-list"><div style="text-align:center;padding:30px;color:var(--grey-dark);">Loading...</div></div>
    `;
    this._filter = 'all';
    this.load();
  },

  setFilter(status) {
    this._filter = status;
    document.querySelectorAll('#pay-filters .pill').forEach(function(b) {
      b.classList.toggle('active', b.dataset.status === status);
    });
    this.load();
  },

  load() {
    var data = window.Admin ? window.Admin.data : null;
    if (!data) return;
    var listEl = document.getElementById('payment-list');
    var badgeEl = document.getElementById('pay-count-badge');
    if (!listEl) return;
    var payments = data.getUnifiedRequests().filter(function(r) { return r.type === 'payment'; });
    if (this._filter !== 'all') payments = payments.filter(function(p) { return p.status === this._filter; }.bind(this));
    if (badgeEl) badgeEl.textContent = payments.length;
    listEl.innerHTML = payments.length === 0
      ? '<div style="text-align:center;padding:30px;color:var(--grey-dark);">No payments</div>'
      : payments.map(function(p) { return PaymentTab.renderCard(p); }).join('');
  },

  renderCard(p) {
    var methodIcons = { BTC: '₿', Mascom: '📱', Orange: '📱', Bank: '🏦' };
    var icon = methodIcons[p.method] || '💳';
    var statusClass = p.status === 'approved' ? 'status-approved' : (p.status === 'rejected' ? 'status-rejected' : 'status-pending');
    var dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '';
    return '<div class="approval-card">' +
      '<div class="approval-header">' +
      '<div class="approval-icon" style="background:#f5f5f5;font-size:16px;">' + icon + '</div>' +
      '<div class="approval-info">' +
      '<div class="approval-title">' + (p.businessName || 'Unknown') + '</div>' +
      '<div class="approval-meta"><strong>' + p.method + '</strong> · P' + (p.amount || 0) + ' · ' + (p.purpose || '') + '</div>' +
      '<div class="approval-date">' + dateStr + ' · <span class="' + statusClass + '">' + p.status + '</span></div>' +
      '</div>' +
      '</div>' +
      (p.status === 'pending' ? '<div class="approval-actions">' +
        (p.image ? '<button class="btn-sm" style="background:#1976d2;color:#fff;border:none;" onclick="Admin.viewPaymentProof(\'' + p.id + '\')">View Proof</button>' : '') +
        '<button class="btn-sm btn-approve" onclick="Admin.approveRequest(\'payment\',\'' + p.id + '\')">Approve</button>' +
        '<button class="btn-sm btn-reject" onclick="Admin.rejectRequest(\'payment\',\'' + p.id + '\')">Reject</button>' +
        '</div>' : '') +
      '</div>';
  }
};

window.PaymentTab = PaymentTab;
