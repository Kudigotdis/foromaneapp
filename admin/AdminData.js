/* ═══════════════════════════════════════════════════════
   ADMIN DATA LAYER - Unified data access for Super Admin
   ═══════════════════════════════════════════════════════ */

class AdminData {
  constructor() {
    this.refresh();
    var self = this;
    setTimeout(function() { self.runMaintenance(); }, 0);
  }

  refresh() {
    this.promos = window._promos || [];
    this.promoRequests = JSON.parse(localStorage.getItem('foromane_promo_requests') || '[]');
    this.paymentRequests = JSON.parse(localStorage.getItem('foromane_payment_requests') || '[]');
    this.artworkSubmissions = JSON.parse(localStorage.getItem('foromane_artwork_submissions') || '[]');
    this.businesses = window.SAMPLE_BUSINESSES || [];
    this.profiles = window.DEMO_PROFILES || [];
    this.associations = window.BUSINESS_ASSOCIATIONS || {};

    this.userMap = {};
    this.businessMap = {};
    this.userToBusiness = {};

    this.profiles.forEach(u => this.userMap[u.id] = u);
    this.businesses.forEach(b => this.businessMap[b.id] = b);
    
    for (let [userId, assoc] of Object.entries(this.associations)) {
      this.userToBusiness[userId] = assoc.businessId;
    }

    this.admins = JSON.parse(localStorage.getItem('foromane_admins') || '["admin"]');
    this.pendingBusinesses = []; // New: To be filled from Firestore
  }

  async fetchFirestoreData() {
    try {
      // Accessing Firebase from window (initialized in backend-logic.js)
      if (!window.firebase || !window.firebase.getFirestore) {
         // Fallback: If modules aren't fully exposed, we might need a direct import
         // But for now let's assume standard access to the businesses collection
         console.warn("Firestore access in AdminData pending exposure");
      }
      
      // I will implement a global fetcher in backend-logic to help AdminData
      if (window.fetchPendingOnboarding) {
        this.pendingBusinesses = await window.fetchPendingOnboarding();
      }
    } catch (e) {
      console.error("Failed to fetch Firestore data for Admin:", e);
    }
  }

  runMaintenance() {
    if (!window.ForomaneCadence) return;
    if (!window.ForomaneCadence.isMaintenanceWindow()) return;
    var logKey = 'foromane_maintenance_log';
    var now = new Date();
    var monthKey = now.getMonth() + '-' + now.getFullYear();
    var log = JSON.parse(localStorage.getItem(logKey) || '{}');
    if (log[monthKey]) return;

    var purged = 0;
    this.promos = (window._promos || []).filter(function(p) {
      if (p.promo && p.promo.expiresAt) {
        if (new Date(p.promo.expiresAt) < now) { purged++; return false; }
      }
      return true;
    });
    window._promos = this.promos;
    localStorage.setItem('foromane_promos', JSON.stringify(this.promos));

    localStorage.setItem('foromane_boosts_remaining', '12');

    var expiredPros = 0;
    (this.profiles || []).forEach(function(u) {
      if (u.role === 'Pro' || u.role === 'Professional') {
        if (u.credentialsExpireAt && new Date(u.credentialsExpireAt) < now) {
          u.role = 'General User';
          expiredPros++;
        }
      }
    });

    log[monthKey] = { ranAt: now.toISOString(), purged: purged, expiredPros: expiredPros };
    localStorage.setItem(logKey, JSON.stringify(log));
    this.refresh();
  }

