import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning" | "primary"
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={loading ? undefined : onCancel}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden z-10"
        >
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-xl shrink-0 ${
              isDanger
                ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50"
                : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50"
            }`}>
              {isDanger ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base font-bold text-gray-900 dark:text-zinc-100">
                {title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {message}
              </p>
            </div>

            <button
              type="button"
              onClick={loading ? undefined : onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 p-1 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-zinc-800/80">
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 ${
                isDanger
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
                  : "bg-fire hover:bg-fire-hover text-white shadow-fire/20"
              }`}
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

