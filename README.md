# 👟 SOLEKICKS PK

A Premium Streetwear & Sneaker E-Commerce Platform tailored for the Pakistani market. Features a dynamic Storefront CMS, comprehensive admin dashboard, and localized payment/shipping workflows.

## 🚀 Tech Stack

- **Frontend**: React 18 (Vite), React Router DOM, Tailwind CSS, Framer Motion, Recharts, Lucide React
- **Backend**: Node.js, Express.js 5
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe & Cash on Delivery (COD)

## 🛒 Key Features

### Storefront & Customer Experience
- **Dynamic Storefront CMS**: Drag-and-drop homepage builder, scheduled flash sales, promo banners, and dynamic category layouts.
- **Guest-first Shopping**: Add to cart, view wishlist, and checkout smoothly without being forced to sign up.
- **Advanced Cart**: Real-time stock decrement validation, percentage & flat rate coupon application.
- **Customer Portal**: Order tracking, visual status timelines, returns management, and verified product reviews.

### Admin Dashboard
- **Analytics & KPIs**: Real-time revenue charts, conversion metrics, and top-selling products.
- **Order & Inventory Management**: Processing workflows, stock tracking, and shipping updates.
- **Returns & Refunds Module**: Dedicated workflows to manage customer returns, process financial refunds, and restock inventory.
- **Coupons Engine**: Create flat or percentage-based discount codes with usage limits.
- **Storefront CMS Panel**: Control website layout, marketing banners, testimonials, and static pages (Privacy, About) entirely without code.

## 🛠️ Setup Guide

### Prerequisites
- Node.js (v18+)
- PostgreSQL database

### 1. Database Setup
1. Create a local PostgreSQL database (e.g., `sneakpk`).
2. Ensure your PostgreSQL server is running.

### 2. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
npm install
```
Configure your environment variables in `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sneakpk?schema=public"
JWT_SECRET="your_jwt_secret"
PORT=8000
```
Run Prisma migrations to create the tables:
```bash
npx prisma db push
```
Start the backend development server:
```bash
npm run dev
```
The API will be available at `http://localhost:8000`.

### 3. Frontend Setup
Navigate to the `frontend` directory in a new terminal:
```bash
cd frontend
npm install
```
Configure your environment variables in `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```
Start the frontend development server:
```bash
npm run dev
```
The storefront will be available at `http://localhost:3000` (or the port specified by Vite/CRA).
