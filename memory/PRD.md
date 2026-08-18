# SOLEKICKS PK — Product Requirements Document

## Original Problem Statement
Build a complete, production-grade single-vendor sneaker/shoe e-commerce platform for a Pakistan streetwear brand (reference: jutay.co). Premium, motion-rich UI. Guest cart/wishlist/checkout with NO account required (hard requirement). Full catalog, filters, product detail, checkout, orders, tracking, user dashboard, and admin dashboard.

## Stack (adapted to Emergent platform)
- Requested: Next.js + Express + Postgres + Prisma + PayFast + Cloudinary
- Built on: **React (CRA) + Tailwind + Framer Motion** frontend, **FastAPI + MongoDB** backend, **Stripe + COD** payments, **Emergent object storage**, **JWT auth**. (Platform is fixed to React/FastAPI/MongoDB; Next.js/Express/Postgres/PayFast not supported.)

## User Personas
- **Guest shopper** (primary): browses, adds to cart/wishlist, checks out with COD — no signup.
- **Registered customer**: order history, tracking, saved wishlist/cart (merged on login).
- **Store owner/admin**: manages products, orders, coupons, reviews, customers, analytics.

## Core Requirements (static)
- Guest-capable cart & wishlist (x-guest-id header), merge into account on login.
- PKR pricing, Pakistan cities, COD-first + wallet + card payment options.
- Premium streetwear aesthetic (obsidian/off-white/fire-red), Framer Motion throughout.

## Implemented — Phase 1 (2026-08-18)
- **Backend** (`server.py`): auth (JWT register/login/me/logout), catalog (products+filters/sort/search, categories, brands, reviews), guest cart (add/update/remove/merge), guest wishlist (add/remove/merge), checkout (shipping-estimate, apply-coupon), orders (create w/ atomic stock decrement + unique order#, guest phone lookup, cancel), Stripe payments (checkout/status/webhook), newsletter, settings, hero slides, object-storage upload, full admin (analytics, product CRUD, order status, coupons, reviews moderation, customers block, hero slides, settings). Auto-seeds admin, test customer, 16 products, 4 categories, 4 brands, 3 hero slides, 3 coupons, reviews, PK shipping zone.
- **Frontend**: Home (hero slider, trust ribbon, category bento, flash-sale countdown, new arrivals, shop-by-size, best sellers, reviews, SEO block), Collection (filters + sort + mobile bottom-sheet), Product detail (gallery, variant select, tabs, related, sticky mobile buy bar), Cart page + slide-in Cart Drawer, Wishlist, guest Checkout (coupon + payment methods), Order confirmation + timeline, Track order, Login/Register, Account dashboard, Admin dashboard (charts + tables + add-product modal), static pages. Sticky animated header, marquee announcement bar, mobile bottom nav.
- **Testing**: 36/36 backend tests pass; frontend critical flows (guest COD checkout end-to-end, admin) verified.

## Implemented — Phase 2 (2026-08-18)
- **Returns + Refunds + Store Credit**: customer return requests (auth or guest-by-phone); admin approve/reject with state guard; refunds via STORE_CREDIT / BANK_TRANSFER / PAYFAST_ORIGINAL(mock) with refundable-amount validation, partial refunds, cascade to payment_status='refunded' & order 'returned' only on full refund; store-credit wallet + ledger, redeemable at checkout. Endpoints: /me/store-credit, /checkout/apply-store-credit, /orders/{id}/return-request, /admin/returns(+moderate), /admin/orders/{id}/refund, /admin/refunds.
- **Advance-payment-on-COD**: orders ≥ Rs.20,000 require 10% advance (partially_paid), UI notice + summary breakdown at checkout.
- **Admin image uploads**: product + hero-slide image upload to Emergent object storage (served via /api/files/{path}); CMS tab for hero slides.
- **WhatsApp alerts**: click-to-chat wa.me buttons (order confirmation + admin per-order) + logged notification service (ORDER_PLACED/STATUS_UPDATE/RETURN/REFUND) at /api/admin/notifications — structured to swap in Twilio later.
- **Testing**: 13/13 Phase-2 backend tests + full frontend flows verified.

## Backlog / Remaining (future phases)
- **P1**: Store credit + ledger; refund flows (Stripe/bank/store-credit); return requests; advance-payment-on-COD rule UI; multi-address book; PayFast (custom, if self-hosting).
- **P1**: Admin CMS (banner manager, static page editor), shipping-zones CRUD UI, staff roles, CSV import/export, invoice PDF.
- **P2**: Product image upload UI in admin (backend endpoint exists), review photo uploads, blog, store locator, SEO sitemap/JSON-LD, email/SMS notifications (currently stubbed).

## Notes / Mocked
- WALLET (JazzCash/EasyPaisa) is MOCKED (instant paid, no real gateway).
- Card via Stripe test key in USD (COD is the primary real flow).
- Auth token stored in localStorage (Bearer); CORS allow_credentials=False.

## Next tasks
Refunds + store credit; advance-payment rule; admin CMS + image upload UI.
