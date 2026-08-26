/**
 * MOCK COURIER API INTEGRATION (e.g., Trax, Leopard, TCS)
 * In a real production environment, this file would make actual HTTP requests 
 * to the courier's REST API using axios/node-fetch.
 */

// Generate a random 12-digit tracking number (AWB)
const generateAWB = () => Math.floor(100000000000 + Math.random() * 900000000000).toString();

const courierService = {
  
  /**
   * Books a parcel with the courier and returns the Airway Bill (AWB) number.
   * @param {Object} order The order object from the database
   * @returns {Promise<Object>} The booking response containing the tracking number
   */
  async bookParcel(order) {
    console.log(`[COURIER API] Booking parcel for order ${order.order_number}...`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const awb = generateAWB();
    
    console.log(`[COURIER API] Successfully booked parcel. AWB: ${awb}`);
    
    return {
      success: true,
      awb,
      courier_name: "Trax Logistics",
      tracking_url: `https://trax.pk/tracking/?awb=${awb}`,
      estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    };
  }

};

module.exports = courierService;
