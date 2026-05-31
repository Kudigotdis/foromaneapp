/* ════════════════════════════════════════════════════════
   FOROMANE CADENCE ENGINE - Perpetual calendar logic
   First Monday of each month → 12 cadence dates (Mon/Wed/Fri × 4 weeks)
   ════════════════════════════════════════════════════════ */

window.ForomaneCadence = (function() {

  function getFirstMonday(year, month) {
    var d = new Date(year, month, 1);
    var day = d.getDay();
    var daysUntilMonday = (8 - day) % 7;
    d.setDate(1 + daysUntilMonday);
    return d;
  }

  function getCadenceDates(year, month) {
    var firstMon = getFirstMonday(year, month);
    var dates = [];
    for (var w = 0; w < 4; w++) {
      dates.push({
        day: 'monday',
        date: new Date(firstMon.getFullYear(), firstMon.getMonth(), firstMon.getDate() + w * 7),
        label: 'Monday',
        focus: 'bulk'
      });
      dates.push({
        day: 'wednesday',
        date: new Date(firstMon.getFullYear(), firstMon.getMonth(), firstMon.getDate() + w * 7 + 2),
        label: 'Wednesday',
        focus: 'trades'
      });
      dates.push({
        day: 'friday',
        date: new Date(firstMon.getFullYear(), firstMon.getMonth(), firstMon.getDate() + w * 7 + 4),
        label: 'Friday',
        focus: 'diy'
      });
    }
    return dates;
  }

  function getMaintenanceWindow(year, month) {
    var firstMon = getFirstMonday(year, month);
    var firstMonDate = firstMon.getDate();
    if (firstMonDate <= 1) return null;
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month, firstMonDate - 1),
      label: 'Maintenance Window'
    };
  }

  function isMaintenanceWindow(date) {
    var d = date || new Date();
    var year = d.getFullYear();
    var month = d.getMonth();
    var mw = getMaintenanceWindow(year, month);
    if (!mw) return false;
    return d >= mw.start && d <= mw.end;
  }

  function getCurrentCadenceDay() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    if (isMaintenanceWindow(now)) return 'maintenance';
    var dates = getCadenceDates(year, month);
    for (var i = 0; i < dates.length; i++) {
      if (dates[i].date.getDate() === now.getDate() &&
          dates[i].date.getMonth() === now.getMonth()) {
        return dates[i].day;
      }
    }
    return 'off';
  }

  function getDayFocus(date) {
    var d = date || new Date();
    var year = d.getFullYear();
    var month = d.getMonth();
    if (isMaintenanceWindow(d)) return 'maintenance';
    var dates = getCadenceDates(year, month);
    for (var i = 0; i < dates.length; i++) {
      if (dates[i].date.getDate() === d.getDate() &&
          dates[i].date.getMonth() === d.getMonth()) {
        return dates[i].focus;
      }
    }
    return null;
  }

  function getNextMaintenanceWindow() {
    var now = new Date();
    for (var i = 0; i < 3; i++) {
      var m = (now.getMonth() + i) % 12;
      var y = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
      var mw = getMaintenanceWindow(y, m);
      if (mw && mw.end >= now) return mw;
    }
    return null;
  }

  function getCadenceProgress() {
    var boostsUsed = 12 - parseInt(localStorage.getItem('foromane_boosts_remaining') || '12', 10);
    return { used: boostsUsed, total: 12, remaining: 12 - boostsUsed, percent: Math.round(boostsUsed / 12 * 100) };
  }

  var DAY_CATEGORIES = {
    monday: ['Cement & Aggregates', 'Steel & Metal Products', 'Building Materials'],
    wednesday: ['Electrical', 'Plumbing'],
    friday: ['Solar Supplies', 'Generators & Power Solutions', 'Safety & Security', 'Home Decor', 'Lighting']
  };

  function getDayCategories(day) { return DAY_CATEGORIES[day] || []; }

  function getCurrentDayCategories() { return DAY_CATEGORIES[getCurrentCadenceDay()] || []; }

  function isCadenceDate(date) {
    var d = date || new Date();
    if (isMaintenanceWindow(d)) return false;
    var dates = getCadenceDates(d.getFullYear(), d.getMonth());
    for (var i = 0; i < dates.length; i++) {
      if (dates[i].date.getDate() === d.getDate()) return true;
    }
    return false;
  }

  function getNextCadenceDay() {
    var now = new Date();
    for (var i = 0; i < 31; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      if (isCadenceDate(d)) return d;
    }
    return null;
  }

  function formatDate(date) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
  }

  function formatShortDate(date) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return date.getDate() + ' ' + months[date.getMonth()];
  }

  return {
    getFirstMonday: getFirstMonday,
    getCadenceDates: getCadenceDates,
    getMaintenanceWindow: getMaintenanceWindow,
    isMaintenanceWindow: isMaintenanceWindow,
    getCurrentCadenceDay: getCurrentCadenceDay,
    getDayFocus: getDayFocus,
    getNextMaintenanceWindow: getNextMaintenanceWindow,
    getCadenceProgress: getCadenceProgress,
    getDayCategories: getDayCategories,
    getCurrentDayCategories: getCurrentDayCategories,
    DAY_CATEGORIES: DAY_CATEGORIES,
    isCadenceDate: isCadenceDate,
    getNextCadenceDay: getNextCadenceDay,
    formatDate: formatDate,
    formatShortDate: formatShortDate
  };
})();
