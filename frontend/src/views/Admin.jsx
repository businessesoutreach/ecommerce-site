import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Megaphone, Tag, Layers, Zap, FileText, Search, LayoutDashboard, Package, ShoppingCart, Ticket, Star, Users, LogOut, TrendingUp, AlertTriangle, Plus, Trash2, X, RotateCcw, DollarSign, Image as ImageIcon, Upload, MessageCircle, Search as SearchIcon, Filter, MoreVertical, Eye, Download, Printer, CheckCircle, Check, Truck, MapPin, Edit, Copy, Activity, Loader2, HelpCircle, ExternalLink, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { http, fmt, imgUrl, waLink } from "../lib/api";
import { useStore } from "../context/StoreContext";
import { toast } from "sonner";

import HomepageCMS from './cms/HomepageCMS';
import HeroSlidesCMS from './cms/HeroSlidesCMS';
import CategoriesCMS from './cms/CategoriesCMS';
import ProductSectionsCMS from './cms/ProductSectionsCMS';
import PromoBannersCMS from './cms/PromoBannersCMS';
import FlashSaleCMS from './cms/FlashSaleCMS';
import TestimonialsCMS from './cms/TestimonialsCMS';
import PagesCMS from './cms/PagesCMS';
import SeoCMS from './cms/SeoCMS';


const ORDER_STATES = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];

