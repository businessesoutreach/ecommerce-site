import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Package, Heart, LogOut, Gift, RotateCcw, X } from "lucide-react";
import { http, fmt } from "../lib/api";
import { useStore } from "../context/StoreContext";
import { EmptyState } from "../components/common";
import { toast } from "sonner";

const LABELS = { placed: "Placed", confirmed: "Verified", packed: "Packed", shipped: "Dispatched", out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled", return_requested: "Return Requested", returned: "Returned" };

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
        <div className="h-14 w-14 rounded-none bg-obsidian text-white grid place-items-center font-display font-black text-xl">{user.name?.[0] || "U"}</div>
        <div><h1 className="font-display text-2xl font-black uppercase tracking-tight">Hey, {user.name?.split(" ")[0]}</h1><p className="text-ink-500 text-sm">{user.email}</p></div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {[["orders", "My Orders", Package], ["credit", "Store Credit", Gift], ["wishlist", "Wishlist", Heart], ["settings", "Settings", User]].map(([k, l, I]) => (
              <button key={k} onClick={() => setTab(k)} data-testid={`account-tab-${k}`} className={`flex items-center gap-3 px-4 py-3 rounded-none font-display font-bold uppercase text-sm tracking-tight whitespace-nowrap ${tab === k ? "bg-obsidian text-white" : "hover:bg-ink-100"}`}><I size={17} /> {l}{k === "credit" && credit.balance > 0 && <span className="ml-1 font-mono text-fire">{fmt(credit.balance)}</span>}</button>
            ))}
            <button onClick={() => { logout(); navigate("/"); }} className="flex items-center gap-3 px-4 py-3 rounded-none font-display font-bold uppercase text-sm tracking-tight text-fire hover:bg-fire-subtle"><LogOut size={17} /> Logout</button>
          </nav>
        </aside>

        <div className="lg:col-span-3">
          {tab === "orders" && (
            orders.length === 0 ? <EmptyState icon={Package} title="No orders yet" subtitle="Your order history will appear here." /> : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} data-testid={`account-order-${o.order_number}`} className="bg-white border border-ink-200 rounded-none p-5">
                    <div className="flex justify-between items-start">
                      <div><span className="font-mono text-xs text-ink-400">{o.created_at?.slice(0, 10)}</span><p className="font-display font-black text-lg">{o.order_number}</p></div>
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
                <p className="font-display font-black text-4xl font-mono">{fmt(credit.balance)}</p>
                <p className="text-white/50 text-xs mt-2">Apply your balance at checkout to save on your next drop.</p>
              </div>
              <h4 className="font-display font-bold uppercase text-sm mb-3">Ledger</h4>
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

          {tab === "wishlist" && <button onClick={() => navigate("/wishlist")} className="bg-obsidian text-white font-bold uppercase px-6 py-3 rounded-none">Go to Wishlist</button>}
          {tab === "settings" && (
            <div className="bg-white border border-ink-200 rounded-none p-6 max-w-md">
              <h3 className="font-display font-bold uppercase mb-4">Profile</h3>
              <div className="space-y-3 text-sm"><p><span className="text-ink-400">Name:</span> {user.name}</p><p><span className="text-ink-400">Email:</span> {user.email}</p><p><span className="text-ink-400">Role:</span> {user.role}</p></div>
            </div>
          )}
        </div>
      </div>

      {returnFor && (
        <div className="fixed inset-0 bg-obsidian/60 z-50 grid place-items-center p-5" onClick={() => setReturnFor(null)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-none p-6 w-full max-w-md">
            <div className="flex justify-between mb-4"><h3 className="font-display font-black text-xl uppercase">Request Return</h3><button onClick={() => setReturnFor(null)}><X size={20} /></button></div>
            <p className="text-sm text-ink-500 mb-4">Order <b>{returnFor.order_number}</b> · {fmt(returnFor.total)}</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Reason for return (e.g. size too small, defect)" data-testid="account-return-reason" className="w-full border border-ink-200 rounded-none px-4 py-3 outline-none focus:border-obsidian" />
            <button onClick={submitReturn} data-testid="account-return-submit" className="w-full bg-obsidian text-white font-display font-bold uppercase py-3 rounded-none mt-4 hover:bg-fire transition-colors">Submit Request</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
