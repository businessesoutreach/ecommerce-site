const axios = require('axios');

/**
 * TCS COURIER API INTEGRATION
 * Uses standard TCS Envio API to book parcels.
 * Ensure TCS environment variables are set in .env
 */

const courierService = {
  
  /**
   * Books a parcel with TCS and returns the Airway Bill (AWB) number.
   * @param {Object} order The order object from the database
   * @returns {Promise<Object>} The booking response containing the tracking number
   */
  async bookParcel(order) {
    console.log(`[TCS API] Booking parcel for order ${order.order_number}...`);
    
    // Check if API keys are configured (fallback to mock if missing for dev)
    if (!process.env.TCS_CLIENT_ID || !process.env.TCS_USERNAME || !process.env.TCS_PASSWORD) {
      console.warn("[TCS API] Missing TCS API credentials in .env. Falling back to mock tracking.");
      const mockAwb = Math.floor(100000000000 + Math.random() * 900000000000).toString();
      return {
        success: true,
        awb: mockAwb,
        courier_name: "TCS (Mock)",
        tracking_url: `https://www.tcsexpress.com/tracking?tracking_number=${mockAwb}`,
        estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    try {
      const apiUrl = process.env.TCS_API_URL || "https://api.tcscourier.com/production/v1";
      
      // Calculate total weight (rough estimate: 1kg per 2 pairs, default 1kg)
      const pieces = order.items ? order.items.length : 1;
      const weight = Math.max(1, Math.ceil(pieces / 2));
      
      // COD amount is only sent if the payment method is COD
      const codAmount = order.payment_method === 'COD' ? order.total : 0;
      
      const payload = {
        userName: process.env.TCS_USERNAME,
        password: process.env.TCS_PASSWORD,
        costCenterCode: process.env.TCS_COST_CENTER,
        consigneeName: order.customer_name,
        consigneeAddress: order.shipping_address?.address_l1 || "No Address Provided",
        consigneeMobNo: order.customer_phone,
        consigneeEmail: order.customer_email || "",
        originCityName: "Karachi", // Replace with your actual warehouse city
        destinationCityName: order.shipping_address?.city || "Unknown City",
        weight: weight,
        pieces: pieces,
        codAmount: codAmount,
        customerReferenceNo: order.order_number,
        services: "O", // Overnight standard
        productDetails: "Sneakers/Footwear",
        fragile: "No",
        remarks: order.customer_note || ""
      };

      const response = await axios.post(`${apiUrl}/cod/createOrder`, payload, {
        headers: {
          'X-IBM-Client-Id': process.env.TCS_CLIENT_ID,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;

      // Check if TCS accepted the order (TCS usually returns '00' for success)
      if (data && data.returnStatus === '00' && data.bookingReply) {
        const awb = data.bookingReply[0].consignmentNumber;
        
        console.log(`[TCS API] Successfully booked parcel. AWB: ${awb}`);
        
        return {
          success: true,
          awb,
          courier_name: "TCS",
          tracking_url: `https://www.tcsexpress.com/tracking?tracking_number=${awb}`,
          estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        };
      } else {
        throw new Error(`TCS API Error: ${data.returnMessage || JSON.stringify(data)}`);
      }

    } catch (error) {
      console.error(`[TCS API] Failed to book parcel for ${order.order_number}:`, error.message);
      
      // Instead of failing the entire operation, you can choose to return false or throw
      // so the admin knows the booking failed.
      throw new Error(`Courier booking failed: ${error.message}`);
    }
  }

};

module.exports = courierService;
