import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, CreditCard, Wallet, Home, Megaphone, Tag, Layers, Zap, FileText, Search, LayoutDashboard, Package, ShoppingCart, Ticket, Star, Users, LogOut, TrendingUp, AlertTriangle, Plus, Trash2, X, RotateCcw, DollarSign, Image as ImageIcon, Upload, MessageCircle, Search as SearchIcon, Filter, MoreVertical, Eye, Download, Printer, CheckCircle, Check, Truck, MapPin, Edit, Copy, Activity, Loader2, HelpCircle, ExternalLink, Clock, ArrowLeft, ArrowUpRight, ArrowDownRight, RefreshCw, ShoppingBag, Box, ChevronRight, ChevronDown, Sun, Moon, Bell, Shield } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { http, fmt, imgUrl, waLink } from "../lib/api";
import { PROVINCES, PROVINCE_CITIES } from "../components/LocationDropdowns";
import { useStore } from "../context/StoreContext";
import { toast } from "sonner";

import HomepageCMS from './cms/HomepageCMS';
import HeroSlidesCMS from './cms/HeroSlidesCMS';
import CategoriesCMS from './cms/CategoriesCMS';
import BrandsCMS from './cms/BrandsCMS';
import ProductSectionsCMS from './cms/ProductSectionsCMS';
import PromoBannersCMS from './cms/PromoBannersCMS';
import FlashSaleCMS from './cms/FlashSaleCMS';
import TestimonialsCMS from './cms/TestimonialsCMS';
import PagesCMS from './cms/PagesCMS';
import SeoCMS from './cms/SeoCMS';
import ConfirmModal from '../components/ConfirmModal';

