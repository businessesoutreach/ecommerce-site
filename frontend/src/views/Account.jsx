import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Package,
  Heart,
  LogOut,
  Gift,
  RotateCcw,
  X,
  MapPin,
  Plus,
  Trash2,
  Loader2,
  Eye,
  Truck,
  Edit3,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Check,
} from "lucide-react";
import { http, fmt } from "../lib/api";
import { useStore } from "../context/StoreContext";
import { EmptyState } from "../components/common";
import PhoneInput from "../components/PhoneInput";
import ProductCard from "../components/ProductCard";
import { toast } from "sonner";
import {
  CustomDropdown,
  PROVINCES,
  PROVINCE_CITIES,
  ALL_CITIES,
} from "../components/LocationDropdowns";

const LABELS = {
  placed: "Placed",
  confirmed: "Verified",
  packed: "Packed",
  shipped: "Dispatched",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return Requested",
  returned: "Returned",
};

const STATUS_COLORS = {
  placed: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  packed: "bg-indigo-100 text-indigo-800 border-indigo-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  out_for_delivery: "bg-orange-100 text-orange-800 border-orange-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  return_requested: "bg-yellow-100 text-yellow-800 border-yellow-200",
  returned: "bg-ink-100 text-ink-700 border-ink-200",
};

function formatAddress(addr) {
  if (!addr) return "—";
  if (typeof addr === "string") return addr;
  return [addr.address_l1, addr.city, addr.province, addr.postal_code].filter(Boolean).join(", ");
}

