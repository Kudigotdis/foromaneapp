/* ════════════════════════════════════════════════════════
   FOROMANE ANALYTICS - Business owner KPI dashboard
   ════════════════════════════════════════════════════════ */

function _canViewAnalytics() {
  var role = UserState.businessRole;
  var sub = UserState.business && UserState.business.subscription;
  if (role === 'owner' && (sub === 'catalogue' || sub === 'full')) return true;
  if (window.Auth && window.Auth.isAdmin && window.Auth.isAdmin()) return true;
  return false;
}

function _getOwnerPromos() {
  return (window._promos || []).filter(function(p) {
    return p.businessId === (UserState.business && UserState.business.id) || p.businessName === (UserState.business && UserState.business.name);
  });
}

function _getPromosInRange(promos, range) {
  var now = new Date();
  var start;
  if (range === 'this-month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === 'last-month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    now = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (range === '3-months') {
    start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  } else {
    return promos;
  }
  return promos.filter(function(p) {
    var d = new Date(p.promo ? p.promo.submittedAt || p.createdAt : p.createdAt);
    return d >= start && d <= now;
  });
}

function _getCatalogueItems() {
  var items = window._userItems || [];
  var biz = UserState.business;
  if (biz) {
    var demo = (window.DEMO_CATALOGUE_ITEMS || []).filter(function(it) {
      return it.businessName === biz.name;
    });
    items = items.concat(demo);
  }
  return items;
}

function renderBudgetSummary() {
  var el = document.getElementById('budget-summary');
  if (!el) return;
  if (!_canViewAnalytics()) { el.style.display = 'none'; return; }
  el.style.display = 'block';

  var promos = _getOwnerPromos();
  var now = new Date();
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  var monthPromos = promos.filter(function(p) {
    var d = new Date(p.promo ? p.promo.submittedAt || p.createdAt : p.createdAt);
    return d >= monthStart;
  });
  var spentThisMonth = monthPromos.reduce(function(s, p) {
    return s + (p.promo ? p.promo.cost || 0 : 0);
  }, 0);
  var used = UserState.promosThisWeek || 0;
  var maxPromos = 12;

  el.innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">' +
      '<div class="kpi-card" style="border:1px solid var(--orange);background:var(--orange-light);">' +
        '<div class="kpi-value" style="color:var(--orange);">P' + spentThisMonth.toFixed(2) + '</div>' +
        '<div class="kpi-label">Spent this month</div>' +
      '</div>' +
      '<div class="kpi-card" style="border:1px solid var(--orange);background:var(--orange-light);">' +
        '<div class="kpi-value" style="color:var(--orange);">' + used + '/' + maxPromos + '</div>' +
        '<div class="kpi-label">Promo credits used</div>' +
      '</div>' +
    '</div>' +
    '<div style="background:var(--orange);color:#fff;border-radius:8px;font-size:13px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="goTo(\'view-analytics\');renderAnalytics(\'this-month\')">' +
      '<span>View full analytics</span>' +
      '<span style="font-size:16px;">\u2192</span>' +
    '</div>';
}

function renderAnalytics(range) {
  range = range || 'this-month';
  var view = document.getElementById('view-analytics');
  if (!view) return;

  var promos = _getOwnerPromos();
  var ranged = _getPromosInRange(promos, range);
  var now = new Date();
  var catItems = _getCatalogueItems();

  // Spending
  var totalSpent = ranged.reduce(function(s, p) { return s + (p.promo ? p.promo.cost || 0 : 0); }, 0);
  var yearStart = new Date(now.getFullYear(), 0, 1);
  var yearPromos = promos.filter(function(p) {
    var d = new Date(p.promo ? p.promo.submittedAt || p.createdAt : p.createdAt);
    return d >= yearStart;
  });
  var spentThisYear = yearPromos.reduce(function(s, p) { return s + (p.promo ? p.promo.cost || 0 : 0); }, 0);
  var used = UserState.promosThisWeek || 0;
  var maxPromos = 12;
  var fbUsed = 12 - parseInt(localStorage.getItem('foromane_boosts_remaining') || '12', 10);
  var fbMax = 12;
  var monthsActive = 0;
  var activeMonths = {};
  promos.forEach(function(p) {
    var d = new Date(p.promo ? p.promo.submittedAt || p.createdAt : p.createdAt);
    var key = d.getFullYear() + '-' + d.getMonth();
    if (!activeMonths[key]) { activeMonths[key] = true; monthsActive++; }
  });

  // Catalogue
  var catViews = 0;
  var catItemViews = [];
  catItems.forEach(function(it) {
    var v = (it.kpi && it.kpi.views) || 0;
    catViews += v;
    catItemViews.push({ title: it.title, category: it.category || 'General', views: v });
  });
  catItemViews.sort(function(a, b) { return b.views - a.views; });
  var zeroViewItems = catItemViews.filter(function(it) { return it.views === 0; });

  // Promos performance
  var totalViews = ranged.reduce(function(s, p) { return s + ((p.kpi && p.kpi.views) || 0); }, 0);
  var totalInteractions = ranged.reduce(function(s, p) { return s + ((p.kpi && p.kpi.interactions) || 0); }, 0);
  var tapRate = totalViews > 0 ? ((totalInteractions / totalViews) * 100).toFixed(1) : '0.0';
  var activeCount = ranged.filter(function(p) { return p.promo && p.promo.status === 'active'; }).length;
  var pendingCount = ranged.filter(function(p) { return p.promo && p.promo.status === 'pending'; }).length;

  // Facebook
  var subs = JSON.parse(localStorage.getItem('foromane_artwork_submissions') || '[]');
  var bizName = UserState.business && UserState.business.name;
  var fbItems = [];
  subs.filter(function(s) { return s.businessName === bizName; }).forEach(function(s) {
    if (s.items) {
      s.items.forEach(function(item) {
        fbItems.push(item);
      });
    } else {
      fbItems.push({ id: s.id, scheduledDay: s.boostDay, status: s.status, createdAt: s.createdAt });
    }
  });
  var fbThisMonth = fbItems.filter(function(it) {
    var d = new Date(it.createdAt || Date.now());
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  var dayCounts = {};
  fbItems.forEach(function(it) { dayCounts[it.scheduledDay] = (dayCounts[it.scheduledDay] || 0) + 1; });
  var bestDay = Object.keys(dayCounts).sort(function(a, b) { return (dayCounts[b] || 0) - (dayCounts[a] || 0); })[0] || '—';

  // Monthly history
  var monthMap = {};
  promos.forEach(function(p) {
    var d = new Date(p.promo ? p.promo.submittedAt || p.createdAt : p.createdAt);
    var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (!monthMap[key]) monthMap[key] = { year: d.getFullYear(), month: d.getMonth(), promos: [], spent: 0, views: 0 };
    monthMap[key].promos.push(p);
    monthMap[key].spent += (p.promo ? p.promo.cost || 0 : 0);
    monthMap[key].views += (p.kpi && p.kpi.views) || 0;
  });
  var monthKeys = Object.keys(monthMap).sort().reverse();

  var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Impressions: top 8 promos as bars
  var topPromos = ranged.slice().sort(function(a, b) {
    return ((b.kpi && b.kpi.views) || 0) - ((a.kpi && a.kpi.views) || 0);
  }).slice(0, 8);
  var maxViews = topPromos.length > 0 ? Math.max.apply(null, topPromos.map(function(p) { return (p.kpi && p.kpi.views) || 0; })) : 1;

  function barHtml() {
    if (topPromos.length === 0) return '<div style="font-size:12px;color:var(--grey-dark);padding:10px 0;">No promo data yet.</div>';
    var html = '<div style="display:flex;align-items:flex-end;gap:4px;min-height:90px;padding:10px 0;">';
    topPromos.forEach(function(p, i) {
      var v = (p.kpi && p.kpi.views) || 0;
      var h = Math.max(8, (v / maxViews) * 80);
      var opacity = 0.5 + (i / topPromos.length) * 0.4;
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer" onclick="showToast(\'' + (p.title || '').replace(/'/g,"\\'") + ': ' + v + ' views\')">' +
        '<div style="width:100%;height:' + h + 'px;background:var(--orange);border-radius:3px 3px 0 0;opacity:' + opacity + ';"></div>' +
        '<span style="font-size:9px;color:var(--grey-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">' + (p.title || '').substring(0, 12) + '</span>' +
      '</div>';
    });
    html += '</div>';
    return html;
  }

  function historyHtml() {
    if (monthKeys.length === 0) return '<div style="font-size:12px;color:var(--grey-dark);padding:10px 0;">No history yet.</div>';
    return monthKeys.map(function(key) {
      var m = monthMap[key];
      var label = monthNames[m.month] + ' ' + m.year;
      var isCurrent = m.month === now.getMonth() && m.year === now.getFullYear();
      var dotColor = isCurrent ? 'var(--orange)' : '#D3D1C7';
      return '<div class="analytics-month-btn" onclick="goTo(\'view-analytics-month\');renderAnalyticsMonth(\'' + key + '\',\'spending\')">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:' + dotColor + ';"></div>' +
          '<div>' +
            '<div style="font-size:13px;">' + label + '</div>' +
            '<div style="font-size:11px;color:var(--grey-dark);">P' + m.spent.toFixed(2) + ' &middot; ' + m.views + ' impressions</div>' +
          '</div>' +
        '</div>' +
        '<span style="font-size:14px;color:var(--grey-mid);">\u203A</span>' +
      '</div>';
    }).join('');
  }

  // Pill label for selected range
  var rangeLabels = { 'this-month': 'This month', 'last-month': 'Last month', '3-months': '3 months', 'all': 'All time' };
  var ranges = ['this-month', 'last-month', '3-months', 'all'];

  view.innerHTML =
    '<div class="analytics-bar">' +
      '<div class="analytics-bar-back" onclick="goBack()"><img src="assets/icons/solid/chevron-left_white.webp" style="width:18px;height:18px;"></div>' +
      '<div class="analytics-bar-title">Analytics</div>' +
    '</div>' +
    '<div style="padding:0 14px;overflow-y:auto;flex:1;">' +
      // Time range pills
      '<div class="analytics-pill-row">' +
        ranges.map(function(r) {
          return '<div class="analytics-pill' + (r === range ? ' active' : '') + '" onclick="renderAnalytics(\'' + r + '\')">' + rangeLabels[r] + '</div>';
        }).join('') +
      '</div>' +
      // Spending overview
      '<div class="analytics-section-head">SPENDING OVERVIEW</div>' +
      '<div class="analytics-stat-row">' +
        '<div class="analytics-stat-card"><div class="analytics-stat-num" style="color:var(--orange);">P' + totalSpent.toFixed(2) + '</div><div class="analytics-stat-label">Total spent</div><div class="analytics-stat-delta">P' + spentThisYear.toFixed(2) + ' this year</div></div>' +
        '<div class="analytics-stat-card"><div class="analytics-stat-num">P' + spentThisYear.toFixed(2) + '</div><div class="analytics-stat-label">Spent this year</div><div class="analytics-stat-delta">' + monthsActive + ' months active</div></div>' +
      '</div>' +
      '<div class="analytics-progress-row"><div class="analytics-progress-label"><span>Promo credits</span><span>' + used + ' of ' + maxPromos + ' used</span></div><div class="analytics-prog-track"><div class="analytics-prog-fill" style="width:' + ((used / maxPromos) * 100) + '%;background:var(--orange);"></div></div></div>' +
      '<div class="analytics-progress-row" style="padding-top:0"><div class="analytics-progress-label"><span>Facebook slots</span><span>' + fbUsed + ' of ' + fbMax + ' used</span></div><div class="analytics-prog-track"><div class="analytics-prog-fill" style="width:' + ((fbUsed / fbMax) * 100) + '%;background:#378ADD;"></div></div></div>' +
      // Catalogue performance
      '<div class="analytics-section-divider"></div>' +
      '<div class="analytics-section-head">CATALOGUE PERFORMANCE</div>' +
      '<div class="analytics-stat-row">' +
        '<div class="analytics-stat-card"><div class="analytics-stat-num">' + catViews + '</div><div class="analytics-stat-label">Catalogue views</div></div>' +
        '<div class="analytics-stat-card"><div class="analytics-stat-num">' + catItems.length + '</div><div class="analytics-stat-label">Items listed</div><div class="analytics-stat-delta">' + zeroViewItems.length + ' with zero views</div></div>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--text-sub);margin-bottom:4px;">Top viewed items</div>' +
      (catItemViews.slice(0, 3).map(function(it, i) {
        var nums = ['1','2','3'];
        var colors = ['background:#FAECE7;color:#993C1D', 'background:#EAF3DE;color:#27500A', 'background:#E8F0FE;color:#1A5BBF'];
        return '<div class="analytics-list-row">' +
          '<div style="display:flex;align-items:center;gap:10px">' +
            '<div class="analytics-row-icon" style="' + colors[i] + '">' + nums[i] + '</div>' +
            '<div><div style="font-size:13px;">' + it.title + '</div><div class="analytics-list-row-sub">' + it.category + '</div></div>' +
          '</div>' +
          '<div class="analytics-list-row-right" style="color:var(--orange);">' + it.views + '</div>' +
        '</div>';
      }).join('') || '<div style="font-size:12px;color:var(--grey-dark);padding:8px 0;">No catalogue items yet.</div>') +
      // Promo performance
      '<div class="analytics-section-divider"></div>' +
      '<div class="analytics-section-head">PROMO PERFORMANCE</div>' +
      '<div style="font-size:11px;color:var(--grey-dark);margin-bottom:4px;">Impressions by promo</div>' +
      barHtml() +
      '<div class="analytics-stat-row">' +
        '<div class="analytics-stat-card"><div class="analytics-stat-num">' + totalViews + '</div><div class="analytics-stat-label">Total impressions</div></div>' +
        '<div class="analytics-stat-card"><div class="analytics-stat-num">' + tapRate + '%</div><div class="analytics-stat-label">Avg tap-through</div></div>' +
      '</div>' +
      '<div class="analytics-list-row"><div><div>Promos live now</div><div class="analytics-list-row-sub">' + activeCount + ' active &middot; ' + pendingCount + ' pending</div></div><div><span class="analytics-badge" style="background:#EAF3DE;color:#27500A;">' + activeCount + ' live</span></div></div>' +
      // Facebook promos
      '<div class="analytics-section-divider"></div>' +
      '<div class="analytics-section-head">FACEBOOK PROMOS</div>' +
      '<div class="analytics-stat-row">' +
        '<div class="analytics-stat-card"><div class="analytics-stat-num">' + fbThisMonth.length + '</div><div class="analytics-stat-label">Posts this month</div></div>' +
        '<div class="analytics-stat-card"><div class="analytics-stat-num">' + bestDay + '</div><div class="analytics-stat-label">Best day (reach)</div></div>' +
      '</div>' +
      '<div class="analytics-list-row"><div><div>Estimated reach this month</div><div class="analytics-list-row-sub">From all categories</div></div><div class="analytics-list-row-right" style="color:#378ADD;">~' + (totalViews * 3) + '</div></div>' +
      // Cadence performance
      '<div class="analytics-section-divider"></div>' +
      '<div class="analytics-section-head">CADENCE PERFORMANCE</div>' +
      (function() {
        if (!window.ForomaneCadence || ranged.length === 0) return '<div style="font-size:12px;color:var(--grey-dark);padding:8px 0;">No cadence data yet.</div>';
        var dayStats = { monday: { views: 0, likes: 0, count: 0 }, wednesday: { views: 0, likes: 0, count: 0 }, friday: { views: 0, likes: 0, count: 0 } };
        ranged.forEach(function(p) {
          var d = new Date(p.promo ? p.promo.submittedAt || p.createdAt : p.createdAt);
          var fd = window.ForomaneCadence.getDayFocus(d);
          if (!fd || fd === 'maintenance') return;
          var key = fd === 'bulk' ? 'monday' : fd === 'trades' ? 'wednesday' : fd === 'diy' ? 'friday' : null;
          if (!key) return;
          dayStats[key].views += (p.kpi && p.kpi.views) || 0;
          dayStats[key].likes += (p.kpi && p.kpi.likes) || 0;
          dayStats[key].count++;
        });
        var bestDay = '—', bestViews = 0;
        ['monday', 'wednesday', 'friday'].forEach(function(k) {
          var avg = dayStats[k].count > 0 ? dayStats[k].views / dayStats[k].count : 0;
          if (avg > bestViews) { bestViews = avg; bestDay = k.charAt(0).toUpperCase() + k.slice(1); }
        });
        var labels = { monday: 'Monday (Bulk)', wednesday: 'Wednesday (Trades)', friday: 'Friday (DIY)' };
        var totalBoostsUsed = 12 - parseInt(localStorage.getItem('foromane_boosts_remaining') || '12', 10);
        return '<div class="analytics-stat-row">' +
          '<div class="analytics-stat-card"><div class="analytics-stat-num">' + bestDay + '</div><div class="analytics-stat-label">Best-performing day</div></div>' +
          '<div class="analytics-stat-card"><div class="analytics-stat-num">' + totalBoostsUsed + '/12</div><div class="analytics-stat-label">Cadence completion</div></div>' +
        '</div>' +
        ['monday', 'wednesday', 'friday'].map(function(k) {
          var s = dayStats[k];
          var avgViews = s.count > 0 ? Math.round(s.views / s.count) : 0;
          var avgLikes = s.count > 0 ? Math.round(s.likes / s.count) : 0;
          return '<div class="analytics-list-row"><div><div>' + labels[k] + '</div><div class="analytics-list-row-sub">' + s.count + ' promos</div></div><div style="text-align:right"><div class="analytics-list-row-right" style="color:var(--orange);">' + avgViews + ' avg views</div><div style="font-size:11px;color:var(--grey-dark);">' + avgLikes + ' avg likes</div></div></div>';
        }).join('');
      })() +
      // Directory & Sharing
      '<div class="analytics-section-divider"></div>' +
      '<div class="analytics-section-head">DIRECTORY &amp; SHARING</div>' +
      '<div class="analytics-stat-row">' +
        '<div class="analytics-stat-card"><div class="analytics-stat-num">' + (UserState.kpi.views || 0) + '</div><div class="analytics-stat-label">Profile views</div></div>' +
        '<div class="analytics-stat-card"><div class="analytics-stat-num">' + (UserState.kpi.likes || 0) + '</div><div class="analytics-stat-label">Contact taps</div></div>' +
      '</div>' +
      '<div class="analytics-stat-row" style="padding-top:0">' +
        '<div class="analytics-stat-card"><div class="analytics-stat-num">' + (UserState.kpi.noteAdds || 0) + '</div><div class="analytics-stat-label">Added to notes</div></div>' +
        '<div class="analytics-stat-card"><div class="analytics-stat-num">' + (UserState.kpi.interactions || 0) + '</div><div class="analytics-stat-label">WhatsApp shares</div></div>' +
      '</div>' +
      // Monthly history
      '<div class="analytics-section-divider"></div>' +
      '<div class="analytics-section-head">MONTHLY HISTORY</div>' +
      '<div class="analytics-annotation">Tap a month to see week-by-week breakdown</div>' +
      historyHtml() +
    '</div>';

  view.style.display = '';
}

function renderAnalyticsMonth(yearMonth, activeTab) {
  activeTab = activeTab || 'spending';
  var view = document.getElementById('view-analytics-month');
  if (!view) return;

  var parts = yearMonth.split('-');
  var year = parseInt(parts[0], 10);
  var month = parseInt(parts[1], 10) - 1;
  var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var label = monthNames[month] + ' ' + year;

  var promos = _getOwnerPromos();
  var monthStart = new Date(year, month, 1);
  var monthEnd = new Date(year, month + 1, 0);
  var monthPromos = promos.filter(function(p) {
    var d = new Date(p.promo ? p.promo.submittedAt || p.createdAt : p.createdAt);
    return d >= monthStart && d <= monthEnd;
  });

  var totalSpent = monthPromos.reduce(function(s, p) { return s + (p.promo ? p.promo.cost || 0 : 0); }, 0);
  var used = UserState.promosThisWeek || 0;
  var maxPromos = 12;
  var fbUsed = 12 - parseInt(localStorage.getItem('foromane_boosts_remaining') || '12', 10);
  var fbMax = 12;

  // Week-by-week breakdown
  function getWeeks() {
    var weeks = [];
    var cursor = new Date(monthStart);
    while (cursor <= monthEnd) {
      var weekStart = new Date(cursor);
      var weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > monthEnd) weekEnd = new Date(monthEnd);
      // Days in week
      var days = [];
      var d = new Date(weekStart);
      while (d <= weekEnd) {
        var dayPromos = monthPromos.filter(function(p) {
          var pd = new Date(p.promo ? p.promo.submittedAt || p.createdAt : p.createdAt);
          return pd.toDateString() === d.toDateString();
        });
        days.push({ date: new Date(d), promos: dayPromos });
        d.setDate(d.getDate() + 1);
      }
      weeks.push({ start: new Date(weekStart), end: new Date(weekEnd), days: days });
      cursor.setDate(cursor.getDate() + 7);
    }
    return weeks;
  }

  var weeks = getWeeks();
  var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function weekHtml() {
    return weeks.map(function(w) {
      var wLabel = 'Week of ' + w.start.getDate() + ' ' + monthNames[w.start.getMonth()];
      var wSpent = 0;
      w.days.forEach(function(d) { d.promos.forEach(function(p) { wSpent += p.promo ? p.promo.cost || 0 : 0; }); });
      return '<div style="margin-bottom:12px;">' +
        '<div style="font-size:13px;font-weight:600;color:var(--orange);margin-bottom:6px;">' + wLabel + '</div>' +
        w.days.map(function(d) {
          var isFuture = d.date > new Date();
          var dayStr = dayNames[d.date.getDay()] + ' ' + d.date.getDate();
          var daySpent = d.promos.reduce(function(s, p) { return s + (p.promo ? p.promo.cost || 0 : 0); }, 0);
          var dayViews = d.promos.reduce(function(s, p) { return s + ((p.kpi && p.kpi.views) || 0); }, 0);
          return '<div class="analytics-list-row" style="opacity:' + (isFuture ? 0.4 : 1) + ';">' +
            '<div>' +
              '<div style="font-size:13px;">' + dayStr + '</div>' +
              (daySpent > 0 ? '<div class="analytics-list-row-sub">P' + daySpent.toFixed(2) + ' &middot; ' + dayViews + ' views</div>' : '<div class="analytics-list-row-sub">No activity</div>') +
            '</div>' +
            (daySpent > 0 ? '<div class="analytics-list-row-right" style="color:var(--orange);">P' + daySpent.toFixed(2) + '</div>' : '') +
          '</div>';
        }).join('') +
        '<div style="font-size:11px;color:var(--grey-dark);text-align:right;padding:4px 0;">Week total: P' + wSpent.toFixed(2) + '</div>' +
      '</div>';
    }).join('');
  }

  // Catalogue items for this month
  var catItems = _getCatalogueItems();
  var catWithViews = catItems.map(function(it) {
    var views = (it.kpi && it.kpi.views) || 0;
    return { title: it.title, category: it.category || 'General', views: views };
  }).sort(function(a, b) { return b.views - a.views; });

  var tabs = [
    { id: 'spending', label: 'Spending' },
    { id: 'catalogue', label: 'Catalogue' },
    { id: 'promos', label: 'Promos' },
    { id: 'facebook', label: 'Facebook' }
  ];

  function tabContent() {
    if (activeTab === 'spending') {
      var html = '<div class="analytics-section-head">WHAT YOU PAID FOR</div>';
      if (monthPromos.length === 0) {
        html += '<div style="font-size:12px;color:var(--grey-dark);padding:10px 14px;">No spending this month.</div>';
      } else {
        monthPromos.forEach(function(p) {
          var d = new Date(p.promo ? p.promo.submittedAt || p.createdAt : p.createdAt);
          html += '<div class="analytics-list-row"><div><div>' + (p.title || 'Promo') + '</div><div class="analytics-list-row-sub">' + d.toLocaleDateString() + '</div></div><div class="analytics-list-row-right">P' + ((p.promo ? p.promo.cost || 0 : 0)).toFixed(2) + '</div></div>';
        });
      }
      html += '<div class="analytics-list-row" style="background:var(--orange-light);font-weight:600;"><div>Total</div><div class="analytics-list-row-right" style="color:var(--orange);font-weight:600;">P' + totalSpent.toFixed(2) + '</div></div>' +
        '<div class="analytics-section-divider"></div>' +
        '<div class="analytics-section-head">CREDITS USED THIS MONTH</div>' +
        '<div class="analytics-progress-row"><div class="analytics-progress-label"><span>App promo credits</span><span>' + used + ' / ' + maxPromos + ' used</span></div><div class="analytics-prog-track"><div class="analytics-prog-fill" style="width:' + ((used / maxPromos) * 100) + '%;background:var(--orange);"></div></div></div>' +
        '<div class="analytics-progress-row" style="padding-top:0"><div class="analytics-progress-label"><span>Facebook slots</span><span>' + fbUsed + ' / ' + fbMax + ' used</span></div><div class="analytics-prog-track"><div class="analytics-prog-fill" style="width:' + ((fbUsed / fbMax) * 100) + '%;background:#378ADD;"></div></div></div>';
      return html;
    }
    if (activeTab === 'promos') {
      if (monthPromos.length === 0) return '<div style="font-size:12px;color:var(--grey-dark);padding:14px;">No promos this month.</div>';
      return '<div class="analytics-section-head">PROMO RESULTS THIS MONTH</div>' +
        monthPromos.map(function(p) {
          var v = (p.kpi && p.kpi.views) || 0;
          var i = (p.kpi && p.kpi.interactions) || 0;
          var tr = v > 0 ? ((i / v) * 100).toFixed(1) + '%' : '—';
          var status = p.promo ? p.promo.status : 'unknown';
          var isPending = status === 'pending';
          return '<div class="analytics-list-row">' +
            '<div style="display:flex;align-items:center;gap:10px">' +
              '<div class="analytics-row-icon" style="background:#FAECE7;color:#993C1D;"><i class="fas fa-eye" style="font-size:11px;"></i></div>' +
              '<div>' + (p.title || 'Untitled') + '</div>' +
            '</div>' +
            (isPending ? '<div style="text-align:right"><div style="font-size:12px;color:var(--grey-dark);">Pending</div><div style="font-size:11px;color:var(--grey-dark);">Awaiting approval</div></div>' : '<div style="text-align:right"><div style="font-size:13px;color:var(--orange);">' + v + ' views</div><div style="font-size:11px;color:var(--grey-dark);">' + tr + ' tap-through</div></div>') +
          '</div>';
        }).join('');
    }
    if (activeTab === 'catalogue') {
      if (catWithViews.length === 0) return '<div style="font-size:12px;color:var(--grey-dark);padding:14px;">No catalogue items.</div>';
      return '<div class="analytics-section-head">CATALOGUE ITEM BREAKDOWN</div>' +
        catWithViews.map(function(it) {
          var isZero = it.views === 0;
          return '<div class="analytics-list-row" style="' + (isZero ? 'color:var(--grey-dark);' : '') + '">' +
            '<div style="font-size:13px;' + (isZero ? 'color:#c0392b;' : '') + '">' + it.title + '</div>' +
            '<div class="analytics-list-row-right" style="' + (isZero ? 'color:var(--grey-dark);' : 'color:var(--orange);') + '">' + it.views + '</div>' +
          '</div>';
        }).join('') +
        (catWithViews.filter(function(it) { return it.views === 0; }).length > 0 ? '<div class="analytics-annotation">Items with 0 views may need a better image or description.</div>' : '');
    }
    if (activeTab === 'facebook') {
      var _allSubs = JSON.parse(localStorage.getItem('foromane_artwork_submissions') || '[]');
      var _bizName = UserState.business && UserState.business.name;
      var _allItems = [];
      _allSubs.filter(function(s) { return s.businessName === _bizName; }).forEach(function(s) {
        if (s.items) { s.items.forEach(function(it) { _allItems.push(it); }); }
        else { _allItems.push({ id: s.id, scheduledDay: s.boostDay, status: s.status, createdAt: s.createdAt }); }
      });
      var fbMonthSubs = _allItems.filter(function(it) {
        var d = new Date(it.createdAt || Date.now());
        return d.getMonth() === month && d.getFullYear() === year;
      });
      var approved = fbMonthSubs.filter(function(it) { return it.status === 'approved'; });
      var pending = fbMonthSubs.filter(function(it) { return it.status === 'pending'; });
      var rejected = fbMonthSubs.filter(function(it) { return it.status === 'rejected'; });
      var dayCount = {};
      fbMonthSubs.forEach(function(it) { dayCount[it.scheduledDay] = (dayCount[it.scheduledDay] || 0) + 1; });
      var best = Object.keys(dayCount).sort(function(a, b) { return (dayCount[b] || 0) - (dayCount[a] || 0); })[0] || '—';
      return '<div class="analytics-section-head">FACEBOOK POSTS</div>' +
        '<div class="analytics-stat-row">' +
          '<div class="analytics-stat-card"><div class="analytics-stat-num">' + fbMonthSubs.length + '</div><div class="analytics-stat-label">Total posts</div></div>' +
          '<div class="analytics-stat-card"><div class="analytics-stat-num">' + best + '</div><div class="analytics-stat-label">Best day</div></div>' +
        '</div>' +
        '<div class="analytics-stat-row" style="padding-top:0">' +
          '<div class="analytics-stat-card"><div class="analytics-stat-num" style="color:#2e7d32;">' + approved.length + '</div><div class="analytics-stat-label">Approved</div></div>' +
          '<div class="analytics-stat-card"><div class="analytics-stat-num" style="color:#ffa000;">' + pending.length + '</div><div class="analytics-stat-label">Pending</div></div>' +
        '</div>' +
        (fbMonthSubs.length > 0 ? '<div class="analytics-section-divider"></div><div class="analytics-section-head">SUBMISSIONS</div>' +
          fbMonthSubs.map(function(s) {
            var statusColor = s.status === 'approved' ? '#2e7d32' : s.status === 'rejected' ? '#f44336' : '#ffa000';
            return '<div class="analytics-list-row"><div><div>' + (s.category || 'Uncategorized') + ' &middot; ' + s.boostDay + '</div><div class="analytics-list-row-sub">' + s.imageCount + ' images</div></div><span style="color:' + statusColor + ';font-size:11px;font-weight:600;text-transform:uppercase;">' + s.status + '</span></div>';
          }).join('') : '') +
        '<div class="analytics-annotation">Estimated reach this month: ~' + ((totalViews || 1) * 3) + '</div>';
    }
    return '';
  }

  view.innerHTML =
    '<div class="analytics-bar">' +
      '<div class="analytics-bar-back" onclick="goBack()"><img src="assets/icons/solid/chevron-left_white.webp" style="width:18px;height:18px;"></div>' +
      '<div class="analytics-bar-title">' + label + '</div>' +
    '</div>' +
    '<div style="flex:1;overflow-y:auto;">' +
      // Week-by-week breakdown
      '<div style="padding:10px 14px;">' +
        weekHtml() +
      '</div>' +
      // Tabs
      '<div class="analytics-tabs">' +
        tabs.map(function(t) {
          return '<div class="analytics-tab' + (t.id === activeTab ? ' on' : '') + '" onclick="renderAnalyticsMonth(\'' + yearMonth + '\',\'' + t.id + '\')">' + t.label + '</div>';
        }).join('') +
      '</div>' +
      '<div style="padding:10px 14px;">' +
        tabContent() +
      '</div>' +
    '</div>';

  view.style.display = '';
}

window.renderBudgetSummary = renderBudgetSummary;
window.renderAnalytics = renderAnalytics;
window.renderAnalyticsMonth = renderAnalyticsMonth;
