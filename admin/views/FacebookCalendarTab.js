/* ═══════════════════════════════════════════════════════
   FACEBOOK CALENDAR TAB - Cadence-aligned Mon/Wed/Fri scheduling
   ═══════════════════════════════════════════════════════ */

const FacebookCalendarTab = {
  render(container) {
    const data = window.Admin.data;
    const state = window.AdminState;
    const schedule = data.getFacebookSchedule();
    const approved = data.getApprovedArtwork();

    const year = parseInt(state.fbCalendarMonth.split('-')[0]);
    const month = parseInt(state.fbCalendarMonth.split('-')[1]) - 1;
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

    var cadenceDates = [];
    var cadenceDays = { monday: [], wednesday: [], friday: [] };
    if (window.ForomaneCadence) {
      cadenceDates = window.ForomaneCadence.getCadenceDates(year, month);
      cadenceDates.forEach(function(cd) {
        if (cadenceDays[cd.day]) cadenceDays[cd.day].push(cd);
      });
    }

    var progress = window.ForomaneCadence ? window.ForomaneCadence.getCadenceProgress() : null;

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div class="section-title" style="margin:0;">${monthName} ${year}</div>
        <input type="month" value="${state.fbCalendarMonth}" 
          onchange="AdminState.setFbMonth(this.value)"
          style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;">
      </div>
      ${progress ? '<div style="font-size:12px;color:var(--grey-dark);margin-bottom:12px;">Assigned: ' + progress.used + '/12 boosts this month</div>' : ''}
      <div style="font-size:11px;color:var(--grey-mid);margin-bottom:12px;">Non-cadence days are greyed out</div>
      ${this.renderCalendar(cadenceDays, schedule)}
      <div class="section-title" style="margin-top:20px;">UNASSIGNED APPROVED (${approved.length})</div>
      ${this.renderUnassigned(approved)}
    `;
  },

  renderCalendar(cadenceDays, schedule) {
    var dayOrder = ['monday', 'wednesday', 'friday'];
    var dayLabels = { monday: 'Monday', wednesday: 'Wednesday', friday: 'Friday' };
    var dayFocus = { monday: 'Bulk Sourcing', wednesday: 'Trade Services', friday: 'DIY & Home' };

    var html = '';
    dayOrder.forEach(function(key) {
      var label = dayLabels[key];
      var focus = dayFocus[key];
      var slots = cadenceDays[key] || [];

      html += '<div class="fb-day-section">';
      html += '<div class="fb-day-header">' + label + ' <span style="font-size:11px;font-weight:400;color:var(--grey-dark);">\u2014 ' + focus + '</span></div>';

      if (slots.length === 0) {
        html += '<div style="padding:12px;color:var(--grey-mid);font-size:12px;text-align:center;">No ' + label + ' cadence dates this month</div>';
      } else {
        slots.forEach(function(cd) {
          var dateStr = cd.date.toISOString().split('T')[0];
          var isCurrentMonth = cd.date.getMonth() === new Date().getMonth();
          var scheduled = schedule.filter(function(s) { return s.date === dateStr; });
          html += '<div class="fb-slot-row' + (isCurrentMonth ? '' : ' fb-slot-off-month') + '">';
          html += '<span class="fb-slot-date">' + cd.date.getDate() + '</span>';
          html += '<span style="font-size:10px;color:var(--grey-mid);width:60px;">' + cd.focus.toUpperCase() + '</span>';
          html += '<div class="fb-slot-posts">';
          if (scheduled.length > 0) {
            scheduled.forEach(function(p) {
              html += '<div class="fb-post-chip" title="' + (p.title || p.businessName || '') + '">' + (p.title ? p.title.substring(0, 20) : (p.businessName || 'Post')) + '</div>';
            });
          } else {
            html += '<span class="fb-slot-empty">Empty</span>';
          }
          html += '</div></div>';
        });
      }

      html += '</div>';
    });
    return html;
  },

  renderUnassigned(approved) {
    if (!approved || approved.length === 0) {
      return '<div style="text-align:center;padding:20px;color:var(--grey-dark);">No approved artwork waiting</div>';
    }

    return approved.map(function(a, idx) {
      var scheduleStr = a.scheduledDate ? (a.scheduledDay || '') + ' ' + a.scheduledDate : (a.boostDay || '');
      var metaStr = scheduleStr + (a.title ? ' \u00b7 ' + a.title : '') + (a.category ? ' \u00b7 ' + a.category : '');
      var safeBizName = (a.businessName || 'Unknown').replace(/'/g, "\\'");
      var safeTitle = (a.title || '').replace(/'/g, "\\'");
      return '<div class="unassigned-row">' +
        '<div class="unassigned-info">' +
        '<div class="unassigned-biz">' + (a.businessName || 'Unknown') + '</div>' +
        '<div class="unassigned-meta">' + metaStr + '</div>' +
        '</div>' +
        '<div class="unassigned-actions">' +
        '<select id="assign-select-' + idx + '" style="padding:4px 8px;border:1px solid var(--border);border-radius:4px;font-size:11px;">' +
        '<option value="">Assign to...</option>' +
        '<option value="Monday">Monday</option>' +
        '<option value="Wednesday">Wednesday</option>' +
        '<option value="Friday">Friday</option>' +
        '</select>' +
        '<button class="btn-sm" style="background:var(--orange);color:#fff;border:none;margin-left:4px;"' +
        ' onclick="Admin.assignArtwork(\'' + (a.submissionId || a.id) + '\', \'' + a.id + '\', \'' + safeBizName + '\', \'' + safeTitle + '\', ' + idx + ')">Assign</button>' +
        '</div>' +
        '</div>';
    }).join('');
  }
};

window.FacebookCalendarTab = FacebookCalendarTab;
