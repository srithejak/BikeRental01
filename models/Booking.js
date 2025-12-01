const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    startTime: { type: String, required: true },
    endTime: { type: String, required: true },

    location: { type: String, required: true },
    totalPrice: { type: Number, required: true },

    status: { type: String, default: "confirmed" },
  },
  { timestamps: true }
);

/* ------------------------------------------
   🔥 PERFORMANCE INDEXES
-------------------------------------------- */

// Fast lookup by user (My Bookings API)
bookingSchema.index({ userId: 1, createdAt: -1 });

// Fast search for overlapping bookings
bookingSchema.index({ vehicleId: 1, startDate: 1, endDate: 1 });

// Improve "filter by location" queries
bookingSchema.index({ location: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
