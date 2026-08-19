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

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 36.3 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z" /></svg>
);

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

  const googleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(window.location.origin + "/account")}`;
  };

  const inp = "w-full border border-ink-200 rounded-none px-4 py-3 outline-none focus:border-obsidian transition-colors bg-white";

  return (
    <div className="min-h-[85vh] grid place-items-center px-4 py-10 bg-ink-100">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl grid lg:grid-cols-2 bg-white border border-ink-200 rounded-xl overflow-hidden shadow-xl">
        {/* Image panel */}
        <div className="relative hidden lg:block bg-obsidian min-h-[560px]">
          <img src="https://images.unsplash.com/photo-1556906781-9a412961c28c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000" alt="" className="absolute inset-0 h-full w-full object-cover opacity-65" />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
          <div className="absolute top-8 left-8">
            <span className="font-display font-black text-2xl uppercase tracking-tighter text-white">SOLEKICKS<span className="text-fire">.</span>PK</span>
          </div>
          <div className="absolute bottom-10 left-8 right-8 text-white">
            <h2 className="font-display font-black text-3xl uppercase tracking-tight leading-none">Step Into<br />The Culture</h2>
            <p className="text-white/60 mt-3 text-sm max-w-xs">Track orders, save grails, and cop faster. Guest checkout is always available — no account required.</p>
          </div>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-fire font-bold">{isLogin ? "Welcome Back" : "Join The Movement"}</span>
          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight mt-2">{isLogin ? "Sign In" : "Create Account"}</h1>
          <p className="text-ink-500 mt-1.5 mb-6 text-sm">{isLogin ? "Access your orders, wishlist & store credit." : "Save your details for a faster checkout next time."}</p>

          <button onClick={googleLogin} data-testid="google-login-btn" className="w-full flex items-center justify-center gap-3 border border-ink-200 rounded-none py-3 font-display font-bold uppercase text-sm tracking-wider hover:border-obsidian hover:bg-ink-100 transition-colors">
            <GoogleIcon /> Continue with Google
          </button>

          <div className="flex items-center gap-4 my-6">
            <span className="h-px flex-1 bg-ink-200" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-400">or</span>
            <span className="h-px flex-1 bg-ink-200" />
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {!isLogin && <input value={form.name} onChange={set("name")} required placeholder="Full name" data-testid="auth-name" className={inp} />}
            <input value={form.email} onChange={set("email")} type="email" required placeholder="Email address" data-testid="auth-email" className={inp} />
            {!isLogin && <input value={form.phone} onChange={set("phone")} placeholder="Phone (optional)" className={inp} />}
            <input value={form.password} onChange={set("password")} type="password" required placeholder="Password" data-testid="auth-password" className={inp} />
            <button disabled={loading} data-testid="auth-submit" className="w-full bg-obsidian text-white font-display font-bold uppercase tracking-wider py-3.5 rounded-none hover:bg-fire transition-colors disabled:opacity-60">
              {loading ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-5">
            {isLogin ? "New here? " : "Already have an account? "}
            <Link to={isLogin ? "/register" : "/login"} className="font-bold text-fire underline underline-offset-4">{isLogin ? "Create account" : "Sign in"}</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
