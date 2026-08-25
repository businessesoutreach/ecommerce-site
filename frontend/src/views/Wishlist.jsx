import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useStore } from "../context/StoreContext";
import ProductCard from "../components/ProductCard";
import { EmptyState } from "../components/common";

export default function Wishlist() {
  const { wishlist } = useStore();
  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-10 min-h-[60vh]">
      <h1 className="font-display tracking-tight mb-8">Wishlist <span className="text-fire">({wishlist.items.length})</span></h1>
      {wishlist.items.length === 0 ? (
        <EmptyState icon={Heart} title="No saved kicks yet" subtitle="Tap the heart on any product to stash it here." action={<Link to="/new-arrivals" className="bg-obsidian text-white font-display px-8 py-4 rounded-none">Discover Kicks</Link>} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlist.items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
