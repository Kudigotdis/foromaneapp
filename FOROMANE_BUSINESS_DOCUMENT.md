# Foromane (Construction Hub) — Complete Platform Document

---

## 1. Platform Overview

**Foromane** is a mobile-first Progressive Web App (PWA) — a marketplace and business directory for **Botswana's building & construction supply ecosystem**. It connects homeowners, builders, and contractors with hardware/material suppliers and tradespeople in one platform.

- **Developer:** Foromane Investments (Game City, Gaborone)
- **Platform Type:** Hybrid Cloud-Local PWA (works in browser, installable to phone home screen)
- **Core Value Prop:** Discover local suppliers, browse promotional catalogues, save items to project notes, calculate costs, and share via WhatsApp — all while working offline.

---

## 2. Target Market

### Primary Audiences

| Segment | Description | Size Signal |
|---|---|---|
| **Homeowners / DIY builders** | Individuals renovating or building homes in Botswana | 27 categories of building materials |
| **Contractors & builders** | Professionals needing materials and subcontractors | Pros directory with tradespeople |
| **Hardware & material suppliers** | Businesses selling building materials, tools, equipment | Demo data has 30+ sample businesses |
| **Tradespeople** | Electricians, plumbers, carpenters, etc. | Pro profiles with portfolios & ratings |

### Geographic Focus
- **Primary:** Botswana (Gaborone, Francistown, Maun, Serowe, Molepolole, Kanye, Kasane, Palapye, Lobatse, Ramotswa, Mogoditshane, Tlokweng — 12 towns with GPS coordinates built in)
- **Adjacent:** Zimbabwe (zimbabwe_locations.js/JSON files present in codebase)

### Industry Categories Covered (27)
Attire & Uniform, Bathroom & Kitchen, Boards & Timber, Building Materials, Cement & Aggregates, Chemicals, Design & Plans, Doors & Windows, Electrical, Gardening & Outdoor Living, Generators & Power Solutions, Geysers & Heating, Hardware & Fasteners, Home Decor, Lighting, Paint, Partitioning, Plumbing, Pre-builds & Shipping Containers, Roofing & Ceiling, Safety & Security, Sanitaryware, Solar Supplies, Shelving & Storage, Steel & Metal Products, Tiles & Flooring, Tools & Equipment.

---

## 3. User Types & Permissions

| Role | Access Level | Drive Storage | Key Capabilities |
|---|---|---|---|
| **Browser (Guest)** | Read-only, no account | Zero | Browse promos, search directory, view businesses |
| **General User (Subscriber)** | Full browsing + personal tools | Profile pic, notes, JSON files | Shopping lists, save favourites, compare prices, set interests, WhatsApp sharing |
| **Tradesperson (Pro)** | Subscriber + professional tools | Subscriber + portfolio, promos, catalogue, reviews | Pro profile, skills & rates, online status toggle, portfolio upload, get discovered in Pros directory |
| **Business Supplier** | Subscriber + business tools | Owner data + logo, promos, catalogue, staff, documents | List products, post promotions, manage staff, view analytics, payment options |
| **Administrator** | Full platform control | N/A (admin only) | Approve businesses, manage users, view KPIs, content scheduling for Facebook/IG |

---

## 4. Feature Deep-Dive

### 4.1 Promos Feed
The main landing view. Users scroll a feed of current promotions from hardware stores. Each promo shows a product image, supplier name, price, and description. Users can tap to view details, like/save, or add items to a note.

### 4.2 Directory (Business & Pros)
Two tabs:
- **Business Directory** — A-Z navigation of registered suppliers. Browse by 27 industry categories or location. View rich profiles with logo, description, contact (WhatsApp, Phone), GPS Google Maps routing, social media links, and opening hours.
- **Pros Directory** — Search for tradespeople by trade category, skill, and location. View profiles with rates (hourly/daily/per-project/quote-based), online/offline status (15-min availability window), portfolio images, and Facebook video links.

### 4.3 Notes Feature (Step-by-Step Guide)

The Notes system is the platform's core utility for project management, budgeting, and quoting.

#### Step-by-Step: Creating and Sharing a Shopping List via WhatsApp

**Step 1: Browse the Promos Feed**
- Open the app. The Promos feed is the default landing view (bottom nav: bullhorn icon).
- Scroll through active deals from hardware stores.
- Each promo card shows: product image, supplier name, price, and unit.

**Step 2: Save an Item to a Note**
- Tap on any promo you're interested in.
- Look for the "Save to Note" button/icon.
- If you have no notes yet, the app prompts you to create one.
- Name your note (e.g., "Phakalane Site Prep" or "Bathroom Renovation").
- The item is saved with its price, supplier name, and description.

**Step 3: Build Your List**
- Continue browsing. Save more items from different suppliers into the same note.
- Each note acts as a smart folder collecting items across multiple suppliers.

