import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useStore } from "../context/StoreContext";
import { toast } from "sonner";

function fmtErr(d) {
  if (!d) return "Something went wrong";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e) => e.msg || JSON.stringify(e)).join(" ");
  return d.msg || String(d);
}

export default function Auth({ mode = "login" }) {
  const isLogin = mode === "login";
  const { login, register } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = isLogin ? await login(form.email, form.password) : await register(form);
      toast.success(`Welcome${u.name ? ", " + u.name.split(" ")[0] : ""}!`);
      navigate(u.role === "admin" || u.role === "staff" ? "/admin" : "/account");
    } catch (err) {
      toast.error(fmtErr(err.response?.data?.detail));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-obsidian">
        <img src="https://images.unsplash.com/photo-1556906781-9a412961c28c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
        <div className="absolute bottom-12 left-12 text-white">
          <span className="font-display font-black text-4xl uppercase tracking-tighter">SOLEKICKS<span className="text-fire">.</span></span>
          <p className="text-white/60 mt-2 max-w-sm">Join the culture. Track orders, save grails, and cop faster.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">{isLogin ? "Welcome Back" : "Create Account"}</h1>
          <p className="text-ink-500 mt-1 mb-8 text-sm">{isLogin ? "Sign in to your account" : "Guest checkout is always available — no account needed to shop."}</p>
          <div className="space-y-4">
            {!isLogin && <input value={form.name} onChange={set("name")} required placeholder="Full name" data-testid="auth-name" className="w-full border border-ink-200 rounded-xl px-4 py-3 outline-none focus:border-obsidian" />}
            <input value={form.email} onChange={set("email")} type="email" required placeholder="Email" data-testid="auth-email" className="w-full border border-ink-200 rounded-xl px-4 py-3 outline-none focus:border-obsidian" />
            {!isLogin && <input value={form.phone} onChange={set("phone")} placeholder="Phone (optional)" className="w-full border border-ink-200 rounded-xl px-4 py-3 outline-none focus:border-obsidian" />}
            <input value={form.password} onChange={set("password")} type="password" required placeholder="Password" data-testid="auth-password" className="w-full border border-ink-200 rounded-xl px-4 py-3 outline-none focus:border-obsidian" />
          </div>
          <button disabled={loading} data-testid="auth-submit" className="w-full bg-obsidian text-white font-display font-bold uppercase tracking-wide py-4 rounded-full mt-6 hover:bg-fire transition-colors disabled:opacity-60">{loading ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}</button>
          <p className="text-center text-sm text-ink-500 mt-5">
            {isLogin ? "New here? " : "Already have an account? "}
            <Link to={isLogin ? "/register" : "/login"} className="font-bold text-fire underline underline-offset-4">{isLogin ? "Create account" : "Sign in"}</Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
