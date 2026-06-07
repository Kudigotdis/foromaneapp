var DATA_LOADED = false;
var DATA_LOADING = null;

function loadDemoExtraData() {
  if (DATA_LOADED) return Promise.resolve();
  if (DATA_LOADING) return DATA_LOADING;
  DATA_LOADING = new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = 'data/demo-extra-data.js';
    s.onload = function() {
      DATA_LOADED = true;
      resolve();
    };
    s.onerror = function() {
      console.warn('Failed to load extra demo data');
      reject();
    };
    document.head.appendChild(s);
  });
  return DATA_LOADING;
}
