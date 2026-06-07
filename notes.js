/* ════════════════════════════════════════════════════════
   FOROMANE NOTES - Notes management & WhatsApp sharing
   ════════════════════════════════════════════════════════ */

function galleryNext(btn) {
  var g = btn.parentElement.querySelector('.media-scroll-gallery');
  if (!g) return;
  var atEnd = g.scrollLeft + g.clientWidth >= g.scrollWidth - 2;
  g.scrollTo({ left: atEnd ? 0 : g.scrollLeft + g.clientWidth, behavior: 'smooth' });
}
function galleryPrev(btn) {
  var g = btn.parentElement.querySelector('.media-scroll-gallery');
  if (!g) return;
  var atStart = g.scrollLeft <= 2;
  g.scrollTo({ left: atStart ? g.scrollWidth - g.clientWidth : g.scrollLeft - g.clientWidth, behavior: 'smooth' });
}

const DEMO_USER_MAP = {
  'user-guest': 'guest',
  'user-kago': 'general',
  'user-thabo': 'trade'
};

if (!window._notes) {
  window._notes = [];
}

async function seedDemoNotes() {
  if (typeof loadDemoExtraData === 'function') {
    await loadDemoExtraData();
  }
  if (!window.DEMO_NOTES || !ForomaneDB.db) return;
  try {
    const existing = await ForomaneDB.getAll('notes');
    if (existing.length > 0) return;
    for (const note of window.DEMO_NOTES) {
      const mapped = { ...note, userId: DEMO_USER_MAP[note.userId] || note.userId };
      await ForomaneDB.put('notes', mapped);
    }
    window._notes = await ForomaneDB.getAll('notes');
  } catch(e) {
    console.error('Failed to seed demo notes:', e);
  }
}

function reloadNotesForUser() {
  renderNotes();
}

var _notesFilter = 'my-notes';

function setNotesFilter(filter) {
  _notesFilter = filter;
  document.querySelectorAll('.notes-filter-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  if (filter === 'promo-notes') {
    var el = document.getElementById('notes-list');
    if (el) renderPromoNotes();
    var wrapper = document.getElementById('notes-create-wrapper');
    if (wrapper) wrapper.style.display = 'none';
  } else {
    var wrapper = document.getElementById('notes-create-wrapper');
    if (wrapper) wrapper.style.display = '';
    renderNotes();
  }
}

var _promoNotesAdded = {};

function renderPromoNotes() {
  var el = document.getElementById('notes-list');
  if (!el) return;
  if (typeof loadDemoExtraData === 'function' && (!window.DEMO_PROMO_NOTES || window.DEMO_PROMO_NOTES.length === 0)) {
    loadDemoExtraData().then(function() {
      renderPromoNotes();
    });
    return;
  }
  var notes = window.DEMO_PROMO_NOTES || [];
  if (notes.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--grey-dark);">' +
      '<img src="assets/icons/solid/clipboard-list_inactive.webp" style="width:64px;height:64px;object-fit:contain;opacity:0.3;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;">' +
      '<p style="font-size:15px;font-weight:600;margin-bottom:6px;">Promo Notes</p>' +
      '<p style="font-size:13px;line-height:1.5;max-width:280px;margin:0 auto;">No promo notes available yet.</p></div>';
    return;
  }
  var header = document.querySelector('.notes-header');
  if (header) {
    var h2 = header.querySelector('h2');
    if (h2) h2.textContent = 'Promo Notes';
  }
  var wrapper = document.getElementById('notes-create-wrapper');
  if (wrapper) wrapper.style.display = 'none';
  el.innerHTML = notes.map(function(note, index) {
    var total = note.items.reduce(function(s, it) { return s + (it.price * (it.qty || 1)); }, 0);
    var totalFormatted = total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    var itemCount = note.items.length;
    return '<div class="note-card" onclick="openNote(\'' + note.id + '\')">' +
      '<div class="note-card-info">' +
        '<h3>' + note.title + '</h3>' +
        '<p class="note-meta"><span>' + itemCount + ' item' + (itemCount !== 1 ? 's' : '') + '</span><span>\u2022</span><span class="note-meta-price">P ' + totalFormatted + '</span></p>' +
      '</div>' +
    '</div>';
  }).join('');
}

