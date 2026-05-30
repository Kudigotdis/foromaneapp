/**
 * MODE CONTROLLER
 * Manages the application's Tri-State mode (Online, Offline, Saved).
 */

const FOROMANE_MODES = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    SAVED: 'saved'
};
window.FOROMANE_MODES = FOROMANE_MODES;

let currentMode = localStorage.getItem('foromane_app_mode') || FOROMANE_MODES.SAVED;

const _MODE_TO_IMG = {
  online: 'live',
  offline: 'saved',
  saved: 'saved'
};

function _setImgModeForAppMode(mode) {
  var imgMode = window.FOROMANE_IMG_MODE;
  if (!imgMode) return;
  var target = _MODE_TO_IMG[mode] || 'live';
  if (imgMode.current !== target) imgMode.set(target);
}

/**
 * Updates the application mode and syncs the UI toggle group.
 * @param {string} mode - One of FOROMANE_MODES
 */
const setAppMode = (mode) => {
    if (!Object.values(FOROMANE_MODES).includes(mode)) {
        console.error(`Invalid Mode: ${mode}`);
        return;
    }

    currentMode = mode;
    localStorage.setItem('foromane_app_mode', mode);

    // Update UI Toggle Buttons
    const buttons = {
        [FOROMANE_MODES.ONLINE]: document.querySelector('.btn-mode-online'),
        [FOROMANE_MODES.OFFLINE]: document.querySelector('.btn-mode-offline'),
        [FOROMANE_MODES.SAVED]: document.querySelector('.btn-mode-saved')
    };

    // Remove active class from all and add to current
    Object.values(buttons).forEach(btn => { if (btn) btn.classList.remove('active'); });
    
    if (buttons[mode]) {
        buttons[mode].classList.add('active');
    }

    console.log('App Mode set to: ' + mode);

    _setImgModeForAppMode(mode);

    window.dispatchEvent(new CustomEvent('foromaneModeChanged', { detail: { mode } }));
};

window.setAppMode = setAppMode;

function _handleConnectivity() {
  if (currentMode === FOROMANE_MODES.SAVED) {
    var imgMode = window.FOROMANE_IMG_MODE;
    if (imgMode) {
      var target = navigator.onLine ? 'live' : 'saved';
      if (imgMode.current !== target) imgMode.set(target);
    }
    return;
  }
  var mode = navigator.onLine ? FOROMANE_MODES.ONLINE : FOROMANE_MODES.OFFLINE;
  if (currentMode !== mode) setAppMode(mode);
}

window.addEventListener('online', _handleConnectivity);
window.addEventListener('offline', _handleConnectivity);

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    if (!navigator.onLine && currentMode === FOROMANE_MODES.ONLINE) {
      currentMode = FOROMANE_MODES.OFFLINE;
    }
    setAppMode(currentMode);
});
