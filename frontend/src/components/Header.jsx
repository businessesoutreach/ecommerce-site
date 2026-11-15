import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  Home,
  Grid3x3,
  Zap,
  ChevronDown,
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { http, fmt } from "../lib/api";

const COLLECTIONS = [
  { label: "Streetwear", to: "/collections/streetwear", desc: "Everyday street culture & classics" },
  { label: "Retro & Highs", to: "/collections/retro", desc: "Timeless court & high-top silhouettes" },
  { label: "Runners", to: "/collections/runners", desc: "Performance cushioning & comfort" },
  { label: "Slides & Slip-Ons", to: "/collections/slides", desc: "Easy casual comfort" },
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
            <span className="font-mono text-[11px] tracking-[0.18em] font-semibold px-4">{text}</span>
            <span className="font-mono text-[11px] tracking-[0.18em] font-semibold px-4">{text}</span>
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
  const [collectionsDropdown, setCollectionsDropdown] = useState(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <div className="max-w-[1400px] mx-auto px-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-1.5 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                className="lg:hidden h-8 w-8 sm:h-10 sm:w-10 grid place-items-center rounded-none hover:bg-ink-100"
                onClick={() => setMenuOpen(true)}
                data-testid="mobile-menu-btn"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>

              <Link to="/" className="font-display tracking-tighter flex items-center text-base sm:text-xl shrink-0" data-testid="logo">
                SOLEKICKS<span className="text-fire text-lg sm:text-2xl leading-none">.</span>
                <span className="hidden sm:inline text-[10px] font-mono tracking-[0.25em] self-start mt-1 ml-0.5">PK</span>
              </Link>
            </div>

            {/* Streamlined Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-7">
              <Link
                to="/shop"
                className={`relative font-display tracking-wider text-sm group ${
                  loc.pathname === "/shop" ? "text-fire font-bold" : "text-obsidian"
                }`}
              >
                Shop All
                <span className="absolute -bottom-1 left-0 h-[2px] bg-fire w-0 group-hover:w-full transition-all duration-300" />
              </Link>

              {/* Collections Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setCollectionsDropdown(true)}
                onMouseLeave={() => setCollectionsDropdown(false)}
              >
                <button
                  type="button"
                  onClick={() => setCollectionsDropdown((prev) => !prev)}
                  className={`flex items-center gap-1.5 font-display tracking-wider text-sm transition-colors py-2 ${
                    loc.pathname.startsWith("/collections") ? "text-fire font-bold" : "text-obsidian hover:text-fire"
                  }`}
                >
                  <span>Collections</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      collectionsDropdown ? "rotate-180 text-fire" : "text-ink-400"
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {collectionsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute top-full left-0 mt-1 w-72 bg-white border border-ink-200 shadow-2xl p-2 z-50 rounded-none"
                    >
                      <div className="px-3 py-1.5 border-b border-ink-100 mb-1">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400 font-bold">
                          Browse by Collection
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {COLLECTIONS.map((c) => (
                          <Link
                            key={c.to}
                            to={c.to}
                            onClick={() => setCollectionsDropdown(false)}
                            className="block px-3 py-2 hover:bg-ink-100 transition-colors group/item"
                          >
                            <div className="font-display text-xs uppercase tracking-wide font-bold text-obsidian group-hover/item:text-fire transition-colors">
                              {c.label}
                            </div>
                            <div className="text-[11px] font-mono text-ink-500 mt-0.5">
                              {c.desc}
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="pt-2 mt-1 border-t border-ink-100">
                        <Link
                          to="/shop"
                          onClick={() => setCollectionsDropdown(false)}
                          className="flex items-center justify-between px-3 py-1.5 text-xs font-mono font-bold text-obsidian hover:text-fire transition-colors"
                        >
                          <span>Explore All Sneaker Drops</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                to="/new-arrivals"
                className={`relative font-display tracking-wider text-sm group ${
                  loc.pathname === "/new-arrivals" ? "text-fire font-bold" : "text-obsidian"
                }`}
              >
                New Drops
                <span className="absolute -bottom-1 left-0 h-[2px] bg-fire w-0 group-hover:w-full transition-all duration-300" />
              </Link>

              <Link
                to="/flash-sale"
                className={`relative font-display tracking-wider text-sm flex items-center gap-1 group ${
                  loc.pathname === "/flash-sale" ? "text-fire font-bold" : "text-obsidian"
                }`}
              >
                <Zap size={13} className="fill-fire text-fire" />
                Flash Sale
                <span className="absolute -bottom-1 left-0 h-[2px] bg-fire w-0 group-hover:w-full transition-all duration-300" />
              </Link>

              <Link
                to="/track-order"
                className={`relative font-display tracking-wider text-sm text-ink-500 hover:text-obsidian ${
                  loc.pathname === "/track-order" ? "text-fire font-bold" : ""
                }`}
              >
                Track Order
                <span className="absolute -bottom-1 left-0 h-[2px] bg-fire w-0 group-hover:w-full transition-all duration-300" />
              </Link>
            </nav>

            <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
              <button
                onClick={() => setSearchOpen(true)}
                data-testid="search-toggle"
                className="h-8 w-8 sm:h-10 sm:w-10 grid place-items-center rounded-none hover:bg-ink-100"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              <Link
                to="/wishlist"
                data-testid="wishlist-link"
                className="h-8 w-8 sm:h-10 sm:w-10 grid place-items-center rounded-none hover:bg-ink-100 relative"
                aria-label="Wishlist"
              >
                <Heart size={18} />
                {wishlist.ids.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-3.5 min-w-3.5 px-0.5 bg-fire text-white text-[9px] font-bold rounded-none grid place-items-center">
                    {wishlist.ids.length}
                  </span>
                )}
              </Link>

              {/* User Account: visible on screens >= 380px (also accessible via bottom bar & hamburger on ultra-small screens) */}
              <Link
                to={mounted && user ? (user.role === "admin" ? "/admin" : "/account") : "/login"}
                data-testid="account-link"
                className="hidden min-[380px]:grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-none hover:bg-ink-100 overflow-hidden"
                aria-label="Account"
              >
                {mounted && user?.picture ? (
                  <img
                    src={user.picture}
                    alt=""
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : mounted && user?.role === "admin" ? (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-fire text-white grid place-items-center font-display font-bold text-xs sm:text-sm">
                    {user.name ? user.name[0].toUpperCase() : "A"}
                  </div>
                ) : (
                  <User size={18} />
                )}
              </Link>

              <motion.button
                key={cartBump}
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 0.4 }}
                onClick={() => setCartOpen(true)}
                data-testid="cart-toggle"
                className="h-8 w-8 sm:h-10 sm:w-10 grid place-items-center rounded-none hover:bg-ink-100 relative shrink-0"
                aria-label="Cart"
              >
                <ShoppingBag size={18} />
                {cart.count > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-3.5 min-w-3.5 px-0.5 bg-fire text-white text-[9px] font-bold rounded-none grid place-items-center">
                    {cart.count}
                  </span>
                )}
              </motion.button>
            </div>
          </div>
        </motion.header>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-obsidian/60 z-[60]" onClick={() => setMenuOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 260 }} className="fixed left-0 top-0 h-full w-[82%] max-w-sm bg-canvas z-[70] p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <span className="font-display tracking-tighter text-lg font-bold">SOLEKICKS<span className="text-fire">.</span></span>
                <button onClick={() => setMenuOpen(false)}><X size={22} /></button>
              </div>
              <nav className="flex flex-col">
                <Link to="/shop" onClick={() => setMenuOpen(false)} className="font-display tracking-tight py-3 border-b border-ink-200">
                  Shop All Kicks
                </Link>

                {/* Mobile Collections Sub-accordion */}
                <div className="border-b border-ink-200 py-3">
                  <button
                    onClick={() => setMobileCollectionsOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between font-display tracking-tight text-left"
                  >
                    <span>Collections</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${mobileCollectionsOpen ? "rotate-180 text-fire" : "text-ink-400"}`}
                    />
                  </button>
                  {mobileCollectionsOpen && (
                    <div className="pl-3 pt-2.5 space-y-2">
                      {COLLECTIONS.map((c) => (
                        <Link
                          key={c.to}
                          to={c.to}
                          onClick={() => setMenuOpen(false)}
                          className="block py-1 text-sm text-ink-600 hover:text-fire font-display"
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <Link to="/new-arrivals" onClick={() => setMenuOpen(false)} className="font-display tracking-tight py-3 border-b border-ink-200">
                  New Drops
                </Link>
                <Link to="/flash-sale" onClick={() => setMenuOpen(false)} className="font-display tracking-tight py-3 border-b border-ink-200 flex items-center gap-2 text-fire font-bold">
                  <Zap size={16} className="fill-fire text-fire" />
                  Flash Sale
                </Link>
                <Link to="/track-order" onClick={() => setMenuOpen(false)} className="font-display tracking-tight py-3 border-b border-ink-200">
                  Track Order
                </Link>
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
  const [mounted, setMounted] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const Item = ({ to, icon: Icon, label, badge, onClick }) => {
    const active = loc.pathname === to;
    const content = (
      <div className={`flex flex-col items-center gap-0.5 relative ${active ? "text-fire" : "text-obsidian"}`}>
        <Icon size={20} />
        <span className="text-[9px] font-bold tracking-wide">{label}</span>
        {badge > 0 && <span className="absolute -top-1 right-2 h-4 min-w-4 px-1 bg-fire text-white text-[9px] font-bold rounded-none grid place-items-center">{badge}</span>}
      </div>
    );
    return onClick ? <button onClick={onClick} data-testid={`mobilenav-${label.toLowerCase()}`}>{content}</button> : <Link to={to} data-testid={`mobilenav-${label.toLowerCase()}`}>{content}</Link>;
  };
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink-200 grid grid-cols-5 py-2.5 px-2">
      <Item to="/" icon={Home} label="Home" />
      <Item to="/shop" icon={Grid3x3} label="Shop" />
      <Item to="/wishlist" icon={Heart} label="Saved" badge={mounted ? wishlist.ids.length : 0} />
      <Item onClick={() => setCartOpen(true)} icon={ShoppingBag} label="Bag" badge={mounted ? cart.count : 0} />
      <Item to={mounted && user ? (user.role === "admin" ? "/admin" : "/account") : "/login"} icon={User} label={mounted && user?.role === "admin" ? "Admin" : "Account"} />
    </div>
  );
}