  // === UNIFIED REQUESTS ===
  getUnifiedRequests(statusFilter = 'pending') {
    let requests = [
      ...this.promoRequests.map(r => ({ type: 'promo', ...r, businessId: this.resolveBizId(r.userId, r.businessName) })),
      ...this.paymentRequests.map(r => ({ type: 'payment', ...r, businessId: this.resolveBizId(r.userId) })),
      ...this.artworkSubmissions.map(r => {
        let s = r.status || 'pending';
        if (r.items) {
          s = r.items.some(i => i.status === 'pending') ? 'pending' : 'approved';
        }
        return { type: 'artwork', ...r, businessId: this.resolveBizId(r.userId, r.businessName), status: s };
      }),
      ...this.pendingBusinesses.map(r => ({ type: 'onboarding', ...r, id: r.id || r.localId, businessName: r.name }))
    ];
    
    if (statusFilter && statusFilter !== 'all') {
      requests = requests.filter(r => r.status === statusFilter);
    }
    
    return requests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  resolveBizId(userId, businessNameFallback) {
    if (this.userToBusiness[userId]) return this.userToBusiness[userId];
    if (businessNameFallback) {
      for (let bid in this.businessMap) {
        if (this.businessMap[bid].name === businessNameFallback) return bid;
      }
    }
    return null;
  }

  // === GLOBAL STATS ===
  getGlobalStats() {
    const now = new Date();
    const activePromos = this.promos.filter(p => p.promo?.status === 'active');
    const totalCost = activePromos.reduce((sum, p) => sum + (p.promo?.cost || 0), 0);
    const pending = this.getUnifiedRequests('pending');
    
    const expiringThisWeek = this.promos.filter(p => {
      if (!p.promo?.expiresAt) return false;
      const d = new Date(p.promo.expiresAt);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() + 7);
      return d >= now && d <= weekEnd;
    });

    const uniqueBusinesses = new Set(this.promos.map(p => p.businessId).filter(Boolean)).size;

    return {
      totalPromos: this.promos.length,
      activePromos: activePromos.length,
      pendingApprovals: pending.length,
      totalBudgetSpent: totalCost,
      avgCost: activePromos.length ? totalCost / activePromos.length : 0,
      businessCount: this.businesses.length,
      activeBusinessCount: uniqueBusinesses,
      expiringThisWeek: expiringThisWeek
    };
  }

  // === PAYMENT BREAKDOWN ===
  getPaymentBreakdown() {
    const breakdown = { BTC: 0, Mascom: 0, Orange: 0, Bank: 0, count: {} };
    this.paymentRequests.filter(r => r.status === 'approved').forEach(r => {
      const method = r.method || 'Bank';
      breakdown[method] = (breakdown[method] || 0) + (r.amount || 0);
      breakdown.count[method] = (breakdown.count[method] || 0) + 1;
    });
    return breakdown;
  }

  // === PER-BUSINESS STATS ===
  getBusinessStats(bizId) {
    const biz = this.businessMap[bizId];
    if (!biz) return null;

    const promos = this.promos.filter(p => p.businessId === bizId);
    const activePromos = promos.filter(p => p.promo?.status === 'active');
    const totalSpend = promos.reduce((sum, p) => sum + (p.promo?.cost || 0), 0);
    const totalViews = promos.reduce((sum, p) => sum + (p.kpi?.views || 0), 0);

    const staffUserIds = Object.entries(this.userToBusiness)
      .filter(([, bid]) => bid === bizId)
      .map(([uid]) => uid);

    const payments = this.paymentRequests.filter(r => staffUserIds.includes(r.userId));
    const artworks = this.artworkSubmissions.filter(a => {
      const abId = this.resolveBizId(a.userId, a.businessName);
      return abId === bizId;
    });

    const staff = staffUserIds.map(id => this.userMap[id]).filter(Boolean);

    return {
      biz,
      promos,
      activePromos,
      totalPromos: promos.length,
      activeCount: activePromos.length,
      totalSpend,
      totalViews,
      payments,
      artworks,
      staff
    };
  }

  // === CLIENT LISTS ===
  getUsers(filter = 'all') {
    let users = this.profiles.filter(p => p.id !== 'guest' && p.id !== 'admin');
    
    if (filter === 'owners') {
      const ownerIds = Object.entries(this.associations)
        .filter(([, a]) => a.role === 'owner')
        .map(([uid]) => uid);
      users = users.filter(u => ownerIds.includes(u.id));
    } else if (filter === 'staff') {
      const staffIds = Object.entries(this.associations)
        .filter(([, a]) => a.role === 'staff')
        .map(([uid]) => uid);
      users = users.filter(u => staffIds.includes(u.id));
    } else if (filter === 'pro') {
      users = users.filter(u => u.role === 'Pro' || u.role === 'Professional');
    }
    
    return users;
  }

