"use client";
import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Flame, Package, Star, RotateCcw, DollarSign } from "lucide-react";
import { http } from "../lib/api";
import { useStore } from "../context/StoreContext";
import HeroSlider from "../components/HeroSlider";
import ProductCard from "../components/ProductCard";
import { TrustRibbon } from "../components/Footer";
import { ScrollReveal, SectionHeader, Countdown, ProductCardSkeleton, Stars } from "../components/common";

const SIZES = ["39", "40", "41", "42", "43", "44", "45", "46"];

export default function Home({ initialData }) {
  const fetcher = async () => {
    const [s, c, nw, flash, best, feat, settings, cms] = await Promise.all([
      http.get("/hero-slides"),
      http.get("/categories"),
      http.get("/products?flag=new&limit=8"),
      http.get("/products?flag=flash&limit=8"),
      http.get("/products?flag=best&limit=4"),
      http.get("/products?flag=featured&limit=8"),
      http.get("/settings"),
      http.get("/admin/cms/homepage-sections").catch(() => ({ data: { data: [] } }))
    ]);
    return {
      slides: s.data.data,
      cats: c.data.data,
      data: { 
        nw: nw.data.data, 
        flash: flash.data.data, 
        best: best.data.data, 
        feat: feat.data.data,
        settings: settings.data.data 
      },
      layout: cms.data.data.sort((a, b) => a.sort_order - b.sort_order)
    };
  };

  const { data: homeData, isLoading: loading } = useSWR('home-data', fetcher, { 
    fallbackData: initialData,
    revalidateOnFocus: false 
  });

  const slides = homeData?.slides || [];
  const cats = homeData?.cats || [];
  const data = homeData?.data || {};
  const layout = homeData?.layout || [
    { id: 'h1', type: 'hero', is_active: true },
    { id: 'h2', type: 'categories', is_active: true },
    { id: 'h3', type: 'flash_sale', is_active: true },
    { id: 'h4', type: 'new_arrivals', is_active: true },
    { id: 'h5', type: 'best_sellers', is_active: true },
    { id: 'h6', type: 'trending', is_active: true },
    { id: 'h7', type: 'testimonials', is_active: true }
  ];

  const flashActive = data.settings?.flash_sale_active;
  const flashEnd = data.settings?.flash_sale_end_time;

  // Render components based on CMS layout
  const renderSection = (section) => {
    if (!section.is_active) return null;

    switch (section.type) {
      case 'hero':
        return <HeroSlider key={section.id} slides={slides} />;
      
      case 'categories':
        return (
          <section key={section.id} className="max-w-[1400px] mx-auto px-5 sm:px-8 py-16">
            <ScrollReveal>
              <SectionHeader eyebrow="Shop by drop" title="Find Your Category" tagline="From grail-worthy retros to cloud-soft runners — every silhouette, curated." />
            </ScrollReveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton w-full aspect-[3/4]" />
              )) : cats.map((c, i) => (
                <ScrollReveal key={c.id} delay={i * 0.08}>
                  <Link to={`/collections/${c.slug}`} className="group relative block overflow-hidden rounded-none aspect-[3/4]">
                    <img src={c.image_url} alt={c.name} className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/90 via-obsidian/20 to-transparent" />
                    <div className="absolute bottom-0 p-5 text-white">
                      <span className="font-mono text-[10px]  tracking-widest text-white/70">{c.product_count} models</span>
                      <h3 className="font-display tracking-tight leading-tight mt-1">{c.name}</h3>
                      <span className="inline-flex items-center gap-1 text-xs font-bold mt-2 group-hover:text-fire transition-colors">Shop now <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" /></span>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </section>
        );

      case 'flash_sale':
        if (!flashActive || !data.flash?.length || !flashEnd || new Date(flashEnd) < new Date()) return null;
        return (
          <section key={section.id} className="bg-obsidian text-white py-16">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Flame size={18} className="fill-fire text-fire" />
                    <span className="font-mono text-[11px]  tracking-[0.2em] text-fire font-bold">Limited time</span>
                  </div>
                  <h2 className="font-display tracking-tight leading-none">Flash Drop</h2>
                  <p className="text-white/60 mt-2">Prices reset when the clock hits zero. Cop before it's gone.</p>
                </div>
                {flashEnd && <Countdown endsAt={flashEnd} />}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="contents">
                  {data.flash.slice(0, 4).map((p, i) => (
                    <div key={p.id} className="bg-white rounded-none p-2"><ProductCard product={p} index={i} /></div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

      case 'new_arrivals':
        return (
          <section key={section.id} className="max-w-[1400px] mx-auto px-5 sm:px-8 py-16">
            <ScrollReveal>
              <SectionHeader
                eyebrow="Fresh heat"
                title="New Arrivals"
                tagline="The latest silhouettes landing in Pakistan first."
                action={<Link to="/new-arrivals" className="hidden sm:inline-flex items-center gap-2 font-display text-sm tracking-wide hover:text-fire transition-colors">View All <ArrowRight size={16} /></Link>}
              />
            </ScrollReveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {loading ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />) : data.nw?.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </section>
        );

      case 'best_sellers':
        return (
          <section key={section.id} className="max-w-[1400px] mx-auto px-5 sm:px-8 py-16">
            <ScrollReveal>
              <SectionHeader eyebrow="Most wanted" title="Best Sellers" tagline="Culture-approved. Cart-tested. Community-loved." action={<Link to="/collections/retro" className="hidden sm:inline-flex items-center gap-2 font-display text-sm tracking-wide hover:text-fire transition-colors">View All <ArrowRight size={16} /></Link>} />
            </ScrollReveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {loading ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />) : data.best?.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </section>
        );

      case 'trending':
        if (!data.feat?.length) return null;
        return (
          <section key={section.id} className="bg-ink-100 border-y border-ink-200 py-16">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
              <ScrollReveal>
                <SectionHeader eyebrow="Editor's Choice" title="Featured Heat" tagline="Handpicked sneakers that define the current meta." />
              </ScrollReveal>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
                {data.feat.slice(0, 4).map((p, i) => (
                  <div key={p.id} className="bg-white p-2 rounded-none shadow-sm"><ProductCard product={p} index={i} /></div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'testimonials':
        return <ReviewsSection key={section.id} />;

      case 'promotional_banner':
        // Placeholder for promo banner if implemented on frontend
        return null;

      default:
        return null;
    }
  };

  // If layout is not loaded yet or empty (fallback to default hardcoded order)
  if (!loading && layout.length === 0) {
    layout.push(
      { id: 'h1', type: 'hero', is_active: true },
      { id: 'h2', type: 'categories', is_active: true },
      { id: 'h3', type: 'flash_sale', is_active: true },
      { id: 'h4', type: 'new_arrivals', is_active: true },
      { id: 'h5', type: 'best_sellers', is_active: true },
      { id: 'h6', type: 'trending', is_active: true },
      { id: 'h7', type: 'testimonials', is_active: true }
    );
  }

  return (
    <div>
      {layout.map(section => renderSection(section))}
      
      {/* Static sections that are always at the bottom */}
      <TrustRibbon />
      <section className="bg-white border-y border-ink-200 py-14">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
          <SectionHeader eyebrow="One tap fit" title="Shop By Size" />
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {SIZES.map((s, i) => (
              <motion.div key={s} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                <Link to={`/shop?size=${s}`} className="block text-center border-2 border-obsidian rounded-none py-5 font-display font-semibold text-lg hover:bg-obsidian hover:text-white transition-colors">
                  EU {s}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WhyUsSection />
      <SEOBlock />
    </div>
  );
}

function WhyUsSection() {
  const perks = [
    { icon: <Package size={24} />, title: "Nationwide Delivery", desc: "Fast shipping to all major cities across Pakistan." },
    { icon: <Star size={24} />, title: "Authentic Goods", desc: "100% verified authentic streetwear and sneakers." },
    { icon: <RotateCcw size={24} />, title: "Easy Returns", desc: "7-day hassle-free return and exchange policy." },
    { icon: <DollarSign size={24} />, title: "Secure Payments", desc: "Cash on Delivery, JazzCash, EasyPaisa, and Card." },
  ];
  return (
    <section className="bg-obsidian text-white py-16">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display tracking-tight">Why SOLEKICKS?</h2>
          <p className="text-white/60 mt-3 max-w-lg mx-auto">We're building Pakistan's premium streetwear destination.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {perks.map((p, i) => (
            <div key={i} className="text-center flex flex-col items-center">
              <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center text-fire mb-4">{p.icon}</div>
              <h3 className="font-display tracking-wide text-lg mb-2">{p.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewsSection() {
  const [reviews, setReviews] = useState([
    { author_name: "Hamza Tariq", author_meta: "Lahore", content: "Delivered in 2 days to DHA via COD! The cushioning on the Oreo 4s is insane. Exactly matches jutay quality.", rating: 5 },
    { author_name: "Zeeshan Malik", author_meta: "Karachi", content: "Size 43 fit true to chart. Exchange policy gave me full confidence to order. 10/10 streetwear staple.", rating: 5 },
    { author_name: "Ali Raza", author_meta: "Islamabad", content: "Hands down best sneaker cop in Pakistan. Packaging with extra laces & sticker pack was top tier.", rating: 5 },
  ]);

  useEffect(() => {
    http.get("/admin/cms/testimonials").then(({ data }) => {
      const active = data.data.filter(t => t.is_published);
      if (active.length > 0) {
        setReviews(active.slice(0, 3));
      }
    }).catch(() => {});
  }, []);

  return (
    <section className="bg-white border-y border-ink-200 py-16">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <SectionHeader eyebrow="Verified buyers" title="From The Culture" tagline="Real kicks. Real people. Real cities across Pakistan." />
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className="bg-canvas rounded-none p-6 h-full border border-ink-200">
                <Stars rating={r.rating} />
                <p className="mt-4 text-ink-700 leading-relaxed">"{r.content}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-none bg-obsidian text-white grid place-items-center font-display font-bold">{r.author_name?.[0] || 'U'}</div>
                  <div>
                    <p className="font-display font-bold text-sm">{r.author_name}</p>
                    <span className="text-ink-400 text-xs">{r.author_meta || 'Verified Customer'}</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function SEOBlock() {
  const [open, setOpen] = useState(false);
  return (
    <section className="max-w-[1400px] mx-auto px-5 sm:px-8 py-16">
      <h2 className="font-display tracking-tight">Pakistan's Home For Premium Streetwear Sneakers</h2>
      <div className={`text-ink-500 leading-relaxed mt-4 space-y-4 ${open ? "" : "line-clamp-4"}`}>
        <p>SOLEKICKS PK is where Pakistan's growing sneaker culture finds its footing. From grail-worthy retro high-tops and clean terrace low-tops to ultra-cushioned performance runners and recovery slides, every silhouette in our catalog is selected for authenticity, comfort, and street credibility. We deliver nationwide — Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar and beyond — with Cash on Delivery, JazzCash, EasyPaisa and card options.</p>
        <p>Our sizing runs from EU 39 to EU 46 with a true-to-size fit guarantee and a 7-day hassle-free exchange policy. Each pair ships with premium packaging, extra laces, and a care card so your kicks stay fresh. Whether you're chasing the latest SS26 drop or hunting a timeless court classic, SOLEKICKS PK is your trusted plug for heat that lasts.</p>
      </div>
      <button onClick={() => setOpen(!open)} className="mt-4 font-display text-sm tracking-wide text-fire hover:underline">{open ? "Read less" : "Read more"}</button>
    </section>
  );
}

