import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag, Truck } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { fmt } from "../lib/api";
import { EmptyState } from "./common";

export default function CartDrawer() {
  const { cartOpen, setCartOpen, cart, updateQty, removeItem, settings } = useStore();
  const navigate = useNavigate();
  const freeMin = Number(settings?.free_shipping_min_amt || 5000);
  const remaining = Math.max(0, freeMin - cart.subtotal);
  const pct = Math.min(100, (cart.subtotal / freeMin) * 100);

  const go = (path) => {
    setCartOpen(false);
    navigate(path);
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-obsidian/60 backdrop-blur-sm z-50"
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-canvas z-50 flex flex-col shadow-2xl"
            data-testid="cart-drawer"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
              <h2 className="font-display text-lg font-extrabold uppercase tracking-tight flex items-center gap-2">
                <ShoppingBag size={18} /> Your Bag <span className="text-fire">({cart.count})</span>
              </h2>
              <button data-testid="cart-drawer-close-btn" onClick={() => setCartOpen(false)} className="h-9 w-9 grid place-items-center rounded-full hover:bg-ink-100">
                <X size={18} />
              </button>
            </div>

            {cart.items.length > 0 && (
              <div className="px-5 py-3 border-b border-ink-200 bg-white">
                <div className="flex items-center gap-2 text-xs font-medium mb-2">
                  <Truck size={14} className="text-fire" />
                  {remaining > 0 ? (
                    <span>Add <b className="font-mono">{fmt(remaining)}</b> more for <b>FREE</b> delivery</span>
                  ) : (
                    <span className="text-fire font-bold">You've unlocked FREE nationwide delivery! 🎉</span>
                  )}
                </div>
                <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-fire" animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
              {cart.items.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="Your bag is empty" subtitle="Start stacking heat — your next grail is a tap away." />
              ) : (
                <div className="space-y-4">
                  {cart.items.map((it) => (
                    <div key={it.id} data-testid={`cart-item-${it.id}`} className="flex gap-3">
                      <Link to={`/products/${it.slug}`} onClick={() => setCartOpen(false)} className="h-24 w-24 rounded-xl overflow-hidden bg-ink-100 shrink-0">
                        <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <h4 className="font-display font-bold text-sm leading-snug line-clamp-2">{it.name}</h4>
                          <button data-testid={`cart-item-remove-btn-${it.id}`} onClick={() => removeItem(it.id)} className="text-ink-400 hover:text-fire shrink-0">
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-400">EU {it.size}</span>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-ink-200 rounded-lg">
                            <button data-testid={`cart-item-qty-minus-${it.id}`} onClick={() => updateQty(it.id, it.quantity - 1)} className="h-7 w-7 grid place-items-center hover:bg-ink-100">
                              <Minus size={13} />
                            </button>
                            <span className="w-7 text-center font-mono text-sm font-bold">{it.quantity}</span>
                            <button data-testid={`cart-item-qty-plus-${it.id}`} onClick={() => updateQty(it.id, it.quantity + 1)} className="h-7 w-7 grid place-items-center hover:bg-ink-100">
                              <Plus size={13} />
                            </button>
                          </div>
                          <span className="font-mono font-bold text-sm">{fmt(it.line_total)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="border-t border-ink-200 p-5 bg-white space-y-3">
                <div className="flex justify-between font-display font-bold uppercase tracking-tight">
                  <span>Subtotal</span>
                  <span data-testid="cart-drawer-subtotal-amount" className="font-mono text-fire">{fmt(cart.subtotal)}</span>
                </div>
                <button
                  data-testid="cart-drawer-checkout-btn"
                  onClick={() => go("/checkout")}
                  className="w-full bg-obsidian text-white font-display font-bold uppercase tracking-wide py-4 rounded-full hover:bg-fire transition-colors active:scale-[0.99]"
                >
                  Checkout · Guest Friendly
                </button>
                <button onClick={() => go("/cart")} className="w-full text-center text-sm font-medium text-ink-500 hover:text-obsidian underline underline-offset-4">
                  View full bag
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
