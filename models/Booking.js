const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },

    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },

    startTime: { type: String, required: true },
    endTime: { type: String, required: true },

    location: { type: String, required: true, index: true },

    totalPrice: { type: Number, required: true },

    status: { type: String, default: "confirmed" }
  },
  { timestamps: true }
);

// Compound index for fast conflict checks + read queries
bookingSchema.index({ vehicleId: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);


