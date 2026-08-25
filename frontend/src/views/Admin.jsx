import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Megaphone, Tag, Layers, Zap, FileText, Search, LayoutDashboard, Package, ShoppingCart, Ticket, Star, Users, LogOut, TrendingUp, AlertTriangle, Plus, Trash2, X, RotateCcw, DollarSign, Image as ImageIcon, Upload, MessageCircle, Search as SearchIcon, Filter, MoreVertical, Eye, Download, Printer, CheckCircle, Truck, MapPin, Edit, Copy, Activity } from "lucide-react";
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
  }, [user]);

  if (!user || (user.role !== "admin" && user.role !== "staff")) return null;

  const NAV = [["overview", "Overview", LayoutDashboard], ["orders", "Orders", ShoppingCart], ["products", "Products", Package], ["returns", "Returns", RotateCcw], ["refunds", "Refunds", DollarSign], ["coupons", "Coupons", Ticket], ["reviews", "Reviews", Star], ["customers", "Customers", Users], ["cms", "Hero & CMS", ImageIcon]];

  return (
    <div className="min-h-screen bg-ink-100 flex" data-testid="admin-dashboard">
      {tab !== "cms" && (
        <aside className="w-16 lg:w-60 bg-ink-50 border-r border-ink-200 min-h-screen sticky top-0 flex flex-col shrink-0">
          <div className="px-4 py-3 lg:px-6 lg:py-4 border-b border-ink-200">
            <span className="font-display font-bold text-obsidian tracking-tighter hidden lg:block">SOLEKICKS<span className="text-fire">.</span></span>
            <span className="lg:hidden font-display font-semibold text-fire text-center block">S.</span>
          </div>
          <nav className="flex-1 p-2 lg:p-3 space-y-1">
            {NAV.map(([k, l, I]) => (
              <button key={k} onClick={() => setTab(k)} data-testid={`admin-nav-${k}`} className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 font-bold text-sm transition-colors ${tab === k ? "bg-white text-fire border border-ink-200 shadow-sm" : "text-ink-500 hover:text-obsidian hover:bg-ink-100/50 border border-transparent"}`}>
                <I size={18} />
                <span className="hidden lg:block">{l}</span>
              </button>
            ))}
          </nav>
          <button onClick={() => { logout(); navigate("/"); }} className="m-3 flex items-center justify-center lg:justify-start gap-3 px-3 py-3 text-ink-500 hover:text-fire hover:bg-ink-100/50 font-bold uppercase text-sm transition-colors border border-transparent">
            <LogOut size={18} />
            <span className="hidden lg:block">Logout</span>
          </button>
        </aside>
      )}

      <main className={`flex-1 overflow-x-hidden ${tab === 'cms' ? 'h-screen' : 'p-5 lg:p-8 min-w-0'}`}>
        {tab === "overview" && <Overview setTab={setTab} />}
        {tab === "orders" && <Orders />}
        {tab === "products" && <Products />}
        {tab === "returns" && <Returns />}
        {tab === "refunds" && <Refunds />}
        {tab === "coupons" && <Coupons />}
        {tab === "reviews" && <Reviews />}
        {tab === "customers" && <Customers />}
        {tab === "cms" && <Cms setTab={setTab} />}
      </main>
    </div>
  );
}

function Overview({ setTab }) {
  const [d, setD] = useState(null);
  useEffect(() => { http.get("/admin/analytics/overview").then(({ data }) => setD(data.data)); }, []);
  if (!d) return <div className="skeleton h-64 rounded-none" />;

  const { kpis, sales_chart, top_products, sales_by_category, recent_orders, customer_overview, needs_attention } = d;

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
          <button onClick={() => setTab("products")} className="px-3 py-1.5 text-xs font-bold uppercase border border-ink-200 bg-white hover:bg-obsidian hover:text-white transition-colors">+ Add Product</button>
          <button onClick={() => setTab("coupons")} className="px-3 py-1.5 text-xs font-bold uppercase border border-ink-200 bg-white hover:bg-obsidian hover:text-white transition-colors">+ Create Coupon</button>
          <button onClick={() => setTab("orders")} className="px-3 py-1.5 text-xs font-bold uppercase bg-obsidian text-white hover:bg-fire transition-colors">View Orders</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-none p-5 border border-ink-200">
           <div className="flex justify-between items-start"><span className="font-mono text-xs uppercase tracking-wider text-ink-400">Total Revenue</span><DollarSign size={18} className="text-fire" /></div>
           <p className="font-display font-semibold text-2xl mt-2">{fmt(kpis.revenue.value)}</p>
           <Trend val={kpis.revenue.trend} />
        </div>
        <div className="bg-white rounded-none p-5 border border-ink-200">
           <div className="flex justify-between items-start"><span className="font-mono text-xs uppercase tracking-wider text-ink-400">Orders</span><ShoppingCart size={18} className="text-fire" /></div>
           <p className="font-display font-semibold text-2xl mt-2">{kpis.orders.value}</p>
           <Trend val={kpis.orders.trend} />
        </div>
        <div className="bg-white rounded-none p-5 border border-ink-200">
           <div className="flex justify-between items-start"><span className="font-mono text-xs uppercase tracking-wider text-ink-400">Customers</span><Users size={18} className="text-fire" /></div>
           <p className="font-display font-semibold text-2xl mt-2">{kpis.customers.value}</p>
           <Trend val={kpis.customers.trend} />
        </div>
        <div className="bg-white rounded-none p-5 border border-ink-200">
           <div className="flex justify-between items-start"><span className="font-mono text-xs uppercase tracking-wider text-ink-400">Avg Order Value</span><Package size={18} className="text-fire" /></div>
           <p className="font-display font-semibold text-2xl mt-2">{fmt(kpis.aov.value)}</p>
           <Trend val={kpis.aov.trend} />
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
              <thead className="bg-ink-100 font-mono text-[10px] uppercase text-ink-500">
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
          <button onClick={() => setTab("products")} className="w-full text-center text-xs font-bold uppercase mt-4 text-ink-500 hover:text-obsidian">View All Products</button>
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
            <button onClick={() => setTab("orders")} className="text-xs font-bold uppercase text-fire hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-ink-100 font-mono text-[10px] uppercase text-ink-500">
                <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3 hidden sm:table-cell">Date</th></tr>
              </thead>
              <tbody>
                {recent_orders.map((o, i) => (
                  <tr key={i} className="border-b border-ink-100 last:border-0">
                    <td className="p-3 font-mono font-bold text-fire">#{o.order_number}</td>
                    <td className="p-3">{o.customer_name}</td>
                    <td className="p-3">{fmt(o.total)}</td>
                    <td className="p-3"><span className="text-[10px] font-bold uppercase tracking-wider bg-ink-100 px-2 py-1">{o.status}</span></td>
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
                <button onClick={() => setTab("orders")} className="text-xs text-ink-400 hover:text-obsidian uppercase font-bold">View</button>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400"></span> {needs_attention.low_stock} products low stock</span>
                <button onClick={() => setTab("products")} className="text-xs text-ink-400 hover:text-obsidian uppercase font-bold">View</button>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-600"></span> {needs_attention.failed_payments} failed payments</span>
                <button onClick={() => setTab("orders")} className="text-xs text-ink-400 hover:text-obsidian uppercase font-bold">View</button>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> {needs_attention.pending_reviews} pending reviews</span>
                <button onClick={() => setTab("reviews")} className="text-xs text-ink-400 hover:text-obsidian uppercase font-bold">View</button>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500"></span> {needs_attention.refund_requests} refund requests</span>
                <button onClick={() => setTab("refunds")} className="text-xs text-ink-400 hover:text-obsidian uppercase font-bold">View</button>
              </li>
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
  const [query, setQuery] = useState({ page: 1, limit: 25, status: "all", payment: "all", date: "all", search: "" });
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState([]);
  const [viewOrder, setViewOrder] = useState(null);

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

  const updateStatus = async (id, status) => { await http.patch(`/admin/orders/${id}/status`, { status }); toast.success("Status updated"); load(); };
  const bulkUpdateStatus = async (status) => { 
    if(!window.confirm(`Mark ${selected.length} orders as ${status}?`)) return;
    await http.patch(`/admin/orders/bulk-status`, { orderIds: selected, status });
    toast.success(`Updated ${selected.length} orders`);
    load();
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelected(selected.length === data.orders.length ? [] : data.orders.map(o => o.id));

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(prev => ({ ...prev, search: searchInput, page: 1 }));
  };

  const resetFilters = () => {
    setSearchInput("");
    setQuery({ page: 1, limit: 25, status: "all", payment: "all", date: "all", search: "" });
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
    { id: "all", label: "All", count: data.status_counts.all || 0 },
    { id: "pending", label: "Pending", count: data.status_counts.pending || 0 },
    { id: "processing", label: "Processing", count: data.status_counts.processing || 0 },
    { id: "shipped", label: "Shipped", count: data.status_counts.shipped || 0 },
    { id: "delivered", label: "Delivered", count: data.status_counts.delivered || 0 },
    { id: "cancelled", label: "Cancelled", count: data.status_counts.cancelled || 0 },
    { id: "refunded", label: "Refunded", count: data.status_counts.refunded || 0 },
  ];

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display tracking-tight text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-ink-500">Manage and process customer orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportOrders} className="px-3 py-1.5 text-xs font-bold uppercase border border-ink-200 bg-white hover:bg-obsidian hover:text-white transition-colors flex items-center gap-2"><Download size={14}/> Export</button>
          <button onClick={() => toast.success("Create Order coming soon!")} className="px-3 py-1.5 text-xs font-bold uppercase bg-obsidian text-white hover:bg-fire transition-colors">+ Create Order</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-ink-200 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setQuery({ ...query, status: t.id, page: 1 })}
            className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 flex items-center gap-2 transition-colors ${query.status === t.id ? 'border-obsidian text-obsidian' : 'border-transparent text-ink-500 hover:text-obsidian hover:border-ink-200'}`}>
            {t.label}
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${query.status === t.id ? 'bg-obsidian text-white' : 'bg-ink-100 text-ink-600'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 border border-ink-200 mb-6 flex flex-col lg:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 relative w-full">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Search order ID, customer, email..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-ink-200 text-sm focus:border-obsidian focus:outline-none rounded-none" />
        </form>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <select value={query.status} onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })} className="border border-ink-200 px-3 py-2 text-sm focus:outline-none rounded-none bg-white">
            <option value="all">Status: All</option>
            {ORDER_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={query.payment} onChange={(e) => setQuery({ ...query, payment: e.target.value, page: 1 })} className="border border-ink-200 px-3 py-2 text-sm focus:outline-none rounded-none bg-white">
            <option value="all">Payment: All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select value={query.date} onChange={(e) => setQuery({ ...query, date: e.target.value, page: 1 })} className="border border-ink-200 px-3 py-2 text-sm focus:outline-none rounded-none bg-white">
            <option value="all">Date: All time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button onClick={resetFilters} className="text-sm font-bold text-ink-500 hover:text-fire uppercase px-3 py-2">Reset</button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-obsidian text-white p-3 flex justify-between items-center mb-4 sticky top-0 z-10 shadow-lg">
          <span className="font-bold text-sm">{selected.length} orders selected</span>
          <div className="flex gap-2">
            <button onClick={() => bulkUpdateStatus('processing')} className="px-3 py-1.5 text-xs font-bold uppercase bg-white/10 hover:bg-white/20 transition-colors">Mark Processing</button>
            <button onClick={() => bulkUpdateStatus('shipped')} className="px-3 py-1.5 text-xs font-bold uppercase bg-white/10 hover:bg-white/20 transition-colors">Mark Shipped</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-ink-200 overflow-x-auto min-h-[400px]">
        {loading ? <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></div></div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-ink-100 font-mono text-[10px] uppercase text-ink-500">
              <tr>
                <th className="p-3 w-10"><input type="checkbox" checked={data.orders.length > 0 && selected.length === data.orders.length} onChange={selectAll} className="accent-obsidian" /></th>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">⋮</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.length === 0 ? <tr><td colSpan="9" className="p-10 text-center text-ink-400">No orders found.</td></tr> : data.orders.map(o => (
                <tr key={o.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50 cursor-pointer" onClick={() => setViewOrder(o)}>
                  <td className="p-3" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggleSelect(o.id)} className="accent-obsidian" /></td>
                  <td className="p-3 font-mono font-bold text-obsidian">#{o.order_number}</td>
                  <td className="p-3">
                    <div className="font-semibold">{o.customer_name}</div>
                    <div className="text-xs text-ink-400">{o.customer_phone}</div>
                  </td>
                  <td className="p-3 font-mono">{o.items?.length || 0}</td>
                  <td className="p-3 font-mono font-bold text-fire">{fmt(o.total)}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${o.payment_status==='paid'?'bg-green-100 text-green-700':o.payment_status==='failed'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{o.payment_status}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-ink-100 text-obsidian px-2 py-0.5">{o.status}</span>
                  </td>
                  <td className="p-3 text-ink-500 font-mono text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setViewOrder(o)} className="p-1 text-ink-400 hover:text-obsidian hover:bg-ink-100"><Eye size={16}/></button>
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
          <div className="text-sm text-ink-500">Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.totalCount} orders)</div>
          <div className="flex gap-1">
            <button disabled={query.page === 1} onClick={() => setQuery({...query, page: query.page - 1})} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Prev</button>
            <button disabled={query.page === data.pagination.totalPages} onClick={() => setQuery({...query, page: query.page + 1})} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-50 text-sm font-bold">Next</button>
          </div>
        </div>
      )}

      {viewOrder && <OrderDetailsDrawer order={viewOrder} onClose={() => setViewOrder(null)} onUpdate={() => { load(); setViewOrder(null); }} />}
    </div>
  );
}

