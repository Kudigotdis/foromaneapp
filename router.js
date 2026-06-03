/* ════════════════════════════════════════════════════════
   FOROMANE ROUTER - View switching & navigation
   Always starts on Promos tab
   ════════════════════════════════════════════════════════ */

let currentView = 'view-promos';
let viewHistory = [];
window.currentView = currentView;

function switchView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.accordion').forEach(a => a.classList.remove('open'));
  const target = document.getElementById(viewId);
  if (!target) return;
  target.classList.add('active');
  document.getElementById('router').scrollTop = 0;
  currentView = viewId;
  window.currentView = viewId;
  manageUI(viewId);
  updateNavIcons();
  if (viewId === 'view-account' && window.updateAccountUI) {
    window.updateAccountUI();
  }
}

function goTo(viewId) {
  /* navigation guard for artwork submission */
  if (currentView === 'view-artwork-submission' && currentView !== viewId) {
    if (window.hasUnsavedArtwork && window.hasUnsavedArtwork()) {
      if (!confirm('Your artwork submission will be lost. Leave anyway?')) return;
      if (window.clearUnsavedArtwork) window.clearUnsavedArtwork();
    }
  }
  if (currentView && currentView !== viewId) {
    viewHistory.push(currentView);
  }
  switchView(viewId);
  syncNav(viewId);
}

function goBack() {
  if (viewHistory.length > 0) {
    const prev = viewHistory.pop();
    switchView(prev);
    syncNav(prev);
  } else {
    switchView('view-promos');
  }
}

function navTab(viewId, navId) {
  if (currentView && currentView !== viewId) {
    viewHistory.push(currentView);
  }
  switchView(viewId);
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navEl = document.getElementById(navId);
  if (navEl) navEl.classList.add('active');
  updateNavIcons();
}

function resetFilterState() {
  selectedCategories = [];
  selectedPlaceA = 'Nation Wide';
  selectedPlaceB = 'All Area';
  promoTypeIdx = 0;

  var catBtn = document.getElementById('category-filter-btn');
  if (catBtn) catBtn.textContent = 'All Services';
  var placeABtn = document.getElementById('place-a-btn');
  if (placeABtn) placeABtn.textContent = 'Nation Wide';
  var placeABtnPro = document.getElementById('place-a-btn-pro');
  if (placeABtnPro) placeABtnPro.textContent = 'Nation Wide';
  var placeBBtn = document.getElementById('place-b-btn');
  if (placeBBtn) placeBBtn.textContent = 'All Area';
  var promoTypeBtn = document.getElementById('promo-type-btn');
  if (promoTypeBtn) promoTypeBtn.textContent = promoTypes[0];
  var tradesmenBtn = document.getElementById('tradesmen-filter-btn');
  if (tradesmenBtn) tradesmenBtn.textContent = 'All Tradesmen';
  selectedTrades = [];
}

function manageUI(viewId) {
  const header = document.getElementById('app-header');
  const bottomNav = document.getElementById('bottom-nav');
  const filterBar = document.getElementById('filter-bar');

  if (viewId === 'view-welcome' || viewId === 'view-register' || viewId === 'view-login' || viewId === 'view-admin' || viewId === 'view-analytics' || viewId === 'view-analytics-month' || viewId === 'view-business-staff') {
    if (viewId === 'view-login' && window.Auth) {
      window.Auth.hideForgotPassword();
      window.Auth._clearLoginForm();
    }
    if (header) header.classList.add('shell-hidden');
    if (bottomNav) bottomNav.style.display = 'none';
    if (filterBar) filterBar.style.display = 'none';
    return;
  }

  if (viewId === 'view-user-interests' && window._regModeInterests) {
    if (header) header.classList.add('shell-hidden');
    if (bottomNav) bottomNav.style.display = 'none';
    if (filterBar) filterBar.style.display = 'none';
    return;
  }

  if (viewId === 'view-pro-account' && window.renderProAccountPage) window.renderProAccountPage();
  if (viewId === 'view-pro-dashboard' && window.renderProDashboard) window.renderProDashboard();

  if (viewId === 'view-artwork-submission') {
    if (header) header.classList.remove('shell-hidden');
    if (bottomNav) bottomNav.style.display = 'flex';
    if (filterBar) filterBar.style.display = 'none';
    if (window.renderBoostSubmissionStatus) window.renderBoostSubmissionStatus();
    return;
  }

  const showFilter = viewId === 'view-promos' || viewId === 'view-directory';

  if (header) header.classList.remove('shell-hidden');
  if (bottomNav) bottomNav.style.display = 'flex';
  if (filterBar) filterBar.style.display = showFilter ? 'flex' : 'none';

  if (showFilter && viewHistory.length > 0 && viewHistory[viewHistory.length - 1] !== viewId) {
    resetFilterState();
  }

  const promoTypeRow = document.getElementById('promo-type-row');
  if (promoTypeRow) promoTypeRow.style.display = viewId === 'view-promos' ? '' : 'none';

  const bizTypeRow = document.getElementById('business-type-filter-row');
  if (bizTypeRow) bizTypeRow.style.display = viewId === 'view-directory' ? '' : 'none';

  var serviceRow = document.getElementById('service-and-location-filter-row');
  var tradesmanRow = document.getElementById('tradesman-type-and-location-filter-row');
  if (viewId === 'view-promos') {
    if (serviceRow) serviceRow.style.display = '';
    if (tradesmanRow) tradesmanRow.style.display = 'none';
  } else if (viewId === 'view-directory') {
    var isPros = typeof dirMode !== 'undefined' && dirMode === 'pros';
    if (serviceRow) serviceRow.style.display = isPros ? 'none' : '';
    if (tradesmanRow) tradesmanRow.style.display = isPros ? '' : 'none';
  } else {
    if (serviceRow) serviceRow.style.display = 'none';
    if (tradesmanRow) tradesmanRow.style.display = 'none';
  }

  if (viewId === 'view-directory') {
    renderDirectory();
  }
}

function enterApp() {
  document.getElementById('app-header').classList.remove('shell-hidden');
  document.getElementById('bottom-nav').style.display = 'flex';
  navTab('view-promos', 'nav-promos');
}

function togglePromoShell(hide) {
  const header = document.getElementById('app-header');
  const bottomNav = document.getElementById('bottom-nav');
  const filterBar = document.getElementById('filter-bar');
  if (hide) {
    if (header) header.classList.add('shell-hidden');
    if (bottomNav) bottomNav.style.display = 'none';
    if (filterBar) filterBar.style.display = 'none';
  } else {
    if (header) header.classList.remove('shell-hidden');
    if (bottomNav) bottomNav.style.display = 'flex';
    var viewId = currentView;
    var showFilter = viewId === 'view-promos' || viewId === 'view-directory';
    if (filterBar) filterBar.style.display = showFilter ? 'flex' : 'none';
  }
}
window.togglePromoShell = togglePromoShell;
window.goTo = goTo;
window.goBack = goBack;
window.navTab = navTab;
window.enterApp = enterApp;