// ---------------------------------------------------------------------------
// 📦 Addresses Tab (List, Add, Edit, Set Default, Delete)
// ---------------------------------------------------------------------------
function AddressesTab() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [f, setF] = useState({
    full_name: "",
    phone: "",
    address_l1: "",
    province: "Sindh",
    city: "Karachi",
    postal_code: "",
    is_default: false,
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  const load = () =>
    http
      .get("/me/addresses")
      .then(({ data }) => setItems(data.data || []))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setF({
      full_name: "",
      phone: "",
      address_l1: "",
      province: "Sindh",
      city: "Karachi",
      postal_code: "",
      is_default: false,
    });
  };

  const startEdit = (a) => {
    setEditingId(a.id);
    setF({
      full_name: a.full_name || "",
      phone: a.phone || "",
      address_l1: a.address_l1 || "",
      province: a.province || "Sindh",
      city: a.city || "Karachi",
      postal_code: a.postal_code || "",
      is_default: a.is_default || false,
    });
  };

  const save = async () => {
    if (!f.full_name.trim() || !f.phone.trim() || !f.address_l1.trim()) {
      return toast.error("Full name, phone & street address are required");
    }
    setSaving(true);
    try {
      if (editingId) {
        await http.patch(`/me/addresses/${editingId}`, f);
        toast.success("Address updated successfully");
      } else {
        await http.post("/me/addresses", f);
        toast.success("New address saved");
      }
      resetForm();
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not save address");
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id) => {
    setSettingDefaultId(id);
    try {
      await http.patch(`/me/addresses/${id}`, { is_default: true });
      toast.success("Default address updated");
      load();
    } catch (e) {
      toast.error("Could not set as default");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    setDeletingId(id);
    try {
      await http.delete(`/me/addresses/${id}`);
      toast.success("Address removed");
      if (editingId === id) resetForm();
      load();
    } catch (e) {
      toast.error("Could not delete address");
    } finally {
      setDeletingId(null);
    }
  };

  const inp =
    "w-full border border-ink-200 rounded-none px-4 py-2.5 outline-none focus:border-obsidian bg-white transition-colors text-sm";

  return (
    <div className="grid lg:grid-cols-5 gap-8 items-start" data-testid="account-addresses">
      {/* Address List */}
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display tracking-tight text-lg font-bold">Saved Addresses</h3>
          <span className="font-mono text-xs text-ink-400 font-semibold">{items.length} saved</span>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-ink-200 p-8 text-center text-ink-500">
            <MapPin size={36} className="mx-auto text-ink-300 mb-3" />
            <p className="font-display font-bold text-obsidian mb-1">No saved addresses yet</p>
            <p className="text-xs text-ink-400">Add an address on the right for swift checkout on future drops.</p>
          </div>
        ) : (
          items.map((a) => (
            <div
              key={a.id}
              data-testid={`account-address-${a.id}`}
              className={`bg-white border p-5 transition-all relative ${
                a.is_default
                  ? "border-obsidian shadow-sm ring-1 ring-obsidian/10"
                  : "border-ink-200 hover:border-ink-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-display tracking-tight font-bold text-base text-obsidian">
                      {a.full_name}
                    </span>
                    {a.is_default ? (
                      <span className="font-mono font-bold text-[10px] tracking-widest uppercase bg-obsidian text-white px-2 py-0.5">
                        Default Delivery
                      </span>
                    ) : (
                      <button
                        onClick={() => setDefault(a.id)}
                        disabled={settingDefaultId === a.id}
                        className="font-mono text-[10px] text-ink-500 hover:text-fire font-bold uppercase tracking-wider underline underline-offset-2 transition-colors disabled:opacity-50"
                      >
                        {settingDefaultId === a.id ? "Setting..." : "Set as Default"}
                      </button>
                    )}
                  </div>
                  <p className="text-ink-700 text-sm leading-relaxed">
                    {a.address_l1}, {a.city}
                    {a.province ? `, ${a.province}` : ""}
                    {a.postal_code ? ` — ${a.postal_code}` : ""}
                  </p>
                  <p className="text-ink-500 text-xs font-mono mt-2 font-medium">📞 {a.phone}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-4">
                  <button
                    onClick={() => startEdit(a)}
                    className="p-2 text-ink-400 hover:text-obsidian hover:bg-ink-100 transition-colors"
                    title="Edit Address"
                    aria-label="Edit address"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    disabled={deletingId === a.id}
                    onClick={() => del(a.id)}
                    className="p-2 text-ink-400 hover:text-fire hover:bg-fire/10 transition-colors disabled:opacity-50"
                    title="Delete Address"
                    aria-label="Delete address"
                  >
                    {deletingId === a.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Address Form (Add or Edit) */}
      <div className="lg:col-span-2 bg-white border border-ink-200 p-6 shadow-sm sticky top-28">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-ink-100">
          <h3 className="font-display tracking-tight font-bold text-base flex items-center gap-2">
            {editingId ? <Edit3 size={17} className="text-fire" /> : <Plus size={17} className="text-fire" />}
            {editingId ? "Edit Address" : "Add New Address"}
          </h3>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-xs font-mono text-ink-400 hover:text-obsidian font-bold"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono tracking-widest text-ink-400 mb-1.5 uppercase font-bold">
              Full Name
            </label>
            <input
              placeholder="e.g. Hamza Tariq"
              value={f.full_name}
              onChange={(e) => setF({ ...f, full_name: e.target.value })}
              data-testid="address-fullname"
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-mono tracking-widest text-ink-400 mb-1.5 uppercase font-bold">
              Phone Number
            </label>
            <PhoneInput
              placeholder="3XX XXXXXXX"
              value={f.phone}
              onChange={(val) => setF({ ...f, phone: val })}
              testid="address-phone"
            />
          </div>

          <div>
            <label className="block text-xs font-mono tracking-widest text-ink-400 mb-1.5 uppercase font-bold">
              Street Address
            </label>
            <input
              placeholder="House #, Street, Block, Area"
              value={f.address_l1}
              onChange={(e) => setF({ ...f, address_l1: e.target.value })}
              data-testid="address-line1"
              className={inp}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono tracking-widest text-ink-400 mb-1.5 uppercase font-bold">
                Province
              </label>
              <CustomDropdown
                value={f.province}
                onChange={(val) => setF({ ...f, province: val, city: "" })}
                options={PROVINCES}
                placeholder="Select Province"
              />
            </div>
            <div>
              <label className="block text-xs font-mono tracking-widest text-ink-400 mb-1.5 uppercase font-bold">
                City
              </label>
              <CustomDropdown
                value={f.city}
                onChange={(val) => setF({ ...f, city: val })}
                options={f.province ? PROVINCE_CITIES[f.province] : ALL_CITIES}
                placeholder="Select City"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-mono tracking-widest text-ink-400 mb-1.5 uppercase font-bold">
                Postal Code (Optional)
              </label>
              <input
                placeholder="e.g. 75500"
                value={f.postal_code}
                onChange={(e) => setF({ ...f, postal_code: e.target.value })}
                className={inp}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 mt-2 text-sm text-ink-700 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={f.is_default}
              onChange={(e) => setF({ ...f, is_default: e.target.checked })}
              className="accent-obsidian w-4 h-4 rounded-none cursor-pointer"
            />
            Set as default delivery address
          </label>

          <button
            disabled={saving}
            onClick={save}
            data-testid="address-save"
            className="w-full mt-2 bg-obsidian text-white font-display tracking-wider py-3.5 hover:bg-fire transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait font-bold text-sm"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : editingId ? (
              "Update Address"
            ) : (
              "Save New Address"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ❤️ Wishlist Tab
// ---------------------------------------------------------------------------
function WishlistTab() {
  const { wishlist } = useStore();

  if (wishlist.items.length === 0) {
    return (
      <div className="bg-white border border-ink-200 p-12 text-center max-w-2xl mx-auto shadow-sm">
        <Heart size={44} className="mx-auto text-ink-300 mb-4" />
        <h3 className="font-display tracking-tight text-xl font-bold mb-2">No saved kicks yet</h3>
        <p className="text-ink-500 mb-6 max-w-sm mx-auto text-sm">
          Tap the heart on any drop to stash it here for instant checkout later.
        </p>
        <Link
          to="/shop"
          className="inline-block bg-obsidian text-white font-display tracking-wider px-8 py-3.5 hover:bg-fire transition-colors text-sm font-bold"
        >
          Explore All Kicks
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display tracking-tight text-xl font-bold">
          Your Rotation Wishlist <span className="text-fire">({wishlist.items.length})</span>
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {wishlist.items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ⚙️ Settings Tab (Profile Info & Password Change)
// ---------------------------------------------------------------------------
function SettingsTab({ user }) {
  const { updateUser } = useStore();
  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [loadingPw, setLoadingPw] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || "", phone: user.phone || "" });
    }
  }, [user]);

  const updateProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) return toast.error("Full name cannot be empty");
    setSavingProfile(true);
    try {
      const { data } = await http.patch("/me/profile", profile);
      updateUser(data.data);
      toast.success("Profile information updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (!pw.current_password || !pw.new_password) {
      return toast.error("Please fill both password fields");
    }
    if (pw.new_password.length < 6) {
      return toast.error("New password must be at least 6 characters");
    }
    if (pw.new_password !== pw.confirm_password) {
      return toast.error("New passwords do not match");
    }

    setLoadingPw(true);
    try {
      await http.post("/auth/change-password", {
        current_password: pw.current_password,
        new_password: pw.new_password,
      });
      toast.success("Password changed successfully");
      setPw({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not update password");
    } finally {
      setLoadingPw(false);
    }
  };

  const inp =
    "w-full border border-ink-200 rounded-none px-4 py-3 outline-none focus:border-obsidian bg-white transition-colors text-sm";

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start" data-testid="account-settings">
      {/* Profile Form */}
      <div className="bg-white border border-ink-200 p-6 sm:p-8 shadow-sm">
        <h3 className="font-display tracking-tight text-lg font-bold mb-2">Profile Information</h3>
        <p className="text-xs text-ink-400 mb-6 font-mono">
          Update your public name and primary contact number used for COD orders.
        </p>

        <form onSubmit={updateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-mono tracking-widest text-ink-400 mb-1.5 uppercase font-bold">
              Full Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className={inp}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-xs font-mono tracking-widest text-ink-400 mb-1.5 uppercase font-bold">
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className={`${inp} bg-ink-50 text-ink-400 cursor-not-allowed`}
            />
            <span className="text-[11px] text-ink-400 mt-1 block">
              Email address cannot be changed directly.
            </span>
          </div>

          <div>
            <label className="block text-xs font-mono tracking-widest text-ink-400 mb-1.5 uppercase font-bold">
              Contact Phone
            </label>
            <PhoneInput
              placeholder="3XX XXXXXXX"
              value={profile.phone}
              onChange={(val) => setProfile({ ...profile, phone: val })}
              testid="profile-phone"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full bg-obsidian text-white font-display tracking-wider py-3.5 mt-2 hover:bg-fire transition-colors disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2 font-bold text-sm"
          >
            {savingProfile ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>

      {/* Password Management */}
      {!user.picture ? (
        <div className="bg-white border border-ink-200 p-6 sm:p-8 shadow-sm">
          <h3 className="font-display tracking-tight text-lg font-bold mb-2">Change Password</h3>
          <p className="text-xs text-ink-400 mb-6 font-mono">
            Ensure your account is protected with a secure password.
          </p>

          <form onSubmit={updatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-mono tracking-widest text-ink-400 mb-1.5 uppercase font-bold">
                Current Password
              </label>
              <input
                type="password"
                value={pw.current_password}
                onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
                className={inp}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-mono tracking-widest text-ink-400 mb-1.5 uppercase font-bold">
                New Password
              </label>
              <input
                type="password"
                value={pw.new_password}
                onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
                className={inp}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-mono tracking-widest text-ink-400 mb-1.5 uppercase font-bold">
                Confirm New Password
              </label>
              <input
                type="password"
                value={pw.confirm_password}
                onChange={(e) => setPw({ ...pw, confirm_password: e.target.value })}
                className={inp}
                placeholder="Re-enter new password"
              />
            </div>
            <button
              type="submit"
              disabled={loadingPw}
              className="w-full bg-obsidian text-white font-display tracking-wider py-3.5 mt-2 hover:bg-fire transition-colors disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2 font-bold text-sm"
            >
              {loadingPw ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-ink-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck size={24} className="text-emerald-600" />
            <h3 className="font-display tracking-tight text-lg font-bold">Google Authenticated</h3>
          </div>
          <p className="text-sm text-ink-600 leading-relaxed">
            Your account is authenticated securely via Google OAuth. Password management is handled
            directly through your Google Account.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 🔍 Order Details Modal Drawer
// ---------------------------------------------------------------------------
function OrderDetailsModal({ order, onClose, onCancelOrder, onReturnOrder }) {
  if (!order) return null;

  const STEPS = ["placed", "confirmed", "packed", "shipped", "delivered"];
  const currentStepIdx = STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const canCancel = ["placed", "confirmed"].includes(order.status);
  const canReturn = order.status === "delivered";

  return (
    <div className="fixed inset-0 bg-obsidian/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-white border border-ink-300 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl rounded-none overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-ink-200 flex items-start justify-between bg-ink-50 shrink-0">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-obsidian">
                {order.order_number}
              </h2>
              <span
                className={`font-mono text-[10px] font-bold px-2.5 py-0.5 border uppercase tracking-wider ${
                  STATUS_COLORS[order.status] || "bg-ink-100 text-obsidian border-ink-200"
                }`}
              >
                {LABELS[order.status] || order.status}
              </span>
            </div>
            <p className="text-xs text-ink-500 font-mono mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString("en-PK", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-400 hover:text-obsidian hover:bg-ink-200 transition-colors"
            aria-label="Close details"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 text-sm custom-scrollbar">
          {/* Tracking Stepper (if not cancelled) */}
          {!isCancelled ? (
            <div className="bg-ink-50 border border-ink-200 p-4 sm:p-5">
              <span className="text-xs font-mono tracking-widest text-ink-400 uppercase font-bold block mb-4">
                Delivery Status
              </span>
              <div className="grid grid-cols-5 gap-1 text-center relative">
                {STEPS.map((st, i) => {
                  const isDone = currentStepIdx >= i;
                  const isCurrent = currentStepIdx === i;
                  return (
                    <div key={st} className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                          isDone
                            ? "bg-obsidian text-white"
                            : "bg-ink-200 text-ink-500"
                        } ${isCurrent ? "ring-2 ring-fire ring-offset-2" : ""}`}
                      >
                        {isDone ? <Check size={14} /> : i + 1}
                      </div>
                      <span
                        className={`text-[10px] font-mono mt-2 uppercase tracking-tight ${
                          isCurrent
                            ? "font-bold text-fire"
                            : isDone
                            ? "text-obsidian font-semibold"
                            : "text-ink-400"
                        }`}
                      >
                        {LABELS[st]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Courier info if dispatched */}
              {order.courier_tracking_number && (
                <div className="mt-4 pt-3 border-t border-ink-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-ink-400 font-mono">Courier: </span>
                    <span className="font-bold capitalize text-obsidian">
                      {order.courier_partner || "Standard Dispatch"}
                    </span>
                    <span className="text-ink-400 font-mono ml-2">AWB: </span>
                    <span className="font-mono font-bold text-fire">
                      {order.courier_tracking_number}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 p-4 text-red-800 flex items-center gap-3">
              <AlertTriangle size={20} className="shrink-0 text-red-600" />
              <div>
                <p className="font-display font-bold text-sm">Order Cancelled</p>
                <p className="text-xs text-red-600 mt-0.5">
                  This order has been cancelled. Any used store credit has been returned to your balance.
                </p>
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <h4 className="font-display font-bold text-sm text-obsidian uppercase tracking-wider mb-3">
              Order Items ({order.items?.length || 0})
            </h4>
            <div className="border border-ink-200 divide-y divide-ink-100">
              {order.items?.map((it, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between gap-4 bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={it.image_url}
                      alt={it.product_name}
                      className="h-14 w-14 object-cover bg-ink-100 border border-ink-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-display font-bold text-sm text-obsidian truncate">
                        {it.product_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-mono text-ink-500 mt-0.5">
                        <span className="bg-ink-100 px-1.5 py-0.5 font-bold text-obsidian">
                          {it.variant_label || `EU ${it.size}`}
                        </span>
                        <span>Qty: {it.quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-obsidian text-sm">
                      {fmt(it.unit_price * it.quantity)}
                    </p>
                    {it.quantity > 1 && (
                      <span className="text-[10px] text-ink-400 font-mono">
                        {fmt(it.unit_price)} each
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h4 className="font-display font-bold text-sm text-obsidian uppercase tracking-wider mb-3">
              Delivery Details
            </h4>
            <div className="bg-ink-50 border border-ink-200 p-4">
              <p className="font-bold text-obsidian">{order.customer_name}</p>
              <p className="text-ink-600 text-xs mt-0.5">{formatAddress(order.shipping_address)}</p>
              <p className="text-ink-500 text-xs font-mono mt-1.5 font-semibold">📞 {order.customer_phone}</p>
              {order.customer_email && (
                <p className="text-ink-400 text-xs font-mono mt-0.5">✉️ {order.customer_email}</p>
              )}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div>
            <h4 className="font-display font-bold text-sm text-obsidian uppercase tracking-wider mb-3">
              Payment & Pricing Summary
            </h4>
            <div className="bg-white border border-ink-200 p-4 space-y-2">
              <div className="flex justify-between text-ink-600 text-xs">
                <span>Subtotal</span>
                <span className="font-mono font-medium">{fmt(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600 text-xs font-medium">
                  <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</span>
                  <span className="font-mono">−{fmt(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-600 text-xs">
                <span>Shipping Fee</span>
                <span className="font-mono">
                  {order.shipping_fee === 0 ? "FREE" : fmt(order.shipping_fee)}
                </span>
              </div>
              {order.store_credit_used > 0 && (
                <div className="flex justify-between text-green-600 text-xs font-medium">
                  <span>Store Credit Applied</span>
                  <span className="font-mono">−{fmt(order.store_credit_used)}</span>
                </div>
              )}
              {order.advance_paid > 0 && (
                <div className="flex justify-between text-blue-600 text-xs font-medium">
                  <span>Advance Payment (Paid)</span>
                  <span className="font-mono">{fmt(order.advance_paid)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2.5 border-t border-ink-200">
                <div>
                  <span className="font-display font-bold text-base text-obsidian block">
                    Total Amount
                  </span>
                  <span className="text-[11px] font-mono text-ink-400 uppercase">
                    Via {order.payment_method}
                  </span>
                </div>
                <span className="font-display text-xl font-extrabold text-fire font-mono">
                  {fmt(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-ink-200 bg-ink-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {canCancel && (
              <button
                onClick={() => {
                  onClose();
                  onCancelOrder(order);
                }}
                className="text-xs font-mono font-bold text-fire hover:bg-fire/10 border border-fire/30 px-3.5 py-2 transition-colors"
              >
                Cancel Order
              </button>
            )}
            {canReturn && (
              <button
                onClick={() => {
                  onClose();
                  onReturnOrder(order);
                }}
                className="text-xs font-display font-bold text-obsidian hover:bg-obsidian hover:text-white border border-obsidian px-3.5 py-2 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw size={13} /> Request Return
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="text-xs font-display font-bold bg-obsidian text-white hover:bg-fire px-6 py-2.5 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 👤 Main Account View
// ---------------------------------------------------------------------------
export default function Account() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [credit, setCredit] = useState({ balance: 0, ledger: [] });

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelFor, setCancelFor] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [returnFor, setReturnFor] = useState(null);
  const [reason, setReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const loadOrders = () =>
    http
      .get("/orders")
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => {});

  const loadCredit = () =>
    http
      .get("/me/store-credit")
      .then(({ data }) => setCredit(data.data || { balance: 0, ledger: [] }))
      .catch(() => {});

  useEffect(() => {
    const hasToken = typeof window !== "undefined" && localStorage.getItem("jt_token");
    if (!user && !hasToken) {
      navigate("/login");
    } else if (user) {
      loadOrders();
      loadCredit();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-24 flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-fire" />
      </div>
    );
  }

  const handleCancelOrder = async () => {
    if (!cancelFor) return;
    setCancellingOrder(true);
    try {
      await http.post(`/orders/${cancelFor.id}/cancel`);
      toast.success(`Order ${cancelFor.order_number} has been cancelled`);
      setCancelFor(null);
      loadOrders();
      loadCredit();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not cancel order");
    } finally {
      setCancellingOrder(false);
    }
  };

  const submitReturn = async () => {
    if (!reason.trim()) return toast.error("Please explain the reason for return");
    setSubmittingReturn(true);
    try {
      await http.post(`/orders/${returnFor.id}/return-request`, { reason });
      toast.success("Return request submitted. Our team will review it shortly.");
      setReturnFor(null);
      setReason("");
      loadOrders();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not submit return");
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[75vh]">
      {/* Header Profile Greeting */}
      <div className="flex items-center gap-4 mb-8 bg-white border border-ink-200 p-5 sm:p-6 shadow-sm">
        {user.picture ? (
          <img
            src={user.picture}
            alt=""
            className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover shrink-0 ring-2 ring-obsidian/10"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-none bg-obsidian text-white grid place-items-center font-display font-bold text-2xl shrink-0 shadow-sm">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display tracking-tight text-2xl sm:text-3xl font-extrabold text-obsidian">
              Hey, {user.name?.split(" ")[0]}
            </h1>
            {credit.balance > 0 && (
              <span className="font-mono text-[11px] font-bold bg-fire/10 text-fire border border-fire/20 px-2 py-0.5">
                Credit: {fmt(credit.balance)}
              </span>
            )}
          </div>
          <p className="text-ink-500 text-xs sm:text-sm font-mono mt-0.5 truncate">{user.email}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
            {[
              ["orders", "My Orders", Package, orders.length],
              ["credit", "Store Credit", Gift, credit.balance > 0 ? fmt(credit.balance) : null],
              ["addresses", "Addresses", MapPin, null],
              ["wishlist", "Wishlist", Heart, null],
              ["settings", "Settings", User, null],
            ].map(([k, l, I, badge]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                data-testid={`account-tab-${k}`}
                className={`flex items-center justify-between px-4 py-3 rounded-none font-display text-sm tracking-tight whitespace-nowrap transition-colors ${
                  tab === k
                    ? "bg-obsidian text-white font-bold shadow-sm"
                    : "bg-white border border-ink-200 text-ink-700 hover:border-obsidian hover:text-obsidian"
                }`}
              >
                <div className="flex items-center gap-3">
                  <I size={17} className={tab === k ? "text-fire" : "text-ink-500"} />
                  <span>{l}</span>
                </div>
                {badge && (
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded-none font-bold ${
                      tab === k ? "bg-white/20 text-white" : "bg-ink-100 text-obsidian"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-none font-display text-sm tracking-tight text-fire hover:bg-fire/10 bg-white border border-fire/20 transition-colors whitespace-nowrap font-bold mt-1"
            >
              <LogOut size={17} /> Logout
            </button>
          </nav>
        </aside>

        {/* Tab Body */}
        <div className="lg:col-span-3">
          {/* ORDERS TAB */}
          {tab === "orders" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display tracking-tight text-xl font-bold text-obsidian">
                  Order History <span className="text-fire font-mono">({orders.length})</span>
                </h3>
                <Link
                  to="/track-order"
                  className="font-mono text-xs text-ink-500 hover:text-fire font-bold flex items-center gap-1 transition-colors"
                >
                  <Truck size={14} /> Tracking Portal
                </Link>
              </div>

              {orders.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No orders yet"
                  subtitle="Your kicks rotation history will appear here once you cop your first pair."
                />
              ) : (
                <div className="space-y-4">
                  {orders.map((o) => {
                    const canCancel = ["placed", "confirmed"].includes(o.status);
                    const canReturn = o.status === "delivered";
                    const isShipped = ["shipped", "out_for_delivery"].includes(o.status);

                    return (
                      <div
                        key={o.id}
                        data-testid={`account-order-${o.order_number}`}
                        className="bg-white border border-ink-200 rounded-none p-5 sm:p-6 transition-all hover:border-obsidian shadow-sm"
                      >
                        {/* Top row */}
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div>
                            <span className="font-mono text-xs text-ink-400 block font-medium">
                              Placed on {new Date(o.created_at).toLocaleDateString("en-PK", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <p className="font-display font-bold text-lg text-obsidian mt-0.5">
                              {o.order_number}
                            </p>
                          </div>
                          <span
                            className={`font-mono text-[10px] font-bold px-3 py-1 border uppercase tracking-wider ${
                              STATUS_COLORS[o.status] || "bg-ink-100 text-obsidian border-ink-200"
                            }`}
                          >
                            {LABELS[o.status] || o.status}
                          </span>
                        </div>

                        {/* Thumbnails preview */}
                        <div className="flex gap-2.5 mt-4 overflow-x-auto no-scrollbar pb-1">
                          {o.items?.slice(0, 4).map((it, i) => (
                            <div key={i} className="relative group shrink-0">
                              <img
                                src={it.image_url}
                                alt={it.product_name}
                                className="h-16 w-16 sm:h-20 sm:w-20 object-cover bg-ink-100 border border-ink-200"
                              />
                              <span className="absolute bottom-0 right-0 bg-obsidian text-white font-mono text-[9px] px-1 font-bold">
                                {it.size}
                              </span>
                            </div>
                          ))}
                          {o.items?.length > 4 && (
                            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-ink-100 border border-ink-200 flex items-center justify-center font-mono font-bold text-xs text-ink-600 shrink-0">
                              +{o.items.length - 4}
                            </div>
                          )}
                        </div>

                        {/* Bottom action row */}
                        <div className="flex flex-wrap justify-between items-center gap-3 mt-4 pt-4 border-t border-ink-100">
                          <div className="text-ink-600 text-xs font-mono">
                            <span className="font-bold text-obsidian">{o.items?.length || 0}</span>{" "}
                            item(s) · <span className="uppercase">{o.payment_method}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Cancel Order */}
                            {canCancel && (
                              <button
                                onClick={() => setCancelFor(o)}
                                className="text-xs font-mono font-bold text-fire hover:bg-fire/10 border border-fire/30 px-3 py-1.5 transition-colors"
                              >
                                Cancel
                              </button>
                            )}

                            {/* Track Delivery */}
                            {isShipped && (
                              <Link
                                to={`/track-order?q=${o.order_number}`}
                                className="flex items-center gap-1 text-xs font-bold font-mono border border-ink-300 px-3 py-1.5 hover:border-obsidian transition-colors text-obsidian"
                              >
                                <Truck size={12} /> Track
                              </Link>
                            )}

                            {/* Return */}
                            {canReturn && (
                              <button
                                onClick={() => setReturnFor(o)}
                                data-testid={`account-return-btn-${o.order_number}`}
                                className="flex items-center gap-1.5 text-xs font-bold border border-ink-300 px-3 py-1.5 hover:border-obsidian transition-colors text-obsidian"
                              >
                                <RotateCcw size={12} /> Return
                              </button>
                            )}

                            {/* View Details */}
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="flex items-center gap-1.5 text-xs font-bold bg-obsidian text-white px-3.5 py-1.5 hover:bg-fire transition-colors"
                            >
                              <Eye size={13} /> View Details
                            </button>

                            <span className="font-mono font-extrabold text-fire ml-2 text-base">
                              {fmt(o.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STORE CREDIT TAB */}
          {tab === "credit" && (
            <div>
              <div
                className="bg-obsidian text-white rounded-none p-6 sm:p-8 mb-6 shadow-sm border border-ink-900"
                data-testid="account-store-credit-balance"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Gift size={18} className="text-fire" />
                  <span className="font-mono text-xs uppercase tracking-widest text-white/70 font-bold">
                    Store Credit Balance
                  </span>
                </div>
                <p className="font-display font-extrabold text-3xl sm:text-4xl font-mono text-white mt-1">
                  {fmt(credit.balance)}
                </p>
                <p className="text-white/60 text-xs sm:text-sm mt-3 leading-relaxed max-w-lg">
                  Store credit is automatically applied at checkout to discount your next drop. Any
                  credits from order returns or cancellations are reflected immediately.
                </p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h4 className="font-display font-bold text-base text-obsidian">Transaction Ledger</h4>
                <span className="font-mono text-xs text-ink-400 font-semibold">
                  {credit.ledger?.length || 0} entries
                </span>
              </div>

              {!credit.ledger || credit.ledger.length === 0 ? (
                <div className="bg-white border border-ink-200 p-8 text-center text-ink-500">
                  <Gift size={32} className="mx-auto text-ink-300 mb-2" />
                  <p className="font-display font-bold text-obsidian text-sm">No transactions yet</p>
                  <p className="text-xs text-ink-400 mt-1">
                    When you receive store credit or spend it on an order, each line item appears here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 border border-ink-200 divide-y divide-ink-100 bg-white">
                  {credit.ledger.map((l) => (
                    <div
                      key={l.id}
                      className="flex justify-between items-center px-4 py-3.5 hover:bg-ink-50 transition-colors"
                    >
                      <div>
                        <p className="font-display font-bold text-sm text-obsidian capitalize">
                          {l.reason.replace(/_/g, " ").toLowerCase()}
                        </p>
                        <span className="font-mono text-xs text-ink-400">
                          {new Date(l.created_at).toLocaleDateString("en-PK", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold text-sm ${
                          l.amount >= 0 ? "text-emerald-600" : "text-fire"
                        }`}
                      >
                        {l.amount >= 0 ? "+" : "−"}
                        {fmt(Math.abs(l.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {tab === "addresses" && <AddressesTab />}

          {/* WISHLIST TAB */}
          {tab === "wishlist" && <WishlistTab />}

          {/* SETTINGS TAB */}
          {tab === "settings" && <SettingsTab user={user} />}
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onCancelOrder={(o) => setCancelFor(o)}
            onReturnOrder={(o) => setReturnFor(o)}
          />
        )}
      </AnimatePresence>

      {/* Return Request Modal */}
      <AnimatePresence>
        {returnFor && (
          <div
            className="fixed inset-0 bg-obsidian/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setReturnFor(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-none p-6 sm:p-7 w-full max-w-md shadow-2xl border border-ink-300 my-auto"
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-ink-200">
                <h3 className="font-display font-bold text-lg text-obsidian flex items-center gap-2">
                  <RotateCcw size={18} className="text-fire" /> Request Return
                </h3>
                <button
                  onClick={() => setReturnFor(null)}
                  className="p-1 text-ink-400 hover:text-obsidian"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-ink-50 p-3 mb-4 text-xs font-mono flex justify-between">
                <span>
                  Order: <b>{returnFor.order_number}</b>
                </span>
                <span className="font-bold text-fire">{fmt(returnFor.total)}</span>
              </div>

              <label className="block text-xs font-mono uppercase tracking-wider font-bold text-ink-600 mb-2">
                Reason for Return
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Please describe why you'd like to return or exchange this pair (e.g. wrong size, comfort preference, defect)..."
                data-testid="account-return-reason"
                className="w-full border border-ink-200 rounded-none px-4 py-3 outline-none focus:border-obsidian text-sm"
              />

              <div className="flex items-center gap-2 mt-5">
                <button
                  onClick={() => setReturnFor(null)}
                  className="w-1/3 border border-ink-200 py-3 text-xs font-mono font-bold hover:bg-ink-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={submittingReturn}
                  onClick={submitReturn}
                  data-testid="account-return-submit"
                  className="w-2/3 bg-obsidian text-white font-display font-bold text-sm py-3 hover:bg-fire transition-colors disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
                >
                  {submittingReturn ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Order Confirmation Modal */}
      <AnimatePresence>
        {cancelFor && (
          <div
            className="fixed inset-0 bg-obsidian/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setCancelFor(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-none p-6 sm:p-7 w-full max-w-md shadow-2xl border border-ink-300 my-auto"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-display font-bold text-lg text-fire flex items-center gap-2">
                  <AlertTriangle size={20} /> Cancel Order
                </h3>
                <button
                  onClick={() => setCancelFor(null)}
                  className="p-1 text-ink-400 hover:text-obsidian"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-ink-700 leading-relaxed mb-4">
                Are you sure you want to cancel order{" "}
                <b className="font-mono text-obsidian">{cancelFor.order_number}</b>?
              </p>

              {cancelFor.store_credit_used > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 mb-4 text-xs text-emerald-800">
                  ✓ Your store credit of <b>{fmt(cancelFor.store_credit_used)}</b> will be immediately
                  refunded to your account balance.
                </div>
              )}

              <p className="text-xs text-ink-400 font-mono mb-6">
                Items will be returned to store inventory. This action cannot be undone.
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCancelFor(null)}
                  className="w-1/2 border border-ink-200 py-3 text-xs font-mono font-bold hover:bg-ink-100 transition-colors"
                >
                  Keep Order
                </button>
                <button
                  disabled={cancellingOrder}
                  onClick={handleCancelOrder}
                  className="w-1/2 bg-fire text-white font-display font-bold text-sm py-3 hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
                >
                  {cancellingOrder ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Cancelling...
                    </>
                  ) : (
                    "Confirm Cancel"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