function OrderDetailsDrawer({ order, onClose, onUpdate }) {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState(order.customer_note || "");
  const [savingNote, setSavingNote] = useState(false);
  const [refundOrder, setRefundOrder] = useState(null);

  const updateStatus = async (newStatus) => {
    setStatus(newStatus);
    await http.patch(`/admin/orders/${order.id}/status`, { status: newStatus });
    toast.success("Order status updated");
    onUpdate();
  };

  const saveNote = async () => {
    setSavingNote(true);
    await http.patch(`/admin/orders/${order.id}/note`, { note });
    setSavingNote(false);
    toast.success("Note saved");
  };

  const STEPS = ["placed", "confirmed", "processing", "shipped", "delivered"];
  let currentIndex = STEPS.indexOf(order.status);
  if (currentIndex === -1 && ['packed'].includes(order.status)) currentIndex = 2;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
        className="w-[95vw] h-[95vh] bg-ink-100 overflow-y-auto flex flex-col shadow-2xl rounded-xl" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-white border-b border-ink-200 p-6 flex justify-between items-start sticky top-0 z-10">
          <div>
            <h2 className="font-display font-semibold text-2xl flex items-center gap-3">
              Order #{order.order_number}
              <span className="text-[10px] font-bold uppercase tracking-wider bg-ink-100 text-obsidian px-2 py-1 align-middle">{order.status}</span>
            </h2>
            <p className="text-sm text-ink-500 mt-1 font-mono">Placed {new Date(order.created_at).toLocaleString()}</p>
          </div>
          <div className="flex gap-2 items-center">
            <select value={status} onChange={(e) => updateStatus(e.target.value)} className="border border-ink-200 px-3 py-1.5 text-sm font-bold uppercase bg-white focus:outline-none">
              {ORDER_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => window.print()} className="p-2 border border-ink-200 hover:bg-ink-100 text-ink-600"><Printer size={18}/></button>
            <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20}/></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Timeline */}
          {(!['cancelled', 'refunded', 'failed'].includes(order.status)) && (
            <div className="bg-white border border-ink-200 p-6">
              <h3 className="font-display font-semibold mb-6 uppercase text-sm tracking-wider text-ink-500">Order Timeline</h3>
              <div className="flex justify-between relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-ink-100 -z-10"></div>
                {STEPS.map((step, i) => {
                  const isCompleted = i <= currentIndex;
                  const isCurrent = i === currentIndex;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-obsidian border-obsidian text-white' : 'bg-white border-ink-200 text-ink-300'}`}>
                        {isCompleted ? <CheckCircle size={14}/> : <div className="w-2 h-2 rounded-full bg-ink-200"/>}
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-obsidian' : 'text-ink-400'}`}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Combined Info Container */}
            <div className="bg-white border border-ink-200 p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="font-display font-semibold flex items-center gap-2 mb-4"><Users size={16}/> Customer Information</h3>
                <div className="text-sm">
                  <p className="font-bold">{order.customer_name}</p>
                  {order.shipping_address?.email && <p className="text-ink-500">{order.shipping_address.email}</p>}
                  <p className="text-ink-500 font-mono mt-1">{order.customer_phone}</p>
                  <a href={waLink(order.customer_phone, `Hi ${order.customer_name}, update on your SOLEKICKS order ${order.order_number}:`)} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase text-[#25D366] hover:underline mt-2 inline-block">WhatsApp Customer</a>
                </div>
              </div>

              <hr className="border-ink-100" />

              {/* Shipping Address */}
              <div>
                <h3 className="font-display font-semibold flex items-center gap-2 mb-4"><MapPin size={16}/> Shipping Address</h3>
                <div className="text-sm text-ink-600">
                  <p className="font-bold text-obsidian">{order.customer_name}</p>
                  <p>{order.shipping_address?.address_l1}</p>
                  {order.shipping_address?.address_l2 && <p>{order.shipping_address.address_l2}</p>}
                  <p>{order.shipping_address?.city}, {order.shipping_address?.province}</p>
                  <p>{order.shipping_address?.postal_code}</p>
                </div>
                
                {order.tracking_number && (
                  <div className="mt-4 pt-4 border-t border-ink-100">
                    <p className="text-xs font-bold uppercase text-ink-400 mb-1">Tracking Info</p>
                    <p className="text-sm"><span className="font-semibold">{order.courier_name}</span> - <span className="font-mono">{order.tracking_number}</span></p>
                  </div>
                )}
              </div>

              <hr className="border-ink-100" />

              {/* Payment Information */}
              <div>
                <h3 className="font-display font-semibold flex items-center gap-2 mb-4"><DollarSign size={16}/> Payment Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-ink-500">Method</span><span className="font-semibold capitalize">{order.payment_method}</span></div>
                  <div className="flex justify-between"><span className="text-ink-500">Status</span><span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 ${order.payment_status==='paid'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{order.payment_status}</span></div>
                  {order.paymentTransactions && order.paymentTransactions[0] && (
                    <div className="flex justify-between"><span className="text-ink-500">Transaction</span><span className="font-mono text-xs">{order.paymentTransactions[0].session_id.substring(0,20)}...</span></div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes & Refunds */}
            <div className="space-y-6">

              <div className="bg-white border border-ink-200 p-6">
                <h3 className="font-display font-semibold mb-4 uppercase text-sm tracking-wider text-ink-500">Internal Notes</h3>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a private note about this order..." className="w-full border border-ink-200 p-3 text-sm focus:outline-none focus:border-obsidian min-h-[100px] rounded-none mb-3 resize-none" />
                <button onClick={saveNote} disabled={savingNote} className="px-4 py-2 bg-obsidian text-white text-xs font-bold uppercase disabled:opacity-50">Save Note</button>
              </div>

              <div className="bg-white border border-ink-200 p-6 border-l-4 border-l-fire">
                <h3 className="font-display font-semibold mb-2">Process Refund</h3>
                <p className="text-xs text-ink-500 mb-4">Full or partial refunds can be processed here.</p>
                <button onClick={() => setRefundOrder(order)} className="px-4 py-2 border border-fire text-fire text-xs font-bold uppercase hover:bg-fire hover:text-white transition-colors w-full">Initiate Refund</button>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white border border-ink-200">
            <div className="p-6 border-b border-ink-200">
              <h3 className="font-display font-semibold flex items-center gap-2"><Package size={16}/> Products</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-ink-50 font-mono text-[10px] uppercase text-ink-500">
                  <tr><th className="p-4" colSpan={2}>Product</th><th className="p-4 text-center">Qty</th><th className="p-4 text-right">Price</th><th className="p-4 text-right">Total</th></tr>
                </thead>
                <tbody>
                  {order.items?.map((item, i) => (
                    <tr key={i} className="border-b border-ink-100 last:border-0">
                      <td className="p-4 w-16"><img src={imgUrl(item.image_url)} alt={item.product_name} className="w-12 h-12 object-cover border border-ink-200" /></td>
                      <td className="p-4 py-4">
                        <div className="font-bold">{item.product_name}</div>
                        <div className="text-xs text-ink-500">Size: {item.size}</div>
                      </td>
                      <td className="p-4 text-center font-mono">{item.quantity}</td>
                      <td className="p-4 text-right font-mono">{fmt(item.unit_price)}</td>
                      <td className="p-4 text-right font-mono font-bold text-obsidian">{fmt(item.unit_price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-ink-50 flex justify-end border-t border-ink-200">
              <div className="w-64 space-y-3 text-sm">
                <div className="flex justify-between text-ink-500"><span>Subtotal</span><span className="font-mono">{fmt(order.subtotal)}</span></div>
                <div className="flex justify-between text-ink-500"><span>Shipping</span><span className="font-mono">{fmt(order.shipping_fee)}</span></div>
                {order.discount_amount > 0 && <div className="flex justify-between text-fire"><span>Discount</span><span className="font-mono">-{fmt(order.discount_amount)}</span></div>}
                <div className="flex justify-between font-bold text-lg pt-3 border-t border-ink-200"><span>Total</span><span className="font-mono text-fire">{fmt(order.total)}</span></div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
      {refundOrder && <RefundModal order={refundOrder} onClose={() => setRefundOrder(null)} onDone={() => { setRefundOrder(null); onUpdate(); }} />}
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
          <h1 className="font-display tracking-tight text-2xl font-semibold uppercase">Products</h1>
          <p className="text-sm text-ink-500">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-1.5 text-xs font-bold uppercase border border-ink-200 bg-white hover:bg-obsidian hover:text-white transition-colors flex items-center gap-2"><Download size={14}/> Export</button>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-3 py-1.5 text-xs font-bold uppercase bg-obsidian text-white hover:bg-fire transition-colors">+ Add Product</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="bg-white p-4 border border-ink-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">{s.label}</span>
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
          <button onClick={resetFilters} className="text-sm font-bold text-ink-500 hover:text-fire uppercase px-3 py-2">Reset</button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-obsidian text-white p-3 flex justify-between items-center mb-4 sticky top-0 z-10 shadow-lg">
          <span className="font-bold text-sm">{selected.length} products selected</span>
          <div className="flex gap-2">
            <button onClick={() => bulkUpdate('status', 'active')} className="px-3 py-1.5 text-xs font-bold uppercase bg-white/10 hover:bg-green-600 transition-colors">Activate</button>
            <button onClick={() => bulkUpdate('status', 'draft')} className="px-3 py-1.5 text-xs font-bold uppercase bg-white/10 hover:bg-yellow-600 transition-colors">Deactivate</button>
            <button onClick={() => bulkUpdate('delete')} className="px-3 py-1.5 text-xs font-bold uppercase bg-white/10 hover:bg-fire transition-colors">Delete</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-ink-200 overflow-x-auto min-h-[400px]">
        {loading ? <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></div></div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-ink-100 font-mono text-[10px] uppercase text-ink-500">
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
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${p.status==='active'?'bg-green-100 text-green-700':p.status==='draft'?'bg-yellow-100 text-yellow-700':'bg-ink-100 text-ink-500'}`}>{p.status}</span>
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
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 align-middle ${product.status==='active'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{product.status}</span>
            </h2>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={onEdit} className="px-3 py-1.5 border border-ink-200 hover:bg-ink-100 text-xs font-bold uppercase flex items-center gap-2"><Edit size={14}/> Edit</button>
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
                <h3 className="font-display font-semibold mb-2 uppercase text-sm tracking-wider text-ink-500">Product Information</h3>
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
                 <h3 className="font-display font-semibold mb-4 uppercase text-sm tracking-wider text-ink-500">Variants (Size / Stock)</h3>
                 <table className="w-full text-sm">
                   <thead className="bg-ink-50"><tr><th className="p-2 text-left text-xs uppercase text-ink-500">Size</th><th className="p-2 text-right text-xs uppercase text-ink-500">Stock</th></tr></thead>
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
        <label data-testid="admin-product-gallery-upload" className="flex items-center gap-1.5 bg-obsidian text-white text-xs font-bold uppercase px-3 py-2 rounded-none cursor-pointer hover:bg-fire transition-colors">
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
              {i === 0 && <span className="absolute top-0.5 left-0.5 bg-fire text-white text-[8px] font-bold uppercase px-1 rounded">Cover</span>}
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
        <button type="button" onClick={addUrl} className="border border-ink-200 text-xs font-bold uppercase px-3 rounded-none hover:border-obsidian">Add</button>
      </div>
    </div>
  );
}

function ProductForm({ product, onClose, onSaved }) {
  const isEdit = !!product?.id;
  const [f, setF] = useState({
    name: product?.name || "", category_slug: product?.category_slug || "retro",
    brand_slug: product?.brand_slug || "airvault", base_price: product?.base_price || "",
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
      base_price: Number(f.base_price), compare_at_price: f.compare_at_price ? Number(f.compare_at_price) : null,
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
          <h2 className="font-display font-semibold text-2xl uppercase tracking-tight">{isEdit ? "Edit Product" : "Add Product"}</h2>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire hover:bg-fire/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              
              {/* Basic Info */}
              <div className="bg-white border border-ink-200 p-6 space-y-4">
                <h3 className="font-display font-semibold flex items-center gap-2 mb-4 uppercase text-sm tracking-wider text-ink-500">Basic Information</h3>
                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Product Name</label>
                  <input placeholder="e.g. Nike Air Max 270" value={f.name} onChange={set("name")} className="w-full border border-ink-200 rounded-none px-4 py-2.5 outline-none focus:border-obsidian font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Description</label>
                  <textarea placeholder="Product description..." value={f.description} onChange={set("description")} rows={4} className="w-full border border-ink-200 rounded-none px-4 py-2.5 outline-none focus:border-obsidian" />
                </div>
              </div>

              {/* Images */}
              <div className="bg-white border border-ink-200 p-6">
                <MultiImageInput images={images} onChange={setImages} />
              </div>

              {/* Variants / Inventory */}
              <div className="bg-white border border-ink-200 p-6 space-y-4">
                <h3 className="font-display font-semibold flex items-center gap-2 mb-4 uppercase text-sm tracking-wider text-ink-500">Inventory (Sizes)</h3>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                  {sizes.map((s, i) => (
                    <div key={i} className="text-center border border-ink-100 p-2 bg-ink-50">
                      <div className="text-[10px] font-bold text-ink-500 uppercase mb-2 bg-ink-200 px-1 py-0.5 inline-block">EU {s.size}</div>
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
                <h3 className="font-display font-semibold flex items-center gap-2 mb-4 uppercase text-sm tracking-wider text-ink-500">Organization</h3>
                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Category</label>
                  <select value={f.category_slug} onChange={set("category_slug")} className="w-full border border-ink-200 rounded-none px-4 py-2.5 bg-white capitalize"><option value="retro">Retro</option><option value="streetwear">Streetwear</option><option value="runners">Runners</option><option value="slides">Slides</option></select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Brand</label>
                  <select value={f.brand_slug} onChange={set("brand_slug")} className="w-full border border-ink-200 rounded-none px-4 py-2.5 bg-white capitalize"><option value="airvault">AirVault</option><option value="terrace-co">Terrace Co</option><option value="cloudstride">CloudStride</option><option value="oasis">Oasis</option></select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Status</label>
                  <select value={f.status} onChange={set("status")} className="w-full border border-ink-200 rounded-none px-4 py-2.5 bg-white capitalize font-bold text-obsidian"><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white border border-ink-200 p-6 space-y-4">
                <h3 className="font-display font-semibold flex items-center gap-2 mb-4 uppercase text-sm tracking-wider text-ink-500">Pricing</h3>
                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Base Price</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 font-mono">$</span><input type="number" value={f.base_price} onChange={set("base_price")} className="w-full pl-7 pr-4 py-2.5 border border-ink-200 outline-none focus:border-obsidian font-mono font-bold" /></div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Compare At Price</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 font-mono">$</span><input type="number" value={f.compare_at_price} onChange={set("compare_at_price")} className="w-full pl-7 pr-4 py-2.5 border border-ink-200 outline-none focus:border-obsidian font-mono" /></div>
                </div>
              </div>

              {/* Tags/Flags */}
              <div className="bg-white border border-ink-200 p-6 space-y-3">
                <h3 className="font-display font-semibold flex items-center gap-2 mb-4 uppercase text-sm tracking-wider text-ink-500">Storefront Tags</h3>
                {[["is_new_arrival", "New Arrival"], ["is_best_seller", "Best Seller"], ["is_flash_sale", "Flash Sale"], ["is_featured", "Featured"]].map(([k, l]) => (
                  <label key={k} className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} className="accent-obsidian w-4 h-4" /> <span className="text-sm font-bold">{l}</span></label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-ink-200 p-6 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-3 border border-ink-200 font-bold uppercase text-xs hover:bg-ink-50 transition-colors">Cancel</button>
          <button onClick={() => save('draft')} disabled={saving} className="px-6 py-3 border border-obsidian font-bold uppercase text-xs hover:bg-ink-100 transition-colors disabled:opacity-50 text-obsidian">Save Draft</button>
          <button onClick={() => save('active')} disabled={saving} className="px-6 py-3 bg-obsidian text-white font-bold uppercase text-xs hover:bg-fire transition-colors disabled:opacity-50">Publish Product</button>
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
          <h1 className="font-display tracking-tight text-2xl font-semibold uppercase">Coupons</h1>
          <p className="text-sm text-ink-500">Create and manage discount codes</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-obsidian text-white font-bold uppercase px-4 py-2 hover:bg-fire transition-colors flex items-center gap-2"><Plus size={16}/> Create Coupon</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="bg-white p-4 border border-ink-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">{s.label}</span>
            <span className={`text-2xl font-mono font-black mt-2 ${s.color}`}>{s.count}</span>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 border border-ink-200 mb-6 flex flex-col lg:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 relative w-full">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Search coupon code..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-ink-200 text-sm focus:border-obsidian focus:outline-none rounded-none uppercase font-mono" />
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
          <button onClick={resetFilters} className="text-sm font-bold text-ink-500 hover:text-fire uppercase px-3 py-2">Reset</button>
        </div>
      </div>

      <div className="bg-white border border-ink-200 overflow-x-auto min-h-[400px]">
        {loading ? <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></div></div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-ink-100 font-mono text-[10px] uppercase text-ink-500">
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
                    {c.status === 'active' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-green-100 text-green-700 flex items-center w-fit gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-600"></div> Active</span>}
                    {c.status === 'disabled' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-ink-200 text-ink-600 flex items-center w-fit gap-1"><div className="w-1.5 h-1.5 rounded-full bg-ink-500"></div> Disabled</span>}
                    {c.status === 'expired' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-red-100 text-red-700 flex items-center w-fit gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-600"></div> Expired</span>}
                    {c.status === 'scheduled' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-yellow-100 text-yellow-700 flex items-center w-fit gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-600"></div> Scheduled</span>}
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
          <h2 className="font-display font-semibold text-xl uppercase">Create Coupon</h2>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div className="flex gap-2 flex-wrap">
            {presets.map(p => (
              <button key={p.label} type="button" onClick={() => setF({...f, ...p.set})} className="px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-100 text-xs font-bold uppercase transition-colors">{p.label}</button>
            ))}
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Basic Information</h3>
            <div>
              <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Coupon Code</label>
              <input type="text" placeholder="e.g. SUMMER20" value={f.code} onChange={e => setF({...f, code: e.target.value.toUpperCase().replace(/\s/g, '')})} className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian font-mono uppercase" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Discount Type</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setF({...f, type: 'percentage'})} className={`flex-1 py-2 text-sm font-bold border ${f.type==='percentage'?'bg-obsidian text-white border-obsidian':'bg-white text-ink-500 border-ink-200'}`}>%</button>
                  <button type="button" onClick={() => setF({...f, type: 'flat'})} className={`flex-1 py-2 text-sm font-bold border ${f.type==='flat'?'bg-obsidian text-white border-obsidian':'bg-white text-ink-500 border-ink-200'}`}>$</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Value</label>
                <input type="number" placeholder="e.g. 20" value={f.value} onChange={e => setF({...f, value: e.target.value})} className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Usage Restrictions</h3>
            
            <div>
              <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Minimum Order Amount</label>
              <input type="number" placeholder="e.g. 50" value={f.min_order_value} onChange={e => setF({...f, min_order_value: e.target.value})} className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Total Usage Limit (Leave blank for unlimited)</label>
              <input type="number" placeholder="e.g. 1000" value={f.max_uses} onChange={e => setF({...f, max_uses: e.target.value})} className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian" />
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Validity</h3>
            <div>
              <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Expiry Date & Time (Leave blank to never expire)</label>
              <input type="datetime-local" value={f.expires_at} onChange={e => setF({...f, expires_at: e.target.value})} className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian" />
            </div>
          </div>

          <div className="bg-ink-100 p-4 text-xs text-ink-500 border border-ink-200">
            <strong>Note:</strong> Advanced rules (Category exclusions, user grouping) are managed at the Promotion level, not Coupon level, per architectural design.
          </div>

        </div>

        <div className="bg-white border-t border-ink-200 p-4 sticky bottom-0 z-10 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border border-ink-200 text-sm font-bold uppercase hover:bg-ink-50">Cancel</button>
          <button onClick={save} disabled={saving} className="px-6 py-2 bg-obsidian text-white text-sm font-bold uppercase hover:bg-fire transition-colors disabled:opacity-50">Create Coupon</button>
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
            <h2 className="font-mono font-bold text-3xl uppercase flex items-center gap-3">
              {data.code}
              {data.status === 'active' && <span className="text-xs font-bold uppercase px-2 py-1 bg-green-100 text-green-700 flex items-center w-fit gap-1 align-middle tracking-wider"><div className="w-2 h-2 rounded-full bg-green-600"></div> Active</span>}
              {data.status === 'disabled' && <span className="text-xs font-bold uppercase px-2 py-1 bg-ink-200 text-ink-600 flex items-center w-fit gap-1 align-middle tracking-wider"><div className="w-2 h-2 rounded-full bg-ink-500"></div> Disabled</span>}
              {data.status === 'expired' && <span className="text-xs font-bold uppercase px-2 py-1 bg-red-100 text-red-700 flex items-center w-fit gap-1 align-middle tracking-wider"><div className="w-2 h-2 rounded-full bg-red-600"></div> Expired</span>}
            </h2>
            <p className="text-sm text-ink-500 font-bold mt-1 bg-ink-100 w-fit px-2 py-0.5 rounded">{data.type === 'percentage' ? `${data.value}% OFF` : `${fmt(data.value)} OFF`}</p>
          </div>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-ink-200 p-4 text-center">
              <span className="block text-[10px] font-bold text-ink-400 uppercase mb-1">Redemptions</span>
              <span className="font-mono text-xl font-bold">{data.used_count}</span>
            </div>
            <div className="bg-white border border-ink-200 p-4 text-center">
              <span className="block text-[10px] font-bold text-ink-400 uppercase mb-1">Usage Limit</span>
              <span className="font-mono text-xl font-bold">{data.max_uses || '∞'}</span>
            </div>
            <div className="bg-white border border-ink-200 p-4 text-center">
              <span className="block text-[10px] font-bold text-ink-400 uppercase mb-1">Discount Given</span>
              <span className="font-mono text-xl font-bold text-fire">{fmt(data.total_discount)}</span>
            </div>
            <div className="bg-white border border-ink-200 p-4 text-center">
              <span className="block text-[10px] font-bold text-ink-400 uppercase mb-1">Revenue Generated</span>
              <span className="font-mono text-xl font-bold text-green-700">{fmt(data.revenue_generated)}</span>
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Recent Usage</h3>
            {data.recent_usage?.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="bg-ink-50 text-[10px] uppercase text-ink-500"><tr><th className="p-2">Customer</th><th className="p-2">Order</th><th className="p-2 text-right">Discount</th><th className="p-2">Date</th></tr></thead>
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
            <div className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">{s.label}</div>
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
          <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 mb-6">Rating Distribution</h3>
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
            <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500">Review Trend</h3>
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
            <thead className="bg-ink-50 text-ink-500 font-display uppercase tracking-wider text-xs">
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
                      {r.order_id && <div className="text-[10px] uppercase font-bold text-green-600 flex items-center gap-1 mt-1"><CheckCircle size={10}/> Verified</div>}
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
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'pending' ? 'bg-amber-100 text-amber-700' : r.status === 'reported' ? 'bg-red-100 text-red-700' : 'bg-ink-200 text-ink-600'}`}>
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
          <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 mb-6 flex items-center gap-2"><Star size={16} className="text-yellow-500"/> Products With Best Ratings</h3>
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
          <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 mb-6 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500"/> Products Needing Attention</h3>
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
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${viewReview.status === 'approved' ? 'bg-green-100 text-green-700' : viewReview.status === 'pending' ? 'bg-amber-100 text-amber-700' : viewReview.status === 'reported' ? 'bg-red-100 text-red-700' : 'bg-ink-200 text-ink-600'}`}>
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
                  <div className="text-[10px] font-bold uppercase text-ink-400 mb-1">Product</div>
                  <div className="font-bold text-sm truncate">{viewReview.product?.name || 'Unknown'}</div>
                </div>
                <div className="border border-ink-200 p-4">
                  <div className="text-[10px] font-bold uppercase text-ink-400 mb-1">Order</div>
                  {viewReview.order_id ? (
                    <div>
                      <div className="font-bold text-sm">#{viewReview.order?.order_number || viewReview.order_id.substring(0,6)}</div>
                      <div className="text-[10px] text-green-600 font-bold uppercase flex items-center gap-1 mt-1"><CheckCircle size={10}/> Verified</div>
                    </div>
                  ) : (
                    <div className="text-sm text-ink-400">Unverified / Guest</div>
                  )}
                </div>
              </div>

              {/* Admin Reply */}
              <div>
                <h4 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 mb-3">Admin Reply</h4>
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
                      className="w-full bg-obsidian text-white py-3 font-bold text-sm uppercase tracking-wider hover:bg-fire transition-colors disabled:opacity-50"
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
                  <div className="text-[10px] font-bold uppercase text-red-500 mb-1">Report Reason</div>
                  <div className="text-sm text-red-700">{viewReview.report_reason}</div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-ink-200 bg-ink-50 grid grid-cols-3 gap-2">
              <button onClick={() => moderateReview(viewReview.id, 'approved')} className="bg-green-600 text-white py-2 text-xs font-bold uppercase hover:bg-green-700">Approve</button>
              <button onClick={() => moderateReview(viewReview.id, 'rejected')} className="bg-ink-600 text-white py-2 text-xs font-bold uppercase hover:bg-obsidian">Reject</button>
              <button onClick={() => moderateReview(viewReview.id, 'reported')} className="bg-red-600 text-white py-2 text-xs font-bold uppercase hover:bg-red-700">Flag Spam</button>
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
      <label data-testid={testid} className="shrink-0 flex items-center gap-1.5 bg-obsidian text-white text-xs font-bold uppercase px-3 py-2.5 rounded-none cursor-pointer hover:bg-fire transition-colors">
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
  const [method, setMethod] = useState(order.payment_method === "COD" ? "STORE_CREDIT" : "PAYFAST_ORIGINAL");
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
            <option value="PAYFAST_ORIGINAL">Original Method / Gateway</option>
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
          <h1 className="font-display tracking-tight text-2xl font-semibold uppercase">Returns & Refunds</h1>
          <p className="text-sm text-ink-500">Manage customer return requests and refunds</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="bg-white p-4 border border-ink-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-ink-500 uppercase tracking-wider">{s.label}</span>
            <span className={`text-xl font-mono font-black mt-2 ${s.color}`}>{s.count}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'pending', 'approved', 'processing', 'refunded'].map(tab => (
          <button key={tab} onClick={() => setQuery({...query, status: tab, page: 1})}
            className={`px-4 py-2 text-sm font-bold uppercase transition-colors whitespace-nowrap ${query.status === tab ? 'bg-obsidian text-white' : 'bg-white text-ink-500 border border-ink-200 hover:bg-ink-50'}`}>
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
          <button onClick={() => { setSearchInput(""); setQuery({ page: 1, limit: 25, search: "", status: "all", reason: "all" }); }} className="text-sm font-bold text-ink-500 hover:text-fire uppercase px-3 py-2">Reset</button>
        </div>
      </div>

      <div className="bg-white border border-ink-200 overflow-x-auto min-h-[400px]">
        {loading ? <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></div></div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-ink-100 font-mono text-[10px] uppercase text-ink-500">
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
                    {r.status === 'pending' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-yellow-100 text-yellow-700">Pending</span>}
                    {r.status === 'approved' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-blue-100 text-blue-700">Approved</span>}
                    {r.status === 'rejected' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-ink-200 text-ink-600">Rejected</span>}
                    {r.status === 'processing' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-purple-100 text-purple-700">Processing</span>}
                    {r.status === 'refunded' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-green-100 text-green-700">Refunded</span>}
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
            <h2 className="font-display font-semibold text-2xl uppercase">Return Request</h2>
            <p className="text-sm font-mono text-ink-500 mt-1">Order {data.order_number}</p>
          </div>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          
          <div className="bg-white border border-ink-200 p-6 flex items-center justify-between">
            <span className="font-bold uppercase text-ink-500 text-sm">Status:</span>
            {data.status === 'pending' && <span className="font-bold uppercase px-3 py-1 bg-yellow-100 text-yellow-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-600"></div> Pending</span>}
            {data.status === 'approved' && <span className="font-bold uppercase px-3 py-1 bg-blue-100 text-blue-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Approved</span>}
            {data.status === 'rejected' && <span className="font-bold uppercase px-3 py-1 bg-ink-200 text-ink-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-ink-500"></div> Rejected</span>}
            {data.status === 'processing' && <span className="font-bold uppercase px-3 py-1 bg-purple-100 text-purple-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-600"></div> Processing</span>}
            {data.status === 'refunded' && <span className="font-bold uppercase px-3 py-1 bg-green-100 text-green-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-600"></div> Refunded</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-ink-200 p-4">
              <span className="block text-[10px] font-bold text-ink-400 uppercase mb-2">Customer</span>
              <p className="font-bold text-sm">{data.customer_name}</p>
              <p className="text-xs text-ink-500">{data.order?.email || data.customer_phone}</p>
            </div>
            <div className="bg-white border border-ink-200 p-4">
              <span className="block text-[10px] font-bold text-ink-400 uppercase mb-2">Product</span>
              <p className="font-bold text-sm">{data.product_name || "Entire Order"}</p>
              {data.product_id && <p className="text-xs text-ink-500">Qty: {data.quantity}</p>}
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6">
            <span className="block text-[10px] font-bold text-ink-400 uppercase mb-2">Customer Reason</span>
            <p className="text-sm font-semibold">{data.reason}</p>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Return Timeline</h3>
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
               <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Admin Decision</h3>
               <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Approved Refund Amount</label>
                  <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase mb-1">Admin Note (Sent to customer)</label>
                  <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Reason for approval/rejection..." className="w-full border border-ink-200 px-3 py-2 outline-none focus:border-obsidian min-h-[80px]"></textarea>
               </div>
               <div className="flex gap-3 pt-2">
                 <button onClick={() => processUpdate('rejected')} disabled={saving} className="flex-1 px-4 py-3 border border-ink-200 text-ink-600 font-bold uppercase hover:bg-ink-50 disabled:opacity-50">Reject Return</button>
                 <button onClick={() => processUpdate('approved')} disabled={saving} className="flex-1 px-4 py-3 bg-obsidian text-white font-bold uppercase hover:bg-fire disabled:opacity-50 transition-colors">Approve Return</button>
               </div>
            </div>
          )}

          {data.status === 'approved' && (
             <div className="bg-white border border-ink-200 p-6">
               <p className="text-sm mb-4">The return has been approved. Waiting for the product to be received back from the customer.</p>
               <button onClick={() => processUpdate('processing')} disabled={saving} className="w-full px-4 py-3 bg-obsidian text-white font-bold uppercase hover:bg-fire transition-colors disabled:opacity-50">Mark Product Received</button>
             </div>
          )}

          {data.status === 'processing' && (
             <div className="bg-white border border-ink-200 p-6 space-y-4">
               <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Process Refund</h3>
               
               <div className="p-4 bg-ink-50 border border-ink-200 mb-4">
                 <div className="flex justify-between text-sm mb-2"><span className="text-ink-500">Refund Amount:</span><span className="font-mono font-bold">{fmt(refundAmount)}</span></div>
                 <div className="flex justify-between text-sm"><span className="text-ink-500">Refund Method:</span><span className="font-bold uppercase">Original Payment</span></div>
               </div>

               <button onClick={() => processUpdate('refunded')} disabled={saving} className="w-full px-4 py-3 bg-green-600 text-white font-bold uppercase hover:bg-green-700 transition-colors disabled:opacity-50">Process Refund</button>
             </div>
          )}

          {data.status === 'refunded' && (
             <div className="bg-green-50 border border-green-200 p-6 flex items-start gap-4">
               <CheckCircle size={24} className="text-green-600 mt-1 flex-shrink-0" />
               <div>
                  <h4 className="font-bold text-green-800 mb-1 uppercase">Refund Processed</h4>
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
          <h1 className="font-display tracking-tight text-2xl font-semibold uppercase">Refunds</h1>
          <p className="text-sm text-ink-500">Track and manage customer refunds and financial transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="bg-white p-4 border border-ink-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-ink-500 uppercase tracking-wider">{s.label}</span>
            <span className={`text-xl font-mono font-black mt-2 ${s.color}`}>{s.count}</span>
            {s.sub && <span className="text-[10px] text-ink-400 mt-1">{s.sub}</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-ink-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500">Refund Overview (7D)</h3>
            <div className="flex bg-ink-50 border border-ink-200 rounded-none p-1">
              <button onClick={() => setChartMode('amount')} className={`px-3 py-1 text-xs font-bold uppercase ${chartMode === 'amount' ? 'bg-white shadow border border-ink-100' : 'text-ink-500'}`}>Amount</button>
              <button onClick={() => setChartMode('count')} className={`px-3 py-1 text-xs font-bold uppercase ${chartMode === 'count' ? 'bg-white shadow border border-ink-100' : 'text-ink-500'}`}>Count</button>
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
          <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 mb-6">Refund Status</h3>
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
          <button onClick={() => { setSearchInput(""); setQuery({ page: 1, limit: 25, search: "", status: "all", method: "all" }); }} className="text-sm font-bold text-ink-500 hover:text-fire uppercase px-3 py-2">Reset</button>
        </div>
      </div>

      <div className="bg-white border border-ink-200 overflow-x-auto min-h-[400px]">
        {loading ? <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></div></div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-ink-100 font-mono text-[10px] uppercase text-ink-500">
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
                  <td className="p-3 text-xs uppercase">{r.method}</td>
                  <td className="p-3">
                    {r.status === 'pending' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-yellow-100 text-yellow-700">Pending</span>}
                    {r.status === 'processing' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-purple-100 text-purple-700">Processing</span>}
                    {r.status === 'completed' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-green-100 text-green-700">Completed</span>}
                    {r.status === 'failed' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-red-100 text-red-700">Failed</span>}
                    {r.status === 'cancelled' && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-ink-200 text-ink-600">Cancelled</span>}
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
            <h2 className="font-mono font-bold text-xl uppercase text-ink-500 mb-1">Refund #{data.id.split('-')[0]}</h2>
            <div className="flex items-center gap-3">
              <span className="font-display font-black text-4xl">{fmt(data.amount)}</span>
              {data.status === 'pending' && <span className="font-bold uppercase px-3 py-1 bg-yellow-100 text-yellow-700">Pending</span>}
              {data.status === 'processing' && <span className="font-bold uppercase px-3 py-1 bg-purple-100 text-purple-700">Processing</span>}
              {data.status === 'completed' && <span className="font-bold uppercase px-3 py-1 bg-green-100 text-green-700">Completed</span>}
              {data.status === 'failed' && <span className="font-bold uppercase px-3 py-1 bg-red-100 text-red-700">Failed</span>}
              {data.status === 'cancelled' && <span className="font-bold uppercase px-3 py-1 bg-ink-200 text-ink-600">Cancelled</span>}
            </div>
            {data.processed_at && <p className="text-xs text-ink-500 font-mono mt-2">Processed {new Date(data.processed_at).toLocaleString()}</p>}
          </div>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-fire"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          
          <div className="bg-white border border-ink-200 p-6 grid grid-cols-2 gap-y-4">
            <div>
              <span className="block text-[10px] font-bold text-ink-400 uppercase mb-1">Customer</span>
              <p className="font-bold text-sm">{data.customer_name}</p>
              <p className="text-xs text-ink-500">{data.order?.email}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-ink-400 uppercase mb-1">Order</span>
              <p className="font-bold font-mono text-sm">{data.order_number}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-ink-400 uppercase mb-1">Refund Reason</span>
              <p className="text-sm">{data.reason}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-ink-400 uppercase mb-1">Payment Method</span>
              <p className="font-bold uppercase text-sm">{data.method}</p>
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Refund Breakdown</h3>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between text-ink-500"><span>Original Order Total</span><span>{fmt(data.order?.total || 0)}</span></div>
              <div className="flex justify-between text-ink-500"><span>Previously Refunded</span><span>{fmt(data.previously_refunded || 0)}</span></div>
              <div className="flex justify-between font-bold text-fire text-base pt-2 border-t border-ink-100"><span>Current Refund</span><span>-{fmt(data.amount)}</span></div>
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 border-b border-ink-100 pb-2">Payment Information</h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between text-ink-500"><span>Provider</span><span className="uppercase">{data.method === 'card' ? 'Stripe' : data.method}</span></div>
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
               <button onClick={processCancel} disabled={saving} className="flex-1 px-4 py-3 border border-ink-200 text-ink-600 font-bold uppercase hover:bg-ink-50 disabled:opacity-50">Cancel</button>
               <button onClick={processRetry} disabled={saving} className="flex-[2] px-4 py-3 bg-obsidian text-white font-bold uppercase hover:bg-fire disabled:opacity-50 transition-colors">
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
          <button onClick={() => setTab("overview")} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase border border-ink-200 bg-white hover:bg-obsidian hover:text-white transition-colors mb-6">
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
          <h1 className="font-display tracking-tight text-2xl font-semibold uppercase">Customers</h1>
          <p className="text-sm text-ink-500">Manage customers and their accounts</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="bg-white p-4 border border-ink-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">{s.label}</span>
            <span className={`text-2xl font-mono font-black mt-2 ${s.color}`}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white border border-ink-200 p-6 mb-6">
        <h3 className="font-display text-sm uppercase tracking-wider text-ink-500 mb-4">User Growth (Last 7 Days)</h3>
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
          <button onClick={resetFilters} className="text-sm font-bold text-ink-500 hover:text-fire uppercase px-3 py-2">Reset</button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-obsidian text-white p-3 flex justify-between items-center mb-4 sticky top-0 z-10 shadow-lg">
          <span className="font-bold text-sm">{selected.length} customers selected</span>
          <div className="flex gap-2">
            <button onClick={() => bulkUpdate('unblock')} className="px-3 py-1.5 text-xs font-bold uppercase bg-white/10 hover:bg-green-600 transition-colors">Unblock</button>
            <button onClick={() => bulkUpdate('block')} className="px-3 py-1.5 text-xs font-bold uppercase bg-white/10 hover:bg-fire transition-colors">Block</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-ink-200 overflow-x-auto min-h-[400px]">
        {loading ? <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></div></div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-ink-100 font-mono text-[10px] uppercase text-ink-500">
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
                    {u.is_blocked ? <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-red-100 text-red-700">Blocked</span> : <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-green-100 text-green-700">Active</span>}
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
                {user.is_blocked ? <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-red-100 text-red-700 align-middle">Blocked</span> : <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-green-100 text-green-700 align-middle">Active</span>}
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
              <span className="block text-xs font-bold text-ink-400 uppercase mb-1">Orders</span>
              <span className="font-mono text-xl font-bold">{user.total_orders}</span>
            </div>
            <div className="bg-white border border-ink-200 p-4 text-center col-span-2">
              <span className="block text-xs font-bold text-ink-400 uppercase mb-1">Total Spent</span>
              <span className="font-mono text-xl font-bold">{fmt(user.total_spent)}</span>
            </div>
            <div className="bg-white border border-ink-200 p-4 text-center">
              <span className="block text-xs font-bold text-ink-400 uppercase mb-1">Avg Order</span>
              <span className="font-mono text-xl font-bold">{fmt(user.avg_order)}</span>
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-ink-500 block text-xs mb-1">Name</span><span className="font-bold">{user.name}</span></div>
              <div><span className="text-ink-500 block text-xs mb-1">Email</span><span>{user.email}</span></div>
              <div><span className="text-ink-500 block text-xs mb-1">Phone</span><span>{user.phone || '—'}</span></div>
              <div><span className="text-ink-500 block text-xs mb-1">Joined</span><span>{new Date(user.created_at).toLocaleDateString()}</span></div>
            </div>
          </div>

          <div className="bg-white border border-ink-200 p-6 space-y-4">
            <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 mb-4">Saved Addresses</h3>
            {user.addresses?.length > 0 ? (
              <div className="grid gap-3">
                {user.addresses.map(a => (
                  <div key={a.id} className="border border-ink-100 p-3 bg-ink-50 text-sm">
                    <span className="font-bold text-xs uppercase bg-ink-200 px-2 py-0.5 inline-block mb-2">{a.is_default ? 'Default Address' : 'Address'}</span>
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
            <h3 className="font-display font-semibold uppercase text-sm tracking-wider text-ink-500 mb-4">Recent Orders</h3>
            {user.orders?.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="bg-ink-50 text-[10px] uppercase text-ink-500"><tr><th className="p-2">Order</th><th className="p-2">Date</th><th className="p-2 text-right">Total</th><th className="p-2">Status</th></tr></thead>
                <tbody>
                  {user.orders.map(o => (
                    <tr key={o.id} className="border-b border-ink-100 last:border-0">
                      <td className="p-2 font-mono">{o.order_number}</td>
                      <td className="p-2 text-ink-500">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="p-2 text-right font-mono font-bold">{fmt(o.total)}</td>
                      <td className="p-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${o.status==='delivered'?'bg-green-100 text-green-700':'bg-ink-100 text-obsidian'}`}>{o.status}</span>
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
              <label className="block text-xs font-mono uppercase tracking-widest text-ink-400 mb-1.5">End Time</label>
              <input type="datetime-local" value={f.flash_sale_end_time} onChange={(e) => setF({ ...f, flash_sale_end_time: e.target.value })} className="border border-ink-200 px-4 py-2 outline-none focus:border-obsidian" />
            </div>
          )}
          <button onClick={save} disabled={saving} className="bg-obsidian text-white font-bold uppercase px-6 py-2.5 hover:bg-fire transition-colors disabled:opacity-50">Save Settings</button>
        </div>
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
            {c.hero_video_url && <span className="text-[10px] bg-fire/10 text-fire px-2 py-0.5 rounded font-bold uppercase">Has Video</span>}
            <button onClick={() => del(c.id)} className="absolute top-4 right-4 text-ink-400 hover:text-fire"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
