import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Store, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  Check, 
  Copy, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ExternalLink, 
  Lock, 
  Image as ImageIcon, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Zap,
  Info,
  DollarSign,
  Percent
} from 'lucide-react';
import { http, fmt } from '../lib/api';
import { toast } from 'sonner';

export default function SettingsManager({ isDark, user }) {
  const [activeTab, setActiveTab] = useState('platform'); // 'platform' | 'payment' | 'shipping' | 'security'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Settings form state
  const [form, setForm] = useState({
    store_name: 'SoleKicks',
    store_tagline: 'Premium Sneakers & Streetwear',
    logo_url: '',
    favicon_url: '',
    contact_email: '',
    contact_phone: '',
    whatsapp_number: '',
    store_address: '',
    
    // Shipping
    free_shipping_min_amt: 5000,
    flat_shipping_fee: 250,
    
    // COD & Advance
    cod_enabled: true,
    advance_payment_threshold: 10000,
    advance_payment_type: 'percentage', // 'percentage' | 'fixed'
    advance_payment_percent: 15,
    advance_payment_fixed: 1500,
    
    // Safepay PK
    safepay_enabled: true,
    safepay_environment: 'sandbox', // 'sandbox' | 'production'
    safepay_api_key: '',
    safepay_v1_secret: '',
    safepay_webhook_secret: '',
    
    // Announcement
    announcement_active: false,
    announcement_text: ''
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Interactive calculator sample value
  const [calcOrderAmount, setCalcOrderAmount] = useState(15000);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await http.get('/admin/settings');
      if (res.data?.data) {
        const d = res.data.data;
        setForm({
          store_name: d.store_name || 'SoleKicks',
          store_tagline: d.store_tagline || 'Premium Sneakers & Streetwear',
          logo_url: d.logo_url || '',
          favicon_url: d.favicon_url || '',
          contact_email: d.contact_email || '',
          contact_phone: d.contact_phone || '',
          whatsapp_number: d.whatsapp_number || '',
          store_address: d.store_address || '',
          free_shipping_min_amt: d.free_shipping_min_amt ?? 5000,
          flat_shipping_fee: d.flat_shipping_fee ?? 250,
          cod_enabled: d.cod_enabled ?? true,
          advance_payment_threshold: d.advance_payment_threshold ?? 10000,
          advance_payment_type: d.advance_payment_type || 'percentage',
          advance_payment_percent: d.advance_payment_percent ?? 15,
          advance_payment_fixed: d.advance_payment_fixed ?? 1500,
          safepay_enabled: d.safepay_enabled ?? true,
          safepay_environment: d.safepay_environment || 'sandbox',
          safepay_api_key: d.safepay_api_key || '',
          safepay_v1_secret: d.safepay_v1_secret || '',
          safepay_webhook_secret: d.safepay_webhook_secret || '',
          announcement_active: !!d.announcement_active,
          announcement_text: d.announcement_text || ''
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      const res = await http.patch('/admin/settings', payload);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.current_password || !passwordForm.new_password) {
      return toast.error('Please enter both your current and new password');
    }
    if (passwordForm.new_password.length < 6) {
      return toast.error('New password must be at least 6 characters long');
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error('New passwords do not match');
    }

    setChangingPassword(true);
    try {
      await http.post('/auth/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      toast.success('Password updated successfully!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update password. Verify your current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  // Calculate live simulator values
  const simulatedThreshold = Number(form.advance_payment_threshold || 0);
  const requiresAdvance = form.cod_enabled && simulatedThreshold > 0 && calcOrderAmount >= simulatedThreshold;
  const simulatedAdvance = requiresAdvance
    ? (form.advance_payment_type === 'fixed'
        ? Math.min(Number(form.advance_payment_fixed || 0), calcOrderAmount)
        : Math.round((calcOrderAmount * Number(form.advance_payment_percent || 0)) / 100))
    : 0;
  const simulatedBalance = calcOrderAmount - simulatedAdvance;

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/safepay`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    toast.success('Webhook URL copied to clipboard');
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const tabs = [
    { id: 'platform', label: 'Platform & Branding', icon: Store },
    { id: 'payment', label: 'Payments & Safepay COD', icon: CreditCard },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'security', label: 'Security & Password', icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-fire" size={32} />
          <p className="text-sm font-mono text-gray-500 dark:text-zinc-400">Loading platform settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-fire/10 text-fire rounded-xl">
              <SettingsIcon size={22} />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl tracking-tight text-gray-900 dark:text-white">
                Store Settings
              </h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                Manage platform identity, Safepay PK gateway, COD partial advance thresholds, and admin security.
              </p>
            </div>
          </div>
        </div>

        {activeTab !== 'security' && (
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-fire hover:bg-fire-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-fire/20 disabled:opacity-60 cursor-pointer self-start sm:self-auto"
          >
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto no-scrollbar pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold tracking-tight rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-zinc-900 text-fire border-t-2 border-t-fire border-x border-gray-200 dark:border-zinc-800 -mb-px'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Platform & Branding */}
      {activeTab === 'platform' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Column: Brand & Logo */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-5">
              <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Store size={18} className="text-fire" />
                Store Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                    Store Brand Name
                  </label>
                  <input
                    type="text"
                    value={form.store_name}
                    onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                    placeholder="e.g. SoleKicks"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-fire transition-colors"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Displayed in the header, invoices, and automated emails.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                    Store Tagline / Slogan
                  </label>
                  <input
                    type="text"
                    value={form.store_tagline}
                    onChange={(e) => setForm({ ...form, store_tagline: e.target.value })}
                    placeholder="e.g. Premium Sneakers & Streetwear"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-fire transition-colors"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Short subtitle for search engines and footer branding.</p>
                </div>
              </div>

              {/* Logo URL */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                  Logo Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    placeholder="https://.../logo.png"
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-fire transition-colors"
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  Enter a direct URL to your logo (PNG or SVG with transparent background recommended, height ~40px). If empty, text branding will be displayed.
                </p>
              </div>

              {/* Favicon URL */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                  Favicon Image URL
                </label>
                <input
                  type="url"
                  value={form.favicon_url}
                  onChange={(e) => setForm({ ...form, favicon_url: e.target.value })}
                  placeholder="https://.../favicon.ico or .png"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-fire transition-colors"
                />
                <p className="text-[11px] text-gray-400">
                  Browser tab icon (32x32px or 64x64px square PNG or ICO).
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Mail size={18} className="text-fire" />
                Customer Support & Contact
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Mail size={13} className="text-gray-400" />
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    placeholder="support@solekicks.pk"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-fire transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Phone size={13} className="text-gray-400" />
                    Support Phone
                  </label>
                  <input
                    type="text"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-fire transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-emerald-500" />
                    WhatsApp Business Number
                  </label>
                  <input
                    type="text"
                    value={form.whatsapp_number}
                    onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    placeholder="923001234567 (with country code)"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-fire transition-colors"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Powers the floating WhatsApp chat button & order updates.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <MapPin size={13} className="text-gray-400" />
                    Physical Store Address
                  </label>
                  <input
                    type="text"
                    value={form.store_address}
                    onChange={(e) => setForm({ ...form, store_address: e.target.value })}
                    placeholder="Shop #12, Sneaker District, Lahore"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-fire transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Previews */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Live Header Preview
              </h3>

              <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {form.logo_url ? (
                    <img
                      src={form.logo_url}
                      alt={form.store_name}
                      className="h-8 max-w-[140px] object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="font-display font-black text-lg tracking-tight text-gray-900 dark:text-white">
                      {form.store_name || 'SOLEKICKS'}<span className="text-fire">.</span>
                      <span className="text-[9px] font-mono tracking-widest ml-0.5">PK</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-400 font-medium">
                  <span>Shop</span>
                  <span>Collections</span>
                  <span className="text-fire font-bold">Drops</span>
                </div>
              </div>

              {form.favicon_url && (
                <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 p-1 flex items-center justify-center border border-gray-200 dark:border-zinc-700">
                    <img src={form.favicon_url} alt="Favicon" className="w-5 h-5 object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">Favicon Loaded</p>
                    <p className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">{form.favicon_url}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">Instant Storefront Sync</h4>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                    Changes to store name, logo, and contact info update across the customer navigation bar, footer, and checkout pages automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Payments & Safepay COD */}
      {activeTab === 'payment' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Section A: Cash on Delivery & Partial Advance */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-fire/10 text-fire rounded-xl">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-gray-900 dark:text-white">
                    Cash on Delivery (COD) Rules
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Require partial advance payment via Safepay for high-value orders to prevent fake COD returns.
                  </p>
                </div>
              </div>

              {/* Master COD Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.cod_enabled}
                  onChange={(e) => setForm({ ...form, cod_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fire"></div>
                <span className="ml-3 text-xs font-bold text-gray-800 dark:text-zinc-200">
                  {form.cod_enabled ? 'COD Enabled' : 'COD Disabled'}
                </span>
              </label>
            </div>

            {form.cod_enabled ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Threshold */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                      Order Threshold Amount (Rs.)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={form.advance_payment_threshold}
                        onChange={(e) => setForm({ ...form, advance_payment_threshold: e.target.value })}
                        placeholder="10000"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white font-mono font-bold focus:outline-none focus:border-fire transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Orders at or above this total will mandate an advance payment before confirmation.
                    </p>
                  </div>

                  {/* Advance Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                      Advance Calculation Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, advance_payment_type: 'percentage' })}
                        className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          form.advance_payment_type === 'percentage'
                            ? 'bg-fire text-white border-fire shadow-xs'
                            : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100'
                        }`}
                      >
                        <Percent size={14} />
                        <span>Percentage</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm({ ...form, advance_payment_type: 'fixed' })}
                        className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          form.advance_payment_type === 'fixed'
                            ? 'bg-fire text-white border-fire shadow-xs'
                            : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100'
                        }`}
                      >
                        <DollarSign size={14} />
                        <span>Fixed Amount</span>
                      </button>
                    </div>
                  </div>

                  {/* Advance Rate / Amount */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                      {form.advance_payment_type === 'percentage' ? 'Advance Percentage (%)' : 'Fixed Advance Amount (Rs.)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">
                        {form.advance_payment_type === 'percentage' ? '%' : 'Rs.'}
                      </span>
                      {form.advance_payment_type === 'percentage' ? (
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={form.advance_payment_percent}
                          onChange={(e) => setForm({ ...form, advance_payment_percent: e.target.value })}
                          placeholder="15"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white font-mono font-bold focus:outline-none focus:border-fire transition-colors"
                        />
                      ) : (
                        <input
                          type="number"
                          min="100"
                          step="100"
                          value={form.advance_payment_fixed}
                          onChange={(e) => setForm({ ...form, advance_payment_fixed: e.target.value })}
                          placeholder="1500"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white font-mono font-bold focus:outline-none focus:border-fire transition-colors"
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {form.advance_payment_type === 'percentage'
                        ? 'e.g. 15% means Rs. 1,500 advance on a Rs. 10,000 order.'
                        : 'e.g. flat Rs. 1,500 advance regardless of total.'}
                    </p>
                  </div>
                </div>

                {/* Live Interactive Simulator */}
                <div className="p-5 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-200 dark:border-zinc-700/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-fire" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-200">
                        Live Checkout Simulator
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 dark:text-zinc-400">Test Order Total:</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400">Rs.</span>
                        <input
                          type="number"
                          step="1000"
                          value={calcOrderAmount}
                          onChange={(e) => setCalcOrderAmount(Number(e.target.value) || 0)}
                          className="w-28 pl-7 pr-2 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700/60">
                      <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Status</span>
                      <p className="mt-1 font-display font-bold text-sm">
                        {requiresAdvance ? (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <AlertCircle size={14} /> Advance Required
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <Check size={14} /> Full COD (No Advance)
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700/60">
                      <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Customer Pays Now (Safepay)</span>
                      <p className="mt-1 font-mono font-black text-sm text-fire">
                        {fmt(simulatedAdvance)}
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700/60">
                      <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Rider Collects on Doorstep</span>
                      <p className="mt-1 font-mono font-black text-sm text-gray-900 dark:text-zinc-100">
                        {fmt(simulatedBalance)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                Cash on Delivery is currently disabled. All checkout customers must pay online via Safepay.
              </div>
            )}
          </div>

          {/* Section B: Safepay PK Integration */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                  <CreditCard size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-gray-900 dark:text-white">
                      Safepay PK Payment Gateway
                    </h3>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      form.safepay_environment === 'production'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                    }`}>
                      {form.safepay_environment.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Powers Debit/Credit Cards (Visa & Mastercard), JazzCash, and Easypaisa checkout and COD advance deposits.
                  </p>
                </div>
              </div>

              {/* Master Safepay Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.safepay_enabled}
                  onChange={(e) => setForm({ ...form, safepay_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fire"></div>
                <span className="ml-3 text-xs font-bold text-gray-800 dark:text-zinc-200">
                  {form.safepay_enabled ? 'Safepay Active' : 'Safepay Disabled'}
                </span>
              </label>
            </div>

            {form.safepay_enabled && (
              <div className="space-y-5">
                {/* Environment Mode */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                    Gateway Environment
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, safepay_environment: 'sandbox' })}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        form.safepay_environment === 'sandbox'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100'
                      }`}
                    >
                      Sandbox (Test Mode)
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, safepay_environment: 'production' })}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        form.safepay_environment === 'production'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100'
                      }`}
                    >
                      Production (Live Real Money)
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Keep in Sandbox mode while testing with test cards and mock payments. Switch to Production when launching live.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* API Key */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                      Safepay API Key
                    </label>
                    <input
                      type="text"
                      value={form.safepay_api_key}
                      onChange={(e) => setForm({ ...form, safepay_api_key: e.target.value })}
                      placeholder="sec_..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white font-mono focus:outline-none focus:border-fire transition-colors"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Found in your Safepay Merchant Dashboard under Developer Settings.
                    </p>
                  </div>

                  {/* Secret Key */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                      Safepay Secret Key (v1 Secret)
                    </label>
                    <input
                      type="password"
                      value={form.safepay_v1_secret}
                      onChange={(e) => setForm({ ...form, safepay_v1_secret: e.target.value })}
                      placeholder="••••••••••••••••••••••••••••••••"
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white font-mono focus:outline-none focus:border-fire transition-colors"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Used to encrypt and securely sign checkout session requests.
                    </p>
                  </div>
                </div>

                {/* Webhook Secret */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                    Webhook Shared Secret (Optional)
                  </label>
                  <input
                    type="password"
                    value={form.safepay_webhook_secret}
                    onChange={(e) => setForm({ ...form, safepay_webhook_secret: e.target.value })}
                    placeholder="Shared webhook secret for HMAC verification"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white font-mono focus:outline-none focus:border-fire transition-colors"
                  />
                </div>

                {/* Webhook Endpoint Info Box */}
                <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-gray-400 dark:text-zinc-500">
                      Webhook Listener Endpoint
                    </span>
                    <p className="text-xs font-mono font-bold text-gray-800 dark:text-zinc-200 break-all">
                      {webhookUrl}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyWebhook}
                    className="px-3.5 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    {copiedWebhook ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab 3: Shipping & Delivery */}
      {activeTab === 'shipping' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl space-y-6"
        >
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="p-2.5 bg-fire/10 text-fire rounded-xl">
                <Truck size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-gray-900 dark:text-white">
                  Nationwide Shipping Defaults
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Standard delivery fee applied at checkout and free shipping promotion threshold.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                  Standard Flat Shipping Fee (Rs.)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={form.flat_shipping_fee}
                    onChange={(e) => setForm({ ...form, flat_shipping_fee: e.target.value })}
                    placeholder="250"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white font-mono font-bold focus:outline-none focus:border-fire transition-colors"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Default rider/courier delivery charge for domestic orders.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                  Free Shipping Minimum (Rs.)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={form.free_shipping_min_amt}
                    onChange={(e) => setForm({ ...form, free_shipping_min_amt: e.target.value })}
                    placeholder="5000"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white font-mono font-bold focus:outline-none focus:border-fire transition-colors"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Orders totaling this amount or higher enjoy 100% free delivery.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 4: Security & Password */}
      {activeTab === 'security' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl space-y-6"
        >
          {/* Admin User Card */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-fire text-white flex items-center justify-center font-display font-black text-lg">
                {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-gray-900 dark:text-white">
                  {user?.name || 'Administrator'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400 font-mono">
                  {user?.email}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-fire/10 text-fire px-2.5 py-1 rounded-full border border-fire/20">
              {user?.role || 'admin'}
            </span>
          </div>

          {/* Password Change Form */}
          <form onSubmit={handlePasswordChange} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="p-2.5 bg-fire/10 text-fire rounded-xl">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-gray-900 dark:text-white">
                  Change Account Password
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Update your dashboard login password. Minimum 6 characters required.
                </p>
              </div>
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-fire transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  placeholder="Enter new password (at least 6 characters)"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-fire transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-fire transition-colors"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="px-5 py-2.5 bg-fire hover:bg-fire-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-fire/20 disabled:opacity-60 cursor-pointer flex items-center gap-2"
              >
                {changingPassword && <RefreshCw size={14} className="animate-spin" />}
                <span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
