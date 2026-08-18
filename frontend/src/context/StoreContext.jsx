import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { http } from "../lib/api";
import { toast } from "sonner";

const StoreCtx = createContext(null);
export const useStore = () => useContext(StoreCtx);

export function StoreProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("jt_user");
    return u ? JSON.parse(u) : null;
  });
  const [cart, setCart] = useState({ items: [], subtotal: 0, count: 0 });
  const [wishlist, setWishlist] = useState({ ids: [], items: [] });
  const [cartOpen, setCartOpen] = useState(false);
  const [cartBump, setCartBump] = useState(0);

  const loadCart = useCallback(async () => {
    try {
      const { data } = await http.get("/cart");
      setCart(data.data);
    } catch (e) {}
  }, []);

  const loadWishlist = useCallback(async () => {
    try {
      const { data } = await http.get("/wishlist");
      setWishlist({ ids: data.ids || [], items: data.data || [] });
    } catch (e) {}
  }, []);

  useEffect(() => {
    http.get("/settings").then(({ data }) => setSettings(data.data)).catch(() => {});
    loadCart();
    loadWishlist();
  }, [loadCart, loadWishlist]);

  const addToCart = async (productId, size, quantity = 1) => {
    if (!size) {
      toast.error("Please select a size");
      return false;
    }
    try {
      const { data } = await http.post("/cart/items", { product_id: productId, size, quantity });
      setCart(data.data);
      setCartBump((b) => b + 1);
      setCartOpen(true);
      toast.success("Added to bag");
      return true;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not add to bag");
      return false;
    }
  };

  const updateQty = async (itemId, quantity) => {
    const { data } = await http.patch(`/cart/items/${itemId}`, { quantity });
    setCart(data.data);
  };

  const removeItem = async (itemId) => {
    const { data } = await http.delete(`/cart/items/${itemId}`);
    setCart(data.data);
  };

  const toggleWishlist = async (productId) => {
    const inList = wishlist.ids.includes(productId);
    try {
      if (inList) {
        const { data } = await http.delete(`/wishlist/items/${productId}`);
        setWishlist((w) => ({ ...w, ids: data.ids }));
        toast("Removed from wishlist");
      } else {
        const { data } = await http.post("/wishlist/items", { product_id: productId });
        setWishlist((w) => ({ ...w, ids: data.ids }));
        toast.success("Saved to wishlist");
      }
      loadWishlist();
    } catch (e) {}
  };

  const login = async (email, password) => {
    const { data } = await http.post("/auth/login", { email, password });
    const u = data.data;
    localStorage.setItem("jt_token", u.token);
    localStorage.setItem("jt_user", JSON.stringify(u));
    setUser(u);
    await http.post("/cart/merge").catch(() => {});
    await http.post("/wishlist/merge").catch(() => {});
    await loadCart();
    await loadWishlist();
    return u;
  };

  const register = async (payload) => {
    const { data } = await http.post("/auth/register", payload);
    const u = data.data;
    localStorage.setItem("jt_token", u.token);
    localStorage.setItem("jt_user", JSON.stringify(u));
    setUser(u);
    await http.post("/cart/merge").catch(() => {});
    await http.post("/wishlist/merge").catch(() => {});
    await loadCart();
    return u;
  };

  const logout = () => {
    localStorage.removeItem("jt_token");
    localStorage.removeItem("jt_user");
    setUser(null);
    loadCart();
    loadWishlist();
  };

  return (
    <StoreCtx.Provider
      value={{
        settings, user, cart, wishlist, cartOpen, setCartOpen, cartBump,
        addToCart, updateQty, removeItem, toggleWishlist, loadCart,
        login, register, logout,
      }}
    >
      {children}
    </StoreCtx.Provider>
  );
}
