import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Package, ShoppingCart, Ticket, Star, Users, LogOut, TrendingUp, AlertTriangle, Plus, Trash2, X, RotateCcw, DollarSign, Image as ImageIcon, Upload, MessageCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { http, fmt, imgUrl, waLink } from "../lib/api";
import { useStore } from "../context/StoreContext";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-ink-100" data-testid="admin-dashboard">
      <div className="flex">
        <aside className="w-16 lg:w-60 bg-obsidian text-white min-h-screen sticky top-0 flex flex-col">
          <div className="p-4 lg:p-6 border-b border-white/10"><span className="font-display font-black uppercase tracking-tighter hidden lg:block">SOLEKICKS<span className="text-fire">.</span></span><span className="lg:hidden font-display font-black text-fire text-center block">S.</span></div>
          <nav className="flex-1 p-2 lg:p-3 space-y-1">
            {NAV.map(([k, l, I]) => (
              <button key={k} onClick={() => setTab(k)} data-testid={`admin-nav-${k}`} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-display font-bold uppercase text-sm tracking-tight transition-colors ${tab === k ? "bg-fire text-white" : "text-white/60 hover:bg-white/10"}`}><I size={18} /><span className="hidden lg:block">{l}</span></button>
            ))}
          </nav>
          <button onClick={() => { logout(); navigate("/"); }} className="m-3 flex items-center gap-3 px-3 py-3 rounded-xl text-white/60 hover:bg-white/10 font-bold uppercase text-sm"><LogOut size={18} /><span className="hidden lg:block">Logout</span></button>
        </aside>

        <main className="flex-1 p-5 lg:p-8 max-w-full overflow-hidden">
          {tab === "overview" && <Overview />}
          {tab === "orders" && <Orders />}
          {tab === "products" && <Products />}
          {tab === "returns" && <Returns />}
          {tab === "refunds" && <Refunds />}
          {tab === "coupons" && <Coupons />}
          {tab === "reviews" && <Reviews />}
          {tab === "customers" && <Customers />}
          {tab === "cms" && <Cms />}
        </main>
      </div>
    </div>
  );
}

function Overview() {
  const [d, setD] = useState(null);
  useEffect(() => { http.get("/admin/analytics/overview").then(({ data }) => setD(data.data)); }, []);
  if (!d) return <div className="skeleton h-40 rounded-2xl" />;
  const cards = [["Revenue", fmt(d.revenue), TrendingUp], ["Orders", d.total_orders, ShoppingCart], ["Avg Order", fmt(d.aov), Package], ["Pending", d.pending_orders, AlertTriangle]];
  return (
    <div>
      <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(([l, v, I], i) => (
          <div key={l} data-testid={`admin-stat-${l.toLowerCase().replace(" ", "-")}`} className="bg-white rounded-2xl p-5 border border-ink-200">
            <div className="flex justify-between items-start"><span className="font-mono text-xs uppercase tracking-wide text-ink-400">{l}</span><I size={18} className="text-fire" /></div>
            <p className="font-display font-black text-2xl mt-2">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-ink-200">
          <h3 className="font-display font-bold uppercase mb-4">Revenue (Last 7 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={d.chart}><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="revenue" stroke="#FF3B30" strokeWidth={2.5} dot={false} /></LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-ink-200">
          <h3 className="font-display font-bold uppercase mb-4">Top Products</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.top_products}><XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="sold" fill="#FF3B30" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {d.low_stock.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-ink-200 mt-6">
          <h3 className="font-display font-bold uppercase mb-3 flex items-center gap-2"><AlertTriangle size={18} className="text-fire" /> Low Stock Alert</h3>
          <div className="flex flex-wrap gap-2">{d.low_stock.map((s, i) => <span key={i} className="bg-fire-subtle text-fire text-xs font-bold px-3 py-1.5 rounded-full">{s.product} · EU {s.size} ({s.stock})</span>)}</div>
        </div>
      )}
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [refundOrder, setRefundOrder] = useState(null);
  const load = () => http.get("/admin/orders").then(({ data }) => setOrders(data.data));
  useEffect(() => { load(); }, []);
  const updateStatus = async (id, status) => { await http.patch(`/admin/orders/${id}/status`, { status }); toast.success("Status updated"); load(); };
  return (
    <div>
      <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-6">Orders</h1>
      <div className="bg-white rounded-2xl border border-ink-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-100 text-left"><tr>{["Order", "Customer", "Total", "Payment", "Status", "Actions"].map((h) => <th key={h} className="px-4 py-3 font-display font-bold uppercase text-xs tracking-wide">{h}</th>)}</tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} data-testid={`admin-order-row-${o.id}`} className="border-t border-ink-200">
                <td className="px-4 py-3 font-mono font-bold">{o.order_number}</td>
                <td className="px-4 py-3">{o.customer_name}<br /><span className="text-ink-400 text-xs">{o.customer_phone}</span></td>
                <td className="px-4 py-3 font-mono font-bold text-fire">{fmt(o.total)}</td>
                <td className="px-4 py-3"><span className="text-xs">{o.payment_method} · {o.payment_status}</span></td>
                <td className="px-4 py-3">
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="border border-ink-200 rounded-lg px-2 py-1.5 text-xs font-bold bg-white">
                    {ORDER_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setRefundOrder(o)} data-testid={`admin-refund-btn-${o.id}`} className="text-xs font-bold uppercase border border-ink-200 px-3 py-1.5 rounded-full hover:border-fire hover:text-fire">Refund</button>
                    <a href={waLink(o.customer_phone, `Hi ${o.customer_name}, update on your SOLEKICKS order ${o.order_number}:`)} target="_blank" rel="noreferrer" className="h-7 w-7 grid place-items-center rounded-full bg-[#25D366] text-white" title="WhatsApp customer"><MessageCircle size={14} /></a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-8 text-center text-ink-400">No orders yet.</p>}
      </div>
      {refundOrder && <RefundModal order={refundOrder} onClose={() => setRefundOrder(null)} onDone={() => { setRefundOrder(null); load(); }} />}
    </div>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const load = () => http.get("/admin/products").then(({ data }) => setProducts(data.data));
  useEffect(() => { load(); }, []);
  const del = async (id) => { if (!window.confirm("Delete product?")) return; await http.delete(`/admin/products/${id}`); toast.success("Deleted"); load(); };
  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (p) => { setEditing(p); setShowForm(true); };
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight">Products</h1>
        <button onClick={openNew} data-testid="admin-add-product-btn" className="bg-obsidian text-white font-display font-bold uppercase text-sm px-5 py-3 rounded-full flex items-center gap-2 hover:bg-fire transition-colors"><Plus size={16} /> Add Product</button>
      </div>
      <div className="bg-white rounded-2xl border border-ink-200 overflow-x-auto" data-testid="admin-products-table">
        <table className="w-full text-sm">
          <thead className="bg-ink-100 text-left"><tr>{["", "Name", "Category", "Price", "Photos", "Flags", ""].map((h, i) => <th key={i} className="px-4 py-3 font-display font-bold uppercase text-xs">{h}</th>)}</tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-ink-200">
                <td className="px-4 py-2"><img src={p.images?.[0]} alt="" className="h-10 w-10 rounded-lg object-cover bg-ink-100" /></td>
                <td className="px-4 py-3 font-display font-bold">{p.name}</td>
                <td className="px-4 py-3 capitalize">{p.category_slug}</td>
                <td className="px-4 py-3 font-mono font-bold">{fmt(p.base_price)}</td>
                <td className="px-4 py-3"><span className="font-mono text-xs bg-ink-100 px-2 py-1 rounded">{(p.images || []).length} img</span></td>
                <td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{p.is_new_arrival && <span className="text-[10px] bg-ink-100 px-2 py-0.5 rounded">NEW</span>}{p.is_flash_sale && <span className="text-[10px] bg-fire/10 text-fire px-2 py-0.5 rounded">FLASH</span>}{p.is_best_seller && <span className="text-[10px] bg-ink-100 px-2 py-0.5 rounded">BEST</span>}</div></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} data-testid={`admin-edit-product-${p.id}`} className="text-xs font-bold uppercase border border-ink-200 px-3 py-1.5 rounded-full hover:border-obsidian">Edit</button>
                    <button onClick={() => del(p.id)} className="text-ink-400 hover:text-fire"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && <ProductForm product={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
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
        <label className="font-display font-bold uppercase text-xs tracking-wide text-ink-500">Product Gallery <span className="text-ink-400 normal-case font-normal">· drag to reorder · first = cover</span></label>
        <label data-testid="admin-product-gallery-upload" className="flex items-center gap-1.5 bg-obsidian text-white text-xs font-bold uppercase px-3 py-2 rounded-xl cursor-pointer hover:bg-fire transition-colors">
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
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-ink-200 cursor-grab active:cursor-grabbing"
            >
              <img src={im} alt="" className="h-full w-full object-cover pointer-events-none" />
              {i === 0 && <span className="absolute top-0.5 left-0.5 bg-fire text-white text-[8px] font-bold uppercase px-1 rounded">Cover</span>}
              <button type="button" onClick={() => remove(i)} data-testid={`admin-gallery-remove-${i}`} className="absolute top-0.5 right-0.5 h-5 w-5 grid place-items-center rounded-full bg-obsidian/80 text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><X size={11} /></button>
              <span className="absolute bottom-0.5 right-1 text-white text-[9px] font-mono font-bold drop-shadow">{i + 1}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-ink-400 text-xs mb-2 border border-dashed border-ink-200 rounded-lg py-4 text-center">No photos yet — upload or paste a URL below.</p>
      )}
      <div className="flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())} placeholder="Paste image URL…" className="flex-1 border border-ink-200 rounded-xl px-4 py-2 outline-none focus:border-obsidian text-sm" />
        <button type="button" onClick={addUrl} className="border border-ink-200 text-xs font-bold uppercase px-3 rounded-xl hover:border-obsidian">Add</button>
      </div>
    </div>
  );
}

function ProductForm({ product, onClose, onSaved }) {
  const isEdit = !!product?.id;
  const [f, setF] = useState({
    name: product?.name || "", category_slug: product?.category_slug || "retro",
    brand_slug: product?.brand_slug || "airvault", base_price: product?.base_price || "",
    compare_at_price: product?.compare_at_price || "", description: product?.description || "",
    is_new_arrival: product?.is_new_arrival ?? true, is_best_seller: product?.is_best_seller ?? false,
    is_flash_sale: product?.is_flash_sale ?? false,
  });
  const [images, setImages] = useState(product?.images?.filter(Boolean) || []);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    if (!f.name || !f.base_price) return toast.error("Name and price required");
    if (images.length === 0) return toast.error("Add at least one photo");
    setSaving(true);
    const payload = {
      name: f.name, category_slug: f.category_slug, brand_slug: f.brand_slug,
      base_price: Number(f.base_price), compare_at_price: f.compare_at_price ? Number(f.compare_at_price) : null,
      description: f.description || f.name, images, hover_image: images[1] || images[0],
      is_new_arrival: f.is_new_arrival, is_best_seller: f.is_best_seller, is_flash_sale: f.is_flash_sale,
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
    <div className="fixed inset-0 bg-obsidian/60 z-50 grid place-items-center p-5" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-4"><h3 className="font-display font-black text-xl uppercase">{isEdit ? "Edit Product" : "Add Product"}</h3><button onClick={onClose}><X size={20} /></button></div>
        <div className="space-y-3">
          <input placeholder="Product name" value={f.name} onChange={set("name")} data-testid="admin-product-name" className="w-full border border-ink-200 rounded-xl px-4 py-2.5 outline-none focus:border-obsidian" />
          <div className="grid grid-cols-2 gap-3">
            <select value={f.category_slug} onChange={set("category_slug")} className="border border-ink-200 rounded-xl px-4 py-2.5 bg-white"><option value="retro">Retro</option><option value="streetwear">Streetwear</option><option value="runners">Runners</option><option value="slides">Slides</option></select>
            <select value={f.brand_slug} onChange={set("brand_slug")} className="border border-ink-200 rounded-xl px-4 py-2.5 bg-white"><option value="airvault">AirVault</option><option value="terrace-co">Terrace Co</option><option value="cloudstride">CloudStride</option><option value="oasis">Oasis</option></select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Price (Rs.)" type="number" value={f.base_price} onChange={set("base_price")} data-testid="admin-product-price" className="border border-ink-200 rounded-xl px-4 py-2.5 outline-none focus:border-obsidian" />
            <input placeholder="Compare price" type="number" value={f.compare_at_price} onChange={set("compare_at_price")} className="border border-ink-200 rounded-xl px-4 py-2.5 outline-none focus:border-obsidian" />
          </div>
          <MultiImageInput images={images} onChange={setImages} />
          <textarea placeholder="Description" value={f.description} onChange={set("description")} rows={3} className="w-full border border-ink-200 rounded-xl px-4 py-2.5 outline-none focus:border-obsidian" />
          <div className="flex gap-4 text-sm">
            {[["is_new_arrival", "New"], ["is_best_seller", "Best Seller"], ["is_flash_sale", "Flash Sale"]].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} className="accent-fire" /> {l}</label>
            ))}
          </div>
          <button onClick={save} disabled={saving} data-testid="admin-product-save" className="w-full bg-obsidian text-white font-display font-bold uppercase py-3 rounded-full hover:bg-fire transition-colors disabled:opacity-60">{saving ? "Saving…" : isEdit ? "Update Product" : "Save Product"}</button>
        </div>
      </motion.div>
    </div>
  );
}

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [f, setF] = useState({ code: "", type: "percentage", value: "", min_order_value: "" });
  const load = () => http.get("/admin/coupons").then(({ data }) => setCoupons(data.data));
  useEffect(() => { load(); }, []);
  const add = async () => { if (!f.code || !f.value) return toast.error("Code & value required"); await http.post("/admin/coupons", { ...f, value: Number(f.value), min_order_value: Number(f.min_order_value || 0) }); toast.success("Coupon created"); setF({ code: "", type: "percentage", value: "", min_order_value: "" }); load(); };
  const del = async (id) => { await http.delete(`/admin/coupons/${id}`); load(); };
  return (
    <div>
      <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-6">Coupons</h1>
      <div className="bg-white rounded-2xl border border-ink-200 p-5 mb-6 grid sm:grid-cols-5 gap-3">
        <input placeholder="CODE" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} className="border border-ink-200 rounded-xl px-3 py-2.5 font-mono uppercase outline-none" />
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className="border border-ink-200 rounded-xl px-3 py-2.5 bg-white"><option value="percentage">Percentage</option><option value="flat">Flat</option></select>
        <input placeholder="Value" type="number" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} className="border border-ink-200 rounded-xl px-3 py-2.5 outline-none" />
        <input placeholder="Min order" type="number" value={f.min_order_value} onChange={(e) => setF({ ...f, min_order_value: e.target.value })} className="border border-ink-200 rounded-xl px-3 py-2.5 outline-none" />
        <button onClick={add} className="bg-obsidian text-white font-bold uppercase rounded-xl hover:bg-fire transition-colors">Add</button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {coupons.map((c) => (
          <div key={c.id} className="bg-white border border-ink-200 rounded-2xl p-4 flex justify-between items-start">
            <div><p className="font-mono font-black text-lg">{c.code}</p><span className="text-ink-400 text-xs">{c.type === "percentage" ? `${c.value}% off` : `${fmt(c.value)} off`}{c.min_order_value ? ` · min ${fmt(c.min_order_value)}` : ""}</span></div>
            <button onClick={() => del(c.id)} className="text-ink-400 hover:text-fire"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const load = () => http.get("/admin/reviews").then(({ data }) => setReviews(data.data));
  useEffect(() => { load(); }, []);
  const moderate = async (id, ok) => { await http.patch(`/admin/reviews/${id}`, { is_approved: ok }); load(); };
  return (
    <div>
      <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-6">Reviews</h1>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white border border-ink-200 rounded-2xl p-4 flex justify-between items-center">
            <div><p className="font-display font-bold">{r.customer_name} · ⭐ {r.rating}</p><p className="text-ink-500 text-sm">{r.comment}</p></div>
            <div className="flex gap-2">
              {!r.is_approved ? <button onClick={() => moderate(r.id, true)} className="bg-obsidian text-white text-xs font-bold uppercase px-3 py-2 rounded-full">Approve</button> : <span className="text-green-600 text-xs font-bold">Approved</span>}
              <button onClick={() => moderate(r.id, false)} className="border border-ink-200 text-xs font-bold uppercase px-3 py-2 rounded-full">Hide</button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-ink-400">No reviews.</p>}
      </div>
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
      <input placeholder="Image URL or upload →" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 border border-ink-200 rounded-xl px-4 py-2.5 outline-none focus:border-obsidian text-sm" />
      <label data-testid={testid} className="shrink-0 flex items-center gap-1.5 bg-obsidian text-white text-xs font-bold uppercase px-3 py-2.5 rounded-xl cursor-pointer hover:bg-fire transition-colors">
        <Upload size={14} /> {busy ? "…" : "Upload"}
        <input type="file" accept="image/*" onChange={handle} className="hidden" />
      </label>
      {value && <img src={value} alt="" className="h-10 w-10 rounded-lg object-cover bg-ink-100" />}
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
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between mb-4"><h3 className="font-display font-black text-xl uppercase">Refund {order.order_number}</h3><button onClick={onClose}><X size={20} /></button></div>
        <p className="text-sm text-ink-500 mb-4">Paid: {order.payment_status} · Total {fmt(order.total)}{order.advance_paid ? ` · Advance ${fmt(order.advance_paid)}` : ""}</p>
        <div className="space-y-3">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" data-testid="admin-refund-amount" className="w-full border border-ink-200 rounded-xl px-4 py-2.5 outline-none focus:border-obsidian" />
          <select value={method} onChange={(e) => setMethod(e.target.value)} data-testid="admin-refund-method" className="w-full border border-ink-200 rounded-xl px-4 py-2.5 bg-white">
            <option value="STORE_CREDIT">Store Credit (registered users)</option>
            <option value="BANK_TRANSFER">Bank Transfer (manual)</option>
            <option value="PAYFAST_ORIGINAL">Original Method / Gateway</option>
          </select>
          {method === "BANK_TRANSFER" && <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Transfer reference" className="w-full border border-ink-200 rounded-xl px-4 py-2.5 outline-none focus:border-obsidian" />}
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason" data-testid="admin-refund-reason" className="w-full border border-ink-200 rounded-xl px-4 py-2.5 outline-none focus:border-obsidian" />
          <button onClick={submit} data-testid="admin-refund-submit" className="w-full bg-obsidian text-white font-display font-bold uppercase py-3 rounded-full hover:bg-fire transition-colors">Process Refund</button>
        </div>
      </motion.div>
    </div>
  );
}

function Returns() {
  const [returns, setReturns] = useState([]);
  const load = () => http.get("/admin/returns").then(({ data }) => setReturns(data.data));
  useEffect(() => { load(); }, []);
  const moderate = async (id, status) => { await http.patch(`/admin/returns/${id}`, { status }); toast.success(`Return ${status}`); load(); };
  return (
    <div>
      <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-6">Return Requests</h1>
      <div className="space-y-3">
        {returns.map((r) => (
          <div key={r.id} data-testid={`admin-return-${r.id}`} className="bg-white border border-ink-200 rounded-2xl p-4 flex justify-between items-center gap-4">
            <div className="flex-1"><p className="font-display font-bold">{r.order_number} · {r.customer_name}</p><p className="text-ink-500 text-sm">{r.reason}</p><span className="font-mono text-xs text-ink-400">{r.created_at?.slice(0, 10)}</span></div>
            <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full ${r.status === "pending" ? "bg-ink-100" : r.status === "approved" || r.status === "refunded" ? "bg-green-100 text-green-700" : "bg-fire/10 text-fire"}`}>{r.status}</span>
            {r.status === "pending" && (
              <div className="flex gap-2">
                <button onClick={() => moderate(r.id, "approved")} data-testid={`admin-return-approve-${r.id}`} className="bg-obsidian text-white text-xs font-bold uppercase px-3 py-2 rounded-full">Approve</button>
                <button onClick={() => moderate(r.id, "rejected")} className="border border-ink-200 text-xs font-bold uppercase px-3 py-2 rounded-full">Reject</button>
              </div>
            )}
          </div>
        ))}
        {returns.length === 0 && <p className="text-ink-400">No return requests.</p>}
      </div>
    </div>
  );
}

