import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// persistent guest id
export function getGuestId() {
  let id = localStorage.getItem("jt_guest_id");
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `g_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("jt_guest_id", id);
  }
  return id;
}

export const http = axios.create({ baseURL: API });

http.interceptors.request.use((config) => {
  config.headers["x-guest-id"] = getGuestId();
  const token = localStorage.getItem("jt_token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

export function fmt(n) {
  const v = Math.round(Number(n) || 0);
  return "Rs. " + v.toLocaleString("en-PK");
}

export function discountPct(price, compare) {
  if (!compare || compare <= price) return 0;
  return Math.round(((compare - price) / compare) * 100);
}

export function imgUrl(u) {
  if (!u) return "";
  if (u.startsWith("/api/")) return `${BACKEND_URL}${u}`;
  return u;
}

export function waLink(number, message) {
  const n = String(number || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
