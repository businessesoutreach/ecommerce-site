<div align="center">

# 👟 SOLEKICKS PK

### Premium Streetwear Sneaker E‑Commerce Platform

*Bold, youthful, urban — a production-grade single-vendor sneaker store built for Pakistan's streetwear culture.*

`React` · `FastAPI` · `MongoDB` · `Tailwind CSS` · `Framer Motion` · `Stripe`

![Status](https://img.shields.io/badge/status-live-FF3B30?style=flat-square)
![Frontend](https://img.shields.io/badge/frontend-React_18-0A0A0A?style=flat-square)
![Backend](https://img.shields.io/badge/backend-FastAPI-0A0A0A?style=flat-square)
![DB](https://img.shields.io/badge/database-MongoDB-6B7280?style=flat-square)
![Payments](https://img.shields.io/badge/payments-Stripe_+_COD-FF3B30?style=flat-square)

</div>

---

## 📖 Table of Contents

1. [Overview](#-overview)
2. [Feature Highlights](#-feature-highlights)
3. [Tech Stack](#-tech-stack)
4. [Architecture](#-architecture)
5. [Design System](#-design-system)
6. [Data Model](#-data-model)
7. [API Reference](#-api-reference)
8. [Project Structure](#-project-structure)
9. [Getting Started](#-getting-started)
10. [Environment Variables](#-environment-variables)
11. [Seed Data & Credentials](#-seed-data--credentials)
12. [Bulk Import (CSV)](#-bulk-import-csv)
13. [Roadmap](#-roadmap)

---

## 🎯 Overview

**SOLEKICKS PK** is a complete, premium sneaker/streetwear e‑commerce platform designed for the Pakistani market. It delivers a fast, motion‑rich storefront with **guest‑first shopping** (no signup required to browse, add to cart, wishlist, or checkout), a full **customer account** area, and a comprehensive **admin dashboard** for running the business end‑to‑end.

> **Art direction:** near‑black `#0A0A0A` + off‑white `#FAFAFA` canvas, one surgical red‑orange accent `#FF3B30`, heavy condensed grotesk typography, sharp editorial cards, and generous whitespace — designed to feel like a real premium sneaker brand, not a template.

---

## ✨ Feature Highlights

### 🛍️ Storefront
| Feature | Description |
|---|---|
| **Cinematic Hero** | Auto‑rotating hero slider + full‑bleed muted **video banner** with poster fallback |
| **Editorial Lookbook** | Bold split‑screen lifestyle banners pushing featured drops |
| **Flash Sale** | Live countdown timer section driven by DB flags |
| **Merchandised Sections** | New Arrivals, Best Sellers, Shop‑by‑Size, category bento grid |
| **Product Cards** | Hover image‑swap, sale badges, size chips, quick‑add, wishlist heart, sold‑out state |
| **Product Detail** | Multi‑photo gallery (click‑to‑swap), variant/size selector, reviews, related products |
| **Search** | Animated overlay with live results |
| **Trust & Reviews** | Value‑prop ribbon, verified customer reviews, rich SEO content block |

### 🛒 Commerce
| Feature | Description |
|---|---|
| **Guest Cart & Wishlist** | Fully functional with **zero signup** via `x-guest-id`; merges into account on login |
| **Cart Drawer** | Slide‑in panel with free‑shipping progress bar |
| **Guest Checkout** | Name / phone / address, coupons, multiple payment methods |
| **Coupons** | Percentage & flat discounts with min‑order / usage / expiry rules |
| **Advance Payment Rule** | Orders ≥ Rs 20,000 on COD require a 10% advance (jutay‑style) |
| **Atomic Stock** | Guarded, transactional stock decrement to prevent overselling |
| **Order Tracking** | Guest lookup by order # + phone with a visual status timeline |
| **Returns → Refunds → Store Credit** | Return requests, admin refunds (store credit / bank transfer / gateway), redeemable wallet + ledger |
| **Multi‑Address Book** | Signed‑in shoppers save & reuse delivery addresses at checkout |
| **WhatsApp Alerts** | Click‑to‑chat order updates + logged notification service (Twilio‑ready) |

### 💳 Payments
- **Cash on Delivery (COD)** — primary, fully functional
- **Stripe** — real card payments (checkout session + webhook confirmation)
- **JazzCash / EasyPaisa Wallet** — *mocked* instant confirmation for demo

### 🛠️ Admin Dashboard (`/admin`)
Analytics (revenue, orders, AOV, charts, low‑stock) · Product CRUD with **multi‑photo drag‑reorder gallery** · **CSV bulk import + template download** · Orders & status management · Returns & Refunds · Coupons · Review moderation · Customers (block/unblock) · Hero & CMS image manager.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (CRA), React Router, Tailwind CSS, Framer Motion, Recharts, lucide‑react, sonner |
| **Backend** | FastAPI (Python), Motor (async MongoDB), Pydantic, PyJWT, bcrypt |
| **Database** | MongoDB |
| **Payments** | Stripe (via `emergentintegrations`) + Cash on Delivery |
| **Storage** | Emergent Object Storage (product & hero images) |
| **Auth** | JWT (Bearer token) + guest identity header |

---

## 🏗️ Architecture

```
                          ┌──────────────────────────────────────┐
                          │            React SPA (CRA)            │
                          │  Storefront · Account · Admin panel   │
                          │  Tailwind · Framer Motion · Recharts  │
                          └───────────────┬──────────────────────┘
                                          │  REST /api/*  (Bearer + x-guest-id)
                                          ▼
                          ┌──────────────────────────────────────┐
                          │              FastAPI API              │
                          │  Auth · Catalog · Cart · Orders ·     │
                          │  Payments · Returns/Refunds · Admin   │
                          └──────┬───────────────┬────────────────┘
                                 │               │
                    ┌────────────▼───┐    ┌──────▼───────────┐    ┌──────────────┐
                    │    MongoDB     │    │  Stripe Gateway  │    │ Object Store │
                    │  (collections) │    │  (checkout/IPN)  │    │   (images)   │
                    └────────────────┘    └──────────────────┘    └──────────────┘
```

**Request rules**
- Frontend calls the backend only via `REACT_APP_BACKEND_URL` and every API route is prefixed with **`/api`**.
- Guests send an `x-guest-id` header; authenticated users send `Authorization: Bearer <token>`.
- On login/register, the guest cart & wishlist are **merged** into the user account.

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| **Obsidian** | `#0A0A0A` | Dominant background / text |
| **Canvas** | `#FAFAFA` | Off‑white surface |
| **Fire (accent)** | `#FF3B30` | Sale badges, primary CTAs, active states, price emphasis **only** |
| **Ink 500 / 200** | `#6B7280` / `#E5E7EB` | Secondary text & borders |

- **Headings:** `Archivo` — heavy 700–900, tight tracking, uppercase labels
- **Body:** `Inter` · **Numerals/labels:** `JetBrains Mono`
- **Corners:** sharp (`rounded-none`), 1px framed cards — deliberately no pill buttons
- **Spacing:** 8px scale, generous section rhythm
- **Motion:** page fade/slide transitions, hover image‑swaps, sliding cart drawer, scroll reveals, shrinking sticky header, shimmer skeletons

---

## 🗄️ Data Model

MongoDB collections (documents use string UUID `id` fields — no raw `ObjectId` is exposed):

| Collection | Purpose |
|---|---|
| `users` | Accounts (customer / admin / staff), bcrypt password hashes |
| `products` | Catalog with embedded `sizes[]` (stock) and ordered `images[]` |
| `categories`, `brands` | Taxonomy |
| `carts`, `wishlists` | Keyed by **either** `user_id` **or** `guest_id` |
| `orders` | Snapshot items, totals, payment/status, status history |
| `coupons` | Discount codes |
| `reviews` | Customer reviews (moderated) |
| `addresses` | Saved delivery addresses (per user) |
| `return_requests`, `refunds` | Returns & refund audit trail |
| `store_credit`, `store_credit_ledger` | Wallet balance + transaction history |
| `hero_slides`, `settings` | CMS & global store settings |
| `newsletter`, `notifications`, `payment_transactions` | Subscribers, WhatsApp/notify log, Stripe txns |

---

## 🔌 API Reference

Base URL: `${REACT_APP_BACKEND_URL}/api` · Response shape: `{ success, data, error }`

<details>
<summary><b>Auth</b></summary>

```
POST   /auth/register      POST /auth/login      GET /auth/me      POST /auth/logout
```
</details>

<details>
<summary><b>Catalog (public)</b></summary>

```
GET /products               (filters: category, brand, size, flag, min/max_price, sort, search, page)
GET /products/{slug}        GET /products/{id}/related       GET /products/{id}/reviews
POST /products/{id}/reviews
GET /categories             GET /categories/{slug}           GET /brands
GET /search?q=              GET /settings                    GET /hero-slides
```
</details>

<details>
<summary><b>Cart & Wishlist (guest + user)</b></summary>

```
GET /cart   POST /cart/items   PATCH /cart/items/{id}   DELETE /cart/items/{id}   POST /cart/merge
GET /wishlist   POST /wishlist/items   DELETE /wishlist/items/{product_id}   POST /wishlist/merge
```
</details>

<details>
<summary><b>Checkout & Orders</b></summary>

```
POST /checkout/shipping-estimate   POST /checkout/apply-coupon   POST /checkout/apply-store-credit
POST /orders                       GET  /orders                  GET  /orders/{order_number}?phone=
POST /orders/{id}/cancel           POST /orders/{id}/return-request
```
</details>

<details>
<summary><b>Payments</b></summary>

```
POST /payments/stripe/checkout    GET /payments/status/{session_id}    POST /webhook/stripe
```
</details>

<details>
<summary><b>Account (auth)</b></summary>

```
GET /me/store-credit
GET/POST/PATCH/DELETE /me/addresses
```
</details>

<details>
<summary><b>Admin (role: admin/staff)</b></summary>

```
GET  /admin/analytics/overview
GET/POST/PATCH/DELETE /admin/products      POST /admin/products/import      POST /admin/upload
GET  /admin/orders     PATCH /admin/orders/{id}/status
GET  /admin/returns    PATCH /admin/returns/{id}
POST /admin/orders/{id}/refund             GET /admin/refunds
GET/POST/DELETE /admin/coupons             GET/PATCH /admin/reviews
GET  /admin/customers  PATCH /admin/customers/{id}/block
GET/POST/DELETE /admin/hero-slides         PATCH /admin/settings
GET  /admin/notifications
```
</details>

---

## 📁 Project Structure

```
/app
├── backend/
│   ├── server.py            # FastAPI app — all routes, auth, payments, admin, seed
│   ├── seed_data.py         # Demo catalog (products, categories, brands, hero slides)
│   ├── requirements.txt
│   └── .env                 # MONGO_URL, DB_NAME, JWT_SECRET, STRIPE_API_KEY, ...
├── frontend/
│   ├── src/
│   │   ├── App.js           # Routes + page transitions
│   │   ├── index.css        # Design tokens & fonts
│   │   ├── context/StoreContext.jsx   # Cart, wishlist, auth, settings
│   │   ├── lib/api.js       # Axios instance, guest id, currency helpers
│   │   ├── components/      # Header, Footer, HeroSlider, ProductCard, CartDrawer, common
│   │   └── pages/           # Home, Collection, ProductDetail, Cart, Checkout,
│   │                        # OrderConfirmation, TrackOrder, Auth, Account, Admin, StaticPage
│   ├── package.json
│   └── .env                 # REACT_APP_BACKEND_URL
└── README.md
```

---

## 🚀 Getting Started

> Services are managed by **supervisor** and start automatically. Use the commands below only to install deps or restart after `.env` changes.

### Backend
```bash
cd /app/backend
pip install -r requirements.txt
sudo supervisorctl restart backend
```

### Frontend
```bash
cd /app/frontend
yarn install          # always use yarn, never npm
sudo supervisorctl restart frontend
```

### Verify
```bash
# Backend health
curl "$REACT_APP_BACKEND_URL/api/products?limit=1"

# Tail logs if a service won't start
tail -n 100 /var/log/supervisor/backend.*.log
```

Storefront → `/` · Customer account → `/account` · Admin → `/admin/login`

---

## 🔐 Environment Variables

**`backend/.env`**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=solekicks_db
JWT_SECRET=<random-secret>
ADMIN_EMAIL=sahilwaheed48@gmail.com
ADMIN_PASSWORD=Admin@12345
STRIPE_API_KEY=<stripe-key>
EMERGENT_LLM_KEY=<object-storage-key>
```

**`frontend/.env`**
```
REACT_APP_BACKEND_URL=https://<your-app>.preview.emergentagent.com
```

> ⚠️ Never hardcode URLs/keys in code. The frontend must use `REACT_APP_BACKEND_URL`; the backend must use `MONGO_URL` / `DB_NAME`.

---

## 🌱 Seed Data & Credentials

On first boot the backend seeds an admin, a demo customer, 16 products, 4 categories, 4 brands, 3 hero slides, 3 coupons, sample reviews, and a PK shipping zone.

| Role | Email | Password |
|---|---|---|
| 🛡️ **Admin** | `sahilwaheed48@gmail.com` | `Admin@12345` |
| 👤 **Customer** | `customer@test.com` | `Test@12345` |

**Demo coupons:** `STREET15` (15% off ≥ Rs 9,999) · `JUTAY10` (10% off) · `FLAT500` (Rs 500 off ≥ Rs 5,000)

---

## 📦 Bulk Import (CSV)

Admin → **Products** → **Template .CSV** downloads a ready‑to‑fill file, then **Import CSV** upserts by `slug`.

**Columns**
```
name, slug, category_slug, brand_slug, base_price, compare_at_price,
description, images (pipe| separated), is_new_arrival, is_best_seller, is_flash_sale
```

**Example row**
```
Air Zoom Sample,air-zoom-sample,runners,cloudstride,7999,11999,Sample product,https://img/a.jpg|https://img/b.jpg,yes,no,no
```
> First image = **cover**, second = **hover‑swap**. Import returns created/updated counts + row errors.

---

## 🗺️ Roadmap

- [ ] Real WhatsApp sending via Twilio (service is already abstracted)
- [ ] Self‑hosted branded hero video in object storage
- [ ] CSV import preview before commit
- [ ] Partial store‑credit control at checkout
- [ ] Per‑city shipping rates & COD limits
- [ ] Invoice PDF generation, staff roles, sitemap/JSON‑LD SEO, email (SMTP) notifications

---

<div align="center">

### Built with ❤️ for Pakistan's sneaker culture

**SOLEKICKS PK** — *Cop with confidence.*

</div>
