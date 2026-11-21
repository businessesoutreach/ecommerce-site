import React, { useState, useEffect } from 'react';
import { http } from '../../lib/api';
import { toast } from "sonner";
import ConfirmModal from '../../components/ConfirmModal';
import { Trash2, Star, Plus, Check, Search, UserCheck, Loader2 } from 'lucide-react';

export default function TestimonialsCMS({ isDark }) {
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mode: "reviews" (select from user reviews) | "manual" (write manual testimonial)
  const [mode, setMode] = useState("reviews");

  // Reviews selection state
  const [customerReviews, setCustomerReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewRatingFilter, setReviewRatingFilter] = useState(0);

  // Manual form state
  const [f, setF] = useState({ author_name: "", author_meta: "Verified Customer", content: "", rating: 5 });
  const [submitting, setSubmitting] = useState(false);

  const loadTestimonials = async () => {
    try {
      const { data } = await http.get("/admin/cms/testimonials");
      setTestimonials(data.data || []);
    } catch (err) {
      toast.error("Failed to load testimonials");
    }
    setLoading(false);
  };

  const loadCustomerReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await http.get("/admin/reviews?limit=50&status=all");
      const list = res.data?.data?.reviews || res.data?.data || [];
      setCustomerReviews(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load customer reviews:", err);
    }
    setReviewsLoading(false);
  };

  useEffect(() => {
    loadTestimonials();
    loadCustomerReviews();
  }, []);

  // Add testimonial manually
  const addManual = async (e) => {
    e?.preventDefault();
    if (!f.author_name.trim() || !f.content.trim()) {
      return toast.error("Author name and testimonial content are required");
    }
    setSubmitting(true);
    try {
      await http.post("/admin/cms/testimonials", {
        author_name: f.author_name.trim(),
        author_meta: f.author_meta.trim() || "Verified Customer",
        content: f.content.trim(),
        rating: parseInt(f.rating, 10) || 5,
        is_published: true
      });
      toast.success("Manual testimonial added successfully");
      setF({ author_name: "", author_meta: "Verified Customer", content: "", rating: 5 });
      loadTestimonials();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add testimonial");
    } finally {
      setSubmitting(false);
    }
  };

  // Convert customer review into featured testimonial
  const featureReview = async (rev) => {
    try {
      await http.post("/admin/cms/testimonials", {
        author_name: rev.customer_name || "Verified Customer",
        author_meta: rev.product?.name ? `Buyer of ${rev.product.name}` : "Verified Buyer",
        content: rev.comment || "Great sneaker, very comfortable and fast delivery!",
        rating: rev.rating || 5,
        is_published: true
      });
      toast.success(`Featured review by ${rev.customer_name} as a testimonial!`);
      loadTestimonials();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to feature review");
    }
  };

  // Delete testimonial
  const del = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete this testimonial?",
      message: "Are you sure you want to remove this testimonial from the storefront?",
      confirmText: "Delete Testimonial",
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await http.delete(`/admin/cms/testimonials/${id}`);
          toast.success("Testimonial deleted");
          setConfirmModal({ isOpen: false });
          loadTestimonials();
        } catch (err) {
          toast.error("Failed to delete testimonial");
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  // Toggle publish status
  const toggleStatus = async (testimonial) => {
    try {
      await http.patch(`/admin/cms/testimonials/${testimonial.id}`, {
        is_published: !testimonial.is_published
      });
      loadTestimonials();
      toast.success(testimonial.is_published ? "Testimonial hidden" : "Testimonial published");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Check if a review is already converted into a testimonial
  const isReviewFeatured = (rev) => {
    return testimonials.some(t =>
      (t.content && rev.comment && t.content.trim().toLowerCase() === rev.comment.trim().toLowerCase()) ||
      (t.author_name && rev.customer_name && t.author_name.toLowerCase() === rev.customer_name.toLowerCase() && rev.comment && t.content?.includes(rev.comment.slice(0, 20)))
    );
  };

  // Filtered customer reviews
  const filteredReviews = customerReviews.filter(r => {
    const q = reviewSearch.toLowerCase();
    const matchSearch = !reviewSearch ||
      r.customer_name?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q) ||
      r.product?.name?.toLowerCase().includes(q);
    const matchRating = reviewRatingFilter === 0 || r.rating === reviewRatingFilter;
    return matchSearch && matchRating;
  });

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 dark:text-zinc-400 font-mono text-xs flex items-center justify-center gap-2">
        <Loader2 size={18} className="animate-spin text-fire" /> Loading testimonials...
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="font-display tracking-tight text-2xl font-black text-gray-900 dark:text-white">
          Storefront Testimonials
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium mt-0.5">
          Feature authentic customer reviews or create custom testimonials for your homepage
        </p>
      </div>

      {/* Creation Mode Switcher Card */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 dark:border-zinc-800 pb-4">
          <div>
            <h3 className="font-display font-black text-sm text-gray-900 dark:text-white">
              Add New Testimonial
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
              Choose to feature real user reviews or write a custom testimonial
            </p>
          </div>

          <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("reviews")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === "reviews"
                  ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-xs font-black"
                  : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <UserCheck size={14} />
              Select From User Reviews
              <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-300/40 dark:border-amber-800">
                {customerReviews.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === "manual"
                  ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-xs font-black"
                  : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Plus size={14} />
              Add Manually
            </button>
          </div>
        </div>

        {/* MODE 1: SELECT FROM USER REVIEWS */}
        {mode === "reviews" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search reviews by customer, product, or comment..."
                  value={reviewSearch}
                  onChange={e => setReviewSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-xs bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-fire"
                />
              </div>

              <select
                value={reviewRatingFilter}
                onChange={e => setReviewRatingFilter(Number(e.target.value))}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-xs font-bold bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-fire cursor-pointer"
              >
                <option value={0}>All Star Ratings</option>
                <option value={5}>⭐⭐⭐⭐⭐ 5 Stars Only</option>
                <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
                <option value={3}>⭐⭐⭐ 3 Stars</option>
              </select>
            </div>

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="p-8 text-center text-gray-400 dark:text-zinc-400 font-mono text-xs flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-fire" /> Loading customer reviews...
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl text-gray-500 dark:text-zinc-400 text-xs">
                No matching customer reviews found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredReviews.map(r => {
                  const alreadyFeatured = isReviewFeatured(r);
                  return (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/80 dark:bg-zinc-800/90 flex flex-col justify-between hover:border-gray-300 dark:hover:border-zinc-600 transition-colors shadow-2xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white text-xs block">
                              {r.customer_name || "Verified Customer"}
                            </span>
                            {r.product?.name && (
                              <p className="text-[10px] text-gray-600 dark:text-zinc-400 truncate max-w-[220px]">
                                on {r.product.name}
                              </p>
                            )}
                          </div>

                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                fill={i < (r.rating || 5) ? "currentColor" : "none"}
                                className={i < (r.rating || 5) ? "text-amber-400" : "text-gray-300 dark:text-zinc-600"}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Customer Review Text — High Contrast for Dark Mode */}
                        <p className="text-gray-900 dark:text-zinc-100 font-medium text-xs leading-relaxed mt-1 break-words">
                          "{r.comment || "Great sneaker purchase!"}"
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-200 dark:border-zinc-700 mt-2.5 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-gray-500 dark:text-zinc-400">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                        </span>

                        {alreadyFeatured ? (
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-2.5 py-1 rounded-md flex items-center gap-1 font-mono">
                            <Check size={12} /> Featured
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => featureReview(r)}
                            className="text-[11px] font-bold px-3 py-1 bg-black hover:bg-fire dark:bg-fire text-white rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Plus size={12} /> Feature as Testimonial
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODE 2: MANUAL FORM */}
        {mode === "manual" && (
          <form onSubmit={addManual} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Author Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zaid Malik"
                  value={f.author_name}
                  onChange={e => setF({ ...f, author_name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-fire"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Author Meta / Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified Customer • Lahore"
                  value={f.author_meta}
                  onChange={e => setF({ ...f, author_meta: e.target.value })}
                  className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-fire"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Star Rating
              </label>
              <select
                value={f.rating}
                onChange={e => setF({ ...f, rating: e.target.value })}
                className="w-full sm:w-48 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-bold bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-fire cursor-pointer"
              >
                <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                <option value="3">⭐⭐⭐ 3 Stars</option>
                <option value="2">⭐⭐ 2 Stars</option>
                <option value="1">⭐ 1 Star</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Testimonial Text *
              </label>
              <textarea
                placeholder="Write the customer quote or review..."
                value={f.content}
                onChange={e => setF({ ...f, content: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg p-3 text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-fire"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-black hover:bg-fire dark:bg-fire text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Saving Testimonial..." : "Add Testimonial"}
            </button>
          </form>
        )}
      </div>

      {/* ACTIVE TESTIMONIALS DISPLAY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-black text-base text-gray-900 dark:text-white">
              Active Storefront Testimonials
            </h3>
            <span className="text-xs font-mono font-bold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700">
              {testimonials.length}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-zinc-400">
            Visible on the homepage testimonials slider
          </span>
        </div>

        {testimonials.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-gray-300 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 text-xs">
            No testimonials yet. Use the selector above to feature real customer reviews or add custom ones!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map(t => (
              <div
                key={t.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                  t.is_published
                    ? "bg-white dark:bg-zinc-800/90 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-100"
                    : "bg-gray-50/70 dark:bg-zinc-900/60 border-dashed border-gray-300 dark:border-zinc-800 opacity-60 text-gray-600 dark:text-zinc-400"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < (t.rating || 5) ? "currentColor" : "none"}
                          className={i < (t.rating || 5) ? "text-amber-400" : "text-gray-300 dark:text-zinc-600"}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStatus(t)}
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        t.is_published
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                          : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 border border-gray-300 dark:border-zinc-700"
                      }`}
                    >
                      {t.is_published ? "Published" : "Hidden"}
                    </button>
                  </div>

                  <p className="text-gray-900 dark:text-zinc-100 text-xs leading-relaxed font-normal break-words">
                    "{t.content}"
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-zinc-700 mt-3 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-gray-900 dark:text-white">
                      {t.author_name}
                    </h5>
                    {t.author_meta && (
                      <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-mono">
                        {t.author_meta}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => del(t.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    title="Delete testimonial"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}
