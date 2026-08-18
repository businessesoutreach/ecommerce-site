import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Package, Truck, MapPin, Home } from "lucide-react";
import { http, fmt } from "../lib/api";

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const { state } = useLocation();
  const [sp] = useSearchParams();
  const [order, setOrder] = useState(state?.order || null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const sessionId = sp.get("session_id");
    if (sessionId) http.get(`/payments/status/${sessionId}`).catch(() => {});
    if (!order && orderNumber) {
      // best-effort: guest lookup won't work without phone; rely on state
    }
  }, [orderNumber]);

  return (
    <div className="max-w-2xl mx-auto px-5 py-16 text-center min-h-[70vh]">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="mx-auto h-20 w-20 grid place-items-center rounded-full bg-fire/10 text-fire mb-6">
        <CheckCircle2 size={44} />
      </motion.div>
      <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight">Order Confirmed!</h1>
      <p className="text-ink-500 mt-2">Thank you — your kicks are on the way. A WhatsApp confirmation will follow shortly.</p>

      <div className="bg-white border border-ink-200 rounded-2xl p-6 mt-8 text-left">
        <div className="flex items-center justify-between border-b border-ink-200 pb-4">
          <div><span className="font-mono text-xs uppercase tracking-wide text-ink-400">Tracking ID</span><p className="font-display font-black text-2xl tracking-tight">{orderNumber}</p></div>
          {order && <div className="text-right"><span className="font-mono text-xs uppercase tracking-wide text-ink-400">Total</span><p className="font-mono font-bold text-xl text-fire">{fmt(order.total)}</p></div>}
        </div>

        <div className="flex justify-between mt-6 relative">
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-ink-200" />
          {[["Placed", Package], ["Verified", CheckCircle2], ["Dispatched", Truck], ["Delivered", MapPin]].map(([l, I], i) => (
            <div key={l} className="relative z-10 flex flex-col items-center gap-2" data-testid={`tracking-timeline-step-${i}`}>
              <div className={`h-9 w-9 grid place-items-center rounded-full ${i === 0 ? "bg-fire text-white" : "bg-white border-2 border-ink-200 text-ink-400"}`}><I size={16} /></div>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${i === 0 ? "text-obsidian" : "text-ink-400"}`}>{l}</span>
            </div>
          ))}
        </div>

        {order && (
          <div className="mt-6 space-y-2 border-t border-ink-200 pt-4">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={it.image_url} alt="" className="h-12 w-12 rounded-lg object-cover bg-ink-100" />
                <div className="flex-1"><p className="font-display font-bold text-sm">{it.product_name}</p><span className="font-mono text-xs text-ink-400">{it.variant_label} · Qty {it.quantity}</span></div>
                <span className="font-mono text-sm font-bold">{fmt(it.unit_price * it.quantity)}</span>
              </div>
            ))}
            <p className="text-xs text-ink-400 pt-2">Payment: <b>{order.payment_method}</b> · {order.payment_status}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-center mt-8">
        <Link to="/track-order" className="border-2 border-obsidian font-display font-bold uppercase text-sm px-6 py-3 rounded-full hover:bg-obsidian hover:text-white transition-colors">Track Order</Link>
        <Link to="/" className="bg-obsidian text-white font-display font-bold uppercase text-sm px-6 py-3 rounded-full flex items-center gap-2 hover:bg-fire transition-colors"><Home size={16} /> Keep Shopping</Link>
      </div>
    </div>
  );
}
