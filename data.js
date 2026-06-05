/**
 * Foromane (Construction Hub) - Core Data
 * Embedded data and configuration
 */

window.ALL_PROFILES = [];

window.CONFIG = {
  "platform": "Foromane (Construction Hub)",
  "version": "2.0.0",
  "currency": "BWP",
  "currencySymbol": "P",
  "vat_rate": 0.14,
  "whatsapp_country_code": "267",
  "tagline": "Botswana's premier supply solutions ecosystem"
};

window.USER_ROLES = [
  { "id": "general", "name": "General User", "description": "Browse promos, manage shopping lists." },
  { "id": "tradesperson", "name": "Tradesperson (Contractor)", "description": "Find jobs, materials, and clients." },
  { "id": "supplier", "name": "Business & Materials Supplier", "description": "List products, promos, and reach builders." }
];

window.APP_COLORS = ['#fd7600','#009144','#003DA5','#8c2d1a','#1a6b5a','#6b3a8c','#1a4b8c','#2a4a8c','#4a6b3a','#8c5a2d'];

window.ITEM_EMOJIS = {
  'Attire & Uniform': '\ud83d\udc55',
  'Bathroom & Kitchen': '\ud83d\udebf',
  'Boards & Timber': '\ud83e\udeb5',
  'Building Materials': '\ud83e\uddf1',
  'Cement & Aggregates': '\ud83e\udea8',
  'Chemicals': '\ud83e\uddea',
  'Design & Plans': '\ud83d\udcd0',
  'Doors & Windows': '\ud83a\udeaa',
  'Electrical': '\u26a1',
  'Gardening & Outdoor Living': '\ud83c\udf3f',
  'Generators & Power Solutions': '\ud83d\udd0b',
  'Geysers & Heating': '\ud83d\udd25',
  'Hardware & Fasteners': '\ud83d\udd29',
  'Home Decor': '\ud83d\uddbc\ufe0f',
  'Lighting': '\ud83d\udca1',
  'Paint': '\ud83c\udfa8',
  'Partitioning': '\ud83e\udeb7',
  'Plumbing': '\ud83d\udd27',
  'Pre-builds & Shipping Containers': '\ud83d\udea2',
  'Roofing & Ceiling': '\ud83c\udfe0',
  'Safety & Security': '\ud83d\udee1\ufe0f',
  'Sanitaryware': '\ud83d\udebd',
  'Solar Supplies': '\u2600\ufe0f',
  'Shelving & Storage': '\ud83d\udce6',
  'Steel & Metal Products': '\ud83d\udd29',
  'Tiles & Flooring': '\u2b1b',
  'Tools & Equipment': '\ud83d\udee0\ufe0f'
};

window.BG_CLASSES = ['img-amber','img-green','img-blue','img-rust','img-teal'];

window._bizLogoCache = null;
window.getBusinessLogo = function(bizId) {
  if (!bizId || !window.SAMPLE_BUSINESSES) return null;
  if (!window._bizLogoCache) {
    window._bizLogoCache = {};
    for (var i = 0; i < window.SAMPLE_BUSINESSES.length; i++) {
      var b = window.SAMPLE_BUSINESSES[i];
      window._bizLogoCache[b.id] = b.logo ? window.assetUrl(b.logo) : null;
    }
    if (window.ZIMBABWE_BUSINESSES) {
      for (var j = 0; j < window.ZIMBABWE_BUSINESSES.length; j++) {
        var zb = window.ZIMBABWE_BUSINESSES[j];
        window._bizLogoCache[zb.id] = zb.logo ? window.assetUrl(zb.logo) : null;
      }
    }
    var _unclaimedLogo = 'assets/images/company_logos_dummy/foromane_logo_thumbnail_unclaimed_business.webp';
    (window.UNCLAIMED_BOTSWANA_BUSINESSES || []).forEach(function(ub) {
      var ubId = Array.isArray(ub) ? ub[0] : ub.id;
      window._bizLogoCache[ubId] = window.assetUrl(_unclaimedLogo);
    });
    (window.UNCLAIMED_ZIMBABWE_BUSINESSES || []).forEach(function(uz) {
      var uzId = Array.isArray(uz) ? uz[0] : uz.id;
      window._bizLogoCache[uzId] = window.assetUrl(_unclaimedLogo);
    });
  }
  return window._bizLogoCache[bizId] || null;
};

