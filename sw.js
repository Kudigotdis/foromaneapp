// Foromane Service Worker v1

var CACHE_NAME = 'foromane-cache-v1';
var URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/auth.js',
  '/account.js',
  '/backend-logic.js',
  '/db.js',
  '/user-state.js',
  '/firebase-init.js',
  '/admin/Admin.html',
  '/admin/Admin.js',
  '/admin/AdminData.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; }).map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

// Push notification event
self.addEventListener('push', function(event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Foromane', body: event.data ? event.data.text() : 'New notification' };
  }
  var title = data.title || 'Foromane';
  var options = {
    body: data.body || '',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-192.png',
    data: data
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(url) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
