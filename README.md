# 👟 SOLEKICKS PK

Premium Streetwear Sneaker E-Commerce Platform.

## 🚀 Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js 5
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe & Cash on Delivery (COD)

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
npx prisma migrate dev
```
*(Optional)* Seed the database with initial data if a seed script exists:
```bash
npm run seed
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
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```
Start the frontend development server:
```bash
npm run dev
```
The storefront will be available at `http://localhost:3000`.

## 🛒 Key Features
- **Guest-first Shopping**: Add to cart, view wishlist, and checkout without signing up.
- **Admin Dashboard**: Manage products, orders, coupons, and users.
- **Advanced Cart**: Stock decrement validation, percentage & flat coupons.
- **Order Tracking**: Visual status timeline for guests and logged-in users.
