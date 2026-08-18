import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Truck, Wallet, Tag, Check, Loader2 } from "lucide-react";
import { http, fmt } from "../lib/api";
import { useStore } from "../context/StoreContext";
import { toast } from "sonner";

const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad"];

export default function Checkout() {
  const { cart, settings, user, loadCart } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_name: user?.name || "", customer_phone: "", customer_email: user?.email || "",
    address_l1: "", city: "Karachi", postal_code: "",
  });
  const [payment, setPayment] = useState("COD");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [placing, setPlacing] = useState(false);

  const freeMin = Number(settings?.free_shipping_min_amt || 5000);
  const subtotal = cart.subtotal;
  const shipping = subtotal >= freeMin ? 0 : Number(settings?.flat_shipping_fee || 250);
  const total = Math.max(0, subtotal - discount + shipping);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const applyCoupon = async () => {
    if (!coupon) return;
    try {
      const { data } = await http.post("/checkout/apply-coupon", { code: coupon, subtotal });
      setDiscount(data.data.discount);
      setCouponMsg(`✓ ${data.data.code} applied — you save ${fmt(data.data.discount)}`);
    } catch (e) {
      setDiscount(0);
      setCouponMsg(e.response?.data?.detail || "Invalid coupon");
    }
  };

  const placeOrder = async () => {
    if (!form.customer_name || !form.customer_phone || !form.address_l1) return toast.error("Please fill in your contact & address");
    setPlacing(true);
    try {
      const payload = {
        customer_name: form.customer_name, customer_phone: form.customer_phone, customer_email: form.customer_email,
        shipping_address: { address_l1: form.address_l1, city: form.city, postal_code: form.postal_code, country_code: "PK" },
        payment_method: payment, coupon_code: discount > 0 ? coupon : null,
      };
      const { data } = await http.post("/orders", payload);
      const order = data.data;
      if (payment === "CARD") {
        const { data: sess } = await http.post("/payments/stripe/checkout", { order_id: order.id, origin_url: window.location.origin });
        window.location.href = sess.data.checkout_url;
        return;
      }
      await loadCart();
      navigate(`/order-confirmation/${order.order_number}`, { state: { order } });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not place order");
      setPlacing(false);
    }
  };

  if (cart.items.length === 0) {
    return <div className="max-w-lg mx-auto px-5 py-20 text-center"><h2 className="font-display text-2xl font-black uppercase">Your bag is empty</h2><button onClick={() => navigate("/")} className="mt-6 bg-obsidian text-white font-bold uppercase px-8 py-4 rounded-full">Continue Shopping</button></div>;
  }

  const Field = ({ label, k, type = "text", placeholder, testid, required }) => (
    <div>
      <label className="font-display font-bold uppercase text-xs tracking-wide text-ink-500">{label}{required && " *"}</label>
      <input type={type} value={form[k]} onChange={set(k)} placeholder={placeholder} data-testid={testid} className="w-full mt-1.5 border border-ink-200 rounded-xl px-4 py-3 outline-none focus:border-obsidian transition-colors" />
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-10">
        <form data-testid="checkout-form" onSubmit={(e) => e.preventDefault()} className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="font-display font-bold uppercase tracking-tight text-lg mb-4">Contact & Shipping</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name" k="customer_name" placeholder="Ahmed Khan" testid="checkout-fullname-input" required />
              <Field label="Phone" k="customer_phone" placeholder="+92 3XX XXXXXXX" testid="checkout-phone-input" required />
              <div className="sm:col-span-2"><Field label="Email (optional)" k="customer_email" type="email" placeholder="you@email.com" testid="checkout-email-input" /></div>
              <div className="sm:col-span-2"><Field label="Address" k="address_l1" placeholder="House #, Street, Area" testid="checkout-address-input" required /></div>
              <div>
                <label className="font-display font-bold uppercase text-xs tracking-wide text-ink-500">City *</label>
                <select value={form.city} onChange={set("city")} data-testid="checkout-city-select" className="w-full mt-1.5 border border-ink-200 rounded-xl px-4 py-3 outline-none focus:border-obsidian bg-white">
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <Field label="Postal Code" k="postal_code" placeholder="54000" />
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold uppercase tracking-tight text-lg mb-4">Payment Method</h3>
            <div className="space-y-3">
              {[
                { v: "COD", icon: Truck, t: "Cash on Delivery", s: "Pay when your kicks arrive — most popular" },
                { v: "WALLET", icon: Wallet, t: "JazzCash / EasyPaisa", s: "Instant wallet transfer" },
                { v: "CARD", icon: CreditCard, t: "Debit / Credit Card", s: "Secure card payment via Stripe" },
              ].map((m) => (
                <button key={m.v} onClick={() => setPayment(m.v)} data-testid={`checkout-payment-method-${m.v}`} className={`w-full flex items-center gap-4 border-2 rounded-2xl p-4 text-left transition-colors ${payment === m.v ? "border-obsidian bg-white" : "border-ink-200"}`}>
                  <div className={`h-11 w-11 grid place-items-center rounded-full ${payment === m.v ? "bg-fire text-white" : "bg-ink-100"}`}><m.icon size={19} /></div>
                  <div className="flex-1"><p className="font-display font-bold uppercase text-sm tracking-tight">{m.t}</p><p className="text-ink-400 text-xs">{m.s}</p></div>
                  {payment === m.v && <Check size={20} className="text-fire" />}
                </button>
              ))}
            </div>
            {payment === "WALLET" && <p className="text-xs text-ink-400 mt-3 bg-fire-subtle p-3 rounded-xl">Note: Wallet payment is <b>MOCKED</b> for demo — order confirms instantly.</p>}
          </div>
        </form>

        {/* summary */}
        <div className="lg:sticky lg:top-28 lg:self-start bg-white rounded-2xl p-6 border border-ink-200 h-fit">
          <h3 className="font-display font-bold uppercase tracking-tight text-lg mb-4">Order Summary</h3>
          <div className="space-y-3 max-h-56 overflow-y-auto no-scrollbar mb-4">
            {cart.items.map((it) => (
              <div key={it.id} className="flex gap-3 items-center">
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-ink-100 relative shrink-0"><img src={it.image} alt="" className="h-full w-full object-cover" /><span className="absolute -top-1 -right-1 h-5 w-5 bg-obsidian text-white text-[10px] font-bold rounded-full grid place-items-center">{it.quantity}</span></div>
                <div className="flex-1 min-w-0"><p className="font-display font-bold text-xs leading-tight line-clamp-1">{it.name}</p><span className="font-mono text-[11px] text-ink-400">EU {it.size}</span></div>
                <span className="font-mono text-sm font-bold">{fmt(it.line_total)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 flex items-center border border-ink-200 rounded-xl px-3"><Tag size={15} className="text-ink-400" /><input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Promo code" data-testid="checkout-coupon-input" className="flex-1 px-2 py-2.5 outline-none text-sm font-mono uppercase" /></div>
            <button onClick={applyCoupon} data-testid="checkout-apply-coupon-btn" className="bg-obsidian text-white font-bold uppercase text-sm px-4 rounded-xl hover:bg-fire transition-colors">Apply</button>
          </div>
          {couponMsg && <p className={`text-xs mb-3 ${discount > 0 ? "text-green-600" : "text-fire"}`}>{couponMsg}</p>}
          <div className="space-y-2 text-sm border-t border-ink-200 pt-4">
            <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span className="font-mono">{fmt(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-mono">−{fmt(discount)}</span></div>}
            <div className="flex justify-between"><span className="text-ink-500">Shipping</span><span className="font-mono">{shipping === 0 ? "FREE" : fmt(shipping)}</span></div>
            <div className="flex justify-between font-display font-black uppercase text-lg border-t border-ink-200 pt-2"><span>Total</span><span className="font-mono text-fire">{fmt(total)}</span></div>
          </div>
          <button onClick={placeOrder} disabled={placing} data-testid="checkout-submit-order-btn" className="w-full bg-obsidian text-white font-display font-bold uppercase tracking-wide py-4 rounded-full mt-5 hover:bg-fire transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {placing ? <><Loader2 size={18} className="animate-spin" /> Placing…</> : `Place Order · ${fmt(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
