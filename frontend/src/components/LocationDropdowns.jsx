import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";

export const PROVINCE_CITIES = {
  "Punjab": ["Lahore", "Faisalabad", "Rawalpindi", "Multan", "Gujranwala", "Sialkot", "Bahawalpur", "Sargodha", "Gujrat", "Sheikhupura", "Jhang", "Rahim Yar Khan", "Kasur", "Muzaffargarh", "Okara", "Dera Ghazi Khan", "Sahiwal", "Nawabshah", "Mandi Bahauddin", "Chiniot", "Kamoke", "Hafizabad", "Sadiqabad", "Burewala", "Vehari", "Muridke", "Attock", "Jhelum", "Chakwal", "Bhakkar", "Khushab", "Mianwali", "Pakpattan", "Hasan Abdal", "Taxila", "Gojra", "Bahawalnagar"].sort(),
  "Sindh": ["Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah", "Mirpur Khas", "Jacobabad", "Shikarpur", "Khairpur", "Dadu", "Tando Adam", "Tando Allahyar", "Umerkot", "Badin", "Thatta", "Jamshoro", "Matiari", "Ghotki", "Kashmore", "Tharparkar"].sort(),
  "Khyber Pakhtunkhwa": ["Peshawar", "Mardan", "Mingora", "Kohat", "Abbottabad", "Dera Ismail Khan", "Nowshera", "Charsadda", "Mansehra", "Swabi", "Timergara", "Karak", "Haripur", "Swat", "Chitral", "Bannu", "Dir", "Hangu", "Batagram", "Kohistan"].sort(),
  "Balochistan": ["Quetta", "Turbat", "Khuzdar", "Hub", "Chaman", "Gwadar", "Dera Murad Jamali", "Usta Muhammad", "Sibi", "Zhob", "Kalat", "Loralai", "Mastung", "Nushki", "Kharan", "Panjgur", "Pishin"].sort(),
  "Islamabad Capital Territory": ["Islamabad"],
  "Azad Kashmir": ["Muzaffarabad", "Mirpur", "Kotli", "Bhimber", "Rawalakot", "Bagh", "Sudhanoti", "Poonch", "Haveli", "Neelum"].sort(),
  "Gilgit-Baltistan": ["Gilgit", "Skardu", "Khaplu", "Chilas", "Hunza", "Astore", "Ghizer", "Shigar", "Kharmang"].sort()
};
export const PROVINCES = Object.keys(PROVINCE_CITIES).sort();
export const ALL_CITIES = [...new Set(Object.values(PROVINCE_CITIES).flat())].sort();

export const CustomDropdown = ({ value, onChange, options, placeholder = "Select option" }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative mt-1.5">
      <button 
        type="button" 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border border-ink-200 bg-white text-ink-900 px-4 py-2.5 outline-none focus:border-obsidian transition-colors"
      >
        <span className="text-sm">{value || placeholder}</span>
        <ChevronDown size={16} className={`text-ink-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-10 w-full mt-1 bg-white border border-ink-200 shadow-xl"
          >
            <div className="flex items-center gap-2 p-2 border-b border-ink-200">
              <Search size={14} className="text-ink-400" />
              <input 
                type="text" 
                autoFocus
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full outline-none text-sm text-ink-900 bg-transparent"
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <div className="p-3 text-sm text-ink-500 text-center">No results found</div>
              ) : (
                filtered.map(c => (
                  <button 
                    key={c}
                    type="button"
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${value === c ? "bg-ink-100 font-bold" : "hover:bg-ink-50 text-ink-900"}`}
                  >
                    {c}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