async function addPromoNoteToMyNotes(promoNoteId, event) {
  if (event) event.stopPropagation();
  if (UserState.role === 'Browser') {
    showToast('Create a profile to add notes');
    return;
  }
  var promoNote = (window.DEMO_PROMO_NOTES || []).find(function(n) { return n.id === promoNoteId; });
  if (!promoNote) { showToast('Promo note not found'); return; }
  if (_promoNotesAdded[promoNoteId]) { showToast('Already added to your notes'); return; }

  var alreadyExists = (window._notes || []).some(function(n) {
    return n.isPromoNote && n.originalBizName === promoNote.originalBizName && n.title === promoNote.title;
  });
  if (alreadyExists) {
    _promoNotesAdded[promoNoteId] = true;
    renderPromoNotes();
    showToast('Already in your notes');
    return;
  }

  var newNote = {
    id: 'note_promo_' + Date.now(),
    title: promoNote.title,
    thumbnail: promoNote.thumbnail || '',
    body: promoNote.body || '',
    userId: UserState.id,
    isPromoNote: true,
    originalBizId: promoNote.originalBizId,
    originalBizName: promoNote.originalBizName,
    originalBizInitials: promoNote.originalBizInitials || '',
    originalBizCategory: promoNote.originalBizCategory || '',
    images: promoNote.images ? promoNote.images.slice() : [],
    items: promoNote.items.map(function(it) {
      return {
        title: it.title,
        price: it.price,
        unit: it.unit || 'each',
        business: it.business || promoNote.originalBizName || '',
        qty: it.qty || 1
      };
    })
  };

  window._notes.push(newNote);
  try {
    await ForomaneDB.put('notes', newNote);
  } catch(e) {
    console.error('Failed to save promo note to DB:', e);
  }
  try {
    if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') {
      await window.SyncQueue.enqueue('notes', newNote, { clientId: UserState.id });
      if (window.requestBackgroundSync) window.requestBackgroundSync().catch(function(){});
    }
  } catch(e) {}

  _promoNotesAdded[promoNoteId] = true;
  renderPromoNotes();
  showToast('Promo note added to My Notes');
}

