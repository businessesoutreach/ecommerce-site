import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Package, Heart, LogOut, Gift, RotateCcw, X, MapPin, Plus, Trash2 } from "lucide-react";
import { http, fmt } from "../lib/api";
import { useStore } from "../context/StoreContext";
import { EmptyState } from "../components/common";
import PhoneInput from "../components/PhoneInput";
import ProductCard from "../components/ProductCard";
import { toast } from "sonner";
import { CustomDropdown, PROVINCES, PROVINCE_CITIES, ALL_CITIES } from "../components/LocationDropdowns";

const LABELS = { placed: "Placed", confirmed: "Verified", packed: "Packed", shipped: "Dispatched", out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled", return_requested: "Return Requested", returned: "Returned" };

function AddressesTab() {
  const [items, setItems] = useState([]);
  const [f, setF] = useState({ full_name: "", phone: "", address_l1: "", province: "Sindh", city: "Karachi", postal_code: "", is_default: false });
  const load = () => http.get("/me/addresses").then(({ data }) => setItems(data.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!f.full_name || !f.phone || !f.address_l1) return toast.error("Name, phone & address required");
    await http.post("/me/addresses", f);
    toast.success("Address saved");
    setF({ full_name: "", phone: "", address_l1: "", province: "Sindh", city: "Karachi", postal_code: "", is_default: false });
    load();
  };
  const del = async (id) => { await http.delete(`/me/addresses/${id}`); load(); };
  const inp = "w-full border border-ink-200 rounded-none px-4 py-2.5 outline-none focus:border-obsidian";
  return (
    <div className="grid lg:grid-cols-5 gap-8 items-start" data-testid="account-addresses">
      <div className="lg:col-span-3 space-y-4">
        <h3 className="font-display tracking-tight mb-4">Saved Addresses</h3>
        {items.length === 0 ? (
          <div className="bg-ink-50 border border-ink-200 p-8 text-center text-ink-500">No saved addresses yet.</div>
        ) : (
          items.map((a) => (
            <div key={a.id} data-testid={`account-address-${a.id}`} className={`bg-white border p-5 flex justify-between transition-colors ${a.is_default ? "border-obsidian shadow-sm" : "border-ink-200 hover:border-ink-300"}`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display tracking-tight">{a.full_name}</span>
                  {a.is_default && <span className="font-mono font-bold text-[10px] uppercase tracking-wider bg-obsidian text-white px-2 py-0.5">Default</span>}
                </div>
                <p className="text-ink-600 text-sm">{a.address_l1}, {a.city}{a.province ? `, ${a.province}` : ""}</p>
                <p className="text-ink-500 text-sm font-mono mt-1">{a.phone}</p>
              </div>
              <button onClick={() => del(a.id)} className="text-ink-400 hover:text-fire transition-colors h-fit p-2"><Trash2 size={18} /></button>
            </div>
          ))
        )}
      </div>

      <div className="lg:col-span-2 bg-white border border-ink-200 p-6 shadow-sm">
        <h3 className="font-display tracking-tight mb-5 flex items-center gap-2"><Plus size={18} /> Add New Address</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-ink-400 mb-1.5">Full Name</label>
            <input placeholder="Ahmed Khan" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} data-testid="address-fullname" className={inp} />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-ink-400 mb-1.5">Phone Number</label>
            <PhoneInput placeholder="3XX XXXXXXX" value={f.phone} onChange={(val) => setF({ ...f, phone: val })} testid="address-phone" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-ink-400 mb-1.5">Street Address</label>
            <input placeholder="House #, Street, Area" value={f.address_l1} onChange={(e) => setF({ ...f, address_l1: e.target.value })} data-testid="address-line1" className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-ink-400 mb-1.5">Province</label>
              <CustomDropdown 
                value={f.province} 
                onChange={(val) => setF({ ...f, province: val, city: "" })} 
                options={PROVINCES} 
                placeholder="Select Province"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-ink-400 mb-1.5">City</label>
              <CustomDropdown 
                value={f.city} 
                onChange={(val) => setF({ ...f, city: val })} 
                options={f.province ? PROVINCE_CITIES[f.province] : ALL_CITIES} 
                placeholder="Select City"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-mono uppercase tracking-widest text-ink-400 mb-1.5">Postal Code</label>
              <input placeholder="75000" value={f.postal_code} onChange={(e) => setF({ ...f, postal_code: e.target.value })} className={inp} />
            </div>
          </div>
          <label className="flex items-center gap-2 mt-2 text-sm text-ink-600 font-medium cursor-pointer">
            <input type="checkbox" checked={f.is_default} onChange={(e) => setF({ ...f, is_default: e.target.checked })} className="accent-obsidian w-4 h-4" /> 
            Set as default address
          </label>
          <button onClick={save} data-testid="address-save" className="w-full mt-2 bg-obsidian text-white font-display tracking-wider py-3.5 hover:bg-fire transition-colors">Save Address</button>
        </div>
      </div>
    </div>
  );
}

function WishlistTab() {
  const { wishlist } = useStore();
  
  if (wishlist.items.length === 0) {
    return (
      <div className="bg-white border border-ink-200 p-12 text-center max-w-2xl mx-auto">
        <Heart size={48} className="mx-auto text-ink-300 mb-4" />
        <h3 className="font-display tracking-tight mb-2">No saved kicks yet</h3>
        <p className="text-ink-500 mb-6 max-w-sm mx-auto">Tap the heart on any product to stash it here and easily cop it later.</p>
        <Link to="/new-arrivals" className="inline-block bg-obsidian text-white font-display tracking-wider px-8 py-3.5 hover:bg-fire transition-colors">Discover Kicks</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display tracking-tight">Your Wishlist <span className="text-fire">({wishlist.items.length})</span></h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {wishlist.items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>
    </div>
  );
}

function SettingsTab({ user }) {
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [loading, setLoading] = useState(false);

  const updatePassword = async (e) => {
    e.preventDefault();
    if (!pw.current_password || !pw.new_password) return toast.error("Please fill both password fields");
    setLoading(true);
    try {
      await http.post("/auth/change-password", pw);
      toast.success("Password updated successfully");
      setPw({ current_password: "", new_password: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not update password");
    }
    setLoading(false);
  };

  const inp = "w-full border border-ink-200 rounded-none px-4 py-3 outline-none focus:border-obsidian transition-colors";

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start" data-testid="account-settings">
      <div className="bg-white border border-ink-200 p-8 shadow-sm">
        <h3 className="font-display tracking-tight mb-6">Profile Info</h3>
        <div className="space-y-5">
          <div><p className="text-xs font-mono uppercase tracking-widest text-ink-400 mb-1.5">Full Name</p><p className="font-bold text-ink-900">{user.name}</p></div>
          <div><p className="text-xs font-mono uppercase tracking-widest text-ink-400 mb-1.5">Email Address</p><p className="font-bold text-ink-900">{user.email}</p></div>
          <div><p className="text-xs font-mono uppercase tracking-widest text-ink-400 mb-1.5">Account Role</p><p className="font-bold uppercase text-xs bg-ink-100 text-ink-500 w-fit px-2 py-1">{user.role}</p></div>
        </div>
      </div>

      {!user.picture && (
        <div className="bg-white border border-ink-200 p-8 shadow-sm">
          <h3 className="font-display tracking-tight mb-6">Change Password</h3>
          <form onSubmit={updatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-ink-400 mb-1.5">Current Password</label>
              <input type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} className={inp} placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-ink-400 mb-1.5">New Password</label>
              <input type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} className={inp} placeholder="••••••••" />
            </div>
            <button disabled={loading} className="w-full bg-obsidian text-white font-display tracking-wider py-3.5 mt-2 hover:bg-fire transition-colors disabled:opacity-50">
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function Account() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [credit, setCredit] = useState({ balance: 0, ledger: [] });
  const [returnFor, setReturnFor] = useState(null);
  const [reason, setReason] = useState("");

  const loadOrders = () => http.get("/orders").then(({ data }) => setOrders(data.data)).catch(() => {});
  const loadCredit = () => http.get("/me/store-credit").then(({ data }) => setCredit(data.data)).catch(() => {});

  useEffect(() => {
    if (!user) return navigate("/login");
    loadOrders();
    loadCredit();
  }, [user]);

  if (!user) return null;

  const submitReturn = async () => {
    if (!reason.trim()) return toast.error("Please tell us the reason");
    try {
      await http.post(`/orders/${returnFor.id}/return-request`, { reason });
      toast.success("Return request submitted");
      setReturnFor(null);
      setReason("");
      loadOrders();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not submit return");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-10 min-h-[70vh]">
      <div className="flex items-center gap-4 mb-8">
        {user.picture ? <img src={user.picture} alt="" className="h-14 w-14 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="h-14 w-14 rounded-none bg-obsidian text-white grid place-items-center font-display font-semibold text-xl">{user.name?.[0] || "U"}</div>}
        <div><h1 className="font-display tracking-tight">Hey, {user.name?.split(" ")[0]}</h1><p className="text-ink-500 text-sm">{user.email}</p></div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {[["orders", "My Orders", Package], ["credit", "Store Credit", Gift], ["addresses", "Addresses", MapPin], ["wishlist", "Wishlist", Heart], ["settings", "Settings", User]].map(([k, l, I]) => (
              <button key={k} onClick={() => setTab(k)} data-testid={`account-tab-${k}`} className={`flex items-center gap-3 px-4 py-3 rounded-none font-display text-sm tracking-tight whitespace-nowrap ${tab === k ? "bg-obsidian text-white" : "hover:bg-ink-100"}`}><I size={17} /> {l}{k === "credit" && credit.balance > 0 && <span className="ml-1 font-mono text-fire">{fmt(credit.balance)}</span>}</button>
            ))}
            <button onClick={() => { logout(); navigate("/"); }} className="flex items-center gap-3 px-4 py-3 rounded-none font-display text-sm tracking-tight text-fire hover:bg-fire-subtle"><LogOut size={17} /> Logout</button>
          </nav>
        </aside>

        <div className="lg:col-span-3">
          {tab === "orders" && (
            orders.length === 0 ? <EmptyState icon={Package} title="No orders yet" subtitle="Your order history will appear here." /> : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} data-testid={`account-order-${o.order_number}`} className="bg-white border border-ink-200 rounded-none p-5">
                    <div className="flex justify-between items-start">
                      <div><span className="font-mono text-xs text-ink-400">{o.created_at?.slice(0, 10)}</span><p className="font-display font-semibold text-lg">{o.order_number}</p></div>
                      <span className="bg-fire/10 text-fire font-bold uppercase text-xs px-3 py-1.5 rounded-none">{LABELS[o.status] || o.status}</span>
                    </div>
                    <div className="flex gap-2 mt-3">{o.items.slice(0, 4).map((it, i) => <img key={i} src={it.image_url} alt="" className="h-14 w-14 rounded-none object-cover bg-ink-100" />)}</div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-ink-200">
                      <span className="text-ink-500 text-sm">{o.items.length} item(s) · {o.payment_method}</span>
                      <div className="flex items-center gap-3">
                        {o.status === "delivered" && <button onClick={() => setReturnFor(o)} data-testid={`account-return-btn-${o.order_number}`} className="flex items-center gap-1.5 text-xs font-bold uppercase border border-ink-200 px-3 py-1.5 rounded-none hover:border-obsidian"><RotateCcw size={13} /> Return</button>}
                        <span className="font-mono font-bold text-fire">{fmt(o.total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "credit" && (
            <div>
              <div className="bg-obsidian text-white rounded-none p-6 mb-5" data-testid="account-store-credit-balance">
                <div className="flex items-center gap-2 mb-1"><Gift size={16} className="text-fire" /><span className="font-mono text-xs uppercase tracking-widest text-white/60">Store Credit Balance</span></div>
                <p className="font-display font-semibold text-2xl font-mono">{fmt(credit.balance)}</p>
                <p className="text-white/50 text-xs mt-2">Apply your balance at checkout to save on your next drop.</p>
              </div>
              <h4 className="font-display text-sm mb-3">Ledger</h4>
              {credit.ledger.length === 0 ? <p className="text-ink-400 text-sm">No transactions yet.</p> : (
                <div className="space-y-2">
                  {credit.ledger.map((l) => (
                    <div key={l.id} className="flex justify-between items-center bg-white border border-ink-200 rounded-none px-4 py-3">
                      <div><p className="font-display font-bold text-sm capitalize">{l.reason.replace(/_/g, " ").toLowerCase()}</p><span className="font-mono text-xs text-ink-400">{l.created_at?.slice(0, 10)}</span></div>
                      <span className={`font-mono font-bold ${l.amount >= 0 ? "text-green-600" : "text-fire"}`}>{l.amount >= 0 ? "+" : "−"}{fmt(Math.abs(l.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "addresses" && <AddressesTab />}
          {tab === "wishlist" && <WishlistTab />}
          {tab === "settings" && <SettingsTab user={user} />}
        </div>
      </div>

      {returnFor && (
        <div className="fixed inset-0 bg-obsidian/60 z-50 grid place-items-center p-5" onClick={() => setReturnFor(null)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-none p-6 w-full max-w-md">
            <div className="flex justify-between mb-4"><h3 className="font-display">Request Return</h3><button onClick={() => setReturnFor(null)}><X size={20} /></button></div>
            <p className="text-sm text-ink-500 mb-4">Order <b>{returnFor.order_number}</b> · {fmt(returnFor.total)}</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Reason for return (e.g. size too small, defect)" data-testid="account-return-reason" className="w-full border border-ink-200 rounded-none px-4 py-3 outline-none focus:border-obsidian" />
            <button onClick={submitReturn} data-testid="account-return-submit" className="w-full bg-obsidian text-white font-display py-3 rounded-none mt-4 hover:bg-fire transition-colors">Submit Request</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