window.getBusinessLogo2 = function(bizId) {
  var map = {
    'biz-1': null,
    'biz-2': 'assets/images/company_logos_dummy/demo_business_logo_2/BuildIt Gabs logo.png',
    'biz-3': 'assets/images/company_logos_dummy/demo_business_logo_2/Francistown Steel logo.png',
    'biz-4': 'assets/images/company_logos_dummy/demo_business_logo_2/Gabs Plumbing Depot.png',
    'biz-5': 'assets/images/company_logos_dummy/demo_business_logo_2/Tile Express BW logo.png',
    'biz-6': 'assets/images/company_logos_dummy/demo_business_logo_2/Paint World Gaborone logo.png',
    'biz-7': 'assets/images/company_logos_dummy/demo_business_logo_2/Hardware Kings logo.png',
    'biz-8': 'assets/images/company_logos_dummy/demo_business_logo_2/roofing master logo.png',
    'biz-9': 'assets/images/company_logos_dummy/demo_business_logo_2/Gaborone Attire & Uniforms logo.png',
    'biz-10': 'assets/images/company_logos_dummy/demo_business_logo_2/Bathroom & Kitchen World.png',
    'biz-11': 'assets/images/company_logos_dummy/demo_business_logo_2/Builders Sand & Stone logo.png',
    'biz-12': null,
    'biz-13': 'assets/images/company_logos_dummy/demo_business_logo_2/ChemCare Botswana logo.png',
    'biz-14': 'assets/images/company_logos_dummy/demo_business_logo_2/DesignPro House Plans logo.png',
    'biz-15': 'assets/images/company_logos_dummy/demo_business_logo_2/Door & Window Hub logo.png',
    'biz-16': 'assets/images/company_logos_dummy/demo_business_logo_2/Gaborone Electrical Supplies logo.png',
    'biz-17': 'assets/images/company_logos_dummy/demo_business_logo_2/Green Gardens BW.png',
    'biz-18': 'assets/images/company_logos_dummy/demo_business_logo_2/PowerGen BW.png',
    'biz-19': 'assets/images/company_logos_dummy/demo_business_logo_2/Hot Water Systems BW logo.png',
    'biz-20': 'assets/images/company_logos_dummy/demo_business_logo_2/Home Decor Palace logo.png',
    'biz-21': 'assets/images/company_logos_dummy/demo_business_logo_2/Lighting Centre BW logo.png',
    'biz-22': 'assets/images/company_logos_dummy/demo_business_logo_2/Partitioning Solutions logo.png',
    'biz-23': 'assets/images/company_logos_dummy/demo_business_logo_2/quickbuild prefabs logo.png',
    'biz-24': 'assets/images/company_logos_dummy/demo_business_logo_2/SafetyMax BW.jpg',
    'biz-25': 'assets/images/company_logos_dummy/demo_business_logo_2/Sanitaryware Direct.jpg',
    'biz-26': 'assets/images/company_logos_dummy/demo_business_logo_2/SolarTech Botswana logo.png',
    'biz-27': 'assets/images/company_logos_dummy/demo_business_logo_2/StoreSmart Shelving logo.png',
    'biz-28': null,
    'biz-29': null,
    'biz-30': null
  };
  var v = map[bizId];
  return v ? window.assetUrl(v) : null;
};

window.getBusinessById = function(bizId) {
  if (!bizId || !window.SAMPLE_BUSINESSES) return null;
  return window.SAMPLE_BUSINESSES.find(function(b) { return b.id === bizId; }) || null;
};

window.DEMO_ACCOUNTS = [
  { id: 'guest', name: 'Browse as Guest', role: 'Browser', initials: '?', color: '#999', town: 'Gaborone' },
  { id: 'admin', name: 'Admin', role: 'Administrator', initials: 'AD', color: '#2a2a2a', town: 'Gaborone' },
  { id: 'supplier', name: 'Pako (Board Kings)', role: 'Business & Materials Supplier', initials: 'PK', color: '#fd7600', town: 'Gaborone' },
  { id: 'general', name: 'Kago Setlhare', role: 'General User', initials: 'KS', color: '#1a6b5a', town: 'Gaborone' },
  { id: 'trade', name: 'Thabo Moeng', role: 'Tradesperson (Contractor)', initials: 'TM', color: '#003DA5', town: 'Francistown' },
  { id: 'user-gerald', name: 'Gerald Moabi', role: 'Tradesperson (Contractor)', initials: 'GM', color: '#8c2d1a', town: 'Gaborone' },
  { id: 'owner-biz2', name: 'Dineo (BuildIt Gabs)', role: 'Business Owner', initials: 'DB', color: '#1a4b8c', town: 'Gaborone' },
  { id: 'owner-biz3', name: 'Karabo (F/Town Steel)', role: 'Business Owner', initials: 'KF', color: '#fd7600', town: 'Francistown' },
  { id: 'owner-biz4', name: 'Bame (Gabs Plumbing)', role: 'Business Owner', initials: 'BP', color: '#009144', town: 'Gaborone' },
  { id: 'staff-kudi', name: 'Kudi (Designer)', role: 'Board Kings Staff', initials: 'KD', color: '#003DA5', town: 'Gaborone' },
  { id: 'staff-mark', name: 'Mark (Carpenter)', role: 'Board Kings Staff', initials: 'MK', color: '#1a6b5a', town: 'Gaborone' },
  { id: 'staff-smokey', name: 'Smokey (Cabinet Maker)', role: 'Board Kings Staff', initials: 'SM', color: '#fd7600', town: 'Gaborone' },
  { id: 'staff-tshepang', name: 'Tshepang (Admin)', role: 'Board Kings Staff', initials: 'TS', color: '#009144', town: 'Gaborone' },
  { id: 'user-william', name: 'William Guzani', role: 'Business Owner', initials: 'WG', color: '#6b3a8c', town: 'Gaborone' },
  { id: 'user-robert', name: 'Robert Guzani', role: 'Business Owner', initials: 'RG', color: '#4a6b3a', town: 'Gaborone' }
];
