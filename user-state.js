function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0,0,0,0);
  return date;
}

function checkPromoWeekReset() {
  const stored = localStorage.getItem("foromane_promoWeekReset");
  const monday = getMonday(new Date()).toISOString();
  if (stored !== monday) {
    localStorage.setItem("foromane_promoWeekReset", monday);
    UserState.promosThisWeek = 0;
    UserState.freePromoUsed = false;
  }
}

const UserState = {
  id: localStorage.getItem("foromane_userId") || 'guest',
  name: localStorage.getItem("foromane_name") || "Guest User",
  firstName: localStorage.getItem("foromane_firstName") || "",
  surname: localStorage.getItem("foromane_surname") || "",
  role: localStorage.getItem("foromane_role") || "General User",
  isVerified: localStorage.getItem("foromane_isVerified") === 'true', // New: VIP/Agent Verification
  company: localStorage.getItem("foromane_company") || "",
  town: localStorage.getItem("foromane_town") || "Gaborone",
  mobile: localStorage.getItem("foromane_mobile") || "",
  username: localStorage.getItem("foromane_username") || "",
  dateOfBirth: localStorage.getItem("foromane_dob") || "",
  gender: localStorage.getItem("foromane_gender") || "",
  nationality: localStorage.getItem("foromane_nationality") || "",
  race: localStorage.getItem("foromane_race") || "",
  contacts: JSON.parse(localStorage.getItem("foromane_contacts") || '{"mobiles":[],"whatsapps":[],"social":{"facebook":"","twitter":"","instagram":"","tiktok":"","snapchat":"","youtube":"","pinterest":"","linkedin":"","telegram":""}}'),
  photo: localStorage.getItem("foromane_photo") || "",
  location: JSON.parse(localStorage.getItem("foromane_location") || '{"town":"Gaborone","area":"","gps":""}'),
  interests: JSON.parse(localStorage.getItem("foromane_interests") || '[]'),
  favouriteSuppliers: JSON.parse(localStorage.getItem("foromane_favSuppliers") || '[]'),
  business: null,
  businessRole: null,
  items: [],
  kpi: { ads: 0, views: 0, likes: 0, noteAdds: 0, interactions: 0 },
  promosThisWeek: 0,
  freePromoUsed: false,
  promoWeekReset: (() => {
    const stored = localStorage.getItem("foromane_promoWeekReset");
    if (stored) return stored;
    const val = getMonday(new Date()).toISOString();
    localStorage.setItem("foromane_promoWeekReset", val);
    return val;
  })(),

  set(id, name, role, company = "", town = "", mobile = "") {
    this.id = id;
    this.name = name;
    const parts = name.split(' ');
    this.firstName = parts[0] || '';
    this.surname = parts.slice(1).join(' ') || '';
    this.role = role;
    this.company = company;
    this.town = town || this.location.town;
    this.mobile = mobile;
    this.business = null;
    this.businessRole = null;
    this.location.town = town || this.location.town;
    localStorage.setItem("foromane_userId", id);
    localStorage.setItem("foromane_name", name);
    localStorage.setItem("foromane_firstName", this.firstName);
    localStorage.setItem("foromane_surname", this.surname);
    localStorage.setItem("foromane_role", role);
    localStorage.setItem("foromane_company", company);
    localStorage.setItem("foromane_town", this.location.town);
    localStorage.setItem("foromane_mobile", mobile);
    localStorage.setItem("foromane_username", this.username);
    localStorage.setItem("foromane_dob", this.dateOfBirth);
    localStorage.setItem("foromane_gender", this.gender);
    localStorage.setItem("foromane_nationality", this.nationality);
    localStorage.setItem("foromane_race", this.race);
    if (this.photo) localStorage.setItem("foromane_photo", this.photo);
    this._persistContacts();
    this._persistLocation();
    this._persistInterests();
    this._persistFavSuppliers();
    checkPromoWeekReset();
  },

  clear() {
    ["foromane_userId","foromane_name","foromane_firstName","foromane_surname","foromane_role","foromane_company","foromane_town","foromane_mobile","foromane_username","foromane_dob","foromane_gender","foromane_nationality","foromane_race","foromane_contacts","foromane_location","foromane_interests","foromane_favSuppliers","foromane_photo","foromane_professional_"+this.id].forEach(k => localStorage.removeItem(k));
    this.id = 'guest';
    this.name = "Guest User";
    this.firstName = "";
    this.surname = "";
    this.role = "General User";
    this.company = "";
    this.town = "Gaborone";
    this.mobile = "";
    this.username = "";
    this.dateOfBirth = "";
    this.gender = "";
    this.nationality = "";
    this.race = "";
    this.photo = "";
    this.contacts = { mobiles: [], whatsapps: [], social: { facebook:"",twitter:"",instagram:"",tiktok:"",snapchat:"",youtube:"",pinterest:"",linkedin:"",telegram:"" } };
    this.location = { town: "Gaborone", area: "", gps: "" };
    this.interests = [];
    this.favouriteSuppliers = [];
    this.business = null;
    this.businessRole = null;
    this.items = [];
    this.promosThisWeek = 0;
    this.freePromoUsed = false;
    this.promoWeekReset = getMonday(new Date()).toISOString();
    localStorage.setItem("foromane_promoWeekReset", this.promoWeekReset);
    localStorage.setItem("foromane_promosThisWeek", "0");
    localStorage.setItem("foromane_freePromoUsed", "false");
  },

  // Identity helpers
  updateIdentity(field, value) {
    this[field] = value;
    if (field === 'firstName' || field === 'surname') {
      this.name = (this.firstName + ' ' + this.surname).trim() || this.name;
      localStorage.setItem("foromane_name", this.name);
    }
    localStorage.setItem("foromane_" + field, value);
  },

  // Contact helpers
  _persistContacts() {
    localStorage.setItem("foromane_contacts", JSON.stringify(this.contacts));
  },

  addMobile(mobile) {
    this.contacts.mobiles.push(mobile);
    if (this.contacts.mobiles.length === 1) mobile.isPrimary = true;
    this._persistContacts();
  },

  removeMobile(id) {
    const removed = this.contacts.mobiles.find(m => m.id === id);
    this.contacts.mobiles = this.contacts.mobiles.filter(m => m.id !== id);
    if (removed && removed.isPrimary && this.contacts.mobiles.length > 0) {
      this.contacts.mobiles[0].isPrimary = true;
    }
    this._persistContacts();
  },

  setPrimaryMobile(id) {
    this.contacts.mobiles.forEach(m => m.isPrimary = m.id === id);
    this._persistContacts();
  },

  addWhatsApp(wa) {
    this.contacts.whatsapps.push(wa);
    if (this.contacts.whatsapps.length === 1) wa.isPrimary = true;
    this._persistContacts();
  },

  removeWhatsApp(id) {
    const removed = this.contacts.whatsapps.find(w => w.id === id);
    this.contacts.whatsapps = this.contacts.whatsapps.filter(w => w.id !== id);
    if (removed && removed.isPrimary && this.contacts.whatsapps.length > 0) {
      this.contacts.whatsapps[0].isPrimary = true;
    }
    this._persistContacts();
  },

  setPrimaryWhatsApp(id) {
    this.contacts.whatsapps.forEach(w => w.isPrimary = w.id === id);
    this._persistContacts();
  },

  updateSocial(platform, value) {
    this.contacts.social[platform] = value;
    this._persistContacts();
  },

  // Location helpers
  _persistLocation() {
    localStorage.setItem("foromane_location", JSON.stringify(this.location));
  },

  updateLocation(field, value) {
    this.location[field] = value;
    this._persistLocation();
  },

  // Interests helpers
  _persistInterests() {
    localStorage.setItem("foromane_interests", JSON.stringify(this.interests));
  },

  toggleInterest(cat) {
    const idx = this.interests.indexOf(cat);
    if (idx > -1) this.interests.splice(idx, 1);
    else this.interests.push(cat);
    this._persistInterests();
  },

  setInterests(arr) {
    this.interests = arr;
    this._persistInterests();
  },

  // Favourite suppliers helpers
  _persistFavSuppliers() {
    localStorage.setItem("foromane_favSuppliers", JSON.stringify(this.favouriteSuppliers));
  },

  isFavourite(id) {
    return this.favouriteSuppliers.includes(id);
  },

  toggleFavourite(id) {
    const idx = this.favouriteSuppliers.indexOf(id);
    if (idx > -1) this.favouriteSuppliers.splice(idx, 1);
    else this.favouriteSuppliers.push(id);
    this._persistFavSuppliers();
  },

  canUseFreePromo() {
    checkPromoWeekReset();
    return !this.freePromoUsed;
  },

  useFreePromo() {
    this.freePromoUsed = true;
    localStorage.setItem("foromane_freePromoUsed", "true");
  },

  recordPromoSubmission() {
    this.promosThisWeek = (this.promosThisWeek || 0) + 1;
    localStorage.setItem("foromane_promosThisWeek", String(this.promosThisWeek));
  },

  isSupplier() { return this.role === "Business & Materials Supplier"; },
  isTradesperson() { return this.role === "Tradesperson (Contractor)"; },
  isGeneralUser() { return this.role === "General User"; },
  hasBusiness() { return this.business !== null; },
  hasRetailHours() { return this.business !== null && this.business.retailHours != null; },
  // ─── Role helpers ───
  isBrowser() { return this.id === 'guest'; },
  isSubscriber() { return this.role === 'General User' && this.id !== 'guest'; },
  isPro() { return this.role === 'Tradesperson (Contractor)'; },
  isBusinessOwner() { return this.role === 'Business & Materials Supplier' || this.hasBusiness(); },
  isStaff() { return this.businessRole === 'staff'; },
  isAdmin() { return this.role === 'Administrator'; },
  // ─── Professional profile ───
  _proProfileKey() { return 'foromane_professional_' + this.id; },
  get professional() {
    try { return JSON.parse(localStorage.getItem(this._proProfileKey())); }
    catch { return null; }
  },
  set professional(data) {
    localStorage.setItem(this._proProfileKey(), JSON.stringify(data));
  }
};

window.UserState = UserState;
