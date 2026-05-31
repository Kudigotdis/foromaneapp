/* ═══════════════════════════════════════════════════════
   APPROVALS TAB - Unified queue with cadence deadline enforcement
   ═══════════════════════════════════════════════════════ */

const ApprovalsTab = {
  render(container) {
    const data = window.Admin.data;
    const state = window.AdminState;
    const allRequests = data.getUnifiedRequests();

    var deadlineHtml = '';
    if (window.ForomaneCadence) {
      var cd = window.ForomaneCadence.getCurrentCadenceDay();
      var now = new Date();
      var dayOfWeek = now.getDay();

      if (dayOfWeek === 0) {
        deadlineHtml = '<div style="background:#fff3e0;border:1px solid var(--orange);border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;">' +
          '\u26a0\ufe0f <strong>Approve before Sunday midnight</strong> for Monday Market Opener. Items submitted after Saturday 12:00 will be queued for the next cadence cycle.' +
          '</div>';
      } else if (dayOfWeek === 6) {
        var hoursUntilMidnight = 23 - now.getHours();
        var minsUntilMidnight = 59 - now.getMinutes();
        deadlineHtml = '<div style="background:#fff3e0;border:1px solid var(--orange);border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;">' +
          '\u23f3 <strong>Saturday deadline:</strong> Approvals must be completed by 12:00 noon for Monday. ' +
          (hoursUntilMidnight < 12 ? 'About ' + hoursUntilMidnight + 'h ' + minsUntilMidnight + 'm remaining.' : '') +
          '</div>';
      } else if (dayOfWeek >= 1 && dayOfWeek <= 4) {
        var daysLeft = 6 - dayOfWeek;
        deadlineHtml = '<div style="background:#f5f5f5;border:1px solid var(--grey-light);border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:var(--grey-dark);">' +
          '\ud83d\udcc5 ' + daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') + ' until Sunday approval deadline for Monday Market Opener' +
          '</div>';
      }
    }

    let filtered = allRequests;
    if (state.approvalFilter !== 'all') {
      filtered = allRequests.filter(function(r) { return r.type === state.approvalFilter; });
    }

    const pendingCount = allRequests.filter(function(r) { return r.status === 'pending'; }).length;

    container.innerHTML = `
      ${deadlineHtml}
      <div style="margin-bottom:12px;">
        <span style="font-size:14px;font-weight:600;">PENDING APPROVALS</span>
        <span style="background:var(--orange);color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;margin-left:8px;">${pendingCount}</span>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;">
        <button class="pill ${state.approvalFilter === 'all' ? 'active' : ''}" 
          onclick="AdminState.setApprovalFilter('all')">All</button>
        <button class="pill ${state.approvalFilter === 'promo' ? 'active' : ''}" 
          onclick="AdminState.setApprovalFilter('promo')">Promos</button>
        <button class="pill ${state.approvalFilter === 'payment' ? 'active' : ''}" 
          onclick="AdminState.setApprovalFilter('payment')">Payments</button>
        <button class="pill ${state.approvalFilter === 'artwork' ? 'active' : ''}" 
          onclick="AdminState.setApprovalFilter('artwork')">Artwork</button>
        <button class="pill ${state.approvalFilter === 'onboarding' ? 'active' : ''}" 
          onclick="AdminState.setApprovalFilter('onboarding')">Onboarding</button>
      </div>
      ${this.renderRequests(filtered)}
    `;
  },

  renderRequests(requests) {
    if (!requests || requests.length === 0) {
      return '<div style="text-align:center;padding:30px;color:var(--grey-dark);">No requests</div>';
    }
    return requests.map(function(r) { return ApprovalsTab.renderRequestCard(r); }).join('');
  },

  renderRequestCard(r) {
    const data = window.Admin.data;
    const biz = r.businessId ? data.businessMap[r.businessId] : null;
    const bizName = biz?.name || r.businessName || 'Unknown';
    const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '';

    const isAfterCutoff = r.createdAt ? ApprovalsTab._isAfterSaturdayCutoff(r.createdAt) : false;
    const hasExpiredCreds = r.userId ? ApprovalsTab._hasExpiredCredentials(r.userId) : false;

    let icon = '', details = '', typeClass = '';

    if (r.type === 'promo') {
      icon = '\ud83d\udce2';
      typeClass = 'type-promo';
      details = '<strong>' + (r.title || 'Promo Request') + '</strong> \u00b7 P' + (r.amount || 0) + ' \u00b7 ' + (r.durationDays || 0) + ' days';
    } else if (r.type === 'payment') {
      icon = '\ud83d\udcb3';
      typeClass = 'type-payment';
      details = '<strong>' + (r.method || 'Bank') + '</strong> \u00b7 P' + (r.amount || 0) + ' \u00b7 ' + (r.purpose || '');
    } else if (r.type === 'artwork') {
      icon = '\ud83c\udfa8';
      typeClass = 'type-artwork';
      if (r.items && r.items.length > 0) {
        const pending = r.items.filter(function(i) { return i.status === 'pending'; }).length;
        details = '<strong>' + (r.category || 'Artwork') + '</strong> \u00b7 ' + r.items.length + ' item' + (r.items.length !== 1 ? 's' : '') + ' \u00b7 ' + pending + ' pending';
      } else {
        details = '<strong>' + (r.category || 'Artwork') + '</strong> \u00b7 ' + (r.boostDay || '') + ' \u00b7 ' + (r.imageCount || 0) + ' images';
      }
    } else if (r.type === 'onboarding') {
      icon = '\ud83c\udfea';
      typeClass = 'type-onboarding';
      details = '<strong>' + (r.category || 'New Business') + '</strong> \u00b7 ' + (r.town || '') + ' \u00b7 ' + (r.phone || '');
    }

    const statusClass = r.status === 'pending' ? 'status-pending' : (r.status === 'approved' ? 'status-approved' : 'status-rejected');

    var warnings = '';
    if (isAfterCutoff) {
      warnings += '<div style="font-size:11px;color:#e65100;margin-top:4px;">\u26a0\ufe0f Submitted after Saturday 12:00 \u2014 queued for next cadence cycle</div>';
    }
    if (hasExpiredCreds) {
      warnings += '<div style="font-size:11px;color:#c62828;margin-top:4px;">\u26a0\ufe0f Staff account has expired permissions</div>';
    }

    let bodyHtml = '';
    if (r.type === 'artwork' && r.items && r.items.length > 0) {
      bodyHtml = '<div style="margin-top:8px;border-top:1px solid var(--grey-light);padding-top:8px;">';
      r.items.forEach(function(item, idx) {
        const itemStatusClass = item.status === 'pending' ? 'status-pending' : (item.status === 'approved' ? 'status-approved' : 'status-rejected');
        const thumbnailHtml = item.thumbnail
          ? '<img src="' + item.thumbnail + '" style="width:40px;height:40px;object-fit:cover;border-radius:4px;flex-shrink:0;">'
          : '<div style="width:40px;height:40px;background:#eee;border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;">\ud83d\uddbc</div>';
        const scheduleStr = item.scheduledDate ? (item.scheduledDay || '') + ' ' + item.scheduledDate : 'No date';
        bodyHtml += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:' + (idx < r.items.length - 1 ? '1px solid #f0f0f0' : 'none') + ';">' +
          thumbnailHtml +
          '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (item.title || 'Untitled') + '</div>' +
          '<div style="font-size:11px;color:var(--grey-dark);">' + scheduleStr + '</div>' +
          '</div>' +
          '<span style="font-size:11px;font-weight:600;color:' + (item.status === 'pending' ? 'var(--orange)' : (item.status === 'approved' ? '#2e7d32' : '#e74c3c')) + ';text-transform:capitalize;white-space:nowrap;">' + item.status + '</span>' +
          (item.status === 'pending' ? '<button class="btn-sm" style="background:#2e7d32;color:#fff;border:none;padding:2px 8px;font-size:10px;" onclick="Admin.approveArtworkItem(\'' + r.id + '\',\'' + item.id + '\')">\u2713</button>' +
          '<button class="btn-sm" style="background:#e74c3c;color:#fff;border:none;padding:2px 8px;font-size:10px;" onclick="Admin.rejectArtworkItem(\'' + r.id + '\',\'' + item.id + '\')">\u2715</button>' : '') +
          '</div>';
      });
      bodyHtml += '</div>';
    }

    return '<div class="approval-card">' +
      '<div class="approval-header">' +
      '<div class="approval-icon ' + typeClass + '">' + icon + '</div>' +
      '<div class="approval-info">' +
      '<div class="approval-title">' + bizName + '</div>' +
      '<div class="approval-meta">' + details + '</div>' +
      '<div class="approval-date">' + date + ' \u00b7 <span class="' + statusClass + '">' + r.status + '</span></div>' +
      warnings +
      '</div>' +
      '</div>' +
      bodyHtml +
      (r.status === 'pending' ? (r.type === 'artwork' && r.items && r.items.length > 0 ? '' :
      '<div class="approval-actions">' +
      (r.type === 'payment' && r.image ? '<button class="btn-sm" style="background:#1976d2;color:#fff;border:none;" onclick="Admin.viewPaymentProof(\'' + r.id + '\')">View Proof</button>' : '') +
      '<button class="btn-sm btn-approve" onclick="Admin.approveRequest(\'' + r.type + '\',\'' + r.id + '\')">Approve</button>' +
      '<button class="btn-sm btn-reject" onclick="Admin.rejectRequest(\'' + r.type + '\',\'' + r.id + '\')">Reject</button>' +
      '</div>') : '') +
      '</div>';
  },

  _isAfterSaturdayCutoff(createdAt) {
    var d = new Date(createdAt);
    var day = d.getDay();
    var hours = d.getHours();
    return day === 6 && hours >= 12;
  },

  _hasExpiredCredentials(userId) {
    var data = window.Admin.data;
    var profile = data.userMap[userId];
    if (!profile) return false;
    if ((profile.role === 'Pro' || profile.role === 'Professional') && profile.credentialsExpireAt) {
      return new Date(profile.credentialsExpireAt) < new Date();
    }
    return false;
  }
};

window.ApprovalsTab = ApprovalsTab;