function renderNotes() {
  const el = document.getElementById('notes-list');
  if (!el) return;

  if (UserState.role === 'Browser') {
    el.innerHTML = `
      <div style="text-align:center;padding:48px 16px;color:var(--grey-dark);">
        <img src="` + window.assetUrl('assets/icons/solid/clipboard-list_inactive.webp') + `" style="width:64px;height:64px;object-fit:contain;opacity:0.3;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;">
        <p style="font-size:15px;font-weight:600;margin-bottom:6px;">What are Notes?</p>
        <p style="font-size:13px;line-height:1.5;max-width:280px;margin:0 auto 16px;">Save promos and items you're interested in, organise them by project, and share with your suppliers — all in one place.</p>
        <button class="btn" style="border-radius:10px;" onclick="navTab('view-account','nav-account')">Create a Profile to Get Started</button>
      </div>
    `;
    const wrapper = document.getElementById('notes-create-wrapper');
    if (wrapper) wrapper.style.display = 'none';
    const header = document.querySelector('.notes-header');
    if (header) {
      const h2 = header.querySelector('h2');
      if (h2) h2.textContent = 'Notes';
    }
    return;
  }

  const wrapper = document.getElementById('notes-create-wrapper');
  if (wrapper) wrapper.style.display = '';
  const header = document.querySelector('.notes-header');
  if (header) {
    const h2 = header.querySelector('h2');
    if (h2) h2.textContent = 'My Notes';
  }

  const uid = UserState.id;
  const userNotes = (window._notes || []).filter(function(n) {
    return n.userId === uid;
  });

  const maxFree = 10;
  const used = userNotes.length;
  const remaining = Math.max(0, maxFree - used);

  const counterEl = document.getElementById('notes-remaining-counter');
  if (counterEl) {
    counterEl.textContent = '+ Add Note  (' + remaining + ' of ' + maxFree + ' free' +
      (used > maxFree ? ' — ' + (used - maxFree) + ' bonus' : '') + ')';
  }

  var bulkHtml = '';
  if (window.ForomaneCadence) {
    var cd = window.ForomaneCadence.getCurrentCadenceDay();
    if (cd === 'monday' && userNotes.length > 0) {
      var allItems = [];
      userNotes.forEach(function(n) {
        (n.items || []).forEach(function(it) {
          allItems.push({ title: it.title, qty: it.qty || 1, price: it.price, business: it.business, noteTitle: n.title });
        });
      });
      if (allItems.length > 0) {
        var totalQty = allItems.reduce(function(s, i) { return s + i.qty; }, 0);
        var totalCost = allItems.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
        bulkHtml = '<div style="background:#fff3e0;border:1px solid var(--orange);border-radius:6px;padding:12px;margin-bottom:12px;">' +
          '<div style="font-size:13px;font-weight:600;color:var(--orange);margin-bottom:6px;">\ud83d\udce6 Bulk Order Summary \u2014 Monday Sourcing</div>' +
          '<div style="font-size:12px;color:var(--grey-dark);">' + allItems.length + ' material' + (allItems.length !== 1 ? 's' : '') + ' needed across ' + userNotes.length + ' note' + (userNotes.length !== 1 ? 's' : '') + ' \u00b7 Total qty: ' + totalQty + ' \u00b7 P' + totalCost.toFixed(2) + '</div>' +
          '<div style="font-size:11px;color:var(--grey-mid);margin-top:4px;">' + allItems.map(function(i) { return i.title + ' \u00d7' + i.qty + ' (' + i.business + ')'; }).join(' | ') + '</div>' +
          '<button class="btn-sm" style="margin-top:8px;background:var(--orange);color:#fff;border:none;" onclick="shareBulkOrderSummary()">Share via WhatsApp</button>' +
          '</div>';
      }
    }
  }

  if (userNotes.length === 0) {
    el.innerHTML = bulkHtml + `
      <div style="text-align:center;padding:40px 16px;color:var(--grey-dark);">
        <p style="font-size:14px;font-weight:600;margin-bottom:4px;">No notes yet.</p>
      </div>
    `;
    return;
  }

  el.innerHTML = bulkHtml + userNotes.map((note, index) => {
    const total = note.items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
    const count = note.items.reduce((sum, item) => sum + (item.qty || 1), 0);
    return `
      <div class="note-card" onclick="openNote('${note.id}')">
        <div class="note-card-info">
          <h3>${note.title}</h3>
          <p class="note-meta"><span>${count} items</span><span>\u2022</span><span class="note-meta-price">P ${total.toFixed(2)}</span></p>
        </div>
      </div>
    `;
  }).join('');
}

