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
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (data.success) {
          newImageUrls.push(data.data.url);
        }
      }
      setImages(prev => [...prev, ...newImageUrls]);
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
        image_urls: images
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-obsidian/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-none border border-ink-200 p-6 sm:p-8 overflow-hidden z-10 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-ink-400 hover:text-obsidian"
            >
              <X size={20} />
            </button>

            <h2 className="font-display text-2xl font-bold tracking-tight mb-2">Write a Review</h2>
            <p className="text-sm text-ink-500 mb-6">Tell us what you think about the {product.name}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={(hoverRating || rating) >= star ? "fill-fire text-fire" : "text-ink-200"}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-ink-200 rounded-none p-3 font-display focus:border-fire outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1">Review (Optional)</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="w-full border border-ink-200 rounded-none p-3 font-display focus:border-fire outline-none transition-colors min-h-[100px] resize-none"
                  placeholder="How do they fit? Are they comfortable?"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1">Add Photos (Max 3)</label>
                <div className="flex gap-2">
                  {images.map((url, i) => (
                    <div key={i} className="relative h-16 w-16 border border-ink-200">
                      <img src={url} alt="upload preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  
                  {images.length < 3 && (
                    <label className="h-16 w-16 border-2 border-dashed border-ink-200 flex flex-col items-center justify-center cursor-pointer hover:border-fire hover:text-fire transition-colors group text-ink-400">
                      {uploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
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

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-obsidian text-white font-display font-bold py-4 rounded-none hover:bg-fire transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-wait"
              >
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
