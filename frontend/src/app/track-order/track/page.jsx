"use client";

import { useState } from "react";
import { Search, Package, Truck, CheckCircle, Clock } from "lucide-react";
import axios from "axios";
import { format } from "date-fns";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trackData, setTrackData] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderNumber) return;
    
    setLoading(true);
    setError(null);
    setTrackData(null);
    
    try {
      // Assuming API endpoint handles 'PK-SNK-...' properly
      let query = orderNumber.trim();
      if (!query.startsWith('PK-SNK-')) {
        query = `PK-SNK-${query}`;
      }

      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/orders/track/status/${query}`);
      setTrackData(res.data.data);
    } catch (err) {
      setError("Order not found. Please check your order number and try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'placed': return <Clock className="w-8 h-8 text-blue-500" />;
      case 'packed': return <Package className="w-8 h-8 text-indigo-500" />;
      case 'shipped': 
      case 'out_for_delivery': return <Truck className="w-8 h-8 text-orange-500" />;
      case 'delivered': return <CheckCircle className="w-8 h-8 text-green-500" />;
      default: return <Clock className="w-8 h-8 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-center mb-4 uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">
          Track Your Order
        </h1>
        <p className="text-neutral-400 text-center mb-10 max-w-lg mx-auto">
          Enter your order number below to get real-time delivery updates from our warehouse directly to your doorstep.
        </p>

        <form onSubmit={handleTrack} className="flex gap-2 max-w-lg mx-auto mb-12 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
          <input
            type="text"
            placeholder="e.g. PK-SNK-12345"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-full py-4 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500 transition-colors"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Searching..." : "Track"}
          </button>
        </form>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-center mb-8">
            {error}
          </div>
        )}

        {trackData && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-6 mb-8 gap-4">
              <div>
                <p className="text-neutral-400 text-sm mb-1">Order Number</p>
                <h2 className="text-2xl font-bold">{trackData.order_number}</h2>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-neutral-400 text-sm mb-1">Placed On</p>
                <p className="font-medium">{format(new Date(trackData.created_at), 'PPP')}</p>
              </div>
            </div>

            {/* Current Status Highlight */}
            <div className="flex items-center gap-6 mb-12 bg-neutral-950 p-6 rounded-2xl border border-neutral-800">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center shrink-0 border border-neutral-700">
                {getStatusIcon(trackData.status)}
              </div>
              <div>
                <h3 className="text-xl font-bold capitalize mb-1">
                  {trackData.live_tracking?.status || trackData.status.replace(/_/g, ' ')}
                </h3>
                {trackData.tracking_number ? (
                  <p className="text-neutral-400 text-sm">
                    Shipped via <span className="text-white font-medium">{trackData.courier_name}</span>. 
                    Tracking: <span className="text-orange-400 font-medium">{trackData.tracking_number}</span>
                  </p>
                ) : (
                  <p className="text-neutral-400 text-sm">We are preparing your order.</p>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="relative pl-4 sm:pl-8 border-l-2 border-neutral-800 ml-4 space-y-8">
              {/* TCS Live Tracking History */}
              {trackData.live_tracking?.history?.map((event, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] sm:-left-[37px] top-1 w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                  <div className="mb-1">
                    <span className="font-bold text-lg text-white">{event.status}</span>
                  </div>
                  <p className="text-neutral-400 text-sm">
                    {event.location} • {event.date}
                  </p>
                </div>
              ))}

              {/* Internal Order History */}
              {trackData.internal_history?.map((hist, idx) => {
                // If we have TCS history, we dim internal history visually
                const isOlder = trackData.live_tracking?.history?.length > 0;
                return (
                  <div key={idx} className={`relative ${isOlder ? 'opacity-50' : ''}`}>
                    <div className="absolute -left-[21px] sm:-left-[37px] top-1 w-4 h-4 rounded-full bg-neutral-700" />
                    <div className="mb-1">
                      <span className="font-bold text-lg text-white capitalize">{hist.status.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-neutral-400 text-sm">
                      {hist.note} • {format(new Date(hist.at), 'PP p')}
                    </p>
                  </div>
                );
              }).reverse()}
            </div>
            
            {/* Products in this order */}
            <div className="mt-12 pt-8 border-t border-neutral-800">
              <h3 className="font-bold mb-4 text-neutral-300">Items in Order</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trackData.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg bg-neutral-900" />
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                      <p className="text-neutral-400 text-xs mt-1">EU Size: {item.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
