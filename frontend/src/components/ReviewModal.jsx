import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, UploadCloud, Loader2 } from "lucide-react";
import { http } from "../lib/api";
import { toast } from "sonner";

export default function ReviewModal({ open, onClose, product, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (images.length + files.length > 3) {
      return toast.error("You can only upload up to 3 images");
    }

    setUploading(true);
    try {
      const newImageUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await http.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (data.success) {
          newImageUrls.push(data.data.url);
        }
      }
      setImages((prev) => [...prev, ...newImageUrls]);
      toast.success("Images uploaded successfully!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error("Please select a rating");
    if (!name.trim()) return toast.error("Please enter your name");

    setSubmitting(true);
    try {
      await http.post(`/products/${product.id}/reviews`, {
        customer_name: name,
        rating,
        comment,
        image_urls: images,
      });
      toast.success("Review submitted! It will appear once approved.");
      onReviewSubmitted();
      onClose();
    } catch (err) {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-obsidian/70 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white w-full max-w-lg rounded-none border border-ink-200 z-10 shadow-2xl my-auto flex flex-col max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-3.5rem)] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 pb-3 sm:pb-4 border-b border-ink-100 flex items-start justify-between bg-white shrink-0">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-obsidian">
                  Write a Review
                </h2>
                {product?.name && (
                  <p className="text-xs sm:text-sm text-ink-500 mt-0.5 line-clamp-1">
                    {product.name}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-ink-400 hover:text-obsidian p-1 rounded-none hover:bg-ink-100 transition-colors ml-3 shrink-0"
                aria-label="Close review modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star Rating */}
                <div className="flex flex-col items-center justify-center py-2.5 bg-ink-50/60 border border-ink-100">
                  <span className="text-[10px] font-mono text-ink-500 uppercase tracking-wider mb-1 font-bold">
                    Tap to rate
                  </span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none transition-transform hover:scale-115 active:scale-95 p-1"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          size={26}
                          className={
                            (hoverRating || rating) >= star
                              ? "fill-fire text-fire"
                              : "text-ink-300"
                          }
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <span className="text-xs font-mono font-bold text-obsidian mt-1">
                      {rating === 5
                        ? "⭐⭐⭐⭐⭐ Outstanding"
                        : rating === 4
                        ? "⭐⭐⭐⭐ Great"
                        : rating === 3
                        ? "⭐⭐⭐ Good"
                        : rating === 2
                        ? "⭐⭐ Fair"
                        : "⭐ Poor"}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-600 mb-1">
                    Your Name <span className="text-fire">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-ink-200 rounded-none px-3.5 py-2.5 text-sm font-display focus:border-fire outline-none transition-colors"
                    placeholder="e.g. Ali Khan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-600 mb-1">
                    Review (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="w-full border border-ink-200 rounded-none px-3.5 py-2.5 text-sm font-display focus:border-fire outline-none transition-colors resize-none"
                    placeholder="How do they fit? Comfort, sizing, material quality..."
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-bold text-ink-600 mb-1">
                    Add Photos <span className="text-ink-400 font-normal">(Max 3)</span>
                  </label>
                  <div className="flex gap-2.5 items-center flex-wrap">
                    {images.map((url, i) => (
                      <div key={i} className="relative h-16 w-16 border border-ink-200 bg-ink-50">
                        <img
                          src={url}
                          alt="upload preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 bg-obsidian text-white rounded-full p-1 hover:bg-fire transition-colors shadow-sm"
                          title="Remove image"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}

                    {images.length < 3 && (
                      <label className="h-16 w-16 border-2 border-dashed border-ink-300 hover:border-fire flex flex-col items-center justify-center cursor-pointer transition-colors group text-ink-400 hover:text-fire bg-white">
                        {uploading ? (
                          <Loader2 size={18} className="animate-spin text-fire" />
                        ) : (
                          <>
                            <UploadCloud
                              size={18}
                              className="group-hover:scale-110 transition-transform"
                            />
                            <span className="text-[9px] font-mono mt-1 font-bold">ADD</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-obsidian text-white font-display font-bold py-3 px-4 rounded-none hover:bg-fire transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait text-sm tracking-wide shadow-sm"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