function openNote(noteId) {
  const note = window._notes.find(n => n.id === noteId);
  if (!note) {
    const promoNote = (window.DEMO_PROMO_NOTES || []).find(function(n) { return n.id === noteId; });
    if (promoNote) {
      openPromoNote(promoNote);
      return;
    }
    return;
  }

  const total = note.items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
  const formatted = total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const count = note.items.length;
  document.getElementById('note-total-val').textContent = 'P' + formatted + ' for ' + count + ' item' + (count !== 1 ? 's' : '');

  document.getElementById('note-title-display').textContent = note.title;

  if (note.thumbnail) {
    document.getElementById('note-thumbnail-img').src = note.thumbnail;
    document.getElementById('media-empty-state').style.display = 'none';
    document.getElementById('media-filled-state').style.display = 'block';
  } else {
    document.getElementById('media-empty-state').style.display = 'flex';
    document.getElementById('media-filled-state').style.display = 'none';
  }

  document.getElementById('note-body-input').textContent = note.body || '';

  const list = document.getElementById('note-items-list');
  if (note.items.length === 0) {
    list.innerHTML = '<div class="note-empty-state">' +
      '<p>Tap on Promos to find products and services you can add to your note.</p>' +
      '<img src="assets/icons/solid/bullhorn-2_orange.webp" class="note-empty-icon" style="cursor:pointer;" onclick="navTab(\'view-promos\',\'nav-promos\')">' +
      '</div>';
  } else {
    list.innerHTML = note.items.map((item, idx) => {
      const total = (item.price * (item.qty || 1)).toFixed(2);
      return `
      <div class="note-item-card" data-note-id="${noteId}" data-item-index="${idx}">
        <h4 onclick="openNoteItemView('${noteId}',${idx})" style="cursor:pointer;">${item.title}</h4>
        <p class="ni-cost">P ${total} per Unit</p>
        <div class="qty-controls">
          <button class="qty-btn" onclick="updateNoteItemQty('${noteId}',${idx},-1)">−</button>
          <span class="ni-qty">${item.qty || 1}</span>
          <button class="qty-btn" onclick="updateNoteItemQty('${noteId}',${idx},1)">+</button>
        </div>
      </div>
    `;
    }).join('');
  }

  var noteMediaSection = document.getElementById('note-media-section');

  if (!note.isPromoNote && noteMediaSection && window._origNoteMediaHtml) {
    noteMediaSection.innerHTML = window._origNoteMediaHtml;
  }

  if (note.isPromoNote && note.images && note.images.length > 0) {
    if (noteMediaSection) {
      noteMediaSection.style.display = '';
      noteMediaSection.innerHTML = '<div class="media-scroll-gallery"><div class="media-scroll-track">' +
        note.images.map(function(img) {
          return '<img class="media-scroll-slide" src="' + img + '" alt="" loading="lazy">';
        }).join('') +
        '</div></div>' +
        '<button class="gallery-btn gallery-btn-prev" onclick="galleryPrev(this)">\u2039</button>' +
        '<button class="gallery-btn gallery-btn-next" onclick="galleryNext(this)">\u203A</button>';
    }
  } else if (noteMediaSection) {
    noteMediaSection.style.display = '';
  }

  var promoAttribution = document.getElementById('promo-attribution-bar');
  if (promoAttribution) {
    if (note.isPromoNote) {
      var biz = null;
      if (window.SAMPLE_BUSINESSES && note.originalBizId) {
        biz = window.SAMPLE_BUSINESSES.find(function(b) { return b.id === note.originalBizId; });
      }
      var initials = (biz && biz.initials) || note.originalBizInitials || '?';
      var color = (biz && biz.color) || '#999';
      var cat = (biz && biz.category) || note.originalBizCategory || '';
      var logoUrl = (biz && biz.logo) || '';
      promoAttribution.style.display = 'flex';
      promoAttribution.innerHTML =
        (logoUrl
          ? '<img src="' + logoUrl + '" class="promo-attrib-avatar" alt="">'
          : '<div class="promo-attrib-avatar promo-attrib-avatar--init" style="background:' + color + ';">' + initials + '</div>') +
        '<div class="promo-attrib-text">' +
          '<div class="promo-attrib-biz">' + note.originalBizName + '</div>' +
          '<div class="promo-attrib-cat">' + cat + '</div>' +
        '</div>';
    } else {
      promoAttribution.style.display = 'none';
    }
  }

  window._currentNoteId = noteId;
  goTo('view-note-open');
}

