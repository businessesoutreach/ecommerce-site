import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useStore } from "../context/StoreContext";
import { http } from "../lib/api";
import { toast } from "sonner";
import PhoneInput from "../components/PhoneInput";
import { ArrowLeft } from "lucide-react";

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
  const [view, setView] = useState(mode);
  const [step, setStep] = useState(1);
  const { login, register } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", otp: "" });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => { setView(mode); setStep(1); }, [mode]);

  const requestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "register") {
        await http.post("/auth/send-otp", { email: form.email });
      } else if (view === "forgot") {
        await http.post("/auth/forgot-password", { email: form.email });
      }
      setStep(2);
      toast.success("Verification code sent to your email!");
    } catch (err) {
      toast.error(fmtErr(err.response?.data?.detail));
    }
    setLoading(false);
  };

  const submitFinal = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "login") {
        const u = await login(form.email, form.password);
        toast.success(`Welcome back!`);
        navigate(u.role === "admin" || u.role === "staff" ? "/admin" : "/account");
        return; // Skip setLoading(false) to prevent button blinking while Next.js route transitions
      } else if (view === "register") {
        const u = await register(form);
        toast.success(`Welcome, ${u.name.split(" ")[0]}!`);
        navigate(u.role === "admin" || u.role === "staff" ? "/admin" : "/account");
        return; // Skip setLoading(false)
      } else if (view === "forgot") {
        await http.post("/auth/reset-password", { email: form.email, otp: form.otp, new_password: form.password });
        toast.success("Password reset successfully! Please sign in.");
        setView("login");
        setStep(1);
        setForm({ ...form, password: "", otp: "" });
        setLoading(false);
      }
    } catch (err) {
      toast.error(fmtErr(err.response?.data?.detail));
      setLoading(false);
    }
  };

  const googleLogin = () => {
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(window.location.origin + "/account")}`;
  };

  const inp = "w-full border border-ink-200 rounded-none px-4 py-3 outline-none focus:border-obsidian transition-colors bg-white";

  return (
    <div className="min-h-[85vh] grid place-items-center px-4 py-10 bg-ink-100">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl bg-white border border-ink-200 rounded-xl overflow-hidden shadow-xl">
        <div className="p-8 sm:p-14 flex flex-col justify-center">
          
          {view === "forgot" && step === 1 && (
            <button onClick={() => setView("login")} className="flex items-center gap-2 text-ink-500 hover:text-obsidian mb-6 transition-colors w-fit"><ArrowLeft size={16} /> Back to Sign In</button>
          )}
          {step === 2 && (
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-ink-500 hover:text-obsidian mb-6 transition-colors w-fit"><ArrowLeft size={16} /> Back</button>
          )}

          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-fire font-bold">
            {view === "login" ? "Welcome Back" : view === "register" ? "Join The Movement" : "Account Recovery"}
          </span>
          <h1 className="font-display tracking-tight mt-2">
            {view === "login" ? "Sign In" : view === "register" ? (step === 1 ? "Create Account" : "Verify Email") : (step === 1 ? "Forgot Password" : "Reset Password")}
          </h1>
          <p className="text-ink-500 mt-1.5 mb-6 text-sm">
            {view === "login" ? "Access your orders, wishlist & store credit." : 
             view === "register" ? (step === 1 ? "Save your details for a faster checkout next time." : `We've sent a 6-digit code to ${form.email}.`) :
             (step === 1 ? "Enter your email to receive a password reset code." : `We've sent a 6-digit code to ${form.email}.`)}
          </p>

          {view !== "forgot" && step === 1 && (
            <>
              <button onClick={googleLogin} className="w-full flex items-center justify-center gap-3 border border-ink-200 rounded-none py-3 font-display text-sm tracking-wider hover:border-obsidian hover:bg-ink-100 transition-colors">
                <GoogleIcon /> Continue with Google
              </button>
              <div className="flex items-center gap-4 my-6">
                <span className="h-px flex-1 bg-ink-200" />
                <span className="font-mono text-[11px] uppercase tracking-widest text-ink-400">or</span>
                <span className="h-px flex-1 bg-ink-200" />
              </div>
            </>
          )}

          <form onSubmit={step === 1 && view !== "login" ? requestOTP : submitFinal} className="space-y-3.5">
            {step === 1 && (
              <>
                {view === "register" && <input value={form.name} onChange={set("name")} required placeholder="Full name" className={inp} />}
                <input value={form.email} onChange={set("email")} type="email" required placeholder="Email address" className={inp} />
                {view === "register" && <PhoneInput value={form.phone} onChange={(val) => setForm({ ...form, phone: val })} placeholder="Phone (optional)" />}
                {view === "login" && (
                  <div>
                    <input value={form.password} onChange={set("password")} type="password" required placeholder="Password" className={inp} />
                    <div className="flex justify-end mt-3 mb-1">
                      <button type="button" onClick={() => setView("forgot")} className="text-xs font-bold text-ink-500 hover:text-fire transition-colors">Forgot Password?</button>
                    </div>
                  </div>
                )}
                {view === "register" && <input value={form.password} onChange={set("password")} type="password" required minLength={6} placeholder="Password" className={inp} />}
              </>
            )}

            {step === 2 && (
              <>
                <input value={form.otp} onChange={set("otp")} required maxLength={6} placeholder="6-digit code" className={`${inp} tracking-widest text-center text-xl font-mono`} />
                {view === "forgot" && <input value={form.password} onChange={set("password")} type="password" required minLength={6} placeholder="New Password" className={inp} />}
              </>
            )}

            <div className="pt-2">
              <button disabled={loading} className="w-full bg-obsidian text-white font-display tracking-wider py-3.5 rounded-none hover:bg-fire transition-colors disabled:opacity-60">
                {loading ? "Please wait…" : 
                 view === "login" ? "Sign In" : 
                 step === 1 ? (view === "register" ? "Verify Email" : "Send Reset Code") : 
                 (view === "register" ? "Create Account" : "Reset Password")}
              </button>
            </div>
          </form>

          {view !== "forgot" && step === 1 && (
            <p className="text-center text-sm text-ink-500 mt-5">
              {view === "login" ? "New here? " : "Already have an account? "}
              <Link to={view === "login" ? "/register" : "/login"} className="font-bold text-fire underline underline-offset-4">{view === "login" ? "Create account" : "Sign in"}</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