function Refunds() {
  const [refunds, setRefunds] = useState([]);
  useEffect(() => { http.get("/admin/refunds").then(({ data }) => setRefunds(data.data)); }, []);
  return (
    <div>
      <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-6">Refunds</h1>
      <div className="bg-white rounded-2xl border border-ink-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-100 text-left"><tr>{["Order", "Amount", "Method", "Status", "Ref", "Date"].map((h) => <th key={h} className="px-4 py-3 font-display font-bold uppercase text-xs">{h}</th>)}</tr></thead>
          <tbody>
            {refunds.map((r) => (
              <tr key={r.id} className="border-t border-ink-200">
                <td className="px-4 py-3 font-mono font-bold">{r.order_number}</td>
                <td className="px-4 py-3 font-mono font-bold text-fire">{fmt(r.amount)}</td>
                <td className="px-4 py-3 text-xs">{r.method?.replace(/_/g, " ")}</td>
                <td className="px-4 py-3"><span className={`text-xs font-bold uppercase ${r.status === "completed" ? "text-green-600" : "text-ink-400"}`}>{r.status}</span></td>
                <td className="px-4 py-3 font-mono text-xs">{r.external_ref || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.created_at?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {refunds.length === 0 && <p className="p-8 text-center text-ink-400">No refunds yet.</p>}
      </div>
    </div>
  );
}

function Cms() {
  const [slides, setSlides] = useState([]);
  const [f, setF] = useState({ title: "", subtitle: "", badge: "", cta_text: "Shop Now", link_url: "/new-arrivals", image_url: "" });
  const load = () => http.get("/admin/hero-slides").then(({ data }) => setSlides(data.data));
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!f.image_url || !f.title) return toast.error("Title & image required");
    await http.post("/admin/hero-slides", { ...f, sort_order: slides.length });
    toast.success("Slide added"); setF({ title: "", subtitle: "", badge: "", cta_text: "Shop Now", link_url: "/new-arrivals", image_url: "" }); load();
  };
  const del = async (id) => { await http.delete(`/admin/hero-slides/${id}`); load(); };
  return (
    <div>
      <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-6">Hero Slides & CMS</h1>
      <div className="bg-white rounded-2xl border border-ink-200 p-5 mb-6 space-y-3 max-w-2xl">
        <h3 className="font-display font-bold uppercase text-sm">Add Hero Slide</h3>
        <AdminImageInput value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} testid="admin-hero-upload" />
        <div className="grid sm:grid-cols-2 gap-3">
          <input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} data-testid="admin-hero-title" className="border border-ink-200 rounded-xl px-4 py-2.5 outline-none" />
          <input placeholder="Badge (e.g. NEW DROP)" value={f.badge} onChange={(e) => setF({ ...f, badge: e.target.value })} className="border border-ink-200 rounded-xl px-4 py-2.5 outline-none" />
          <input placeholder="CTA text" value={f.cta_text} onChange={(e) => setF({ ...f, cta_text: e.target.value })} className="border border-ink-200 rounded-xl px-4 py-2.5 outline-none" />
          <input placeholder="Link URL" value={f.link_url} onChange={(e) => setF({ ...f, link_url: e.target.value })} className="border border-ink-200 rounded-xl px-4 py-2.5 outline-none" />
        </div>
        <input placeholder="Subtitle" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} className="w-full border border-ink-200 rounded-xl px-4 py-2.5 outline-none" />
        <button onClick={add} data-testid="admin-hero-save" className="bg-obsidian text-white font-display font-bold uppercase px-6 py-3 rounded-full hover:bg-fire transition-colors">Add Slide</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {slides.map((s) => (
          <div key={s.id} className="bg-white border border-ink-200 rounded-2xl overflow-hidden">
            <img src={s.image_url} alt="" className="h-32 w-full object-cover" />
            <div className="p-3 flex justify-between items-center"><div><p className="font-display font-bold text-sm">{s.title}</p><span className="text-ink-400 text-xs">{s.badge}</span></div><button onClick={() => del(s.id)} className="text-ink-400 hover:text-fire"><Trash2 size={15} /></button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Customers() {
  const [customers, setCustomers] = useState([]);
  const load = () => http.get("/admin/customers").then(({ data }) => setCustomers(data.data));
  useEffect(() => { load(); }, []);
  const block = async (id, val) => { await http.patch(`/admin/customers/${id}/block`, { is_blocked: val }); load(); };
  return (
    <div>
      <h1 className="font-display text-3xl font-black uppercase tracking-tight mb-6">Customers</h1>
      <div className="bg-white rounded-2xl border border-ink-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-100 text-left"><tr>{["Name", "Email", "Role", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-display font-bold uppercase text-xs">{h}</th>)}</tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-ink-200">
                <td className="px-4 py-3 font-bold">{c.name}</td>
                <td className="px-4 py-3">{c.email}</td>
                <td className="px-4 py-3 capitalize">{c.role}</td>
                <td className="px-4 py-3">{c.is_blocked ? <span className="text-fire font-bold">Blocked</span> : <span className="text-green-600 font-bold">Active</span>}</td>
                <td className="px-4 py-3">{c.role !== "admin" && <button onClick={() => block(c.id, !c.is_blocked)} className="text-xs font-bold uppercase border border-ink-200 px-3 py-1.5 rounded-full">{c.is_blocked ? "Unblock" : "Block"}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
