/* ═══════════════════════════════════════════════════════
   PUSH BROADCAST TAB - Admin push notification broadcaster
   ═══════════════════════════════════════════════════════ */

const PushBroadcastTab = {
  render(container) {
    container.innerHTML = `
      <div style="margin-bottom:12px;">
        <span style="font-size:14px;font-weight:600;">PUSH NOTIFICATIONS</span>
        <span id="push-subs-count" style="background:var(--orange);color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;margin-left:8px;">loading...</span>
      </div>
      <div style="background:#f9f9f9;border:1px solid var(--grey-light);border-radius:8px;padding:16px;margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Broadcast Notification</div>
        <input id="push-title" class="modal-input" placeholder="Notification title" style="width:100%;margin-bottom:8px;padding:8px;border:1px solid var(--grey-light);border-radius:6px;font-size:13px;">
        <textarea id="push-body" class="modal-input" placeholder="Notification message" rows="3" style="width:100%;margin-bottom:8px;padding:8px;border:1px solid var(--grey-light);border-radius:6px;font-size:13px;resize:vertical;"></textarea>
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="btn-sm" style="background:var(--orange);color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;" onclick="PushBroadcastTab.sendBroadcast()">
            <i class="fas fa-paper-plane"></i> Send to All
          </button>
          <button class="btn-sm" style="background:#e3f2fd;color:#1565c0;border:1px solid #1565c0;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;" onclick="PushBroadcastTab.testNotification()">
            <i class="fas fa-flask"></i> Test (Local)
          </button>
          <span id="push-status" style="font-size:12px;color:var(--grey-dark);"></span>
        </div>
      </div>
      <div id="push-sub-list"><div style="text-align:center;padding:30px;color:var(--grey-dark);">Loading subscriptions...</div></div>
    `;
    this.load();
  },

  async load() {
    var listEl = document.getElementById('push-sub-list');
    var badgeEl = document.getElementById('push-subs-count');
    if (!listEl) return;
    try {
      var subs = [];
      var fb = await this._getFirebase();
      if (fb) {
        var snap = await fb.firestore.getDocs(fb.firestore.collection(fb.db, 'push_subscriptions'));
        subs = snap.docs.map(function(d) { var s = d.data(); s.id = d.id; return s; });
      } else {
        subs = JSON.parse(localStorage.getItem('foromane_push_subscriptions') || '[]');
      }
      if (badgeEl) badgeEl.textContent = subs.length;
      listEl.innerHTML = subs.length === 0
        ? '<div style="text-align:center;padding:30px;color:var(--grey-dark);">No push subscriptions found</div>'
        : subs.map(function(s) { return PushBroadcastTab.renderSub(s); }).join('');
    } catch (e) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#c62828;">Error: ' + e.message + '</div>';
    }
  },

  renderSub(s) {
    var agent = (s.userAgent || '').substring(0, 60);
    var timeStr = s.enabledAt && s.enabledAt.toDate
      ? s.enabledAt.toDate().toLocaleString()
      : (s.enabledAt || '');
    return '<div class="approval-card">' +
      '<div class="approval-header">' +
      '<div class="approval-icon" style="background:#e3f2fd;color:#1565c0;font-size:16px;"><i class="fas fa-bell"></i></div>' +
      '<div class="approval-info">' +
      '<div class="approval-title">' + (s.userId || 'Unknown') + '</div>' +
      '<div class="approval-meta">' + agent + '</div>' +
      '<div class="approval-date">' + timeStr + '</div>' +
      '</div>' +
      '</div>' +
      '</div>';
  },

  async sendBroadcast() {
    var title = document.getElementById('push-title').value.trim();
    var body = document.getElementById('push-body').value.trim();
    var statusEl = document.getElementById('push-status');
    if (!title || !body) { statusEl.textContent = 'Please enter both title and body.'; return; }
    statusEl.textContent = 'Sending...';

    try {
      if (typeof window.sendPushNotification === 'function') {
        await window.sendPushNotification(title, body, null);
        statusEl.textContent = 'Notification sent (local). To broadcast via Cloud Function, configure push endpoint.';
      } else {
        // Fallback: show local notification
        if ('Notification' in window && Notification.permission === 'granted') {
          try { new Notification(title, { body: body, icon: '/assets/icons/icon-192.png' }); } catch (e) {}
        }
        statusEl.textContent = 'Notification triggered locally.';
      }
      document.getElementById('push-title').value = '';
      document.getElementById('push-body').value = '';
      setTimeout(function() { statusEl.textContent = ''; }, 3000);
    } catch (e) {
      statusEl.textContent = 'Error: ' + e.message;
    }
  },

  testNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Test Notification from Foromane', {
          body: 'This is a test notification. Push notifications are working!',
          icon: '/assets/icons/icon-192.png'
        });
        document.getElementById('push-status').textContent = 'Test notification sent!';
      } catch (e) {
        document.getElementById('push-status').textContent = 'Error: ' + e.message;
      }
    } else {
      document.getElementById('push-status').textContent = 'Notification permission not granted.';
    }
    setTimeout(function() {
      var el = document.getElementById('push-status');
      if (el) el.textContent = '';
    }, 3000);
  },

  async _getFirebase() {
    if (window.fb) return window.fb;
    if (typeof window._ensureFirebase === 'function') {
      try { return await window._ensureFirebase(); } catch (e) { return null; }
    }
    return null;
  }
};

window.PushBroadcastTab = PushBroadcastTab;