**Step 4: Open Your Note & Adjust Quantities**
- Tap the Notes tab (bottom nav: clipboard icon) to see all your notes.
- Tap the note you're working on.
- Inside the note, each saved item shows with + and - buttons.
- Tap + or - to adjust the quantity of each item.
- The app automatically recalculates:
  - Individual item total (price × quantity)
  - Grand total for the entire note (sum of all item totals)
  - Real-time updates as you adjust.

**Step 5: Customise the Note (Optional)**
- Tap the note title to rename it (e.g., "Bathroom Renovation Budget").
- Add a text description with project details.
- Upload a thumbnail image (site photo, blueprint, or reference image).

**Step 6: Share via WhatsApp**
- Tap the green WhatsApp share icon (located in the note).
- Foromane automatically formats the entire note into a clean, professional text message:
  ```
  *Bathroom Renovation*
  Itemised List:
  1. Meranti Planks — P45.00 × 10 = P450.00 (Board Kings)
  2. Dulux Paint (5L) — P320.00 × 2 = P640.00 (BuildIt)
  3. Basin Tap — P180.00 × 1 = P180.00 (Gabs Plumbing)
  Grand Total: P1,270.00
  ```
- WhatsApp opens automatically with the message pre-filled.
- Send to a client, contractor, boss, or supplier.

**Step 7: Manage Multiple Notes**
- Users get 10 free notes.
- Need more? Purchase additional note packs (e.g., 25 notes) via BTC Smega, Mascom Myzaka, or Orange Money.
- Notes sync across devices via Google Drive backup.

### 4.4 VIP & Agent Verification System

To maintain trust and reward active members:
- **Locked Rewards:** VIP Pass and Claim Prize buttons are locked by default.
- **How to Unlock:** Visit a Foromane Agent at partner hardware stores (e.g., Kago Timber, Builders Mart).
- **Agent Portal:** Agents have a secure portal. They search for the user's ID or phone number and tap "Verify".
- **Benefits Once Verified:** Exclusive discounts, early access to promos, ability to redeem Foromane reward tokens.

### 4.5 Analytics (Business Owners)
Businesses see live KPI tracking:
- Views (how many users opened the business profile)
- Likes on promos
- Views today, this week, this month
- Data cached locally and synced to Drive

### 4.6 Staff Management (Businesses)
Business owners can add staff with specific permissions:
- Manage items/catalogue
- Manage promotions
- View analytics
- Granular role-based access

### 4.7 Pricing Engine
Formula-based pricing system for catalogue items:
- **Unit Variable Library:** Each of the 27 categories has predefined units (e.g., per meter, per kg, per bag, per litre)
- **Price Modifiers:** Urgent jobs (+20%), night shift (+50%), weekend (+30%)
- **Tier Rules:** Different pricing tiers for different customer segments
- **Discount Engine:** Promotional discounts applied on top

### 4.8 Google Drive Backup
Every user gets a personal folder structure under `Foromane App Drive/clients/`:
- Subscribers: `users/user_{id}/` with subfolders for profile pictures, notes, documents
- Pros: Additional `pros/pro_{userId}/` for portfolio, promos, catalogue, reviews
- Businesses: Additional `businesses/biz_{businessId}/` for logo, profile, promos, staff, documents
- All synced via SyncQueue with offline queueing

### 4.9 Facebook/Instagram Marketing Artwork Submission
Businesses can submit promotional artwork through the app. Admin reviews and schedules posts on the Foromane Facebook and Instagram pages — creating a marketing calendar.

---

## 5. Offline Modes & Data Usage

Foromane has a **tri-state mode system** controlled by toggle buttons in the app UI:

### 5.1 Online Mode
- **Behaviour:** Fetches all data live from the network (Firebase, Google Drive).
- **Data Usage:** Full data usage — images, catalogue, profiles all streamed.
- **Best for:** Users with strong, reliable internet (WiFi or unlimited data).

