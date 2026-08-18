import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Package, Heart, LogOut, MapPin } from "lucide-react";
import { http, fmt } from "../lib/api";
import { useStore } from "../context/StoreContext";
import { EmptyState } from "../components/common";

const LABELS = { placed: "Placed", confirmed: "Verified", packed: "Packed", shipped: "Dispatched", out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled" };

export default function Account() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return navigate("/login");
    http.get("/orders").then(({ data }) => setOrders(data.data)).catch(() => {});
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-10 min-h-[70vh]">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 rounded-full bg-obsidian text-white grid place-items-center font-display font-black text-xl">{user.name?.[0] || "U"}</div>
        <div><h1 className="font-display text-2xl font-black uppercase tracking-tight">Hey, {user.name?.split(" ")[0]}</h1><p className="text-ink-500 text-sm">{user.email}</p></div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {[["orders", "My Orders", Package], ["wishlist", "Wishlist", Heart], ["settings", "Settings", User]].map(([k, l, I]) => (
              <button key={k} onClick={() => setTab(k)} data-testid={`account-tab-${k}`} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-display font-bold uppercase text-sm tracking-tight whitespace-nowrap ${tab === k ? "bg-obsidian text-white" : "hover:bg-ink-100"}`}><I size={17} /> {l}</button>
            ))}
            <button onClick={() => { logout(); navigate("/"); }} className="flex items-center gap-3 px-4 py-3 rounded-xl font-display font-bold uppercase text-sm tracking-tight text-fire hover:bg-fire-subtle"><LogOut size={17} /> Logout</button>
          </nav>
        </aside>

        <div className="lg:col-span-3">
          {tab === "orders" && (
            orders.length === 0 ? <EmptyState icon={Package} title="No orders yet" subtitle="Your order history will appear here." /> : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="bg-white border border-ink-200 rounded-2xl p-5">
                    <div className="flex justify-between items-start">
                      <div><span className="font-mono text-xs text-ink-400">{o.created_at?.slice(0, 10)}</span><p className="font-display font-black text-lg">{o.order_number}</p></div>
                      <span className="bg-fire/10 text-fire font-bold uppercase text-xs px-3 py-1.5 rounded-full">{LABELS[o.status] || o.status}</span>
                    </div>
                    <div className="flex gap-2 mt-3">{o.items.slice(0, 4).map((it, i) => <img key={i} src={it.image_url} alt="" className="h-14 w-14 rounded-lg object-cover bg-ink-100" />)}</div>
                    <div className="flex justify-between mt-3 pt-3 border-t border-ink-200"><span className="text-ink-500 text-sm">{o.items.length} item(s) · {o.payment_method}</span><span className="font-mono font-bold text-fire">{fmt(o.total)}</span></div>
                  </div>
                ))}
              </div>
            )
          )}
          {tab === "wishlist" && <button onClick={() => navigate("/wishlist")} className="bg-obsidian text-white font-bold uppercase px-6 py-3 rounded-full">Go to Wishlist</button>}
          {tab === "settings" && (
            <div className="bg-white border border-ink-200 rounded-2xl p-6 max-w-md">
              <h3 className="font-display font-bold uppercase mb-4">Profile</h3>
              <div className="space-y-3 text-sm"><p><span className="text-ink-400">Name:</span> {user.name}</p><p><span className="text-ink-400">Email:</span> {user.email}</p><p><span className="text-ink-400">Role:</span> {user.role}</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
