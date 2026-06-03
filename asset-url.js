/* ════════════════════════════════════════════════════════
   FOROMANE ASSET URL - Image path resolver
   Routes relative paths → Firebase Storage CDN when enabled.
   ════════════════════════════════════════════════════════ */

/* Self-destruct stale Service Workers and caches */
(function(){
  if ('caches' in window) {
    caches.keys().then(function(keys) {
      keys.forEach(function(k) {
        if (k.startsWith('foromane-') || k.startsWith('offline-')){
          caches.delete(k);
        }
      });
    });
  }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      regs.forEach(function(r) { r.unregister(); });
    }).catch(function(){});
  }
})();

window.__STORAGE_BASE = 'https://firebasestorage.googleapis.com/v0/b/foromane-app.firebasestorage.app/o/';

window.__USE_STORAGE = false; // Disabled — assets served locally from repo

window.useStorage = function (enabled) {
  if (enabled === void 0) return window.__USE_STORAGE === true;
  window.__USE_STORAGE = !!enabled;
};

window.assetUrl = function (relativePath) {
  if (!relativePath) return relativePath;
  if (/^https?:\/\//i.test(relativePath) || relativePath.startsWith('data:')) return relativePath;
  if (!window.useStorage()) return relativePath;
  return window.__STORAGE_BASE + encodeURIComponent(relativePath) + '?alt=media';
};

(function () {
  function stripOrigin(p) {
    if (location.protocol === 'file:') return p;
    try {
      var u = new URL(p, document.baseURI);
      return u.origin === location.origin ? u.pathname + u.search : p;
    } catch (_) { return p; }
  }

  function walk(root) {
    if (!root || !root.querySelectorAll) return;
    var imgs = root.querySelectorAll('img[src^="assets/"], img[src^="/assets/"]');
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].setAttribute('src', window.assetUrl(stripOrigin(imgs[i].getAttribute('src'))));
    }
    var sources = root.querySelectorAll('source[src^="assets/"], source[src^="/assets/"]');
    for (var j = 0; j < sources.length; j++) {
      var src = sources[j].getAttribute('src');
      if (src) sources[j].setAttribute('src', window.assetUrl(stripOrigin(src)));
      var srcset = sources[j].getAttribute('srcset');
      if (srcset) {
        sources[j].setAttribute('srcset', srcset.split(',').map(function (part) {
          var p = part.trim().split(/\s+/), url = p[0], rest = p.slice(1).join(' ');
          if (/^assets\//.test(stripOrigin(url))) url = window.assetUrl(stripOrigin(url));
          return url + (rest ? ' ' + rest : '');
        }).join(', '));
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { walk(document); });
  } else {
    walk(document);
  }

  var observer = new MutationObserver(function (mutations) {
    for (var m = 0; m < mutations.length; m++) {
      for (var n = 0; n < mutations[m].addedNodes.length; n++) {
        var node = mutations[m].addedNodes[n];
        if (node.nodeType === 1 && node.querySelectorAll) {
          walk(node);
        }
      }
    }
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