function TableActionDropdown({ isOpen, onToggle, onClose, children, menuWidth = "w-48" }) {
  const [coords, setCoords] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isOpen) {
      onClose();
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < 220;
      setCoords({
        top: openUpwards ? undefined : rect.bottom + 6,
        bottom: openUpwards ? (window.innerHeight - rect.top + 6) : undefined,
        right: Math.max(12, window.innerWidth - rect.right),
      });
      onToggle();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => onClose();
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={handleToggle}
        className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        title="More Actions"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && coords && mounted && typeof document !== "undefined" && createPortal(
        <>
          <div
            className="fixed inset-0 z-50 bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />
          <div
            style={{
              position: "fixed",
              top: coords.top,
              bottom: coords.bottom,
              right: coords.right,
            }}
            onClick={(e) => e.stopPropagation()}
            className={`${menuWidth} bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-xl py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100`}
          >
            {children}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}



const ORDER_STATES = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"];

function AdminSearchModal({ isOpen, onClose, activeTab }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  // Debounced search against /api/admin/omnisearch
  useEffect(() => {
    const q = query.trim();
    if (!q || q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await http.get(`/admin/omnisearch?q=${encodeURIComponent(q)}`);
        setResults(res.data?.data || { products: [], orders: [], customers: [] });
      } catch {
        setResults({ products: [], orders: [], customers: [] });
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleSelectProduct = (p) => {
    onClose();
    navigate(`?tab=products&productId=${p.id}`);
  };

  const handleSelectOrder = (o) => {
    onClose();
    navigate(`?tab=orders&orderId=${o.order_number || o.id}`);
  };

  const handleSelectCustomer = (c) => {
    onClose();
    navigate(`?tab=customers&userId=${c.id}`);
  };

  const handleApplyFilter = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    onClose();
    const q = encodeURIComponent(query.trim());
    if (activeFilter === "orders" || (activeFilter === "all" && activeTab === "orders")) {
      navigate(`?tab=orders&search=${q}`);
    } else if (activeFilter === "customers" || (activeFilter === "all" && activeTab === "customers")) {
      navigate(`?tab=customers&search=${q}`);
    } else {
      navigate(`?tab=products&search=${q}`);
    }
  };

  const filteredProducts = activeFilter === "all" || activeFilter === "products" ? results?.products || [] : [];
  const filteredOrders = activeFilter === "all" || activeFilter === "orders" ? results?.orders || [] : [];
  const filteredCustomers = activeFilter === "all" || activeFilter === "customers" ? results?.customers || [] : [];

  const totalCount = filteredProducts.length + filteredOrders.length + filteredCustomers.length;
  const noMatches = results && !loading && totalCount === 0 && query.trim().length >= 2;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-4 bg-black/60 animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-3">
          <Search size={20} className="text-fire shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleApplyFilter(e); }}
            placeholder="Search kicks, orders (#1004), customers, emails..."
            className="w-full bg-transparent text-sm sm:text-base font-medium text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none"
          />
          {loading && <Loader2 size={16} className="animate-spin text-fire shrink-0" />}
          {query && !loading && (
            <button type="button" onClick={() => setQuery("")} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-md cursor-pointer">
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-[11px] font-mono font-bold bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 rounded-lg border border-gray-200 dark:border-zinc-700 transition-colors cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Filter Chips Toolbar */}
        <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-zinc-800/40 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider shrink-0 mr-1">Filter:</span>
          {[
            { id: "all", label: "All Categories" },
            { id: "products", label: "Sneakers" },
            { id: "orders", label: "Orders" },
            { id: "customers", label: "Customers" }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer shrink-0 ${
                activeFilter === f.id
                  ? "bg-fire text-white shadow-xs"
                  : "bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700"
              }`}
            >
              {f.label}
            </button>
          ))}
          {query.trim().length >= 2 && (
            <button
              type="button"
              onClick={handleApplyFilter}
              className="ml-auto text-xs font-bold text-fire hover:underline shrink-0 cursor-pointer"
            >
              Apply in Table ↵
            </button>
          )}
        </div>

        {/* Results Body */}
        <div className="p-3 overflow-y-auto space-y-4 flex-1">
          {(!query || query.trim().length < 2) && (
            <div className="py-12 text-center text-gray-400 dark:text-zinc-500 space-y-2">
              <Search size={32} className="mx-auto opacity-30 text-fire" />
              <p className="text-xs font-bold text-gray-600 dark:text-zinc-300">Type at least 2 characters to search across SoleKicks</p>
              <p className="text-[11px] text-gray-400">Search by sneaker name, order reference #, customer name, phone, or email</p>
            </div>
          )}

          {noMatches && (
            <div className="py-12 text-center text-gray-400 dark:text-zinc-500 space-y-3">
              <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">No matching records found for "{query}"</p>
              <button
                type="button"
                onClick={handleApplyFilter}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-fire text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer hover:bg-fire-hover"
              >
                Search in current "{activeTab}" table ↵
              </button>
            </div>
          )}

          {/* Sneakers / Products */}
          {filteredProducts.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Package size={13} className="text-fire" /> Sneakers ({filteredProducts.length})</span>
                <span className="text-[10px] text-gray-400">Click to edit drop</span>
              </div>
              <div className="space-y-1">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p)}
                    className="w-full p-2.5 rounded-xl flex items-center gap-3 bg-gray-50/50 dark:bg-zinc-800/30 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800/80 transition-all text-left cursor-pointer group"
                  >
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-200 dark:border-zinc-700" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <Box size={16} className="text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-gray-900 dark:text-zinc-100 truncate group-hover:text-fire transition-colors">{p.name}</div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-2 font-mono mt-0.5">
                        <span className="font-bold text-gray-800 dark:text-zinc-200">{fmt(p.base_price)}</span>
                        <span>•</span>
                        <span className="capitalize">{p.category_slug}</span>
                        {p.brand_slug && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{p.brand_slug}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-fire group-hover:underline shrink-0">Edit Drop →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orders */}
          {filteredOrders.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><ShoppingBag size={13} className="text-blue-500" /> Orders ({filteredOrders.length})</span>
                <span className="text-[10px] text-gray-400">Click to inspect</span>
              </div>
              <div className="space-y-1">
                {filteredOrders.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handleSelectOrder(o)}
                    className="w-full p-2.5 rounded-xl flex items-center justify-between bg-gray-50/50 dark:bg-zinc-800/30 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800/80 transition-all text-left cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-xs text-gray-900 dark:text-zinc-100 group-hover:text-fire transition-colors flex items-center gap-2">
                        <span>#{o.order_number}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                        {o.customer_name} • {o.customer_email || 'No email'}
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <div className="font-mono font-bold text-xs text-gray-900 dark:text-zinc-100">{fmt(o.total)}</div>
                      <span className="text-[10px] text-gray-400 font-mono">{new Date(o.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {filteredCustomers.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Users size={13} className="text-emerald-500" /> Customers ({filteredCustomers.length})</span>
                <span className="text-[10px] text-gray-400">Click to view profile</span>
              </div>
              <div className="space-y-1">
                {filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="w-full p-2.5 rounded-xl flex items-center gap-3 bg-gray-50/50 dark:bg-zinc-800/30 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800/80 transition-all text-left cursor-pointer group"
                  >
                    {c.picture ? (
                      <img src={c.picture} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-zinc-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {c.name ? c.name[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-gray-900 dark:text-zinc-100 truncate group-hover:text-fire transition-colors">{c.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono truncate">{c.email} {c.phone ? `• ${c.phone}` : ''}</div>
                    </div>
                    {c.is_blocked ? (
                      <span className="text-[9px] font-bold text-rose-500 px-2 py-0.5 bg-rose-50 dark:bg-rose-950 rounded uppercase">Blocked</span>
                    ) : (
                      <span className="text-[10px] font-bold text-fire group-hover:underline shrink-0">Dossier →</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-zinc-800/60 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="font-mono font-bold bg-white dark:bg-zinc-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-zinc-600 text-[10px]">ENTER</kbd> to apply in table</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Press <kbd className="font-mono font-bold bg-white dark:bg-zinc-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-zinc-600 text-[10px]">ESC</kbd> to close</span>
          </div>
          {query.trim().length >= 2 && (
            <button
              type="button"
              onClick={handleApplyFilter}
              className="font-bold text-fire hover:underline cursor-pointer"
            >
              Filter "{activeTab}" Table →
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Admin() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener to open search modal
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Dark Mode State with LocalStorage Persistence
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin_theme");
      if (stored) return stored === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isDark) {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
        localStorage.setItem("admin_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark");
        localStorage.setItem("admin_theme", "light");
      }
    }
  }, [isDark]);

  const setTab = (newTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", newTab);
    next.delete("orderId");
    setSearchParams(next);
  };

  useEffect(() => {
    if (!user) navigate("/login");
    else if (user.role !== "admin" && user.role !== "staff") { toast.error("Admin access only"); navigate("/"); }
    else if (user.role === "staff" && ["overview", "refunds", "coupons", "cms", "audit_logs"].includes(tab)) setTab("orders");
  }, [user, tab]);

  if (!user || (user.role !== "admin" && user.role !== "staff")) return null;

  const NAV_SECTIONS = [
    {
      category: "Core",
      items: [
        ["overview", "Overview", LayoutDashboard],
        ["orders", "Orders", ShoppingCart],
        ["products", "Products", Package],
        ["categories", "Categories", Tag],
        ["brands", "Brands", Box],
        ["customers", "Customers", Users],
        ["profitability", "Analytics", TrendingUp],
      ]
    },
    {
      category: "Operations",
      items: [
        ["inventory", "Inventory", Layers],
        ["cod", "COD Tracking", Truck],
        ["pos", "POS Counter", Plus],
        ["returns", "Returns", RotateCcw],
        ["refunds", "Refunds", DollarSign],
      ]
    },
    {
      category: "Marketing & CMS",
      items: [
        ["cms", "Hero & CMS", ImageIcon],
        ["coupons", "Coupons", Ticket],
        ["bundles", "Bundles", Tag],
        ["reviews", "Reviews", Star],
      ]
    },
    {
      category: "System",
      items: [
        ["audit_logs", "Audit Logs", FileText],
      ]
    }
  ];

  const filteredSections = NAV_SECTIONS.map(sec => ({
    ...sec,
    items: sec.items.filter(([k]) => {
      if (user.role === 'admin') return true;
      return !['overview', 'refunds', 'coupons', 'cms', 'audit_logs', 'profitability'].includes(k);
    })
  })).filter(sec => sec.items.length > 0);

  return (
    <div className={`min-h-screen flex ${isDark ? 'dark bg-zinc-950 text-zinc-100' : 'bg-gray-50 text-gray-900'} transition-colors duration-200`} data-testid="admin-dashboard">
      {tab !== "cms" && (
        <aside className="w-16 lg:w-60 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 h-screen sticky top-0 flex flex-col shrink-0 z-20 transition-colors">
          {/* Streamlined compact sidebar header to avoid excessive vertical padding */}
          <div className="h-14 px-3.5 lg:px-4 border-b border-gray-200 dark:border-zinc-800 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-base text-gray-900 dark:text-white tracking-tight hidden lg:block">
                SOLEKICKS<span className="text-fire">.</span>
              </span>
              <span className="lg:hidden font-display font-black text-fire text-center block w-full text-base">S.</span>
              <span className="hidden lg:inline text-[9px] font-mono font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 px-1.5 py-0.5 rounded border border-gray-200 dark:border-zinc-700 shadow-2xs">
                ADMIN
              </span>
            </div>
          </div>

          <nav className="flex-1 p-2 lg:p-2.5 space-y-3 overflow-y-auto custom-scrollbar">
            {filteredSections.map(sec => (
              <div key={sec.category} className="space-y-0.5">
                <div className="hidden lg:block px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  {sec.category}
                </div>
                <div className="lg:hidden h-px bg-gray-200 dark:bg-zinc-800 my-1"></div>
                {sec.items.map(([k, l, I]) => {
                  const isActive = tab === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setTab(k)}
                      data-testid={`admin-nav-${k}`}
                      className={`w-full flex items-center justify-center lg:justify-start gap-2.5 px-3 py-2 rounded-lg font-bold text-xs transition-all ${isActive
                        ? "bg-fire/10 dark:bg-fire/20 text-fire border border-fire/20 shadow-2xs"
                        : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100/70 dark:hover:bg-zinc-800/60 border border-transparent"
                        }`}
                      title={l}
                    >
                      <I size={15} />
                      <span className="hidden lg:block truncate">{l}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="p-2.5 border-t border-gray-200 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="w-full flex items-center justify-center lg:justify-start gap-2.5 px-3 py-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-fire hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-xs transition-colors"
            >
              <LogOut size={15} />
              <span className="hidden lg:block">Logout</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area with Enterprise Sticky Top Navigation Bar */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {tab !== "cms" && (
          <>
            <header className="h-14 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between shrink-0 transition-colors">
            {/* Left: Breadcrumbs & Module Title */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500">Admin</span>
              <span className="text-xs text-gray-300 dark:text-zinc-700">/</span>
              <span className="text-xs font-black text-gray-900 dark:text-zinc-100 uppercase tracking-wide">
                {tab.replace(/_/g, " ")}
              </span>
            </div>

            {/* Right: Search Bar Trigger beside Dark Mode Toggle */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800/80 hover:bg-gray-200 dark:hover:bg-zinc-700/80 border border-gray-200 dark:border-zinc-700/70 rounded-xl text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-all cursor-pointer shadow-2xs"
                title="Search SoleKicks (Ctrl+K)"
              >
                <Search size={14} className="text-gray-400 dark:text-zinc-400" />
                <span className="hidden sm:inline font-medium">Search...</span>
                <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono font-bold text-gray-400 dark:text-zinc-500 bg-white dark:bg-zinc-700 rounded border border-gray-200 dark:border-zinc-600">
                  Ctrl K
                </kbd>
              </button>

              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-xl text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700 transition-colors cursor-pointer"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-gray-700 dark:text-zinc-300" />}
              </button>
            </div>
          </header>

          <AdminSearchModal
            isOpen={searchModalOpen}
            onClose={() => setSearchModalOpen(false)}
            activeTab={tab}
          />
          </>
        )}

        <main className={`flex-1 ${tab === 'cms' ? 'h-full' : 'p-4 lg:p-8 min-w-0'}`}>
          {tab === "overview" && <Overview setTab={setTab} isDark={isDark} />}
          {tab === "orders" && <Orders />}
          {tab === "cod" && <CodTracking />}
          {tab === "inventory" && <InventoryManagement />}
          {tab === "products" && <Products />}
          {tab === "pos" && <PosSystem />}
          {tab === "returns" && <Returns />}
          {tab === "refunds" && <Refunds />}
          {tab === "coupons" && <Coupons isDark={isDark} />}
          {tab === "reviews" && <Reviews isDark={isDark} />}
          {tab === "customers" && <Customers />}
          {tab === "bundles" && <BundlesManager />}
          {tab === "categories" && <CategoriesCMS />}
          {tab === "brands" && <BrandsCMS />}
          {tab === "cms" && <Cms setTab={setTab} />}
          {tab === "profitability" && <ProfitabilityAnalytics />}
          {tab === "audit_logs" && <AuditLogs isDark={isDark} />}
        </main>
      </div>
    </div>
  );
}

function Overview({ setTab, isDark }) {
  const [d, setD] = useState(null);
  const [range, setRange] = useState("30d");
  const [chartView, setChartView] = useState("revenue"); // "revenue" | "orders"
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchOverview = (selectedRange = range) => {
    setIsRefreshing(true);
    http.get(`/admin/analytics/overview?range=${selectedRange}`)
      .then(({ data }) => setD(data.data))
      .catch((err) => toast.error("Failed to load overview data"))
      .finally(() => setIsRefreshing(false));
  };

  useEffect(() => {
    fetchOverview(range);
  }, [range]);

  if (!d && isRefreshing) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-zinc-800 rounded-xl" />)}
        </div>
        <div className="h-80 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
      </div>
    );
  }

  if (!d) return <div className="p-8 text-center text-gray-400 dark:text-zinc-500">Loading overview...</div>;

  const { kpis, sales_chart, top_products, sales_by_category, recent_orders, customer_overview, needs_attention, inventory_by_category } = d;

  const COLORS = ['#FF3B30', '#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#64748B'];

  const TrendBadge = ({ val }) => {
    const isPos = val > 0;
    const isNeg = val < 0;
    return (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${isPos ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60' :
        isNeg ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60' :
          'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700'
        }`}>
        {isPos ? <ArrowUpRight size={13} className="stroke-[2.5]" /> : isNeg ? <ArrowDownRight size={13} className="stroke-[2.5]" /> : null}
        {isPos ? '+' : ''}{Number(val).toFixed(1)}%
      </span>
    );
  };

  const totalCategoryRev = (sales_by_category || []).reduce((acc, c) => acc + (c.value || 0), 0);

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      {/* Top Header & Executive Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display tracking-tight text-2xl font-black text-gray-900 dark:text-zinc-100">Executive Overview</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Store Operational
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Real-time financial telemetry, order fulfillment radar, and customer analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Selector */}
          <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl border border-gray-200 dark:border-zinc-700">
            {[
              { id: "7d", label: "7D" },
              { id: "30d", label: "30D" },
              { id: "90d", label: "90D" },
              { id: "1y", label: "1Y" },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${range === r.id
                  ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-xs border border-gray-200/80 dark:border-zinc-600"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchOverview(range)}
            disabled={isRefreshing}
            title="Refresh Data"
            className="p-2 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-600 dark:text-zinc-300 transition-colors"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin text-fire" : ""} />
          </button>

          {/* Direct Action Shortcuts */}
          <button
            onClick={() => setTab("orders")}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 transition-colors shadow-xs"
          >
            Orders Feed
          </button>
          <button
            onClick={() => setTab("products")}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gray-900 dark:bg-zinc-100 hover:bg-fire dark:hover:bg-fire text-white dark:text-zinc-900 dark:hover:text-white transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Tier 1: Core Financial KPI Grid (4 High-Contrast Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-gray-500 dark:text-zinc-400 uppercase">Net Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60">
              <DollarSign size={17} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-display text-gray-900 dark:text-zinc-100 tracking-tight">
              {fmt(kpis.revenue.value)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendBadge val={kpis.revenue.trend} />
              <span className="text-[11px] text-gray-400 dark:text-zinc-500">vs prev {range}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
            <span>Pending COD</span>
            <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">{fmt(kpis.pending_cod?.value || 0)}</span>
          </div>
        </div>

        {/* Orders Volume */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-gray-500 dark:text-zinc-400 uppercase">Orders Volume</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/60">
              <ShoppingCart size={17} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-display text-gray-900 dark:text-zinc-100 tracking-tight">
              {kpis.orders.value} <span className="text-xs font-bold text-gray-400 dark:text-zinc-500">orders</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendBadge val={kpis.orders.trend} />
              <span className="text-[11px] text-gray-400 dark:text-zinc-500">vs prev {range}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
            <span>Delivered / Confirmed</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {kpis.delivered_orders?.value || 0} / {kpis.confirmed_orders?.value || 0}
            </span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-gray-500 dark:text-zinc-400 uppercase">Avg Order Value</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-800/60">
              <ShoppingBag size={17} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-display text-gray-900 dark:text-zinc-100 tracking-tight">
              {fmt(kpis.aov.value)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendBadge val={kpis.aov.trend} />
              <span className="text-[11px] text-gray-400 dark:text-zinc-500">basket health</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
            <span>Lifetime Orders</span>
            <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">{kpis.total_orders?.value || 0}</span>
          </div>
        </div>

        {/* Customers Reach */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-gray-500 dark:text-zinc-400 uppercase">Active Accounts</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-800/60">
              <Users size={17} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-display text-gray-900 dark:text-zinc-100 tracking-tight">
              {kpis.customers.value}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendBadge val={kpis.customers.trend} />
              <span className="text-[11px] text-gray-400 dark:text-zinc-500">new user signups</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
            <span>Returning Cohort</span>
            <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">{customer_overview?.returning || 0} active</span>
          </div>
        </div>
      </div>

      {/* Tier 2: Actionable Operational Status Radar (4 Shortcuts) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setTab("orders")}
          className="text-left bg-white dark:bg-zinc-900 hover:bg-gray-50/80 dark:hover:bg-zinc-800/60 border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 rounded-xl p-3.5 transition-all shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-fire flex items-center justify-center font-bold">
              {needs_attention.pending_orders}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-zinc-100">Unfulfilled Orders</div>
              <div className="text-[11px] text-gray-500 dark:text-zinc-400">Awaiting dispatch</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 dark:text-zinc-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={() => setTab("cod")}
          className="text-left bg-white dark:bg-zinc-900 hover:bg-gray-50/80 dark:hover:bg-zinc-800/60 border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 rounded-xl p-3.5 transition-all shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Truck size={17} />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-zinc-100">COD Remittance</div>
              <div className="text-[11px] text-gray-500 dark:text-zinc-400">{fmt(kpis.pending_cod?.value || 0)}</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 dark:text-zinc-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={() => setTab("inventory")}
          className="text-left bg-white dark:bg-zinc-900 hover:bg-gray-50/80 dark:hover:bg-zinc-800/60 border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 rounded-xl p-3.5 transition-all shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              {needs_attention.low_stock}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-zinc-100">Low Stock SKUs</div>
              <div className="text-[11px] text-gray-500 dark:text-zinc-400">&lt; 5 units remaining</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 dark:text-zinc-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={() => setTab("returns")}
          className="text-left bg-white dark:bg-zinc-900 hover:bg-gray-50/80 dark:hover:bg-zinc-800/60 border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 rounded-xl p-3.5 transition-all shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              {needs_attention.refund_requests}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-zinc-100">Returns & Claims</div>
              <div className="text-[11px] text-gray-500 dark:text-zinc-400">Customer requests</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 dark:text-zinc-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Main Charts Row: Revenue Velocity + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Main Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="font-display text-base font-bold text-gray-900 dark:text-zinc-100">Sales Velocity & Volume</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Day-by-day telemetry for the selected period</p>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-gray-200 dark:border-zinc-700 self-start">
              <button
                onClick={() => setChartView("revenue")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartView === "revenue" ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-xs" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                Revenue (PKR)
              </button>
              <button
                onClick={() => setChartView("orders")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartView === "orders" ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-xs" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                Orders Volume
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales_chart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartView === "revenue" ? "#FF3B30" : "#2563EB"} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={chartView === "revenue" ? "#FF3B30" : "#2563EB"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#9CA3AF' }}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#27272a' : '#E5E7EB' }}
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#9CA3AF' }}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#27272a' : '#E5E7EB' }}
                  tickFormatter={(v) => chartView === "revenue" ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: isDark ? '1px solid #27272a' : '1px solid #E5E7EB',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                    backgroundColor: isDark ? '#18181b' : '#FFFFFF',
                    color: isDark ? '#f4f4f5' : '#111827',
                    padding: '8px 12px'
                  }}
                  itemStyle={{ color: isDark ? '#f4f4f5' : '#111827' }}
                  formatter={(value, name) => [
                    chartView === "revenue" ? fmt(value) : `${value} orders`,
                    chartView === "revenue" ? "Revenue" : "Volume"
                  ]}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                />
                <Area
                  type="monotone"
                  dataKey={chartView}
                  stroke={chartView === "revenue" ? "#FF3B30" : "#2563EB"}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category (1 col) */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-base font-bold text-gray-900 dark:text-zinc-100">Revenue by Category</h2>
              <span className="text-[11px] font-mono text-gray-400 dark:text-zinc-500">Total: {fmt(totalCategoryRev)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">Volume distribution across sneaker categories</p>

            {sales_by_category && sales_by_category.length > 0 ? (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sales_by_category}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {sales_by_category.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: isDark ? '1px solid #27272a' : '1px solid #E5E7EB',
                          backgroundColor: isDark ? '#18181b' : '#FFFFFF',
                          color: isDark ? '#f4f4f5' : '#111827'
                        }}
                        formatter={(value) => fmt(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-1">
                  {sales_by_category.map((c, i) => {
                    const pct = totalCategoryRev > 0 ? Math.round((c.value / totalCategoryRev) * 100) : 0;
                    return (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-2 text-gray-700 dark:text-zinc-300 capitalize">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <span className="truncate max-w-[130px]">{c.name.replace(/-/g, ' ')}</span>
                          <span className="text-gray-400 dark:text-zinc-500 font-mono text-[10px]">({pct}%)</span>
                        </span>
                        <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">{fmt(c.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-gray-400 dark:text-zinc-500 text-xs">
                No categorical sales logged in this period.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
            <span>Catalog categories</span>
            <button onClick={() => setTab("products")} className="font-bold text-fire hover:underline">
              View Catalog →
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Top Selling Sneakers & Live Orders Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Top Selling Sneakers (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-base font-bold text-gray-900 dark:text-zinc-100">Top Performing Sneakers</h2>
              <button onClick={() => setTab("products")} className="text-xs font-bold text-fire hover:underline">
                All Products
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">Highest volume and revenue drivers</p>

            {top_products && top_products.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                {top_products.map((p, i) => {
                  const maxSold = Math.max(...top_products.map(x => x.sold || 1));
                  const pct = Math.round(((p.sold || 0) / maxSold) * 100);
                  return (
                    <div key={i} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono font-bold text-gray-400 dark:text-zinc-500 w-4 text-center shrink-0">
                          #{i + 1}
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image ? (
                            <img src={imgUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={18} className="text-gray-400 dark:text-zinc-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate hover:text-fire cursor-pointer" onClick={() => setTab("products")}>
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500 uppercase">{p.category || 'Sneakers'}</span>
                            <span className="text-[10px] text-gray-300 dark:text-zinc-600">•</span>
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1 rounded">{p.sold} sold</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-gray-900 dark:text-zinc-100">{fmt(p.rev)}</div>
                        <div className="w-16 bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 mt-1 ml-auto overflow-hidden">
                          <div className="bg-fire h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 dark:text-zinc-500 text-xs">
                No delivered sneaker sales recorded in this period.
              </div>
            )}
          </div>

          <button
            onClick={() => setTab("products")}
            className="w-full mt-4 py-2 text-center text-xs font-bold text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-zinc-800/60 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors border border-gray-200 dark:border-zinc-700"
          >
            Manage Product Catalog
          </button>
        </div>

        {/* Live Orders Stream (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-display text-base font-bold text-gray-900 dark:text-zinc-100">Recent Customer Orders</h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Live order queue with instant detail inspection</p>
              </div>
              <button
                onClick={() => setTab("orders")}
                className="text-xs font-bold text-fire hover:underline"
              >
                View All Orders →
              </button>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-zinc-500 font-mono text-[10px] uppercase">
                    <th className="pb-2.5 font-bold">Order</th>
                    <th className="pb-2.5 font-bold">Customer</th>
                    <th className="pb-2.5 font-bold">Payment</th>
                    <th className="pb-2.5 font-bold">Total</th>
                    <th className="pb-2.5 font-bold">Status</th>
                    <th className="pb-2.5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
                  {recent_orders && recent_orders.map((o, i) => {
                    const statusColor =
                      o.status === 'delivered' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' :
                        o.status === 'shipped' || o.status === 'out_for_delivery' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60' :
                          o.status === 'confirmed' || o.status === 'packed' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60' :
                            o.status === 'placed' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60' :
                              'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60';

                    return (
                      <tr
                        key={i}
                        className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`?tab=orders&orderId=${o.order_number}`)}
                      >
                        <td className="py-3 font-mono font-bold text-gray-900 dark:text-zinc-100 group-hover:text-fire transition-colors">
                          #{o.order_number}
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-gray-900 dark:text-zinc-100 truncate max-w-[120px]">{o.customer_name}</div>
                          {o.customer_email && (
                            <div className="text-[10px] text-gray-400 dark:text-zinc-500 truncate max-w-[120px]">{o.customer_email}</div>
                          )}
                        </td>
                        <td className="py-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${o.payment_method === 'COD' ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                            }`}>
                            {o.payment_method || 'COD'}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-bold text-gray-900 dark:text-zinc-100">
                          {fmt(o.total)}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusColor}`}>
                            {o.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 group-hover:text-fire transition-colors inline-flex items-center gap-1">
                            Inspect →
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
            <span>Showing recent {recent_orders?.length || 0} orders</span>
            <button
              onClick={() => setTab("orders")}
              className="text-xs font-bold text-gray-900 dark:text-zinc-100 hover:text-fire transition-colors"
            >
              Open Full Orders Manager →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  placed: { label: "Placed", dot: "bg-sky-500", badge: "bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800" },
  confirmed: { label: "Confirmed", dot: "bg-purple-500", badge: "bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800" },
  packed: { label: "Packed", dot: "bg-indigo-500", badge: "bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800" },
  shipped: { label: "Shipped", dot: "bg-blue-500", badge: "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800" },
  out_for_delivery: { label: "Out for Delivery", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800" },
  delivered: { label: "Delivered", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" },
  cancelled: { label: "Cancelled", dot: "bg-rose-500", badge: "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800" },
  returned: { label: "Returned", dot: "bg-zinc-500", badge: "bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700" },
};

function StatusBadgeDropdown({ currentStatus, onSelect, disabled = false, size = "sm" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cfg = STATUS_CONFIG[currentStatus] || { label: currentStatus || "Unknown", dot: "bg-gray-400", badge: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700" };

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutside);
      return () => document.removeEventListener("mousedown", handleOutside);
    }
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={ref} onClick={e => e.stopPropagation()}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider transition-all shadow-sm ${cfg.badge} ${size === "md" ? "px-3.5 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]"} hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}
        title="Click to change order status"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
        <span>{cfg.label}</span>
        <ChevronDown size={11} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800 mb-1">
            Change Status
          </div>
          {ORDER_STATES.map((s) => {
            const itemCfg = STATUS_CONFIG[s] || { label: s, dot: "bg-gray-400" };
            const isSelected = s === currentStatus;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onSelect(s);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition-colors ${isSelected
                  ? "bg-fire/10 text-fire font-bold dark:bg-fire/20"
                  : "text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${itemCfg.dot}`} />
                  <span>{itemCfg.label}</span>
                </div>
                {isSelected && <Check size={13} className="text-fire" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const action = searchParams.get("action");

  const [data, setData] = useState({ orders: [], pagination: {}, status_counts: {} });
  const [loading, setLoading] = useState(true);
  const urlSearch = searchParams.get("search") || "";
  const [query, setQuery] = useState({ page: 1, limit: 10, status: "all", payment: "all", date: "all", search: urlSearch });
  const [searchInput, setSearchInput] = useState(urlSearch);

  useEffect(() => {
    const s = searchParams.get("search") || "";
    if (s !== query.search) {
      setSearchInput(s);
      setQuery(prev => ({ ...prev, search: s, page: 1 }));
    }
  }, [searchParams.get("search")]);
  const [selected, setSelected] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showStatusGuide, setShowStatusGuide] = useState(false);
  const [trackParcelOrder, setTrackParcelOrder] = useState(null);
  const [showBulkStatusMenu, setShowBulkStatusMenu] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const bulkDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(e.target)) {
        setShowBulkStatusMenu(false);
      }
    };
    if (showBulkStatusMenu) {
      document.addEventListener("mousedown", handleOutside);
      return () => document.removeEventListener("mousedown", handleOutside);
    }
  }, [showBulkStatusMenu]);

  const openOrder = (o) => {
    const next = new URLSearchParams(searchParams);
    next.set("orderId", o.order_number || o.id);
    next.delete("action");
    setSearchParams(next);
  };

  const closeOrder = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("orderId");
    next.delete("action");
    setSearchParams(next);
  };

  const openNewOrder = () => {
    const next = new URLSearchParams(searchParams);
    next.set("action", "new");
    next.delete("orderId");
    setSearchParams(next);
  };

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams(query).toString();
    http.get(`/admin/orders?${q}`).then(({ data }) => {
      setData(data.data);
      setLoading(false);
      setSelected([]);
    });
  };

  useEffect(() => { load(); }, [query]);

  // Live key-based debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setQuery(prev => {
        if (prev.search === searchInput) return prev;
        return { ...prev, search: searchInput, page: 1 };
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const updateStatus = async (id, status) => {
    try {
      await http.patch(`/admin/orders/${id}/status`, { status });
      toast.success(`Order status updated to ${status}`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update status");
    }
  };

  const bulkUpdateStatus = (status) => {
    setConfirmModal({
      isOpen: true,
      title: `Update ${selected.length} orders?`,
      message: `Are you sure you want to mark ${selected.length} selected orders as "${status.replace(/_/g, ' ')}"?`,
      confirmText: `Mark as ${status.replace(/_/g, ' ')}`,
      variant: status === "cancelled" ? "danger" : "primary",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await http.patch(`/admin/orders/bulk-status`, { orderIds: selected, status });
          toast.success(`Updated ${selected.length} orders to ${status}`);
          setConfirmModal({ isOpen: false });
          load();
        } catch (e) {
          toast.error(e.response?.data?.detail || "Failed to update status");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelected(selected.length === data.orders.length ? [] : data.orders.map(o => o.id));

  const printPackingSlips = () => {
    const selectedOrders = data.orders.filter(o => selected.includes(o.id));
    if (selectedOrders.length === 0) return toast.error('No orders selected');
    const html = `
      <!DOCTYPE html><html><head><title>Packing Slips</title><style>
        @page { size: A5; margin: 10mm; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #111; }
        .slip { page-break-after: always; padding: 10px; border: 1px solid #ccc; }
        .slip:last-child { page-break-after: avoid; }
        .header { display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 10px; }
        .logo { font-size: 18px; font-weight: 900; letter-spacing: -1px; }
        .dot { color: #FF3B30; }
        .order-num { font-size: 16px; font-weight: bold; font-family: monospace; }
        .section { margin: 8px 0; }
        .label { font-size: 9px; text-transform: uppercase; color: #666; font-weight: bold; letter-spacing: 1px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background: #f0f0f0; }
        .total-row { font-weight: bold; }
        .barcode { text-align: center; margin-top: 15px; font-family: monospace; font-size: 20px; letter-spacing: 3px; }
      </style></head><body>
      ${selectedOrders.map(o => `
        <div class="slip">
          <div class="header">
            <div class="logo">SOLEKICKS<span class="dot">.</span></div>
            <div class="order-num">#${o.order_number}</div>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <div class="section">
              <div class="label">Customer</div>
              <strong>${o.customer_name}</strong><br>
              ${o.shipping_address?.address_l1 || ''}<br>
              ${o.shipping_address?.city || ''}, ${o.shipping_address?.province || ''}<br>
              Phone: ${o.customer_phone}
            </div>
            <div class="section">
              <div class="label">Order Info</div>
              Date: ${new Date(o.created_at).toLocaleDateString()}<br>
              Payment: <strong>${o.payment_status}</strong><br>
              Method: ${o.payment_method}<br>
              ${o.tracking_number ? 'Tracking: <strong>' + o.tracking_number + '</strong>' : ''}
            </div>
          </div>
          <table>
            <thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead>
            <tbody>
              ${(o.items || []).map(it => `
                <tr><td>${it.product_name}</td><td>${it.size}</td><td>${it.quantity}</td><td>Rs. ${it.unit_price?.toLocaleString()}</td></tr>
              `).join('')}
              <tr class="total-row"><td colspan="3">Total</td><td>Rs. ${o.total?.toLocaleString()}</td></tr>
            </tbody>
          </table>
          <div class="barcode">${o.order_number}</div>
        </div>
      `).join('')}
      </body></html>
    `;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.print(); };
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(prev => ({ ...prev, search: searchInput, page: 1 }));
  };

  const resetFilters = () => {
    setSearchInput("");
    setQuery({ page: 1, limit: 10, status: "all", payment: "all", date: "all", search: "" });
  };

  const exportOrders = () => {
    if (!data.orders || data.orders.length === 0) return toast.error("No orders to export");
    const headers = ["Order ID", "Date", "Customer", "Email", "Phone", "Status", "Payment", "Total"];
    const rows = data.orders.map(o => [
      o.order_number,
      new Date(o.created_at).toLocaleDateString(),
      `"${o.customer_name}"`,
      o.shipping_address?.email || "",
      o.customer_phone,
      o.status,
      o.payment_status,
      o.total
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const TABS = [
    { id: "all", label: "All", count: data.status_counts?.all || 0 },
    { id: "placed", label: "Placed", count: data.status_counts?.placed || 0 },
    { id: "confirmed", label: "Confirmed", count: data.status_counts?.confirmed || 0 },
    { id: "packed", label: "Packed", count: data.status_counts?.packed || 0 },
    { id: "shipped", label: "Shipped", count: data.status_counts?.shipped || 0 },
    { id: "out_for_delivery", label: "Out for Delivery", count: data.status_counts?.out_for_delivery || 0 },
    { id: "delivered", label: "Delivered", count: data.status_counts?.delivered || 0 },
    { id: "cancelled", label: "Cancelled", count: data.status_counts?.cancelled || 0 },
    { id: "returned", label: "Returned", count: data.status_counts?.returned || 0 },
  ];

  if (action === "new") {
    return (
      <CreateOrderPage
        onBack={closeOrder}
        onCreated={(created) => {
          const next = new URLSearchParams(searchParams);
          next.delete("action");
          if (created?.order_number || created?.id) {
            next.set("orderId", created.order_number || created.id);
          }
          setSearchParams(next);
          load();
        }}
      />
    );
  }

  if (orderId) {
    const existingOrder = data.orders.find(o => o.order_number === orderId || o.id === orderId);
    return (
      <OrderDetailPage
        orderId={orderId}
        initialOrder={existingOrder}
        onBack={closeOrder}
        onUpdate={load}
      />
    );
  }

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-black text-gray-900 dark:text-zinc-100">Orders Management</h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400 font-medium">Search, dispatch, track, and fulfill customer sneaker drops</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => setShowStatusGuide(true)} className="px-3 py-2 text-xs font-bold border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 transition-colors flex items-center gap-1.5 shadow-sm">
            <HelpCircle size={14} className="text-gray-500 dark:text-zinc-400" /> Status Guide
          </button>
          <button onClick={exportOrders} className="px-3 py-2 text-xs font-bold border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 transition-colors flex items-center gap-1.5 shadow-sm">
            <Download size={14} className="text-gray-500 dark:text-zinc-400" /> Export CSV
          </button>
          <button onClick={openNewOrder} className="px-4 py-2 text-xs font-bold bg-black dark:bg-fire text-white hover:bg-fire dark:hover:bg-fire/90 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
            <Plus size={15} /> Create Order
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200 dark:border-zinc-800 mb-6 gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setQuery({ ...query, status: t.id, page: 1 })}
            className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 flex items-center gap-2 transition-all ${query.status === t.id
              ? 'border-fire text-fire dark:border-fire dark:text-fire font-black'
              : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300'
              }`}>
            {t.label}
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${query.status === t.id
              ? 'bg-fire text-white'
              : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700'
              }`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search & Dynamic Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 border border-gray-200 dark:border-zinc-800 mb-6 flex flex-col lg:flex-row gap-4 items-center shadow-sm rounded-xl">
        <form onSubmit={handleSearch} className="flex-1 relative w-full">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Live search by order #, customer name, phone, or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-9 py-2 border border-gray-300 dark:border-zinc-700 text-sm font-medium text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:border-black dark:focus:border-fire focus:ring-1 focus:ring-black dark:focus:ring-fire focus:outline-none rounded-lg bg-white dark:bg-zinc-800"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setQuery(prev => ({ ...prev, search: "", page: 1 }));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-fire"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </form>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <select
            value={query.status}
            onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })}
            className="border border-gray-300 dark:border-zinc-700 px-3 py-2 text-xs font-bold text-gray-800 dark:text-zinc-100 focus:outline-none rounded-lg bg-white dark:bg-zinc-800 shadow-sm"
          >
            <option value="all">Status: All</option>
            {ORDER_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={query.payment}
            onChange={(e) => setQuery({ ...query, payment: e.target.value, page: 1 })}
            className="border border-gray-300 dark:border-zinc-700 px-3 py-2 text-xs font-bold text-gray-800 dark:text-zinc-100 focus:outline-none rounded-lg bg-white dark:bg-zinc-800 shadow-sm"
          >
            <option value="all">Payment: All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            value={query.date}
            onChange={(e) => setQuery({ ...query, date: e.target.value, page: 1 })}
            className="border border-gray-300 dark:border-zinc-700 px-3 py-2 text-xs font-bold text-gray-800 dark:text-zinc-100 focus:outline-none rounded-lg bg-white dark:bg-zinc-800 shadow-sm"
          >
            <option value="all">Date: All time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button onClick={resetFilters} className="text-xs font-bold text-gray-500 dark:text-zinc-400 hover:text-fire px-3 py-2">
            Reset
          </button>
        </div>
      </div>

      {/* Bulk Actions Floating Bar with ALL Statuses */}
      {selected.length > 0 && (
        <div className="bg-black dark:bg-zinc-900 border border-zinc-800 text-white p-3.5 flex flex-wrap gap-3 justify-between items-center mb-4 sticky top-14 z-20 shadow-xl rounded-xl animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-fire animate-ping" />
              {selected.length} order{selected.length === 1 ? '' : 's'} selected
            </span>
            <button
              onClick={() => setSelected([])}
              className="text-xs text-zinc-400 hover:text-white underline ml-1 cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={printPackingSlips} className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
              <Printer size={13} /> Print Slips
            </button>

            <button onClick={() => bulkUpdateStatus('packed')} className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer">
              Mark Packed
            </button>
            <button onClick={() => bulkUpdateStatus('shipped')} className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer">
              Mark Shipped
            </button>
            <button onClick={() => bulkUpdateStatus('delivered')} className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer">
              Mark Delivered
            </button>

            {/* All 8 Statuses Dropdown Popover */}
            <div className="relative inline-block text-left" ref={bulkDropdownRef}>
              <button
                type="button"
                onClick={() => setShowBulkStatusMenu(!showBulkStatusMenu)}
                className="px-3.5 py-1.5 text-xs font-bold bg-fire hover:bg-fire/90 text-white rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Update Status to...</span>
                <ChevronDown size={13} className={`transition-transform duration-150 ${showBulkStatusMenu ? "rotate-180" : ""}`} />
              </button>

              {showBulkStatusMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-2xl py-1.5 z-50 text-gray-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800">
                    Apply Status to {selected.length} orders
                  </div>
                  {ORDER_STATES.map((s) => {
                    const cfg = STATUS_CONFIG[s] || { label: s, dot: "bg-gray-400" };
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setShowBulkStatusMenu(false);
                          bulkUpdateStatus(s);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 text-left transition-colors cursor-pointer"
                      >
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span className="capitalize">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders Data Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-400 dark:text-zinc-500 font-mono flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin text-fire" /> Loading orders drop...
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/80 text-gray-600 dark:text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5 w-10"><input type="checkbox" checked={selected.length === data.orders.length && data.orders.length > 0} onChange={selectAll} className="accent-black rounded" /></th>
                <th className="p-3.5">Order Ref</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Sneakers</th>
                <th className="p-3.5">Total</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Status (1-Click)</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {data.orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-gray-400 dark:text-zinc-500 font-medium">
                    No sneaker orders found matching your filters.
                  </td>
                </tr>
              ) : data.orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group" onClick={() => openOrder(o)}>
                  <td className="p-3.5" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggleSelect(o.id)} className="accent-black rounded" />
                  </td>
                  <td className="p-3.5 font-mono font-bold text-gray-900 dark:text-zinc-100 group-hover:text-fire transition-colors">
                    #{o.order_number}
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-gray-900 dark:text-zinc-100">{o.customer_name}</div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400 font-mono">{o.customer_phone}</div>
                  </td>
                  <td className="p-3.5 font-mono text-gray-600 dark:text-zinc-300">
                    {o.items?.length || 0} pair{o.items?.length === 1 ? '' : 's'}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-gray-900 dark:text-zinc-100">
                    {fmt(o.total)}
                  </td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${o.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' :
                      o.payment_status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' :
                        'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                      }`}>
                      {o.payment_status || 'COD'}
                    </span>
                  </td>
                  <td className="p-3.5" onClick={e => e.stopPropagation()}>
                    <StatusBadgeDropdown
                      currentStatus={o.status}
                      onSelect={(newStatus) => updateStatus(o.id, newStatus)}
                    />
                  </td>
                  <td className="p-3.5 text-gray-500 dark:text-zinc-400 font-mono text-xs">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3.5 text-center relative" onClick={e => e.stopPropagation()}>
                    <TableActionDropdown
                      isOpen={activeDropdown === o.id}
                      onToggle={() => setActiveDropdown(activeDropdown === o.id ? null : o.id)}
                      onClose={() => setActiveDropdown(null)}
                    >
                      <button onClick={() => { openOrder(o); setActiveDropdown(null); }} className="w-full px-4 py-2 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2 font-bold transition-colors cursor-pointer"><Eye size={14} className="text-gray-400" /> View Full Order</button>
                      {(o.tracking_number || o.status === 'shipped') && (
                        <button onClick={() => { setTrackParcelOrder(o); setActiveDropdown(null); }} className="w-full px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2 font-bold transition-colors cursor-pointer"><Truck size={14} /> Track Parcel</button>
                      )}
                      <button onClick={() => {
                        navigator.clipboard.writeText(o.order_number);
                        toast.success("Order reference copied!");
                        setActiveDropdown(null);
                      }} className="w-full px-4 py-2 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2 font-bold transition-colors cursor-pointer"><Copy size={14} className="text-gray-400" /> Copy Order #</button>
                    </TableActionDropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 bg-white dark:bg-zinc-900 p-4 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 text-xs text-gray-700 dark:text-zinc-300 font-medium">
          <span>Rows per page:</span>
          <select
            value={query.limit}
            onChange={(e) => setQuery({ ...query, limit: Number(e.target.value), page: 1 })}
            className="border border-gray-300 dark:border-zinc-700 rounded-md px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black shadow-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="font-mono text-gray-600 dark:text-zinc-400">
            {data.pagination?.totalCount > 0 ? (
              <>Showing <strong className="text-gray-900 dark:text-zinc-100">{(query.page - 1) * query.limit + 1}</strong> to <strong className="text-gray-900 dark:text-zinc-100">{Math.min(query.page * query.limit, data.pagination.totalCount)}</strong> of <strong className="text-gray-900 dark:text-zinc-100">{data.pagination.totalCount}</strong> orders</>
            ) : "0 orders found"}
          </span>
        </div>

        {data.pagination?.totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              disabled={query.page === 1}
              onClick={() => setQuery({ ...query, page: 1 })}
              className="px-2.5 py-1 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold text-gray-800 dark:text-zinc-200 transition-colors shadow-sm"
              title="First Page"
            >
              «
            </button>
            <button
              disabled={query.page === 1}
              onClick={() => setQuery({ ...query, page: query.page - 1 })}
              className="px-3 py-1 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold text-gray-800 dark:text-zinc-200 transition-colors shadow-sm"
            >
              Prev
            </button>

            {Array.from({ length: Math.min(5, data.pagination.totalPages) }).map((_, i) => {
              let pNum = i + 1;
              if (data.pagination.totalPages > 5 && query.page > 3) {
                pNum = query.page - 2 + i;
                if (pNum > data.pagination.totalPages) pNum = data.pagination.totalPages - (4 - i);
              }
              return (
                <button
                  key={pNum}
                  onClick={() => setQuery({ ...query, page: pNum })}
                  className={`w-8 h-7 text-xs font-bold font-mono rounded-md border transition-all ${query.page === pNum
                    ? "bg-black dark:bg-fire text-white border-black dark:border-fire shadow-sm"
                    : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700"
                    }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              disabled={query.page === data.pagination.totalPages}
              onClick={() => setQuery({ ...query, page: query.page + 1 })}
              className="px-3 py-1 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold text-gray-800 dark:text-zinc-200 transition-colors shadow-sm"
            >
              Next
            </button>
            <button
              disabled={query.page === data.pagination.totalPages}
              onClick={() => setQuery({ ...query, page: data.pagination.totalPages })}
              className="px-2.5 py-1 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold text-gray-800 dark:text-zinc-200 transition-colors shadow-sm"
              title="Last Page"
            >
              »
            </button>
          </div>
        )}
      </div>

      {/* Status Guide Modal */}
      {showStatusGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowStatusGuide(false)}>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 max-w-xl w-full shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50">
              <h3 className="font-display text-base font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2"><HelpCircle size={18} className="text-fire" /> Order Status Lifecycle Guide</h3>
              <button onClick={() => setShowStatusGuide(false)} className="text-gray-400 hover:text-fire"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {ORDER_STATES.map(s => {
                const cfg = STATUS_CONFIG[s] || { label: s, dot: "bg-gray-400" };
                const descriptions = {
                  placed: "Order received through online storefront or manual admin POS. Inventory reserved.",
                  confirmed: "Customer phone verified or payment proof accepted by store agent.",
                  packed: "Box inspected, QC passed, and placed in courier dispatch parcel polybag.",
                  shipped: "Handed over to courier (TCS, Trax, Leopards) with active AWB tracking number.",
                  out_for_delivery: "Rider is actively attempting doorstep delivery and collecting COD amount.",
                  delivered: "Successfully received by customer, payment reconciled in bank/account.",
                  cancelled: "Order terminated prior to dispatch. Stock automatically released back.",
                  returned: "Customer refused parcel or return-to-origin completed by courier."
                };
                return (
                  <div key={s} className="p-3 rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40 flex items-start gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${cfg.dot}`} />
                    <div>
                      <span className="font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100 text-xs block mb-0.5">{cfg.label}</span>
                      <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">{descriptions[s]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText="Cancel"
        variant={confirmModal.variant || "primary"}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}

function CreateOrderPage({ onBack, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [fetchingProducts, setFetchingProducts] = useState(true);

  // Catalog filters & search
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Form state (Customer & Address)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [addressL1, setAddressL1] = useState("");
  const [addressL2, setAddressL2] = useState("");
  const [province, setProvince] = useState("Sindh");
  const [city, setCity] = useState("Karachi");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [shippingFee, setShippingFee] = useState(250);
  const [customerNote, setCustomerNote] = useState("");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponMsg, setCouponMsg] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  // Items added to the order basket
  const [items, setItems] = useState([]);

  // Active sneaker selection for PDP-style configurator
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);

  useEffect(() => {
    http.get('/products?limit=100')
      .then(res => {
        const prods = res.data?.data || [];
        setProducts(prods);
        if (prods.length > 0) {
          setSelectedProduct(prods[0]);
          const firstInStock = prods[0].sizes?.find(s => s.stock > 0);
          setSelectedSize(firstInStock ? firstInStock.size : (prods[0].sizes?.[0]?.size || "42"));
        }
      })
      .catch(() => toast.error("Could not load products catalog"))
      .finally(() => setFetchingProducts(false));
  }, []);

  // Filter products by category, search term, and in-stock toggle
  const categories = ["all", ...new Set(products.map(p => p.category_slug || p.brand_slug).filter(Boolean))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = !catalogSearch.trim() ||
      p.name?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.brand_slug?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.category_slug?.toLowerCase().includes(catalogSearch.toLowerCase());

    const matchesCat = selectedCategory === "all" ||
      p.category_slug === selectedCategory ||
      p.brand_slug === selectedCategory;

    const totalStock = (p.sizes || []).reduce((acc, s) => acc + (s.stock || 0), 0);
    const matchesStock = !onlyInStock || totalStock > 0;

    return matchesSearch && matchesCat && matchesStock;
  });

  const selectSneaker = (prod) => {
    setSelectedProduct(prod);
    if (prod && prod.sizes?.length > 0) {
      const inStock = prod.sizes.find(s => s.stock > 0);
      setSelectedSize(inStock ? inStock.size : prod.sizes[0].size);
      setSelectedQty(1);
    }
  };

  const addItem = () => {
    if (!selectedProduct) return toast.error("Select a sneaker first");
    if (!selectedSize) return toast.error("Select a size");

    const sizeObj = selectedProduct.sizes?.find(s => s.size === selectedSize);
    if (!sizeObj || sizeObj.stock < selectedQty) {
      return toast.error(`Only ${sizeObj?.stock || 0} pair(s) available in size ${selectedSize}`);
    }

    const existingIdx = items.findIndex(it => it.product_id === selectedProduct.id && it.size === selectedSize);
    if (existingIdx >= 0) {
      const current = items[existingIdx];
      const newQty = current.quantity + selectedQty;
      if (newQty > sizeObj.stock) {
        return toast.error(`Cannot add more than ${sizeObj.stock} available pairs in size ${selectedSize}`);
      }
      const updated = [...items];
      updated[existingIdx].quantity = newQty;
      setItems(updated);
    } else {
      const unitPrice = selectedProduct.is_flash_sale && selectedProduct.flash_sale_price
        ? selectedProduct.flash_sale_price
        : selectedProduct.base_price;

      setItems(prev => [
        ...prev,
        {
          product_id: selectedProduct.id,
          name: selectedProduct.name,
          image: selectedProduct.images?.[0] || selectedProduct.hover_image || '',
          size: selectedSize,
          unit_price: unitPrice,
          quantity: selectedQty,
          max_stock: sizeObj.stock
        }
      ]);
    }

    toast.success(`Added ${selectedProduct.name} (EU ${selectedSize}) to bag`);
  };

  const updateItemQty = (idx, delta) => {
    setItems(prev => {
      const updated = [...prev];
      const it = updated[idx];
      const newQty = it.quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== idx);
      }
      if (newQty > it.max_stock) {
        toast.error(`Max stock available is ${it.max_stock}`);
        return prev;
      }
      it.quantity = newQty;
      return updated;
    });
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((acc, it) => acc + (it.unit_price * it.quantity), 0);
  const total = Math.max(0, subtotal + Number(shippingFee || 0) - Number(discountAmount || 0));

  useEffect(() => {
    if (subtotal >= 5000) {
      setShippingFee(0);
    } else if (subtotal > 0 && shippingFee === 0) {
      setShippingFee(250);
    }
  }, [subtotal]);

  // Handle Province change: updates Province and automatically sets City to first city in that province
  const handleProvinceChange = (newProvince) => {
    setProvince(newProvince);
    const availableCities = PROVINCE_CITIES[newProvince] || [];
    setCity(availableCities[0] || "");
  };

  // Coupon Application Handler (mirrors public checkout)
  const applyCoupon = async () => {
    if (!couponCode.trim()) return toast.error("Please enter a coupon code");
    if (subtotal <= 0) return toast.error("Add at least one sneaker before applying coupon");

    setApplyingCoupon(true);
    try {
      const { data } = await http.post("/checkout/apply-coupon", {
        code: couponCode.trim(),
        subtotal
      });
      const disc = Number(data.data.discount) || 0;
      setDiscountAmount(disc);
      setCouponMsg(`✓ ${data.data.code} applied — you save Rs. ${disc.toLocaleString()}`);
      toast.success(`Coupon ${data.data.code} applied successfully!`);
    } catch (e) {
      setDiscountAmount(0);
      setCouponMsg(e.response?.data?.detail || "Invalid or expired coupon code");
      toast.error(e.response?.data?.detail || "Invalid coupon code");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setDiscountAmount(0);
    setCouponMsg("");
    toast.success("Coupon removed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) return toast.error("Customer name is required");
    if (!customerPhone.trim()) return toast.error("Customer phone is required");
    if (!addressL1.trim()) return toast.error("Delivery address is required");
    if (!city.trim()) return toast.error("City is required");
    if (items.length === 0) return toast.error("Please add at least one sneaker to the order");

    setLoading(true);
    try {
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || null,
        shipping_address: {
          address_l1: addressL1.trim(),
          address_l2: addressL2.trim() || undefined,
          city: city.trim(),
          province: province.trim(),
          country_code: "PK"
        },
        items: items.map(it => ({
          product_id: it.product_id,
          size: it.size,
          quantity: it.quantity
        })),
        payment_method: paymentMethod,
        shipping_fee: Number(shippingFee) || 0,
        discount_amount: Number(discountAmount) || 0,
        coupon_code: discountAmount > 0 && couponCode.trim() ? couponCode.trim() : undefined,
        customer_note: customerNote.trim() || undefined
      };

      const res = await http.post('/admin/orders', payload);
      toast.success(`Order #${res.data?.data?.order_number} created successfully!`);
      onCreated(res.data?.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const activeSizeObj = selectedProduct?.sizes?.find(s => s.size === selectedSize);
  const activeStock = activeSizeObj ? activeSizeObj.stock : 0;
  const activeUnitPrice = selectedProduct ? (
    selectedProduct.is_flash_sale && selectedProduct.flash_sale_price
      ? selectedProduct.flash_sale_price
      : selectedProduct.base_price
  ) : 0;

  // Cities belonging to the currently selected province
  const currentProvinceCities = PROVINCE_CITIES[province] || [];

  return (
    <div className="pb-16 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-bold text-xs rounded-lg border border-gray-300 dark:border-zinc-700 shadow-sm transition-all hover:-translate-x-0.5 cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Orders
          </button>
          <span className="text-gray-300 dark:text-zinc-700 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-mono font-bold text-gray-500 dark:text-zinc-400 hidden sm:inline">Orders</span>
          <span className="text-gray-300 dark:text-zinc-700 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-mono font-black text-fire hidden sm:inline">New Manual Order</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-gray-200 dark:border-zinc-700">
            {products.length} Sneaker models available
          </span>
        </div>
      </div>

      <div>
        <h1 className="font-display tracking-tight text-2xl lg:text-3xl font-black text-gray-900 dark:text-zinc-100">
          Manual Order Placement Desk
        </h1>
        <p className="text-sm text-gray-600 dark:text-zinc-400 font-medium">
          Visual sneaker catalog selection, real-time EU warehouse sizing, province-based destination routing, and coupon discounts.
        </p>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column (7 cols): Sneaker Catalog Picker + Customer Destination */}
        <div className="lg:col-span-7 space-y-6">

          {/* Card 1: Visual Sneaker Selector with Search & Filtering */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                  <Package size={16} className="text-fire" /> 1. Select Sneaker Model
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">Click any sneaker card to configure size & quantity</p>
              </div>

              {/* In-Stock Only Toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={e => setOnlyInStock(e.target.checked)}
                  className="rounded text-fire accent-fire"
                />
                <span>In-Stock Only</span>
              </label>
            </div>

            {/* Catalog Search & Category Filter Pills */}
            <div className="space-y-2.5">
              <div className="relative">
                <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search sneakers by name, brand (Jordan, Nike, Yeezy), or SKU..."
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 border border-gray-300 dark:border-zinc-700 rounded-xl text-xs font-medium text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-fire placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-fire cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex overflow-x-auto hide-scrollbar gap-1.5 py-1">
                {categories.slice(0, 8).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCategory(c)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === c
                      ? "bg-black dark:bg-fire text-white shadow-sm"
                      : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                      }`}
                  >
                    {c === "all" ? "All Drops" : c.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Sneaker Cards Scrollable Grid */}
            {fetchingProducts ? (
              <div className="p-8 text-center text-gray-400 dark:text-zinc-500 font-mono flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-fire" /> Loading sneaker inventory...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl text-xs text-gray-500 dark:text-zinc-400 font-mono">
                No sneakers found matching "{catalogSearch}". Try another keyword or clear filter.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {filteredProducts.map(p => {
                  const isSelected = selectedProduct?.id === p.id;
                  const totalStock = (p.sizes || []).reduce((acc, s) => acc + (s.stock || 0), 0);
                  const displayPrice = p.is_flash_sale && p.flash_sale_price ? p.flash_sale_price : p.base_price;
                  const img = p.images?.[0] || p.hover_image || '';

                  return (
                    <div
                      key={p.id}
                      onClick={() => selectSneaker(p)}
                      className={`cursor-pointer p-2.5 rounded-xl border transition-all text-left relative flex flex-col justify-between group ${isSelected
                        ? "border-fire bg-fire/5 dark:bg-fire/10 ring-2 ring-fire/50 shadow-sm"
                        : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 hover:border-gray-400 dark:hover:border-zinc-600"
                        }`}
                    >
                      <div>
                        <div className="aspect-square bg-gray-50 dark:bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center mb-2 border border-gray-100 dark:border-zinc-700">
                          {img ? (
                            <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                          ) : (
                            <Package size={24} className="text-gray-300" />
                          )}
                        </div>
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 dark:text-zinc-500 block truncate">
                          {p.brand_slug?.replace('-', ' ') || 'SNEAKER'}
                        </span>
                        <p className="font-bold text-xs text-gray-900 dark:text-zinc-100 line-clamp-1 leading-snug">
                          {p.name}
                        </p>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-gray-100 dark:border-zinc-700/60 flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-fire">
                          {fmt(displayPrice)}
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${totalStock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                          {totalStock > 0 ? `${totalStock} in stock` : 'Sold out'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active Sneaker Sizing Bench (PDP Style) */}
            {selectedProduct && (
              <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white dark:bg-zinc-800 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 shrink-0">
                    <img src={selectedProduct.images?.[0] || selectedProduct.hover_image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-fire">
                      Selected Silhouette
                    </span>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-zinc-100 truncate">
                      {selectedProduct.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-xs text-gray-900 dark:text-zinc-100">
                        {fmt(activeUnitPrice)}
                      </span>
                      {selectedProduct.compare_at_price > activeUnitPrice && (
                        <span className="font-mono text-xs text-gray-400 line-through">
                          {fmt(selectedProduct.compare_at_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* EU Size Selection Grid */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-xs text-gray-700 dark:text-zinc-300">
                      Select EU Size
                    </label>
                    {selectedSize && (
                      <span className="text-[11px] font-mono text-gray-500 dark:text-zinc-400">
                        {activeStock > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">● {activeStock} pairs available</span>
                        ) : (
                          <span className="text-rose-500 font-bold">● Out of stock</span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {selectedProduct.sizes?.map(s => {
                      const isSelected = selectedSize === s.size;
                      const inStock = s.stock > 0;
                      return (
                        <button
                          key={s.size}
                          type="button"
                          disabled={!inStock}
                          onClick={() => {
                            setSelectedSize(s.size);
                            setSelectedQty(1);
                          }}
                          className={`py-2 rounded-lg border text-xs font-mono transition-all text-center flex flex-col items-center justify-center cursor-pointer ${isSelected
                            ? "bg-black dark:bg-fire text-white border-black dark:border-fire shadow-sm font-bold scale-[1.02]"
                            : inStock
                              ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 border-gray-200 dark:border-zinc-700 hover:border-black dark:hover:border-white font-semibold"
                              : "bg-gray-100 dark:bg-zinc-950 text-gray-400 dark:text-zinc-600 border-gray-200 dark:border-zinc-800 line-through cursor-not-allowed opacity-50"
                            }`}
                        >
                          <span className="font-bold">{s.size}</span>
                          <span className="text-[9px] opacity-75">{inStock ? `${s.stock} left` : '0'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity and Add Button */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-28">
                    <label className="font-bold text-xs text-gray-700 dark:text-zinc-300 block mb-1">Quantity</label>
                    <div className="flex items-center border border-gray-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-800">
                      <button
                        type="button"
                        onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                        className="px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-mono font-bold text-xs text-gray-900 dark:text-zinc-100">
                        {selectedQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedQty(Math.min(activeStock || 10, selectedQty + 1))}
                        className="px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 pt-5">
                    <button
                      type="button"
                      disabled={!activeStock || activeStock <= 0}
                      onClick={addItem}
                      className="w-full bg-black dark:bg-fire hover:bg-fire dark:hover:bg-fire/90 text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                    >
                      <Plus size={15} /> Add EU {selectedSize || '--'} to Order Bag
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Customer Contact & Delivery Address (Province-Driven City Selection) */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
              <Users size={16} className="text-fire" /> 2. Customer & Delivery Destination
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-xs text-gray-700 dark:text-zinc-300 block mb-1">Customer Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Tariq Mehmood"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-medium text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-fire"
                />
              </div>
              <div>
                <label className="font-bold text-xs text-gray-700 dark:text-zinc-300 block mb-1">Phone Number (COD Contact) *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 03001234567"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-mono font-bold text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-fire"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-xs text-gray-700 dark:text-zinc-300 block mb-1">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="customer@gmail.com (for digital order invoice)"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-medium text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-fire"
              />
            </div>

            {/* Dynamic Province & City Selection (Exactly like Public Checkout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-xs text-gray-700 dark:text-zinc-300 block mb-1">Province *</label>
                <select
                  value={province}
                  onChange={e => handleProvinceChange(e.target.value)}
                  className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-semibold text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-fire cursor-pointer"
                >
                  {PROVINCES.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-xs text-gray-700 dark:text-zinc-300 block mb-1">
                  City ({currentProvinceCities.length} in {province}) *
                </label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-semibold text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-fire cursor-pointer"
                >
                  {currentProvinceCities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-xs text-gray-700 dark:text-zinc-300 block mb-1">Street Address Line 1 *</label>
              <input
                required
                type="text"
                placeholder="House / Flat #, Street, Block, Sector / Area"
                value={addressL1}
                onChange={e => setAddressL1(e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-medium text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-fire"
              />
            </div>

            <div>
              <label className="font-bold text-xs text-gray-700 dark:text-zinc-300 block mb-1">Address Line 2 (Optional Landmark)</label>
              <input
                type="text"
                placeholder="Near landmark / mosque / school"
                value={addressL2}
                onChange={e => setAddressL2(e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-medium text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-fire"
              />
            </div>

            <div>
              <label className="font-bold text-xs text-gray-700 dark:text-zinc-300 block mb-1">Special Delivery Instructions / Note</label>
              <textarea
                rows={2}
                placeholder="e.g. Call before delivery, handle sneaker box with care"
                value={customerNote}
                onChange={e => setCustomerNote(e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg p-3 text-xs text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-fire resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Order Basket + Payment Cards + Total Checkout Receipt with Coupons */}
        <div className="lg:col-span-5 space-y-6">

          {/* Card 3: Order Basket Table (Public Cart Style) */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                <ShoppingBag size={16} className="text-fire" /> Order Basket ({items.reduce((acc, it) => acc + it.quantity, 0)} items)
              </h2>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-[11px] text-gray-400 hover:text-fire transition-colors cursor-pointer"
                >
                  Clear Bag
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl space-y-2">
                <ShoppingBag size={28} className="mx-auto text-gray-300 dark:text-zinc-600" />
                <p className="font-bold text-xs text-gray-600 dark:text-zinc-400">Order bag is currently empty</p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                  Pick a sneaker from the catalog on the left and select an EU size to add pairs.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-800 max-h-[320px] overflow-y-auto pr-1">
                {items.map((it, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {it.image ? (
                        <img src={it.image} alt={it.name} className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-zinc-700 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-lg grid place-items-center text-gray-400 shrink-0"><Package size={18} /></div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-zinc-100 truncate">{it.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="bg-black dark:bg-fire text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                            EU {it.size}
                          </span>
                          <span className="text-gray-500 dark:text-zinc-400 font-mono text-[11px]">
                            {fmt(it.unit_price)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Inline Quantity Stepper */}
                      <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-md overflow-hidden bg-gray-50 dark:bg-zinc-800">
                        <button
                          type="button"
                          onClick={() => updateItemQty(idx, -1)}
                          className="px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-bold text-xs text-gray-900 dark:text-zinc-100">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(idx, 1)}
                          className="px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-mono font-bold text-xs text-gray-900 dark:text-zinc-100 w-20 text-right">
                        {fmt(it.unit_price * it.quantity)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-gray-400 hover:text-fire p-1 cursor-pointer"
                        title="Remove pair"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 4: Payment Method Selection Cards (Like Public Checkout) */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
              <DollarSign size={16} className="text-fire" /> 3. Payment Method
            </h2>

            <div className="grid grid-cols-1 gap-2.5">
              {/* COD Card */}
              <div
                onClick={() => setPaymentMethod("COD")}
                className={`cursor-pointer p-3.5 rounded-xl border flex items-center justify-between transition-all ${paymentMethod === "COD"
                  ? "border-black dark:border-fire bg-gray-50 dark:bg-zinc-800 shadow-sm"
                  : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900 dark:text-zinc-100">Cash on Delivery (COD)</p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400">Rider collects cash upon doorstep delivery</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "COD" ? "border-fire bg-fire" : "border-gray-300 dark:border-zinc-600"
                  }`}>
                  {paymentMethod === "COD" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              </div>

              {/* Online Card / Safepay */}
              <div
                onClick={() => setPaymentMethod("Card")}
                className={`cursor-pointer p-3.5 rounded-xl border flex items-center justify-between transition-all ${paymentMethod === "Card"
                  ? "border-black dark:border-fire bg-gray-50 dark:bg-zinc-800 shadow-sm"
                  : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900 dark:text-zinc-100">Card / Safepay</p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400">Prepaid via Visa, Mastercard, or Safepay link</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "Card" ? "border-fire bg-fire" : "border-gray-300 dark:border-zinc-600"
                  }`}>
                  {paymentMethod === "Card" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              </div>

              {/* Bank Transfer */}
              <div
                onClick={() => setPaymentMethod("Bank Transfer")}
                className={`cursor-pointer p-3.5 rounded-xl border flex items-center justify-between transition-all ${paymentMethod === "Bank Transfer"
                  ? "border-black dark:border-fire bg-gray-50 dark:bg-zinc-800 shadow-sm"
                  : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900 dark:text-zinc-100">Direct Bank Transfer</p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400">Customer transfers via mobile banking / IBFT</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "Bank Transfer" ? "border-fire bg-fire" : "border-gray-300 dark:border-zinc-600"
                  }`}>
                  {paymentMethod === "Bank Transfer" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Checkout Receipt & Order Issuance with Coupons */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
              <FileText size={16} className="text-fire" /> 4. Coupon & Financial Calculations
            </h2>

            {/* Coupon Application Box (mirrors public checkout page) */}
            <div className="space-y-1.5">
              <label className="font-bold text-xs text-gray-700 dark:text-zinc-300 block">Apply Coupon / Promo Code</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center border border-gray-300 dark:border-zinc-700 rounded-lg px-3 bg-white dark:bg-zinc-800">
                  <Tag size={15} className="text-gray-400 dark:text-zinc-500 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code (e.g. WELCOME10)"
                    className="flex-1 py-2 text-xs font-mono font-bold bg-transparent outline-none text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                  />
                </div>
                <button
                  type="button"
                  disabled={applyingCoupon || !couponCode.trim()}
                  onClick={applyCoupon}
                  className="bg-black dark:bg-fire text-white font-bold text-xs px-4 rounded-lg hover:bg-fire transition-colors disabled:opacity-50 min-w-[75px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {applyingCoupon ? <Loader2 size={13} className="animate-spin" /> : "Apply"}
                </button>
              </div>

              {couponMsg && (
                <div className={`text-xs flex items-center justify-between font-medium pt-1 ${discountAmount > 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-500"
                  }`}>
                  <span>{couponMsg}</span>
                  {discountAmount > 0 && (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs text-rose-500 hover:underline ml-2 cursor-pointer font-bold"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Shipping Fee and Manual Discount Adjustment */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="font-bold text-xs text-gray-700 dark:text-zinc-300 block mb-1">Shipping Fee (Rs.)</label>
                <input
                  type="number"
                  min={0}
                  value={shippingFee}
                  onChange={e => setShippingFee(Number(e.target.value) || 0)}
                  className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-fire"
                />
              </div>
              <div>
                <label className="font-bold text-xs text-gray-700 dark:text-zinc-300 block mb-1">Discount (Rs.)</label>
                <input
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={e => {
                    setDiscountAmount(Number(e.target.value) || 0);
                    if (Number(e.target.value) === 0) setCouponMsg("");
                  }}
                  className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-fire"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-zinc-400">
                <span>Items Subtotal</span>
                <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-zinc-400">
                <span>Shipping</span>
                <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">
                  {shippingFee === 0 ? <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px]">FREE</span> : `Rs. ${Number(shippingFee).toLocaleString()}`}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Discount Applied</span>
                  <span className="font-mono">-Rs. {Number(discountAmount).toLocaleString()}</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200 dark:border-zinc-700 flex justify-between items-baseline">
                <div>
                  <span className="font-display text-sm font-black text-gray-900 dark:text-zinc-100 block">Total Due</span>
                  <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium">Payment: {paymentMethod}</span>
                </div>
                <span className="font-mono text-2xl font-black text-fire">
                  Rs. {total.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full bg-black dark:bg-fire hover:bg-fire dark:hover:bg-fire/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              <span>Place Order & Issue Invoice</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function OrderDetailPage({ orderId, initialOrder, onBack, onUpdate }) {
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [status, setStatus] = useState(initialOrder?.status || "placed");
  const [note, setNote] = useState(initialOrder?.customer_note || "");
  const [trackingNumber, setTrackingNumber] = useState(initialOrder?.tracking_number || "");
  const [courierName, setCourierName] = useState(initialOrder?.courier_name || "");
  const [savingNote, setSavingNote] = useState(false);
  const [refundOrder, setRefundOrder] = useState(null);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);
  const [bookingCourier, setBookingCourier] = useState(false);
  const [courierConfig, setCourierConfig] = useState(null);

  const fetchOrder = async () => {
    try {
      const res = await http.get(`/admin/orders/${orderId}`);
      const ord = res.data?.data;
      if (ord) {
        setOrder(ord);
        setStatus(ord.status);
        setNote(ord.customer_note || "");
        setTrackingNumber(ord.tracking_number || "");
        setCourierName(ord.courier_name || "");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Order not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    http.get('/admin/courier/config')
      .then(res => setCourierConfig(res.data?.data || { configured: false }))
      .catch(() => setCourierConfig({ configured: false }));
  }, [orderId]);

  const updateStatus = async (newStatus) => {
    if (!order) return;
    setStatus(newStatus);
    setUpdatingStatus(true);
    try {
      await http.patch(`/admin/orders/${order.id}/status`, { status: newStatus, tracking_number: trackingNumber, courier_name: courierName });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrder();
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const saveTracking = async () => {
    if (!order) return;
    setSavingTracking(true);
    try {
      await http.patch(`/admin/orders/${order.id}/status`, { status, tracking_number: trackingNumber, courier_name: courierName });
      toast.success("Tracking information saved");
      fetchOrder();
      if (onUpdate) onUpdate();
    } finally {
      setSavingTracking(false);
    }
  };

  const markAsShipped = async () => {
    if (!order) return;
    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number before marking as shipped");
      return;
    }
    setUpdatingStatus(true);
    try {
      await http.patch(`/admin/orders/${order.id}/status`, {
        status: 'shipped',
        tracking_number: trackingNumber.trim(),
        courier_name: courierName.trim() || 'TCS'
      });
      setStatus('shipped');
      toast.success("Order marked as Shipped & tracking notification sent!");
      fetchOrder();
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const markAsDelivered = async () => {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      await http.patch(`/admin/orders/${order.id}/status`, {
        status: 'delivered',
        tracking_number: trackingNumber.trim(),
        courier_name: courierName.trim()
      });
      setStatus('delivered');
      toast.success("Order confirmed as Delivered!");
      fetchOrder();
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const saveNote = async () => {
    if (!order) return;
    setSavingNote(true);
    await http.patch(`/admin/orders/${order.id}/note`, { note });
    setSavingNote(false);
    toast.success("Internal note saved");
  };

  const bookCourier = async () => {
    if (!order) return;
    setBookingCourier(true);
    try {
      const res = await http.post(`/admin/orders/${order.id}/book-courier`);
      setTrackingNumber(res.data.data.awb);
      setCourierName(res.data.data.courier_name);
      toast.success("Courier booked successfully via API");
      fetchOrder();
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to book courier");
    } finally {
      setBookingCourier(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return "N/A";
    if (typeof addr === "string") return addr;
    const parts = [
      addr.address_l1 || addr.address || addr.street,
      addr.address_l2,
      addr.city,
      addr.province,
      addr.postal_code
    ].filter(Boolean);
    return parts.join(", ") || "N/A";
  };

  const copyCustomerDetails = () => {
    if (!order) return;
    const text = `Customer: ${order.customer_name}\nPhone: ${order.customer_phone}\nAddress: ${formatAddress(order.shipping_address)}\nOrder: #${order.order_number}\nAmount to Collect: Rs. ${order.total?.toLocaleString()} (${order.payment_method || 'COD'})`;
    navigator.clipboard.writeText(text);
    toast.success("Customer delivery details copied to clipboard!");
  };

  const getTrackingPortalUrl = (courier, awb) => {
    if (!awb) return null;
    const c = (courier || '').toLowerCase();
    if (c.includes('tcs')) return `https://www.tcsexpress.com/track/${awb}`;
    if (c.includes('trax')) return `https://trax.pk/tracking?tracking_number=${awb}`;
    if (c.includes('leopard')) return `https://leopardscourier.com/tracking?track=${awb}`;
    if (c.includes('postex')) return `https://postex.pk/tracking?cn=${awb}`;
    if (c.includes('call') || c.includes('rider')) return `https://callcourier.com.pk/tracking/?tc=${awb}`;
    return null;
  };

  const STEPS = [
    { key: "placed", label: "Placed" },
    { key: "confirmed", label: "Confirmed" },
    { key: "packed", label: "Packed" },
    { key: "shipped", label: "Shipped" },
    { key: "out_for_delivery", label: "Out for Delivery" },
    { key: "delivered", label: "Delivered" }
  ];

  const stepOrder = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];
  const currentStepIdx = stepOrder.indexOf(status);

  const historyMap = {};
  if (order?.created_at) {
    historyMap['placed'] = order.created_at;
  }
  (order?.status_history || []).forEach(h => {
    historyMap[h.status] = h.at;
  });

  const trackingPortalUrl = getTrackingPortalUrl(courierName, trackingNumber);

  if (loading && !order) {
    return (
      <div className="pb-10 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-bold text-xs rounded-lg border border-gray-300 dark:border-zinc-700 shadow-sm transition-colors">
            <ArrowLeft size={16} /> Back to Orders
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-xs font-mono font-bold text-gray-500">Loading Order #{orderId}...</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center min-h-[350px] gap-3">
          <Loader2 size={32} className="animate-spin text-fire" />
          <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">Loading order drop details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pb-10 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-bold text-xs rounded-lg border border-gray-300 dark:border-zinc-700 shadow-sm transition-colors">
            <ArrowLeft size={16} /> Back to Orders
          </button>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-12 shadow-sm text-center space-y-4">
          <AlertTriangle size={36} className="text-fire mx-auto" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">Order #{orderId} Not Found</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-md mx-auto">This order does not exist or the reference in the URL is invalid.</p>
          <button onClick={onBack} className="px-5 py-2 bg-black dark:bg-fire text-white font-bold text-xs rounded-lg hover:bg-fire transition-colors shadow-sm">
            Return to Orders List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Breadcrumb & Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-bold text-xs rounded-lg border border-gray-300 dark:border-zinc-700 shadow-sm transition-all hover:-translate-x-0.5"
          >
            <ArrowLeft size={16} /> Back to Orders
          </button>
          <span className="text-gray-300 dark:text-zinc-700 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-mono font-bold text-gray-500 dark:text-zinc-400 hidden sm:inline">Orders</span>
          <span className="text-gray-300 dark:text-zinc-700 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-mono font-black text-gray-900 dark:text-zinc-100 hidden sm:inline">#{order.order_number}</span>
        </div>

        <div className="flex items-center gap-2.5">
          {updatingStatus && <Loader2 size={16} className="animate-spin text-fire" />}

          {/* Clean 1-Click Status Dropdown */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800/70 p-1 pl-3 pr-1 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
            <span className="text-xs font-bold text-gray-600 dark:text-zinc-300 whitespace-nowrap">
              Update Status:
            </span>
            <StatusBadgeDropdown
              size="md"
              currentStatus={status}
              onSelect={updateStatus}
              disabled={updatingStatus}
            />
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            title="Print Thermal Shipping Slip"
          >
            <Printer size={14} /> <span>Print Slip</span>
          </button>

          <a
            href={waLink(order.customer_phone, `Hi ${order.customer_name}, update regarding your SOLEKICKS order #${order.order_number}:`)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
          >
            <MessageCircle size={14} /> <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Main Order Card */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Top Order Title Header */}
        <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono font-black text-2xl text-gray-900 dark:text-zinc-100 tracking-tight">
              #{order.order_number}
            </h1>
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${order.payment_status === 'paid'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              }`}>
              Payment: {order.payment_status || 'COD'}
            </span>
            <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium hidden md:inline">
              • Placed on {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="font-mono text-xl font-black text-gray-900 dark:text-zinc-100">
            {fmt(order.total)}
          </div>
        </div>

        {/* 4-Stat High Impact Ribbon */}
        <div className="bg-gray-50/90 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Total Payable</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono text-lg font-black text-gray-900 dark:text-zinc-100">{fmt(order.total)}</span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400">({order.payment_method || 'COD'})</span>
            </div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Customer</span>
            <span className="font-bold text-gray-900 dark:text-zinc-100 truncate block mt-1 text-sm">{order.customer_name}</span>
            <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-mono">{order.customer_phone}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Logistics Partner</span>
            <span className="font-bold text-gray-900 dark:text-zinc-100 block font-mono mt-1 text-sm">
              {order.courier_name || 'Unassigned'}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-mono truncate block">
              {trackingNumber ? `AWB: ${trackingNumber}` : 'Pending booking'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Status & Items</span>
            <span className="font-bold text-gray-900 dark:text-zinc-100 capitalize block mt-1 text-sm">{status}</span>
            <span className="text-[11px] text-gray-500 dark:text-zinc-400">
              {order.items?.length || 0} sneaker item{order.items?.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Milestone Stepper */}
        {status === 'cancelled' ? (
          <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 p-4 px-6 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={16} /> Order #{order.order_number} has been cancelled.
          </div>
        ) : status === 'returned' ? (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 p-4 px-6 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={16} /> Order #{order.order_number} has been marked as returned to origin (RTO).
          </div>
        ) : (
          <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="max-w-3xl mx-auto flex items-center justify-between relative">
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 dark:bg-zinc-800 z-0"></div>

              {STEPS.map((step, idx) => {
                const targetIdx = stepOrder.indexOf(step.key);
                const isPassed = currentStepIdx >= targetIdx;
                const isCurrent = status === step.key;
                const timeStr = historyMap[step.key] ? new Date(historyMap[step.key]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;

                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10 bg-white dark:bg-zinc-900 px-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all border-2 ${isPassed
                        ? "bg-black dark:bg-fire border-black dark:border-fire text-white shadow-sm"
                        : isCurrent
                          ? "bg-fire border-fire text-white shadow-sm ring-4 ring-fire/20"
                          : "bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-400 dark:text-zinc-500"
                        }`}
                    >
                      {isPassed ? <Check size={16} /> : idx + 1}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider mt-2 ${isCurrent ? "text-fire font-black" : isPassed ? "text-gray-900 dark:text-zinc-100" : "text-gray-400 dark:text-zinc-500"
                      }`}>
                      {step.label}
                    </span>
                    {timeStr && <span className="font-mono text-[10px] text-gray-500 dark:text-zinc-400">{timeStr}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Two-Column Body */}
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-zinc-800">

          {/* Left Column: Sneaker Items & Financial Summary (58% width) */}
          <div className="w-full lg:w-[58%] p-6 space-y-6 bg-white dark:bg-zinc-900">

            {/* Sneaker Items */}
            <div className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 dark:bg-zinc-800/80 p-3.5 px-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                  <Package size={15} className="text-fire" /> Ordered Sneakers ({order.items?.length || 0})
                </h3>
                <span className="font-mono text-xs text-gray-500 dark:text-zinc-400 font-medium">
                  Order Ref #{order.order_number}
                </span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-zinc-800 p-2">
                {order.items?.map((it, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/70 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      {it.image_url ? (
                        <img src={it.image_url} alt={it.product_name} className="w-16 h-16 object-cover bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 shrink-0 shadow-sm" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-lg grid place-items-center text-gray-400 shrink-0 border border-gray-200 dark:border-zinc-700"><Package size={22} /></div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-900 dark:text-zinc-100 truncate">{it.product_name}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="bg-black dark:bg-fire text-white font-mono text-xs font-bold px-2 py-0.5 rounded">
                            EU {it.size}
                          </span>
                          <span className="text-gray-500 dark:text-zinc-400 font-mono text-xs">
                            {fmt(it.unit_price)} × {it.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-base text-gray-900 dark:text-zinc-100 block">
                        {fmt(it.unit_price * it.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Calculation Breakdown */}
            <div className="bg-gray-50/80 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 space-y-3 text-xs shadow-sm">
              <div className="flex justify-between text-gray-600 dark:text-zinc-400 font-medium">
                <span>Subtotal</span>
                <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">{fmt(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-zinc-400 font-medium">
                <span>Shipping Fee</span>
                <span className="font-mono font-bold">
                  {order.shipping_fee === 0 ? <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase text-[10px] bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">FREE SHIPPING</span> : fmt(order.shipping_fee)}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-fire font-bold">
                  <span>Discount Applied</span>
                  <span className="font-mono">-{fmt(order.discount_amount)}</span>
                </div>
              )}
              {order.store_credit_used > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                  <span>Store Credit Used</span>
                  <span className="font-mono">-{fmt(order.store_credit_used)}</span>
                </div>
              )}
              <div className="pt-3.5 border-t border-gray-200 dark:border-zinc-700 flex justify-between items-baseline text-sm">
                <div>
                  <span className="font-display font-black text-gray-900 dark:text-zinc-100 block text-base">Total Due ({order.payment_method || 'COD'})</span>
                  <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Cash to collect upon delivery</span>
                </div>
                <span className="font-mono text-2xl font-black text-fire">{fmt(order.total)}</span>
              </div>
            </div>

            {/* Chronological Event Log */}
            {order.status_history?.length > 0 && (
              <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-900 space-y-3 text-xs shadow-sm">
                <p className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-1.5 border-b border-gray-100 dark:border-zinc-800 pb-2.5">
                  <Activity size={15} className="text-fire" /> Order Timeline & Event History
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {order.status_history.map((h, i) => (
                    <div key={i} className="flex justify-between items-start text-xs py-1.5 border-b border-dashed border-gray-100 dark:border-zinc-800 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px]">{h.status}</span>
                        <span className="text-gray-700 dark:text-zinc-300 font-medium">{h.note || 'Status updated'}</span>
                      </div>
                      <span className="font-mono text-[11px] text-gray-400 dark:text-zinc-500 shrink-0 ml-2">
                        {new Date(h.at).toLocaleDateString()} {new Date(h.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Customer Details, Fulfillment & Logistics (42% width) */}
          <div className="w-full lg:w-[42%] p-6 space-y-6 bg-gray-50 dark:bg-zinc-950">

            {/* Customer & Address Card */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-3">
                <h3 className="font-display font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Users size={15} className="text-fire" /> Customer & Destination
                </h3>
                <button
                  type="button"
                  onClick={copyCustomerDetails}
                  className="text-xs font-bold text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white flex items-center gap-1 hover:underline"
                  title="Copy full delivery address and details"
                >
                  <Copy size={12} /> Copy All
                </button>
              </div>

              <div>
                <div className="flex justify-between items-baseline">
                  <span className="font-extrabold text-base text-gray-900 dark:text-zinc-100">{order.customer_name}</span>
                  <a
                    href={waLink(order.customer_phone, `Hi ${order.customer_name}, update regarding your SOLEKICKS order #${order.order_number}:`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-md text-xs shadow-sm transition-colors"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                </div>
                <p className="font-mono text-gray-800 dark:text-zinc-200 font-bold mt-1 text-sm">{order.customer_phone}</p>
                {order.customer_email && <p className="text-gray-500 dark:text-zinc-400 mt-0.5">{order.customer_email}</p>}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 leading-relaxed">
                <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-zinc-500 block mb-1">Delivery Address</span>
                <p className="font-medium text-gray-900 dark:text-zinc-100 bg-gray-50 dark:bg-zinc-800/80 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 leading-normal">
                  {formatAddress(order.shipping_address)}
                </p>
              </div>

              {order.customer_note && (
                <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-900 dark:text-amber-300 text-xs rounded-lg border border-amber-200 dark:border-amber-900/50">
                  <span className="font-bold block text-[11px] uppercase tracking-wider mb-0.5">Special Customer Instructions:</span>
                  {order.customer_note}
                </div>
              )}
            </div>

            {/* Courier & Fulfillment Dispatch Card */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-3">
                <h3 className="font-display font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Truck size={15} className="text-fire" /> Courier & Fulfillment
                </h3>
                {trackingNumber && (
                  <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 px-2 py-0.5 rounded-full">
                    AWB Active
                  </span>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-zinc-400 block mb-1.5">Select Courier Partner</label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {['TCS', 'Leopards', 'Trax', 'PostEx', 'Call Courier'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCourierName(c)}
                      className={`px-3 py-1 text-xs font-bold font-mono rounded-md border transition-all ${courierName.toLowerCase().includes(c.toLowerCase())
                        ? "bg-black dark:bg-fire text-white border-black dark:border-fire shadow-sm"
                        : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-black"
                        }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Courier Partner (e.g. TCS)"
                  value={courierName}
                  onChange={e => setCourierName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 mb-3"
                />

                <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-zinc-400 block mb-1.5">Consignment / Tracking Number</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. TCS-7729104 or TR-88219"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-gray-900 dark:text-zinc-100 focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-white dark:bg-zinc-800 pr-20"
                  />
                  <button
                    type="button"
                    onClick={saveTracking}
                    disabled={savingTracking || updatingStatus}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-800 dark:text-zinc-200 font-bold text-xs rounded border border-gray-300 dark:border-zinc-600 transition-colors"
                  >
                    {savingTracking ? <Loader2 size={12} className="animate-spin" /> : "Save"}
                  </button>
                </div>

                {trackingPortalUrl && (
                  <div className="mt-2 text-right">
                    <a
                      href={trackingPortalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline"
                    >
                      Open {courierName} Live Tracking Portal <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              {/* Primary Dispatch Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                {status !== 'shipped' && status !== 'delivered' && status !== 'cancelled' && (
                  <button
                    onClick={markAsShipped}
                    disabled={updatingStatus}
                    className="w-full bg-black dark:bg-fire hover:bg-fire dark:hover:bg-fire/90 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-xs uppercase tracking-wider"
                  >
                    <Truck size={15} /> Dispatch & Mark as Shipped
                  </button>
                )}

                {status === 'shipped' && (
                  <button
                    onClick={markAsDelivered}
                    disabled={updatingStatus}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-xs uppercase tracking-wider"
                  >
                    <CheckCircle size={15} /> Confirm Delivery (Payment Received)
                  </button>
                )}

                {courierConfig?.configured && (
                  <button
                    onClick={bookCourier}
                    disabled={bookingCourier || updatingStatus}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-xs"
                  >
                    {bookingCourier ? <Loader2 size={13} className="animate-spin" /> : "Auto-Book via Courier API"}
                  </button>
                )}
              </div>
            </div>

            {/* Internal Staff Warehouse Note */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3 text-xs">
              <h3 className="font-display font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                <MapPin size={15} className="text-fire" /> Warehouse Staff Note
              </h3>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Private remarks for warehouse staff / packers..."
                className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg p-2.5 text-xs focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 dark:bg-zinc-800 min-h-[65px] resize-none text-gray-800 dark:text-zinc-100"
              />
              <button
                onClick={saveNote}
                disabled={savingNote}
                className="w-full py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 rounded-lg text-xs font-bold transition-colors border border-gray-300 dark:border-zinc-700 shadow-sm"
              >
                {savingNote ? "Saving..." : "Save Staff Note"}
              </button>
            </div>

            {/* Refund Trigger */}
            <button
              onClick={() => setRefundOrder(order)}
              className="w-full py-2.5 border border-fire/40 text-fire rounded-lg text-xs font-bold hover:bg-fire hover:text-white transition-colors bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={13} /> Initiate Customer Refund
            </button>
          </div>
        </div>
      </div>

      {refundOrder && (
        <RefundModal
          order={refundOrder}
          onClose={() => setRefundOrder(null)}
          onDone={() => {
            setRefundOrder(null);
            fetchOrder();
            if (onUpdate) onUpdate();
          }}
        />
      )}
      <ShippingLabel order={order} />
    </div>
  );
}

function ShippingLabel({ order }) {
  if (!order) return null;
  return (
    <div id="printable-label" className="hidden print:block p-8 bg-white text-black font-sans w-[4in] min-h-[6in] border-2 border-black box-border">
      <div className="border-b-2 border-black pb-4 mb-4 text-center">
        <h1 className="text-3xl font-black uppercase tracking-widest">SOLEKICKS</h1>
        <p className="text-sm font-bold mt-1">Premium Sneaker Fulfillment</p>
      </div>

      <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-4">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Order Number</p>
          <p className="text-2xl font-black font-mono">#{order.order_number}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase text-gray-500">Date</p>
          <p className="text-sm font-bold">{new Date(order.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase text-gray-500 mb-1">Ship To:</p>
        <p className="text-xl font-bold">{order.customer_name}</p>
        <p className="text-base mt-1">{order.shipping_address?.address_l1}</p>
        {order.shipping_address?.address_l2 && <p className="text-base">{order.shipping_address.address_l2}</p>}
        <p className="text-base font-bold mt-1">{order.shipping_address?.city}, {order.shipping_address?.province}</p>
        <p className="text-base">{order.shipping_address?.postal_code}</p>
        <p className="text-base font-bold mt-2 pt-2 border-t border-dashed border-gray-300">TEL: {order.customer_phone}</p>
      </div>

      <div className="border-t-4 border-black pt-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold uppercase">Payment Mode</span>
          <span className={`text-lg font-black uppercase ${order.payment_method === 'COD' ? 'border-2 border-black px-2' : ''}`}>{order.payment_method}</span>
        </div>
        {order.payment_method === 'COD' && (
          <div className="flex justify-between items-center bg-black text-white p-2">
            <span className="font-bold uppercase">COD Amount To Collect</span>
            <span className="text-2xl font-black">{fmt(order.total)}</span>
          </div>
        )}
      </div>

      <div className="border-t-2 border-black pt-4">
        <p className="text-xs font-bold uppercase text-gray-500 mb-2">Package Contents ({order.items?.length || 0} Items)</p>
        {order.items?.map((item, i) => (
          <div key={i} className="flex justify-between text-sm mb-1">
            <span className="font-bold truncate pr-2">{item.quantity}x {item.product_name}</span>
            <span className="font-mono flex-shrink-0">Size: {item.size}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const action = searchParams.get("action");

  const [data, setData] = useState({ products: [], pagination: {}, stats: {} });
  const [loading, setLoading] = useState(true);
  const urlSearch = searchParams.get("search") || "";
  const [query, setQuery] = useState({ page: 1, limit: 25, search: urlSearch, status: "all", stock: "all", category: "all", brand: "all", price: "all" });
  const [searchInput, setSearchInput] = useState(urlSearch);

  useEffect(() => {
    const s = searchParams.get("search") || "";
    if (s !== query.search) {
      setSearchInput(s);
      setQuery(prev => ({ ...prev, search: s, page: 1 }));
    }
  }, [searchParams.get("search")]);
  const [selected, setSelected] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  useEffect(() => {
    http.get("/admin/categories").then(({ data }) => setAvailableCategories(data.data || [])).catch(() => { });
    http.get("/admin/brands").then(({ data }) => setAvailableBrands(data.data || [])).catch(() => { });
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams(query).toString();
      const res = await http.get(`/admin/products?${q}`);
      setData(res.data.data);
    } catch (e) {
      toast.error("Failed to load products");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [query]);

  // Click outside to close action menu
  useEffect(() => {
    const handleOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener("click", handleOutside);
      return () => window.removeEventListener("click", handleOutside);
    }
  }, [activeMenuId]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery({ ...query, search: searchInput, page: 1 });
  };

  const resetFilters = () => {
    setSearchInput("");
    setQuery({ page: 1, limit: 25, search: "", status: "all", stock: "all", category: "all", brand: "all", price: "all" });
  };

  const selectAll = (e) => {
    if (e.target.checked) setSelected(data.products.map(p => p.id));
    else setSelected([]);
  };

  const toggleSelect = (id) => {
    if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
    else setSelected([...selected, id]);
  };

  const bulkUpdate = (action, value = null) => {
    const isDelete = action === 'delete';
    setConfirmModal({
      isOpen: true,
      title: isDelete ? `Delete ${selected.length} products?` : `Apply ${action} to ${selected.length} products?`,
      message: isDelete
        ? `Are you sure you want to permanently delete ${selected.length} selected products? This action cannot be undone.`
        : `Are you sure you want to ${action} ${selected.length} selected products?`,
      confirmText: isDelete ? 'Delete Products' : 'Confirm Action',
      variant: isDelete ? 'danger' : 'primary',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await http.patch("/admin/products/bulk", { productIds: selected, action, value });
          toast.success(`Bulk action completed successfully`);
          setSelected([]);
          setConfirmModal({ isOpen: false });
          load();
        } catch (e) {
          toast.error("Action failed");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const duplicate = async (id) => {
    try {
      const res = await http.post(`/admin/products/${id}/duplicate`);
      toast.success("Product duplicated as Draft");
      load();
      if (res.data?.data?.id) {
        openProduct(res.data.data.id);
      }
    } catch (e) { toast.error("Duplication failed"); }
  };

  const del = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Permanently delete product?",
      message: "Permanently delete this product drop? This action cannot be undone.",
      confirmText: "Delete Product",
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await http.patch("/admin/products/bulk", { productIds: [id], action: 'delete' });
          toast.success("Product deleted successfully");
          setConfirmModal({ isOpen: false });
          load();
        } catch (e) {
          toast.error("Delete failed");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const exportCSV = () => {
    if (!data.products.length) return toast.error("No products to export");
    const headers = ["ID", "Name", "SKU", "Category", "Brand", "Price", "Cost", "Stock", "Status"];
    const rows = data.products.map(p => [
      p.id, `"${p.name}"`, p.slug, p.category_slug, p.brand_slug || "", p.base_price, p.cost_price || 0,
      p.sizes?.reduce((a, b) => a + b.stock, 0) || 0, p.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `products_export_${Date.now()}.csv`;
    link.click();
  };

  const closeProduct = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("action");
    next.delete("productId");
    setSearchParams(next);
  };

  const openNewProduct = () => {
    const next = new URLSearchParams(searchParams);
    next.set("action", "new");
    next.delete("productId");
    setSearchParams(next);
  };

  const openProduct = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set("productId", id);
    next.delete("action");
    setSearchParams(next);
  };

  // FULL PAGE VIEW: Create New Product
  if (action === "new") {
    return (
      <ProductDetailPage
        isNew={true}
        onBack={closeProduct}
        onSaved={(created) => {
          load();
          if (created?.id) {
            openProduct(created.id);
          } else {
            closeProduct();
          }
        }}
      />
    );
  }

  // FULL PAGE VIEW: View & Edit Product
  if (productId) {
    const existing = data.products?.find(p => p.id === productId || p.slug === productId);
    return (
      <ProductDetailPage
        productId={productId}
        initialProduct={existing}
        onBack={closeProduct}
        onSaved={load}
        onDelete={() => {
          closeProduct();
          load();
        }}
      />
    );
  }

  const STATS = [
    { label: "Total Catalog", count: data.stats?.total || 0, color: "text-gray-900 dark:text-zinc-100", sub: "All sneakers & drops" },
    { label: "Active Drops", count: data.stats?.active || 0, color: "text-emerald-600 dark:text-emerald-400", sub: "Live on storefront" },
    { label: "Low Stock Alert", count: data.stats?.low_stock || 0, color: "text-amber-600 dark:text-amber-400", sub: "5 or fewer pairs left" },
    { label: "Out of Stock", count: data.stats?.out_of_stock || 0, color: "text-fire", sub: "Needs urgent restock" }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-black text-gray-900 dark:text-zinc-100 flex items-center gap-3">
            Products & Inventory
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-fire/10 text-fire border border-fire/20">
              {data.stats?.total || 0} Drops
            </span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Manage your high-heat footwear drops, pricing, sizes matrix, and storefront status.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={openNewProduct}
            className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl bg-fire hover:bg-fire-hover text-white transition-all shadow-sm hover:shadow-fire/20 flex items-center gap-2"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">{s.label}</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-mono font-black ${s.color}`}>{s.count}</span>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col lg:flex-row gap-3 items-center">
        <form onSubmit={handleSearch} className="flex-1 relative w-full">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search sneaker by name, SKU, or category..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-fire transition-colors"
          />
        </form>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
          <select
            value={query.category}
            onChange={(e) => setQuery({ ...query, category: e.target.value, page: 1 })}
            className="bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 px-3 py-2 text-xs rounded-xl text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire capitalize"
          >
            <option value="all">Category: All</option>
            {availableCategories.map(c => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select
            value={query.brand}
            onChange={(e) => setQuery({ ...query, brand: e.target.value, page: 1 })}
            className="bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 px-3 py-2 text-xs rounded-xl text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire capitalize"
          >
            <option value="all">Brand: All</option>
            {availableBrands.map(b => (
              <option key={b.id} value={b.slug}>{b.name}</option>
            ))}
          </select>
          <select
            value={query.status}
            onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })}
            className="bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 px-3 py-2 text-xs rounded-xl text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={query.stock}
            onChange={(e) => setQuery({ ...query, stock: e.target.value, page: 1 })}
            className="bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 px-3 py-2 text-xs rounded-xl text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
          >
            <option value="all">Stock: All</option>
            <option value="in_stock">In Stock (5+ pairs)</option>
            <option value="low_stock">Low Stock (1-5)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
          <select
            value={query.price}
            onChange={(e) => setQuery({ ...query, price: e.target.value, page: 1 })}
            className="bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 px-3 py-2 text-xs rounded-xl text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
          >
            <option value="all">Price: All</option>
            <option value="under_50">Under $50</option>
            <option value="50_100">$50 - $100</option>
            <option value="100_500">$100 - $500</option>
          </select>
          <button
            onClick={resetFilters}
            className="text-xs font-bold text-gray-500 dark:text-zinc-400 hover:text-fire px-3 py-2 rounded-xl transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Sticky Bulk Action Bar */}
      {selected.length > 0 && (
        <div className="bg-gray-900 dark:bg-zinc-800 text-white p-3.5 px-5 rounded-2xl flex justify-between items-center shadow-xl border border-gray-800 dark:border-zinc-700 sticky top-20 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fire animate-pulse"></span>
            <span className="font-bold text-xs">{selected.length} products selected</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => bulkUpdate('status', 'active')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors"
            >
              Set Active
            </button>
            <button
              onClick={() => bulkUpdate('status', 'draft')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors"
            >
              Set Draft
            </button>
            <button
              onClick={() => bulkUpdate('delete')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-fire" />
            <p className="text-xs font-bold text-gray-500 dark:text-zinc-400">Loading sneaker inventory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50/80 dark:bg-zinc-800/60 font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5 pl-5 w-12">
                    <input
                      type="checkbox"
                      checked={data.products?.length > 0 && selected.length === data.products?.length}
                      onChange={selectAll}
                      className="accent-fire rounded"
                    />
                  </th>
                  <th className="p-3.5 min-w-[220px]">Sneaker Product</th>
                  <th className="p-3.5 whitespace-nowrap">SKU / Handle</th>
                  <th className="p-3.5 whitespace-nowrap">Category & Brand</th>
                  <th className="p-3.5 whitespace-nowrap">Retail Price</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Stock Depth</th>
                  <th className="p-3.5 whitespace-nowrap">Status</th>
                  <th className="p-3.5 pr-5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                {!data.products || data.products.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-12 text-center text-gray-400 dark:text-zinc-500">
                      <Package size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="font-bold text-sm">No products found</p>
                      <p className="text-xs mt-1">Try resetting search filters or click "+ Add Product" to create one.</p>
                    </td>
                  </tr>
                ) : (
                  data.products.map(p => {
                    const stock = p.sizes?.reduce((a, b) => a + b.stock, 0) || 0;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => openProduct(p.id)}
                        className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="p-3.5 pl-5" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.includes(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="accent-fire rounded"
                          />
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.images?.[0] || 'https://via.placeholder.com/80?text=Sneaker'}
                              className="w-12 h-12 object-cover rounded-xl border border-gray-200 dark:border-zinc-700 shrink-0 bg-gray-100 dark:bg-zinc-800"
                              alt=""
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-sm text-gray-900 dark:text-zinc-100 block truncate group-hover:text-fire transition-colors">
                                {p.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {p.is_new_arrival && <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-fire/10 text-fire">New</span>}
                                {p.is_best_seller && <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">Hot</span>}
                                {p.is_flash_sale && <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">Sale</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                          {p.slug}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-bold capitalize text-gray-900 dark:text-zinc-200 block">
                            {p.category_slug}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-zinc-500 capitalize">
                            {p.brand_slug || "AirVault"}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-black text-sm text-gray-900 dark:text-zinc-100 whitespace-nowrap">
                          {fmt(p.base_price)}
                          {p.compare_at_price && (
                            <span className="block text-[10px] text-gray-400 line-through font-normal">
                              {fmt(p.compare_at_price)}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center gap-1.5 font-mono font-bold px-2.5 py-1 rounded-full text-xs whitespace-nowrap shadow-2xs ${stock === 0
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                            : stock <= 5
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stock === 0 ? 'bg-rose-500' : stock <= 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <span>{stock} {stock === 1 ? 'pair' : 'pairs'}</span>
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border whitespace-nowrap ${p.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                            : p.status === 'draft'
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700'
                            }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right relative whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openProduct(p.id)}
                              className="px-2.5 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Edit size={13} /> Edit
                            </button>
                            <TableActionDropdown
                              isOpen={activeMenuId === p.id}
                              onToggle={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                              onClose={() => setActiveMenuId(null)}
                            >
                              <button
                                onClick={() => { setActiveMenuId(null); openProduct(p.id); }}
                                className="w-full px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Eye size={14} className="text-gray-400"/> View & Edit Details
                              </button>
                              <button
                                onClick={() => { setActiveMenuId(null); duplicate(p.id); }}
                                className="w-full px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Copy size={14} className="text-gray-400"/> Duplicate (Draft)
                              </button>
                              <a
                                href={`/product/${p.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                              >
                                <ExternalLink size={14} className="text-gray-400"/> View on Store
                              </a>
                              <hr className="my-1 border-gray-100 dark:border-zinc-800" />
                              <button
                                onClick={() => { setActiveMenuId(null); del(p.id); }}
                                className="w-full px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Trash2 size={14}/> Delete Drop
                              </button>
                            </TableActionDropdown>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {data.pagination?.totalPages > 1 && (
        <div className="flex justify-between items-center px-1">
          <div className="text-xs text-gray-500 dark:text-zinc-400">
            Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.totalCount} products)
          </div>
          <div className="flex gap-1.5">
            <button
              disabled={query.page === 1}
              onClick={() => setQuery({ ...query, page: query.page - 1 })}
              className="px-3.5 py-1.5 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Previous
            </button>
            <button
              disabled={query.page === data.pagination.totalPages}
              onClick={() => setQuery({ ...query, page: query.page + 1 })}
              className="px-3.5 py-1.5 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText="Cancel"
        variant={confirmModal.variant || "danger"}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}


/* =========================================================================
   DEDICATED FULL-PAGE COMPONENT: ProductDetailPage (View, Edit & Add Drop)
   Enterprise-grade sneaker product workbench. NO MODALS.
   ========================================================================= */

function ProductDetailPage({ productId, initialProduct, isNew = false, onBack, onSaved, onDelete }) {
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [showQuickAddBrand, setShowQuickAddBrand] = useState(false);
  const [quickCatName, setQuickCatName] = useState("");
  const [quickBrandName, setQuickBrandName] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);

  useEffect(() => {
    http.get("/admin/categories").then(({ data }) => setAvailableCategories(data.data || [])).catch(() => { });
    http.get("/admin/brands").then(({ data }) => setAvailableBrands(data.data || [])).catch(() => { });
  }, []);

  const handleQuickAddCategory = async (e) => {
    e.preventDefault();
    if (!quickCatName.trim()) return toast.error("Category name required");
    setQuickSaving(true);
    try {
      const { data } = await http.post("/admin/categories", { name: quickCatName.trim() });
      const newCat = data.data;
      setAvailableCategories(prev => [...prev, newCat]);
      setForm(prev => ({ ...prev, category_slug: newCat.slug }));
      setQuickCatName("");
      setShowQuickAddCat(false);
      toast.success(`Category "${newCat.name}" added and selected`);
    } catch (err) {
      toast.error("Failed to add category");
    } finally {
      setQuickSaving(false);
    }
  };

  const handleQuickAddBrand = async (e) => {
    e.preventDefault();
    if (!quickBrandName.trim()) return toast.error("Brand name required");
    setQuickSaving(true);
    try {
      const { data } = await http.post("/admin/brands", { name: quickBrandName.trim() });
      const newBrand = data.data;
      setAvailableBrands(prev => [...prev, newBrand]);
      setForm(prev => ({ ...prev, brand_slug: newBrand.slug }));
      setQuickBrandName("");
      setShowQuickAddBrand(false);
      toast.success(`Brand "${newBrand.name}" added and selected`);
    } catch (err) {
      toast.error("Failed to add brand");
    } finally {
      setQuickSaving(false);
    }
  };

  const defaultSizes = [
    { size: "38", stock: 5 },
    { size: "39", stock: 10 },
    { size: "40", stock: 15 },
    { size: "41", stock: 20 },
    { size: "42", stock: 20 },
    { size: "43", stock: 15 },
    { size: "44", stock: 10 },
    { size: "45", stock: 8 },
    { size: "46", stock: 4 },
    { size: "47", stock: 2 },
  ];

  const [form, setForm] = useState({
    name: initialProduct?.name || "",
    slug: initialProduct?.slug || "",
    category_slug: initialProduct?.category_slug || "retro",
    brand_slug: initialProduct?.brand_slug || "airvault",
    base_price: initialProduct?.base_price ?? "",
    cost_price: initialProduct?.cost_price ?? "",
    compare_at_price: initialProduct?.compare_at_price ?? "",
    flash_sale_price: initialProduct?.flash_sale_price ?? "",
    description: initialProduct?.description || "",
    status: initialProduct?.status || "active",
    is_new_arrival: initialProduct?.is_new_arrival ?? true,
    is_best_seller: initialProduct?.is_best_seller ?? false,
    is_flash_sale: initialProduct?.is_flash_sale ?? false,
    is_featured: initialProduct?.is_featured ?? false,
  });

  const [images, setImages] = useState(initialProduct?.images?.filter(Boolean) || []);
  const [sizes, setSizes] = useState(initialProduct?.sizes?.length ? initialProduct.sizes : defaultSizes);

  // Fetch full details if editing existing product
  useEffect(() => {
    if (isNew || !productId) return;
    let mounted = true;
    const fetchProduct = async () => {
      try {
        const res = await http.get(`/admin/products/${productId}`);
        if (mounted && res.data?.data) {
          const p = res.data.data;
          setForm({
            name: p.name || "",
            slug: p.slug || "",
            category_slug: p.category_slug || "retro",
            brand_slug: p.brand_slug || "airvault",
            base_price: p.base_price ?? "",
            cost_price: p.cost_price ?? "",
            compare_at_price: p.compare_at_price ?? "",
            flash_sale_price: p.flash_sale_price ?? "",
            description: p.description || "",
            status: p.status || "active",
            is_new_arrival: !!p.is_new_arrival,
            is_best_seller: !!p.is_best_seller,
            is_flash_sale: !!p.is_flash_sale,
            is_featured: !!p.is_featured,
          });
          if (p.images && p.images.length > 0) {
            setImages(p.images.filter(Boolean));
          }
          if (p.sizes && p.sizes.length > 0) {
            setSizes(p.sizes);
          }
        }
      } catch (e) {
        toast.error("Could not fetch latest product details");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProduct();
    return () => { mounted = false; };
  }, [productId, isNew]);

  // Derived financial & inventory metrics
  const totalStock = sizes.reduce((acc, s) => acc + (Number(s.stock) || 0), 0);
  const inStockSizesCount = sizes.filter(s => (Number(s.stock) || 0) > 0).length;
  const basePriceNum = Number(form.base_price) || 0;
  const costPriceNum = Number(form.cost_price) || 0;
  const comparePriceNum = Number(form.compare_at_price) || 0;
  const grossProfit = basePriceNum - costPriceNum;
  const marginPct = basePriceNum > 0 ? Math.round((grossProfit / basePriceNum) * 100) : 0;
  const discountPct = comparePriceNum > basePriceNum ? Math.round(((comparePriceNum - basePriceNum) / comparePriceNum) * 100) : 0;

  // Handle Photo Upload
  const handleUploadFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const url = await uploadImage(file);
        if (url) urls.push(url);
      }
      setImages(prev => [...prev, ...urls]);
      toast.success(`Added ${urls.length} photo(s)`);
    } catch {
      toast.error("Photo upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    setImages(prev => [...prev, urlInput.trim()]);
    setUrlInput("");
    toast.success("Image URL added");
  };

  const handleRemovePhoto = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    if (activePhotoIdx >= idx && activePhotoIdx > 0) {
      setActivePhotoIdx(activePhotoIdx - 1);
    }
  };

  const handleSetCover = (idx) => {
    if (idx === 0) return;
    const next = [...images];
    const [selected] = next.splice(idx, 1);
    next.unshift(selected);
    setImages(next);
    setActivePhotoIdx(0);
    toast.success("Set as primary cover image");
  };

  // Size matrix helpers
  const updateSizeStock = (idx, delta) => {
    setSizes(prev => {
      const next = [...prev];
      const cur = Number(next[idx].stock) || 0;
      next[idx] = { ...next[idx], stock: Math.max(0, cur + delta) };
      return next;
    });
  };

  const setDirectSizeStock = (idx, val) => {
    setSizes(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], stock: Math.max(0, parseInt(val) || 0) };
      return next;
    });
  };

  const batchStockAdjust = (amount) => {
    setSizes(prev => prev.map(s => ({ ...s, stock: Math.max(0, (Number(s.stock) || 0) + amount) })));
    toast.success(`Adjusted all sizes by ${amount > 0 ? '+' : ''}${amount}`);
  };

  const handleAddCustomSize = (e) => {
    e.preventDefault();
    if (!customSizeInput.trim()) return;
    const clean = customSizeInput.trim().toUpperCase();
    if (sizes.some(s => s.size === clean)) {
      return toast.error(`Size ${clean} already exists`);
    }
    setSizes(prev => [...prev, { size: clean, stock: 5 }]);
    setCustomSizeInput("");
    toast.success(`Added size EU ${clean}`);
  };

  // Save product (Draft or Active)
  const handleSave = async (statusOverride = null) => {
    if (!form.name.trim()) return toast.error("Please enter product name");
    if (!form.base_price || Number(form.base_price) <= 0) return toast.error("Please specify a valid base price");
    if (images.length === 0) return toast.error("Please add at least one sneaker photo");

    setSaving(true);
    const finalStatus = statusOverride || form.status;

    // Auto-generate slug if empty
    let cleanSlug = form.slug.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const payload = {
      name: form.name.trim(),
      slug: cleanSlug,
      category_slug: form.category_slug,
      brand_slug: form.brand_slug,
      base_price: Number(form.base_price),
      cost_price: form.cost_price ? Number(form.cost_price) : 0,
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      flash_sale_price: form.flash_sale_price ? Number(form.flash_sale_price) : null,
      description: form.description || form.name,
      images: images,
      hover_image: images[1] || images[0],
      sizes: sizes.map(s => ({
        ...(s.id ? { id: s.id } : {}),
        size: String(s.size),
        stock: Math.max(0, parseInt(s.stock) || 0)
      })),
      is_new_arrival: !!form.is_new_arrival,
      is_best_seller: !!form.is_best_seller,
      is_flash_sale: !!form.is_flash_sale,
      is_featured: !!form.is_featured,
      status: finalStatus,
    };

    try {
      if (isNew) {
        payload.slug = cleanSlug + "-" + Date.now().toString(36).slice(-4);
        const res = await http.post("/admin/products", payload);
        toast.success("Sneaker drop published successfully!");
        onSaved(res.data?.data);
      } else {
        const res = await http.patch(`/admin/products/${productId}`, payload);
        toast.success("Sneaker drop updated successfully!");
        onSaved(res.data?.data);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to save product drop");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (isNew || !productId) return;
    try {
      const res = await http.post(`/admin/products/${productId}/duplicate`);
      toast.success("Duplicated product as draft!");
      onSaved(res.data?.data);
    } catch (e) {
      toast.error("Duplication failed");
    }
  };

  const handleDelete = () => {
    if (isNew || !productId) return;
    setConfirmModal({
      isOpen: true,
      title: `Delete product "${form.name || 'this item'}"?`,
      message: "Permanently delete this product drop? This action cannot be undone.",
      confirmText: "Delete Product",
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await http.patch("/admin/products/bulk", { productIds: [productId], action: 'delete' });
          toast.success("Product deleted");
          setConfirmModal({ isOpen: false });
          if (onDelete) onDelete();
          else onBack();
        } catch (e) {
          toast.error("Failed to delete product");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="pb-10 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-bold text-xs rounded-lg border border-gray-300 dark:border-zinc-700 shadow-sm transition-colors">
            <ArrowLeft size={16} /> Back to Products
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-xs font-mono font-bold text-gray-500">Loading Product...</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center min-h-[350px] gap-3">
          <Loader2 size={32} className="animate-spin text-fire" />
          <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">Loading sneaker drop specifications...</p>
        </div>
      </div>
    );
  }

  const primaryPhoto = images[activePhotoIdx] || images[0] || "https://via.placeholder.com/600x600?text=Sneaker+Photo";

  return (
    <div className="pb-12 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">

      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-bold text-xs rounded-xl border border-gray-300 dark:border-zinc-700 shadow-sm transition-all hover:-translate-x-0.5"
          >
            <ArrowLeft size={16} /> Back to Products
          </button>
          <span className="text-gray-300 dark:text-zinc-700 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-mono font-bold text-gray-500 dark:text-zinc-400 hidden sm:inline">Products</span>
          <span className="text-gray-300 dark:text-zinc-700 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-bold capitalize text-fire hidden sm:inline">{form.category_slug}</span>
          <span className="text-gray-300 dark:text-zinc-700 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-mono font-black text-gray-900 dark:text-zinc-100 hidden sm:inline truncate max-w-[220px]">
            {isNew ? "New Drop" : (form.name || "Untitled")}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-800/80 p-1 pl-3 pr-2 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${form.status === 'active' ? 'bg-emerald-500' : form.status === 'draft' ? 'bg-amber-500' : 'bg-gray-400'}`}></span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="bg-transparent text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
            >
              <option value="active" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">Active</option>
              <option value="draft" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">Draft</option>
              <option value="archived" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">Archived</option>
            </select>
          </div>

          {!isNew && (
            <>
              <a
                href={`/product/${form.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-bold text-xs rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm transition-colors"
              >
                <ExternalLink size={14} /> Storefront
              </a>
              <button
                type="button"
                onClick={handleDuplicate}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-bold text-xs rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm transition-colors"
              >
                <Copy size={14} /> Duplicate
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900 shadow-sm transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-bold text-xs rounded-xl border border-gray-300 dark:border-zinc-700 shadow-sm transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(form.status === 'draft' ? 'active' : form.status)}
            disabled={saving}
            className="px-5 py-2 bg-fire hover:bg-fire-hover text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow-fire/20 transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {isNew ? "Publish Drop" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* High Impact 4-Metric Commercial Ribbon */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Retail Selling Price</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono text-xl font-black text-gray-900 dark:text-zinc-100">
              {fmt(basePriceNum)}
            </span>
            {comparePriceNum > basePriceNum && (
              <span className="font-mono text-[11px] text-gray-400 line-through">
                {fmt(comparePriceNum)}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-bold mt-0.5 inline-block ${grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            Margin: {fmt(grossProfit)} ({marginPct}%)
          </span>
        </div>

        <div>
          <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Inventory Health</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono text-xl font-black text-gray-900 dark:text-zinc-100">
              {totalStock}
            </span>
            <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">pairs in stock</span>
          </div>
          <span className={`text-[10px] font-bold mt-0.5 inline-block ${totalStock === 0 ? 'text-rose-600 dark:text-rose-400' : totalStock <= 10 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
            {inStockSizesCount} of {sizes.length} sizes available
          </span>
        </div>

        <div>
          <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Merchandising Flags</span>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {form.is_new_arrival && <span className="bg-fire/10 text-fire font-black text-[9px] px-2 py-0.5 rounded-md uppercase">New Drop</span>}
            {form.is_best_seller && <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-[9px] px-2 py-0.5 rounded-md uppercase">Best Seller</span>}
            {form.is_flash_sale && <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black text-[9px] px-2 py-0.5 rounded-md uppercase">Flash Sale</span>}
            {form.is_featured && <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-[9px] px-2 py-0.5 rounded-md uppercase">Featured</span>}
            {!form.is_new_arrival && !form.is_best_seller && !form.is_flash_sale && !form.is_featured && (
              <span className="text-gray-400 dark:text-zinc-500 text-[11px] font-medium">Standard Drop</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Classification</span>
          <div className="mt-1">
            <span className="font-bold text-gray-900 dark:text-zinc-100 capitalize block text-sm">
              {form.category_slug} / {form.brand_slug}
            </span>
            <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500">
              SKU: {form.slug || 'auto-generated'}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Workbench Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column (7 cols): Merchandising Assets & Inventory Sizing */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section 1: Sneaker Photo Gallery */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                <ImageIcon size={16} className="text-fire" /> Sneaker Photo Gallery ({images.length} photos)
              </h2>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                First photo is Cover · Tap thumbnail to preview
              </span>
            </div>

            {/* Primary Hero Preview */}
            <div className="relative aspect-[16/10] bg-gray-50 dark:bg-zinc-800 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 group">
              <img
                src={primaryPhoto}
                alt="Product Preview"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                {activePhotoIdx === 0 ? (
                  <span className="px-2.5 py-1 bg-fire text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                    Storefront Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetCover(activePhotoIdx)}
                    className="px-2.5 py-1 bg-black/70 hover:bg-fire text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors"
                  >
                    Make Cover
                  </button>
                )}
                <span className="px-2 py-1 bg-black/60 text-white font-mono text-[10px] rounded-lg">
                  Photo {activePhotoIdx + 1} of {images.length || 1}
                </span>
              </div>

              {images.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(activePhotoIdx)}
                  className="absolute top-3 right-3 p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg shadow-sm transition-colors"
                  title="Remove this photo"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {images.length > 0 && (
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all group ${activePhotoIdx === idx
                      ? 'border-fire ring-2 ring-fire/20 scale-105'
                      : 'border-gray-200 dark:border-zinc-700 opacity-70 hover:opacity-100'
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-fire text-white text-[8px] font-black uppercase px-1 rounded">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Photo Ingestion: Upload File or Paste URL */}
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Upload Button */}
                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 dark:bg-zinc-800 hover:bg-fire text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm shrink-0">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  <span>{uploading ? "Uploading..." : "Upload Photos"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUploadFiles}
                    className="hidden"
                  />
                </label>

                {/* URL Input */}
                <div className="flex-1 flex gap-2">
                  <input
                    type="url"
                    placeholder="Or paste direct image URL (https://...)..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUrl())}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-fire"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 text-xs font-bold rounded-xl border border-gray-200 dark:border-zinc-700 transition-colors"
                  >
                    Add URL
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Sneaker Details & Copy */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
              <FileText size={16} className="text-fire" /> Sneaker Identity & Story
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Air Jordan 4 Retro 'White Oreo'"
                  value={form.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      name: val,
                      ...(isNew ? { slug: val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") } : {})
                    }));
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-fire"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                  <span>URL Handle / Slug *</span>
                  <span className="text-[10px] text-gray-400">Public link: /product/{form.slug || 'handle'}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">/</span>
                  <input
                    type="text"
                    placeholder="air-jordan-4-retro-white-oreo"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
                    className="w-full pl-7 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Product Description & Materials
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the silhouette story, premium tumbled leather, colorway nuances, air cushioning technology, and package inclusions..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs leading-relaxed text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-fire"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Sizing Bench & Inventory Matrix */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-zinc-800 pb-3 gap-2">
              <div>
                <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                  <Package size={16} className="text-fire" /> Sizing Bench & Real-Time Stock
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Total {totalStock} pairs allocated across {sizes.length} EU sneaker sizes
                </p>
              </div>

              {/* Quick Batch Restock */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => batchStockAdjust(5)}
                  className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-[10px] font-bold rounded-lg border border-gray-200 dark:border-zinc-700"
                >
                  +5 All
                </button>
                <button
                  type="button"
                  onClick={() => batchStockAdjust(10)}
                  className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-[10px] font-bold rounded-lg border border-gray-200 dark:border-zinc-700"
                >
                  +10 All
                </button>
                <button
                  type="button"
                  onClick={() => setSizes(prev => prev.map(s => ({ ...s, stock: 0 })))}
                  className="px-2 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded-lg border border-rose-200 dark:border-rose-900"
                >
                  Zero All
                </button>
              </div>
            </div>

            {/* Sizing Matrix Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {sizes.map((s, idx) => {
                const stockVal = Number(s.stock) || 0;
                return (
                  <div
                    key={s.id || idx}
                    className={`p-3 rounded-xl border text-center transition-all ${stockVal === 0
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                      : stockVal <= 3
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                        : 'bg-gray-50/80 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700'
                      }`}
                  >
                    <span className="font-mono font-black text-xs text-gray-900 dark:text-zinc-100 block">
                      EU {s.size}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider block mt-0.5 ${stockVal === 0 ? 'text-rose-600' : stockVal <= 3 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                      {stockVal === 0 ? 'Sold Out' : stockVal <= 3 ? 'Low Stock' : 'In Stock'}
                    </span>

                    {/* Stepper & input */}
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateSizeStock(idx, -1)}
                        className="w-6 h-6 rounded-md bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 text-gray-700 dark:text-zinc-200 font-bold text-xs hover:bg-gray-100"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={s.stock}
                        onChange={(e) => setDirectSizeStock(idx, e.target.value)}
                        className="w-12 h-6 text-center font-mono font-bold text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-fire text-gray-900 dark:text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={() => updateSizeStock(idx, 1)}
                        className="w-6 h-6 rounded-md bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 text-gray-700 dark:text-zinc-200 font-bold text-xs hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Size Variant */}
            <form onSubmit={handleAddCustomSize} className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
              <input
                type="text"
                placeholder="Add custom size (e.g. 48, 42.5, 37.5)..."
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                className="w-56 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-gray-900 dark:bg-zinc-800 hover:bg-fire text-white text-xs font-bold rounded-xl transition-colors"
              >
                + Add Variant
              </button>
            </form>
          </div>

        </div>

        {/* Right Column (5 cols): Commercial Pricing, Taxonomy & Live Storefront Preview */}
        <div className="lg:col-span-5 space-y-6">

          {/* Section 1: Commercial Pricing & Margins */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
              <DollarSign size={16} className="text-fire" /> Commercial Pricing & COGS
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Retail Selling Price (Base) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="220"
                    value={form.base_price}
                    onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono font-black text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-400 mb-1">
                    Compare-At (MSRP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="280"
                      value={form.compare_at_price}
                      onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-400 mb-1">
                    Cost Price (COGS)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="110"
                      value={form.cost_price}
                      onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-400 mb-1">
                  Flash Sale Price (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="185"
                    value={form.flash_sale_price}
                    onChange={(e) => setForm({ ...form, flash_sale_price: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                  />
                </div>
              </div>

              {/* Profit & Margin Calculator */}
              <div className="bg-gray-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-gray-200 dark:border-zinc-700/60 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-zinc-400">Gross Profit / Pair:</span>
                  <span className={`font-mono font-bold ${grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    {fmt(grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-zinc-400">Profit Margin:</span>
                  <span className={`font-mono font-bold ${marginPct >= 30 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                    {marginPct}%
                  </span>
                </div>
                {discountPct > 0 && (
                  <div className="flex justify-between border-t border-gray-200 dark:border-zinc-700 pt-1">
                    <span className="text-gray-500 dark:text-zinc-400">Customer Discount:</span>
                    <span className="font-mono font-bold text-fire">
                      {discountPct}% OFF
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Taxonomy & Drop Classification */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2"><Tag size={16} className="text-fire" /> Category & Silhouette Brand</span>
              <span className="text-[10px] text-gray-400">Dynamic & Configurable</span>
            </h2>

            <div className="space-y-4">
              {/* Category Field with Quick-Add */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCat(!showQuickAddCat)}
                    className="text-[11px] font-bold text-fire hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {showQuickAddCat ? "Cancel" : "+ Quick Add Category"}
                  </button>
                </div>

                {showQuickAddCat && (
                  <div className="mb-2 p-2.5 bg-fire/5 dark:bg-fire/10 border border-fire/20 rounded-xl flex gap-2 animate-in fade-in duration-100">
                    <input
                      type="text"
                      placeholder="New category name (e.g. Skateboarding)..."
                      value={quickCatName}
                      onChange={(e) => setQuickCatName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleQuickAddCategory(e))}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                    />
                    <button
                      type="button"
                      disabled={quickSaving}
                      onClick={handleQuickAddCategory}
                      className="px-3 py-1.5 bg-fire hover:bg-fire-hover text-white text-xs font-bold rounded-lg transition-colors shadow-sm shrink-0 flex items-center gap-1"
                    >
                      {quickSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Save
                    </button>
                  </div>
                )}

                <select
                  value={form.category_slug}
                  onChange={(e) => setForm({ ...form, category_slug: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire capitalize cursor-pointer"
                >
                  {availableCategories.length === 0 ? (
                    <option value="">-- No categories configured --</option>
                  ) : (
                    availableCategories.map(c => (
                      <option key={c.id} value={c.slug} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Brand Field with Quick-Add */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                    Brand / Manufacturer *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddBrand(!showQuickAddBrand)}
                    className="text-[11px] font-bold text-fire hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {showQuickAddBrand ? "Cancel" : "+ Quick Add Brand"}
                  </button>
                </div>

                {showQuickAddBrand && (
                  <div className="mb-2 p-2.5 bg-fire/5 dark:bg-fire/10 border border-fire/20 rounded-xl flex gap-2 animate-in fade-in duration-100">
                    <input
                      type="text"
                      placeholder="New brand name (e.g. Puma, Vans, Bape)..."
                      value={quickBrandName}
                      onChange={(e) => setQuickBrandName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleQuickAddBrand(e))}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
                    />
                    <button
                      type="button"
                      disabled={quickSaving}
                      onClick={handleQuickAddBrand}
                      className="px-3 py-1.5 bg-fire hover:bg-fire-hover text-white text-xs font-bold rounded-lg transition-colors shadow-sm shrink-0 flex items-center gap-1"
                    >
                      {quickSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Save
                    </button>
                  </div>
                )}

                <select
                  value={form.brand_slug}
                  onChange={(e) => setForm({ ...form, brand_slug: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire capitalize cursor-pointer"
                >
                  {availableBrands.length === 0 ? (
                    <option value="">-- No brands configured --</option>
                  ) : (
                    availableBrands.map(b => (
                      <option key={b.id} value={b.slug} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">
                        {b.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Storefront Merchandising Flags */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
              <Zap size={16} className="text-fire" /> Storefront Merchandising Badges
            </h2>

            <div className="space-y-2.5">
              {[
                { key: "is_new_arrival", label: "New Arrival Drop", desc: "Highlights sneaker in New Releases feed", badge: "NEW", color: "text-fire bg-fire/10" },
                { key: "is_best_seller", label: "Best Seller", desc: "Appears in Trending and Top-Seller filters", badge: "HOT", color: "text-amber-600 bg-amber-500/10" },
                { key: "is_flash_sale", label: "Flash Sale Drop", desc: "Activates flash countdown timer banner", badge: "SALE", color: "text-purple-600 bg-purple-500/10" },
                { key: "is_featured", label: "Featured Showcase", desc: "Pinned in hero collections and landing page", badge: "FEATURED", color: "text-blue-600 bg-blue-500/10" }
              ].map(item => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/60 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={!!form[item.key]}
                    onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                    className="accent-fire w-4 h-4 mt-0.5 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-zinc-100">{item.label}</span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${item.color}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Section 4: Live Storefront Card Preview */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2"><Eye size={16} className="text-fire" /> Storefront Card Preview</span>
              <span className="text-[10px] font-mono text-gray-400">Live Customer View</span>
            </h2>

            {/* Simulated Sneaker Card */}
            <div className="w-full max-w-[280px] mx-auto bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 shadow-lg">
              <div className="relative aspect-square bg-gray-100 dark:bg-zinc-900 overflow-hidden">
                <img
                  src={images[0] || "https://via.placeholder.com/400x400?text=Sneaker"}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                  {form.is_new_arrival && (
                    <span className="px-2 py-0.5 bg-fire text-white text-[9px] font-black uppercase tracking-wider rounded-md">
                      New
                    </span>
                  )}
                  {discountPct > 0 && (
                    <span className="px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-wider rounded-md">
                      -{discountPct}%
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-400 capitalize">
                  {form.brand_slug} · {form.category_slug}
                </span>
                <p className="font-display font-bold text-xs text-gray-900 dark:text-zinc-100 line-clamp-1">
                  {form.name || "Untitled Sneaker Drop"}
                </p>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="font-mono text-sm font-black text-gray-900 dark:text-zinc-100">
                    {fmt(basePriceNum)}
                  </span>
                  {comparePriceNum > basePriceNum && (
                    <span className="font-mono text-xs text-gray-400 line-through">
                      {fmt(comparePriceNum)}
                    </span>
                  )}
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-zinc-700 flex justify-between items-center text-[10px]">
                  <span className="font-mono text-gray-500 dark:text-zinc-400">
                    {totalStock > 0 ? `${totalStock} in stock` : <span className="text-rose-500 font-bold">Sold Out</span>}
                  </span>
                  <span className="font-bold text-fire uppercase text-[9px]">View Drop →</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText="Cancel"
        variant={confirmModal.variant || "danger"}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />

    </div>
  );
}


function Coupons({ isDark }) {
  const [data, setData] = useState({ coupons: [], pagination: {}, stats: {} });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ page: 1, limit: 25, search: "", status: "all", type: "all" });
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [viewCoupon, setViewCoupon] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams(query).toString();
      const res = await http.get(`/admin/coupons?${q}`);
      setData(res.data.data);
    } catch (e) { toast.error("Failed to load coupons"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery({ ...query, search: searchInput, page: 1 });
  };

  const resetFilters = () => {
    setSearchInput("");
    setQuery({ page: 1, limit: 25, search: "", status: "all", type: "all" });
  };

  const selectAll = (e) => {
    if (e.target.checked) setSelected(data.coupons?.map(c => c.id) || []);
    else setSelected([]);
  };

  const toggleSelect = (id) => {
    if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
    else setSelected([...selected, id]);
  };

  const toggleStatus = async (id, isActive) => {
    try {
      await http.patch(`/admin/coupons/${id}`, { is_active: isActive });
      toast.success(isActive ? "Coupon enabled" : "Coupon disabled");
      load();
    } catch (e) { toast.error("Action failed"); }
  };

  const STATS = [
    { label: "Total", count: data.stats?.total || 0, color: "text-obsidian" },
    { label: "Active", count: data.stats?.active || 0, color: "text-green-600" },
    { label: "Redemptions", count: data.stats?.redemptions || 0, color: "text-obsidian" },
    { label: "Discount Given", count: fmt(data.stats?.discount || 0), color: "text-fire" }
  ];

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-semibold ">Coupons</h1>
          <p className="text-sm text-ink-500">Create and manage discount codes</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-obsidian text-white font-bold  px-4 py-2 hover:bg-fire transition-colors flex items-center gap-2"><Plus size={16} /> Create Coupon</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="bg-white p-4 border border-ink-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-ink-400  tracking-wider">{s.label}</span>
            <span className={`text-2xl font-mono font-black mt-2 ${s.color}`}>{s.count}</span>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 border border-ink-200 mb-6 flex flex-col lg:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 relative w-full">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Search coupon code..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-ink-200 text-sm focus:border-obsidian focus:outline-none rounded-none  font-mono" />
        </form>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <select value={query.status} onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })} className="border border-ink-200 px-3 py-2 text-sm focus:outline-none rounded-none bg-white">
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="expired">Expired</option>
          </select>
          <select value={query.type} onChange={(e) => setQuery({ ...query, type: e.target.value, page: 1 })} className="border border-ink-200 px-3 py-2 text-sm focus:outline-none rounded-none bg-white">
            <option value="all">Type: All</option>
            <option value="percentage">Percentage</option>
            <option value="flat">Flat Amount</option>
          </select>
          <button onClick={resetFilters} className="text-sm font-bold text-ink-500 hover:text-fire  px-3 py-2">Reset</button>
        </div>
      </div>

      <div className="bg-white border border-ink-200 overflow-x-auto min-h-[400px]">
        {loading ? <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></div></div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-ink-100 font-mono text-[10px]  text-ink-500">
              <tr>
                <th className="p-3 w-10"><input type="checkbox" checked={data.coupons?.length > 0 && selected.length === data.coupons?.length} onChange={selectAll} className="accent-obsidian" /></th>
                <th className="p-3">Coupon Code</th>
                <th className="p-3 text-center">Discount</th>
                <th className="p-3 text-center">Usage</th>
                <th className="p-3">Valid Until</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Revenue</th>
                <th className="p-3 text-center">⋮</th>
              </tr>
            </thead>
            <tbody>
              {!data.coupons || data.coupons.length === 0 ? <tr><td colSpan="8" className="p-10 text-center text-ink-400">No coupons found.</td></tr> : data.coupons.map(c => (
                <tr key={c.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50 cursor-pointer" onClick={() => setViewCoupon(c)}>
                  <td className="p-3" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} className="accent-obsidian" /></td>
                  <td className="p-3 font-mono font-bold text-obsidian">{c.code}</td>
                  <td className="p-3 text-center">
                    <span className="font-bold bg-ink-100 px-2 py-1 rounded-sm">{c.type === 'percentage' ? `${c.value}%` : fmt(c.value)}</span>
                  </td>
                  <td className="p-3 text-center font-mono">
                    {c.used_count} {c.max_uses ? `/ ${c.max_uses}` : '/ ∞'}
                  </td>
                  <td className="p-3 text-ink-500">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
                  <td className="p-3">
                    {c.status === 'active' && <span className="text-[10px] font-bold  px-2 py-0.5 bg-green-100 text-green-700 flex items-center w-fit gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-600"></div> Active</span>}
                    {c.status === 'disabled' && <span className="text-[10px] font-bold  px-2 py-0.5 bg-ink-200 text-ink-600 flex items-center w-fit gap-1"><div className="w-1.5 h-1.5 rounded-full bg-ink-500"></div> Disabled</span>}
                    {c.status === 'expired' && <span className="text-[10px] font-bold  px-2 py-0.5 bg-red-100 text-red-700 flex items-center w-fit gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-600"></div> Expired</span>}
                    {c.status === 'scheduled' && <span className="text-[10px] font-bold  px-2 py-0.5 bg-yellow-100 text-yellow-700 flex items-center w-fit gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-600"></div> Scheduled</span>}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-green-700">{fmt(c.revenue_generated)}</td>
                  <td className="p-3 text-center relative" onClick={e => e.stopPropagation()}>
                    <TableActionDropdown
                      isOpen={activeMenuId === c.id}
                      onToggle={() => setActiveMenuId(activeMenuId === c.id ? null : c.id)}
                      onClose={() => setActiveMenuId(null)}
                      menuWidth="w-40"
                    >
                      <button
                        onClick={() => { setActiveMenuId(null); setViewCoupon(c); }}
                        className="w-full px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Eye size={14} className="text-gray-400" /> View Details
                      </button>
                      <button
                        onClick={() => { setActiveMenuId(null); toggleStatus(c.id, !c.is_active); }}
                        className="w-full px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} className="text-gray-400" /> {c.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </TableActionDropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data.pagination?.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-ink-500">Showing page {data.pagination.page} of {data.pagination.totalPages}</div>
          <div className="flex gap-1">
            <button disabled={query.page === 1} onClick={() => setQuery({ ...query, page: query.page - 1 })} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Prev</button>
            <button disabled={query.page === data.pagination.totalPages} onClick={() => setQuery({ ...query, page: query.page + 1 })} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Next</button>
          </div>
        </div>
      )}

      {showCreate && <CreateCouponForm isDark={isDark} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {viewCoupon && <CouponDetailsDrawer isDark={isDark} coupon={viewCoupon} onClose={() => setViewCoupon(null)} />}
    </div>
  );
}

function CreateCouponForm({ onClose, onCreated, isDark }) {
  const [f, setF] = useState({
    code: "", type: "percentage", value: "", min_order_value: "", max_uses: "", expires_at: ""
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!f.code || !f.value) return toast.error("Code and discount value are required");
    setSaving(true);
    try {
      await http.post("/admin/coupons", {
        code: f.code,
        type: f.type,
        value: Number(f.value),
        min_order_value: f.min_order_value ? Number(f.min_order_value) : null,
        max_uses: f.max_uses ? Number(f.max_uses) : null,
        expires_at: f.expires_at || null
      });
      toast.success("Coupon created successfully");
      onCreated();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to create coupon");
    }
    setSaving(false);
  };

  const presets = [
    { label: "10% Off", set: { type: "percentage", value: "10" } },
    { label: "20% Off", set: { type: "percentage", value: "20" } },
    { label: "Rs 1,000 Off", set: { type: "flat", value: "1000" } },
    { label: "Rs 2,000 Off", set: { type: "flat", value: "2000" } },
    { label: "Free Shipping", set: { type: "percentage", value: "100" } }
  ];

  return (
    <div
      className={`${isDark ? 'dark' : ''} fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 text-gray-900 dark:text-zinc-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-obsidian text-white dark:bg-zinc-800 dark:text-zinc-100 dark:border dark:border-zinc-700 flex items-center justify-center font-bold shadow-sm">
              <Ticket size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Create New Coupon</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Configure discount voucher code and usage rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs bg-white dark:bg-zinc-900">
          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
              Quick Presets
            </label>
            <div className="flex gap-2 flex-wrap">
              {presets.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setF({ ...f, ...p.set })}
                  className="px-3 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-xs font-semibold text-gray-700 dark:text-zinc-200 transition-colors shadow-sm"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-gray-50 dark:bg-zinc-950/70 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800 pb-2">
              Basic Information
            </h3>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">Coupon Code</label>
              <input
                type="text"
                placeholder="e.g. SUMMER20"
                value={f.code}
                onChange={e => setF({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-mono font-bold text-gray-900 dark:text-white uppercase outline-none focus:ring-1 focus:ring-obsidian dark:focus:ring-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">Discount Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setF({ ...f, type: 'percentage' })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                      f.type === 'percentage'
                        ? 'bg-obsidian text-white border-obsidian dark:bg-white dark:text-black dark:border-white'
                        : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setF({ ...f, type: 'flat' })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                      f.type === 'flat'
                        ? 'bg-obsidian text-white border-obsidian dark:bg-white dark:text-black dark:border-white'
                        : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Fixed (Rs)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                  Discount Value {f.type === 'percentage' ? '(%)' : '(Rs)'}
                </label>
                <input
                  type="number"
                  placeholder={f.type === 'percentage' ? "e.g. 20" : "e.g. 1500"}
                  value={f.value}
                  onChange={e => setF({ ...f, value: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-mono text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-obsidian dark:focus:ring-white"
                />
              </div>
            </div>
          </div>

          {/* Usage Restrictions & Validity */}
          <div className="bg-gray-50 dark:bg-zinc-950/70 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800 pb-2">
              Restrictions & Validity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">Minimum Order Amount (Rs)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={f.min_order_value}
                  onChange={e => setF({ ...f, min_order_value: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-mono text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-obsidian dark:focus:ring-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">Total Usage Limit (Blank = ∞)</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={f.max_uses}
                  onChange={e => setF({ ...f, max_uses: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-mono text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-obsidian dark:focus:ring-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">Expiry Date & Time (Optional)</label>
              <input
                type="datetime-local"
                value={f.expires_at}
                onChange={e => setF({ ...f, expires_at: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-mono text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-obsidian dark:focus:ring-white"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 dark:bg-zinc-800/60 border-t border-gray-200 dark:border-zinc-800 p-4 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2 bg-obsidian dark:bg-white text-white dark:text-black text-xs font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            <span>Create Coupon</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function CouponDetailsDrawer({ coupon, onClose, isDark }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http.get(`/admin/coupons/${coupon.id}`).then((res) => {
      setData(res.data.data);
      setLoading(false);
    });
  }, [coupon.id]);

  if (!data && loading) return (
    <div className={`${isDark ? 'dark' : ''} fixed inset-0 z-50 flex items-center justify-center bg-black/60`} onClick={onClose}>
      <div className="w-8 h-8 border-4 border-obsidian dark:border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!data) return null;

  return (
    <div className={`${isDark ? 'dark' : ''} fixed inset-0 z-50 flex justify-end bg-black/60 animate-in fade-in duration-150`} onClick={onClose}>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.2 }}
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 h-full overflow-y-auto flex flex-col shadow-2xl border-l border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-6 flex justify-between items-start sticky top-0 z-10">
          <div>
            <h2 className="font-mono font-bold text-2xl text-gray-900 dark:text-white flex items-center gap-3">
              {data.code}
              {data.status === 'active' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Active</span>}
              {data.status === 'disabled' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">Disabled</span>}
              {data.status === 'expired' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800">Expired</span>}
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold mt-1 bg-gray-100 dark:bg-zinc-800 w-fit px-2 py-0.5 rounded">
              {data.type === 'percentage' ? `${data.value}% OFF` : `${fmt(data.value)} OFF`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl text-center">
              <span className="block text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase mb-1">Redemptions</span>
              <span className="font-mono text-xl font-bold text-gray-900 dark:text-white">{data.used_count}</span>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl text-center">
              <span className="block text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase mb-1">Usage Limit</span>
              <span className="font-mono text-xl font-bold text-gray-900 dark:text-white">{data.max_uses || '∞'}</span>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl text-center">
              <span className="block text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase mb-1">Discount Given</span>
              <span className="font-mono text-xl font-bold text-fire">{fmt(data.total_discount)}</span>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-950/60 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl text-center">
              <span className="block text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase mb-1">Revenue Generated</span>
              <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(data.revenue_generated)}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-gray-500 dark:text-zinc-400 border-b border-gray-100 dark:border-zinc-800 pb-2">Recent Usage</h3>
            {data.recent_usage?.length > 0 ? (
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-zinc-800/50 text-[10px] uppercase text-gray-500 dark:text-zinc-400">
                  <tr><th className="p-2">Customer</th><th className="p-2">Order</th><th className="p-2 text-right">Discount</th><th className="p-2">Date</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                  {data.recent_usage.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                      <td className="p-2 font-semibold text-gray-900 dark:text-white">{o.customer_name}</td>
                      <td className="p-2 font-mono text-gray-700 dark:text-zinc-300">{o.order_number}</td>
                      <td className="p-2 text-right font-mono font-bold text-fire">-{fmt(o.discount_amount)}</td>
                      <td className="p-2 text-gray-500 dark:text-zinc-400 text-[11px] font-mono">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-xs text-gray-400 dark:text-zinc-500">No usage recorded yet.</p>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}



function Reviews({ isDark }) {
  const [data, setData] = useState({ reviews: [], pagination: { totalCount: 0, totalPages: 1, page: 1, limit: 25 }, stats: {}, chartData: [] });
  const [productsData, setProductsData] = useState({ best: [], attention: [] });
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [ratingFilter, setRatingFilter] = useState(0);

  const [viewReview, setViewReview] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [chartMode, setChartMode] = useState("count"); // count or avgRating

  useEffect(() => {
    fetchReviews();
    fetchProductRatings();
  }, [page, status, ratingFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await http.get(`/admin/reviews?page=${page}&search=${encodeURIComponent(search)}&status=${status}&rating=${ratingFilter}`);
      setData(res.data.data);
    } catch (err) {
      toast.error("Failed to load reviews");
    }
    setLoading(false);
  };

  const fetchProductRatings = async () => {
    try {
      const res = await http.get('/admin/reviews/products');
      setProductsData(res.data.data || { best: [], attention: [] });
    } catch (err) {
      // silent fail
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const moderateReview = async (id, newStatus) => {
    try {
      await http.patch(`/admin/reviews/${id}`, { status: newStatus });
      toast.success(`Review ${newStatus}`);
      if (viewReview && viewReview.id === id) setViewReview({ ...viewReview, status: newStatus });
      fetchReviews();
      fetchProductRatings();
    } catch (err) {
      toast.error("Failed to update review");
    }
  };

  const sendReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      await http.patch(`/admin/reviews/${id}`, { admin_reply: replyText, status: 'approved' });
      toast.success("Reply submitted & review approved");
      if (viewReview && viewReview.id === id) setViewReview({ ...viewReview, admin_reply: replyText, status: 'approved' });
      setReplyText("");
      fetchReviews();
      fetchProductRatings();
    } catch (err) {
      toast.error("Failed to send reply");
    }
  };

  const statCards = [
    { label: "Total Reviews", value: data?.stats?.total || 0 },
    { label: "Pending Approval", value: data?.stats?.pending || 0, alert: data?.stats?.pending > 0 },
    { label: "Average Rating", value: `${data?.stats?.average || 0} ★` },
    { label: "Positive Reviews", value: data?.stats?.positive || 0, sub: `${data?.stats?.positivePercent || 0}%` },
    { label: "Negative Reviews", value: data?.stats?.negative || 0, sub: `${data?.stats?.negativePercent || 0}%` }
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`text-base ${i < rating ? 'text-amber-400' : 'text-gray-300 dark:text-zinc-600'}`}>★</span>
    ));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-obsidian text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0 shadow-md">
            <Star size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Customer Reviews & Ratings</h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60">
                Verified Feedback
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Moderate sneaker reviews, approve genuine buyers, respond directly with verified badges, and track customer satisfaction.
            </p>
          </div>
        </div>

        <button
          onClick={() => { fetchReviews(); fetchProductRatings(); }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-4 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm relative overflow-hidden group hover:border-gray-400 dark:hover:border-zinc-700 transition-colors">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">{s.label}</div>
            <div className="text-2xl lg:text-3xl font-bold font-mono text-gray-900 dark:text-white flex items-baseline gap-2">
              {s.value}
              {s.sub && <span className="text-xs text-gray-400 dark:text-zinc-500 font-normal font-sans">{s.sub}</span>}
            </div>
            {s.alert && (
              <div className="absolute top-3.5 right-3.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 flex items-center gap-1">
                <AlertTriangle size={11} /> Action Req
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Distribution & Trend Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Breakdown */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-xs tracking-wider uppercase text-gray-500 dark:text-zinc-400 mb-5">Rating Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(star => {
              const count = data?.stats?.ratingDist?.[star] || 0;
              const total = data?.stats?.total || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <div className="flex text-amber-400 w-16 text-sm">
                    {Array.from({ length: 5 }).map((_, i) => <span key={i}>{i < star ? '★' : '☆'}</span>)}
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="w-8 text-right font-bold text-gray-700 dark:text-zinc-300 font-mono">{count}</div>
                  <div className="w-9 text-right text-gray-400 dark:text-zinc-500 text-[11px] font-mono">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-Day Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold text-xs tracking-wider uppercase text-gray-500 dark:text-zinc-400">7-Day Activity Trend</h3>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">Real-time daily review volume & rating trajectory</p>
            </div>
            <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                onClick={() => setChartMode('count')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  chartMode === 'count'
                    ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Volume
              </button>
              <button
                onClick={() => setChartMode('avgRating')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  chartMode === 'avgRating'
                    ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Avg Rating
              </button>
            </div>
          </div>
          <div className="h-48 w-full">
            {data?.chartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.chartData}>
                  <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} tick={{ fill: isDark ? '#71717a' : '#9ca3af' }} />
                  <YAxis fontSize={11} axisLine={false} tickLine={false} tick={{ fill: isDark ? '#71717a' : '#9ca3af' }} domain={chartMode === 'avgRating' ? [0, 5] : ['auto', 'auto']} />
                  <Tooltip
                    cursor={{ stroke: isDark ? '#3f3f46' : '#e5e7eb', strokeDasharray: '3 3' }}
                    contentStyle={{
                      borderRadius: '10px',
                      border: isDark ? '1px solid #27272a' : '1px solid #e5e7eb',
                      backgroundColor: isDark ? '#18181b' : '#ffffff',
                      color: isDark ? '#f4f4f5' : '#111827',
                      fontSize: '12px'
                    }}
                  />
                  <Line type="monotone" dataKey={chartMode === 'count' ? 'count' : 'avgRating'} stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 dark:text-zinc-500">No trend data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Reviews Management Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Status Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-gray-50/50 dark:bg-zinc-800/40">
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Reviews' },
              { id: 'pending', label: 'Pending Approval' },
              { id: 'approved', label: 'Approved' },
              { id: 'reported', label: 'Flagged / Spam' },
              { id: 'rejected', label: 'Rejected' },
            ].map(tabItem => {
              const count = tabItem.id === 'pending' ? data?.stats?.pending : tabItem.id === 'approved' ? data?.stats?.approved : tabItem.id === 'rejected' ? data?.stats?.rejected : tabItem.id === 'reported' ? data?.stats?.reported : data?.stats?.total;
              const active = status === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => { setStatus(tabItem.id); setPage(1); }}
                  className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    active
                      ? 'bg-obsidian text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <span>{tabItem.label}</span>
                  <span className={`ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black' : 'bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                  }`}>
                    {count || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Rating Filter Controls */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search by customer name or review text..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-obsidian dark:focus:ring-white transition-colors"
              />
            </div>
            <button type="submit" className="bg-obsidian dark:bg-white text-white dark:text-black px-5 py-2 text-xs font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm">
              Search
            </button>
          </form>
          <div className="flex gap-2">
            <select
              value={ratingFilter}
              onChange={e => { setRatingFilter(Number(e.target.value)); setPage(1); }}
              className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-3.5 py-2 text-xs rounded-lg text-gray-900 dark:text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value={0}>All Star Ratings</option>
              <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
              <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
              <option value={3}>⭐⭐⭐ 3 Stars</option>
              <option value={2}>⭐⭐ 2 Stars</option>
              <option value={1}>⭐ 1 Star</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-zinc-800/60 border-b border-gray-200 dark:border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Review Content</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400 dark:text-zinc-500">
                    <Loader2 className="animate-spin mx-auto mb-2 text-obsidian dark:text-white" size={24} />
                    <span>Loading reviews...</span>
                  </td>
                </tr>
              ) : data?.reviews?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400 dark:text-zinc-500">
                    <Star className="mx-auto mb-2 opacity-40" size={28} />
                    <p className="font-semibold text-gray-700 dark:text-zinc-300">No reviews found</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Try resetting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                data?.reviews?.map(r => (
                  <tr
                    key={r.id}
                    onClick={() => setViewReview(r)}
                    className="hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                  >
                    {/* Customer */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 dark:text-zinc-100">{r.customer_name}</div>
                      {r.order_id && (
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                          <CheckCircle size={10} /> Verified Purchase
                        </div>
                      )}
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        {r.product?.image_url ? (
                          <img src={imgUrl(r.product.image_url)} alt="" className="w-9 h-9 object-cover rounded-lg border border-gray-200 dark:border-zinc-700 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-400">
                            <Package size={14} />
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-zinc-200 truncate max-w-[150px]" title={r.product?.name}>
                          {r.product?.name || 'Unknown Sneaker'}
                        </span>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {renderStars(r.rating)}
                        <span className="font-mono text-xs font-bold text-gray-700 dark:text-zinc-300 ml-1">({r.rating})</span>
                      </div>
                    </td>

                    {/* Comment */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-gray-700 dark:text-zinc-300 truncate font-normal" title={r.comment}>
                        "{r.comment || "No comment provided"}"
                      </div>
                      {r.admin_reply && (
                        <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                          <MessageCircle size={11} /> Admin Replied
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        r.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                          : r.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                          : r.status === 'reported'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}>
                        {r.status === 'reported' ? 'Flagged Spam' : r.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-gray-500 dark:text-zinc-400 font-mono text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>

                    {/* Inspect button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewReview(r);
                        }}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 transition-colors"
                      >
                        Moderate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 bg-gray-50/50 dark:bg-zinc-800/30">
          <div>
            Showing <span className="font-semibold text-gray-900 dark:text-white">{((data?.pagination?.page - 1) * data?.pagination?.limit) + (data?.reviews?.length > 0 ? 1 : 0)}</span> to <span className="font-semibold text-gray-900 dark:text-white">{((data?.pagination?.page - 1) * data?.pagination?.limit) + data?.reviews?.length}</span> of <span className="font-semibold text-gray-900 dark:text-white">{data?.pagination?.totalCount}</span> reviews
          </div>
          <div className="flex gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 font-semibold transition-colors"
            >
              &larr; Prev
            </button>
            <button
              disabled={page === data?.pagination?.totalPages || data?.pagination?.totalPages === 0}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 font-semibold transition-colors"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Product Rating Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-xs tracking-wider uppercase text-gray-500 dark:text-zinc-400 mb-5 flex items-center gap-2">
            <Star size={14} className="text-amber-500" /> Top Rated Sneakers
          </h3>
          <div className="space-y-3.5">
            {productsData.best?.map((p, i) => (
              <div key={p.id} className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 dark:text-zinc-500 font-mono font-bold w-4">{i + 1}.</span>
                  <span className="font-semibold text-xs text-gray-900 dark:text-white truncate max-w-[220px]">{p.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-amber-500 flex items-center gap-1">★ {p.avg}</span>
                  <span className="text-gray-400 dark:text-zinc-500 text-[11px] font-mono">{p.total} {p.total === 1 ? 'review' : 'reviews'}</span>
                </div>
              </div>
            ))}
            {(!productsData.best || productsData.best.length === 0) && (
              <div className="text-xs text-gray-400 dark:text-zinc-500 py-4 text-center">Not enough data to rank products.</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-xs tracking-wider uppercase text-gray-500 dark:text-zinc-400 mb-5 flex items-center gap-2">
            <AlertTriangle size={14} className="text-rose-500" /> Sneakers Needing Attention
          </h3>
          <div className="space-y-3.5">
            {productsData.attention?.map((p, i) => (
              <div key={p.id} className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 dark:text-zinc-500 font-mono font-bold w-4">{i + 1}.</span>
                  <span className="font-semibold text-xs text-gray-900 dark:text-white truncate max-w-[220px]">{p.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-rose-500 flex items-center gap-1">★ {p.avg}</span>
                  <span className="text-gray-400 dark:text-zinc-500 text-[11px] font-mono">{p.total} {p.total === 1 ? 'review' : 'reviews'}</span>
                </div>
              </div>
            ))}
            {(!productsData.attention || productsData.attention.length === 0) && (
              <div className="text-xs text-gray-400 dark:text-zinc-500 py-4 text-center">Not enough data to rank products.</div>
            )}
          </div>
        </div>
      </div>

      {/* Review Details Drawer */}
      {viewReview && (
        <div className={`${isDark ? 'dark' : ''} fixed inset-0 z-50 flex justify-end animate-in fade-in duration-150`}>
          <div className="absolute inset-0 bg-black/60" onClick={() => { setViewReview(null); setReplyText(""); }}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-zinc-800 animate-in slide-in-from-right duration-200 text-gray-900 dark:text-zinc-100">
            {/* Drawer Header */}
            <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50/70 dark:bg-zinc-850 dark:bg-zinc-800/60">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-amber-400" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Review Moderation</h2>
              </div>
              <button
                onClick={() => { setViewReview(null); setReplyText(""); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Review Content */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="mb-1">{renderStars(viewReview.rating)}</div>
                    <div className="font-bold text-base text-gray-900 dark:text-white">{viewReview.customer_name}</div>
                    <div className="text-[11px] text-gray-400 dark:text-zinc-500 font-mono mt-0.5">
                      {new Date(viewReview.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    viewReview.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                      : viewReview.status === 'pending'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                      : viewReview.status === 'reported'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  }`}>
                    {viewReview.status}
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-950/70 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-800 dark:text-zinc-200 italic leading-relaxed">
                  "{viewReview.comment || "No written review provided."}"
                </div>
              </div>

              {/* Associations */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50 p-3 rounded-xl">
                  <div className="text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500 mb-1">Product</div>
                  <div className="font-semibold text-xs truncate text-gray-900 dark:text-zinc-200">{viewReview.product?.name || 'Unknown'}</div>
                </div>
                <div className="border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50 p-3 rounded-xl">
                  <div className="text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500 mb-1">Order Link</div>
                  {viewReview.order_id ? (
                    <div>
                      <div className="font-mono font-semibold text-xs text-gray-900 dark:text-zinc-200">#{viewReview.order?.order_number || viewReview.order_id.substring(0, 8)}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                        <CheckCircle size={10} /> Verified Order
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 dark:text-zinc-500">Unverified / Guest</div>
                  )}
                </div>
              </div>

              {/* Admin Reply */}
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2.5">Official Store Reply</h4>
                {viewReview.admin_reply ? (
                  <div className="bg-zinc-900 text-white p-4 rounded-xl relative overflow-hidden border border-zinc-800">
                    <div className="absolute top-0 right-0 p-2 text-white/10"><MessageCircle size={40} /></div>
                    <div className="font-bold text-xs mb-1.5 flex items-center gap-1.5 text-amber-400">
                      <CheckCircle size={12} /> Store Response Published
                    </div>
                    <p className="text-zinc-300 leading-relaxed text-xs relative z-10">{viewReview.admin_reply}</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={`Thank you for your feedback, ${viewReview.customer_name}...`}
                      className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-3 text-xs rounded-xl min-h-[90px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-obsidian dark:focus:ring-white transition-colors"
                    ></textarea>
                    <button
                      onClick={() => sendReply(viewReview.id)}
                      disabled={!replyText.trim()}
                      className="w-full bg-obsidian dark:bg-white text-white dark:text-black py-2.5 font-semibold text-xs rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40 shadow-sm"
                    >
                      Publish Reply & Approve
                    </button>
                    <div className="text-[11px] text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                      <AlertTriangle size={11} className="text-amber-500" /> Replying automatically approves and features this review.
                    </div>
                  </div>
                )}
              </div>

              {/* Report Reason */}
              {viewReview.status === 'reported' && viewReview.report_reason && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 p-3.5 rounded-xl">
                  <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Flagged Reason</div>
                  <div className="text-xs text-rose-800 dark:text-rose-300">{viewReview.report_reason}</div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-800/60 grid grid-cols-3 gap-2">
              <button
                onClick={() => moderateReview(viewReview.id, 'approved')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                Approve
              </button>
              <button
                onClick={() => moderateReview(viewReview.id, 'rejected')}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 py-2 text-xs font-semibold rounded-lg transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => moderateReview(viewReview.id, 'reported')}
                className="bg-rose-600 hover:bg-rose-700 text-white py-2 text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                Flag Spam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


async function uploadImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await http.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
  return imgUrl(data.data.url);
}

function AdminImageInput({ value, onChange, testid }) {
  const [busy, setBusy] = useState(false);
  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try { onChange(await uploadImage(file)); toast.success("Image uploaded"); }
    catch { toast.error("Upload failed"); }
    setBusy(false);
  };
  return (
    <div className="flex gap-2 items-center">
      <input placeholder="Image URL or upload →" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 border border-ink-200 rounded-none px-4 py-2.5 outline-none focus:border-obsidian text-sm" />
      <label data-testid={testid} className="shrink-0 flex items-center gap-1.5 bg-obsidian text-white text-xs font-bold  px-3 py-2.5 rounded-none cursor-pointer hover:bg-fire transition-colors">
        <Upload size={14} /> {busy ? "…" : "Upload"}
        <input type="file" accept="image/*" onChange={handle} className="hidden" />
      </label>
      {value && <img src={value} alt="" className="h-10 w-10 rounded-none object-cover bg-ink-100" />}
    </div>
  );
}

function RefundModal({ order, onClose, onDone }) {
  const [amount, setAmount] = useState(order.payment_status === "partially_paid" ? order.advance_paid : order.total);
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState(order.payment_method === "COD" ? "STORE_CREDIT" : "SAFEPAY_ORIGINAL");
  const [ref, setRef] = useState("");
  const submit = async () => {
    if (!reason.trim()) return toast.error("Reason required");
    try {
      await http.post(`/admin/orders/${order.id}/refund`, { amount: Number(amount), reason, method, external_ref: ref || null });
      toast.success("Refund processed");
      onDone();
    } catch (e) { toast.error(e.response?.data?.detail || "Refund failed"); }
  };
  return (
    <div className="fixed inset-0 bg-obsidian/60 z-50 grid place-items-center p-5" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-none p-6 w-full max-w-md">
        <div className="flex justify-between mb-4"><h3 className="font-display">Refund {order.order_number}</h3><button onClick={onClose}><X size={20} /></button></div>
        <p className="text-sm text-ink-500 mb-4">Paid: {order.payment_status} · Total {fmt(order.total)}{order.advance_paid ? ` · Advance ${fmt(order.advance_paid)}` : ""}</p>
        <div className="space-y-3">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" data-testid="admin-refund-amount" className="w-full border border-ink-200 rounded-none px-4 py-2.5 outline-none focus:border-obsidian" />
          <select value={method} onChange={(e) => setMethod(e.target.value)} data-testid="admin-refund-method" className="w-full border border-ink-200 rounded-none px-4 py-2.5 bg-white">
            <option value="STORE_CREDIT">Store Credit (registered users)</option>
            <option value="BANK_TRANSFER">Bank Transfer (manual)</option>
            <option value="SAFEPAY_ORIGINAL">Original Gateway (Safepay)</option>
          </select>
          {method === "BANK_TRANSFER" && <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Transfer reference" className="w-full border border-ink-200 rounded-none px-4 py-2.5 outline-none focus:border-obsidian" />}
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason" data-testid="admin-refund-reason" className="w-full border border-ink-200 rounded-none px-4 py-2.5 outline-none focus:border-obsidian" />
          <button onClick={submit} data-testid="admin-refund-submit" className="w-full bg-obsidian text-white font-display py-3 rounded-none hover:bg-fire transition-colors">Process Refund</button>
        </div>
      </motion.div>
    </div>
  );
}


function Returns() {
  const [data, setData] = useState({ returns: [], pagination: {}, stats: {} });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ page: 1, limit: 25, search: "", status: "all", reason: "all" });
  const [searchInput, setSearchInput] = useState("");
  const [viewReturn, setViewReturn] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams(query).toString();
      const res = await http.get(`/admin/returns?${q}`);
      setData(res.data.data);
    } catch (e) { toast.error("Failed to load returns"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery({ ...query, search: searchInput, page: 1 });
  };

  const STATS = [
    { label: "Total Returns", count: data.stats?.total || 0, color: "text-obsidian" },
    { label: "Pending", count: data.stats?.pending || 0, color: "text-fire" },
    { label: "Approved", count: data.stats?.approved || 0, color: "text-blue-600" },
    { label: "Rejected", count: data.stats?.rejected || 0, color: "text-ink-500" },
    { label: "Refunded", count: data.stats?.refunded || 0, color: "text-green-600" },
    { label: "Refund Amount", count: fmt(data.stats?.refund_amount || 0), color: "text-green-700" }
  ];

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-semibold ">Returns & Refunds</h1>
          <p className="text-sm text-ink-500">Manage customer return requests and refunds</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="bg-white p-4 border border-ink-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-ink-500  tracking-wider">{s.label}</span>
            <span className={`text-xl font-mono font-black mt-2 ${s.color}`}>{s.count}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'pending', 'approved', 'processing', 'refunded'].map(tab => (
          <button key={tab} onClick={() => setQuery({ ...query, status: tab, page: 1 })}
            className={`px-4 py-2 text-sm font-bold  transition-colors whitespace-nowrap ${query.status === tab ? 'bg-obsidian text-white' : 'bg-white text-ink-500 border border-ink-200 hover:bg-ink-50'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 border border-ink-200 mb-6 flex flex-col lg:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 relative w-full">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Search return ID, order ID, customer..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-ink-200 text-sm focus:border-obsidian focus:outline-none rounded-none font-mono" />
        </form>
        <div className="flex gap-2 w-full lg:w-auto">
          <select value={query.reason} onChange={(e) => setQuery({ ...query, reason: e.target.value, page: 1 })} className="border border-ink-200 px-3 py-2 text-sm focus:outline-none rounded-none bg-white">
            <option value="all">Reason: All</option>
            <option value="Wrong size">Wrong size</option>
            <option value="Damaged product">Damaged product</option>
            <option value="Defective">Defective</option>
            <option value="Wrong product">Wrong product</option>
            <option value="Changed mind">Changed mind</option>
            <option value="Other">Other</option>
          </select>
          <button onClick={() => { setSearchInput(""); setQuery({ page: 1, limit: 25, search: "", status: "all", reason: "all" }); }} className="text-sm font-bold text-ink-500 hover:text-fire  px-3 py-2">Reset</button>
        </div>
      </div>

      <div className="bg-white border border-ink-200 overflow-x-auto min-h-[400px]">
        {loading ? <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></div></div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-ink-100 font-mono text-[10px]  text-ink-500">
              <tr>
                <th className="p-3">Return</th>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Product</th>
                <th className="p-3">Reason</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">⋮</th>
              </tr>
            </thead>
            <tbody>
              {!data.returns || data.returns.length === 0 ? <tr><td colSpan="9" className="p-10 text-center text-ink-400">No returns found.</td></tr> : data.returns.map(r => (
                <tr key={r.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50 cursor-pointer" onClick={() => setViewReturn(r)}>
                  <td className="p-3 font-mono font-bold text-obsidian">{r.id.split('-')[0]}..</td>
                  <td className="p-3 font-mono">{r.order_number}</td>
                  <td className="p-3 font-bold">{r.customer_name}</td>
                  <td className="p-3 text-xs text-ink-500 truncate max-w-[150px]">{r.product_name ? `${r.product_name} (x${r.quantity})` : 'Entire Order'}</td>
                  <td className="p-3 text-xs">{r.reason}</td>
                  <td className="p-3 text-right font-mono font-bold">{fmt(r.refund_amount > 0 ? r.refund_amount : r.total_amount)}</td>
                  <td className="p-3">
                    {r.status === 'pending' && <span className="text-[10px] font-bold  px-2 py-0.5 bg-yellow-100 text-yellow-700">Pending</span>}
                    {r.status === 'approved' && <span className="text-[10px] font-bold  px-2 py-0.5 bg-blue-100 text-blue-700">Approved</span>}
                    {r.status === 'rejected' && <span className="text-[10px] font-bold  px-2 py-0.5 bg-ink-200 text-ink-600">Rejected</span>}
                    {r.status === 'processing' && <span className="text-[10px] font-bold  px-2 py-0.5 bg-purple-100 text-purple-700">Processing</span>}
                    {r.status === 'refunded' && <span className="text-[10px] font-bold  px-2 py-0.5 bg-green-100 text-green-700">Refunded</span>}
                  </td>
                  <td className="p-3 text-ink-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-center">
                    <button className="p-1 text-ink-400 hover:text-obsidian"><MoreVertical size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data.pagination?.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-ink-500">Showing page {data.pagination.page} of {data.pagination.totalPages}</div>
          <div className="flex gap-1">
            <button disabled={query.page === 1} onClick={() => setQuery({ ...query, page: query.page - 1 })} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Prev</button>
            <button disabled={query.page === data.pagination.totalPages} onClick={() => setQuery({ ...query, page: query.page + 1 })} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Next</button>
          </div>
        </div>
      )}

      {viewReturn && <ReturnDetailsDrawer returnId={viewReturn.id} onClose={() => setViewReturn(null)} onUpdate={() => { load(); }} />}
    </div>
  );
}

function ReturnDetailsDrawer({ returnId, onClose, onUpdate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refundAmount, setRefundAmount] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    http.get(`/admin/returns/${returnId}`).then((res) => {
      setData(res.data.data);
      setRefundAmount(res.data.data.refund_amount > 0 ? res.data.data.refund_amount : res.data.data.order?.total || 0);
      setLoading(false);
    });
  }, [returnId]);

  const processUpdate = async (status) => {
    setSaving(true);
    try {
      await http.patch(`/admin/returns/${returnId}`, { status, refund_amount: refundAmount, admin_note: adminNote });
      toast.success(`Return marked as ${status}`);
      onUpdate();
      onClose();
    } catch (e) {
      toast.error("Failed to update return");
    }
    setSaving(false);
  };

  if (!data && loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-8 h-8 border-4 border-obsidian border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.2 }}
        className="w-full max-w-2xl bg-ink-50 h-full overflow-y-auto flex flex-col shadow-2xl border-l border-ink-200" onClick={e => e.stopPropagation()}>

        <div className="bg-white border-b border-ink-200 p-6 flex justify-between items-start sticky top-0 z-10">
          <div>
            <h2 className="font-display font-semibold text-2xl ">Return Request</h2>
            <p className="text-sm font-mono text-ink-500 mt-1">Order {data.order_number}</p>
          </div>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6 flex-1">

          <div className="bg-white border border-ink-200 p-6 flex items-center justify-between">
            <span className="font-bold  text-ink-500 text-sm">Status:</span>
            {data.status === 'pending' && <span className="font-bold  px-3 py-1 bg-yellow-100 text-yellow-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-600"></div> Pending</span>}
            {data.status === 'approved' && <span className="font-bold  px-3 py-1 bg-blue-100 text-blue-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Approved</span>}
            {data.status === 'rejected' && <span className="font-bold  px-3 py-1 bg-ink-200 text-ink-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-ink-500"></div> Rejected</span>}
            {data.status === 'processing' && <span className="font-bold  px-3 py-1 bg-purple-100 text-purple-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-600"></div> Processing</span>}
            {data.status === 'refunded' && <span className="font-bold  px-3 py-1 bg-green-100 text-green-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-600"></div> Refunded</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-ink-200 p-4">
              <span className="block text-[10px] font-bold text-ink-400  mb-2">Customer</span>
              <p className="font-bold text-sm">{data.customer_name}</p>
              <p className="text-xs text-ink-500">{data.order?.email || data.customer_phone}</p>
            </div>
            <div className="bg-white border border-ink-200 p-4">
              <span className="block text-[10px] font-bold text-ink-400  mb-2">Product</span>
              <p className="font-bold text-sm">{data.product_name || "Entire Order"}</p>
              {data.product_id && <p className="text-xs text-ink-500">Qty: {data.quantity}</p>}
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6">
            <span className="block text-[10px] font-bold text-ink-400  mb-2">Customer Reason</span>
            <p className="text-sm font-semibold">{data.reason}</p>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Return Timeline</h3>
            <div className="space-y-4 pl-2">
              <div className="relative pl-6 border-l-2 border-green-500 pb-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white"><Check size={10} /></div>
                <p className="text-sm font-bold">Return requested</p>
                <p className="text-xs text-ink-400">{new Date(data.created_at).toLocaleString()}</p>
              </div>

              <div className={`relative pl-6 border-l-2 pb-2 ${data.status !== 'pending' ? 'border-green-500' : 'border-ink-200'}`}>
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full flex items-center justify-center ${data.status !== 'pending' ? 'bg-green-500 text-white' : 'bg-ink-200 text-ink-400'}`}>{data.status !== 'pending' && <Check size={10} />}</div>
                <p className={`text-sm font-bold ${data.status !== 'pending' ? '' : 'text-ink-400'}`}>Admin decision ({data.status === 'rejected' ? 'Rejected' : 'Approved'})</p>
              </div>

              {(data.status === 'approved' || data.status === 'processing' || data.status === 'refunded') && (
                <div className={`relative pl-6 border-l-2 pb-2 ${data.status === 'processing' || data.status === 'refunded' ? 'border-green-500' : 'border-ink-200'}`}>
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full flex items-center justify-center ${data.status === 'processing' || data.status === 'refunded' ? 'bg-green-500 text-white' : 'bg-ink-200 text-ink-400'}`}>{data.status === 'processing' || data.status === 'refunded' ? <Check size={10} /> : null}</div>
                  <p className={`text-sm font-bold ${data.status === 'processing' || data.status === 'refunded' ? '' : 'text-ink-400'}`}>Product Received (Processing)</p>
                </div>
              )}

              {(data.status === 'approved' || data.status === 'processing' || data.status === 'refunded') && (
                <div className="relative pl-6">
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full flex items-center justify-center ${data.status === 'refunded' ? 'bg-green-500 text-white' : 'bg-ink-200 text-ink-400'}`}>{data.status === 'refunded' && <Check size={10} />}</div>
                  <p className={`text-sm font-bold ${data.status === 'refunded' ? '' : 'text-ink-400'}`}>Refund Processed</p>
                </div>
              )}
            </div>
          </div>

          {data.status === 'pending' && (
            <div className="bg-white border border-ink-200 p-6 space-y-4">
              <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Admin Decision</h3>
              <div>
                <label className="block text-xs font-bold text-ink-500  mb-1">Approved Refund Amount</label>
                <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-500  mb-1">Admin Note (Sent to customer)</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Reason for approval/rejection..." className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian min-h-[80px]"></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => processUpdate('rejected')} disabled={saving} className="flex-1 px-4 py-3 border border-ink-200 text-ink-600 font-bold  hover:bg-ink-50 disabled:opacity-50">Reject Return</button>
                <button onClick={() => processUpdate('approved')} disabled={saving} className="flex-1 px-4 py-3 bg-obsidian text-white font-bold  hover:bg-fire disabled:opacity-50 transition-colors">Approve Return</button>
              </div>
            </div>
          )}

          {data.status === 'approved' && (
            <div className="bg-white border border-ink-200 p-6">
              <p className="text-sm mb-4">The return has been approved. Waiting for the product to be received back from the customer.</p>
              <button onClick={() => processUpdate('processing')} disabled={saving} className="w-full px-4 py-3 bg-obsidian text-white font-bold  hover:bg-fire transition-colors disabled:opacity-50">Mark Product Received</button>
            </div>
          )}

          {data.status === 'processing' && (
            <div className="bg-white border border-ink-200 p-6 space-y-4">
              <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Process Refund</h3>

              <div className="p-4 bg-ink-50 border border-ink-200 mb-4">
                <div className="flex justify-between text-sm mb-2"><span className="text-ink-500">Refund Amount:</span><span className="font-mono font-bold">{fmt(refundAmount)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-ink-500">Refund Method:</span><span className="font-bold ">Original Payment</span></div>
              </div>

              <button onClick={() => processUpdate('refunded')} disabled={saving} className="w-full px-4 py-3 bg-green-600 text-white font-bold  hover:bg-green-700 transition-colors disabled:opacity-50">Process Refund</button>
            </div>
          )}

          {data.status === 'refunded' && (
            <div className="bg-green-50 border border-green-200 p-6 flex items-start gap-4">
              <CheckCircle size={24} className="text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-green-800 mb-1 ">Refund Processed</h4>
                <p className="text-sm text-green-700">Amount: <span className="font-mono">{fmt(data.refund_amount)}</span></p>
                <p className="text-xs text-green-600 mt-2">The refund has been successfully issued to the customer.</p>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}



function Refunds() {
  const [data, setData] = useState({ refunds: [], pagination: {}, stats: {}, chartData: [], donutData: [] });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ page: 1, limit: 25, search: "", status: "all", method: "all" });
  const [searchInput, setSearchInput] = useState("");
  const [viewRefund, setViewRefund] = useState(null);
  const [chartMode, setChartMode] = useState("amount"); // 'amount' or 'count'

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams(query).toString();
      const res = await http.get(`/admin/refunds?${q}`);
      setData(res.data.data);
    } catch (e) { toast.error("Failed to load refunds"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery({ ...query, search: searchInput, page: 1 });
  };

  const STATS = [
    { label: "Total Refunded", count: fmt(data.stats?.totalRefunded || 0), color: "text-green-700" },
    { label: "Pending Refunds", count: fmt(data.stats?.pendingAmount || 0), color: "text-fire", sub: `${data.stats?.pendingCount || 0} requests` },
    { label: "Completed", count: fmt(data.stats?.completedAmount || 0), color: "text-green-600", sub: `${data.stats?.completedCount || 0} refunds` },
    { label: "Failed", count: fmt(data.stats?.failedAmount || 0), color: "text-red-600", sub: `${data.stats?.failedCount || 0} transactions` },
    { label: "Avg Refund", count: fmt(data.stats?.avgRefund || 0), color: "text-obsidian" }
  ];

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-semibold ">Refunds</h1>
          <p className="text-sm text-ink-500">Track and manage customer refunds and financial transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="bg-white p-4 border border-ink-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-ink-500  tracking-wider">{s.label}</span>
            <span className={`text-xl font-mono font-black mt-2 ${s.color}`}>{s.count}</span>
            {s.sub && <span className="text-[10px] text-ink-400 mt-1">{s.sub}</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-ink-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500">Refund Overview (7D)</h3>
            <div className="flex bg-ink-50 border border-ink-200 rounded-none p-1">
              <button onClick={() => setChartMode('amount')} className={`px-3 py-1 text-xs font-bold  ${chartMode === 'amount' ? 'bg-white shadow border border-ink-100' : 'text-ink-500'}`}>Amount</button>
              <button onClick={() => setChartMode('count')} className={`px-3 py-1 text-xs font-bold  ${chartMode === 'count' ? 'bg-white shadow border border-ink-100' : 'text-ink-500'}`}>Count</button>
            </div>
          </div>
          <div className="h-64">
            {data.chartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData}>
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => chartMode === 'amount' ? `$${v}` : v} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 0, border: '1px solid #e5e5e5' }} />
                  <Line type="monotone" dataKey={chartMode} stroke="#171717" strokeWidth={2} dot={{ r: 3, fill: '#171717' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-ink-400">No data available</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-ink-200 p-6">
          <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 mb-6">Refund Status</h3>
          <div className="h-48">
            {data.donutData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                    {data.donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #e5e5e5' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-ink-400">No data available</div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.donutData?.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }}></div>
                <span className="font-bold">{d.name}</span>
                <span className="text-ink-400 ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border border-ink-200 mb-6 flex flex-col lg:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 relative w-full">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Search refund ID, order ID..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-ink-200 text-sm focus:border-obsidian focus:outline-none rounded-none font-mono" />
        </form>
        <div className="flex gap-2 w-full lg:w-auto">
          <select value={query.status} onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })} className="border border-ink-200 px-3 py-2 text-sm focus:outline-none rounded-none bg-white">
            <option value="all">Status: All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={query.method} onChange={(e) => setQuery({ ...query, method: e.target.value, page: 1 })} className="border border-ink-200 px-3 py-2 text-sm focus:outline-none rounded-none bg-white">
            <option value="all">Method: All</option>
            <option value="card">Card</option>
            <option value="cod">COD</option>
            <option value="wallet">Wallet</option>
          </select>
          <button onClick={() => { setSearchInput(""); setQuery({ page: 1, limit: 25, search: "", status: "all", method: "all" }); }} className="text-sm font-bold text-ink-500 hover:text-fire  px-3 py-2">Reset</button>
        </div>
      </div>

      <div className="bg-white border border-ink-200 overflow-x-auto min-h-[400px]">
        {loading ? <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></div></div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-ink-100 font-mono text-[10px]  text-ink-500">
              <tr>
                <th className="p-3">Refund ID</th>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Method</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">⋮</th>
              </tr>
            </thead>
            <tbody>
              {!data.refunds || data.refunds.length === 0 ? <tr><td colSpan="8" className="p-10 text-center text-ink-400">No refunds found.</td></tr> : data.refunds.map(r => (
                <tr key={r.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50 cursor-pointer" onClick={() => setViewRefund(r.id)}>
                  <td className="p-3 font-mono font-bold text-obsidian">{r.id.split('-')[0]}..</td>
                  <td className="p-3 font-mono">{r.order_number}</td>
                  <td className="p-3 font-bold">{r.customer_name}</td>
                  <td className="p-3 text-right font-mono font-bold">{fmt(r.amount)}</td>
                  <td className="p-3 text-xs ">{r.method}</td>
                  <td className="p-3">
                    {r.status === 'pending' && <span className="text-[10px] font-bold  px-2 py-0.5 bg-yellow-100 text-yellow-700">Pending</span>}
                    {r.status === 'processing' && <span className="text-[10px] font-bold  px-2 py-0.5 bg-purple-100 text-purple-700">Processing</span>}
                    {r.status === 'completed' && <span className="text-[10px] font-bold  px-2 py-0.5 bg-green-100 text-green-700">Completed</span>}
                    {r.status === 'failed' && <span className="text-[10px] font-bold  px-2 py-0.5 bg-red-100 text-red-700">Failed</span>}
                    {r.status === 'cancelled' && <span className="text-[10px] font-bold  px-2 py-0.5 bg-ink-200 text-ink-600">Cancelled</span>}
                  </td>
                  <td className="p-3 text-ink-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-center">
                    <button className="p-1 text-ink-400 hover:text-obsidian"><MoreVertical size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewRefund && <RefundDetailsDrawer refundId={viewRefund} onClose={() => setViewRefund(null)} onUpdate={() => load()} />}
    </div>
  );
}

function RefundDetailsDrawer({ refundId, onClose, onUpdate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    http.get(`/admin/refunds/${refundId}`).then((res) => {
      setData(res.data.data);
      setLoading(false);
    });
  }, [refundId]);

  const processRetry = async () => {
    setSaving(true);
    try {
      await http.patch(`/admin/refunds/${refundId}`, { status: 'completed' }); // mock success retry
      toast.success("Refund successfully processed");
      onUpdate();
      onClose();
    } catch (e) { toast.error("Failed to process refund"); }
    setSaving(false);
  };

  const processCancel = async () => {
    setSaving(true);
    try {
      await http.patch(`/admin/refunds/${refundId}`, { status: 'cancelled' });
      toast.success("Refund cancelled");
      onUpdate();
      onClose();
    } catch (e) { toast.error("Failed to cancel refund"); }
    setSaving(false);
  };

  if (!data && loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-8 h-8 border-4 border-obsidian border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.2 }}
        className="w-full max-w-2xl bg-ink-50 h-full overflow-y-auto flex flex-col shadow-2xl border-l border-ink-200" onClick={e => e.stopPropagation()}>

        <div className="bg-white border-b border-ink-200 p-6 flex justify-between items-start sticky top-0 z-10">
          <div>
            <h2 className="font-mono font-bold text-xl  text-ink-500 mb-1">Refund #{data.id.split('-')[0]}</h2>
            <div className="flex items-center gap-3">
              <span className="font-display font-black text-4xl">{fmt(data.amount)}</span>
              {data.status === 'pending' && <span className="font-bold  px-3 py-1 bg-yellow-100 text-yellow-700">Pending</span>}
              {data.status === 'processing' && <span className="font-bold  px-3 py-1 bg-purple-100 text-purple-700">Processing</span>}
              {data.status === 'completed' && <span className="font-bold  px-3 py-1 bg-green-100 text-green-700">Completed</span>}
              {data.status === 'failed' && <span className="font-bold  px-3 py-1 bg-red-100 text-red-700">Failed</span>}
              {data.status === 'cancelled' && <span className="font-bold  px-3 py-1 bg-ink-200 text-ink-600">Cancelled</span>}
            </div>
            {data.processed_at && <p className="text-xs text-ink-500 font-mono mt-2">Processed {new Date(data.processed_at).toLocaleString()}</p>}
          </div>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6 flex-1">

          <div className="bg-white border border-ink-200 p-6 grid grid-cols-2 gap-y-4">
            <div>
              <span className="block text-[10px] font-bold text-ink-400  mb-1">Customer</span>
              <p className="font-bold text-sm">{data.customer_name}</p>
              <p className="text-xs text-ink-500">{data.order?.email}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-ink-400  mb-1">Order</span>
              <p className="font-bold font-mono text-sm">{data.order_number}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-ink-400  mb-1">Refund Reason</span>
              <p className="text-sm">{data.reason}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-ink-400  mb-1">Payment Method</span>
              <p className="font-bold  text-sm">{data.method}</p>
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Refund Breakdown</h3>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between text-ink-500"><span>Original Order Total</span><span>{fmt(data.order?.total || 0)}</span></div>
              <div className="flex justify-between text-ink-500"><span>Previously Refunded</span><span>{fmt(data.previously_refunded || 0)}</span></div>
              <div className="flex justify-between font-bold text-fire text-base pt-2 border-t border-ink-100"><span>Current Refund</span><span>-{fmt(data.amount)}</span></div>
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Payment Information</h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between text-ink-500"><span>Provider</span><span className="">{data.method === 'card' ? 'Stripe' : data.method}</span></div>
              <div className="flex justify-between text-ink-500"><span>Original Transaction</span><span>{data.order?.payment_session_id || '—'}</span></div>
              <div className="flex justify-between text-ink-500"><span>Refund Transaction</span><span>{data.external_ref || '—'}</span></div>
            </div>
            {data.failure_reason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                <strong>Failure Reason:</strong> {data.failure_reason}
              </div>
            )}
          </div>

          {(data.status === 'pending' || data.status === 'failed') && (
            <div className="flex gap-3 pt-4">
              <button onClick={processCancel} disabled={saving} className="flex-1 px-4 py-3 border border-ink-200 text-ink-600 font-bold  hover:bg-ink-50 disabled:opacity-50">Cancel</button>
              <button onClick={processRetry} disabled={saving} className="flex-[2] px-4 py-3 bg-obsidian text-white font-bold  hover:bg-fire disabled:opacity-50 transition-colors">
                {data.status === 'failed' ? 'Retry Refund' : 'Process Refund'}
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}


function Cms({ setTab }) {
  const [activeTab, setActiveTab] = useState('homepage');

  const CMS_TABS = [
    { id: 'homepage', label: 'Homepage', icon: Home },
    { id: 'announcement', label: 'Announcement Bar', icon: Megaphone },
    { id: 'hero', label: 'Hero Slides', icon: ImageIcon },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'brands', label: 'Brands', icon: Box },
    { id: 'product_sections', label: 'Product Sections', icon: Layers },
    { id: 'promo', label: 'Promo Banners', icon: Ticket },
    { id: 'flash_sale', label: 'Flash Sale', icon: Zap },
    { id: 'testimonials', label: 'Testimonials', icon: Star },
    { id: 'pages', label: 'Pages', icon: FileText },
    { id: 'seo', label: 'SEO', icon: SearchIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'homepage': return <HomepageCMS setActiveTab={setActiveTab} />;
      case 'announcement': return <StoreSettings />; // We can reuse StoreSettings or create a new one later
      case 'hero': return <HeroSlidesCMS />;
      case 'categories': return <CategoriesCMS />;
      case 'brands': return <BrandsCMS />;
      case 'product_sections': return <ProductSectionsCMS />;
      case 'promo': return <PromoBannersCMS />;
      case 'flash_sale': return <FlashSaleCMS />;
      case 'testimonials': return <TestimonialsCMS />;
      case 'pages': return <PagesCMS />;
      case 'seo': return <SeoCMS />;
      default: return <HomepageCMS setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen w-full">
      <div className="w-64 bg-ink-50 border-r border-ink-200 overflow-y-auto flex flex-col">
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-obsidian tracking-tight">Storefront CMS</h2>
          </div>
          <button onClick={() => setTab("overview")} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold  border border-ink-200 bg-white hover:bg-obsidian hover:text-white transition-colors mb-6">
            &larr; Go to Dashboard
          </button>
          <nav className="space-y-1">
            {CMS_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === tab.id ? 'bg-white text-fire border border-ink-200 shadow-sm' : 'text-ink-500 hover:text-obsidian hover:bg-ink-100/50 border border-transparent'
                    }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="flex-1 p-8 overflow-y-auto bg-white">
        {renderContent()}
      </div>
    </div>
  );
}


function Customers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = searchParams.get("userId") || searchParams.get("customerId");

  const urlSearch = searchParams.get("search") || "";
  const [data, setData] = useState({ users: [], pagination: {}, stats: {} });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ page: 1, limit: 25, search: urlSearch, status: "all" });
  const [searchInput, setSearchInput] = useState(urlSearch);

  useEffect(() => {
    const s = searchParams.get("search") || "";
    if (s !== query.search) {
      setSearchInput(s);
      setQuery(prev => ({ ...prev, search: s, page: 1 }));
    }
  }, [searchParams.get("search")]);
  const [selected, setSelected] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const openCustomer = (u) => {
    const next = new URLSearchParams(searchParams);
    next.set("userId", u.id || u);
    setSearchParams(next);
  };

  const closeCustomer = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("userId");
    next.delete("customerId");
    setSearchParams(next);
  };

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams(query).toString();
      const res = await http.get(`/admin/users?${q}`);
      setData(res.data.data);
    } catch (e) { toast.error("Failed to load customers"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery({ ...query, search: searchInput, page: 1 });
  };

  const selectAll = (e) => {
    if (e.target.checked) setSelected(data.users?.map(u => u.id) || []);
    else setSelected([]);
  };

  const toggleSelect = (id) => {
    if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
    else setSelected([...selected, id]);
  };

  const bulkUpdate = (action) => {
    const isBlock = action === 'block';
    setConfirmModal({
      isOpen: true,
      title: `${isBlock ? 'Block' : 'Update'} ${selected.length} customers?`,
      message: `Are you sure you want to ${action} ${selected.length} selected customer accounts?`,
      confirmText: isBlock ? 'Block Customers' : 'Confirm Action',
      variant: isBlock ? 'danger' : 'primary',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await http.patch("/admin/users/bulk", { userIds: selected, action });
          toast.success(`Bulk action completed`);
          setSelected([]);
          setConfirmModal({ isOpen: false });
          load();
        } catch (e) {
          toast.error("Action failed");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const STATS = [
    { label: "Total Customers", count: data.stats?.total || 0, color: "text-gray-900 dark:text-zinc-100" },
    { label: "New Buyers", count: data.stats?.new || 0, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Active Shoppers", count: data.stats?.active || 0, color: "text-blue-600 dark:text-blue-400" },
    { label: "Blocked Accounts", count: data.stats?.blocked || 0, color: "text-rose-500" },
    { label: "Lifetime Orders", count: data.stats?.orders || 0, color: "text-gray-900 dark:text-zinc-100" },
  ];

  // Full-page workbench view if a customer is selected
  if (userId) {
    return (
      <CustomerDetailPage
        userId={userId}
        onBack={closeCustomer}
        onUpdate={load}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-black text-gray-900 dark:text-zinc-100 flex items-center gap-3">
            Customer Accounts
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-fire/10 text-fire border border-fire/20">
              {data.pagination?.totalCount || 0} Registered
            </span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Manage shopper accounts, review full purchase history, order volumes, addresses, and access status.
          </p>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{s.label}</span>
            <span className={`text-2xl font-mono font-black mt-2 ${s.color}`}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="flex-1 relative w-full sm:max-w-md">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone number..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:border-fire"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={query.status}
            onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })}
            className="px-3.5 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-fire"
          >
            <option value="all">Status: All Shoppers</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked Accounts</option>
          </select>

          {selected.length > 0 && (
            <div className="flex items-center gap-1.5 animate-in fade-in duration-100">
              <button
                onClick={() => bulkUpdate('block')}
                className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
              >
                Block ({selected.length})
              </button>
              <button
                onClick={() => bulkUpdate('unblock')}
                className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-900 transition-colors cursor-pointer"
              >
                Unblock ({selected.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-gray-400">
            <Loader2 size={28} className="animate-spin text-fire" />
            <span className="font-mono text-xs">Loading customer directory...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-800/50 text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="p-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === data.users?.length && data.users?.length > 0}
                      onChange={selectAll}
                      className="accent-fire rounded cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5 text-center">Orders</th>
                  <th className="p-3.5">Lifetime Spent</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Joined</th>
                  <th className="p-3.5 text-center w-14">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                {!data.users || data.users.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-12 text-center text-gray-400 dark:text-zinc-500 font-mono">
                      No customer accounts found matching current query.
                    </td>
                  </tr>
                ) : (
                  data.users.map(u => (
                    <tr
                      key={u.id}
                      onClick={() => openCustomer(u)}
                      className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.includes(u.id)}
                          onChange={() => toggleSelect(u.id)}
                          className="accent-fire rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {u.picture ? (
                            <img src={u.picture} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-zinc-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {u.name ? u.name[0].toUpperCase() : 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 dark:text-zinc-100 group-hover:text-fire transition-colors block truncate">
                              {u.name}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 block truncate font-mono">
                              ID: {u.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-gray-600 dark:text-zinc-400">
                        <span className="block font-mono text-[11px] truncate max-w-[180px]">{u.email}</span>
                        {u.phone && <span className="block text-[10px] text-gray-400 font-mono">{u.phone}</span>}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-gray-900 dark:text-zinc-100">
                        {u.orders_count || 0}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-gray-900 dark:text-zinc-100">
                        {fmt(u.total_spent || 0)}
                      </td>
                      <td className="p-3.5">
                        {u.is_blocked ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                            Blocked
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-gray-500 dark:text-zinc-400 font-mono">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      {/* Three-dots menu (opens on CLICK, NOT hover, with crisp dark mode) */}
                      <td className="p-3.5 text-center relative" onClick={e => e.stopPropagation()}>
                        <TableActionDropdown
                          isOpen={activeMenuId === u.id}
                          onToggle={() => setActiveMenuId(activeMenuId === u.id ? null : u.id)}
                          onClose={() => setActiveMenuId(null)}
                        >
                          <button
                            onClick={() => { setActiveMenuId(null); openCustomer(u); }}
                            className="w-full px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Eye size={14} className="text-gray-400" /> View Customer Page
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setSelected([u.id]);
                              bulkUpdate(u.is_blocked ? 'unblock' : 'block');
                            }}
                            className="w-full px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} /> {u.is_blocked ? 'Unblock Account' : 'Block Customer'}
                          </button>
                        </TableActionDropdown>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data.pagination?.totalPages > 1 && (
        <div className="flex justify-between items-center text-xs">
          <div className="text-gray-500 dark:text-zinc-400 font-mono">
            Showing <strong className="text-gray-900 dark:text-zinc-100">{(query.page - 1) * query.limit + 1}</strong> to <strong className="text-gray-900 dark:text-zinc-100">{Math.min(query.page * query.limit, data.pagination.totalCount)}</strong> of <strong className="text-gray-900 dark:text-zinc-100">{data.pagination.totalCount}</strong> shoppers
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={query.page === 1}
              onClick={() => setQuery({ ...query, page: query.page - 1 })}
              className="px-3 py-1.5 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              Prev
            </button>
            <button
              disabled={query.page === data.pagination.totalPages}
              onClick={() => setQuery({ ...query, page: query.page + 1 })}
              className="px-3 py-1.5 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText="Cancel"
        variant={confirmModal.variant || "danger"}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}

/* =========================================================================
   DEDICATED FULL-PAGE COMPONENT: CustomerDetailPage
   Enterprise customer workbench. NO MODALS.
   Shows full customer dossier and ALL orders of that user.
   ========================================================================= */

function CustomerDetailPage({ userId, onBack, onUpdate }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const loadUser = async () => {
    setLoading(true);
    try {
      const res = await http.get(`/admin/users/${userId}`);
      setUser(res.data?.data);
    } catch {
      toast.error("Failed to load customer profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadUser();
  }, [userId]);

  const toggleBlockStatus = () => {
    if (!user) return;
    const willBlock = !user.is_blocked;
    setConfirmModal({
      isOpen: true,
      title: willBlock ? `Block ${user.name}?` : `Unblock ${user.name}?`,
      message: willBlock
        ? "This customer will be prevented from placing future orders through the storefront."
        : "This customer account will be restored to active standing.",
      confirmText: willBlock ? "Block Customer" : "Unblock Account",
      variant: willBlock ? "danger" : "primary",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await http.patch("/admin/users/bulk", { userIds: [user.id], action: willBlock ? 'block' : 'unblock' });
          toast.success(willBlock ? "Customer blocked" : "Customer unblocked");
          setConfirmModal({ isOpen: false });
          loadUser();
          if (onUpdate) onUpdate();
        } catch {
          toast.error("Failed to update customer status");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  if (loading && !user) {
    return (
      <div className="pb-12 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 font-bold text-xs rounded-xl border border-gray-300 dark:border-zinc-700 shadow-xs cursor-pointer">
            <ArrowLeft size={16} /> Back to Customers
          </button>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-fire" />
          <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">Loading customer profile & complete order ledgers...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-gray-500">Customer record not found.</p>
        <button onClick={onBack} className="px-4 py-2 bg-fire text-white font-bold text-xs rounded-xl cursor-pointer">
          Back to Directory
        </button>
      </div>
    );
  }

  const allOrders = user.orders || [];
  const filteredOrders = allOrders.filter(o => {
    const matchesSearch = !orderSearch ||
      o.order_number?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.items?.some(it => it.product?.name?.toLowerCase().includes(orderSearch.toLowerCase()) || it.product_name?.toLowerCase().includes(orderSearch.toLowerCase()));
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="pb-12 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-900 dark:text-zinc-100 font-bold text-xs rounded-xl border border-gray-300 dark:border-zinc-700 shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Customers
          </button>
          <span className="text-gray-300 dark:text-zinc-700 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-mono font-bold text-gray-500 dark:text-zinc-400 hidden sm:inline">Customers</span>
          <span className="text-gray-300 dark:text-zinc-700 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-mono font-black text-gray-900 dark:text-zinc-100 hidden sm:inline">
            {user.name}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {user.phone && (
            <a
              href={waLink(user.phone, `Hi ${user.name}, reaching out regarding your SoleKicks profile.`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs transition-colors"
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
          )}
          {user.email && (
            <a
              href={`mailto:${user.email}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-bold text-xs rounded-xl border border-gray-200 dark:border-zinc-700 shadow-xs transition-colors"
            >
              <ExternalLink size={14} /> Email
            </a>
          )}
          <button
            type="button"
            onClick={toggleBlockStatus}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-xl border shadow-xs transition-colors cursor-pointer ${user.is_blocked
                ? "bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900"
              }`}
          >
            <Trash2 size={14} /> {user.is_blocked ? "Unblock Account" : "Block Customer"}
          </button>
        </div>
      </div>

      {/* 4-Metric Commercial Dossier Ribbon */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Total Lifetime Spend</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono text-xl font-black text-gray-900 dark:text-zinc-100">
              {fmt(user.total_spent || 0)}
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 inline-block">
            Across valid completed orders
          </span>
        </div>

        <div>
          <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Total Orders</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono text-xl font-black text-gray-900 dark:text-zinc-100">
              {allOrders.length}
            </span>
            <span className="text-xs text-gray-400 ml-1">orders placed</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 inline-block">
            {allOrders.filter(o => o.status === 'delivered').length} delivered successfully
          </span>
        </div>

        <div>
          <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Average Order Value</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-xl font-black text-gray-900 dark:text-zinc-100">
              {fmt(user.avg_order || 0)}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 inline-block">
            Per completed checkout
          </span>
        </div>

        <div>
          <span className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">Account Standing</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${user.is_blocked ? "bg-rose-500" : "bg-emerald-500"}`} />
            <span className={`font-mono font-black text-sm uppercase ${user.is_blocked ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {user.is_blocked ? "Blocked" : "Active Shopper"}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 inline-block">
            Member since {new Date(user.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Two-Column Workbench Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column (4 cols): Profile & Saved Addresses */}
        <div className="lg:col-span-4 space-y-6">

          {/* Profile Card */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h3 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                <Users size={15} className="text-fire" /> Customer Dossier
              </h3>
              <span className="text-[10px] font-mono text-gray-400 uppercase">{user.role || 'customer'}</span>
            </div>

            <div className="flex items-center gap-3.5 pt-1">
              {user.picture ? (
                <img src={user.picture} className="w-14 h-14 rounded-2xl object-cover border border-gray-200 dark:border-zinc-700 shrink-0" alt="" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gray-900 dark:bg-zinc-800 text-white flex items-center justify-center font-display font-black text-xl shrink-0">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-display font-black text-base text-gray-900 dark:text-zinc-100 truncate">
                  {user.name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400 font-mono truncate">{user.email}</p>
                {user.phone && <p className="text-xs text-fire font-mono font-bold mt-0.5">{user.phone}</p>}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-zinc-800/60">
                <span className="text-gray-400">User ID</span>
                <span className="font-mono text-gray-700 dark:text-zinc-300 font-bold text-[11px] truncate max-w-[160px]">{user.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-zinc-800/60">
                <span className="text-gray-400">Registration Date</span>
                <span className="font-mono text-gray-700 dark:text-zinc-300 font-bold">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Verified Email</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Yes</span>
              </div>
            </div>
          </div>

          {/* Saved Addresses Card */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h3 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                <MapPin size={15} className="text-fire" /> Saved Addresses
              </h3>
              <span className="text-[10px] font-mono text-gray-400">{user.addresses?.length || 0} Saved</span>
            </div>

            <div className="space-y-3">
              {!user.addresses || user.addresses.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No saved shipping addresses found.</p>
              ) : (
                user.addresses.map((addr, idx) => (
                  <div key={addr.id || idx} className="p-3.5 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-700/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-zinc-100">
                        {addr.first_name || addr.full_name ? `${addr.first_name || ''} ${addr.last_name || ''}`.trim() || addr.full_name : user.name}
                      </span>
                      {addr.is_default && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-zinc-400">{addr.address_line1 || addr.address_l1}</p>
                    {(addr.address_line2 || addr.address_l2) && (
                      <p className="text-gray-600 dark:text-zinc-400">{addr.address_line2 || addr.address_l2}</p>
                    )}
                    <p className="text-gray-600 dark:text-zinc-400 font-bold">{addr.city}, {addr.province} {addr.postal_code}</p>
                    {addr.phone && <p className="text-[11px] font-mono text-gray-400 pt-1">Tel: {addr.phone}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column (8 cols): Complete Order History (ALL Orders of this user) */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                <ShoppingBag size={15} className="text-fire" />
                Customer Order History ({allOrders.length} Orders)
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Every order placed by this customer across storefront & admin POS</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search orders..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="px-3 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs placeholder-gray-400 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-gray-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="delivered">Delivered</option>
                <option value="shipped">Shipped</option>
                <option value="packed">Packed</option>
                <option value="confirmed">Confirmed</option>
                <option value="placed">Placed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                <Package size={28} className="mx-auto mb-2 opacity-40 text-fire" />
                <p className="font-bold">No orders found matching filter criteria</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-800 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                    <th className="pb-2.5">Order Ref</th>
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Sneakers Ordered</th>
                    <th className="pb-2.5">Total</th>
                    <th className="pb-2.5">Payment</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/60 font-mono">
                  {filteredOrders.map(o => (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/admin?tab=orders&orderId=${o.order_number || o.id}`)}
                      className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 font-bold text-gray-900 dark:text-zinc-100 group-hover:text-fire transition-colors">
                        #{o.order_number}
                      </td>
                      <td className="py-3 text-[11px] text-gray-500 dark:text-zinc-400">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-sans">
                        <div className="space-y-1">
                          {o.items?.map((it, iIdx) => (
                            <div key={it.id || iIdx} className="flex items-center gap-2">
                              {it.product?.images?.[0] ? (
                                <img src={it.product.images[0]} alt="" className="w-6 h-6 rounded-md object-cover bg-gray-100 shrink-0" />
                              ) : (
                                <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                  <Box size={10} className="text-gray-400" />
                                </div>
                              )}
                              <span className="font-bold text-gray-900 dark:text-zinc-100 truncate max-w-[160px] block text-[11px]">
                                {it.product?.name || it.product_name}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                (x{it.quantity}{it.size ? ` • ${it.size}` : ''})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 font-bold text-gray-900 dark:text-zinc-100">
                        {fmt(o.total)}
                      </td>
                      <td className="py-3 font-sans">
                        <span className="text-[10px] font-bold uppercase text-gray-700 dark:text-zinc-300 block">
                          {o.payment_method}
                        </span>
                        <span className={`text-[9px] font-mono font-bold ${o.payment_status === 'paid' ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="py-3 font-sans">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${o.status === 'delivered'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                            : o.status === 'shipped' || o.status === 'out_for_delivery'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900'
                              : o.status === 'cancelled' || o.status === 'returned'
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                          }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin?tab=orders&orderId=${o.order_number || o.id}`);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-fire hover:text-fire-hover hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText="Cancel"
        variant={confirmModal.variant || "danger"}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}

function StoreSettings() {
  const [f, setF] = useState({ flash_sale_active: false, flash_sale_end_time: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    http.get("/settings").then(({ data }) => {
      const s = data.data;
      setF({
        flash_sale_active: s.flash_sale_active || false,
        flash_sale_end_time: s.flash_sale_end_time ? new Date(s.flash_sale_end_time).toISOString().slice(0, 16) : ""
      });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await http.patch("/admin/settings", {
        flash_sale_active: f.flash_sale_active,
        flash_sale_end_time: f.flash_sale_end_time ? new Date(f.flash_sale_end_time).toISOString() : null
      });
      toast.success("Settings updated");
    } catch { toast.error("Failed to save settings"); }
    setSaving(false);
  };

  return (
    <div>
      <h1 className="font-display tracking-tight mb-6">Global Settings</h1>
      <div className="bg-white border border-ink-200 p-6 max-w-2xl">
        <h3 className="font-display mb-4 text-fire">Flash Sale Setup</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={f.flash_sale_active} onChange={(e) => setF({ ...f, flash_sale_active: e.target.checked })} className="accent-fire w-4 h-4" />
            <span className="font-bold">Enable Global Flash Sale Timer</span>
          </label>
          {f.flash_sale_active && (
            <div>
              <label className="block text-xs font-mono  tracking-widest text-ink-400 mb-1.5">End Time</label>
              <input type="datetime-local" value={f.flash_sale_end_time} onChange={(e) => setF({ ...f, flash_sale_end_time: e.target.value })} className="border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
            </div>
          )}
        </div>
      </div>
      <div className="bg-ink-50 border-t border-ink-200 p-8 flex justify-end sticky bottom-0 z-10">
        <button onClick={save} disabled={saving} className="bg-obsidian text-white font-bold  px-6 py-2.5 hover:bg-fire transition-colors disabled:opacity-70 disabled:cursor-wait flex items-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : null} Save Settings
        </button>
      </div>
    </div>
  );
}

function CategoriesManager() {
  const [cats, setCats] = useState([]);
  const [f, setF] = useState({ name: "", slug: "", hero_banner_url: "", hero_video_url: "" });
  const load = () => http.get("/admin/categories").then(({ data }) => setCats(data.data));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!f.name) return toast.error("Name required");
    await http.post("/admin/categories", { ...f, sort_order: cats.length });
    toast.success("Category added"); setF({ name: "", slug: "", hero_banner_url: "", hero_video_url: "" }); load();
  };
  const del = async (id) => { await http.delete(`/admin/categories/${id}`); load(); };

  return (
    <div>
      <h1 className="font-display tracking-tight mb-6">Categories</h1>
      <div className="bg-white rounded-none border border-ink-200 p-5 mb-6 space-y-3 max-w-2xl">
        <h3 className="font-display text-sm">Add Category</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input placeholder="Name (e.g. Retro High)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="border border-ink-200 rounded-none px-4 py-2.5 outline-none" />
          <input placeholder="Slug (optional)" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} className="border border-ink-200 rounded-none px-4 py-2.5 outline-none" />
        </div>
        <AdminImageInput value={f.hero_banner_url} onChange={(v) => setF({ ...f, hero_banner_url: v })} testid="admin-cat-banner" />
        <input placeholder="Background Video URL (.mp4)" value={f.hero_video_url} onChange={(e) => setF({ ...f, hero_video_url: e.target.value })} className="w-full border border-ink-200 rounded-none px-4 py-2.5 outline-none" />
        <button onClick={add} className="bg-obsidian text-white font-display px-6 py-3 rounded-none hover:bg-fire transition-colors">Add Category</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cats.map((c) => (
          <div key={c.id} className="bg-white border border-ink-200 p-4 relative">
            <h4 className="font-display tracking-tight">{c.name}</h4>
            <p className="font-mono text-xs text-ink-400 mb-2">/{c.slug}</p>
            {c.hero_banner_url && <img src={c.hero_banner_url} alt="" className="h-16 w-full object-cover mb-1 bg-ink-100" />}
            {c.hero_video_url && <span className="text-[10px] bg-fire/10 text-fire px-2 py-0.5 rounded font-bold ">Has Video</span>}
            <button onClick={() => del(c.id)} className="absolute top-4 right-4 text-ink-400 hover:text-fire"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CodTracking() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("pending");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    http.get(`/admin/cod-remittance?status=${status}`)
      .then(({ data }) => setOrders(data.data.orders))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [status]);

  const toggleAll = () => {
    if (selected.length === orders.length) setSelected([]);
    else setSelected(orders.map(o => o.id));
  };

  const toggleOne = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const markRemitted = () => {
    if (!selected.length) return;
    const promise = http.patch('/admin/cod-remittance/bulk', { orderIds: selected, status: 'remitted' })
      .then(() => {
        setSelected([]);
        fetchOrders();
      });
    toast.promise(promise, {
      loading: "Updating status...",
      success: "Orders marked as remitted",
      error: "Failed to update status"
    });
  };

  return (
    <div className="pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display tracking-tight text-2xl font-semibold">COD Remittance Tracking</h1>
        <div className="flex gap-2">
          {status === 'pending' && selected.length > 0 && (
            <button onClick={markRemitted} className="px-4 py-2 bg-green-500 text-white font-bold text-sm flex items-center gap-2">
              <CheckCircle size={16} /> Mark {selected.length} as Remitted
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-ink-200">
        {['pending', 'remitted'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setSelected([]); }} className={`pb-3 px-2 font-bold text-sm capitalize ${status === s ? 'text-fire border-b-2 border-fire' : 'text-ink-400 hover:text-obsidian'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white border border-ink-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-ink-100 font-mono text-[10px] text-ink-500">
            <tr>
              {status === 'pending' && <th className="p-4 w-10"><input type="checkbox" checked={selected.length === orders.length && orders.length > 0} onChange={toggleAll} /></th>}
              <th className="p-4">Order</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Courier</th>
              <th className="p-4">Tracking AWB</th>
              <th className="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-ink-400" /></td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-ink-500">No {status} COD orders found.</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                {status === 'pending' && <td className="p-4"><input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggleOne(o.id)} /></td>}
                <td className="p-4 font-mono font-bold">{o.order_number}</td>
                <td className="p-4">{o.customer_name}</td>
                <td className="p-4"><span className="px-2 py-1 bg-ink-100 text-xs font-bold rounded-none">{o.courier_name || 'N/A'}</span></td>
                <td className="p-4 font-mono text-xs text-ink-500">{o.tracking_number || 'N/A'}</td>
                <td className="p-4 text-right font-display font-semibold">{fmt(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function InventoryManagement() {
  const [data, setData] = useState({ products: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ page: 1, limit: 50, search: "" });
  const [searchInput, setSearchInput] = useState("");
  const [updates, setUpdates] = useState({});

  const fetchInventory = () => {
    setLoading(true);
    const q = new URLSearchParams(query).toString();
    http.get(`/admin/inventory?${q}`)
      .then(({ data }) => setData(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInventory(); }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(prev => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleStockChange = (sizeId, val) => {
    setUpdates(prev => ({ ...prev, [sizeId]: val }));
  };

  const saveUpdates = async () => {
    const payload = Object.entries(updates).map(([id, stock]) => ({ id, stock }));
    if (payload.length === 0) return;

    const promise = http.patch('/admin/inventory/bulk', { updates: payload })
      .then(() => {
        setUpdates({});
        fetchInventory();
      });
    toast.promise(promise, {
      loading: "Saving inventory...",
      success: "Inventory updated",
      error: "Failed to update inventory"
    });
  };

  const pendingChanges = Object.keys(updates).length;

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-semibold">Inventory Tracking</h1>
          <p className="text-sm text-ink-500">Quickly view and update stock across all variants</p>
        </div>
        {pendingChanges > 0 && (
          <button onClick={saveUpdates} className="px-4 py-2 bg-obsidian text-white font-bold text-sm flex items-center gap-2 hover:bg-fire transition-colors shadow-lg animate-pulse">
            <CheckCircle size={16} /> Save {pendingChanges} Changes
          </button>
        )}
      </div>

      <div className="bg-white p-4 border border-ink-200 mb-6 flex gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 relative w-full lg:w-1/3">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Search product name..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-ink-200 text-sm focus:border-obsidian focus:outline-none rounded-none" />
        </form>
      </div>

      <div className="bg-white border border-ink-200 overflow-x-auto min-h-[500px]">
        {loading ? <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-ink-400" /></div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-ink-100 font-mono text-[10px] text-ink-500 uppercase">
              <tr>
                <th className="p-3 w-16">Image</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Status</th>
                <th className="p-3">Variants (Stock)</th>
              </tr>
            </thead>
            <tbody>
              {data.products.length === 0 ? <tr><td colSpan="4" className="p-10 text-center text-ink-400">No products found.</td></tr> : data.products.map(p => {
                const totalStock = p.sizes.reduce((sum, s) => sum + s.stock, 0);
                return (
                  <tr key={p.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                    <td className="p-3">
                      {p.images?.[0] ? <img src={imgUrl(p.images[0])} alt="" className="w-12 h-12 object-cover bg-ink-100 border border-ink-200" /> : <div className="w-12 h-12 bg-ink-100 border border-ink-200 flex items-center justify-center text-ink-300"><ImageIcon size={16} /></div>}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-obsidian">{p.name}</div>
                      <div className="text-xs text-ink-400 font-mono">Total Stock: {totalStock}</div>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-ink-200 text-ink-600'}`}>{p.status}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {p.sizes.map(s => {
                          const currentVal = updates[s.id] !== undefined ? updates[s.id] : s.stock;
                          const isLow = currentVal <= 5 && currentVal > 0;
                          const isOut = currentVal == 0;
                          const isChanged = updates[s.id] !== undefined;
                          return (
                            <div key={s.id} className={`flex items-center border ${isChanged ? 'border-fire shadow-sm' : isOut ? 'border-red-200 bg-red-50' : isLow ? 'border-orange-200 bg-orange-50' : 'border-ink-200 bg-white'}`}>
                              <span className="px-2 py-1 bg-ink-50 border-r border-ink-200 font-mono text-xs font-bold text-ink-600 w-10 text-center">{s.size}</span>
                              <input type="number" min="0" value={currentVal} onChange={(e) => handleStockChange(s.id, e.target.value)} className="w-14 px-2 py-1 text-sm font-mono focus:outline-none focus:bg-ink-100 bg-transparent text-center" />
                            </div>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {data.pagination?.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-ink-500">Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.totalCount} products)</div>
          <div className="flex gap-1">
            <button disabled={query.page === 1} onClick={() => setQuery({ ...query, page: query.page - 1 })} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Prev</button>
            <button disabled={query.page === data.pagination.totalPages} onClick={() => setQuery({ ...query, page: query.page + 1 })} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditLogs({ isDark }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await http.get("/admin/audit-logs");
      setLogs(res.data.data || []);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadgeClass = (action = "") => {
    const act = action.toUpperCase();
    if (act.startsWith("CREATE") || act.includes("ADD")) {
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40";
    }
    if (act.startsWith("DELETE") || act.includes("BLOCK") || act.includes("CANCEL")) {
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800/40";
    }
    if (act.includes("COURIER") || act.includes("BULK") || act.includes("REFUND")) {
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/40";
    }
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800/40";
  };

  const getEntityBadgeClass = (type = "") => {
    switch (type.toLowerCase()) {
      case "order": return "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800/40";
      case "product": return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40";
      case "customer": return "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400 border-teal-200 dark:border-teal-800/40";
      case "coupon": return "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 border-orange-200 dark:border-orange-800/40";
      case "settings": return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
      default: return "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 border-gray-200 dark:border-zinc-700";
    }
  };

  const entityTypes = [
    { id: "all", label: "All Activity" },
    { id: "order", label: "Orders" },
    { id: "product", label: "Products" },
    { id: "coupon", label: "Coupons" },
    { id: "customer", label: "Customers" },
    { id: "settings", label: "Settings" },
  ];

  const filteredLogs = logs.filter((log) => {
    if (activeType !== "all" && log.entity_type?.toLowerCase() !== activeType) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchOperator = log.admin_name?.toLowerCase().includes(q);
      const matchAction = log.action?.toLowerCase().includes(q);
      const matchEntityId = log.entity_id?.toLowerCase().includes(q);
      const matchEntityType = log.entity_type?.toLowerCase().includes(q);
      const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q);
      return matchOperator || matchAction || matchEntityId || matchEntityType || matchDetails;
    }
    return true;
  });

  const stats = {
    total: logs.length,
    orders: logs.filter(l => l.entity_type === 'order').length,
    products: logs.filter(l => l.entity_type === 'product').length,
    security: logs.filter(l => ['settings', 'customer'].includes(l.entity_type) || l.action?.includes('BLOCK')).length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-obsidian text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0 shadow-md">
            <Shield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Audit Trail</h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60">
                Live Ledger
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Tamper-evident operational log recording administrative changes, product mutations, and security updates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-obsidian dark:text-white" : ""} />
            {refreshing ? "Syncing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">Total Recorded Events</p>
          <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">Order Updates</p>
          <p className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">{stats.orders}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">Product Mutations</p>
          <p className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">{stats.products}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">Security & Settings</p>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{stats.security}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
        {/* Entity Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {entityTypes.map((tab) => {
            const count = tab.id === "all" ? logs.length : logs.filter(l => l.entity_type?.toLowerCase() === tab.id).length;
            const active = activeType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveType(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  active
                    ? "bg-obsidian text-white dark:bg-white dark:text-black shadow-sm font-semibold"
                    : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  active ? "bg-white/20 text-white dark:bg-black/20 dark:text-black font-mono" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 font-mono"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px] md:w-72 shrink-0">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, admin, ID, details..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 rounded-lg text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-obsidian dark:focus:ring-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="animate-spin text-obsidian dark:text-white" />
            <p className="text-xs text-gray-500 dark:text-zinc-400">Loading audit ledger...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-gray-400 dark:text-zinc-500">
              <FileText size={22} />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">No matching audit events</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              {search || activeType !== "all"
                ? "Try clearing your search query or selecting a different activity filter."
                : "No administrative actions have been recorded yet."}
            </p>
            {(search || activeType !== "all") && (
              <button
                onClick={() => { setSearch(""); setActiveType("all"); }}
                className="mt-4 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 dark:bg-zinc-800/60 border-b border-gray-200 dark:border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Details Summary</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                {filteredLogs.map((l) => {
                  const created = new Date(l.created_at);
                  const detailsKeys = Object.keys(l.details || {});
                  return (
                    <tr
                      key={l.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(l)}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-gray-900 dark:text-zinc-200">
                            {created.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          <span className="font-mono text-[11px] text-gray-400 dark:text-zinc-500">
                            {created.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                      </td>

                      {/* Operator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-[11px] text-zinc-700 dark:text-zinc-300">
                            {(l.admin_name || "A").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-zinc-100 block">
                              {l.admin_name || "System"}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
                              {l.admin_id ? `${l.admin_id.substring(0, 8)}...` : "system"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border ${getActionBadgeClass(l.action)}`}>
                          {l.action}
                        </span>
                      </td>

                      {/* Entity Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${getEntityBadgeClass(l.entity_type)}`}>
                          {l.entity_type}
                        </span>
                      </td>

                      {/* Entity ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-gray-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <span className="truncate max-w-[130px]" title={l.entity_id}>
                            {l.entity_id || "—"}
                          </span>
                          {l.entity_id && (
                            <button
                              onClick={() => copyToClipboard(l.entity_id, l.id)}
                              className="p-1 rounded text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                              title="Copy ID"
                            >
                              {copiedId === l.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Details Summary Preview */}
                      <td className="py-3.5 px-4 text-xs text-gray-600 dark:text-zinc-400 max-w-[260px]">
                        <div className="truncate font-mono text-[11px]" title={JSON.stringify(l.details)}>
                          {detailsKeys.length === 0 ? (
                            <span className="text-gray-400 dark:text-zinc-600">No additional payload</span>
                          ) : (
                            detailsKeys.slice(0, 3).map(k => `${k}: ${typeof l.details[k] === 'object' ? '...' : l.details[k]}`).join(" | ")
                          )}
                        </div>
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(l);
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Inspector Modal */}
      {selectedLog && (
        <div
          className={`${isDark ? 'dark' : ''} fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-150`}
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150 text-gray-900 dark:text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50/80 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-obsidian text-white dark:bg-zinc-800 dark:text-zinc-100 dark:border dark:border-zinc-700 flex items-center justify-center font-bold shadow-sm">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>Audit Record Inspector</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getActionBadgeClass(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 font-mono">
                    Event ID: {selectedLog.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs bg-white dark:bg-zinc-900">
              {/* Core Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-zinc-950/70 p-3.5 rounded-xl border border-gray-200 dark:border-zinc-800">
                <div>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">Operator</span>
                  <span className="font-semibold text-gray-900 dark:text-zinc-100 mt-0.5 block">{selectedLog.admin_name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">Entity Type</span>
                  <span className="font-semibold text-gray-900 dark:text-zinc-100 mt-0.5 block capitalize">{selectedLog.entity_type}</span>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">Entity ID</span>
                  <span className="font-mono text-gray-900 dark:text-zinc-200 mt-0.5 block truncate" title={selectedLog.entity_id}>
                    {selectedLog.entity_id || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">Date & Time</span>
                  <span className="font-mono text-gray-900 dark:text-zinc-200 mt-0.5 block">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* JSON Payload Viewer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Detailed Action Payload</span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(selectedLog.details, null, 2), "payload")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 transition-colors"
                  >
                    {copiedId === "payload" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    <span>{copiedId === "payload" ? "Copied" : "Copy JSON"}</span>
                  </button>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 bg-zinc-950 dark:bg-black text-zinc-100 p-4 font-mono text-[11px] leading-relaxed max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap break-all text-gray-200 dark:text-zinc-300">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-800 flex justify-end bg-gray-50/80 dark:bg-zinc-900">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 hover:bg-gray-300 dark:hover:bg-zinc-700 border border-transparent dark:border-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PosSystem() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: "Walk-in Customer", phone: "", email: "" });
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  useEffect(() => {
    http.get("/admin/products?limit=100").then(res => setProducts(res.data.data.products));
  }, []);

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product_id: product.id, name: product.name, price: product.base_price, size: product.sizes?.[0]?.size || "OS", quantity: 1 }]);
    }
  };

  const removeFromCart = (product_id) => {
    setCart(cart.filter(item => item.product_id !== product_id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const checkout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    try {
      await http.post("/admin/pos/checkout", { items: cart, customer: customerInfo, payment_method: paymentMethod, total: subtotal });
      toast.success("Order completed via POS");
      setCart([]);
      setCustomerInfo({ name: "Walk-in Customer", phone: "", email: "" });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Checkout failed");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
      <div className="flex-1 bg-white border border-ink-200 flex flex-col min-h-0">
        <div className="p-4 border-b border-ink-200">
          <input type="text" placeholder="Search products for POS..." value={search} onChange={e => setSearch(e.target.value)} className="w-full border border-ink-200 px-4 py-2 focus:outline-none focus:border-obsidian" />
        </div>
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 content-start">
          {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
            <div key={p.id} onClick={() => addToCart(p)} className="border border-ink-200 p-2 cursor-pointer hover:border-obsidian hover:shadow-md transition-all text-center">
              <img src={p.images?.[0] || 'https://via.placeholder.com/150'} className="w-full aspect-square object-cover mb-2" alt="" />
              <p className="text-xs font-bold truncate" title={p.name}>{p.name}</p>
              <p className="text-xs text-ink-500">{fmt(p.base_price)}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full lg:w-96 bg-white border border-ink-200 flex flex-col shrink-0 min-h-0">
        <div className="p-4 border-b border-ink-200 font-display font-semibold text-lg flex justify-between items-center">
          Current Sale
          <span className="bg-fire text-white text-xs px-2 py-1">{cart.length} items</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? <p className="text-ink-400 text-center text-sm mt-10">Cart is empty</p> : cart.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm border-b border-ink-100 pb-2">
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-xs text-ink-500">Qty: {item.quantity} | Size: {item.size}</p>
              </div>
              <div className="text-right">
                <p className="font-mono">{fmt(item.price * item.quantity)}</p>
                <button onClick={() => removeFromCart(item.product_id)} className="text-xs text-fire hover:underline">Remove</button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-ink-200 bg-ink-50 space-y-4">
          <div>
            <label className="text-xs font-bold text-ink-500 mb-1 block">Customer</label>
            <input type="text" placeholder="Customer Name" value={customerInfo.name} onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })} className="w-full border border-ink-200 px-3 py-1.5 text-sm mb-2 focus:outline-none" />
            <input type="text" placeholder="Phone Number" value={customerInfo.phone} onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })} className="w-full border border-ink-200 px-3 py-1.5 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-ink-500 mb-1 block">Payment</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border border-ink-200 px-3 py-2 text-sm focus:outline-none">
              <option value="CASH">Cash</option>
              <option value="CARD">Card Terminal</option>
            </select>
          </div>
          <div className="flex justify-between font-display text-xl font-bold pt-2 border-t border-ink-200">
            <span>Total</span>
            <span className="text-fire">{fmt(subtotal)}</span>
          </div>
          <button onClick={checkout} className="w-full bg-obsidian text-white py-3 font-bold hover:bg-fire transition-colors">COMPLETE CHECKOUT</button>
        </div>
      </div>
    </div>
  );
}

function AnalyticsChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 text-white rounded-xl p-3.5 shadow-2xl text-xs space-y-2 min-w-[210px] pointer-events-none animate-in fade-in zoom-in-95 duration-100">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5 mb-1">
        <span className="font-mono text-[11px] text-zinc-400 font-bold">{label}</span>
        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Metrics</span>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry, idx) => {
          const isOrders = entry.dataKey === "orders" || entry.name?.toLowerCase().includes("order");
          const formattedVal = isOrders ? `${entry.value} orders` : fmt(entry.value);
          const name = entry.name || (
            entry.dataKey === "revenue" ? "Gross Revenue" :
            entry.dataKey === "profit" ? "Net Profit" :
            entry.dataKey === "cogs" ? "COGS Basis" :
            entry.dataKey === "orders" ? "Orders Volume" : entry.dataKey
          );
          const dotColor = entry.color || entry.stroke || entry.fill || "#FF3B30";
          return (
            <div key={`tooltip-${idx}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: dotColor }} />
                <span className="font-bold text-zinc-200">{name}:</span>
              </div>
              <span className="font-mono font-black text-white shrink-0">{formattedVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfitabilityAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [activeChartMetric, setActiveChartMetric] = useState("dynamics"); // "dynamics" | "revenue" | "profit" | "orders"

  const RANGE_OPTIONS = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
    { id: "90d", label: "90 Days" },
    { id: "mtd", label: "This Month" },
    { id: "ytd", label: "This Year" },
    { id: "all", label: "All Time" },
  ];

  const load = async (selectedRange = range, sDate = customStart, eDate = customEnd) => {
    setLoading(true);
    try {
      let url = `/admin/analytics/profitability?range=${selectedRange}`;
      if (selectedRange === "custom" && sDate) {
        url += `&startDate=${sDate}&endDate=${eDate || ""}`;
      }
      const res = await http.get(url);
      setData(res.data.data);
    } catch {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (range !== "custom") {
      load(range);
    }
  }, [range]);

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!customStart) return toast.error("Please select a start date");
    setRange("custom");
    load("custom", customStart, customEnd);
  };

  const exportCSV = () => {
    if (!data) return;
    const headers = ["Metric", "Value", "Notes"];
    const rows = [
      ["Time Range", range.toUpperCase(), ""],
      ["Period Start", data.period?.start || "", ""],
      ["Period End", data.period?.end || "", ""],
      ["Gross Revenue", data.kpis?.gross_revenue?.value || 0, "PKR"],
      ["Net Profit", data.kpis?.net_profit?.value || 0, "PKR"],
      ["Net Margin", (data.kpis?.net_margin?.value || 0) + "%", ""],
      ["COGS (Cost basis)", data.kpis?.cogs?.value || 0, "PKR"],
      ["Shipping Revenue", data.kpis?.shipping_revenue?.value || 0, "PKR"],
      ["Shipping Costs", data.kpis?.shipping_costs?.value || 0, "PKR"],
      ["Completed Orders", data.kpis?.orders_count?.value || 0, ""],
      ["Total Units Sold", data.kpis?.units_sold?.value || 0, "Pairs"],
      ["Average Order Value", data.kpis?.aov?.value || 0, "PKR"],
      ["Unique Customers", data.kpis?.unique_customers?.value || 0, ""],
      ["Repeat Rate", (data.kpis?.repeat_rate?.value || 0) + "%", ""],
    ];

    if (data.top_products?.length) {
      rows.push(["", "", ""]);
      rows.push(["TOP PERFORMING SNEAKERS", "", ""]);
      rows.push(["Product Name", "Units Sold", "Gross Revenue (PKR)", "Net Margin %"]);
      data.top_products.forEach(p => {
        rows.push([`"${p.name}"`, p.units_sold, p.revenue, p.margin + "%"]);
      });
    }

    if (data.category_performance?.length) {
      rows.push(["", "", ""]);
      rows.push(["SALES BY CATEGORY", "", ""]);
      rows.push(["Category", "Units Sold", "Gross Revenue (PKR)", "Net Margin %"]);
      data.category_performance.forEach(c => {
        rows.push([`"${c.name}"`, c.units, c.revenue, c.margin + "%"]);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => Array.isArray(e) ? e.join(",") : e).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `solekicks-analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Analytics CSV exported successfully");
  };

  const printReport = () => {
    window.print();
  };

  if (loading && !data) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-fire" />
        <span className="font-mono text-xs font-bold text-gray-500 dark:text-zinc-400">
          Crunching store telemetry & financial ledgers...
        </span>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const timeline = data?.timeline_trend || [];
  const categories = data?.category_performance || [];
  const brands = data?.brand_performance || [];
  const topProducts = data?.top_products || [];
  const cities = data?.city_distribution || [];
  const provinces = data?.province_distribution || [];
  const payments = data?.payment_breakdown || {};
  const statusMap = data?.order_status || {};

  const totalStatusOrders = Object.values(statusMap).reduce((a, b) => a + b, 0) || 1;
  const deliveredCount = statusMap.delivered || 0;
  const returnedCount = (statusMap.returned || 0) + (statusMap.cancelled || 0);
  const deliverySuccessRate = totalStatusOrders > 0 ? ((deliveredCount / totalStatusOrders) * 100).toFixed(1) : 0;
  const returnRate = totalStatusOrders > 0 ? ((returnedCount / totalStatusOrders) * 100).toFixed(1) : 0;

  const totalCatRevenue = categories.reduce((sum, c) => sum + c.revenue, 0) || 1;
  const totalBrandRevenue = brands.reduce((sum, b) => sum + b.revenue, 0) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-12 print:p-0">

      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display tracking-tight text-2xl font-black text-gray-900 dark:text-zinc-100 flex items-center gap-2.5">
              <TrendingUp className="text-fire" size={24} />
              Store Analytics & Financial Telemetry
            </h1>

          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Real-time multi-horizon profitability, unit margins, category velocity, payment flow, and geographic demand.
          </p>
        </div>

        {/* Global Range Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Presets */}
          <div className="flex items-center bg-gray-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-gray-200 dark:border-zinc-700/60 shadow-xs">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => {
                  setShowCustomPicker(false);
                  setRange(opt.id);
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${range === opt.id && !showCustomPicker
                  ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-xs font-black"
                  : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200"
                  }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${range === "custom" || showCustomPicker
                ? "bg-white dark:bg-zinc-900 text-fire font-black shadow-xs"
                : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200"
                }`}
            >
              <Calendar size={13} />
              <span>Custom</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => load()}
              disabled={loading}
              title="Refresh Data"
              className="p-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl border border-gray-200 dark:border-zinc-700 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-fire" : ""} />
            </button>
            <button
              onClick={exportCSV}
              title="Export CSV"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold text-xs rounded-xl border border-gray-200 dark:border-zinc-700 transition-colors shadow-xs cursor-pointer"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={printReport}
              title="Print Summary Report"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold text-xs rounded-xl border border-gray-200 dark:border-zinc-700 transition-colors shadow-xs cursor-pointer"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker Collapsible */}
      {showCustomPicker && (
        <form onSubmit={handleApplyCustom} className="p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-600 dark:text-zinc-400">Start Date:</label>
            <input
              type="date"
              required
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-600 dark:text-zinc-400">End Date:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-fire"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-fire hover:bg-fire-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Apply Filter
          </button>
        </form>
      )}

      {/* Date Window Badge */}
      {data?.period && (
        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 px-1">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} className="text-fire" />
            Showing data for: <strong className="text-gray-900 dark:text-zinc-200 font-mono">{new Date(data.period.start).toLocaleDateString()}</strong> to <strong className="text-gray-900 dark:text-zinc-200 font-mono">{new Date(data.period.end).toLocaleDateString()}</strong>
          </span>
          {data.period.prev_start && (
            <span className="text-[10px] hidden md:inline">
              Compared against: {new Date(data.period.prev_start).toLocaleDateString()} – {new Date(data.period.prev_end).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* 6-Card Executive Commercial KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

        {/* Card 1: Gross Revenue */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 block">Gross Revenue</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-xl font-black text-gray-900 dark:text-zinc-100">
                {fmt(kpis.gross_revenue?.value || 0)}
              </span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
            <span className={`font-mono font-bold flex items-center gap-0.5 ${(kpis.gross_revenue?.trend || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
              {(kpis.gross_revenue?.trend || 0) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(kpis.gross_revenue?.trend || 0)}%
            </span>
            <span className="text-gray-400">vs prev</span>
          </div>
        </div>

        {/* Card 2: Net Profit & Margin */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Net Profit</span>
              <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                {kpis.net_margin?.value || 0}% Margin
              </span>
            </div>
            <div className="mt-1">
              <span className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                {fmt(kpis.net_profit?.value || 0)}
              </span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[10px]">
            <span className={`font-mono font-bold flex items-center gap-0.5 ${(kpis.net_profit?.trend || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
              {(kpis.net_profit?.trend || 0) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(kpis.net_profit?.trend || 0)}%
            </span>
            <span className="text-gray-400">bottom-line</span>
          </div>
        </div>

        {/* Card 3: COGS (Cost Basis) */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 block">COGS (Stock Cost)</span>
            <div className="mt-1">
              <span className="font-mono text-xl font-black text-orange-600 dark:text-orange-400">
                {fmt(kpis.cogs?.value || 0)}
              </span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
            <span className="text-gray-500 dark:text-zinc-400 font-mono">
              Ship cost: {fmt(kpis.shipping_costs?.value || 0)}
            </span>
            <span className="text-gray-400 font-bold">COGS</span>
          </div>
        </div>

        {/* Card 4: Orders & Volume */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 block">Orders Fulfilled</span>
            <div className="mt-1">
              <span className="font-mono text-xl font-black text-gray-900 dark:text-zinc-100">
                {kpis.orders_count?.value || 0}
              </span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
            <span className={`font-mono font-bold flex items-center gap-0.5 ${(kpis.orders_count?.trend || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
              {(kpis.orders_count?.trend || 0) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(kpis.orders_count?.trend || 0)}%
            </span>
            <span className="text-gray-400">{kpis.total_orders_placed?.value || 0} created</span>
          </div>
        </div>

        {/* Card 5: Average Order Value (AOV) */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 block">Average Order Value</span>
            <div className="mt-1">
              <span className="font-mono text-xl font-black text-gray-900 dark:text-zinc-100">
                {fmt(kpis.aov?.value || 0)}
              </span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
            <span className={`font-mono font-bold flex items-center gap-0.5 ${(kpis.aov?.trend || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
              {(kpis.aov?.trend || 0) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(kpis.aov?.trend || 0)}%
            </span>
            <span className="text-gray-400">per basket</span>
          </div>
        </div>

        {/* Card 6: Units Sold & Repeat Rate */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 block">Sneaker Units Sold</span>
            <div className="mt-1">
              <span className="font-mono text-xl font-black text-gray-900 dark:text-zinc-100">
                {kpis.units_sold?.value || 0}
              </span>
              <span className="text-[10px] text-gray-400 ml-1">pairs</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
              {kpis.repeat_rate?.value || 0}% repeat
            </span>
            <span className="text-gray-400">{kpis.unique_customers?.value || 0} buyers</span>
          </div>
        </div>

      </div>

      {/* Main Interactive Timeline Dynamics Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-sm text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <Activity size={16} className="text-fire" />
              Revenue & Profit Trajectory Over Time
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Comparative velocity across top-line sales, inventory replenishment cost, and net profit margins.
            </p>
          </div>

          {/* Metric Switcher */}
          <div className="flex items-center bg-gray-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveChartMetric("dynamics")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeChartMetric === "dynamics" ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 font-black shadow-xs" : "text-gray-500 dark:text-zinc-400 hover:text-gray-800"
                }`}
            >
              Combined Dynamics
            </button>
            <button
              onClick={() => setActiveChartMetric("revenue")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeChartMetric === "revenue" ? "bg-white dark:bg-zinc-900 text-fire font-black shadow-xs" : "text-gray-500 dark:text-zinc-400 hover:text-gray-800"
                }`}
            >
              Revenue Only
            </button>
            <button
              onClick={() => setActiveChartMetric("profit")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeChartMetric === "profit" ? "bg-white dark:bg-zinc-900 text-emerald-600 font-black shadow-xs" : "text-gray-500 dark:text-zinc-400 hover:text-gray-800"
                }`}
            >
              Profit Only
            </button>
            <button
              onClick={() => setActiveChartMetric("orders")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeChartMetric === "orders" ? "bg-white dark:bg-zinc-900 text-blue-600 font-black shadow-xs" : "text-gray-500 dark:text-zinc-400 hover:text-gray-800"
                }`}
            >
              Orders Volume
            </button>
          </div>
        </div>

        {/* Recharts Area Container */}
        <div className="h-72 w-full pt-2">
          {timeline.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs">
              <Calendar size={28} className="mb-2 opacity-40 text-fire" />
              <span>No completed orders recorded in this time range window</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {activeChartMetric === "orders" ? (
                <BarChart data={timeline}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<AnalyticsChartTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                  <Bar dataKey="orders" name="Orders Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF3B30" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF3B30" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<AnalyticsChartTooltip />} />
                  {(activeChartMetric === "dynamics" || activeChartMetric === "revenue") && (
                    <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#FF3B30" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  )}
                  {(activeChartMetric === "dynamics" || activeChartMetric === "profit") && (
                    <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
                  )}
                  {activeChartMetric === "dynamics" && (
                    <Area type="monotone" dataKey="cogs" name="COGS Basis" stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 3" fill="none" />
                  )}
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-2 border-t border-gray-100 dark:border-zinc-800/80 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-fire" /> Gross Revenue</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Net Profit</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> COGS Basis</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Orders</span>
        </div>
      </div>

      {/* 3-Column Diagnostic Deep Dive: Category Velocity, Brand Silhouettes & Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Sales by Category */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
            <h3 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <Tag size={15} className="text-fire" />
              Category Share & Velocity
            </h3>
            <span className="text-[10px] font-mono text-gray-400">{categories.length} Categories</span>
          </div>

          <div className="space-y-3.5">
            {categories.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No category data recorded in this period</p>
            ) : (
              categories.map(c => {
                const percent = Math.round((c.revenue / totalCatRevenue) * 100);
                return (
                  <div key={c.slug} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 dark:text-zinc-200 truncate pr-2">{c.name}</span>
                      <div className="flex items-center gap-2 font-mono shrink-0">
                        <span className="font-bold text-gray-900 dark:text-zinc-100">{fmt(c.revenue)}</span>
                        <span className="text-[10px] text-gray-400">({percent}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-fire h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-0.5">
                      <span>{c.units} pairs sold</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{c.margin}% margin</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Brand Silhouette Share */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
            <h3 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <Box size={15} className="text-fire" />
              Brand Manufacturer Mix
            </h3>
            <span className="text-[10px] font-mono text-gray-400">{brands.length} Brands</span>
          </div>

          <div className="space-y-3.5">
            {brands.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No brand sales in this period</p>
            ) : (
              brands.map(b => {
                const percent = Math.round((b.revenue / totalBrandRevenue) * 100);
                return (
                  <div key={b.slug} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 dark:text-zinc-200 truncate pr-2">{b.name}</span>
                      <div className="flex items-center gap-2 font-mono shrink-0">
                        <span className="font-bold text-gray-900 dark:text-zinc-100">{fmt(b.revenue)}</span>
                        <span className="text-[10px] text-gray-400">({percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-0.5">
                      <span>{b.units} pairs sold</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{b.margin}% margin</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Payment & Cash Flow Telemetry */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
            <h3 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <CreditCard size={15} className="text-fire" />
              Cash Flow & Gateways
            </h3>
            <span className="text-[10px] font-mono text-gray-400">COD vs Bank</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* COD Card */}
            <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-100 dark:border-zinc-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-zinc-100">Cash on Delivery (COD)</span>
                <span className="font-mono font-black text-gray-900 dark:text-zinc-100">{fmt(payments.COD?.revenue || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-zinc-400 font-mono">
                <span>{payments.COD?.count || 0} orders</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Collected: {fmt(payments.COD?.collected || 0)}</span>
              </div>
              {payments.COD?.pending > 0 && (
                <div className="pt-1 text-[10px] text-orange-600 dark:text-orange-400 font-bold font-mono">
                  Pending Courier Remittance: {fmt(payments.COD.pending)}
                </div>
              )}
            </div>

            {/* Bank Transfer Card */}
            <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-100 dark:border-zinc-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-zinc-100">Direct Bank Transfer</span>
                <span className="font-mono font-black text-gray-900 dark:text-zinc-100">{fmt(payments.BANK_TRANSFER?.revenue || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-zinc-400 font-mono">
                <span>{payments.BANK_TRANSFER?.count || 0} orders</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Paid Upfront</span>
              </div>
            </div>

            {/* Fulfillment Quality Gauge */}
            <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-100 dark:border-zinc-700/60 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-700 dark:text-zinc-300">Fulfillment Success Rate</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{deliverySuccessRate}%</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>Returns / Cancellations:</span>
                <span className="text-rose-500 font-bold">{returnRate}%</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Two-Column Lower Grid: Regional Demand & Top Products Unit Economics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column (5 cols): Geographic Breakdown (Top Cities & Provinces) */}
          <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h3 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                <MapPin size={15} className="text-fire" />
                Geographic Order Volume & Cities
              </h3>
              <span className="text-[10px] text-gray-400">Delivery destinations</span>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Top Demand Cities</span>
              {cities.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No city data available</p>
              ) : (
                cities.map(c => (
                  <div key={c.city} className="flex items-center justify-between text-xs p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/40">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-fire" />
                      <span className="font-bold text-gray-800 dark:text-zinc-200">{c.city}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">{fmt(c.revenue)}</span>
                  </div>
                ))
              )}

              {provinces.length > 0 && (
                <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Provinces</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {provinces.map(p => (
                      <div key={p.province} className="p-2 bg-gray-50 dark:bg-zinc-800/40 rounded-xl">
                        <span className="text-[10px] text-gray-400 block">{p.province}</span>
                        <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">{fmt(p.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (7 cols): Top Sneaker Unit Economics Table */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                  <ShoppingBag size={15} className="text-fire" />
                  Top Performing Sneaker Drops & Unit Margins
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Ranked by gross sales volume and net profitability</p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
                Top 10
              </span>
            </div>

            <div className="overflow-x-auto">
              {topProducts.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">No product orders recorded in this interval</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-zinc-800 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                      <th className="pb-2.5">Sneaker Silhouette</th>
                      <th className="pb-2.5 text-center">Sold</th>
                      <th className="pb-2.5 text-right">Revenue</th>
                      <th className="pb-2.5 text-right">Net Profit</th>
                      <th className="pb-2.5 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/60 font-mono">
                    {topProducts.map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-2.5 pr-2 font-sans">
                          <div className="flex items-center gap-2.5">
                            {p.image ? (
                              <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                <Box size={14} className="text-gray-400" />
                              </div>
                            )}
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 dark:text-zinc-100 truncate block text-xs">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-gray-400 block font-mono">
                              {p.brand} • {p.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-bold text-gray-700 dark:text-zinc-300">
                        {p.units_sold}
                      </td>
                      <td className="py-2.5 text-right font-bold text-gray-900 dark:text-zinc-100">
                        {fmt(p.revenue)}
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {fmt(p.profit)}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${p.margin >= 50
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                          : p.margin >= 20
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                            : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400"
                          }`}>
                          {p.margin}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

function BundlesManager() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const load = () => {
    setLoading(true);
    http.get('/admin/bundles').then(res => { setBundles(res.data.data); setLoading(false); });
  };

  useEffect(() => {
    load();
    http.get('/admin/products?limit=200').then(res => setAllProducts(res.data.data.products || []));
  }, []);

  const del = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete this bundle?",
      message: "Are you sure you want to delete this bundle? Products in the bundle will not be deleted.",
      confirmText: "Delete Bundle",
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await http.delete(`/admin/bundles/${id}`);
          toast.success('Bundle deleted');
          setConfirmModal({ isOpen: false });
          load();
        } catch (e) {
          toast.error("Failed to delete bundle");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const totalRRP = (b) => b.items?.reduce((acc, it) => acc + (it.product?.base_price || 0) * it.quantity, 0) || 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-semibold">Product Bundles</h1>
          <p className="text-sm text-ink-500">Group products together to increase average order value.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-4 py-2 text-xs font-bold bg-obsidian text-white hover:bg-fire transition-colors flex items-center gap-2"><Plus size={14} /> New Bundle</button>
      </div>

      {loading ? <div className="p-10 flex justify-center"><Loader2 size={24} className="animate-spin text-obsidian" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bundles.length === 0 && <div className="col-span-3 bg-white border border-ink-200 p-10 text-center text-ink-400">No bundles yet. Create one to get started.</div>}
          {bundles.map(b => {
            const rrp = totalRRP(b);
            const savings = rrp - b.bundle_price;
            return (
              <div key={b.id} className={`bg-white border ${b.is_active ? 'border-ink-200' : 'border-dashed border-ink-300 opacity-70'} p-5 flex flex-col gap-4`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-semibold text-lg leading-tight">{b.name}</h3>
                    {b.description && <p className="text-xs text-ink-500 mt-1">{b.description}</p>}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>{b.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                </div>

                <div className="space-y-2">
                  {b.items?.map(it => (
                    <div key={it.id} className="flex items-center gap-3">
                      <img src={it.product?.images?.[0] || 'https://via.placeholder.com/40'} className="w-8 h-8 object-cover shrink-0" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{it.product?.name}</p>
                        <p className="text-xs text-ink-400">Qty: {it.quantity}</p>
                      </div>
                      <span className="text-xs font-mono text-ink-500">{fmt((it.product?.base_price || 0) * it.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-ink-100 pt-4 flex justify-between items-end">
                  <div>
                    {rrp > 0 && <p className="text-xs text-ink-500 line-through">{fmt(rrp)} RRP</p>}
                    <p className="font-display text-2xl font-bold text-fire">{fmt(b.bundle_price)}</p>
                    {savings > 0 && <p className="text-[10px] text-green-600 font-bold">Customer saves {fmt(savings)}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(b); setShowForm(true); }} className="p-2 border border-ink-200 hover:bg-ink-50"><Edit size={14} /></button>
                    <button onClick={() => del(b.id)} className="p-2 border border-red-200 text-fire hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <BundleForm
          bundle={editing}
          allProducts={allProducts}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText="Cancel"
        variant={confirmModal.variant || "danger"}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}

function BundleForm({ bundle, allProducts, onClose, onSaved }) {
  const isEdit = !!bundle;
  const [f, setF] = useState({
    name: bundle?.name || '',
    description: bundle?.description || '',
    bundle_price: bundle?.bundle_price || '',
    is_active: bundle?.is_active ?? true,
  });
  const [items, setItems] = useState(
    bundle?.items?.map(it => ({ product_id: it.product_id, quantity: it.quantity })) || []
  );
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const addProduct = (product_id) => {
    if (!product_id || items.find(it => it.product_id === product_id)) return;
    setItems([...items, { product_id, quantity: 1 }]);
  };

  const removeItem = (pid) => setItems(items.filter(it => it.product_id !== pid));
  const setQty = (pid, qty) => setItems(items.map(it => it.product_id === pid ? { ...it, quantity: parseInt(qty) || 1 } : it));

  const totalRRP = items.reduce((acc, it) => {
    const p = allProducts.find(p => p.id === it.product_id);
    return acc + (p?.base_price || 0) * it.quantity;
  }, 0);

  const save = async () => {
    if (!f.name || !f.bundle_price) return toast.error('Name and price required');
    if (items.length < 2) return toast.error('Add at least 2 products to the bundle');
    setSaving(true);
    try {
      const payload = { ...f, bundle_price: Number(f.bundle_price), items };
      if (isEdit) {
        await http.patch(`/admin/bundles/${bundle.id}`, payload);
        toast.success('Bundle updated');
      } else {
        await http.post('/admin/bundles', payload);
        toast.success('Bundle created');
      }
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-ink-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="font-display font-semibold text-xl">{isEdit ? 'Edit Bundle' : 'Create Bundle'}</h2>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-ink-500 mb-1">Bundle Name *</label>
            <input type="text" value={f.name} onChange={set('name')} placeholder="e.g. The Fresh Start Pack" className="w-full border border-ink-200 px-4 py-2.5 focus:outline-none focus:border-obsidian" />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-500 mb-1">Description</label>
            <textarea value={f.description} onChange={set('description')} rows={2} className="w-full border border-ink-200 px-4 py-2.5 focus:outline-none focus:border-obsidian resize-none" />
          </div>

          <div className="border border-ink-200 p-4">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold text-ink-500">Bundle Products</label>
              <span className="text-xs font-mono text-ink-400">Total RRP: {fmt(totalRRP)}</span>
            </div>
            <select onChange={e => { addProduct(e.target.value); e.target.value = ''; }} className="w-full border border-ink-200 px-3 py-2 text-sm focus:outline-none mb-3">
              <option value="">+ Add a product to bundle...</option>
              {allProducts.filter(p => !items.find(it => it.product_id === p.id)).map(p => (
                <option key={p.id} value={p.id}>{p.name} &mdash; {fmt(p.base_price)}</option>
              ))}
            </select>
            <div className="space-y-2">
              {items.map(it => {
                const p = allProducts.find(p => p.id === it.product_id);
                return (
                  <div key={it.product_id} className="flex items-center gap-3 bg-ink-50 p-2">
                    <img src={p?.images?.[0] || 'https://via.placeholder.com/32'} className="w-8 h-8 object-cover" alt="" />
                    <span className="flex-1 text-sm font-bold truncate">{p?.name}</span>
                    <input type="number" min="1" value={it.quantity} onChange={e => setQty(it.product_id, e.target.value)} className="w-14 border border-ink-200 px-2 py-1 text-sm text-center focus:outline-none" />
                    <button onClick={() => removeItem(it.product_id)} className="p-1 text-fire hover:bg-red-50"><X size={14} /></button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1">Bundle Price *</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-ink-400">Rs.</span><input type="number" value={f.bundle_price} onChange={set('bundle_price')} className="w-full pl-10 pr-4 py-2.5 border border-ink-200 focus:outline-none focus:border-obsidian font-mono font-bold" /></div>
              {totalRRP > 0 && Number(f.bundle_price) > 0 && <p className="text-xs text-green-600 mt-1 font-bold">Customer saves {fmt(totalRRP - Number(f.bundle_price))}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1">Status</label>
              <select value={f.is_active} onChange={e => setF({ ...f, is_active: e.target.value === 'true' })} className="w-full border border-ink-200 px-4 py-2.5 focus:outline-none bg-white">
                <option value="true">Active</option>
                <option value="false">Inactive (Draft)</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-ink-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold border border-ink-200 hover:bg-ink-50">Cancel</button>
          <button onClick={save} disabled={saving} className="px-6 py-2 text-sm font-bold bg-obsidian text-white hover:bg-fire transition-colors disabled:opacity-60 flex items-center gap-2">{saving && <Loader2 size={14} className="animate-spin" />} {isEdit ? 'Save Changes' : 'Create Bundle'}</button>
        </div>
      </div>
    </div>
  );
}
