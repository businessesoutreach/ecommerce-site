import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { fmt } from "../lib/api";
import { EmptyState } from "../components/common";

export default function CartPage() {
  const { cart, updateQty, removeItem, settings } = useStore();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = React.useState(null);
  const [removingId, setRemovingId] = React.useState(null);
  const freeMin = Number(settings?.free_shipping_min_amt || 5000);
  const shipping = cart.subtotal >= freeMin ? 0 : Number(settings?.flat_shipping_fee || 250);

  const handleUpdate = async (id, qty) => {
    try {
      setUpdatingId(id);
      await updateQty(id, qty);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (id) => {
    try {
      setRemovingId(id);
      await removeItem(id);
    } finally {
      setRemovingId(null);
    }
  };

  if (cart.items.length === 0)
    return (
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-10 min-h-[60vh]">
        <EmptyState icon={ShoppingBag} title="Your bag is empty" subtitle="Time to fill it with heat." action={<Link to="/new-arrivals" className="bg-obsidian text-white font-display px-8 py-4 rounded-none inline-flex items-center gap-2">Shop New Arrivals <ArrowRight size={16} /></Link>} />
      </div>
    );

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-10">
      <h1 className="font-display tracking-tight mb-8">Your Bag <span className="text-fire">({cart.count})</span></h1>
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((it) => (
            <div key={it.id} data-testid={`cart-page-item-${it.id}`} className="flex gap-4 bg-white rounded-none p-4 border border-ink-200">
              <Link to={`/products/${it.slug}`} className="h-28 w-28 rounded-none overflow-hidden bg-ink-100 shrink-0"><img src={it.image} alt={it.name} className="h-full w-full object-cover" /></Link>
              <div className="flex-1">
                <div className="flex justify-between gap-3">
                  <div>
                    <span className="font-mono text-[11px]  tracking-wider text-ink-400">{it.brand?.replace("-", " ")}</span>
                    <h3 className="font-display font-bold leading-snug">{it.name}</h3>
                    <span className="font-mono text-xs text-ink-500">EU {it.size}</span>
                  </div>
                  <button disabled={removingId === it.id} onClick={() => handleRemove(it.id)} className="text-ink-400 hover:text-fire h-fit disabled:opacity-70 disabled:cursor-wait">
                    {removingId === it.id ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-ink-200 rounded-none relative">
                    {updatingId === it.id && <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] grid place-items-center z-10"><Loader2 size={14} className="animate-spin text-obsidian" /></div>}
                    <button disabled={updatingId === it.id} onClick={() => handleUpdate(it.id, it.quantity - 1)} className="h-8 w-8 grid place-items-center hover:bg-ink-100 disabled:opacity-50"><Minus size={14} /></button>
                    <span className="w-8 text-center font-mono font-bold">{it.quantity}</span>
                    <button disabled={updatingId === it.id} onClick={() => handleUpdate(it.id, it.quantity + 1)} className="h-8 w-8 grid place-items-center hover:bg-ink-100 disabled:opacity-50"><Plus size={14} /></button>
                  </div>
                  <span className="font-mono font-bold text-lg">{fmt(it.line_total)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start bg-white rounded-none p-6 border border-ink-200 h-fit">
          <h3 className="font-display tracking-tight text-lg mb-4">Order Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span className="font-mono font-bold">{fmt(cart.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Shipping</span><span className="font-mono font-bold">{shipping === 0 ? "FREE" : fmt(shipping)}</span></div>
            <div className="border-t border-ink-200 pt-3 flex justify-between font-display text-lg"><span>Total</span><span className="font-mono text-fire">{fmt(cart.subtotal + shipping)}</span></div>
          </div>
          <button onClick={() => navigate("/checkout")} data-testid="cart-page-checkout-btn" className="w-full bg-obsidian text-white font-display tracking-wider py-4 rounded-none mt-5 hover:bg-fire transition-colors">Proceed to Checkout</button>
          <p className="text-center text-xs text-ink-400 mt-3">Guest checkout · No account needed</p>
        </div>
      </div>
    </div>
  );
}