  getBusinesses() {
    return this.businesses.map(biz => {
      const stats = this.getBusinessStats(biz.id);
      return {
        ...biz,
        totalSpend: stats?.totalSpend || 0,
        totalPromos: stats?.totalPromos || 0,
        activePromos: stats?.activeCount || 0
      };
    });
  }

  getPros() {
    return this.profiles.filter(p => p.role === 'Pro' || p.role === 'Professional');
  }

  // === ADMIN MANAGEMENT ===
  getAdmins() {
    return this.admins.map(id => this.userMap[id]).filter(Boolean).map(u => ({
      ...u,
      isSuperAdmin: u.id === 'admin'
    }));
  }

  addAdmin(userId) {
    if (!this.admins.includes(userId)) {
      this.admins.push(userId);
      localStorage.setItem('foromane_admins', JSON.stringify(this.admins));
      
      const profile = this.userMap[userId];
      if (profile) profile.role = 'Administrator';
    }
    this.refresh();
  }

  removeAdmin(userId) {
    if (userId === 'admin') return false;
    this.admins = this.admins.filter(id => id !== userId);
    localStorage.setItem('foromane_admins', JSON.stringify(this.admins));
    
    const profile = this.userMap[userId];
    if (profile) profile.role = 'General User';
    
    this.refresh();
    return true;
  }

  isSuperAdmin(userId = window.UserState?.id) {
    return userId === 'admin';
  }

  // === FACEBOOK SCHEDULE ===
  getFacebookSchedule() {
    return JSON.parse(localStorage.getItem('foromane_facebook_schedule') || '[]');
  }

  saveFacebookSchedule(schedule) {
    localStorage.setItem('foromane_facebook_schedule', JSON.stringify(schedule));
  }

  getApprovedArtwork() {
    const result = [];
    this.artworkSubmissions.forEach(sub => {
      if (sub.items) {
        sub.items.forEach(item => {
          if (item.status === 'approved') {
            result.push(Object.assign({}, item, {
              submissionId: sub.id,
              businessName: sub.businessName,
              category: sub.category
            }));
          }
        });
      } else if (sub.status === 'approved') {
        result.push({
          id: sub.id,
          submissionId: sub.id,
          businessName: sub.businessName,
          category: sub.category,
          boostDay: sub.boostDay,
          imageCount: sub.imageCount,
          title: sub.category || 'Artwork',
          status: 'approved'
        });
      }
    });
    return result;
  }

  // === APPROVAL ACTIONS ===
  approvePromoRequest(id) {
    const idx = this.promoRequests.findIndex(r => r.id === id);
    if (idx > -1) {
      this.promoRequests[idx].status = 'approved';
      this.promoRequests[idx].reviewedAt = Date.now();
      localStorage.setItem('foromane_promo_requests', JSON.stringify(this.promoRequests));
      this.refresh();
      return true;
    }
    return false;
  }

  rejectPromoRequest(id, reason) {
    const idx = this.promoRequests.findIndex(r => r.id === id);
    if (idx > -1) {
      this.promoRequests[idx].status = 'rejected';
      this.promoRequests[idx].reason = reason;
      this.promoRequests[idx].reviewedAt = Date.now();
      localStorage.setItem('foromane_promo_requests', JSON.stringify(this.promoRequests));
      this.refresh();
      return true;
    }
    return false;
  }

  approvePaymentRequest(id) {
    const idx = this.paymentRequests.findIndex(r => r.id === id);
    if (idx > -1) {
      this.paymentRequests[idx].status = 'approved';
      this.paymentRequests[idx].reviewedAt = Date.now();
      localStorage.setItem('foromane_payment_requests', JSON.stringify(this.paymentRequests));
      this.refresh();
      return true;
    }
    return false;
  }

