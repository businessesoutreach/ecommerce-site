import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
export const API = `${BACKEND_URL}/api`;

// persistent guest id
export function getGuestId() {
  if (typeof window === 'undefined') return "ssr-guest";
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
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem("jt_token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      if (!isAuthEndpoint) {
        localStorage.removeItem('jt_token');
        localStorage.removeItem('jt_user');
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

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

export function optimizeImg(url, { width = 800, quality = "auto" } = {}) {
  if (!url || typeof url !== "string") return "";
  const resolved = imgUrl(url);
  if (resolved.includes("res.cloudinary.com") && resolved.includes("/upload/")) {
    if (resolved.includes("/upload/f_auto") || resolved.includes("/upload/q_auto") || resolved.includes("/upload/w_")) {
      return resolved;
    }
    const transform = width ? `f_auto,q_${quality},w_${width},c_limit` : `f_auto,q_${quality}`;
    return resolved.replace("/upload/", `/upload/${transform}/`);
  }
  return resolved;
}

export function waLink(number, message) {
  const n = String(number || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
