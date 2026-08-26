import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Heart, ShoppingBag, User, Menu, X, Home, Grid3x3, Zap } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { http, fmt } from "../lib/api";

const NAV = [
  { label: "New Releases", to: "/new-arrivals" },
  { label: "Streetwear", to: "/collections/streetwear" },
  { label: "Retro & Highs", to: "/collections/retro" },
  { label: "Runners", to: "/collections/runners" },
  { label: "Slides", to: "/collections/slides" },
  { label: "Flash Sale", to: "/flash-sale", hot: true },
];

function AnnouncementBar() {
  const { settings } = useStore();
  const [show, setShow] = useState(true);
  if (!show || !settings?.announcement_active) return null;
  const text = settings.announcement_text || "";
  return (
    <div className="bg-obsidian text-white overflow-hidden relative">
      <div className="max-w-[1400px] mx-auto flex items-center">
        <div className="flex-1 overflow-hidden py-2">
          <div className="marquee whitespace-nowrap flex">
            <span className="font-mono text-[11px]  tracking-[0.18em] font-semibold px-4">{text}</span>
            <span className="font-mono text-[11px]  tracking-[0.18em] font-semibold px-4">{text}</span>
          </div>
        </div>
        <button onClick={() => setShow(false)} className="px-3 text-white/70 hover:text-white shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    if (!q) return setResults([]);
    const id = setTimeout(async () => {
      const { data } = await http.get(`/search?q=${encodeURIComponent(q)}`);
      setResults(data.data);
    }, 250);
    return () => clearTimeout(id);
  }, [q]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-obsidian/60 backdrop-blur-sm z-[60] grid place-items-start justify-center pt-[12vh] px-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl bg-canvas z-[70] p-5 sm:p-7 shadow-2xl border border-ink-200">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 border-b-2 border-obsidian pb-3">
                <Search size={22} />
                <input
                  autoFocus
                  data-testid="search-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && q) { navigate(`/search?q=${q}`); onClose(); } }}
                  placeholder="Search kicks, runners, slides…"
                  className="flex-1 bg-transparent outline-none font-display tracking-tight placeholder:text-ink-200"
                />
                <button onClick={onClose}><X size={22} /></button>
              </div>
              <div className="mt-4 space-y-1 max-h-[60vh] overflow-y-auto">
                {results.map((p) => (
                  <Link key={p.id} to={`/products/${p.slug}`} onClick={onClose} className="flex items-center gap-3 p-2 rounded-none hover:bg-white">
                    <img src={p.images[0]} alt={p.name} className="h-14 w-14 rounded-none object-cover bg-ink-100" />
                    <div className="flex-1">
                      <p className="font-display font-bold text-sm">{p.name}</p>
                      <span className="font-mono text-fire text-sm">{fmt(p.base_price)}</span>
                    </div>
                  </Link>
                ))}
                {q && results.length === 0 && <p className="text-ink-400 text-sm py-4">No matches for "{q}"</p>}
              </div>
            </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Header() {
  const { cart, wishlist, setCartOpen, cartBump, user } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="sticky top-0 z-40">
        <AnnouncementBar />
        <motion.header
          animate={{ paddingTop: scrolled ? 8 : 14, paddingBottom: scrolled ? 8 : 14 }}
          className={`bg-white/90 backdrop-blur-md border-b transition-shadow ${scrolled ? "border-ink-200 shadow-sm" : "border-transparent"}`}
        >
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 flex items-center justify-between gap-4">
            <button className="lg:hidden" onClick={() => setMenuOpen(true)} data-testid="mobile-menu-btn"><Menu size={22} /></button>

            <Link to="/" className="font-display tracking-tighter flex items-center gap-1" data-testid="logo">
              SOLEKICKS<span className="text-fire text-2xl leading-none">.</span><span className="hidden sm:inline text-[10px] font-mono tracking-[0.25em] self-start mt-1">PK</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-7">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} className={`relative font-display tracking-wider group ${loc.pathname === n.to ? "text-fire" : "text-obsidian"}`}>
                  {n.hot && <Zap size={11} className="inline mr-1 fill-fire text-fire" />}
                  {n.label}
                  <span className="absolute -bottom-1 left-0 h-[2px] bg-fire w-0 group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => setSearchOpen(true)} data-testid="search-toggle" className="h-10 w-10 grid place-items-center rounded-none hover:bg-ink-100"><Search size={19} /></button>
              <Link to="/wishlist" data-testid="wishlist-link" className="h-10 w-10 grid place-items-center rounded-none hover:bg-ink-100 relative">
                <Heart size={19} />
                {wishlist.ids.length > 0 && <span className="absolute top-1 right-1 h-4 min-w-4 px-1 bg-fire text-white text-[10px] font-bold rounded-none grid place-items-center">{wishlist.ids.length}</span>}
              </Link>
              <Link to={user ? "/account" : "/login"} data-testid="account-link" className="h-10 w-10 grid place-items-center rounded-none hover:bg-ink-100 overflow-hidden">
                {user?.picture ? <img src={user.picture} alt="" className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" /> : <User size={19} />}
              </Link>
              <motion.button
                key={cartBump}
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 0.4 }}
                onClick={() => setCartOpen(true)}
                data-testid="cart-toggle"
                className="h-10 w-10 grid place-items-center rounded-none hover:bg-ink-100 relative"
              >
                <ShoppingBag size={19} />
                {cart.count > 0 && <span className="absolute top-1 right-1 h-4 min-w-4 px-1 bg-fire text-white text-[10px] font-bold rounded-none grid place-items-center">{cart.count}</span>}
              </motion.button>
            </div>
          </div>
        </motion.header>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-obsidian/60 z-[60]" onClick={() => setMenuOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 260 }} className="fixed left-0 top-0 h-full w-[82%] max-w-sm bg-canvas z-[70] p-6">
              <div className="flex justify-between items-center mb-8">
                <span className="font-display tracking-tighter">SOLEKICKS<span className="text-fire">.</span></span>
                <button onClick={() => setMenuOpen(false)}><X size={22} /></button>
              </div>
              <nav className="flex flex-col">
                {NAV.map((n) => (
                  <Link key={n.to} to={n.to} onClick={() => setMenuOpen(false)} className="font-display tracking-tight py-3 border-b border-ink-200 flex items-center gap-2">
                    {n.hot && <Zap size={16} className="fill-fire text-fire" />}{n.label}
                  </Link>
                ))}
                <Link to="/track-order" onClick={() => setMenuOpen(false)} className="font-display tracking-tight py-3 border-b border-ink-200">Track Order</Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </>
  );
}

