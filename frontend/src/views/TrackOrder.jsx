import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Package, CheckCircle2, Truck, MapPin } from "lucide-react";
import { http, fmt } from "../lib/api";
import { toast } from "sonner";
import PhoneInput from "../components/PhoneInput";

const STEPS = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];
const LABELS = { placed: "Placed", confirmed: "Verified", packed: "Packed", shipped: "Dispatched", out_for_delivery: "Out for Delivery", delivered: "Delivered" };

export default function TrackOrder() {
  const [orderNum, setOrderNum] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const track = async () => {
    if (!orderNum || !phone) return toast.error("Enter order ID and phone");
    setLoading(true);
    try {
      const { data } = await http.get(`/orders/${orderNum}?phone=${encodeURIComponent(phone)}`);
      setOrder(data.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Order not found");
      setOrder(null);
    }
    setLoading(false);
  };

  const currentIdx = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto px-5 py-14 min-h-[70vh]">
      <h1 className="font-display tracking-tight text-center">Track Your Order</h1>
      <p className="text-ink-500 text-center mt-2">Enter your tracking ID and phone number.</p>

      <div className="bg-white border border-ink-200 rounded-none p-6 mt-8 space-y-4">
        <input value={orderNum} onChange={(e) => setOrderNum(e.target.value.toUpperCase())} placeholder="PK-SNK-XXXXX" data-testid="tracking-search-input" className="w-full mb-4 border border-ink-200 rounded-none px-4 py-3 outline-none focus:border-obsidian font-mono " />
        <PhoneInput value={phone} onChange={setPhone} placeholder="Phone used at checkout" className="mb-4" />
        <button onClick={track} disabled={loading} data-testid="tracking-search-btn" className="w-full bg-obsidian text-white font-display tracking-wider py-4 rounded-none flex items-center justify-center gap-2 hover:bg-fire transition-colors"><Search size={17} /> {loading ? "Searching…" : "Track Order"}</button>
      </div>

      {order && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-ink-200 rounded-none p-6 mt-6">
          <div className="flex justify-between items-center border-b border-ink-200 pb-4">
            <div><span className="font-mono text-xs  text-ink-400">Order</span><p className="font-display font-semibold text-xl">{order.order_number}</p></div>
            <span className="bg-fire/10 text-fire font-bold  text-xs px-3 py-1.5 rounded-none">{LABELS[order.status] || order.status}</span>
          </div>
          <div className="mt-6 space-y-5">
            {STEPS.map((s, i) => {
              const done = i <= currentIdx;
              const Icon = [Package, CheckCircle2, Package, Truck, Truck, MapPin][i];
              return (
                <div key={s} className="flex items-center gap-4" data-testid={`tracking-timeline-step-${i}`}>
                  <div className={`h-10 w-10 grid place-items-center rounded-none shrink-0 ${done ? "bg-fire text-white" : "bg-ink-100 text-ink-400"}`}><Icon size={17} /></div>
                  <div className="flex-1"><p className={`font-display text-sm tracking-tight ${done ? "text-obsidian" : "text-ink-400"}`}>{LABELS[s]}</p></div>
                  {done && <CheckCircle2 size={18} className="text-fire" />}
                </div>
              );
            })}
          </div>
          {order.tracking_number && <p className="mt-4 text-sm text-ink-500">Courier: <b>{order.courier_name}</b> · {order.tracking_number}</p>}
          <div className="border-t border-ink-200 mt-5 pt-4 flex justify-between font-display"><span>Total</span><span className="font-mono text-fire">{fmt(order.total)}</span></div>
        </motion.div>
      )}
    </div>
  );
}