function openPromoNote(note) {
  var total = note.items.reduce(function(s, it) { return s + (it.price * (it.qty || 1)); }, 0);
  var formatted = total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  var count = note.items.length;
  document.getElementById('note-total-val').textContent = 'P' + formatted + ' for ' + count + ' item' + (count !== 1 ? 's' : '');
  document.getElementById('note-title-display').textContent = note.title;

  document.getElementById('media-empty-state').style.display = 'flex';
  document.getElementById('media-filled-state').style.display = 'none';

  document.getElementById('note-body-input').textContent = note.body || '';

  var list = document.getElementById('note-items-list');
  if (note.items.length === 0) {
    list.innerHTML = '<div class="note-empty-state"><p>No items in this promo note.</p></div>';
  } else {
    list.innerHTML = note.items.map(function(item, idx) {
      var itemTotal = (item.price * (item.qty || 1)).toFixed(2);
      return '<div class="note-item-card">' +
        '<h4>' + item.title + '</h4>' +
        '<p class="ni-cost">P ' + itemTotal + ' per Unit</p>' +
        '<div class="qty-controls"><span class="ni-qty">qty: ' + (item.qty || 1) + '</span></div>' +
        '</div>';
    }).join('');
  }

  var biz = null;
  if (window.SAMPLE_BUSINESSES && note.originalBizId) {
    biz = window.SAMPLE_BUSINESSES.find(function(b) { return b.id === note.originalBizId; });
  }
  var initials = (biz && biz.initials) || note.originalBizInitials || '?';
  var color = (biz && biz.color) || note.originalBizColor || '#999';
  var cat = (biz && biz.category) || note.originalBizCategory || '';
  var logoUrl = (biz && biz.logo) || '';

  var promoAttribution = document.getElementById('promo-attribution-bar');
  if (promoAttribution) {
    promoAttribution.style.display = 'flex';
    promoAttribution.innerHTML =
      (logoUrl
        ? '<img src="' + logoUrl + '" class="promo-attrib-avatar" alt="">'
        : '<div class="promo-attrib-avatar promo-attrib-avatar--init" style="background:' + color + ';">' + initials + '</div>') +
      '<div class="promo-attrib-text">' +
        '<div class="promo-attrib-biz">' + note.originalBizName + '</div>' +
        '<div class="promo-attrib-cat">' + cat + '</div>' +
      '</div>';
  }

  var noteMediaSection = document.getElementById('note-media-section');
  if (noteMediaSection) {
    if (!window._origNoteMediaHtml) {
      window._origNoteMediaHtml = noteMediaSection.innerHTML;
    }
    if (note.images && note.images.length > 0) {
      noteMediaSection.innerHTML = '<div class="media-scroll-gallery"><div class="media-scroll-track">' +
        note.images.map(function(img) {
          return '<img class="media-scroll-slide" src="' + img + '" alt="" loading="lazy">';
        }).join('') +
        '</div></div>' +
        '<button class="gallery-btn gallery-btn-prev" onclick="galleryPrev(this)">\u2039</button>' +
        '<button class="gallery-btn gallery-btn-next" onclick="galleryNext(this)">\u203A</button>';
    } else {
      noteMediaSection.innerHTML = '<div class="media-empty-state"><div class="add-image-btn"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline><line x1="12" y1="9" x2="12" y2="15"></line><line x1="9" y1="12" x2="15" y2="12"></line></svg></div><div class="add-image-text">Add Image</div></div>';
    }
  }

  var addFromDetailBtn = document.getElementById('promo-add-from-detail');
  if (addFromDetailBtn) {
    var alreadyAdded = _promoNotesAdded && _promoNotesAdded[note.id];
    if (alreadyAdded) {
      addFromDetailBtn.innerHTML = '<span class="check-icon">✓</span> Added to My Notes';
      addFromDetailBtn.disabled = true;
      addFromDetailBtn.className = 'add-to-notes-btn added';
    } else {
      addFromDetailBtn.innerHTML = '+ Add to My Notes';
      addFromDetailBtn.disabled = false;
      addFromDetailBtn.className = 'add-to-notes-btn';
      addFromDetailBtn.onclick = function(e) { addPromoNoteToMyNotes(note.id, e); };
    }
    addFromDetailBtn.style.display = 'inline-flex';
  }

  window._currentNoteId = note.id;
  goTo('view-note-open');
}