function MobileBottomNav() {
  const { cart, wishlist, setCartOpen, user } = useStore();
  const loc = useLocation();
  const Item = ({ to, icon: Icon, label, badge, onClick }) => {
    const active = loc.pathname === to;
    const content = (
      <div className={`flex flex-col items-center gap-0.5 relative ${active ? "text-fire" : "text-obsidian"}`}>
        <Icon size={20} />
        <span className="text-[9px] font-bold  tracking-wide">{label}</span>
        {badge > 0 && <span className="absolute -top-1 right-2 h-4 min-w-4 px-1 bg-fire text-white text-[9px] font-bold rounded-none grid place-items-center">{badge}</span>}
      </div>
    );
    return onClick ? <button onClick={onClick} data-testid={`mobilenav-${label.toLowerCase()}`}>{content}</button> : <Link to={to} data-testid={`mobilenav-${label.toLowerCase()}`}>{content}</Link>;
  };
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink-200 grid grid-cols-5 py-2.5 px-2">
      <Item to="/" icon={Home} label="Home" />
      <Item to="/shop" icon={Grid3x3} label="Shop" />
      <Item to="/wishlist" icon={Heart} label="Saved" badge={wishlist.ids.length} />
      <Item onClick={() => setCartOpen(true)} icon={ShoppingBag} label="Bag" badge={cart.count} />
      <Item to={user ? "/account" : "/login"} icon={User} label="Account" />
    </div>
  );
}

