import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  Clock,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Mail,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { http, fmt } from "../lib/api";
import { useStore } from "../context/StoreContext";
import { toast } from "sonner";
import PhoneInput from "../components/PhoneInput";

const STEPS = [
  { key: "placed", label: "Placed", desc: "Order received & logged into system" },
  { key: "confirmed", label: "Verified", desc: "Order verified & approved by ops" },
  { key: "packed", label: "Packed", desc: "QC inspection passed & boxed" },
  { key: "shipped", label: "Dispatched", desc: "Handed over to courier partner" },
  { key: "out_for_delivery", label: "Out for Delivery", desc: "Rider on the road to destination" },
  { key: "delivered", label: "Delivered", desc: "Package signed & received" },
];

const STATUS_COLORS = {
  placed: "bg-amber-100 text-amber-800 border-amber-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  packed: "bg-indigo-100 text-indigo-800 border-indigo-300",
  shipped: "bg-purple-100 text-purple-800 border-purple-300",
  out_for_delivery: "bg-orange-100 text-orange-800 border-orange-300",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  return_requested: "bg-yellow-100 text-yellow-800 border-yellow-300",
  returned: "bg-ink-100 text-ink-700 border-ink-300",
};

const STATUS_LABELS = {
  placed: "Order Placed",
  confirmed: "Verified",
  packed: "Packed",
  shipped: "Dispatched",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return Requested",
  returned: "Returned",
};

function formatAddress(addr) {
  if (!addr) return "—";
  if (typeof addr === "string") return addr;
  return [addr.address_l1, addr.address_l2, addr.city, addr.province, addr.postal_code]
    .filter(Boolean)
    .join(", ");
}

function maskPhone(phone, isOwner) {
  if (!phone) return "—";
  if (isOwner) return phone;
  const cleaned = phone.trim();
  if (cleaned.length <= 6) return cleaned;
  return cleaned.slice(0, 5) + " •••• " + cleaned.slice(-3);
}

