# Solekicks - Exhaustive Feature List

This document provides a highly detailed, comprehensive breakdown of every feature, module, and capability built into the Solekicks E-Commerce platform.

## 🛍️ Customer Experience (Frontend)
*   **Modern UI & Micro-interactions**: Built with React and Framer Motion for buttery-smooth animations, page transitions, and hover effects.
*   **Dynamic Homepage**:
    *   **Hero Slider**: Dynamic carousel showcasing premium campaigns with links and calls-to-action.
    *   **Announcement Bar**: Auto-scrolling marquee for urgent messages or global discounts.
    *   **Categorized Sections**: Display blocks for New Arrivals, Flash Sales (with countdown timers), and Trending items.
*   **Catalog & Navigation**:
    *   **Product Categories**: Dedicated routes for Retro, Streetwear, Runners, Slides, etc.
    *   **Advanced Live Search**: Instant search overlay filtering products by name and displaying thumbnails/prices in real-time.
*   **Product Detail Pages (PDP)**:
    *   Multi-image galleries with high-resolution viewing.
    *   Dynamic size selectors checking real-time stock availability.
    *   Detailed HTML descriptions.
*   **Persistent Shopping Cart**: 
    *   Slide-out cart drawer tracking items without page refreshes.
    *   Automatic subtotal calculation.
*   **Wishlist System**:
    *   Save favorite products.
    *   Seamless transition of wishlists from Guest sessions to Authenticated User accounts.
*   **Customer Accounts & Authentication**:
    *   Secure OTP-based signup and password resets.
    *   JWT-based session management.
    *   Customer Dashboard to view complete order history, saved addresses, and profile details.
    *   Store Credit display for loyalty/refund tracking.

## 🛒 Checkout, Pricing, & Payments
*   **Dynamic Shipping & Delivery Charges**:
    *   Cart subtotal logic to automatically apply delivery charges if the order is below a specific threshold (e.g., Free shipping over Rs. 5000, otherwise flat fee).
    *   Geographic shipping zones configuration.
*   **Multi-Gateway Payment Support**:
    *   **Stripe**: Secure credit/debit card processing (configured to charge correctly in PKR).
    *   **PayFast**: Local Pakistani payment gateway integration for seamless domestic bank transfers and wallets.
    *   **Cash on Delivery (COD)**: Traditional pay-at-doorstep option.
*   **Advance Payment Logic**:
    *   Automated requirement for advance payments on high-value COD orders (e.g., 20% advance if order > Rs. 10,000) to mitigate risk.
*   **Discounts & Coupons**:
    *   Support for percentage and flat-rate coupon codes.
    *   Minimum order value constraints and usage limits per coupon.
    *   Store Credit application at checkout.
*   **Automated Order Confirmation**: 
    *   Customers receive beautiful, branded emails immediately after a successful checkout (via Nodemailer/SMTP).

## 📦 Logistics, Tracking & Returns
*   **Live TCS Courier Integration**: 
    *   Direct API connection with TCS for real-time logistics tracking and automated AWB (Airway Bill) generation.
*   **Customer Tracking Portal**: 
    *   A dedicated `/track-order` page where customers enter their Order Number to see a visual, real-time timeline of their parcel's journey (*Packed* ➔ *Dispatched* ➔ *Out for Delivery* ➔ *Delivered*).
*   **Automated Status Syncing**: 
    *   Backend synchronization of courier delivery statuses directly into the local database order records.
*   **Returns & Refunds System**:
    *   Structured Return Request workflow for customers.
    *   Refund ledger to track processed refunds and store credit issuances.

## 📝 Content Management System (CMS Handling)
The backend features a fully integrated CMS allowing admins to control the storefront layout and content without touching code:
*   **Homepage Sections Manager**: Toggle, reorder, and configure specific blocks (Hero, Categories, New Arrivals).
*   **Hero Slider & Promo Banners**: Upload imagery, set text, define button links, and schedule start/end dates for promotional banners.
*   **Static Pages**: Create and edit Markdown/HTML content for pages like Privacy Policy, Terms of Service, and About Us.
*   **Global Settings Configuration**:
    *   Toggle Payment Methods (turn COD/Stripe/PayFast on or off).
    *   Update Global Shipping Fees and Free Shipping Thresholds.
    *   Edit Announcement Bar text.
    *   Manage Flash Sale global countdown timers.
*   **SEO Management**: Configure default Meta Titles, Descriptions, and OpenGraph (OG) images for optimal search engine ranking.
*   **Testimonials**: Add, edit, and publish customer testimonials.

## 🛡️ Admin Dashboard (Store & Catalog Management)
*   **Comprehensive Order Management**:
    *   View all orders, customer details, and update statuses (Pending, Processing, Shipped, Delivered).
    *   Fraud detection tracking (Risk Scores & Risk Flags based on user history).
    *   COD Remittance tracking (marking when the courier has remitted collected cash).
    *   Detailed Order Status History logs.
*   **Catalog & Inventory Control**:
    *   Create and manage Products, Sizes, Categories, and Brands.
    *   Manage complex pricing strategies: Base Price, Cost Price (for profit margin tracking), Compare-at Price, and Flash Sale Price.
    *   Toggle product flags (`is_featured`, `is_new_arrival`, `is_best_seller`).
    *   Create **Product Bundles** (sell multiple items together at a discounted rate).
*   **Bulk CSV Import**: 
    *   Time-saving feature allowing admins to import or update hundreds of products simultaneously via CSV spreadsheet uploads.
*   **Customer Review Moderation**: 
    *   All user-submitted reviews (and their attached photos) go into a "Pending" queue. Admins can review, approve, reject, or reply to reviews before they appear publicly.
*   **Admin Action Audit Log**: 
    *   Every change made in the admin panel (price changes, order updates) is logged with the admin's ID and timestamp for security and accountability.

## ⚙️ Technical Architecture & Infrastructure
*   **Tech Stack**: Full-stack PERN (PostgreSQL, Express.js, React, Node.js).
*   **Database**: Robust relational database management using Prisma ORM.
*   **Cloud Hosted**: Database hosted on Supabase (AWS) for high availability and automated backups; App hosted on Vercel.
*   **Security**: 
    *   JWT-based session authentication.
    *   Bcrypt password hashing.
    *   Protected API endpoints and Role-Based Access Control (RBAC).
*   **Media & Asset Storage**: 
    *   Automated uploading, compression, and delivery of product/review images via Cloudinary's global CDN and custom S3-compatible Object Storage.
*   **Performance Optimization**: 
    *   SEO-optimized frontend routing.
    *   Lazy-loaded React components.
    *   Highly optimized database queries with strict indexing.