async function updateNoteItemQty(noteId, itemIdx, delta) {
  const note = window._notes.find(n => n.id === noteId);
  if (!note || !note.items[itemIdx]) return;

  const item = note.items[itemIdx];
  const oldQty = item.qty || 1;
  const newQty = Math.max(0, oldQty + delta);

  if (newQty === 0) {
    if (!confirm('Remove this item from the note?')) return;
    note.items.splice(itemIdx, 1);
    try {
      await ForomaneDB.put('notes', note);
      if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') {
        await window.SyncQueue.enqueue('notes', note, { clientId: UserState.id });
        if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{});
      }
    } catch(e) {}
    if (window.currentView === 'view-note-open') openNote(noteId);
    else renderNotes();
    return;
  }

  item.qty = newQty;

  try {
    await ForomaneDB.put('notes', note);
    if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') {
      await window.SyncQueue.enqueue('notes', note, { clientId: UserState.id });
      if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{});
    }
  } catch(e) {}

  const card = document.querySelector(`#note-items-list [data-item-index="${itemIdx}"]`);
  if (card) {
    const qtySpan = card.querySelector('.ni-qty');
    if (qtySpan) qtySpan.textContent = newQty;
    const costEl = card.querySelector('.ni-cost');
    if (costEl) costEl.textContent = `P ${(item.price * newQty).toFixed(2)} per Unit`;
  }

  const newTotal = note.items.reduce((sum, i) => sum + (i.price * (i.qty || 1)), 0);
  const formatted = newTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const count = note.items.length;
  const totalEl = document.getElementById('note-total-val');
  if (totalEl) totalEl.textContent = 'P' + formatted + ' for ' + count + ' item' + (count !== 1 ? 's' : '');
}

async function createNote() {
  const note = {
    id: 'note_' + Date.now(),
    title: 'New Note',
    thumbnail: '',
    body: '',
    userId: UserState.id,
    items: []
  };
  window._notes.push(note);
  try {
    await ForomaneDB.put('notes', note);
  } catch(e) {
    console.error('Failed to save note to DB:', e);
  }
  try {
    if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') {
      await window.SyncQueue.enqueue('notes', note, { clientId: UserState.id });
      if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{});
    }
  } catch(e) { console.warn('Failed to enqueue new note for sync:', e); }
  renderNotes();
  openNote(note.id);
}

function editNoteTitle() {
  const note = window._notes.find(n => n.id === window._currentNoteId);
  if (!note) return;
  const titleEl = document.getElementById('note-title-display');
  note.title = titleEl.textContent;
  renderNotes();
}

function changeNoteThumbnail() {
  document.getElementById('hidden-image-upload').click();
}

function handleImageSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  const note = window._notes.find(n => n.id === window._currentNoteId);
  if (!note) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    note.thumbnail = dataUrl;
    document.getElementById('note-thumbnail-img').src = dataUrl;
    document.getElementById('media-empty-state').style.display = 'none';
    document.getElementById('media-filled-state').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function saveNoteBody() {
  const note = window._notes.find(n => n.id === window._currentNoteId);
  if (!note) return;
  note.body = document.getElementById('note-body-input').textContent;
  clearTimeout(window._noteBodyTimer);
  window._noteBodyTimer = setTimeout(async function() {
    try {
      await ForomaneDB.put('notes', note);
      if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') {
        try { await window.SyncQueue.enqueue('notes', note, { clientId: UserState.id }); } catch(e) { console.warn('Failed to enqueue note body save:', e); }
        if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{});
      }
    } catch(e) {}
  }, 500);
}

function deleteCurrentNote() {
  var isPromo = (window.DEMO_PROMO_NOTES || []).some(function(n) { return n.id === window._currentNoteId; });
  if (isPromo) {
    showToast('This is a promo note — add it to My Notes to manage it');
    return;
  }
  openModal('delete-note-modal');
}

function confirmDeleteNote() {
  closeModal('delete-note-modal');
  const idx = window._notes.findIndex(n => n.id === window._currentNoteId);
  if (idx === -1) return;
  window._notes.splice(idx, 1);
  renderNotes();
  goTo('view-notes');
}