export default function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useStore();

  const queryOrderNum = (searchParams.get("q") || searchParams.get("order") || "").trim().toUpperCase();

  const [orderNum, setOrderNum] = useState(queryOrderNum);
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);

  // Auto-search if query param present and user is logged in or if orderNum is provided
  useEffect(() => {
    if (queryOrderNum) {
      setOrderNum(queryOrderNum);
      // If user is logged in, attempt auto-track directly
      if (user) {
        performTrack(queryOrderNum, "");
      }
    }
  }, [queryOrderNum, user]);

  const performTrack = async (numToTrack, phoneToTrack) => {
    const targetNum = (numToTrack || orderNum).trim().toUpperCase();
    if (!targetNum) {
      toast.error("Please enter an Order ID (e.g. PK-SNK-96774)");
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const queryParam = phoneToTrack || phone ? `?phone=${encodeURIComponent(phoneToTrack || phone)}` : "";
      const { data } = await http.get(`/orders/${encodeURIComponent(targetNum)}${queryParam}`);
      if (data.success && data.data) {
        setOrder(data.data);
        if (queryOrderNum !== targetNum) {
          setSearchParams({ q: targetNum });
        }
      } else {
        setOrder(null);
        toast.error("Could not find order details");
      }
    } catch (e) {
      const detail = e.response?.data?.detail;
      if (e.response?.status === 403) {
        toast.error("Security check: Please enter the phone number used at checkout");
      } else {
        toast.error(detail || "Order not found. Please double-check your Order ID.");
      }
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAwb = (awb) => {
    if (!awb) return;
    navigator.clipboard.writeText(awb);
    setCopiedAwb(true);
    toast.success("AWB tracking number copied to clipboard");
    setTimeout(() => setCopiedAwb(false), 2500);
  };

  const currentIdx = order ? STEPS.findIndex((s) => s.key === order.status) : -1;
  const isCancelled = order?.status === "cancelled";

  // Build timestamp map from status_history
  const historyTimestamps = {};
  if (order?.status_history) {
    for (const h of order.status_history) {
      historyTimestamps[h.status] = h.at;
    }
  }

  return (
    <div className="min-h-[85vh] bg-ink-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section (Consistent Clean Styling) */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-ink-200 text-obsidian text-xs font-mono font-bold tracking-widest uppercase mb-3 shadow-sm">
            <Truck size={14} className="text-fire" /> Real-time Logistics Tracker
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight uppercase text-obsidian">
            Track Your <span className="text-fire">Sneaker Drop</span>
          </h1>
          <p className="text-ink-500 text-sm sm:text-base mt-2 max-w-xl mx-auto">
            Get instant live updates, dispatch tracking, and delivery timelines for your SoleKicks order.
          </p>

          {/* Search Card */}
          <div className="bg-white text-obsidian p-5 sm:p-7 mt-7 shadow-sm border border-ink-300 max-w-2xl mx-auto text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-mono font-bold tracking-widest uppercase text-ink-500 mb-1.5">
                  Order ID
                </label>
                <input
                  type="text"
                  value={orderNum}
                  onChange={(e) => setOrderNum(e.target.value.toUpperCase())}
                  placeholder="PK-SNK-XXXXX"
                  data-testid="tracking-search-input"
                  className="w-full bg-ink-50 border border-ink-300 px-3.5 py-3 text-sm font-mono font-bold uppercase tracking-wider outline-none focus:border-obsidian transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold tracking-widest uppercase text-ink-500 mb-1.5">
                  Phone Number
                </label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="3XX XXXXXXX"
                  className="w-full"
                />
              </div>
            </div>

            <button
              onClick={() => performTrack(orderNum, phone)}
              disabled={loading}
              data-testid="tracking-search-btn"
              className="w-full mt-4 bg-obsidian text-white font-display font-bold text-sm tracking-wider uppercase py-3.5 hover:bg-fire transition-colors flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Verifying Drop Status...
                </>
              ) : (
                <>
                  <Search size={16} /> Track Drop
                </>
              )}
            </button>

            <p className="text-[11px] font-mono text-ink-400 mt-2.5 text-center">
              💡 Logged-in customers: Simply enter your Order ID or view orders in your{" "}
              <Link to="/account" className="text-fire underline font-bold">
                Account Dashboard
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Results Container */}
        <div>
        <AnimatePresence mode="wait">
          {order ? (
            <motion.div
              key={order.order_number}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Order Header Capsule */}
              <div className="bg-white border border-ink-300 p-5 sm:p-7 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-200 pb-5">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs font-bold text-ink-400 tracking-wider">ORDER</span>
                      <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-obsidian">
                        {order.order_number}
                      </h2>
                      <span
                        className={`font-mono text-xs font-bold px-3 py-1 border uppercase tracking-wider ${
                          STATUS_COLORS[order.status] || "bg-ink-100 text-obsidian border-ink-200"
                        }`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-ink-500 mt-1.5 flex items-center gap-1.5">
                      <Clock size={13} /> Placed on{" "}
                      {new Date(order.created_at).toLocaleDateString("en-PK", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">Total Payable</span>
                    <p className="font-display font-black text-2xl sm:text-3xl text-fire font-mono">
                      {fmt(order.total)}
                    </p>
                    <span className="text-xs font-mono text-ink-500 capitalize">
                      {order.payment_method === "COD" ? "Cash on Delivery" : `Paid via ${order.payment_method}`}
                    </span>
                  </div>
                </div>

                {/* Estimated Delivery Notice */}
                {!isCancelled && (
                  <div className="mt-4 pt-1 flex items-center gap-2 text-xs font-mono text-ink-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      {order.status === "delivered" ? (
                        <b className="text-emerald-700">Delivered successfully to recipient.</b>
                      ) : (
                        <>
                          Estimated Delivery: <b className="text-obsidian">2–3 Business Days</b> across Pakistan
                        </>
                      )}
                    </span>
                  </div>
                )}

                {/* Cancelled Alert if applicable */}
                {isCancelled && (
                  <div className="mt-4 bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-red-800 text-sm">
                    <AlertTriangle size={20} className="text-red-600 shrink-0" />
                    <div>
                      <p className="font-bold">This order has been cancelled.</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        Inventory items have been restocked. Any applied store credit has been refunded to your wallet.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Visual Timeline */}
              {!isCancelled && (
                <div className="bg-white border border-ink-300 p-5 sm:p-7 shadow-sm">
                  <h3 className="font-display font-bold text-base text-obsidian uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Truck size={18} className="text-fire" /> Delivery Milestones
                  </h3>

                  <div className="relative">
                    {/* Stepper bar desktop */}
                    <div className="hidden sm:grid sm:grid-cols-6 gap-2 text-center relative">
                      <div className="absolute top-4 left-6 right-6 h-0.5 bg-ink-200 -z-0" />
                      <div
                        className="absolute top-4 left-6 h-0.5 bg-obsidian transition-all duration-500 -z-0"
                        style={{
                          width: `${Math.max(0, (Math.min(currentIdx, STEPS.length - 1) / (STEPS.length - 1)) * 92)}%`,
                        }}
                      />

                      {STEPS.map((s, i) => {
                        const isDone = i <= currentIdx;
                        const isCurrent = i === currentIdx;
                        const dateStamp = historyTimestamps[s.key];

                        return (
                          <div key={s.key} className="flex flex-col items-center relative z-10 px-1">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all shadow-sm ${
                                isDone
                                  ? "bg-obsidian text-white"
                                  : "bg-ink-100 text-ink-400 border border-ink-200"
                              } ${isCurrent ? "ring-2 ring-fire ring-offset-2 scale-110" : ""}`}
                            >
                              {isDone ? <Check size={15} /> : i + 1}
                            </div>
                            <span
                              className={`font-display text-xs font-bold mt-2 uppercase tracking-tight ${
                                isCurrent ? "text-fire" : isDone ? "text-obsidian" : "text-ink-400"
                              }`}
                            >
                              {s.label}
                            </span>
                            {dateStamp && (
                              <span className="font-mono text-[10px] text-ink-400 mt-1 leading-tight">
                                {new Date(dateStamp).toLocaleDateString("en-PK", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Stepper vertical for mobile */}
                    <div className="sm:hidden space-y-4">
                      {STEPS.map((s, i) => {
                        const isDone = i <= currentIdx;
                        const isCurrent = i === currentIdx;
                        const dateStamp = historyTimestamps[s.key];

                        return (
                          <div key={s.key} className="flex items-start gap-3 relative">
                            {i < STEPS.length - 1 && (
                              <div
                                className={`absolute left-3.5 top-8 w-0.5 h-full -ml-[1px] ${
                                  i < currentIdx ? "bg-obsidian" : "bg-ink-200"
                                }`}
                              />
                            )}
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                                isDone ? "bg-obsidian text-white" : "bg-ink-100 text-ink-400"
                              } ${isCurrent ? "ring-2 ring-fire ring-offset-1" : ""}`}
                            >
                              {isDone ? <Check size={14} /> : i + 1}
                            </div>
                            <div className="flex-1 pb-3">
                              <div className="flex justify-between items-center">
                                <p
                                  className={`font-display text-xs font-bold uppercase tracking-tight ${
                                    isCurrent ? "text-fire" : isDone ? "text-obsidian" : "text-ink-400"
                                  }`}
                                >
                                  {s.label}
                                </p>
                                {dateStamp && (
                                  <span className="font-mono text-[10px] text-ink-400">
                                    {new Date(dateStamp).toLocaleDateString("en-PK", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-ink-500 mt-0.5">{s.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Courier Dispatch Badge if dispatched */}
                    {order.tracking_number && (
                      <div className="mt-8 pt-5 border-t border-ink-200 bg-ink-50 p-4 border flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-obsidian text-white grid place-items-center">
                            <Truck size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold text-obsidian text-sm">
                                {order.courier_name || "TCS Express Logistics"}
                              </span>
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono px-2 py-0.5 font-bold uppercase">
                                Active Dispatch
                              </span>
                            </div>
                            <p className="text-xs font-mono text-ink-500 mt-0.5">
                              AWB / Tracking #:{" "}
                              <span className="font-bold text-obsidian selection:bg-fire">{order.tracking_number}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyAwb(order.tracking_number)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-white border border-ink-300 text-obsidian hover:border-obsidian transition-colors shadow-sm"
                          >
                            {copiedAwb ? (
                              <>
                                <Check size={13} className="text-emerald-600" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={13} /> Copy AWB
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Drop Items Breakdown */}
              <div className="bg-white border border-ink-300 p-5 sm:p-7 shadow-sm">
                <h3 className="font-display font-bold text-base text-obsidian uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Order Items ({order.items?.length || 0})</span>
                  <span className="text-xs font-mono text-ink-400 lowercase font-normal">verified authentic</span>
                </h3>

                <div className="divide-y divide-ink-200">
                  {order.items?.map((item) => (
                    <div key={item.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-contain bg-ink-100 p-1.5 border border-ink-200 shrink-0"
                        />
                        <div>
                          <Link
                            to={item.product?.slug ? `/products/${item.product.slug}` : `/products/${item.product_id}`}
                            className="font-display font-bold text-sm sm:text-base text-obsidian hover:text-fire transition-colors line-clamp-1"
                          >
                            {item.product_name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-ink-100 text-obsidian">
                              EU {item.size}
                            </span>
                            <span className="font-mono text-xs text-ink-500">Qty: {item.quantity}</span>
                          </div>
                          <p className="font-mono text-xs text-ink-500 mt-1">{fmt(item.unit_price)} each</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-sm sm:text-base text-obsidian">
                          {fmt(item.unit_price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Destination & Payment Pricing Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delivery Destination */}
                <div className="bg-white border border-ink-300 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-bold text-sm text-obsidian uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MapPin size={16} className="text-fire" /> Delivery Destination
                    </h4>
                    <div className="bg-ink-50 border border-ink-200 p-4 space-y-1.5 text-xs text-ink-700">
                      <p className="font-bold text-obsidian text-sm">{order.customer_name}</p>
                      <p className="leading-relaxed">{formatAddress(order.shipping_address)}</p>
                      <p className="font-mono text-ink-600 font-semibold pt-1">
                        📞 Phone: {maskPhone(order.customer_phone, order.is_owner)}
                      </p>
                      {order.customer_email && (
                        <p className="font-mono text-ink-500">✉️ Email: {order.customer_email}</p>
                      )}
                    </div>
                  </div>

                  {order.customer_note && (
                    <div className="mt-4 pt-3 border-t border-ink-200 text-xs">
                      <span className="text-ink-400 font-mono uppercase tracking-wider">Delivery Notes:</span>
                      <p className="text-ink-700 italic mt-0.5 font-medium">"{order.customer_note}"</p>
                    </div>
                  )}
                </div>

                {/* Financial Breakdown */}
                <div className="bg-white border border-ink-300 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-bold text-sm text-obsidian uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-fire" /> Payment & Financials
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-ink-600">
                        <span>Subtotal</span>
                        <span className="font-mono font-medium">{fmt(order.subtotal)}</span>
                      </div>

                      {order.discount_amount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</span>
                          <span className="font-mono">−{fmt(order.discount_amount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-ink-600">
                        <span>Shipping Fee</span>
                        <span className="font-mono font-medium">
                          {order.shipping_fee === 0 ? "FREE" : fmt(order.shipping_fee)}
                        </span>
                      </div>

                      {order.store_credit_used > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Store Credit Applied</span>
                          <span className="font-mono">−{fmt(order.store_credit_used)}</span>
                        </div>
                      )}

                      <div className="border-t border-ink-200 pt-2.5 mt-2.5 flex justify-between items-baseline">
                        <div>
                          <span className="font-display font-black text-sm text-obsidian uppercase tracking-wider">
                            Total {order.payment_method === "COD" ? "Payable on Delivery" : "Paid"}
                          </span>
                          <p className="text-[11px] font-mono text-ink-500">
                            {order.payment_method === "COD"
                              ? "Cash due upon parcel inspection"
                              : `Fully settled via ${order.payment_method}`}
                          </p>
                        </div>
                        <span className="font-display font-black text-lg text-fire font-mono">
                          {fmt(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status Pill */}
                  <div className="mt-4 pt-3 border-t border-ink-200 flex items-center justify-between text-xs">
                    <span className="text-ink-400 font-mono uppercase tracking-wider">Payment Status</span>
                    <span
                      className={`font-mono font-bold text-[11px] px-2.5 py-0.5 uppercase tracking-wider ${
                        order.payment_status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {order.payment_status === "paid" ? "Paid" : "Payment Pending / COD"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Need Help Desk / WhatsApp Capsule */}
              <div className="bg-white text-obsidian p-6 border border-ink-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-display font-bold text-base uppercase tracking-wider flex items-center gap-2 text-obsidian">
                    <MessageSquare size={18} className="text-fire" /> Need Assistance With This Drop?
                  </h4>
                  <p className="text-xs text-ink-500 mt-1 max-w-lg">
                    Have questions about sizing, delivery schedule, or want to modify your order? Our concierge is
                    active 7 days a week.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                  <a
                    href={`https://wa.me/923146180920?text=Hi%20SoleKicks,%20I%20have%20an%20inquiry%20regarding%20my%20order%20${encodeURIComponent(
                      order.order_number
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-display text-xs font-bold tracking-wider px-5 py-3 uppercase transition-colors"
                  >
                    <MessageSquare size={14} /> WhatsApp Support
                  </a>
                  <a
                    href={`mailto:support@solekicks.pk?subject=Inquiry regarding order ${order.order_number}`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-obsidian hover:bg-fire text-white font-display text-xs font-bold tracking-wider px-5 py-3 uppercase transition-colors"
                  >
                    <Mail size={14} /> Email Us
                  </a>
                </div>
              </div>
            </motion.div>
          ) : hasSearched && !loading ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-ink-300 p-8 text-center max-w-xl mx-auto shadow-sm"
            >
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-none grid place-items-center mx-auto mb-4 border border-red-200">
                <AlertCircle size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-obsidian uppercase">No Order Found</h3>
              <p className="text-sm text-ink-500 mt-2 leading-relaxed">
                We couldn't locate an order matching <b className="font-mono text-obsidian">{orderNum}</b>. Please
                ensure the order ID and contact phone number match the details provided during checkout.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setOrderNum("");
                    setPhone("");
                    setHasSearched(false);
                  }}
                  className="text-xs font-display font-bold bg-obsidian text-white px-5 py-2.5 uppercase tracking-wider hover:bg-fire transition-colors"
                >
                  Try Another Search
                </button>
                <Link
                  to="/account"
                  className="text-xs font-display font-bold border border-ink-300 text-obsidian px-5 py-2.5 uppercase tracking-wider hover:bg-ink-100 transition-colors"
                >
                  My Account Orders
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
