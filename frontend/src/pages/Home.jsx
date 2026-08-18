import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Flame } from "lucide-react";
import { http } from "../lib/api";
import { useStore } from "../context/StoreContext";
import HeroSlider from "../components/HeroSlider";
import ProductCard from "../components/ProductCard";
import { TrustRibbon } from "../components/Footer";
import { ScrollReveal, SectionHeader, Countdown, ProductCardSkeleton, Stars } from "../components/common";

const SIZES = ["39", "40", "41", "42", "43", "44", "45", "46"];

export default function Home() {
  const [slides, setSlides] = useState([]);
  const [cats, setCats] = useState([]);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, c, nw, flash, best, feat] = await Promise.all([
        http.get("/hero-slides"),
        http.get("/categories"),
        http.get("/products?flag=new&limit=8"),
        http.get("/products?flag=flash&limit=8"),
        http.get("/products?flag=best&limit=4"),
        http.get("/products?flag=featured&limit=8"),
      ]);
      setSlides(s.data.data);
      setCats(c.data.data);
      setData({ nw: nw.data.data, flash: flash.data.data, best: best.data.data, feat: feat.data.data });
      setLoading(false);
    })();
  }, []);

  const flashEnd = data.flash?.[0]?.flash_sale_ends_at;

  return (
    <div>
      <HeroSlider slides={slides} />
      <TrustRibbon />
      <CinematicVideo />

      {/* Category bento */}
      <section className="max-w-[1400px] mx-auto px-5 sm:px-8 py-16">
        <ScrollReveal>
          <SectionHeader eyebrow="Shop by drop" title="Find Your Category" tagline="From grail-worthy retros to cloud-soft runners — every silhouette, curated." />
        </ScrollReveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cats.map((c, i) => (
            <ScrollReveal key={c.id} delay={i * 0.08}>
              <Link to={`/collections/${c.slug}`} className="group relative block overflow-hidden rounded-none aspect-[3/4]">
                <img src={c.image_url} alt={c.name} className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/90 via-obsidian/20 to-transparent" />
                <div className="absolute bottom-0 p-5 text-white">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">{c.product_count} models</span>
                  <h3 className="font-display font-black text-lg uppercase tracking-tight leading-tight mt-1">{c.name}</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-bold mt-2 group-hover:text-fire transition-colors">Shop now <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" /></span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Flash sale */}
      {data.flash?.length > 0 && (
        <section className="bg-obsidian text-white py-16">
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Flame size={18} className="fill-fire text-fire" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fire font-bold">Limited time</span>
                </div>
                <h2 className="font-display text-3xl lg:text-5xl font-black uppercase tracking-tight leading-none">Flash Drop</h2>
                <p className="text-white/60 mt-2">Prices reset when the clock hits zero. Cop before it's gone.</p>
              </div>
              {flashEnd && <Countdown endsAt={flashEnd} />}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 [&_h3]:text-white [&_.text-obsidian]:text-white">
              <div className="contents">
                {data.flash.slice(0, 4).map((p, i) => (
                  <div key={p.id} className="bg-white rounded-none p-2"><ProductCard product={p} index={i} /></div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section className="max-w-[1400px] mx-auto px-5 sm:px-8 py-16">
        <ScrollReveal>
          <SectionHeader
            eyebrow="Fresh heat"
            title="New Arrivals"
            tagline="The latest silhouettes landing in Pakistan first."
            action={<Link to="/new-arrivals" className="hidden sm:inline-flex items-center gap-2 font-display font-bold uppercase text-sm tracking-wide hover:text-fire transition-colors">View All <ArrowRight size={16} /></Link>}
          />
        </ScrollReveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {loading ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />) : data.nw?.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* Shop by size */}
      <section className="bg-white border-y border-ink-200 py-14">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
          <SectionHeader eyebrow="One tap fit" title="Shop By Size" />
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {SIZES.map((s, i) => (
              <motion.div key={s} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                <Link to={`/collections/retro?size=${s}`} className="block text-center border-2 border-obsidian rounded-none py-5 font-display font-black text-lg hover:bg-obsidian hover:text-white transition-colors">
                  EU {s}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="max-w-[1400px] mx-auto px-5 sm:px-8 py-16">
        <ScrollReveal>
          <SectionHeader eyebrow="Most wanted" title="Best Sellers" tagline="Culture-approved. Cart-tested. Community-loved." action={<Link to="/collections/retro" className="hidden sm:inline-flex items-center gap-2 font-display font-bold uppercase text-sm tracking-wide hover:text-fire transition-colors">View All <ArrowRight size={16} /></Link>} />
        </ScrollReveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {loading ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />) : data.best?.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      <EditorialLookbook />
      <ReviewsSection />
      <SEOBlock />
    </div>
  );
}

function CinematicVideo() {
  return (
    <section className="relative h-[72vh] min-h-[460px] overflow-hidden bg-obsidian" data-testid="cinematic-video">
      <video
        autoPlay muted loop playsInline
        poster="https://images.unsplash.com/photo-1556906781-9a412961c28c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="https://videos.pexels.com/video-files/3048876/3048876-hd_1920_1080_30fps.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-r from-obsidian/90 via-obsidian/45 to-obsidian/10" />
      <div className="relative z-10 h-full max-w-[1400px] mx-auto px-5 sm:px-8 flex flex-col justify-center">
        <ScrollReveal>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-fire font-bold">The Culture In Motion</span>
          <h2 className="font-display text-white text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.92] mt-3 max-w-3xl">Built For The Street.<br />Worn With Pride.</h2>
          <p className="text-white/70 mt-4 max-w-lg text-sm sm:text-base">From the block to the boulevard — SOLEKICKS moves with Pakistan's boldest. Authentic heat, delivered nationwide.</p>
          <Link to="/new-arrivals" className="mt-7 inline-flex items-center gap-3 bg-white text-obsidian font-display font-bold uppercase text-sm tracking-wider px-7 py-4 hover:bg-fire hover:text-white transition-colors">Shop The Movement <ArrowRight size={18} /></Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

function EditorialLookbook() {
  const panels = [
    { tag: "SS26 Lookbook", title: "Own The Concrete", sub: "Grail-worthy retro highs built for the city grid.", cta: "Shop Retro", link: "/collections/retro", img: "https://images.unsplash.com/photo-1507553532144-b9df5e38c8d1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000" },
    { tag: "Performance", title: "Run The Night", sub: "Cloud-foam runners engineered for relentless pace.", cta: "Shop Runners", link: "/collections/runners", img: "https://images.pexels.com/photos/29538558/pexels-photo-29538558.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1000" },
  ];
  return (
    <section className="max-w-[1400px] mx-auto px-5 sm:px-8 py-16">
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {panels.map((p, i) => (
          <ScrollReveal key={i} delay={i * 0.1}>
            <Link to={p.link} className="group relative block overflow-hidden aspect-[4/5] sm:aspect-[3/4] border border-ink-200">
              <img src={p.img} alt={p.title} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian/90 via-obsidian/25 to-transparent" />
              <div className="absolute bottom-0 p-6 sm:p-8 text-white">
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-fire font-bold">{p.tag}</span>
                <h3 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight leading-none mt-2">{p.title}</h3>
                <p className="text-white/70 mt-2 max-w-xs text-sm sm:text-base">{p.sub}</p>
                <span className="inline-flex items-center gap-2 mt-5 font-display font-bold uppercase text-sm tracking-wider border-b-2 border-fire pb-1 group-hover:gap-3 transition-all">{p.cta} <ArrowRight size={16} /></span>
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function ReviewsSection() {
  const reviews = [
    { name: "Hamza Tariq", city: "Lahore", text: "Delivered in 2 days to DHA via COD! The cushioning on the Oreo 4s is insane. Exactly matches jutay quality.", rating: 5 },
    { name: "Zeeshan Malik", city: "Karachi", text: "Size 43 fit true to chart. Exchange policy gave me full confidence to order. 10/10 streetwear staple.", rating: 5 },
    { name: "Ali Raza", city: "Islamabad", text: "Hands down best sneaker cop in Pakistan. Packaging with extra laces & sticker pack was top tier.", rating: 5 },
  ];
  return (
    <section className="bg-white border-y border-ink-200 py-16">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <SectionHeader eyebrow="Verified buyers" title="From The Culture" tagline="Real kicks. Real people. Real cities across Pakistan." />
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className="bg-canvas rounded-none p-6 h-full border border-ink-200">
                <Stars rating={r.rating} />
                <p className="mt-4 text-ink-700 leading-relaxed">"{r.text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-none bg-obsidian text-white grid place-items-center font-display font-bold">{r.name[0]}</div>
                  <div>
                    <p className="font-display font-bold text-sm">{r.name}</p>
                    <span className="text-ink-400 text-xs">{r.city} · Verified</span>
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
      <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight">Pakistan's Home For Premium Streetwear Sneakers</h2>
      <div className={`text-ink-500 leading-relaxed mt-4 space-y-4 ${open ? "" : "line-clamp-4"}`}>
        <p>SOLEKICKS PK is where Pakistan's growing sneaker culture finds its footing. From grail-worthy retro high-tops and clean terrace low-tops to ultra-cushioned performance runners and recovery slides, every silhouette in our catalog is selected for authenticity, comfort, and street credibility. We deliver nationwide — Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar and beyond — with Cash on Delivery, JazzCash, EasyPaisa and card options.</p>
        <p>Our sizing runs from EU 39 to EU 46 with a true-to-size fit guarantee and a 7-day hassle-free exchange policy. Each pair ships with premium packaging, extra laces, and a care card so your kicks stay fresh. Whether you're chasing the latest SS26 drop or hunting a timeless court classic, SOLEKICKS PK is your trusted plug for heat that lasts.</p>
      </div>
      <button onClick={() => setOpen(!open)} className="mt-4 font-display font-bold uppercase text-sm tracking-wide text-fire hover:underline">{open ? "Read less" : "Read more"}</button>
    </section>
  );
}