function payNotesBTC() {
  closeModal('buy-notes-modal');
  const text = 'I want to purchase 25 additional Foromane Notes via BTC Smega. My user ID: ' + UserState.id;
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  showToast('Tap Send on WhatsApp to complete payment');
}

function payNotesMascom() {
  closeModal('buy-notes-modal');
  const text = 'I want to purchase 25 additional Foromane Notes via Mascom Myzaka. My user ID: ' + UserState.id;
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  showToast('Tap Send on WhatsApp to complete payment');
}

function payNotesOrange() {
  closeModal('buy-notes-modal');
  const text = 'I want to purchase 25 additional Foromane Notes via Orange Money. My user ID: ' + UserState.id;
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  showToast('Tap Send on WhatsApp to complete payment');
}

function shareNoteWhatsApp(noteId) {
  const id = noteId || window._currentNoteId;
  let note = window._notes.find(n => n.id === id);
  if (!note) {
    note = (window.DEMO_PROMO_NOTES || []).find(function(n) { return n.id === id; });
  }
  if (!note) { showToast('No notes to share'); return; }

  const total = note.items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
  let text = `*${note.title}*\n`;
  if (note.body) text += `\n${note.body}\n`;
  text += '\n';
  note.items.forEach((item, idx) => {
    text += `${idx + 1}. ${item.title}\n   P ${item.price.toFixed(2)} ${item.unit} \u00d7 ${item.qty || 1} = P ${(item.price * (item.qty || 1)).toFixed(2)}\n   ${item.business}\n\n`;
  });
  text += `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n*Total for ${note.items.length} items: P ${total.toFixed(2)}*`;

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function openNoteItemView(noteId, itemIdx) {
  const note = window._notes.find(n => n.id === noteId);
  if (!note || !note.items[itemIdx]) return;
  const item = note.items[itemIdx];
  const promo = window._promos && window._promos.find(p => p.title === item.title && p.businessName === item.business);
  const content = document.getElementById('item-view-content');
  if (!content) return;
  const totalCost = (item.price * (item.qty || 1)).toFixed(2);
  var totalCostNum = (item.price * (item.qty || 1));
  var bizColor = (promo && promo.businessColor) || '#999';
  var bizInit = (promo && promo.businessInit) || (item.business ? item.business.charAt(0).toUpperCase() : '?');
  var bizLocation = (promo && promo.location) || '';
  var tags = promo && promo.tags && promo.tags.length ? promo.tags.map(function(t) { return '<span class="tag-pill">' + t + '</span>'; }).join('') : '';
  var images = promo && promo.images && promo.images.length ? promo.images : [];

  var carouselHtml = '';
  if (images.length > 0) {
    var trackItems = images.map(function(img) {
      return '<img class="carousel-item" src="' + img + '" alt="' + item.title.replace(/"/g, '&quot;') + '">';
    }).join('');
    var dots = images.map(function(_, i) {
      return '<div class="carousel-dot' + (i === 0 ? ' active' : '') + '"></div>';
    }).join('');
    carouselHtml =
      '<div class="media-carousel-container">' +
        '<div class="carousel-track" id="media-track">' + trackItems + '</div>' +
        '<div class="carousel-indicators" id="media-indicators">' + dots + '</div>' +
      '</div>';
  }

  content.innerHTML =
    /* ── 1. SWIPEABLE MEDIA CAROUSEL ── */
    carouselHtml +
    /* ── 2. HEADER ── */
    '<div class="item-header">' +
      '<h3 class="item-title">' + item.title + '</h3>' +
      (promo && promo.category ? '<p class="item-category">Category: <strong>' + promo.category + '</strong></p>' : '') +
    '</div>' +
    /* ── 3. PRICE CARD ── */
    '<div class="price-card">' +
      '<div class="price-row">' +
        '<span class="price-label">Unit Price</span>' +
        '<span class="price-value">P ' + item.price.toFixed(2) + ' ' + (item.unit || 'each') + '</span>' +
      '</div>' +
      '<div class="price-row">' +
        '<span class="price-label">Quantity</span>' +
        '<span class="price-value">' + (item.qty || 1) + '</span>' +
      '</div>' +
      '<div class="price-row price-total">' +
        '<span class="price-label">Total</span>' +
        '<span class="total-value">P ' + totalCostNum.toFixed(2) + '</span>' +
      '</div>' +
    '</div>' +
    /* ── 4. DESCRIPTION ── */
    (promo && promo.desc ?
    '<p class="section-heading">Description</p>' +
    '<p class="item-desc">' + promo.desc + '</p>' : '') +
    /* ── 5. PROVIDER + TAGS ── */
    '<div class="provider-section">' +
      '<div class="meta-group">' +
        '<p class="section-heading">Service Provider</p>' +
        '<div class="provider-row" onclick="openBizFromPromo(\'' + (promo && promo.businessId ? promo.businessId.replace(/'/g,"\\'") : '') + '\',\'' + item.business.replace(/'/g,"\\'") + '\')">' +
          (function(bId, col, init){ var logo = bId ? window.getBusinessLogo(bId) : null; return logo ? '<img src="' + logo + '" class="provider-thumb" style="object-fit:cover;" alt="">' : '<div class="provider-thumb" style="background:' + col + ';">' + init + '</div>'; })(promo && promo.businessId, bizColor, bizInit) +
          '<div>' +
            '<p class="provider-name">' + item.business + '</p>' +
            (bizLocation ? '<p class="provider-location">' + bizLocation + '</p>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  openModal('item-view-modal');

  // Bind carousel scroll listener after render
  setTimeout(function() {
    var track = document.getElementById('media-track');
    var dots = document.querySelectorAll('#media-indicators .carousel-dot');
    if (track && dots.length > 0) {
      track.addEventListener('scroll', function() {
        var idx = Math.round(track.scrollLeft / track.clientWidth);
        dots.forEach(function(d, i) {
          d.classList.toggle('active', i === idx);
        });
      });
    }
  }, 0);
}

function shareBulkOrderSummary() {
  var uid = UserState.id;
  var userNotes = (window._notes || []).filter(function(n) { return n.userId === uid; });
  var allItems = [];
  userNotes.forEach(function(n) {
    (n.items || []).forEach(function(it) {
      allItems.push({ title: it.title, qty: it.qty || 1, price: it.price, business: it.business, noteTitle: n.title });
    });
  });
  if (allItems.length === 0) { showToast('No items to share'); return; }
  var totalQty = allItems.reduce(function(s, i) { return s + i.qty; }, 0);
  var totalCost = allItems.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
  var text = '*Bulk Order Summary* \u2014 ' + new Date().toLocaleDateString() + '\n\n';
  allItems.forEach(function(i, idx) {
    text += (idx + 1) + '. ' + i.title + ' \u00d7' + i.qty + ' = P' + (i.price * i.qty).toFixed(2) + ' (' + i.business + ')\n';
  });
  text += '\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n';
  text += 'Total: P' + totalCost.toFixed(2) + ' (' + totalQty + ' units across ' + allItems.length + ' items)';
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
}

window.shareBulkOrderSummary = shareBulkOrderSummary;
window.renderNotes = renderNotes;
window.renderPromoNotes = renderPromoNotes;
window.addPromoNoteToMyNotes = addPromoNoteToMyNotes;
window.openNote = openNote;
window.createNote = createNote;
window.openNoteItemView = openNoteItemView;
window.shareNoteWhatsApp = shareNoteWhatsApp;
window.updateNoteItemQty = updateNoteItemQty;
window.editNoteTitle = editNoteTitle;
window.changeNoteThumbnail = changeNoteThumbnail;
window.handleImageSelected = handleImageSelected;
window.deleteCurrentNote = deleteCurrentNote;
window.confirmDeleteNote = confirmDeleteNote;
window.saveNoteBody = saveNoteBody;
window.seedDemoNotes = seedDemoNotes;
window.reloadNotesForUser = reloadNotesForUser;
window.payNotesBTC = payNotesBTC;
window.payNotesMascom = payNotesMascom;
window.payNotesOrange = payNotesOrange;
