const CACHE = 'foromane-v7';
const ASSETS = [
  './',
  'index.html',
  'css/styles.css',
  'manifest.json',
  'assets/icons/pwa/icon-192.png',
  'assets/icons/pwa/icon-512.png',
  'asset-url.js',
  'data.js',
  'demo-data.js',
  'demo-profiles.js',
  'db.js',
  'media-cache.js',
  'user-state.js',
  'auth.js',
  'utils.js',
  'pricing-engine.js',
  'foromane_product_categories.js',
  'data/tradeSpecific.js',
  'data/tradesman-skills.js',
  'data/trade-skill-map.js',
  'skill-ratings.js',
  'filter.js',
  'navigation.js',
  'router.js',
  'promos.js',
  'pro.js',
  'data/seed-pro-skills.js',
  'directory.js',
  'notes.js',
  'account.js',
  'analytics.js',
  'admin/AdminData.js',
  'admin/AdminState.js',
  'admin/views/ClientListTab.js',
  'admin/views/OverviewTab.js',
  'admin/views/ApprovalsTab.js',
  'admin/views/FacebookCalendarTab.js',
  'admin/views/DirectoryTab.js',
  'admin/views/AnalyticsTab.js',
  'admin/views/AdminManagementTab.js',
  'admin/Admin.js',
  'admin.js',
  'items.js',
  'blogs.js',
  'app.js',
  'staff.js',
  'account-views.js',
  'sync.js',
  'path-utils.js',
  'mode-controller.js',
  'ui-helpers.js',
  'backend-logic.js',
  'ui-styles.css',
  'sw-register.js',
  'drive-api.js',
  'google-config.js',
  'locations.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  var req = e.request;
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match(req).then(r => r || caches.match('index.html') || fetch(req)).catch(() => caches.match('index.html'))
    );
    return;
  }

  var isImage = req.destination === 'image' || req.url.match(/\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/);
  var isGET = req.method === 'GET';

  if (isImage && isGET) {
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(networkRes => {
          var cloned = networkRes.clone();
          caches.open(CACHE).then(cache => {
            try { cache.put(req, cloned); } catch (_) {}
          }).catch(function(){});
          return networkRes;
        }).catch(function(){ return caches.match(req); });
      }).catch(function(){ return fetch(req); })
    );
    return;
  }

  if (isImage && !isGET) {
    e.respondWith(fetch(req));
    return;
  }

  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      if (req.method === 'GET' && res.ok && !res.bodyUsed) {
        var cloned = res.clone();
        caches.open(CACHE).then(cache => {
          try { cache.put(req, cloned); } catch (_) {}
        }).catch(function(){});
      }
      return res;
    }).catch(function(){ return caches.match('index.html'); }))
  );
});

/* ─── PUSH NOTIFICATIONS ─── */
self.addEventListener('push', e => {
  var data = { title: 'Foromane', body: 'New update available', icon: 'assets/icons/pwa/icon-192.png' };
  try {
    if (e.data) data = Object.assign(data, e.data.json());
  } catch(err) {}
  var opts = {
    body: data.body,
    icon: data.icon,
    badge: 'assets/icons/pwa/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || './' }
  };
  e.waitUntil(self.registration.showNotification(data.title, opts));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  var url = e.notification.data && e.notification.data.url ? e.notification.data.url : '/';
  e.waitUntil(clients.matchAll({ type: 'window' }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      if (client.url === url && 'focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
