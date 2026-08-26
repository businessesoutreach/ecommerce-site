import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Truck, Wallet, Tag, Check, Loader2, Gift, Info, ChevronDown, Search } from "lucide-react";
import { http, fmt } from "../lib/api";
import { useStore } from "../context/StoreContext";
import { toast } from "sonner";
import PhoneInput from "../components/PhoneInput";
import { useSearchParams } from "react-router-dom";
import { CustomDropdown, PROVINCES, PROVINCE_CITIES, ALL_CITIES } from "../components/LocationDropdowns";

const Field = ({ label, k, type = "text", placeholder, testid, required, form, set }) => (
  <div>
    <label className="font-display text-xs tracking-wide text-ink-500">{label}{required && " *"}</label>
    <input type={type} value={form[k] || ""} onChange={set(k)} placeholder={placeholder} data-testid={testid} className="w-full mt-1.5 border border-ink-200 rounded-none px-4 py-3 outline-none focus:border-obsidian bg-white text-ink-900 transition-colors" />
  </div>
);

export default function Checkout() {
  const { cart, settings, user, loadCart } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_name: user?.name || "", customer_phone: "", customer_email: user?.email || "",
    address_l1: "", province: "Sindh", city: "Karachi", postal_code: "",
  });
  const [addresses, setAddresses] = useState([]);
  const [addressMode, setAddressMode] = useState('new');
  const [payment, setPayment] = useState("COD");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [credit, setCredit] = useState(0);
  const [useCredit, setUseCredit] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("payfast") === "failed") {
      toast.error("Payment was cancelled or failed. Please try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      http.get("/me/store-credit").then(({ data }) => setCredit(data.data.balance || 0)).catch(() => {});
      http.get("/me/addresses").then(({ data }) => {
        setAddresses(data.data);
        if (data.data.length > 0) setAddressMode('saved');
        const def = data.data.find((a) => a.is_default) || data.data[0];
        if (def) setForm((f) => ({ ...f, customer_name: def.full_name, customer_phone: def.phone, address_l1: def.address_l1, province: def.province || "Sindh", city: def.city, postal_code: def.postal_code || "" }));
      }).catch(() => {});
    }
  }, [user]);

  const applyAddress = (a) => setForm((f) => ({ ...f, customer_name: a.full_name, customer_phone: a.phone, address_l1: a.address_l1, province: a.province || "Sindh", city: a.city, postal_code: a.postal_code || "" }));

  const freeMin = Number(settings?.free_shipping_min_amt || 5000);
  const subtotal = cart.subtotal;
  const shipping = subtotal >= freeMin ? 0 : Number(settings?.flat_shipping_fee || 250);
  const preCredit = Math.max(0, subtotal - discount + shipping);
  const creditApplied = useCredit ? Math.min(credit, preCredit) : 0;
  const total = Math.max(0, preCredit - creditApplied);
  const advThreshold = Number(settings?.advance_payment_threshold || 0);
  const advPercent = Number(settings?.advance_payment_percent || 0);
  const advanceRequired = payment === "COD" && advThreshold > 0 && subtotal >= advThreshold;
  const advanceAmount = advanceRequired ? Math.round((subtotal * advPercent) / 100) : 0;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const applyCoupon = async () => {
    if (!coupon) return;
    setApplyingCoupon(true);
    try {
      const { data } = await http.post("/checkout/apply-coupon", { code: coupon, subtotal });
      setDiscount(data.data.discount);
      setCouponMsg(`✓ ${data.data.code} applied — you save ${fmt(data.data.discount)}`);
    } catch (e) {
      setDiscount(0);
      setCouponMsg(e.response?.data?.detail || "Invalid coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };


  const placeOrder = async () => {
    if (!form.customer_name || !form.customer_phone || !form.address_l1) return toast.error("Please fill in your contact & address");
    setPlacing(true);
    try {
      const payload = {
        customer_name: form.customer_name, customer_phone: form.customer_phone, customer_email: form.customer_email,
        shipping_address: { address_l1: form.address_l1, province: form.province, city: form.city, postal_code: form.postal_code, country_code: "PK" },
        payment_method: payment, coupon_code: discount > 0 ? coupon : null,
        store_credit_amount: creditApplied,
      };
      const { data } = await http.post("/orders", payload);
      const order = data.data;

      // Stripe
      if (payment === "CARD") {
        try {
          const { data: stripeData } = await http.post("/payments/stripe/checkout", {
            order_id: order.id,
            origin_url: window.location.origin
          });
          // Redirect to Stripe Checkout
          window.location.href = stripeData.data.checkout_url;
        } catch (stripeErr) {
          toast.error(stripeErr.response?.data?.detail || "Payment initiation failed");
          setPlacing(false);
        }
        return;
      }

      // COD flow
      toast.success("Order placed! A confirmation email has been sent to your email.");
      await loadCart();
      navigate(`/order-confirmation/${order.order_number}`, { state: { order } });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not place order");
      setPlacing(false);
    }
  };



  if (cart.items.length === 0 && !placing) {
    return <div className="max-w-lg mx-auto px-5 py-20 text-center"><h2 className="font-display">Your bag is empty</h2><button onClick={() => navigate("/")} className="mt-6 bg-obsidian text-white font-bold  px-8 py-4 rounded-none">Continue Shopping</button></div>;
  }

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-10">
      <h1 className="font-display tracking-tight mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-10">
        <form data-testid="checkout-form" onSubmit={(e) => e.preventDefault()} className="lg:col-span-2 space-y-8">
          {user && addresses.length > 0 && (
            <div className="flex gap-2 border-b border-ink-200 pb-4">
              <button type="button" onClick={() => setAddressMode('saved')} className={`font-display tracking-tight text-xs sm:text-sm px-5 py-3 transition-colors ${addressMode === 'saved' ? 'bg-obsidian text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
                Saved Addresses
              </button>
              <button type="button" onClick={() => { setAddressMode('new'); setForm({ ...form, address_l1: "", province: "Sindh", city: "Karachi", postal_code: "" }); }} className={`font-display tracking-tight text-xs sm:text-sm px-5 py-3 transition-colors ${addressMode === 'new' ? 'bg-obsidian text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
                New Address
              </button>
            </div>
          )}

          {addressMode === 'saved' && user && addresses.length > 0 ? (
            <div data-testid="checkout-saved-addresses">
              <h3 className="font-display tracking-tight text-lg mb-4">Select Address</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {addresses.map((a) => {
                  const active = form.address_l1 === a.address_l1 && form.customer_phone === a.phone;
                  return (
                    <button key={a.id} type="button" onClick={() => applyAddress(a)} data-testid={`checkout-address-${a.id}`} className={`text-left border-2 p-4 transition-colors ${active ? "border-obsidian bg-white shadow-md" : "border-ink-200 hover:border-obsidian bg-white shadow-sm"}`}>
                      <div className="flex items-center justify-between"><span className="font-display font-semibold text-sm tracking-wider">{a.label || 'Home'}</span>{a.is_default && <span className="text-[10px] font-bold tracking-wider bg-ink-100 px-2 py-0.5 text-ink-800">Default</span>}</div>
                      <p className="text-ink-500 text-xs mt-2">{a.address_l1}, {a.city}</p>
                      <p className="text-ink-400 text-xs mt-1 font-mono">{a.phone}</p>
                      {active && <div className="mt-3 text-xs font-bold text-obsidian  tracking-wide flex items-center gap-1"><Check size={14}/> Selected</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-display tracking-tight text-md mb-4">Contact & Shipping</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field form={form} set={set} label="Full Name" k="customer_name" placeholder="Ahmed Khan" testid="checkout-fullname-input" required />
                <div>
                  <label className="font-display text-xs tracking-wide text-ink-500">Phone *</label>
                  <PhoneInput value={form.customer_phone} onChange={(val) => setForm(f => ({ ...f, customer_phone: val }))} testid="checkout-phone-input" className="mt-1.5" />
                </div>
                <div className="sm:col-span-2"><Field form={form} set={set} label="Email (optional)" k="customer_email" type="email" placeholder="you@email.com" testid="checkout-email-input" /></div>
                <div className="sm:col-span-2"><Field form={form} set={set} label="Address" k="address_l1" placeholder="House #, Street, Area" testid="checkout-address-input" required /></div>
                <div>
                  <label className="font-display text-xs tracking-wide text-ink-500">Province *</label>
                  <CustomDropdown 
                    value={form.province} 
                    onChange={(val) => setForm(f => ({ ...f, province: val, city: "" }))} 
                    options={PROVINCES} 
                    placeholder="Select Province"
                  />
                </div>
                <div>
                  <label className="font-display text-xs tracking-wide text-ink-500">City *</label>
                  <CustomDropdown 
                    value={form.city} 
                    onChange={(val) => setForm(f => ({ ...f, city: val }))} 
                    options={form.province ? PROVINCE_CITIES[form.province] : ALL_CITIES} 
                    placeholder="Select City"
                  />
                </div>
                <Field form={form} set={set} label="Postal Code" k="postal_code" placeholder="54000" />
              </div>
            </div>
          )}

          <div>
            <h3 className="font-display tracking-tight text-md mb-4">Payment Method</h3>
            <div className="space-y-3">
              {[
                { v: "COD", icon: Truck, t: "Cash on Delivery", s: "Pay when your kicks arrive — most popular" },
                { v: "CARD", icon: CreditCard, t: "Debit / Credit Card", s: "Secure card payment via Stripe" },
              ].map((m) => (
                <button key={m.v} onClick={() => setPayment(m.v)} data-testid={`checkout-payment-method-${m.v}`} className={`w-full flex items-center gap-4 border-2 rounded-none p-4 text-left transition-colors ${payment === m.v ? "border-obsidian bg-white" : "border-ink-200"}`}>
                  <div className={`h-11 w-11 grid place-items-center rounded-none ${payment === m.v ? "bg-fire text-white" : "bg-ink-100"}`} style={payment === m.v && m.color ? { backgroundColor: m.color } : {}}><m.icon size={19} /></div>
                  <div className="flex-1"><p className="font-display text-sm tracking-tight">{m.t}</p><p className="text-ink-400 text-xs">{m.s}</p></div>
                  {payment === m.v && <Check size={20} className="text-fire" />}
                </button>
              ))}
            </div>
            {advanceRequired && (
              <div data-testid="checkout-advance-notice" className="mt-3 flex gap-3 bg-obsidian text-white p-4 rounded-none">
                <Info size={18} className="text-fire shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">Orders over <b>{fmt(advThreshold)}</b> require a <b>{advPercent}% advance</b> to confirm. You'll pay <b className="text-fire font-mono">{fmt(advanceAmount)}</b> now, and the remaining <b className="font-mono">{fmt(total - advanceAmount)}</b> as Cash on Delivery.</p>
              </div>
            )}
          </div>
        </form>

        {/* summary */}
        <div className="lg:sticky lg:top-28 lg:self-start bg-white rounded-none p-6 border border-ink-200 h-fit">
          <h3 className="font-display tracking-tight text-lg mb-4">Order Summary</h3>
          <div className="space-y-3 max-h-56 overflow-y-auto no-scrollbar mb-4">
            {cart.items.map((it) => (
              <div key={it.id} className="flex gap-3 items-center">
                <div className="h-14 w-14 rounded-none overflow-hidden bg-ink-100 relative shrink-0"><img src={it.image} alt="" className="h-full w-full object-cover" /><span className="absolute -top-1 -right-1 h-5 w-5 bg-obsidian text-white text-[10px] font-bold rounded-none grid place-items-center">{it.quantity}</span></div>
                <div className="flex-1 min-w-0"><p className="font-display font-bold text-xs leading-tight line-clamp-1">{it.name}</p><span className="font-mono text-[11px] text-ink-400">EU {it.size}</span></div>
                <span className="font-mono text-sm font-bold">{fmt(it.line_total)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 flex items-center border border-ink-200 rounded-none px-3"><Tag size={15} className="text-ink-400" /><input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Promo code" data-testid="checkout-coupon-input" className="flex-1 px-2 py-2.5 outline-none text-sm font-mono " /></div>
            <button disabled={applyingCoupon} onClick={applyCoupon} data-testid="checkout-apply-coupon-btn" className="bg-obsidian text-white font-bold  text-sm px-4 rounded-none hover:bg-fire transition-colors disabled:opacity-70 disabled:cursor-wait min-w-[75px] grid place-items-center">
              {applyingCoupon ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
            </button>
          </div>
          {couponMsg && <p className={`text-xs mb-3 ${discount > 0 ? "text-green-600" : "text-fire"}`}>{couponMsg}</p>}
          {user && credit > 0 && (
            <label data-testid="checkout-store-credit-toggle" className="flex items-center gap-3 border border-ink-200 rounded-none p-3 mb-4 cursor-pointer">
              <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} className="accent-fire h-4 w-4" />
              <Gift size={16} className="text-fire" />
              <span className="text-sm flex-1">Use store credit <b className="font-mono">({fmt(credit)})</b></span>
            </label>
          )}
          <div className="space-y-2 text-sm border-t border-ink-200 pt-4">
            <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span className="font-mono">{fmt(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-mono">−{fmt(discount)}</span></div>}
            <div className="flex justify-between"><span className="text-ink-500">Shipping</span><span className="font-mono">{shipping === 0 ? "FREE" : fmt(shipping)}</span></div>
            {creditApplied > 0 && <div className="flex justify-between text-green-600"><span>Store credit</span><span className="font-mono">−{fmt(creditApplied)}</span></div>}
            <div className="flex justify-between font-display text-lg border-t border-ink-200 pt-2"><span>Total</span><span data-testid="checkout-total-amount" className="font-mono text-fire">{fmt(total)}</span></div>
            {advanceRequired && <div className="flex justify-between text-xs text-ink-500 pt-1"><span>Pay now (advance)</span><span className="font-mono font-bold">{fmt(advanceAmount)}</span></div>}
          </div>
          <button onClick={placeOrder} disabled={placing} data-testid="checkout-submit-order-btn" className="w-full bg-obsidian text-white font-display tracking-wider py-4 rounded-none mt-5 hover:bg-fire transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {placing ? <><Loader2 size={18} className="animate-spin" /> Placing…</> : advanceRequired ? `Pay ${fmt(advanceAmount)} Advance` : `Place Order · ${fmt(total)}`}
          </button>
        </div>
      </div>

    </div>
  );
}