### 5.2 Offline Mode
- **Behaviour:** Uses only cached data stored locally on the device. No network requests are made.
- **Data Usage:** Zero data usage. Everything loads from IndexedDB (the app's local database).
- **Best for:** Users with no internet connection, or users who want to conserve data completely.
- **Technical:** The service worker (`sw.js`) uses a cache-first strategy for core assets and runtime caching for images.

### 5.3 Saved Mode (Default)
- **Behaviour:** Uses local data for instant loading, then syncs with the network in the background.
- **Data Usage:** Reduced data usage — only fetches updates/deltas, not full re-downloads.
- **Best for:** Most users. Provides instant UI (no loading spinners) while keeping data fresh in the background.
- **Technical:** On boot, data loads instantly from IndexedDB. A background sync then pulls latest changes from the network and updates the local cache. Changes made offline are queued in SyncQueue and flushed when the connection returns.

### 5.4 Sync Assets Now (Manual Download)
In the account section, users can tap **"Sync Assets Now"** to proactively download all industry icons, category images, and platform assets to their device. Once downloaded:
- The app works beautifully with zero data usage for images/icons
- All 27 category icons are stored locally
- Business logos and promo images are cached on first view

### 5.5 How the Sync Queue Works

```
[OFFLINE]
User creates/edits data → saved to IndexedDB instantly (no network)
→ Mutation queued in SyncQueue (foromane-sync IndexedDB store)

[ONLINE — auto-detected]
window 'online' event fires → SyncQueue.flush() iterates queued items
→ DriveAPI writes to Google Drive → item removed from queue on success

[APP BOOT — first visit]
IndexedDB empty → DriveAPI downloads all JSON files → saved to IndexedDB → rendered

[APP BOOT — returning visit]
IndexedDB has data → renders instantly (zero load time)
→ Background: sync pulls latest changes → updates IndexedDB
```

### 5.6 PWA Installation
- The app is installable on any phone via the browser (Android Chrome).
- Once installed to the home screen, it opens in standalone mode (no browser chrome).
- Splash screen uses the Foromane brand colour (#fd7600 / orange).
- Full offline support even when installed.

---

## 6. Monetisation Model

| Revenue Stream | Description | Target |
|---|---|---|
| **Promotion Boosts** | Businesses get 12 free promo boosts per cycle; additional boosts can be purchased | Business Suppliers |
| **Note Packs** | 10 free notes per user; additional notes purchased in packs (e.g., 25 notes) via mobile money | General Users |
| **Business Listings** | Subscription tiers for business profiles (directory, featured, premium) | Business Suppliers |
| **Pro Subscriptions** | Tradespeople pay for pro profiles with portfolio hosting | Tradespeople |
| **Storage Billing** | Google Drive storage for client data (profile pics, notes, documents, promos, catalogues) | All paying tiers |
| **Marketing Services** | Admin-run Facebook/Instagram promotion of business artwork (submitted through app) | Business Suppliers |

### Payment Methods Accepted
- BTC Smega
- Mascom Myzaka
- Orange Money
- Bank Transfer

### Tier Rules Summary

| Tier | Drive Folder Scope | Drive Footprint |
|---|---|---|
| **Browser** | None | Zero storage |
| **Subscriber** | `users/user_{id}/` | Profile pic, notes, JSON files |
| **Pro** | `users/user_{id}/` + `pros/pro_{userId}/` | Subscriber data + portfolio, promos, catalogue, reviews |
| **Business** | `users/user_{id}/` (owner) + `businesses/biz_{businessId}/` | Owner data + logo, promos, catalogue, staff, documents |

---

## 7. Technical Architecture (High-Level)

### Stack
- **Frontend:** Vanilla JavaScript PWA (no framework — single-page app)
- **Storage:** IndexedDB (local, offline-first), Google Drive API (cloud backup), Firebase Firestore (business data sync)
- **Service Worker:** Custom `sw.js` with app-shell caching, runtime cache, background sync
- **Sync Engine:** Custom `SyncQueue` class (IndexedDB-backed, exponential backoff retry, idempotency-key deduplication)
- **Authentication:** Guest session IDs, phone-based registration, admin credentials
- **Location Data:** Built-in GPS coordinates for 12 Botswana towns + hierarchical location tree (district → town → neighbourhood)
- **Asset Hosting:** Firebase Storage CDN with an asset URL resolver
- **Categories:** 27 top-level categories with multi-level subcategories (6,175 lines of taxonomy data)

### Key Architectural Decisions
- **No build step:** Raw HTML/CSS/JS served directly (can be hosted on any static server)
- **Offline-first:** All data writes go to IndexedDB first, sync to cloud happens asynchronously
- **Cache-first for assets:** Service Worker serves cached images instantly, updates in background
- **Idempotent sync:** Every sync item has a unique `Idempotency-Key` so the server can deduplicate safely

---

## 8. Competitive Advantages

| Advantage | Detail |
|---|---|
| **Offline-first** | Works without internet — unique for a marketplace in Africa where data is expensive |
| **Local focus** | Deep Botswana market knowledge, GPS-mapped towns, hierarchical location data |
| **27 categories** | Comprehensive coverage of the entire construction supply chain |
| **No app store needed** | PWA installs directly from the browser — no Google Play fees, no approval process |
| **WhatsApp integration** | Sharing lists via WhatsApp is natural for the target market (WhatsApp is dominant in Botswana) |
| **Pricing engine** | Formula-based pricing with modifiers (urgent, night shift, weekend) — tailored to local trade norms |
| **Hybrid Cloud-Local** | Blazing fast UI from local cache + cloud backup for cross-device sync |
| **Agent network** | Physical verification at partner hardware stores creates real-world trust and foot traffic for partners |
| **Low data mode** | Users control exactly how much data they use with tri-state mode selection |
| **Multi-tenant** | Single codebase serves guests, subscribers, pros, businesses, and admins |

---

## 9. Marketing Channels

| Channel | Mechanism |
|---|---|
| **In-app artwork submission** | Businesses submit promo art → Admin posts to Foromane Facebook & Instagram |
| **WhatsApp viral loop** | Every shared note carries the Foromane brand and drives new user discovery |
| **Agent network** | Partner hardware stores verify VIP users → drives foot traffic and word-of-mouth |
| **Directory listings** | Businesses listed in the directory get free visibility → invite their customers to use the app |
| **Promo feed** | Time-limited deals create urgency and repeat engagement |
| **Blogs** | Practical articles ("How to choose the right paint", "Timber selection guide") drive SEO and organic discovery |
| **Pro profiles** | Tradespeople share their Foromane profile link on business cards, Facebook, etc. |

---

## 10. FAQ

**Q: Do I need internet to use Foromane?**
A: You need internet to sync the latest promos and profiles initially. But once data is cached, the app works fully offline — you can browse saved promos, manage notes, and calculate budgets without using any mobile data.

**Q: How do I calculate my construction project cost?**
A: Browse the Promos feed, save the materials you need to a Note, adjust quantities with the +/- buttons, and Foromane automatically calculates the grand total.

**Q: How do I share my project budget with a client?**
A: Open your compiled Note and tap the green WhatsApp share icon. Foromane generates a professional, itemised list with prices, quantities, supplier names, and totals — ready to send.

**Q: Why are my VIP Pass and Claim Prize buttons locked?**
A: VIP rewards are for verified users. Visit a Foromane Agent at any partner hardware store (e.g., Kago Timber, Builders Mart) and ask them to verify your account.

**Q: How do I get my business listed?**
A: Submit your business details (Name, Category, Town, GPS link, Social Media, Logo, Banner) through the app's onboarding form. A Foromane Administrator reviews and approves it — then it goes live in the Directory instantly.

**Q: Can I see how many people view my business profile?**
A: Yes. Foromane features Live KPI Tracking. Every time a user opens your profile, your "Views" counter increments in real-time.

**Q: How do I pay for Promos or more Notes?**
A: Foromane supports local mobile money — BTC Smega, Mascom Myzaka, and Orange Money. The app provides payment details and prompts you to send proof of payment via WhatsApp.

**Q: What happens if I switch phones?**
A: Your data is backed up to Google Drive. When you log in on a new device, your notes, favourites, and profile sync down automatically.

---

## 11. Key Metrics to Track

| Metric | Why It Matters |
|---|---|
| Number of listed businesses | Supply-side liquidity |
| Number of active promos | Marketplace activity level |
| Notes created per user | Core engagement metric — indicates users are finding the workflow valuable |
| WhatsApp shares per note | Viral coefficient — organic acquisition driver |
| VIP verifications | Agent network effectiveness |
| Online vs Offline mode usage | Data cost sensitivity of the user base |
| Promo views and likes | Ad effectiveness for business suppliers |
| PWA installs | User commitment and retention |

---

## 12. App Views & Navigation

The app has four main views, accessible from the bottom navigation bar:

| Nav Tab | View ID | Icon | Content |
|---|---|---|---|
| Promos | `view-promos` | Bullhorn | Promotional deals feed |
| Directory | `view-directory` | Address Book | Business & Pros directory with A-Z navigation, category/location filters |
| Notes | `view-notes` | Clipboard | User's shopping lists / project notes |
| Account | `view-account` | User Circle | Profile, settings, sync controls, VIP status, payment proofs |

---

## 13. Business Onboarding Flow

1. User registers as "Business & Materials Supplier"
2. Fills business profile (name, logo, description, categories, location)
3. Data syncs to Firebase → status: `pending_approval`
4. Admin reviews and approves via the Admin dashboard
5. Business appears in Directory → owner can post promos, add catalogue, manage staff, view analytics
6. Business can submit promotional artwork for Facebook/Instagram via the app

---

## 14. Data Architecture

### Local Storage (IndexedDB)
- **Database name:** `foromane-supply-solutions` (main app data)
- **Database name:** `foromane-sync` (sync queue store)
- **Cached data:** Business profiles, promos, catalogue items, user data, blog articles, location data

### Cloud Storage
- **Firebase Firestore:** Business submissions, user registrations, promo approvals
- **Firebase Storage:** Business logos, promo images, catalogue photos
- **Google Drive:** Per-user folder structure with JSON blobs and media files (for cross-device sync)

### Service Worker Cache
- **CORE_ASSETS:** App shell files (JS, CSS, HTML) — precached on install
- **Runtime cache:** Images (cache-first), API requests (network-first), other assets (stale-while-revalidate)
