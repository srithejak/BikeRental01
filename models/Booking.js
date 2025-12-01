const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },

    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    startTime: String,
    endTime: String,

    location: { type: String, required: true, index: true },

    totalPrice: Number,

    status: { type: String, default: "confirmed" },
  },
  { timestamps: true }
);

// Compound index for faster conflict checks
bookingSchema.index({ vehicleId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("Booking", bookingSchema);

