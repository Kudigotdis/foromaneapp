/* ═══════════════════════════════════════════════════════
   ADMIN STATE - State management for Super Admin
   ═══════════════════════════════════════════════════════ */

const AdminState = {
  activeSection: null,
  clientListSub: 'users',
  approvalFilter: 'all',
  moderationFilter: 'all',
  searchQuery: '',
  alphaFilter: '',
  analyticsRange: 'this_month',
  analyticsBizId: null,
  expandedMonth: null,
  fbCalendarMonth: new Date().toISOString().slice(0, 7),

  toggleSection(section) {
    this.activeSection = this.activeSection === section ? null : section;
    this.render();
  },

  setClientSub(sub) {
    this.clientListSub = sub;
    var contentEl = document.querySelector('.super-accordion.open .super-accordion-content');
    if (contentEl && window.ClientListTab) {
      window.ClientListTab.render(contentEl);
    }
  },

  setApprovalFilter(filter) {
    this.approvalFilter = filter;
    this.render();
  },

  setModerationFilter(filter) {
    this.moderationFilter = filter;
    this.render();
  },

  setSearch(query) {
    this.searchQuery = query;
  },

  setAlphaFilter(letter) {
    this.alphaFilter = this.alphaFilter === letter ? '' : letter;
    this.render();
  },

  setAnalyticsRange(range) {
    this.analyticsRange = range;
    this.render();
  },

  setAnalyticsBiz(bizId) {
    this.analyticsBizId = bizId;
    this.render();
  },

  setFbMonth(month) {
    this.fbCalendarMonth = month;
    this.render();
  },

  toggleMonthDrilldown(month) {
    this.expandedMonth = this.expandedMonth === month ? null : month;
    this.render();
  },

  render() {
    window.Admin.render();
  }
};

window.toggleMonthDrilldown = function(month) {
  AdminState.toggleMonthDrilldown(month);
};

window.AdminState = AdminState;