export default function Admin() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!user) navigate("/login");
    else if (user.role !== "admin" && user.role !== "staff") { toast.error("Admin access only"); navigate("/"); }
    else if (user.role === "staff" && ["overview", "refunds", "coupons", "cms", "audit_logs"].includes(tab)) setTab("orders");
  }, [user, tab]);

  if (!user || (user.role !== "admin" && user.role !== "staff")) return null;

  const NAV = [
    ["overview", "Overview", LayoutDashboard],
    ["orders", "Orders", ShoppingCart],
    ["cod", "COD Tracking", Truck],
    ["inventory", "Inventory", Layers],
    ["products", "Products", Package],
    ["pos", "POS", Plus],
    ["returns", "Returns", RotateCcw],
    ["refunds", "Refunds", DollarSign],
    ["coupons", "Coupons", Ticket],
    ["reviews", "Reviews", Star],
    ["customers", "Customers", Users],
    ["bundles", "Bundles", Tag],
    ["cms", "Hero & CMS", ImageIcon],
    ["profitability", "Profitability", TrendingUp],
    ["audit_logs", "Audit Logs", FileText]
  ].filter(([k]) => {
    if (user.role === 'admin') return true;
    return !['overview', 'refunds', 'coupons', 'cms', 'audit_logs', 'profitability'].includes(k);
  });

  return (
    <div className="min-h-screen bg-ink-100 flex" data-testid="admin-dashboard">
      {tab !== "cms" && (
        <aside className="w-16 lg:w-60 bg-ink-50 border-r border-ink-200 h-screen sticky top-0 flex flex-col shrink-0">
          <div className="px-4 py-3 lg:px-6 lg:py-4 border-b border-ink-200 shrink-0">
            <span className="font-display font-bold text-obsidian tracking-tighter hidden lg:block">SOLEKICKS<span className="text-fire">.</span></span>
            <span className="lg:hidden font-display font-semibold text-fire text-center block">S.</span>
          </div>
          <nav className="flex-1 p-2 lg:p-3 space-y-1 overflow-y-auto custom-scrollbar">
            {NAV.map(([k, l, I]) => (
              <button key={k} onClick={() => setTab(k)} data-testid={`admin-nav-${k}`} className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 font-bold text-sm transition-colors ${tab === k ? "bg-white text-fire border border-ink-200 shadow-sm" : "text-ink-500 hover:text-obsidian hover:bg-ink-100/50 border border-transparent"}`}>
                <I size={18} />
                <span className="hidden lg:block">{l}</span>
              </button>
            ))}
          </nav>
          <button onClick={() => { logout(); navigate("/"); }} className="m-3 flex items-center justify-center lg:justify-start gap-3 px-3 py-3 text-ink-500 hover:text-fire hover:bg-ink-100/50 font-bold  text-sm transition-colors border border-transparent">
            <LogOut size={18} />
            <span className="hidden lg:block">Logout</span>
          </button>
        </aside>
      )}

      <main className={`flex-1 overflow-x-hidden ${tab === 'cms' ? 'h-screen' : 'p-5 lg:p-8 min-w-0'}`}>
        {tab === "overview" && <Overview setTab={setTab} />}
        {tab === "orders" && <Orders />}
        {tab === "cod" && <CodTracking />}
        {tab === "inventory" && <InventoryManagement />}
        {tab === "products" && <Products />}
        {tab === "pos" && <PosSystem />}
        {tab === "returns" && <Returns />}
        {tab === "refunds" && <Refunds />}
        {tab === "coupons" && <Coupons />}
        {tab === "reviews" && <Reviews />}
        {tab === "customers" && <Customers />}
        {tab === "bundles" && <BundlesManager />}
        {tab === "cms" && <Cms setTab={setTab} />}
        {tab === "profitability" && <ProfitabilityAnalytics />}
        {tab === "audit_logs" && <AuditLogs />}
      </main>
    </div>
  );
}

function Overview({ setTab }) {
  const [d, setD] = useState(null);
  useEffect(() => { http.get("/admin/analytics/overview").then(({ data }) => setD(data.data)); }, []);
  if (!d) return <div className="skeleton h-64 rounded-none" />;

  const { kpis, sales_chart, top_products, sales_by_category, recent_orders, customer_overview, needs_attention, inventory_by_category } = d;

  const COLORS = ['#FF3B30', '#111111', '#666666', '#E5E5E5', '#A3A3A3'];

  const Trend = ({ val }) => (
    <span className={`text-xs font-mono font-bold ${val > 0 ? 'text-green-500' : val < 0 ? 'text-fire' : 'text-ink-400'}`}>
      {val > 0 ? '↑' : val < 0 ? '↓' : ''} {Math.abs(val).toFixed(1)}%
    </span>
  );

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="font-display tracking-tight text-2xl font-semibold">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTab("products")} className="px-3 py-1.5 text-xs font-bold  border border-ink-200 bg-white hover:bg-obsidian hover:text-white transition-colors">+ Add Product</button>
          <button onClick={() => setTab("coupons")} className="px-3 py-1.5 text-xs font-bold  border border-ink-200 bg-white hover:bg-obsidian hover:text-white transition-colors">+ Create Coupon</button>
          <button onClick={() => setTab("orders")} className="px-3 py-1.5 text-xs font-bold  bg-obsidian text-white hover:bg-fire transition-colors">View Orders</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-6">
        <div className="bg-white rounded-none p-5 border border-ink-200 xl:col-span-2">
           <div className="flex justify-between items-start"><span className="font-mono text-xs  tracking-wider text-ink-400">Collected Revenue</span><DollarSign size={18} className="text-green-500" /></div>
           <p className="font-display font-semibold text-2xl mt-2">{fmt(kpis.revenue.value)}</p>
           <Trend val={kpis.revenue.trend} />
        </div>
        <div className="bg-white rounded-none p-5 border border-ink-200 xl:col-span-2">
           <div className="flex justify-between items-start"><span className="font-mono text-xs  tracking-wider text-ink-400">Total Orders</span><ShoppingCart size={18} className="text-fire" /></div>
           <p className="font-display font-semibold text-2xl mt-2">{kpis.total_orders?.value || 0}</p>
           <span className="text-xs font-mono font-bold text-ink-400">All Time</span>
        </div>
        <div className="bg-white rounded-none p-5 border border-ink-200 xl:col-span-2">
           <div className="flex justify-between items-start"><span className="font-mono text-xs  tracking-wider text-ink-400">Delivered Orders</span><CheckCircle size={18} className="text-blue-500" /></div>
           <p className="font-display font-semibold text-2xl mt-2">{kpis.delivered_orders?.value || 0}</p>
           <span className="text-xs font-mono font-bold text-ink-400">Last 30 Days</span>
        </div>
        <div className="bg-white rounded-none p-5 border border-ink-200 xl:col-span-2">
           <div className="flex justify-between items-start"><span className="font-mono text-xs  tracking-wider text-ink-400">Confirmed Orders</span><Package size={18} className="text-green-500" /></div>
           <p className="font-display font-semibold text-2xl mt-2">{kpis.confirmed_orders?.value || 0}</p>
           <span className="text-xs font-mono font-bold text-ink-400">Last 30 Days</span>
        </div>
        <div className="bg-white rounded-none p-5 border border-ink-200 xl:col-span-2">
           <div className="flex justify-between items-start"><span className="font-mono text-xs  tracking-wider text-ink-400">Pending Orders</span><ShoppingCart size={18} className="text-orange-500" /></div>
           <p className="font-display font-semibold text-2xl mt-2">{kpis.pending_orders?.value || 0}</p>
           <span className="text-xs font-mono font-bold text-ink-400">Last 30 Days</span>
        </div>
        <div className="bg-white rounded-none p-5 border border-ink-200 xl:col-span-2">
           <div className="flex justify-between items-start"><span className="font-mono text-xs  tracking-wider text-ink-400">Customers</span><Users size={18} className="text-fire" /></div>
           <p className="font-display font-semibold text-2xl mt-2">{kpis.customers.value}</p>
           <Trend val={kpis.customers.trend} />
        </div>
        <div className="bg-white rounded-none p-5 border border-ink-200 xl:col-span-2">
           <div className="flex justify-between items-start"><span className="font-mono text-xs  tracking-wider text-ink-400">Avg Order Value</span><Package size={18} className="text-fire" /></div>
           <p className="font-display font-semibold text-2xl mt-2">{fmt(kpis.aov.value)}</p>
           <Trend val={kpis.aov.trend} />
        </div>
        <div className="bg-white rounded-none p-5 border border-ink-200 xl:col-span-2">
           <div className="flex justify-between items-start"><span className="font-mono text-xs  tracking-wider text-ink-400">Pending COD</span><Truck size={18} className="text-orange-500" /></div>
           <p className="font-display font-semibold text-2xl mt-2">{fmt(kpis.pending_cod?.value || 0)}</p>
           <span className="text-xs font-mono font-bold text-ink-400">Awaiting Remittance</span>
        </div>
      </div>

      <div className="bg-white rounded-none p-5 border border-ink-200 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-lg font-semibold">Sales Overview (Last 30 Days)</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={sales_chart} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF3B30" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#FF3B30" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs ${v/1000}k`} />
            <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Area type="monotone" dataKey="revenue" stroke="#FF3B30" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-none p-5 border border-ink-200">
          <h3 className="font-display text-lg font-semibold mb-4">Top Selling Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-ink-100 font-mono text-[10px]  text-ink-500">
                <tr><th className="p-3">Product</th><th className="p-3">Sold</th><th className="p-3">Revenue</th></tr>
              </thead>
              <tbody>
                {top_products.map((p, i) => (
                  <tr key={i} className="border-b border-ink-100 last:border-0">
                    <td className="p-3 font-semibold">{p.name}</td>
                    <td className="p-3">{p.sold}</td>
                    <td className="p-3 text-fire font-mono">{fmt(p.rev)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => setTab("products")} className="w-full text-center text-xs font-bold  mt-4 text-ink-500 hover:text-obsidian">View All Products</button>
        </div>
        
        <div className="bg-white rounded-none p-5 border border-ink-200">
          <h3 className="font-display text-lg font-semibold mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sales_by_category} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                {sales_by_category.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => fmt(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {sales_by_category.map((c, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}/>{c.name}</span>
                <span className="font-mono font-bold">{fmt(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-none p-5 border border-ink-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-lg font-semibold">Recent Orders</h3>
            <button onClick={() => setTab("orders")} className="text-xs font-bold  text-fire hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-ink-100 font-mono text-[10px]  text-ink-500">
                <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3 hidden sm:table-cell">Date</th></tr>
              </thead>
              <tbody>
                {recent_orders.map((o, i) => (
                  <tr key={i} className="border-b border-ink-100 last:border-0">
                    <td className="p-3 font-mono font-bold text-fire">#{o.order_number}</td>
                    <td className="p-3">{o.customer_name}</td>
                    <td className="p-3">{fmt(o.total)}</td>
                    <td className="p-3"><span className="text-[10px] font-bold  tracking-wider bg-ink-100 px-2 py-1">{o.status}</span></td>
                    <td className="p-3 hidden sm:table-cell text-ink-400 font-mono text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-none p-5 border border-ink-200">
            <h3 className="font-display text-lg font-semibold mb-4">Customer Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink-500">Total Customers</span>
                <span className="font-bold">{customer_overview.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink-500">New (Last 30d)</span>
                <span className="font-bold text-green-500">+{customer_overview.new}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink-500">Returning (Active)</span>
                <span className="font-bold">{customer_overview.returning}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-none p-5 border-l-4 border-l-fire border-y border-r border-ink-200">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-fire"/> Needs Attention</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-fire"></span> {needs_attention.pending_orders} pending orders</span>
                <button onClick={() => setTab("orders")} className="text-xs text-ink-400 hover:text-obsidian  font-bold">View</button>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400"></span> {needs_attention.low_stock} products low stock</span>
                <button onClick={() => setTab("products")} className="text-xs text-ink-400 hover:text-obsidian  font-bold">View</button>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-600"></span> {needs_attention.failed_payments} failed payments</span>
                <button onClick={() => setTab("orders")} className="text-xs text-ink-400 hover:text-obsidian  font-bold">View</button>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> {needs_attention.pending_reviews} pending reviews</span>
                <button onClick={() => setTab("reviews")} className="text-xs text-ink-400 hover:text-obsidian  font-bold">View</button>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500"></span> {needs_attention.refund_requests} refund requests</span>
                <button onClick={() => setTab("refunds")} className="text-xs text-ink-400 hover:text-obsidian  font-bold">View</button>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-none p-5 border border-ink-200">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2"><Layers size={18} className="text-obsidian"/> Inventory by Category</h3>
            <ul className="space-y-3 text-sm">
              {inventory_by_category && inventory_by_category.map((inv, idx) => (
                <li key={idx} className="flex justify-between items-center">
                  <span className="capitalize">{inv.name.replace(/-/g, ' ')}</span>
                  <span className="font-bold bg-ink-100 px-2 py-0.5">{inv.count} Products</span>
                </li>
              ))}
              {(!inventory_by_category || inventory_by_category.length === 0) && <li className="text-ink-400">No data</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Orders() {
  const [data, setData] = useState({ orders: [], pagination: {}, status_counts: {} });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ page: 1, limit: 10, status: "all", payment: "all", date: "all", search: "" });
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState([]);
  const [viewOrder, setViewOrder] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [confirmStatusUpdate, setConfirmStatusUpdate] = useState(null);
  const [showStatusGuide, setShowStatusGuide] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [trackParcelOrder, setTrackParcelOrder] = useState(null);

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

  const updateStatus = async (id, status) => { await http.patch(`/admin/orders/${id}/status`, { status }); toast.success("Status updated"); load(); };
  const bulkUpdateStatus = async (status) => { 
    if(!window.confirm(`Mark ${selected.length} orders as ${status}?`)) return;
    await http.patch(`/admin/orders/bulk-status`, { orderIds: selected, status });
    toast.success(`Updated ${selected.length} orders`);
    load();
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
        th { background: #f0f0f0; padding: 5px 8px; text-align: left; font-size: 9px; text-transform: uppercase; }
        td { padding: 5px 8px; border-bottom: 1px solid #eee; }
        .total-row td { font-weight: bold; border-top: 2px solid #111; }
        .barcode { text-align: center; font-family: monospace; font-size: 14px; letter-spacing: 4px; margin-top: 10px; border: 1px solid #ccc; padding: 6px; }
      </style></head><body>
      ${selectedOrders.map(o => `
        <div class="slip">
          <div class="header">
            <div class="logo">SOLEKICKS<span class="dot">.</span></div>
            <div class="order-num">#${o.order_number}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="section">
              <div class="label">Ship To</div>
              <strong>${o.customer_name}</strong><br>
              ${o.shipping_address?.address_l1 || ''}<br>
              ${o.shipping_address?.address_l2 ? o.shipping_address.address_l2 + '<br>' : ''}
              ${o.shipping_address?.city || ''}, ${o.shipping_address?.province || ''}<br>
              ${o.customer_phone}
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
    { id: "pending", label: "Pending", count: data.status_counts?.pending || 0 },
    { id: "processing", label: "Processing", count: data.status_counts?.processing || 0 },
    { id: "shipped", label: "Shipped", count: data.status_counts?.shipped || 0 },
    { id: "delivered", label: "Delivered", count: data.status_counts?.delivered || 0 },
    { id: "cancelled", label: "Cancelled", count: data.status_counts?.cancelled || 0 },
    { id: "refunded", label: "Refunded", count: data.status_counts?.refunded || 0 },
  ];

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-black text-gray-900">Orders Management</h1>
          <p className="text-sm text-gray-600 font-medium">Search, dispatch, track, and fulfill customer sneaker drops</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => setShowStatusGuide(true)} className="px-3 py-2 text-xs font-bold border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-800 transition-colors flex items-center gap-1.5 shadow-sm">
            <HelpCircle size={14} className="text-gray-500" /> Status Guide
          </button>
          <button onClick={exportOrders} className="px-3 py-2 text-xs font-bold border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-800 transition-colors flex items-center gap-1.5 shadow-sm">
            <Download size={14} className="text-gray-500" /> Export CSV
          </button>
          <button onClick={() => setShowCreateOrderModal(true)} className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-fire rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
            <Plus size={15} /> Create Order
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200 mb-6 gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setQuery({ ...query, status: t.id, page: 1 })}
            className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 flex items-center gap-2 transition-all ${query.status === t.id ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'}`}>
            {t.label}
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${query.status === t.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 border border-gray-200 mb-6 flex flex-col lg:flex-row gap-4 items-center shadow-sm rounded-xl">
        <form onSubmit={handleSearch} className="flex-1 relative w-full">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Live search by order #, customer, phone, or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-9 py-2 border border-gray-300 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black focus:outline-none rounded-lg bg-white"
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
          <select value={query.status} onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })} className="border border-gray-300 px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none rounded-lg bg-white shadow-sm">
            <option value="all">Status: All</option>
            {ORDER_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={query.payment} onChange={(e) => setQuery({ ...query, payment: e.target.value, page: 1 })} className="border border-gray-300 px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none rounded-lg bg-white shadow-sm">
            <option value="all">Payment: All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select value={query.date} onChange={(e) => setQuery({ ...query, date: e.target.value, page: 1 })} className="border border-gray-300 px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none rounded-lg bg-white shadow-sm">
            <option value="all">Date: All time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button onClick={resetFilters} className="text-xs font-bold text-gray-500 hover:text-fire px-3 py-2">Reset</button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-black text-white p-3.5 flex justify-between items-center mb-4 sticky top-0 z-10 shadow-lg rounded-xl">
          <span className="font-bold text-sm">{selected.length} orders selected</span>
          <div className="flex gap-2">
            <button onClick={printPackingSlips} className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-md transition-colors flex items-center gap-1.5"><Printer size={13}/> Print Slips</button>
            <button onClick={() => bulkUpdateStatus('processing')} className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-md transition-colors">Mark Processing</button>
            <button onClick={() => bulkUpdateStatus('shipped')} className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-md transition-colors">Mark Shipped</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 overflow-x-auto min-h-[400px] rounded-xl shadow-sm">
        {loading ? <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div></div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 font-mono text-[11px] font-bold uppercase tracking-wider text-gray-700">
              <tr>
                <th className="p-3.5 w-10"><input type="checkbox" checked={data.orders.length > 0 && selected.length === data.orders.length} onChange={selectAll} className="accent-black rounded" /></th>
                <th className="p-3.5">Order</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Items</th>
                <th className="p-3.5">Total</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.orders.length === 0 ? <tr><td colSpan="9" className="p-10 text-center text-gray-400 font-medium">No orders found matching your criteria.</td></tr> : data.orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50/80 transition-colors cursor-pointer group" onClick={() => setViewOrder(o)}>
                  <td className="p-3.5" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggleSelect(o.id)} className="accent-black rounded" /></td>
                  <td className="p-3.5 font-mono font-bold text-gray-900 group-hover:text-fire transition-colors">#{o.order_number}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-gray-900">{o.customer_name}</div>
                    <div className="text-xs text-gray-500 font-mono">{o.customer_phone}</div>
                  </td>
                  <td className="p-3.5 font-mono text-gray-600">{o.items?.length || 0} pair{o.items?.length === 1 ? '' : 's'}</td>
                  <td className="p-3.5 font-mono font-bold text-gray-900">{fmt(o.total)}</td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      o.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                      o.payment_status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                      'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {o.payment_status || 'COD'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      o.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                      o.status === 'shipped' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                      o.status === 'processing' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                      o.status === 'confirmed' ? 'bg-purple-50 text-purple-800 border-purple-300' :
                      o.status === 'cancelled' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                      'bg-gray-100 text-gray-800 border-gray-300'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-gray-500 font-mono text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="p-3.5 text-center relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setActiveDropdown(activeDropdown === o.id ? null : o.id)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                      <MoreVertical size={16}/>
                    </button>
                    {activeDropdown === o.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)}></div>
                        <div className="absolute right-8 top-8 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 flex flex-col text-left py-1 text-xs">
                          <button onClick={() => { setViewOrder(o); setActiveDropdown(null); }} className="px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-800 font-medium"><Eye size={14}/> View Details</button>
                          {(o.tracking_number || o.status === 'shipped') && (
                            <button onClick={() => { setTrackParcelOrder(o); setActiveDropdown(null); }} className="px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-blue-600 font-medium"><Truck size={14}/> Track Parcel ({o.courier_name || 'Courier'})</button>
                          )}
                          <div className="border-t border-gray-100 my-1"></div>
                          <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Update Status</div>
                          {ORDER_STATES.map(s => (
                            <button key={s} onClick={() => { setConfirmStatusUpdate({ order: o, newStatus: s }); setActiveDropdown(null); }} className={`px-4 py-1.5 hover:bg-gray-50 text-left capitalize ${o.status === s ? 'font-bold bg-gray-50 text-gray-900' : 'text-gray-600'}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Proper Pagination Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 text-xs text-gray-700 font-medium">
          <span>Rows per page:</span>
          <select
            value={query.limit}
            onChange={(e) => setQuery({ ...query, limit: Number(e.target.value), page: 1 })}
            className="border border-gray-300 rounded-md px-2.5 py-1 text-xs font-mono font-bold bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-black shadow-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="font-mono text-gray-600">
            {data.pagination?.totalCount > 0 ? (
              <>Showing <strong className="text-gray-900">{(query.page - 1) * query.limit + 1}</strong> to <strong className="text-gray-900">{Math.min(query.page * query.limit, data.pagination.totalCount)}</strong> of <strong className="text-gray-900">{data.pagination.totalCount}</strong> orders</>
            ) : "0 orders found"}
          </span>
        </div>

        {data.pagination?.totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              disabled={query.page === 1}
              onClick={() => setQuery({ ...query, page: 1 })}
              className="px-2.5 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100 disabled:opacity-40 text-xs font-bold text-gray-800 transition-colors shadow-sm"
              title="First Page"
            >
              «
            </button>
            <button
              disabled={query.page === 1}
              onClick={() => setQuery({ ...query, page: query.page - 1 })}
              className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100 disabled:opacity-40 text-xs font-bold text-gray-800 transition-colors shadow-sm"
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
                  className={`w-8 h-7 text-xs font-bold font-mono rounded-md border transition-all ${
                    query.page === pNum
                      ? "bg-black text-white border-black shadow-sm"
                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100 hover:border-black"
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              disabled={query.page === data.pagination.totalPages}
              onClick={() => setQuery({ ...query, page: query.page + 1 })}
              className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100 disabled:opacity-40 text-xs font-bold text-gray-800 transition-colors shadow-sm"
            >
              Next
            </button>
            <button
              disabled={query.page === data.pagination.totalPages}
              onClick={() => setQuery({ ...query, page: data.pagination.totalPages })}
              className="px-2.5 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100 disabled:opacity-40 text-xs font-bold text-gray-800 transition-colors shadow-sm"
              title="Last Page"
            >
              »
            </button>
          </div>
        )}
      </div>

      {showCreateOrderModal && (
        <CreateOrderModal
          onClose={() => setShowCreateOrderModal(false)}
          onCreated={() => {
            load();
            setShowCreateOrderModal(false);
          }}
        />
      )}

      {viewOrder && <OrderDetailsDrawer order={viewOrder} onClose={() => setViewOrder(null)} onUpdate={() => { load(); setViewOrder(null); }} />}

      {/* Confirmation Modal */}
      {confirmStatusUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 backdrop-blur-sm" onClick={() => setConfirmStatusUpdate(null)}>
          <div className="bg-white p-6 max-w-sm w-full shadow-2xl border-t-4 border-obsidian" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold mb-2">Update Status</h3>
            <p className="text-sm text-ink-500 mb-6">Are you sure you want to mark Order <strong>#{confirmStatusUpdate.order.order_number}</strong> as <strong className="capitalize text-obsidian">{confirmStatusUpdate.newStatus}</strong>?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmStatusUpdate(null)} className="px-4 py-2 text-sm font-bold text-ink-500 hover:text-obsidian">Cancel</button>
              <button onClick={() => { updateStatus(confirmStatusUpdate.order.id, confirmStatusUpdate.newStatus); setConfirmStatusUpdate(null); }} className="px-4 py-2 text-sm font-bold bg-obsidian text-white hover:bg-fire transition-colors">Confirm Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Guide Modal */}
      {showStatusGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 backdrop-blur-sm" onClick={() => setShowStatusGuide(false)}>
          <div className="bg-white max-w-2xl w-full shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-ink-200 flex justify-between items-center bg-ink-50">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2"><HelpCircle size={18}/> Order Status Guide</h3>
              <button onClick={() => setShowStatusGuide(false)} className="text-ink-400 hover:text-fire"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-sm mb-3 text-obsidian border-b border-ink-200 pb-2">Internal Statuses</h4>
                  <ul className="space-y-3 text-sm">
                    <li><strong className="bg-ink-100 px-2 py-0.5 rounded mr-2">placed</strong> Customer has completed checkout. Action needed: Review payment.</li>
                    <li><strong className="bg-ink-100 px-2 py-0.5 rounded mr-2">confirmed</strong> Payment verified. Action needed: Pick items.</li>
                    <li><strong className="bg-ink-100 px-2 py-0.5 rounded mr-2">processing</strong> Order is currently being handled/packed in the warehouse.</li>
                    <li><strong className="bg-ink-100 px-2 py-0.5 rounded mr-2">packed</strong> Ready for courier pickup. Label should be generated.</li>
                    <li><strong className="bg-ink-100 px-2 py-0.5 rounded mr-2">shipped</strong> Handed over to courier (e.g. TCS). Tracking is active.</li>
                    <li><strong className="bg-ink-100 px-2 py-0.5 rounded mr-2">delivered</strong> Courier confirms successful delivery to customer.</li>
                    <li><strong className="bg-ink-100 px-2 py-0.5 rounded mr-2">cancelled</strong> Order terminated before shipping.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-3 text-obsidian border-b border-ink-200 pb-2">TCS Tracking Integration</h4>
                  <p className="text-sm text-ink-500 mb-2">When an order is marked as <strong>shipped</strong> or a tracking number is generated via "Book Courier via TCS", the system will map the following TCS events:</p>
                  <ul className="space-y-2 text-sm">
                    <li><span className="text-blue-500 font-bold">Transit:</span> Parcel is moving through TCS network.</li>
                    <li><span className="text-orange-500 font-bold">Out for Delivery:</span> Rider is on the way to the customer today.</li>
                    <li><span className="text-red-500 font-bold">Exception:</span> Delivery attempt failed, address issue, or customer refused.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Track Parcel Modal (Admin View) */}
      {trackParcelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 backdrop-blur-sm" onClick={() => setTrackParcelOrder(null)}>
          <div className="bg-white max-w-lg w-full shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-ink-200 flex justify-between items-center bg-obsidian text-white">
              <h3 className="font-display text-base font-semibold flex items-center gap-2"><Truck size={16}/> Tracking: #{trackParcelOrder.tracking_number || trackParcelOrder.order_number}</h3>
              <button onClick={() => setTrackParcelOrder(null)} className="text-white/70 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="mb-6 p-4 border border-ink-200 bg-ink-50 text-sm flex justify-between">
                <div>
                  <div className="font-bold text-obsidian">{trackParcelOrder.courier_name || 'TCS'} Delivery</div>
                  <div className="text-ink-500">{trackParcelOrder.customer_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-fire">{trackParcelOrder.tracking_number || 'N/A'}</div>
                </div>
              </div>
              <div className="relative pl-6 border-l-2 border-ink-200 space-y-6">
                {/* Mock timeline for now, typically this would fetch from API */}
                <div className="relative">
                  <div className="absolute -left-[31px] bg-white border-2 border-green-500 w-4 h-4 rounded-full"></div>
                  <p className="text-sm font-bold text-green-600">Shipped</p>
                  <p className="text-xs text-ink-400">Package handed to courier</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] bg-white border-2 border-blue-500 w-4 h-4 rounded-full"></div>
                  <p className="text-sm font-bold text-blue-600">In Transit</p>
                  <p className="text-xs text-ink-400">Arrived at origin facility</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] bg-white border-2 border-ink-300 w-4 h-4 rounded-full"></div>
                  <p className="text-sm font-bold text-ink-400">Out for Delivery</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] bg-white border-2 border-ink-300 w-4 h-4 rounded-full"></div>
                  <p className="text-sm font-bold text-ink-400">Delivered</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateOrderModal({ onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [fetchingProducts, setFetchingProducts] = useState(true);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [addressL1, setAddressL1] = useState("");
  const [addressL2, setAddressL2] = useState("");
  const [city, setCity] = useState("Karachi");
  const [province, setProvince] = useState("Sindh");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [shippingFee, setShippingFee] = useState(250);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [customerNote, setCustomerNote] = useState("");

  // Items added to the order
  const [items, setItems] = useState([]);

  // Current item selection draft
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);

  useEffect(() => {
    http.get('/products?limit=50')
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

  const handleProductChange = (prodId) => {
    const prod = products.find(p => p.id === prodId);
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

    toast.success(`Added ${selectedProduct.name} (EU ${selectedSize})`);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) return toast.error("Customer name is required");
    if (!customerPhone.trim()) return toast.error("Customer phone is required");
    if (!addressL1.trim()) return toast.error("Delivery address is required");
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
        customer_note: customerNote.trim() || undefined
      };

      const res = await http.post('/admin/orders', payload);
      toast.success(`Order #${res.data?.data?.order_number} created successfully!`);
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white max-w-3xl w-full shadow-2xl border border-gray-200 rounded-2xl max-h-[92vh] flex flex-col my-auto overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header - High Contrast Clean White */}
        <div className="p-5 px-6 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-display font-extrabold text-lg text-gray-900 flex items-center gap-2">
              <Package size={18} className="text-fire" /> Create Customer Order
            </h2>
            <p className="text-xs text-gray-500 font-medium">Manually place an order for phone, WhatsApp, or in-store customer with live stock check</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Customer & Address */}
          <div>
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-obsidian mb-3 border-b border-ink-100 pb-1 flex items-center gap-1.5">
              <Users size={14}/> 1. Customer & Delivery Destination
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-ink-600 block mb-1">Full Name *</label>
                <input required type="text" placeholder="e.g. Bilal Ahmed" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border border-ink-200 px-3 py-2 text-xs focus:border-obsidian focus:outline-none bg-white" />
              </div>
              <div>
                <label className="font-bold text-ink-600 block mb-1">Phone Number (COD) *</label>
                <input required type="text" placeholder="e.g. 03001234567" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full border border-ink-200 px-3 py-2 text-xs focus:border-obsidian focus:outline-none font-mono bg-white" />
              </div>
              <div>
                <label className="font-bold text-ink-600 block mb-1">Email (Optional)</label>
                <input type="email" placeholder="customer@gmail.com" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full border border-ink-200 px-3 py-2 text-xs focus:border-obsidian focus:outline-none bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="font-bold text-ink-600 block mb-1">Street Address Line 1 *</label>
                <input required type="text" placeholder="House/Flat #, Street, Sector / Area" value={addressL1} onChange={e => setAddressL1(e.target.value)} className="w-full border border-ink-200 px-3 py-2 text-xs focus:border-obsidian focus:outline-none bg-white" />
              </div>
              <div>
                <label className="font-bold text-ink-600 block mb-1">Address Line 2 (Optional)</label>
                <input type="text" placeholder="Near landmark / colony" value={addressL2} onChange={e => setAddressL2(e.target.value)} className="w-full border border-ink-200 px-3 py-2 text-xs focus:border-obsidian focus:outline-none bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="font-bold text-ink-600 block mb-1">City *</label>
                <input required type="text" placeholder="e.g. Lahore, Karachi, Islamabad" value={city} onChange={e => setCity(e.target.value)} className="w-full border border-ink-200 px-3 py-2 text-xs focus:border-obsidian focus:outline-none bg-white" />
              </div>
              <div>
                <label className="font-bold text-ink-600 block mb-1">Province *</label>
                <select value={province} onChange={e => setProvince(e.target.value)} className="w-full border border-ink-200 px-3 py-2 text-xs focus:border-obsidian focus:outline-none bg-white">
                  <option value="Punjab">Punjab</option>
                  <option value="Sindh">Sindh</option>
                  <option value="Islamabad Capital">Islamabad Capital</option>
                  <option value="KPK">Khyber Pakhtunkhwa (KPK)</option>
                  <option value="Balochistan">Balochistan</option>
                  <option value="Azad Kashmir">Azad Kashmir</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="font-bold text-ink-600 block mb-1">Country</label>
                <input disabled type="text" value="Pakistan (PK)" className="w-full border border-ink-200 px-3 py-2 text-xs bg-ink-50 text-ink-400 font-bold" />
              </div>
            </div>
          </div>

          {/* Section 2: Sneaker Items Selector */}
          <div>
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-obsidian mb-3 border-b border-ink-100 pb-1 flex items-center gap-1.5">
              <Package size={14}/> 2. Add Sneaker Items
            </h3>
            
            {fetchingProducts ? (
              <div className="p-4 text-center text-ink-400 font-mono flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading sneaker catalog...
              </div>
            ) : (
              <div className="bg-ink-50 p-4 border border-ink-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6">
                    <label className="font-bold text-ink-600 block mb-1">Sneaker Model</label>
                    <select
                      value={selectedProduct?.id || ""}
                      onChange={e => handleProductChange(e.target.value)}
                      className="w-full border border-ink-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-obsidian font-semibold"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — Rs. {(p.is_flash_sale && p.flash_sale_price ? p.flash_sale_price : p.base_price).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="font-bold text-ink-600 block mb-1">EU Size</label>
                    <select
                      value={selectedSize}
                      onChange={e => setSelectedSize(e.target.value)}
                      className="w-full border border-ink-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-obsidian font-mono"
                    >
                      {selectedProduct?.sizes?.map(s => (
                        <option key={s.size} value={s.size} disabled={s.stock <= 0}>
                          EU {s.size} ({s.stock > 0 ? `${s.stock} in stock` : 'Out of stock'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <label className="font-bold text-ink-600 block mb-1">Qty</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={selectedQty}
                      onChange={e => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full border border-ink-200 px-2 py-2 text-xs text-center font-mono bg-white focus:outline-none focus:border-obsidian"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full bg-obsidian text-white font-bold py-2 hover:bg-fire transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Added Items List */}
            <div className="mt-3">
              {items.length === 0 ? (
                <div className="p-6 text-center text-ink-400 border border-dashed border-ink-200 font-mono">
                  No sneakers added to this order yet. Select a model above and click "Add".
                </div>
              ) : (
                <div className="border border-ink-200 overflow-hidden divide-y divide-ink-100">
                  {items.map((it, idx) => (
                    <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {it.image ? (
                          <img src={it.image} alt={it.name} className="w-12 h-12 object-cover bg-ink-50 border border-ink-200 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-ink-100 grid place-items-center text-ink-400 shrink-0"><Package size={16}/></div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-obsidian truncate">{it.name}</p>
                          <p className="text-ink-500 font-mono text-[11px]">Size EU {it.size} &nbsp;·&nbsp; Rs. {it.unit_price.toLocaleString()} × {it.quantity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-obsidian text-sm">
                          Rs. {(it.unit_price * it.quantity).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-ink-400 hover:text-fire p-1"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Payment, Shipping, and Summary */}
          <div>
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-obsidian mb-3 border-b border-ink-100 pb-1 flex items-center gap-1.5">
              <DollarSign size={14}/> 3. Payment & Order Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-ink-600 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full border border-ink-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-obsidian font-semibold"
                  >
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="Card">Online Card / Safepay</option>
                    <option value="Bank Transfer">Direct Bank Transfer</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-ink-600 block mb-1">Shipping Fee (Rs.)</label>
                    <input
                      type="number"
                      min={0}
                      value={shippingFee}
                      onChange={e => setShippingFee(Number(e.target.value) || 0)}
                      className="w-full border border-ink-200 px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:border-obsidian"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-ink-600 block mb-1">Discount (Rs.)</label>
                    <input
                      type="number"
                      min={0}
                      value={discountAmount}
                      onChange={e => setDiscountAmount(Number(e.target.value) || 0)}
                      className="w-full border border-ink-200 px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:border-obsidian"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-ink-600 block mb-1">Internal Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Call before delivery / booked on WhatsApp"
                    value={customerNote}
                    onChange={e => setCustomerNote(e.target.value)}
                    className="w-full border border-ink-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-obsidian"
                  />
                </div>
              </div>

              {/* Financial Box */}
              <div className="bg-ink-50 p-4 border border-ink-200 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between text-ink-600">
                    <span>Items Subtotal ({items.reduce((c, i) => c + i.quantity, 0)} items)</span>
                    <span className="font-mono font-bold">Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-ink-600">
                    <span>Shipping Fee</span>
                    <span className="font-mono font-bold">
                      {shippingFee === 0 ? <span className="text-green-600 font-bold uppercase text-[10px]">FREE</span> : `Rs. ${Number(shippingFee).toLocaleString()}`}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-fire font-bold">
                      <span>Discount</span>
                      <span className="font-mono">-Rs. {Number(discountAmount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                    <span className="font-display text-sm font-black text-gray-900">Net Total to Collect</span>
                    <span className="font-mono text-xl font-black text-fire">
                      Rs. {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || items.length === 0}
                    className="px-6 py-2.5 text-xs font-bold bg-black text-white hover:bg-fire transition-colors disabled:opacity-50 flex items-center gap-2 rounded-lg shadow-sm"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    <span>Confirm & Create Order</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderDetailsDrawer({ order, onClose, onUpdate }) {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState(order.customer_note || "");
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [courierName, setCourierName] = useState(order.courier_name || "");
  const [savingNote, setSavingNote] = useState(false);
  const [refundOrder, setRefundOrder] = useState(null);
  
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);
  const [bookingCourier, setBookingCourier] = useState(false);
  const [courierConfig, setCourierConfig] = useState(null);

  useEffect(() => {
    http.get('/admin/courier/config')
      .then(res => setCourierConfig(res.data?.data || { configured: false }))
      .catch(() => setCourierConfig({ configured: false }));
  }, []);

  const updateStatus = async (newStatus) => {
    setStatus(newStatus);
    setUpdatingStatus(true);
    try {
      await http.patch(`/admin/orders/${order.id}/status`, { status: newStatus, tracking_number: trackingNumber, courier_name: courierName });
      toast.success(`Order status updated to ${newStatus}`);
      onUpdate();
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  const saveTracking = async () => {
    setSavingTracking(true);
    try {
      await http.patch(`/admin/orders/${order.id}/status`, { status, tracking_number: trackingNumber, courier_name: courierName });
      toast.success("Tracking information saved");
      onUpdate();
    } finally {
      setSavingTracking(false);
    }
  };

  const markAsShipped = async () => {
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
      onUpdate();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const markAsDelivered = async () => {
    setUpdatingStatus(true);
    try {
      await http.patch(`/admin/orders/${order.id}/status`, {
        status: 'delivered',
        tracking_number: trackingNumber.trim(),
        courier_name: courierName.trim()
      });
      setStatus('delivered');
      toast.success("Order confirmed as Delivered!");
      onUpdate();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const saveNote = async () => {
    setSavingNote(true);
    await http.patch(`/admin/orders/${order.id}/note`, { note });
    setSavingNote(false);
    toast.success("Internal note saved");
  };

  const bookCourier = async () => {
    setBookingCourier(true);
    try {
      const res = await http.post(`/admin/orders/${order.id}/book-courier`);
      setTrackingNumber(res.data.data.awb);
      setCourierName(res.data.data.courier_name);
      toast.success("Courier booked successfully via API");
      onUpdate();
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
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" }
  ];

  const stepOrder = ["placed", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"];
  const currentStepIdx = stepOrder.indexOf(status);

  // Status history map for milestone timestamps
  const historyMap = {};
  (order.status_history || []).forEach(h => {
    historyMap[h.status] = h.at;
  });

  const getStatusBadge = (st) => {
    switch (st) {
      case 'delivered': return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'shipped': return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'processing': return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'confirmed': return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'placed': return 'bg-sky-50 text-sky-800 border-sky-300';
      case 'cancelled': return 'bg-rose-50 text-rose-800 border-rose-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const trackingPortalUrl = getTrackingPortalUrl(courierName, trackingNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.16 }}
        className="w-full max-w-5xl max-h-[92vh] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header - Clean, High Contrast & Polished */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap justify-between items-center gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono font-black text-xl text-gray-900 tracking-tight">
              #{order.order_number}
            </span>

            {/* Status Badge */}
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getStatusBadge(status)}`}>
              ● {status}
            </span>

            {/* Payment Badge */}
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              order.payment_status === 'paid'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}>
              Payment: {order.payment_status || 'COD'}
            </span>

            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              • Placed on {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2">
            {updatingStatus && <Loader2 size={16} className="animate-spin text-gray-500" />}

            <select
              disabled={updatingStatus}
              value={status}
              onChange={(e) => updateStatus(e.target.value)}
              className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-xs font-bold rounded-lg focus:outline-none focus:ring-1 focus:ring-black shadow-sm"
            >
              {ORDER_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              title="Print Thermal Shipping Label"
            >
              <Printer size={14} /> <span className="hidden sm:inline">Print Slip</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close Modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* At-a-Glance 4-Stat Strip */}
        <div className="bg-gray-50/90 border-b border-gray-200 px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs shrink-0">
          <div>
            <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider block">Total Payable</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-base font-black text-gray-900">{fmt(order.total)}</span>
              <span className="text-[10px] font-bold text-gray-500">({order.payment_method || 'COD'})</span>
            </div>
          </div>
          <div>
            <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider block">Customer</span>
            <span className="font-bold text-gray-900 truncate block mt-0.5">{order.customer_name}</span>
            <span className="text-[10px] text-gray-500 font-mono">{order.customer_phone}</span>
          </div>
          <div>
            <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider block">Logistics Partner</span>
            <span className="font-bold text-gray-900 block font-mono mt-0.5">
              {order.courier_name || 'Unassigned'}
            </span>
            <span className="text-[10px] text-gray-500 font-mono truncate block">
              {trackingNumber ? `AWB: ${trackingNumber}` : 'Pending booking'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider block">Status & Items</span>
            <span className="font-bold text-gray-900 capitalize block mt-0.5">{status}</span>
            <span className="text-[10px] text-gray-500">
              {order.items?.length || 0} sneaker item{order.items?.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Milestone Progress Stepper */}
        {status !== 'cancelled' ? (
          <div className="bg-white border-b border-gray-200 p-4 px-6 shrink-0">
            <div className="max-w-3xl mx-auto flex items-center justify-between relative">
              {/* Connecting background line */}
              <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-gray-200 z-0"></div>

              {STEPS.map((step, idx) => {
                const targetIdx = stepOrder.indexOf(step.key);
                const isPassed = currentStepIdx >= targetIdx;
                const isCurrent = status === step.key;
                const timeStr = historyMap[step.key] ? new Date(historyMap[step.key]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;

                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10 bg-white px-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all border-2 ${
                        isPassed
                          ? "bg-black border-black text-white shadow-sm"
                          : isCurrent
                          ? "bg-fire border-fire text-white shadow-sm ring-4 ring-fire/20"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}
                    >
                      {isPassed ? <Check size={14} /> : idx + 1}
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider mt-1.5 ${isCurrent ? "text-fire font-black" : isPassed ? "text-gray-900" : "text-gray-400"}`}>
                      {step.label}
                    </span>
                    {timeStr && <span className="font-mono text-[10px] text-gray-500">{timeStr}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border-b border-rose-200 p-3 px-6 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={15} /> Order #{order.order_number} has been cancelled.
          </div>
        )}

        {/* Modal Scrollable Body (Balanced 2-Columns) */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          
          {/* Left Column: Items Ordered & Financial Calculation (58% width) */}
          <div className="w-full lg:w-[58%] p-5 sm:p-6 space-y-5 bg-white flex flex-col justify-between">
            <div className="space-y-5">
              
              {/* Sneaker Items Card */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 p-3 px-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-display font-bold uppercase tracking-wider text-xs text-gray-900 flex items-center gap-2">
                    <Package size={15} className="text-fire" /> Ordered Sneakers ({order.items?.length || 0})
                  </h3>
                  <span className="font-mono text-xs text-gray-500 font-medium">
                    Order Ref #{order.order_number}
                  </span>
                </div>

                <div className="divide-y divide-gray-100 p-2">
                  {order.items?.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/70 rounded-lg transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {it.image_url ? (
                          <img src={it.image_url} alt={it.product_name} className="w-16 h-16 object-cover bg-gray-50 rounded-lg border border-gray-200 shrink-0 shadow-sm" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg grid place-items-center text-gray-400 shrink-0 border border-gray-200"><Package size={20}/></div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">{it.product_name}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="bg-black text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded">
                              EU {it.size}
                            </span>
                            <span className="text-gray-500 font-mono text-xs">
                              {fmt(it.unit_price)} × {it.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-sm text-gray-900 block">
                          {fmt(it.unit_price * it.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 sm:p-5 space-y-2.5 text-xs shadow-sm">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-gray-900">{fmt(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Shipping Fee</span>
                  <span className="font-mono font-bold">
                    {order.shipping_fee === 0 ? <span className="text-emerald-700 font-bold uppercase text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded">FREE SHIPPING</span> : fmt(order.shipping_fee)}
                  </span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-fire font-bold">
                    <span>Discount Applied</span>
                    <span className="font-mono">-{fmt(order.discount_amount)}</span>
                  </div>
                )}
                {order.store_credit_used > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Store Credit Used</span>
                    <span className="font-mono">-{fmt(order.store_credit_used)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline text-sm">
                  <div>
                    <span className="font-display font-black text-gray-900 block">Total Due ({order.payment_method || 'COD'})</span>
                    <span className="text-[11px] text-gray-500 font-medium">Cash to collect upon delivery</span>
                  </div>
                  <span className="font-mono text-xl font-black text-fire">{fmt(order.total)}</span>
                </div>
              </div>

              {/* Chronological Status Event Log */}
              {order.status_history?.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-2.5 text-xs shadow-sm">
                  <p className="font-display font-bold uppercase tracking-wider text-[11px] text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <Activity size={14} className="text-fire" /> Order Timeline & Event History
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {order.status_history.map((h, i) => (
                      <div key={i} className="flex justify-between items-start text-xs py-1 border-b border-dashed border-gray-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold uppercase tracking-wider text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{h.status}</span>
                          <span className="text-gray-600">{h.note || 'Status updated'}</span>
                        </div>
                        <span className="font-mono text-[10px] text-gray-400 shrink-0 ml-2">
                          {new Date(h.at).toLocaleDateString()} {new Date(h.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Close Button */}
            <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-100 text-gray-800 transition-colors shadow-sm"
              >
                Close View
              </button>
            </div>
          </div>

          {/* Right Column: Customer Details, Fulfillment & Logistics (42% width) */}
          <div className="w-full lg:w-[42%] p-5 sm:p-6 space-y-5 bg-gray-50/70">
            
            {/* Customer & Address Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-3.5 text-xs">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                <h3 className="font-display font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <Users size={15} className="text-fire" /> Customer & Destination
                </h3>
                <button
                  type="button"
                  onClick={copyCustomerDetails}
                  className="text-[11px] font-bold text-gray-600 hover:text-black flex items-center gap-1 hover:underline"
                  title="Copy full delivery address and details"
                >
                  <Copy size={12} /> Copy All
                </button>
              </div>

              <div>
                <div className="flex justify-between items-baseline">
                  <span className="font-extrabold text-sm text-gray-900">{order.customer_name}</span>
                  <a
                    href={waLink(order.customer_phone, `Hi ${order.customer_name}, update regarding your SOLEKICKS order #${order.order_number}:`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-md text-[11px] shadow-sm transition-colors"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                </div>
                <p className="font-mono text-gray-700 font-bold mt-1">{order.customer_phone}</p>
                {order.customer_email && <p className="text-gray-500 mt-0.5">{order.customer_email}</p>}
              </div>

              <div className="pt-2.5 border-t border-gray-100 text-gray-700 leading-relaxed">
                <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Delivery Address</span>
                <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200 leading-normal">
                  {formatAddress(order.shipping_address)}
                </p>
              </div>

              {order.customer_note && (
                <div className="pt-2 border-t border-gray-100 bg-amber-50 p-3 text-amber-900 text-xs rounded-lg border border-amber-200">
                  <span className="font-bold block text-[11px] uppercase tracking-wider mb-0.5">Special Customer Instructions:</span>
                  {order.customer_note}
                </div>
              )}
            </div>

            {/* Courier & Fulfillment Dispatch Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-3.5 text-xs">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                <h3 className="font-display font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <Truck size={15} className="text-fire" /> Courier & Fulfillment
                </h3>
                {trackingNumber && (
                  <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full">
                    AWB Active
                  </span>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1.5">Select Courier Partner</label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {['TCS', 'Leopards', 'Trax', 'PostEx', 'Call Courier'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCourierName(c)}
                      className={`px-2.5 py-1 text-xs font-bold font-mono rounded-md border transition-all ${
                        courierName.toLowerCase().includes(c.toLowerCase())
                          ? "bg-black text-white border-black shadow-sm"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:border-black hover:text-black"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-white mb-2.5"
                />

                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1.5">Consignment / Tracking Number</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. TCS-7729104 or TR-88219"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-gray-900 focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-white pr-20"
                  />
                  <button
                    type="button"
                    onClick={saveTracking}
                    disabled={savingTracking || updatingStatus}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[11px] rounded border border-gray-300 transition-colors"
                  >
                    {savingTracking ? <Loader2 size={12} className="animate-spin" /> : "Save"}
                  </button>
                </div>

                {/* Direct Link to Official Courier Tracking Portal */}
                {trackingPortalUrl && (
                  <div className="mt-2 text-right">
                    <a
                      href={trackingPortalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Open {courierName} Live Portal <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              {/* Primary Dispatch Action Buttons */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                {status !== 'shipped' && status !== 'delivered' && status !== 'cancelled' && (
                  <button
                    onClick={markAsShipped}
                    disabled={updatingStatus}
                    className="w-full bg-black hover:bg-fire text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-xs uppercase tracking-wider"
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
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-2.5 text-xs">
              <h3 className="font-display font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                <MapPin size={15} className="text-fire" /> Warehouse Staff Note
              </h3>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Private remarks for warehouse staff / packers..."
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-gray-50 min-h-[60px] resize-none text-gray-800"
              />
              <button
                onClick={saveNote}
                disabled={savingNote}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-colors border border-gray-300 shadow-sm"
              >
                {savingNote ? "Saving..." : "Save Staff Note"}
              </button>
            </div>

            {/* Refund Trigger */}
            <button
              onClick={() => setRefundOrder(order)}
              className="w-full py-2.5 border border-fire/40 text-fire rounded-lg text-xs font-bold hover:bg-fire hover:text-white transition-colors bg-white shadow-sm flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={13} /> Initiate Customer Refund
            </button>
          </div>
        </div>
      </motion.div>

      {refundOrder && (
        <RefundModal
          order={refundOrder}
          onClose={() => setRefundOrder(null)}
          onDone={() => {
            setRefundOrder(null);
            onUpdate();
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
  const [data, setData] = useState({ products: [], pagination: {}, stats: {} });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ page: 1, limit: 25, search: "", status: "all", stock: "all", category: "all", brand: "all", price: "all" });
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState([]);
  const [viewProduct, setViewProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

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

  const bulkUpdate = async (action, value = null) => {
    if (!window.confirm(`Are you sure you want to ${action} ${selected.length} products?`)) return;
    try {
      await http.patch("/admin/products/bulk", { productIds: selected, action, value });
      toast.success(`Bulk action completed`);
      setSelected([]);
      load();
    } catch (e) { toast.error("Action failed"); }
  };

  const duplicate = async (id) => {
    try {
      await http.post(`/admin/products/${id}/duplicate`);
      toast.success("Product duplicated (Draft)");
      load();
    } catch (e) { toast.error("Duplication failed"); }
  };
  
  const del = async (id) => {
    if (!window.confirm("Delete product?")) return;
    try {
      await http.patch("/admin/products/bulk", { productIds: [id], action: 'delete' });
      toast.success("Deleted");
      load();
    } catch (e) { toast.error("Delete failed"); }
  };

  const exportCSV = () => {
    if (!data.products.length) return toast.error("No products to export");
    const headers = ["ID", "Name", "SKU", "Category", "Price", "Stock", "Status"];
    const rows = data.products.map(p => [
      p.id, `"${p.name}"`, p.slug, p.category_slug, p.base_price, 
      p.sizes?.reduce((a,b)=>a+b.stock,0) || 0, p.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `products_export_${Date.now()}.csv`;
    link.click();
  };

  const STATS = [
    { label: "Total", count: data.stats?.total || 0, color: "text-obsidian" },
    { label: "Active", count: data.stats?.active || 0, color: "text-green-600" },
    { label: "Low Stock", count: data.stats?.low_stock || 0, color: "text-yellow-600" },
    { label: "Out Stock", count: data.stats?.out_of_stock || 0, color: "text-fire" }
  ];

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-semibold ">Products</h1>
          <p className="text-sm text-ink-500">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-1.5 text-xs font-bold  border border-ink-200 bg-white hover:bg-obsidian hover:text-white transition-colors flex items-center gap-2"><Download size={14}/> Export</button>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-3 py-1.5 text-xs font-bold  bg-obsidian text-white hover:bg-fire transition-colors">+ Add Product</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="bg-white p-4 border border-ink-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-ink-400  tracking-wider">{s.label}</span>
            <span className={`text-2xl font-mono font-black mt-2 ${s.color}`}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 border border-ink-200 mb-6 flex flex-col lg:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 relative w-full">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Search products, SKU..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-ink-200 text-sm focus:border-obsidian focus:outline-none rounded-none" />
        </form>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <select value={query.category} onChange={(e) => setQuery({ ...query, category: e.target.value, page: 1 })} className="border border-ink-200 px-3 py-2 text-sm focus:outline-none rounded-none bg-white">
            <option value="all">Category: All</option>
            <option value="retro">Retro</option>
            <option value="streetwear">Streetwear</option>
            <option value="runners">Runners</option>
            <option value="slides">Slides</option>
          </select>
          <select value={query.status} onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })} className="border border-ink-200 px-3 py-2 text-sm focus:outline-none rounded-none bg-white">
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select value={query.stock} onChange={(e) => setQuery({ ...query, stock: e.target.value, page: 1 })} className="border border-ink-200 px-3 py-2 text-sm focus:outline-none rounded-none bg-white">
            <option value="all">Stock: All</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <select value={query.price} onChange={(e) => setQuery({ ...query, price: e.target.value, page: 1 })} className="border border-ink-200 px-3 py-2 text-sm focus:outline-none rounded-none bg-white">
            <option value="all">Price: All</option>
            <option value="under_50">Under 50</option>
            <option value="50_100">50 - 100</option>
            <option value="100_500">100 - 500</option>
          </select>
          <button onClick={resetFilters} className="text-sm font-bold text-ink-500 hover:text-fire  px-3 py-2">Reset</button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-obsidian text-white p-3 flex justify-between items-center mb-4 sticky top-0 z-10 shadow-lg">
          <span className="font-bold text-sm">{selected.length} products selected</span>
          <div className="flex gap-2">
            <button onClick={() => bulkUpdate('status', 'active')} className="px-3 py-1.5 text-xs font-bold  bg-white/10 hover:bg-green-600 transition-colors">Activate</button>
            <button onClick={() => bulkUpdate('status', 'draft')} className="px-3 py-1.5 text-xs font-bold  bg-white/10 hover:bg-yellow-600 transition-colors">Deactivate</button>
            <button onClick={() => bulkUpdate('delete')} className="px-3 py-1.5 text-xs font-bold  bg-white/10 hover:bg-fire transition-colors">Delete</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-ink-200 overflow-x-auto min-h-[400px]">
        {loading ? <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></div></div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-ink-100 font-mono text-[10px]  text-ink-500">
              <tr>
                <th className="p-3 w-10"><input type="checkbox" checked={data.products?.length > 0 && selected.length === data.products?.length} onChange={selectAll} className="accent-obsidian" /></th>
                <th className="p-3">Product</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">⋮</th>
              </tr>
            </thead>
            <tbody>
              {!data.products || data.products.length === 0 ? <tr><td colSpan="8" className="p-10 text-center text-ink-400">No products found.</td></tr> : data.products.map(p => {
                const stock = p.sizes?.reduce((a,b)=>a+b.stock,0) || 0;
                return (
                  <tr key={p.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50 cursor-pointer" onClick={() => setViewProduct(p)}>
                    <td className="p-3" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} className="accent-obsidian" /></td>
                    <td className="p-3 flex items-center gap-3">
                      <img src={p.images?.[0] || 'https://via.placeholder.com/50'} className="w-10 h-10 object-cover border border-ink-200" alt=""/>
                      <span className="font-bold">{p.name}</span>
                    </td>
                    <td className="p-3 font-mono text-xs text-ink-500">{p.slug}</td>
                    <td className="p-3 capitalize">{p.category_slug}</td>
                    <td className="p-3 font-mono font-bold">{fmt(p.base_price)}</td>
                    <td className="p-3 text-center">
                      <span className={`font-mono font-bold ${stock === 0 ? 'text-fire' : stock < 10 ? 'text-yellow-600' : 'text-obsidian'}`}>{stock}</span>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold  tracking-wider px-2 py-0.5 ${p.status==='active'?'bg-green-100 text-green-700':p.status==='draft'?'bg-yellow-100 text-yellow-700':'bg-ink-100 text-ink-500'}`}>{p.status}</span>
                    </td>
                    <td className="p-3 text-center relative group" onClick={e => e.stopPropagation()}>
                      <button className="p-1 text-ink-400 hover:text-obsidian"><MoreVertical size={16}/></button>
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-ink-200 shadow-xl hidden group-hover:block z-20 text-left">
                        <button onClick={() => setViewProduct(p)} className="w-full px-4 py-2 text-xs hover:bg-ink-100 text-left flex items-center gap-2"><Eye size={14}/> View Product</button>
                        <button onClick={() => { setEditing(p); setShowForm(true); }} className="w-full px-4 py-2 text-xs hover:bg-ink-100 text-left flex items-center gap-2"><Edit size={14}/> Edit Product</button>
                        <button onClick={() => duplicate(p.id)} className="w-full px-4 py-2 text-xs hover:bg-ink-100 text-left flex items-center gap-2"><Copy size={14}/> Duplicate</button>
                        <button onClick={() => bulkUpdate('status', p.status === 'active' ? 'draft' : 'active')} className="w-full px-4 py-2 text-xs hover:bg-ink-100 text-left flex items-center gap-2"><Activity size={14}/> {p.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                        <button onClick={() => del(p.id)} className="w-full px-4 py-2 text-xs hover:bg-fire hover:text-white text-fire text-left flex items-center gap-2 border-t border-ink-100"><Trash2 size={14}/> Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data.pagination?.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-ink-500">Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.totalCount} products)</div>
          <div className="flex gap-1">
            <button disabled={query.page === 1} onClick={() => setQuery({...query, page: query.page - 1})} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Prev</button>
            <button disabled={query.page === data.pagination.totalPages} onClick={() => setQuery({...query, page: query.page + 1})} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Next</button>
          </div>
        </div>
      )}

      {showForm && <ProductForm product={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
      {viewProduct && <ProductDetailsDrawer product={viewProduct} onClose={() => setViewProduct(null)} onEdit={() => { setViewProduct(null); setEditing(viewProduct); setShowForm(true); }} onUpdate={load} />}
    </div>
  );
}


function ProductDetailsDrawer({ product, onClose, onEdit, onUpdate }) {
  const stock = product.sizes?.reduce((a,b)=>a+b.stock,0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/30 backdrop-blur-sm p-4 md:p-6 lg:p-10" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
        className="w-[95vw] h-[95vh] bg-ink-100 overflow-y-auto flex flex-col shadow-2xl rounded-xl" onClick={e => e.stopPropagation()}>
        
        <div className="bg-white border-b border-ink-200 p-6 flex justify-between items-start sticky top-0 z-10">
          <div>
            <h2 className="font-display font-semibold text-2xl flex items-center gap-3">
              {product.name}
              <span className={`text-[10px] font-bold  tracking-wider px-2 py-1 align-middle ${product.status==='active'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{product.status}</span>
            </h2>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={onEdit} className="px-3 py-1.5 border border-ink-200 hover:bg-ink-100 text-xs font-bold  flex items-center gap-2"><Edit size={14}/> Edit</button>
            <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20}/></button>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-ink-200 p-6">
              <img src={product.images?.[0] || 'https://via.placeholder.com/400'} className="w-full aspect-square object-cover border border-ink-200 mb-4" alt=""/>
              <div className="grid grid-cols-4 gap-2">
                {product.images?.slice(1, 5).map((img, i) => (
                  <img key={i} src={img} className="w-full aspect-square object-cover border border-ink-200" alt=""/>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-ink-200 p-6 space-y-4">
                <h3 className="font-display font-semibold mb-2  text-sm tracking-wider text-ink-500">Product Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-ink-500 block text-xs">SKU</span><span className="font-mono">{product.slug}</span></div>
                  <div><span className="text-ink-500 block text-xs">Category</span><span className="capitalize">{product.category_slug}</span></div>
                  <div><span className="text-ink-500 block text-xs">Brand</span><span className="capitalize">{product.brand_slug}</span></div>
                  <div><span className="text-ink-500 block text-xs">Stock</span><span className="font-mono">{stock}</span></div>
                </div>
                <hr className="border-ink-100 my-4"/>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-ink-500 block text-xs">Price</span><span className="font-mono text-lg font-bold">{fmt(product.base_price)}</span></div>
                  {product.compare_at_price && <div><span className="text-ink-500 block text-xs">Compare At</span><span className="font-mono line-through">{fmt(product.compare_at_price)}</span></div>}
                </div>
              </div>
              
              <div className="bg-white border border-ink-200 p-6">
                 <h3 className="font-display font-semibold mb-4  text-sm tracking-wider text-ink-500">Variants (Size / Stock)</h3>
                 <table className="w-full text-sm">
                   <thead className="bg-ink-50"><tr><th className="p-2 text-left text-xs  text-ink-500">Size</th><th className="p-2 text-right text-xs  text-ink-500">Stock</th></tr></thead>
                   <tbody>
                     {product.sizes?.map((s,i) => (
                       <tr key={i} className="border-t border-ink-100">
                         <td className="p-2 font-mono">EU {s.size}</td>
                         <td className="p-2 text-right font-mono font-bold">{s.stock}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


function MultiImageInput({ images, onChange }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const dragIdx = useRef(null);
  const addFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      const urls = [];
      for (const file of files) urls.push(await uploadImage(file));
      onChange([...images, ...urls]);
      toast.success(`${urls.length} photo(s) added`);
    } catch { toast.error("Upload failed"); }
    setBusy(false);
    e.target.value = "";
  };
  const addUrl = () => { if (url.trim()) { onChange([...images, url.trim()]); setUrl(""); } };
  const remove = (i) => onChange(images.filter((_, idx) => idx !== i));
  const reorder = (from, to) => {
    if (from === to || from == null) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };
  return (
    <div data-testid="admin-product-gallery">
      <div className="flex items-center justify-between mb-2">
        <label className="font-display text-xs tracking-wide text-ink-500">Product Gallery <span className="text-ink-400 normal-case font-normal">· drag to reorder · first = cover</span></label>
        <label data-testid="admin-product-gallery-upload" className="flex items-center gap-1.5 bg-obsidian text-white text-xs font-bold  px-3 py-2 rounded-none cursor-pointer hover:bg-fire transition-colors">
          <Upload size={14} /> {busy ? "Uploading…" : "Upload"}
          <input type="file" accept="image/*" multiple onChange={addFiles} className="hidden" />
        </label>
      </div>
      {images.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-2">
          {images.map((im, i) => (
            <div
              key={`${im}-${i}`}
              draggable
              onDragStart={() => { dragIdx.current = i; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { reorder(dragIdx.current, i); dragIdx.current = null; }}
              data-testid={`admin-gallery-thumb-${i}`}
              className="relative group aspect-square rounded-none overflow-hidden border-2 border-ink-200 cursor-grab active:cursor-grabbing"
            >
              <img src={im} alt="" className="h-full w-full object-cover pointer-events-none" />
              {i === 0 && <span className="absolute top-0.5 left-0.5 bg-fire text-white text-[8px] font-bold  px-1 rounded">Cover</span>}
              <button type="button" onClick={() => remove(i)} data-testid={`admin-gallery-remove-${i}`} className="absolute top-0.5 right-0.5 h-5 w-5 grid place-items-center rounded-none bg-obsidian/80 text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><X size={11} /></button>
              <span className="absolute bottom-0.5 right-1 text-white text-[9px] font-mono font-bold drop-shadow">{i + 1}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-ink-400 text-xs mb-2 border border-dashed border-ink-200 rounded-none py-4 text-center">No photos yet — upload or paste a URL below.</p>
      )}
      <div className="flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())} placeholder="Paste image URL…" className="flex-1 border border-ink-200 rounded-none px-4 py-2 outline-none focus:border-obsidian text-sm" />
        <button type="button" onClick={addUrl} className="border border-ink-200 text-xs font-bold  px-3 rounded-none hover:border-obsidian">Add</button>
      </div>
    </div>
  );
}

function ProductForm({ product, onClose, onSaved }) {
  const isEdit = !!product?.id;
  const [f, setF] = useState({
    name: product?.name || "", category_slug: product?.category_slug || "retro",
    brand_slug: product?.brand_slug || "airvault", base_price: product?.base_price || "",
    cost_price: product?.cost_price || "",
    compare_at_price: product?.compare_at_price || "", flash_sale_price: product?.flash_sale_price || "",
    description: product?.description || "",
    is_new_arrival: product?.is_new_arrival ?? true, is_best_seller: product?.is_best_seller ?? false,
    is_flash_sale: product?.is_flash_sale ?? false, is_featured: product?.is_featured ?? false,
    status: product?.status || "active",
  });
  const [images, setImages] = useState(product?.images?.filter(Boolean) || []);
  
  const defaultSizes = ["39", "40", "41", "42", "43", "44", "45"].map(s => ({ size: s, stock: 5 }));
  const [sizes, setSizes] = useState(product?.sizes?.map(s => ({ id: s.id, size: s.size, stock: s.stock })) || defaultSizes);
  
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  
  const save = async (statusOverride = null) => {
    if (!f.name || !f.base_price) return toast.error("Name and price required");
    if (images.length === 0) return toast.error("Add at least one photo");
    setSaving(true);
    const payload = {
      name: f.name, category_slug: f.category_slug, brand_slug: f.brand_slug,
      base_price: Number(f.base_price), cost_price: f.cost_price ? Number(f.cost_price) : 0, 
      compare_at_price: f.compare_at_price ? Number(f.compare_at_price) : null,
      flash_sale_price: f.flash_sale_price ? Number(f.flash_sale_price) : null,
      description: f.description || f.name, images, hover_image: images[1] || images[0],
      sizes,
      is_new_arrival: f.is_new_arrival, is_best_seller: f.is_best_seller, is_flash_sale: f.is_flash_sale, is_featured: f.is_featured,
      status: statusOverride || f.status,
    };
    try {
      if (isEdit) {
        await http.patch(`/admin/products/${product.id}`, payload);
        toast.success("Product updated");
      } else {
        payload.slug = f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36).slice(-4);
        await http.post("/admin/products", payload);
        toast.success("Product added");
      }
      onSaved();
    } catch (e) { toast.error(e.response?.data?.detail || "Save failed"); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 md:p-8" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} 
        className="bg-ink-50 w-full max-w-5xl h-[95vh] flex flex-col shadow-2xl rounded-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-white border-b border-ink-200 p-6 flex justify-between items-center shrink-0">
          <h2 className="font-display font-semibold text-2xl  tracking-tight">{isEdit ? "Edit Product" : "Add Product"}</h2>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire hover:bg-fire/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              
              {/* Basic Info */}
              <div className="bg-white border border-ink-200 p-6 space-y-4">
                <h3 className="font-display font-semibold flex items-center gap-2 mb-4  text-sm tracking-wider text-ink-500">Basic Information</h3>
                <div>
                  <label className="block text-xs font-bold text-ink-500  mb-1">Product Name</label>
                  <input placeholder="e.g. Nike Air Max 270" value={f.name} onChange={set("name")} className="w-full border border-ink-200 rounded-none px-4 py-2.5 outline-none focus:border-obsidian font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-500  mb-1">Description</label>
                  <textarea placeholder="Product description..." value={f.description} onChange={set("description")} rows={4} className="w-full border border-ink-200 rounded-none px-4 py-2.5 outline-none focus:border-obsidian" />
                </div>
              </div>

              {/* Images */}
              <div className="bg-white border border-ink-200 p-6">
                <MultiImageInput images={images} onChange={setImages} />
              </div>

              {/* Variants / Inventory */}
              <div className="bg-white border border-ink-200 p-6 space-y-4">
                <h3 className="font-display font-semibold flex items-center gap-2 mb-4  text-sm tracking-wider text-ink-500">Inventory (Sizes)</h3>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                  {sizes.map((s, i) => (
                    <div key={i} className="text-center border border-ink-100 p-2 bg-ink-50">
                      <div className="text-[10px] font-bold text-ink-500  mb-2 bg-ink-200 px-1 py-0.5 inline-block">EU {s.size}</div>
                      <input type="number" min="0" value={s.stock} onChange={(e) => {
                        const next = [...sizes];
                        next[i] = { ...next[i], stock: Number(e.target.value) };
                        setSizes(next);
                      }} className="w-full border border-ink-200 rounded-none px-1 py-1 text-center outline-none focus:border-obsidian text-sm font-mono font-bold bg-white" />
                    </div>
                  ))}
                </div>
              </div>
              
            </div>

            <div className="space-y-6">
              {/* Organization */}
              <div className="bg-white border border-ink-200 p-6 space-y-4">
                <h3 className="font-display font-semibold flex items-center gap-2 mb-4  text-sm tracking-wider text-ink-500">Organization</h3>
                <div>
                  <label className="block text-xs font-bold text-ink-500  mb-1">Category</label>
                  <select value={f.category_slug} onChange={set("category_slug")} className="w-full border border-ink-200 rounded-none px-4 py-2.5 bg-white capitalize"><option value="retro">Retro</option><option value="streetwear">Streetwear</option><option value="runners">Runners</option><option value="slides">Slides</option></select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-500  mb-1">Brand</label>
                  <select value={f.brand_slug} onChange={set("brand_slug")} className="w-full border border-ink-200 rounded-none px-4 py-2.5 bg-white capitalize"><option value="airvault">AirVault</option><option value="terrace-co">Terrace Co</option><option value="cloudstride">CloudStride</option><option value="oasis">Oasis</option></select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-500  mb-1">Status</label>
                  <select value={f.status} onChange={set("status")} className="w-full border border-ink-200 rounded-none px-4 py-2.5 bg-white capitalize font-bold text-obsidian"><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white border border-ink-200 p-6 space-y-4">
                <h3 className="font-display font-semibold flex items-center gap-2 mb-4  text-sm tracking-wider text-ink-500">Pricing</h3>
                <div>
                  <label className="block text-xs font-bold text-ink-500  mb-1">Base Price</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 font-mono">$</span><input type="number" value={f.base_price} onChange={set("base_price")} className="w-full pl-7 pr-4 py-2.5 border border-ink-200 outline-none focus:border-obsidian font-mono font-bold" /></div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-500  mb-1">Compare At Price</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 font-mono">$</span><input type="number" value={f.compare_at_price} onChange={set("compare_at_price")} className="w-full pl-7 pr-4 py-2.5 border border-ink-200 outline-none focus:border-obsidian font-mono" /></div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-500  mb-1">Cost Price (COGS)</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 font-mono">$</span><input type="number" value={f.cost_price} onChange={set("cost_price")} className="w-full pl-7 pr-4 py-2.5 border border-ink-200 outline-none focus:border-obsidian font-mono" /></div>
                </div>
              </div>

              {/* Tags/Flags */}
              <div className="bg-white border border-ink-200 p-6 space-y-3">
                <h3 className="font-display font-semibold flex items-center gap-2 mb-4  text-sm tracking-wider text-ink-500">Storefront Tags</h3>
                {[["is_new_arrival", "New Arrival"], ["is_best_seller", "Best Seller"], ["is_flash_sale", "Flash Sale"], ["is_featured", "Featured"]].map(([k, l]) => (
                  <label key={k} className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} className="accent-obsidian w-4 h-4" /> <span className="text-sm font-bold">{l}</span></label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-ink-50 border-t border-ink-200 px-8 py-5 flex items-center justify-between sticky bottom-0 z-10">
          <button onClick={onClose} className="text-ink-500 font-bold  text-xs hover:text-obsidian transition-colors">Cancel</button>
          <div className="flex gap-3">
            <button onClick={() => save('draft')} disabled={saving} className="px-6 py-3 border border-obsidian font-bold  text-xs hover:bg-ink-100 transition-colors disabled:opacity-70 disabled:cursor-wait text-obsidian flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save Draft
            </button>
            <button onClick={() => save('active')} disabled={saving} className="px-6 py-3 bg-obsidian text-white font-bold  text-xs hover:bg-fire transition-colors disabled:opacity-70 disabled:cursor-wait flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null} Publish Product
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}



function Coupons() {
  const [data, setData] = useState({ coupons: [], pagination: {}, stats: {} });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ page: 1, limit: 25, search: "", status: "all", type: "all" });
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState([]);
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
        <button onClick={() => setShowCreate(true)} className="bg-obsidian text-white font-bold  px-4 py-2 hover:bg-fire transition-colors flex items-center gap-2"><Plus size={16}/> Create Coupon</button>
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
                  <td className="p-3 text-center relative group" onClick={e => e.stopPropagation()}>
                    <button className="p-1 text-ink-400 hover:text-obsidian"><MoreVertical size={16}/></button>
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-ink-200 shadow-xl hidden group-hover:block z-20 text-left">
                      <button onClick={() => setViewCoupon(c)} className="w-full px-4 py-2 text-xs hover:bg-ink-100 text-left flex items-center gap-2"><Eye size={14}/> View</button>
                      <button onClick={() => toggleStatus(c.id, !c.is_active)} className="w-full px-4 py-2 text-xs hover:bg-ink-100 text-left flex items-center gap-2"><Trash2 size={14}/> {c.is_active ? 'Disable' : 'Enable'}</button>
                    </div>
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
            <button disabled={query.page === 1} onClick={() => setQuery({...query, page: query.page - 1})} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Prev</button>
            <button disabled={query.page === data.pagination.totalPages} onClick={() => setQuery({...query, page: query.page + 1})} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Next</button>
          </div>
        </div>
      )}

      {showCreate && <CreateCouponForm onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {viewCoupon && <CouponDetailsDrawer coupon={viewCoupon} onClose={() => setViewCoupon(null)} />}
    </div>
  );
}

function CreateCouponForm({ onClose, onCreated }) {
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
    { label: "$10 Off", set: { type: "flat", value: "10" } },
    { label: "Free Shipping", set: { type: "percentage", value: "100" } }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-obsidian/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.2 }}
        className="w-full max-w-lg bg-ink-50 h-full overflow-y-auto flex flex-col shadow-2xl border-l border-ink-200" onClick={e => e.stopPropagation()}>
        
        <div className="bg-white border-b border-ink-200 p-6 flex justify-between items-center sticky top-0 z-10">
          <h2 className="font-display font-semibold text-xl ">Create Coupon</h2>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div className="flex gap-2 flex-wrap">
            {presets.map(p => (
              <button key={p.label} type="button" onClick={() => setF({...f, ...p.set})} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-100 text-xs font-bold  transition-colors">{p.label}</button>
            ))}
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Basic Information</h3>
            <div>
              <label className="block text-xs font-bold text-ink-500  mb-1">Coupon Code</label>
              <input type="text" placeholder="e.g. SUMMER20" value={f.code} onChange={e => setF({...f, code: e.target.value.toUpperCase().replace(/\s/g, '')})} className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian font-mono " />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-500  mb-1">Discount Type</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setF({...f, type: 'percentage'})} className={`flex-1 py-2 text-sm font-bold border ${f.type==='percentage'?'bg-obsidian text-white border-obsidian':'bg-white text-ink-500 border-ink-200'}`}>%</button>
                  <button type="button" onClick={() => setF({...f, type: 'flat'})} className={`flex-1 py-2 text-sm font-bold border ${f.type==='flat'?'bg-obsidian text-white border-obsidian':'bg-white text-ink-500 border-ink-200'}`}>$</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-500  mb-1">Value</label>
                <input type="number" placeholder="e.g. 20" value={f.value} onChange={e => setF({...f, value: e.target.value})} className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Usage Restrictions</h3>
            
            <div>
              <label className="block text-xs font-bold text-ink-500  mb-1">Minimum Order Amount</label>
              <input type="number" placeholder="e.g. 50" value={f.min_order_value} onChange={e => setF({...f, min_order_value: e.target.value})} className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-ink-500  mb-1">Total Usage Limit (Leave blank for unlimited)</label>
              <input type="number" placeholder="e.g. 1000" value={f.max_uses} onChange={e => setF({...f, max_uses: e.target.value})} className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian" />
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Validity</h3>
            <div>
              <label className="block text-xs font-bold text-ink-500  mb-1">Expiry Date & Time (Leave blank to never expire)</label>
              <input type="datetime-local" value={f.expires_at} onChange={e => setF({...f, expires_at: e.target.value})} className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian" />
            </div>
          </div>

          <div className="bg-ink-100 p-4 text-xs text-ink-500 border border-ink-200">
            <strong>Note:</strong> Advanced rules (Category exclusions, user grouping) are managed at the Promotion level, not Coupon level, per architectural design.
          </div>

        </div>

        <div className="bg-ink-50 border-t border-ink-200 p-6 flex justify-end gap-3 sticky bottom-0">
          <button onClick={onClose} className="px-6 py-2 border border-ink-200 text-ink-600 text-sm font-bold  hover:bg-ink-100 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving} className="px-6 py-2 bg-obsidian text-white text-sm font-bold  hover:bg-fire transition-colors disabled:opacity-70 disabled:cursor-wait flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : null} Create Coupon
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CouponDetailsDrawer({ coupon, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http.get(`/admin/coupons/${coupon.id}`).then((res) => {
      setData(res.data.data);
      setLoading(false);
    });
  }, [coupon.id]);

  if (!data && loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-8 h-8 border-4 border-obsidian border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-obsidian/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.2 }}
        className="w-full max-w-2xl bg-ink-50 h-full overflow-y-auto flex flex-col shadow-2xl border-l border-ink-200" onClick={e => e.stopPropagation()}>
        
        <div className="bg-white border-b border-ink-200 p-6 flex justify-between items-start sticky top-0 z-10">
          <div>
            <h2 className="font-mono font-bold text-3xl  flex items-center gap-3">
              {data.code}
              {data.status === 'active' && <span className="text-xs font-bold  px-2 py-1 bg-green-100 text-green-700 flex items-center w-fit gap-1 align-middle tracking-wider"><div className="w-2 h-2 rounded-full bg-green-600"></div> Active</span>}
              {data.status === 'disabled' && <span className="text-xs font-bold  px-2 py-1 bg-ink-200 text-ink-600 flex items-center w-fit gap-1 align-middle tracking-wider"><div className="w-2 h-2 rounded-full bg-ink-500"></div> Disabled</span>}
              {data.status === 'expired' && <span className="text-xs font-bold  px-2 py-1 bg-red-100 text-red-700 flex items-center w-fit gap-1 align-middle tracking-wider"><div className="w-2 h-2 rounded-full bg-red-600"></div> Expired</span>}
            </h2>
            <p className="text-sm text-ink-500 font-bold mt-1 bg-ink-100 w-fit px-2 py-0.5 rounded">{data.type === 'percentage' ? `${data.value}% OFF` : `${fmt(data.value)} OFF`}</p>
          </div>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-ink-200 p-4 text-center">
              <span className="block text-[10px] font-bold text-ink-400  mb-1">Redemptions</span>
              <span className="font-mono text-xl font-bold">{data.used_count}</span>
            </div>
            <div className="bg-white border border-ink-200 p-4 text-center">
              <span className="block text-[10px] font-bold text-ink-400  mb-1">Usage Limit</span>
              <span className="font-mono text-xl font-bold">{data.max_uses || '∞'}</span>
            </div>
            <div className="bg-white border border-ink-200 p-4 text-center">
              <span className="block text-[10px] font-bold text-ink-400  mb-1">Discount Given</span>
              <span className="font-mono text-xl font-bold text-fire">{fmt(data.total_discount)}</span>
            </div>
            <div className="bg-white border border-ink-200 p-4 text-center">
              <span className="block text-[10px] font-bold text-ink-400  mb-1">Revenue Generated</span>
              <span className="font-mono text-xl font-bold text-green-700">{fmt(data.revenue_generated)}</span>
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Recent Usage</h3>
            {data.recent_usage?.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="bg-ink-50 text-[10px]  text-ink-500"><tr><th className="p-2">Customer</th><th className="p-2">Order</th><th className="p-2 text-right">Discount</th><th className="p-2">Date</th></tr></thead>
                <tbody>
                  {data.recent_usage.map(o => (
                    <tr key={o.id} className="border-b border-ink-100 last:border-0">
                      <td className="p-2 font-bold">{o.customer_name}</td>
                      <td className="p-2 font-mono">{o.order_number}</td>
                      <td className="p-2 text-right font-mono font-bold text-fire">-{fmt(o.discount_amount)}</td>
                      <td className="p-2 text-ink-500 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-sm text-ink-400">No usage yet.</p>}
          </div>

        </div>
      </motion.div>
    </div>
  );
}



function Reviews() {
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
      const res = await http.get(`/admin/reviews?page=${page}&search=${search}&status=${status}&rating=${ratingFilter}`);
      setData(res.data.data);
    } catch (err) {
      toast.error("Failed to load reviews");
    }
    setLoading(false);
  };

  const fetchProductRatings = async () => {
    try {
      const res = await http.get('/admin/reviews/products');
      setProductsData(res.data.data);
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
    } catch (err) {
      toast.error("Failed to update review");
    }
  };
  
  const sendReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      await http.patch(`/admin/reviews/${id}`, { admin_reply: replyText, status: 'approved' }); // also approve if replying
      toast.success("Reply submitted");
      if (viewReview && viewReview.id === id) setViewReview({ ...viewReview, admin_reply: replyText, status: 'approved' });
      fetchReviews();
    } catch (err) {
      toast.error("Failed to send reply");
    }
  };

  const statCards = [
    { label: "Total Reviews", value: data?.stats?.total || 0 },
    { label: "Pending Reviews", value: data?.stats?.pending || 0, alert: data?.stats?.pending > 0 },
    { label: "Average Rating", value: `${data?.stats?.average || 0} ★` },
    { label: "Positive Reviews", value: data?.stats?.positive || 0, sub: `${data?.stats?.positivePercent || 0}%` },
    { label: "Negative Reviews", value: data?.stats?.negative || 0, sub: `${data?.stats?.negativePercent || 0}%` }
  ];

  const renderStars = (rating) => {
    return Array.from({length: 5}).map((_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-ink-200'}`}>★</span>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-obsidian">Reviews</h1>
          <p className="text-ink-500 mt-1">Manage customer reviews, ratings and feedback.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white p-4 border border-ink-200 shadow-sm relative overflow-hidden group hover:border-fire transition-colors">
            <div className="text-xs font-bold  tracking-wider text-ink-500 mb-2">{s.label}</div>
            <div className="text-2xl lg:text-3xl font-display font-semibold flex items-baseline gap-2">
              {s.value}
              {s.sub && <span className="text-xs text-ink-400 font-normal">{s.sub}</span>}
            </div>
            {s.alert && <div className="absolute top-4 right-4 text-amber-500"><AlertTriangle size={16} /></div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border border-ink-200 p-6">
          <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 mb-6">Rating Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(star => {
              const count = data?.stats?.ratingDist?.[star] || 0;
              const total = data?.stats?.total || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <div className="flex text-yellow-400 w-16">
                    {Array.from({length: 5}).map((_, i) => <span key={i}>{i < star ? '★' : '☆'}</span>)}
                  </div>
                  <div className="flex-1 h-2 bg-ink-100 overflow-hidden">
                    <div className={`h-full ${star >= 4 ? 'bg-green-500' : star === 3 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="w-8 text-right font-bold text-ink-600">{count}</div>
                  <div className="w-8 text-right text-ink-400 text-xs">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-ink-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500">Review Trend</h3>
            <div className="flex gap-2">
              <button onClick={() => setChartMode('count')} className={`px-2 py-1 text-xs font-bold ${chartMode === 'count' ? 'bg-ink-100 text-obsidian' : 'text-ink-400 hover:bg-ink-50'}`}>Volume</button>
              <button onClick={() => setChartMode('avgRating')} className={`px-2 py-1 text-xs font-bold ${chartMode === 'avgRating' ? 'bg-ink-100 text-obsidian' : 'text-ink-400 hover:bg-ink-50'}`}>Average Rating</button>
            </div>
          </div>
          <div className="h-48 w-full">
            {data?.chartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.chartData}>
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} domain={chartMode === 'avgRating' ? [0, 5] : ['auto', 'auto']} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 0, border: '1px solid #e5e5e5' }} />
                  <Line type="monotone" dataKey={chartMode === 'count' ? 'count' : 'avgRating'} stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-ink-400">No data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-ink-200">
        <div className="p-4 border-b border-ink-100 flex flex-col lg:flex-row gap-4 justify-between items-center bg-ink-50/50">
          <div className="flex gap-4 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 hide-scrollbar">
            {['all', 'pending', 'approved', 'rejected', 'reported'].map(s => (
              <button 
                key={s} 
                onClick={() => { setStatus(s); setPage(1); }}
                className={`whitespace-nowrap px-4 py-2 text-sm font-bold capitalize transition-colors ${status === s ? 'text-fire border-b-2 border-fire' : 'text-ink-500 hover:text-obsidian'}`}
              >
                {s} {s === 'pending' && data?.stats?.pending > 0 && <span className="ml-2 bg-fire text-white text-[10px] px-2 py-0.5 rounded-full">{data?.stats?.pending}</span>}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-b border-ink-100 flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type="text" placeholder="Search by customer name or review text..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-ink-200 text-sm focus:outline-none focus:border-fire transition-colors" />
            </div>
            <button type="submit" className="bg-obsidian text-white px-6 py-2 text-sm font-bold hover:bg-fire transition-colors">Search</button>
          </form>
          <div className="flex gap-2">
            <select value={ratingFilter} onChange={e => { setRatingFilter(Number(e.target.value)); setPage(1); }} className="bg-white border border-ink-200 px-4 py-2 text-sm focus:outline-none focus:border-fire appearance-none font-bold">
              <option value={0}>All Ratings</option>
              <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
              <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
              <option value={3}>⭐⭐⭐ 3 Stars</option>
              <option value={2}>⭐⭐ 2 Stars</option>
              <option value={1}>⭐ 1 Star</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-50 text-ink-500 font-display  tracking-wider text-xs">
              <tr>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Review</th>
                <th className="p-4 font-semibold">Product</th>
                <th className="p-4 font-semibold">Rating</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-ink-400"><RotateCcw className="animate-spin mx-auto mb-2 opacity-50" /> Loading reviews...</td></tr>
              ) : data?.reviews?.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-ink-400">No reviews found matching criteria.</td></tr>
              ) : (
                data?.reviews?.map(r => (
                  <tr key={r.id} className="hover:bg-ink-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-obsidian">{r.customer_name}</div>
                      {r.order_id && <div className="text-[10px]  font-bold text-green-600 flex items-center gap-1 mt-1"><CheckCircle size={10}/> Verified</div>}
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="text-obsidian font-medium truncate">{r.comment || "No comment provided"}</div>
                      {r.admin_reply && <div className="text-xs text-ink-400 mt-1 flex items-center gap-1"><MessageCircle size={12}/> Replied</div>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {r.product?.image_url ? (
                           <img src={imgUrl(r.product.image_url)} alt="" className="w-8 h-8 object-cover border border-ink-100" />
                        ) : (
                           <div className="w-8 h-8 bg-ink-100 border border-ink-200"></div>
                        )}
                        <span className="text-xs font-bold text-ink-600 truncate max-w-[120px]">{r.product?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">{renderStars(r.rating)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] font-bold  tracking-wider ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'pending' ? 'bg-amber-100 text-amber-700' : r.status === 'reported' ? 'bg-red-100 text-red-700' : 'bg-ink-200 text-ink-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-ink-500 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right relative">
                      <button onClick={() => setViewReview(r)} className="text-ink-400 hover:text-obsidian p-2"><MoreVertical size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-ink-100 flex items-center justify-between text-sm">
          <div className="text-ink-500">
            Showing <span className="font-bold text-obsidian">{((data?.pagination?.page - 1) * data?.pagination?.limit) + (data?.reviews?.length > 0 ? 1 : 0)}</span> to <span className="font-bold text-obsidian">{((data?.pagination?.page - 1) * data?.pagination?.limit) + data?.reviews?.length}</span> of <span className="font-bold text-obsidian">{data?.pagination?.totalCount}</span> reviews
          </div>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-ink-200 hover:bg-ink-50 disabled:opacity-50 font-bold">&larr;</button>
            <button disabled={page === data?.pagination?.totalPages || data?.pagination?.totalPages === 0} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-ink-200 hover:bg-ink-50 disabled:opacity-50 font-bold">&rarr;</button>
          </div>
        </div>
      </div>

      {/* Product Rating Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white border border-ink-200 p-6">
          <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 mb-6 flex items-center gap-2"><Star size={16} className="text-yellow-500"/> Products With Best Ratings</h3>
          <div className="space-y-4">
            {productsData.best?.map((p, i) => (
              <div key={p.id} className="flex justify-between items-center border-b border-ink-100 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-ink-300 font-display font-bold w-4">{i+1}.</span>
                  <span className="font-bold text-sm text-obsidian truncate max-w-[200px]">{p.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-yellow-500 flex items-center gap-1">★ {p.avg}</span>
                  <span className="text-ink-400 text-xs w-20 text-right">{p.total} reviews</span>
                </div>
              </div>
            ))}
            {(!productsData.best || productsData.best.length === 0) && <div className="text-sm text-ink-400">Not enough data to rank products.</div>}
          </div>
        </div>
        
        <div className="bg-white border border-ink-200 p-6">
          <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 mb-6 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500"/> Products Needing Attention</h3>
          <div className="space-y-4">
            {productsData.attention?.map((p, i) => (
              <div key={p.id} className="flex justify-between items-center border-b border-ink-100 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-ink-300 font-display font-bold w-4">{i+1}.</span>
                  <span className="font-bold text-sm text-obsidian truncate max-w-[200px]">{p.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-red-500 flex items-center gap-1">★ {p.avg}</span>
                  <span className="text-ink-400 text-xs w-20 text-right">{p.total} reviews</span>
                </div>
              </div>
            ))}
            {(!productsData.attention || productsData.attention.length === 0) && <div className="text-sm text-ink-400">Not enough data to rank products.</div>}
          </div>
        </div>
      </div>

      {/* Review Details Drawer */}
      {viewReview && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm" onClick={() => { setViewReview(null); setReplyText(""); }}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-ink-200 animate-slide-in-right">
            <div className="p-6 border-b border-ink-200 flex justify-between items-center bg-ink-50">
              <h2 className="font-display text-xl font-bold tracking-tight">Review Details</h2>
              <button onClick={() => { setViewReview(null); setReplyText(""); }} className="p-2 hover:bg-ink-200 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Review Content */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="mb-2">{renderStars(viewReview.rating)}</div>
                    <div className="font-bold text-lg text-obsidian">{viewReview.customer_name}</div>
                    <div className="text-xs text-ink-400">{new Date(viewReview.created_at).toLocaleDateString()} at {new Date(viewReview.created_at).toLocaleTimeString()}</div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold  tracking-wider ${viewReview.status === 'approved' ? 'bg-green-100 text-green-700' : viewReview.status === 'pending' ? 'bg-amber-100 text-amber-700' : viewReview.status === 'reported' ? 'bg-red-100 text-red-700' : 'bg-ink-200 text-ink-600'}`}>
                    {viewReview.status}
                  </span>
                </div>
                
                <div className="bg-ink-50 p-4 border border-ink-100 text-sm text-obsidian italic">
                  "{viewReview.comment || "No written review provided."}"
                </div>
              </div>

              {/* Associations */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-ink-200 p-4">
                  <div className="text-[10px] font-bold  text-ink-400 mb-1">Product</div>
                  <div className="font-bold text-sm truncate">{viewReview.product?.name || 'Unknown'}</div>
                </div>
                <div className="border border-ink-200 p-4">
                  <div className="text-[10px] font-bold  text-ink-400 mb-1">Order</div>
                  {viewReview.order_id ? (
                    <div>
                      <div className="font-bold text-sm">#{viewReview.order?.order_number || viewReview.order_id.substring(0,6)}</div>
                      <div className="text-[10px] text-green-600 font-bold  flex items-center gap-1 mt-1"><CheckCircle size={10}/> Verified</div>
                    </div>
                  ) : (
                    <div className="text-sm text-ink-400">Unverified / Guest</div>
                  )}
                </div>
              </div>

              {/* Admin Reply */}
              <div>
                <h4 className="font-display font-semibold  text-sm tracking-wider text-ink-500 mb-3">Admin Reply</h4>
                {viewReview.admin_reply ? (
                  <div className="bg-obsidian text-white p-4 text-sm relative">
                    <div className="absolute top-0 right-0 p-2 text-white/50 opacity-20"><MessageCircle size={40} /></div>
                    <div className="font-bold mb-2">Store Response</div>
                    <p className="text-white/80 leading-relaxed z-10 relative">{viewReview.admin_reply}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea 
                      value={replyText} 
                      onChange={e => setReplyText(e.target.value)} 
                      placeholder={`Thank you for your feedback, ${viewReview.customer_name}...`}
                      className="w-full border border-ink-200 p-3 text-sm min-h-[100px] focus:outline-none focus:border-fire transition-colors"
                    ></textarea>
                    <button 
                      onClick={() => sendReply(viewReview.id)}
                      disabled={!replyText.trim()}
                      className="w-full bg-obsidian text-white py-3 font-bold text-sm  tracking-wider hover:bg-fire transition-colors disabled:opacity-50"
                    >
                      Send Reply & Approve
                    </button>
                    <div className="text-xs text-ink-400 mt-2 flex items-center gap-1"><AlertTriangle size={12}/> Replying will automatically approve this review and publish it.</div>
                  </div>
                )}
              </div>
              
              {/* Report Info */}
              {viewReview.status === 'reported' && viewReview.report_reason && (
                <div className="bg-red-50 border border-red-200 p-4">
                  <div className="text-[10px] font-bold  text-red-500 mb-1">Report Reason</div>
                  <div className="text-sm text-red-700">{viewReview.report_reason}</div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-ink-200 bg-ink-50 grid grid-cols-3 gap-2">
              <button onClick={() => moderateReview(viewReview.id, 'approved')} className="bg-green-600 text-white py-2 text-xs font-bold  hover:bg-green-700">Approve</button>
              <button onClick={() => moderateReview(viewReview.id, 'rejected')} className="bg-ink-600 text-white py-2 text-xs font-bold  hover:bg-obsidian">Reject</button>
              <button onClick={() => moderateReview(viewReview.id, 'reported')} className="bg-red-600 text-white py-2 text-xs font-bold  hover:bg-red-700">Flag Spam</button>
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
          <button key={tab} onClick={() => setQuery({...query, status: tab, page: 1})}
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
                    <button className="p-1 text-ink-400 hover:text-obsidian"><MoreVertical size={16}/></button>
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
            <button disabled={query.page === 1} onClick={() => setQuery({...query, page: query.page - 1})} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Prev</button>
            <button disabled={query.page === data.pagination.totalPages} onClick={() => setQuery({...query, page: query.page + 1})} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Next</button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-8 h-8 border-4 border-obsidian border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-obsidian/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.2 }}
        className="w-full max-w-2xl bg-ink-50 h-full overflow-y-auto flex flex-col shadow-2xl border-l border-ink-200" onClick={e => e.stopPropagation()}>
        
        <div className="bg-white border-b border-ink-200 p-6 flex justify-between items-start sticky top-0 z-10">
          <div>
            <h2 className="font-display font-semibold text-2xl ">Return Request</h2>
            <p className="text-sm font-mono text-ink-500 mt-1">Order {data.order_number}</p>
          </div>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20}/></button>
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
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white"><Check size={10}/></div>
                <p className="text-sm font-bold">Return requested</p>
                <p className="text-xs text-ink-400">{new Date(data.created_at).toLocaleString()}</p>
              </div>
              
              <div className={`relative pl-6 border-l-2 pb-2 ${data.status !== 'pending' ? 'border-green-500' : 'border-ink-200'}`}>
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full flex items-center justify-center ${data.status !== 'pending' ? 'bg-green-500 text-white' : 'bg-ink-200 text-ink-400'}`}>{data.status !== 'pending' && <Check size={10}/>}</div>
                <p className={`text-sm font-bold ${data.status !== 'pending' ? '' : 'text-ink-400'}`}>Admin decision ({data.status === 'rejected' ? 'Rejected' : 'Approved'})</p>
              </div>

              {(data.status === 'approved' || data.status === 'processing' || data.status === 'refunded') && (
                <div className={`relative pl-6 border-l-2 pb-2 ${data.status === 'processing' || data.status === 'refunded' ? 'border-green-500' : 'border-ink-200'}`}>
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full flex items-center justify-center ${data.status === 'processing' || data.status === 'refunded' ? 'bg-green-500 text-white' : 'bg-ink-200 text-ink-400'}`}>{data.status === 'processing' || data.status === 'refunded' ? <Check size={10}/> : null}</div>
                  <p className={`text-sm font-bold ${data.status === 'processing' || data.status === 'refunded' ? '' : 'text-ink-400'}`}>Product Received (Processing)</p>
                </div>
              )}

              {(data.status === 'approved' || data.status === 'processing' || data.status === 'refunded') && (
                <div className="relative pl-6">
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full flex items-center justify-center ${data.status === 'refunded' ? 'bg-green-500 text-white' : 'bg-ink-200 text-ink-400'}`}>{data.status === 'refunded' && <Check size={10}/>}</div>
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
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 0, border: '1px solid #e5e5e5' }} />
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
                    <button className="p-1 text-ink-400 hover:text-obsidian"><MoreVertical size={16}/></button>
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
    } catch(e) { toast.error("Failed to process refund"); }
    setSaving(false);
  };
  
  const processCancel = async () => {
    setSaving(true);
    try {
      await http.patch(`/admin/refunds/${refundId}`, { status: 'cancelled' });
      toast.success("Refund cancelled");
      onUpdate();
      onClose();
    } catch(e) { toast.error("Failed to cancel refund"); }
    setSaving(false);
  };

  if (!data && loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-8 h-8 border-4 border-obsidian border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-obsidian/30 backdrop-blur-sm" onClick={onClose}>
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
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20}/></button>
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
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors ${
                    activeTab === tab.id ? 'bg-white text-fire border border-ink-200 shadow-sm' : 'text-ink-500 hover:text-obsidian hover:bg-ink-100/50 border border-transparent'
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
  const [data, setData] = useState({ users: [], pagination: {}, stats: {}, chart: [] });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ page: 1, limit: 25, search: "", status: "all" });
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState([]);
  const [viewUser, setViewUser] = useState(null);

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

  const resetFilters = () => {
    setSearchInput("");
    setQuery({ page: 1, limit: 25, search: "", status: "all" });
  };

  const selectAll = (e) => {
    if (e.target.checked) setSelected(data.users?.map(u => u.id) || []);
    else setSelected([]);
  };

  const toggleSelect = (id) => {
    if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
    else setSelected([...selected, id]);
  };

  const bulkUpdate = async (action) => {
    if (!window.confirm(`Are you sure you want to ${action} ${selected.length} customers?`)) return;
    try {
      await http.patch("/admin/users/bulk", { userIds: selected, action });
      toast.success(`Bulk action completed`);
      setSelected([]);
      load();
    } catch (e) { toast.error("Action failed"); }
  };

  const block = async (id, val) => {
    await bulkUpdate(val ? 'block' : 'unblock'); // reusing bulk endpoint logic but for single if needed, wait, I'll pass array
  };

  const STATS = [
    { label: "Total", count: data.stats?.total || 0, color: "text-obsidian" },
    { label: "New", count: data.stats?.new || 0, color: "text-green-600" },
    { label: "Active", count: data.stats?.active || 0, color: "text-obsidian" },
    { label: "Blocked", count: data.stats?.blocked || 0, color: "text-fire" },
    { label: "Repeat Customers", count: data.stats?.repeat || 0, color: "text-obsidian" }
  ];

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-semibold ">Customers</h1>
          <p className="text-sm text-ink-500">Manage customers and their accounts</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="bg-white p-4 border border-ink-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-ink-400  tracking-wider">{s.label}</span>
            <span className={`text-2xl font-mono font-black mt-2 ${s.color}`}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white border border-ink-200 p-6 mb-6">
        <h3 className="font-display text-sm  tracking-wider text-ink-500 mb-4">User Growth (Last 7 Days)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.chart || []}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
              <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #eee' }} />
              <Line type="monotone" dataKey="New" stroke="#000" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Active" stroke="#ccc" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 border border-ink-200 mb-6 flex flex-col lg:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 relative w-full">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Search users by name, email, phone..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-ink-200 text-sm focus:border-obsidian focus:outline-none rounded-none" />
        </form>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <select value={query.status} onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })} className="border border-ink-200 px-3 py-2 text-sm focus:outline-none rounded-none bg-white">
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
          <button onClick={resetFilters} className="text-sm font-bold text-ink-500 hover:text-fire  px-3 py-2">Reset</button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-obsidian text-white p-3 flex justify-between items-center mb-4 sticky top-0 z-10 shadow-lg">
          <span className="font-bold text-sm">{selected.length} customers selected</span>
          <div className="flex gap-2">
            <button onClick={() => bulkUpdate('unblock')} className="px-3 py-1.5 text-xs font-bold  bg-white/10 hover:bg-green-600 transition-colors">Unblock</button>
            <button onClick={() => bulkUpdate('block')} className="px-3 py-1.5 text-xs font-bold  bg-white/10 hover:bg-fire transition-colors">Block</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-ink-200 overflow-x-auto min-h-[400px]">
        {loading ? <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></div></div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-ink-100 font-mono text-[10px]  text-ink-500">
              <tr>
                <th className="p-3 w-10"><input type="checkbox" checked={data.users?.length > 0 && selected.length === data.users?.length} onChange={selectAll} className="accent-obsidian" /></th>
                <th className="p-3">Customer</th>
                <th className="p-3">Email</th>
                <th className="p-3 text-center">Orders</th>
                <th className="p-3">Total Spent</th>
                <th className="p-3">Status</th>
                <th className="p-3">Joined Date</th>
                <th className="p-3 text-center">⋮</th>
              </tr>
            </thead>
            <tbody>
              {!data.users || data.users.length === 0 ? <tr><td colSpan="8" className="p-10 text-center text-ink-400">No customers found.</td></tr> : data.users.map(u => (
                <tr key={u.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50 cursor-pointer" onClick={() => setViewUser(u)}>
                  <td className="p-3" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} className="accent-obsidian" /></td>
                  <td className="p-3 flex items-center gap-3">
                    {u.picture ? <img src={u.picture} className="w-8 h-8 rounded-full object-cover" alt=""/> : <div className="w-8 h-8 rounded-full bg-obsidian text-white flex justify-center items-center font-bold text-xs">{u.name[0]}</div>}
                    <span className="font-bold">{u.name}</span>
                  </td>
                  <td className="p-3 text-ink-500">{u.email}</td>
                  <td className="p-3 text-center font-mono font-bold">{u.orders_count}</td>
                  <td className="p-3 font-mono font-bold">{fmt(u.total_spent)}</td>
                  <td className="p-3">
                    {u.is_blocked ? <span className="text-[10px] font-bold  px-2 py-0.5 bg-red-100 text-red-700">Blocked</span> : <span className="text-[10px] font-bold  px-2 py-0.5 bg-green-100 text-green-700">Active</span>}
                  </td>
                  <td className="p-3 text-xs text-ink-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-center relative group" onClick={e => e.stopPropagation()}>
                    <button className="p-1 text-ink-400 hover:text-obsidian"><MoreVertical size={16}/></button>
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-ink-200 shadow-xl hidden group-hover:block z-20 text-left">
                      <button onClick={() => setViewUser(u)} className="w-full px-4 py-2 text-xs hover:bg-ink-100 text-left flex items-center gap-2"><Eye size={14}/> View Profile</button>
                      <button onClick={() => { setSelected([u.id]); bulkUpdate(u.is_blocked ? 'unblock' : 'block'); }} className="w-full px-4 py-2 text-xs hover:bg-fire hover:text-white text-fire text-left flex items-center gap-2"><Trash2 size={14}/> {u.is_blocked ? 'Unblock' : 'Block User'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data.pagination?.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-ink-500">Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.totalCount} customers)</div>
          <div className="flex gap-1">
            <button disabled={query.page === 1} onClick={() => setQuery({...query, page: query.page - 1})} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Prev</button>
            <button disabled={query.page === data.pagination.totalPages} onClick={() => setQuery({...query, page: query.page + 1})} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Next</button>
          </div>
        </div>
      )}

      {viewUser && <CustomerDetailsDrawer user={viewUser} onClose={() => setViewUser(null)} onUpdate={load} />}
    </div>
  );
}

function CustomerDetailsDrawer({ user: initialUser, onClose, onUpdate }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http.get(`/admin/users/${initialUser.id}`).then(({ data }) => {
      setUser(data.data);
      setLoading(false);
    }).catch(() => toast.error("Failed to load customer profile"));
  }, [initialUser.id]);

  if (!user && loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-8 h-8 border-4 border-obsidian border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-obsidian/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.2 }}
        className="w-full max-w-2xl bg-ink-50 h-full overflow-y-auto flex flex-col shadow-2xl border-l border-ink-200" onClick={e => e.stopPropagation()}>
        
        <div className="bg-white border-b border-ink-200 p-6 flex justify-between items-start sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {user.picture ? <img src={user.picture} className="w-14 h-14 rounded-full object-cover" alt=""/> : <div className="w-14 h-14 rounded-full bg-obsidian text-white flex justify-center items-center font-bold text-xl">{user.name[0]}</div>}
            <div>
              <h2 className="font-display font-semibold text-2xl flex items-center gap-3">
                {user.name}
                {user.is_blocked ? <span className="text-[10px] font-bold  px-2 py-0.5 bg-red-100 text-red-700 align-middle">Blocked</span> : <span className="text-[10px] font-bold  px-2 py-0.5 bg-green-100 text-green-700 align-middle">Active</span>}
              </h2>
              <p className="text-sm text-ink-500 font-mono">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Customer Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-ink-200 p-4 text-center">
              <span className="block text-xs font-bold text-ink-400  mb-1">Orders</span>
              <span className="font-mono text-xl font-bold">{user.total_orders}</span>
            </div>
            <div className="bg-white border border-ink-200 p-4 text-center col-span-2">
              <span className="block text-xs font-bold text-ink-400  mb-1">Total Spent</span>
              <span className="font-mono text-xl font-bold">{fmt(user.total_spent)}</span>
            </div>
            <div className="bg-white border border-ink-200 p-4 text-center">
              <span className="block text-xs font-bold text-ink-400  mb-1">Avg Order</span>
              <span className="font-mono text-xl font-bold">{fmt(user.avg_order)}</span>
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-ink-500 block text-xs mb-1">Name</span><span className="font-bold">{user.name}</span></div>
              <div><span className="text-ink-500 block text-xs mb-1">Email</span><span>{user.email}</span></div>
              <div><span className="text-ink-500 block text-xs mb-1">Phone</span><span>{user.phone || '—'}</span></div>
              <div><span className="text-ink-500 block text-xs mb-1">Joined</span><span>{new Date(user.created_at).toLocaleDateString()}</span></div>
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 mb-4">Saved Addresses</h3>
            {user.addresses?.length > 0 ? (
              <div className="grid gap-3">
                {user.addresses.map(a => (
                  <div key={a.id} className="border border-ink-100 p-3 bg-ink-50 text-sm">
                    <span className="font-bold text-xs  bg-ink-200 px-2 py-0.5 inline-block mb-2">{a.is_default ? 'Default Address' : 'Address'}</span>
                    <p className="font-bold">{a.first_name} {a.last_name}</p>
                    <p>{a.address_line1} {a.address_line2}</p>
                    <p>{a.city}, {a.province} {a.postal_code}</p>
                    <p className="font-mono mt-1 text-xs">{a.phone}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-ink-400">No saved addresses.</p>}
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold  text-sm tracking-wider text-ink-500 mb-4">Recent Orders</h3>
            {user.orders?.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="bg-ink-50 text-[10px]  text-ink-500"><tr><th className="p-2">Order</th><th className="p-2">Date</th><th className="p-2 text-right">Total</th><th className="p-2">Status</th></tr></thead>
                <tbody>
                  {user.orders.map(o => (
                    <tr key={o.id} className="border-b border-ink-100 last:border-0">
                      <td className="p-2 font-mono">{o.order_number}</td>
                      <td className="p-2 text-ink-500">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="p-2 text-right font-mono font-bold">{fmt(o.total)}</td>
                      <td className="p-2">
                        <span className={`text-[10px] font-bold  px-2 py-0.5 ${o.status==='delivered'?'bg-green-100 text-green-700':'bg-ink-100 text-obsidian'}`}>{o.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-sm text-ink-400">No recent orders.</p>}
          </div>

        </div>
      </motion.div>
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
            <button onClick={() => del(c.id)} className="absolute top-4 right-4 text-ink-400 hover:text-fire"><Trash2 size={16}/></button>
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
                    {p.images?.[0] ? <img src={imgUrl(p.images[0])} alt="" className="w-12 h-12 object-cover bg-ink-100 border border-ink-200" /> : <div className="w-12 h-12 bg-ink-100 border border-ink-200 flex items-center justify-center text-ink-300"><ImageIcon size={16}/></div>}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-obsidian">{p.name}</div>
                    <div className="text-xs text-ink-400 font-mono">Total Stock: {totalStock}</div>
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 ${p.status==='active'?'bg-green-100 text-green-700':p.status==='draft'?'bg-yellow-100 text-yellow-700':'bg-ink-200 text-ink-600'}`}>{p.status}</span>
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
              )})}
            </tbody>
          </table>
        )}
      </div>

      {data.pagination?.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-ink-500">Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.totalCount} products)</div>
          <div className="flex gap-1">
            <button disabled={query.page === 1} onClick={() => setQuery({...query, page: query.page - 1})} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Prev</button>
            <button disabled={query.page === data.pagination.totalPages} onClick={() => setQuery({...query, page: query.page + 1})} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http.get("/admin/audit-logs").then((res) => {
      setLogs(res.data.data);
      setLoading(false);
    }).catch(() => toast.error("Failed to load audit logs"));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-semibold ">Audit Logs</h1>
          <p className="text-sm text-ink-500">Track all actions performed by staff and admins.</p>
        </div>
      </div>
      <div className="bg-white border border-ink-200 overflow-x-auto min-h-[400px]">
        {loading ? <div className="p-10 flex justify-center"><Loader2 size={24} className="animate-spin text-obsidian" /></div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-ink-100 font-mono text-[10px] text-ink-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Admin/Staff</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity Type</th>
                <th className="p-4">Entity ID</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? <tr><td colSpan="6" className="p-10 text-center text-ink-400">No logs found.</td></tr> : logs.map(l => (
                <tr key={l.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                  <td className="p-4 text-xs font-mono whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="p-4 font-bold">{l.admin_name}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-ink-200 text-obsidian text-[10px] font-bold tracking-wider">{l.action}</span></td>
                  <td className="p-4 text-ink-500 capitalize">{l.entity_type}</td>
                  <td className="p-4 font-mono text-xs max-w-[120px] truncate" title={l.entity_id}>{l.entity_id}</td>
                  <td className="p-4 text-xs font-mono max-w-[300px] truncate" title={JSON.stringify(l.details)}>{JSON.stringify(l.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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
              <img src={p.images?.[0] || 'https://via.placeholder.com/150'} className="w-full aspect-square object-cover mb-2" alt=""/>
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
            <input type="text" placeholder="Customer Name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full border border-ink-200 px-3 py-1.5 text-sm mb-2 focus:outline-none" />
            <input type="text" placeholder="Phone Number" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full border border-ink-200 px-3 py-1.5 text-sm focus:outline-none" />
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

function ProfitabilityAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    http.get("/admin/analytics/profitability").then(res => setData(res.data.data)).catch(() => toast.error("Failed to load analytics"));
  }, []);

  if (!data) return <div className="p-10 flex justify-center"><Loader2 size={24} className="animate-spin text-obsidian" /></div>;

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-semibold ">Profitability Analytics</h1>
          <p className="text-sm text-ink-500">Real-time net profit dashboard (Revenue - COGS - Shipping - Platform Fees).</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 border border-ink-200">
          <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Total Revenue</p>
          <p className="font-display text-3xl font-semibold text-obsidian">{fmt(data.revenue)}</p>
        </div>
        <div className="bg-white p-6 border border-ink-200">
          <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">COGS (Estimated)</p>
          <p className="font-display text-3xl font-semibold text-orange-600">-{fmt(data.cogs)}</p>
        </div>
        <div className="bg-white p-6 border border-ink-200">
          <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Shipping Costs</p>
          <p className="font-display text-3xl font-semibold text-orange-600">-{fmt(data.shipping_costs)}</p>
        </div>
        <div className="bg-obsidian p-6 border border-ink-200 text-white shadow-xl">
          <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2">Net Profit</p>
          <p className="font-display text-3xl font-semibold text-green-400">{fmt(data.net_profit)}</p>
          <p className="text-sm text-ink-300 mt-2 font-mono">{((data.net_profit / data.revenue) * 100 || 0).toFixed(1)}% Margin</p>
        </div>
      </div>
      <div className="bg-white border border-ink-200 p-6">
        <h3 className="font-display font-semibold mb-6">30-Day Profit Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.trend}>
            <XAxis dataKey="date" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
            <YAxis tick={{fontSize: 11}} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #e5e5e5' }} />
            <Area type="monotone" dataKey="profit" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
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

  const load = () => {
    setLoading(true);
    http.get('/admin/bundles').then(res => { setBundles(res.data.data); setLoading(false); });
  };

  useEffect(() => {
    load();
    http.get('/admin/products?limit=200').then(res => setAllProducts(res.data.data.products || []));
  }, []);

  const del = async (id) => {
    if (!window.confirm('Delete this bundle?')) return;
    await http.delete(`/admin/bundles/${id}`);
    toast.success('Bundle deleted');
    load();
  };

  const totalRRP = (b) => b.items?.reduce((acc, it) => acc + (it.product?.base_price || 0) * it.quantity, 0) || 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-semibold">Product Bundles</h1>
          <p className="text-sm text-ink-500">Group products together to increase average order value.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-4 py-2 text-xs font-bold bg-obsidian text-white hover:bg-fire transition-colors flex items-center gap-2"><Plus size={14}/> New Bundle</button>
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
                    <button onClick={() => { setEditing(b); setShowForm(true); }} className="p-2 border border-ink-200 hover:bg-ink-50"><Edit size={14}/></button>
                    <button onClick={() => del(b.id)} className="p-2 border border-red-200 text-fire hover:bg-red-50"><Trash2 size={14}/></button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-ink-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="font-display font-semibold text-xl">{isEdit ? 'Edit Bundle' : 'Create Bundle'}</h2>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20}/></button>
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
                    <button onClick={() => removeItem(it.product_id)} className="p-1 text-fire hover:bg-red-50"><X size={14}/></button>
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
              <select value={f.is_active} onChange={e => setF({...f, is_active: e.target.value === 'true'})} className="w-full border border-ink-200 px-4 py-2.5 focus:outline-none bg-white">
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
