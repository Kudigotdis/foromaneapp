/* ════════════════════════════════════════════════════════
   FOROMANE UTILS - Toast, modals, accordion, helpers
   ════════════════════════════════════════════════════════ */

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function toggleAcc(header) {
  header.parentElement.classList.toggle('open');
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function initRegisterView() {
  const preview = document.getElementById('reg-photo-preview');
  const placeholder = document.getElementById('reg-photo-placeholder');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  if (placeholder) placeholder.style.display = 'flex';
  const photoInput = document.getElementById('reg-photo-input');
  if (photoInput) photoInput.value = '';
  localStorage.removeItem('foromane_reg_photo');
  const savedGender = UserState.gender || localStorage.getItem('foromane_gender');
  if (savedGender) {
    document.querySelectorAll('#view-register .gender-btn').forEach(function(b) {
      b.classList.toggle('active', b.textContent.trim() === savedGender);
    });
  }
  if (typeof renderRegMobileEntries === 'function') renderRegMobileEntries();
  if (typeof renderRegWhatsAppEntries === 'function') renderRegWhatsAppEntries();
  if (typeof updateRegTally === 'function') updateRegTally();
  if (typeof initRaceChips === 'function') initRaceChips();
  if (typeof populateDobDropdowns === 'function') populateDobDropdowns();
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  el.style.display = '';
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ─── PUSH NOTIFICATIONS ─── */
var FOROMANE_VAPID_PUBLIC_KEY = 'BBAHkFzRPE3sVJUzqJpOmC-RmDDvFv8QCRIblGPqw_JhVKxSGoQHQ_w_WzBqy7jbFGi1JN8JMg1R3_n05HmPjVY'; // Demo key

function isNotificationEnabled() {
  return localStorage.getItem('foromane_notifications') === '1';
}

function askNotificationPermission() {
  if (!('Notification' in window)) { showToast('Notifications not supported on this device'); return; }
  if (Notification.permission === 'granted') {
    subscribeToPush();
  } else if (Notification.permission === 'denied') {
    showToast('Notifications blocked. Enable in browser settings.');
  } else {
    Notification.requestPermission().then(function(permission) {
      if (permission === 'granted') {
        subscribeToPush();
      } else {
        showToast('Notification permission denied');
      }
    });
  }
}

async function subscribeToPush() {
  try {
    var reg = await navigator.serviceWorker.ready;
    var sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(FOROMANE_VAPID_PUBLIC_KEY)
    });
    localStorage.setItem('foromane_notifications', '1');
    localStorage.setItem('foromane_push_subscription', JSON.stringify(sub.toJSON()));
    var statusEl = document.getElementById('notif-status');
    if (statusEl) statusEl.textContent = 'On';
    showToast('Notifications enabled');
  } catch(err) {
    console.warn('Push subscription failed:', err);
    showToast('Could not enable notifications');
  }
}

async function unsubscribeFromPush() {
  try {
    var reg = await navigator.serviceWorker.ready;
    var sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    localStorage.setItem('foromane_notifications', '0');
    localStorage.removeItem('foromane_push_subscription');
    var statusEl = document.getElementById('notif-status');
    if (statusEl) statusEl.textContent = 'Off';
    showToast('Notifications disabled');
  } catch(err) {
    console.warn('Push unsubscribe failed:', err);
  }
}

function toggleNotifications() {
  if (isNotificationEnabled()) {
    unsubscribeFromPush();
  } else {
    askNotificationPermission();
  }
}

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);
  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/* ─── ONBOARDING WALKTHROUGH ─── */
var _onboardingStep = 0;
var ONBOARDING_STEPS = [
  { icon: '\uD83D\uDCE2', title: 'Browse Promos', desc: 'Discover the latest deals and promotions from businesses near you. Tap a promo to see full details, adjust quantities, and save items to your notes.' },
  { icon: '\uD83D\uDCCB', title: 'Find Businesses', desc: 'Use the Directory to find businesses and tradespeople by category, location, or trade. View profiles, catalogues, and contact them directly via WhatsApp.' },
  { icon: '\uD83D\uDCDD', title: 'Save & Share', desc: 'Save items to your Notes for easy reference later. Share promos and products via WhatsApp with friends and colleagues.' }
];

function showOnboarding() {
  if (localStorage.getItem('foromane_onboard_done')) return;
  _onboardingStep = 0;
  renderOnboardingStep();
  openModal('onboarding-modal');
}

function renderOnboardingStep() {
  var step = ONBOARDING_STEPS[_onboardingStep];
  document.getElementById('onboarding-icon').textContent = step.icon;
  document.getElementById('onboarding-title').textContent = step.title;
  document.getElementById('onboarding-desc').textContent = step.desc;
  for (var i = 0; i < 3; i++) {
    var dot = document.getElementById('odot-' + i);
    if (dot) dot.style.background = i === _onboardingStep ? 'var(--orange)' : 'var(--grey-light)';
  }
  var btn = document.getElementById('onboarding-btn');
  if (_onboardingStep === 2) {
    btn.textContent = 'Get Started';
  } else {
    btn.textContent = 'Next';
  }
}

function nextOnboardingStep() {
  _onboardingStep++;
  if (_onboardingStep >= 3) {
    closeOnboarding();
    return;
  }
  renderOnboardingStep();
}

function closeOnboarding() {
  localStorage.setItem('foromane_onboard_done', '1');
  closeModal('onboarding-modal');
}

window.showToast = showToast;
window.toggleAcc = toggleAcc;
window.openModal = openModal;
window.closeModal = closeModal;
window.escapeHtml = escapeHtml;
window.showOnboarding = showOnboarding;
window.nextOnboardingStep = nextOnboardingStep;
window.closeOnboarding = closeOnboarding;

function buildAZGridHTML() {
  var letters = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:16px 0;">' +
    letters.map(function(l) {
      return '<div class="az-letter" data-letter="' + l + '" onclick="selectAlphaLetter(\'' + l + '\')">' + l + '</div>';
    }).join('') +
    '</div>';
}
window.buildAZGridHTML = buildAZGridHTML;

window.togglePasswordVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  const icon = btn.querySelector('i');
  if (icon) {
    icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
  }
};
