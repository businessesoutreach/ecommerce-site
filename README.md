# 👟 SOLEKICKS PK

A Premium Streetwear & Sneaker E-Commerce Platform tailored for Pakistan, built with **Next.js 16 (App Router)** and **Express 5**. Features localized payment options (Safepay PK, Cash on Delivery with advance payments), a dynamic Storefront CMS, and a native mobile-ready admin dashboard.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router), React 19
- **Bundler & Tooling**: Turbopack, TypeScript runtime support
- **Styling**: Tailwind CSS, Framer Motion, Lucide Icons, Recharts
- **Components**: Radix UI / shadcn style primitives

### Backend
- **Runtime & Server**: Node.js (v20+), Express.js 5
- **ORM & Database**: Prisma ORM v6, PostgreSQL (Local & Supabase)
- **Security**: Helmet, Express Rate Limit, JWT (HS256) with strict auth checks, Cryptographically secure PRNG (`crypto.randomInt`)
- **Payments**: Safepay PK Checkout & Webhooks, Cash on Delivery (COD) with partial advance rules
- **Media & Storage**: Cloudinary SDK
- **Communications**: Nodemailer (SMTP) for transactional order confirmations & OTP signup

---

## 🛒 Key Features

### Storefront & Customer Experience
- **Dynamic Storefront CMS**: Configurable homepage layout, hero slider, flash sales, promo banners, and category collections.
- **Guest-First & Account Checkout**: Direct guest checkout or passwordless OTP account verification.
- **Localized Pakistani Payments**: Cash on Delivery (COD) with customizable advance payment rules, and Safepay PK (Credit/Debit cards, mobile wallets).
- **Customer Self-Service**: Live order tracking timeline, verified product feedback/reviews, returns and refund requests.

### Admin Dashboard & Operations
- **Mobile-App Feel**: App-style bottom tab bar and slide-up action sheet optimized for small screens and desktop.
- **Order Management & Shipping**: Dispatch workflows, courier integration, and payment verification.
- **Profitability & Performance Analytics**: Revenue metrics, AOV, order volume trends, and custom date range filters.
- **Store Settings & Branding**: Dynamic SVG/PNG logo & favicon manager with instant light/dark canvas preview.
- **Full Audit Logging**: Searchable and inspectable activity trail capturing admin operations and payload diffs.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v20 or higher recommended)
- PostgreSQL database (Local or Supabase)

### 1. Backend Setup
1. Open a terminal in `backend`:
   ```bash
   cd backend
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
3. Initialize the Prisma database schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   API runs at `http://localhost:8000`.

### 2. Frontend Setup
1. Open a terminal in `frontend`:
   ```bash
   cd frontend
   npm install
   ```
2. Configure `.env.local` (or `.env`):
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Storefront and Admin will be accessible at `http://localhost:3000`.
