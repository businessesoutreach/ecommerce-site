import React from "react";
import { Link } from "react-router-dom";

const PAGES = {
  "about-us": { title: "About SOLEKICKS PK", body: "SOLEKICKS PK is Pakistan's trusted home for premium streetwear sneakers, retro re-issues, and performance runners. Born from the country's fast-growing sneaker culture, we curate authentic-grade silhouettes and deliver them nationwide with Cash on Delivery and a hassle-free exchange policy." },
  "contact-us": { title: "Contact Us", body: "Questions about sizing, orders, or exchanges? Reach us on WhatsApp 24/7 at +92 3XX XXXXXXX or email support@solekicks.pk. Our team responds fast — usually within a few hours." },
  "faqs": { title: "Frequently Asked Questions", body: "Do you offer Cash on Delivery? Yes, COD is available nationwide. What is your return policy? We offer 7-day hassle-free exchanges. How long does delivery take? 24-48h for major cities (Karachi, Lahore, Islamabad) and 2-4 days elsewhere." },
  "privacy-policy": { title: "Privacy Policy", body: "We respect your privacy. Your personal information is used solely to process orders and improve your shopping experience. We never sell your data to third parties." },
  "terms-conditions": { title: "Terms & Conditions", body: "By using SOLEKICKS PK you agree to our terms of service. All products are subject to availability. Prices are in Pakistani Rupees (PKR) and inclusive of applicable taxes." },
  "shipping-returns": { title: "Shipping & Returns", body: "Free shipping on orders over Rs. 5,000. Flat Rs. 250 delivery fee otherwise. 7-day easy exchange on unworn items with original packaging. Refunds processed as store credit or original payment method." },
};

export default function StaticPage({ slug }) {
  const page = PAGES[slug] || { title: "Page", body: "Content coming soon." };
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 min-h-[70vh]">
      <Link to="/" className="font-mono text-xs uppercase tracking-widest text-fire">← Home</Link>
      <h1 className="font-display tracking-tight mt-4">{page.title}</h1>
      <p className="text-ink-500 leading-relaxed mt-6 text-lg">{page.body}</p>
    </div>
  );
}