  rejectPaymentRequest(id, reason) {
    const idx = this.paymentRequests.findIndex(r => r.id === id);
    if (idx > -1) {
      this.paymentRequests[idx].status = 'rejected';
      this.paymentRequests[idx].reason = reason;
      this.paymentRequests[idx].reviewedAt = Date.now();
      localStorage.setItem('foromane_payment_requests', JSON.stringify(this.paymentRequests));
      this.refresh();
      return true;
    }
    return false;
  }

  /* legacy: approve whole submission by setting status */
  approveArtwork(id) {
    const idx = this.artworkSubmissions.findIndex(r => r.id === id);
    if (idx > -1) {
      const sub = this.artworkSubmissions[idx];
      if (sub.items) {
        sub.items.forEach(item => { item.status = 'approved'; });
        this._recalcSubStatus(idx);
      } else {
        sub.status = 'approved';
      }
      sub.reviewedAt = Date.now();
      this._persistArtwork();
      return true;
    }
    return false;
  }

  /* legacy: reject whole submission */
  rejectArtwork(id, reason) {
    const idx = this.artworkSubmissions.findIndex(r => r.id === id);
    if (idx > -1) {
      const sub = this.artworkSubmissions[idx];
      if (sub.items) {
        sub.items.forEach(item => { item.status = 'rejected'; });
        this._recalcSubStatus(idx);
      } else {
        sub.status = 'rejected';
        sub.reason = reason;
      }
      sub.reviewedAt = Date.now();
      if (reason) sub.reason = reason;
      this._persistArtwork();
      return true;
    }
    return false;
  }

  /* per-item approval */
  approveArtworkItem(submissionId, itemId) {
    const sub = this.artworkSubmissions.find(s => s.id === submissionId);
    if (!sub || !sub.items) return false;
    const item = sub.items.find(i => i.id === itemId);
    if (!item) return false;
    item.status = 'approved';
    this._recalcSubStatus(this.artworkSubmissions.indexOf(sub));
    this._persistArtwork();
    return true;
  }

  rejectArtworkItem(submissionId, itemId, reason) {
    const sub = this.artworkSubmissions.find(s => s.id === submissionId);
    if (!sub || !sub.items) return false;
    const item = sub.items.find(i => i.id === itemId);
    if (!item) return false;
    item.status = 'rejected';
    if (reason) item.reason = reason;
    this._recalcSubStatus(this.artworkSubmissions.indexOf(sub));
    this._persistArtwork();
    return true;
  }

  _recalcSubStatus(idx) {
    const sub = this.artworkSubmissions[idx];
    if (!sub || !sub.items) return;
    const hasPending = sub.items.some(i => i.status === 'pending');
    const hasApproved = sub.items.some(i => i.status === 'approved');
    const hasRejected = sub.items.some(i => i.status === 'rejected');
    if (hasPending) sub.submissionStatus = 'pending';
    else if (hasApproved && !hasRejected) sub.submissionStatus = 'approved';
    else if (hasRejected && !hasApproved) sub.submissionStatus = 'rejected';
    else sub.submissionStatus = 'mixed';
  }

  _persistArtwork() {
    localStorage.setItem('foromane_artwork_submissions', JSON.stringify(this.artworkSubmissions));
    this.refresh();
  }

  // === ANALYTICS ===
  getMonthlyAnalytics(bizId, yearMonth) {
    const year = parseInt(yearMonth.split('-')[0]);
    const month = parseInt(yearMonth.split('-')[1]) - 1;
    
    let promos = bizId 
      ? this.promos.filter(p => p.businessId === bizId)
      : this.promos;
    
    const monthlyPromos = promos.filter(p => {
      if (!p.promo?.submittedAt) return false;
      const d = new Date(p.promo.submittedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const spending = monthlyPromos.reduce((sum, p) => sum + (p.promo?.cost || 0), 0);
    const views = monthlyPromos.reduce((sum, p) => sum + (p.kpi?.views || 0), 0);
    const likes = monthlyPromos.reduce((sum, p) => sum + (p.kpi?.likes || 0), 0);

    return {
      promos: monthlyPromos,
      spending,
      views,
      likes,
      promoCount: monthlyPromos.length
    };
  }
}

window.AdminData = AdminData;