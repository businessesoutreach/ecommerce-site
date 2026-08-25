import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COUNTRIES = [
  { code: "PK", dial: "+92", name: "Pakistan", maxLength: 10 },
];

export default function PhoneInput({ value = "", onChange, placeholder = "3XX XXXXXXX", className = "", testid }) {
  const [open, setOpen] = useState(false);
  
  const defaultDial = COUNTRIES[0].dial;
  let currentDial = defaultDial;
  let currentNumber = value;
  
  if (value) {
    for (const c of COUNTRIES) {
      if (value.startsWith(c.dial)) {
        currentDial = c.dial;
        currentNumber = value.slice(c.dial.length).trim();
        break;
      }
    }
  }

  const [dialCode, setDialCode] = useState(currentDial);
  
  const handleNumberChange = (e) => {
    let val = e.target.value.replace(/[^\d\s-]/g, ""); // basic phone number sanitization
    onChange(dialCode + val);
  };
  
  const handleDialChange = (code) => {
    setDialCode(code);
    onChange(code + currentNumber);
    setOpen(false);
  };

  const ref = useRef(null);
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className={`relative flex border border-ink-200 bg-white focus-within:border-obsidian transition-colors ${className}`}>
      <button 
        type="button" 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 border-r border-ink-200 bg-ink-50 text-ink-900 text-sm outline-none hover:bg-ink-100 transition-colors"
      >
        <span className="font-mono">{dialCode}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      
      <input 
        type="tel"
        value={currentNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        data-testid={testid}
        maxLength={COUNTRIES.find(c => c.dial === dialCode)?.maxLength || 15}
        className="w-full px-4 py-3 outline-none bg-transparent text-ink-900"
      />

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 mt-1 w-56 bg-white border border-ink-200 shadow-xl z-20"
          >
            <div className="max-h-60 overflow-y-auto py-1">
              {COUNTRIES.map(c => (
                <button 
                  key={c.code}
                  type="button"
                  onClick={() => handleDialChange(c.dial)}
                  className={`w-full text-left px-3 py-2 text-sm flex justify-between items-center transition-colors ${dialCode === c.dial ? "bg-ink-100 font-bold" : "hover:bg-ink-50 text-ink-900"}`}
                >
                  <span>{c.name}</span>
                  <span className="font-mono text-ink-500">{c.dial}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
