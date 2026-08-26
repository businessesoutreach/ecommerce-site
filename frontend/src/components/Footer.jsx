import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Send, Truck, RefreshCw, ShieldCheck, MessageCircle, Loader2 } from "lucide-react";
import { http } from "../lib/api";
import { toast } from "sonner";

const TRUST = [
  { icon: Truck, title: "Fast Nationwide Dispatch", sub: "COD available · 24-48h metro" },
  { icon: RefreshCw, title: "7-Day Easy Exchange", sub: "Hassle-free size swaps" },
  { icon: ShieldCheck, title: "Authentic-Grade Quality", sub: "100% fit guarantee" },
  { icon: MessageCircle, title: "24/7 WhatsApp Support", sub: "Real humans, real fast" },
];

export function TrustRibbon() {
  return (
    <section className="bg-white border-y border-ink-200">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 py-8">
        {TRUST.map((t) => (
          <div key={t.title} className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 grid place-items-center rounded-none bg-fire/10 text-fire"><t.icon size={20} /></div>
            <div>
              <p className="font-display tracking-tight leading-tight">{t.title}</p>
              <p className="text-ink-400 text-xs">{t.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const subscribe = async (e) => {
    e.preventDefault();
    setSubscribing(true);
    try {
      await http.post("/newsletter/subscribe", { email });
      toast.success("You're on the list — welcome to the culture.");
      setEmail("");
    } catch {
      toast.error("Enter a valid email");
    } finally {
      setSubscribing(false);
    }
  };
  return (
    <footer className="bg-obsidian text-white mt-20 pb-24 lg:pb-0">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div>
            <span className="font-display tracking-tighter">SOLEKICKS<span className="text-fire">.</span>PK</span>
            <p className="text-white/50 text-sm mt-4 leading-relaxed">Pakistan's home for high-heat streetwear silhouettes, retro re-issues & performance runners. Cop with confidence.</p>
            <div className="flex gap-3 mt-5">
              {[Instagram, Facebook, Twitter].map((I, i) => (
                <a key={i} href="#" className="h-9 w-9 grid place-items-center rounded-none bg-white/10 hover:bg-fire transition-colors"><I size={16} /></a>
              ))}
            </div>
          </div>
          {[
            { t: "Shop", links: [["New Arrivals", "/new-arrivals"], ["Flash Sale", "/flash-sale"], ["Retro & Highs", "/collections/retro"], ["Runners", "/collections/runners"], ["Slides", "/collections/slides"]] },
            { t: "Support", links: [["Track Order", "/track-order"], ["Shipping & Returns", "/shipping-returns"], ["FAQs", "/faqs"], ["Contact Us", "/contact-us"]] },
          ].map((col) => (
            <div key={col.t}>
              <h4 className="font-display tracking-wider text-sm mb-4">{col.t}</h4>
              <ul className="space-y-2.5">
                {col.links.map(([l, to]) => (
                  <li key={l}><Link to={to} className="text-white/50 hover:text-white text-sm transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="font-display tracking-wider text-sm mb-4">Get 10% off first drop</h4>
            <form onSubmit={subscribe} className="flex gap-2">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="your@email.com" data-testid="newsletter-input" className="flex-1 bg-white/10 rounded-none px-4 py-3 text-sm outline-none focus:bg-white/20 placeholder:text-white/40" />
              <button disabled={subscribing} data-testid="newsletter-submit" className="h-11 w-11 shrink-0 grid place-items-center bg-fire rounded-none hover:bg-fire-hover transition-colors disabled:opacity-70 disabled:cursor-wait">
                {subscribing ? <Loader2 size={17} className="animate-spin text-white" /> : <Send size={17} />}
              </button>
            </form>
            <p className="text-white/40 text-xs mt-4 mb-2">We ship & accept</p>
            <div className="flex flex-wrap gap-2">
              {["COD", "JazzCash", "EasyPaisa", "Visa", "Mastercard"].map((p) => (
                <span key={p} className="text-[10px] font-mono font-bold bg-white/10 px-2 py-1 rounded">{p}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-white/40 text-xs">
          <span>© {new Date().getFullYear()} SOLEKICKS PK. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-white">Privacy</Link>
            <Link to="/terms-conditions" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
