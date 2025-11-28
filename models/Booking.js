const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Vehicle reference
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },

    // Dates + Time
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },

    // Other fields
    location: { type: String, required: true },
    totalPrice: { type: Number, required: true },

    // Booking state
    status: { type: String, default: "confirmed" },
  },

  // ⬅️ This automatically generates createdAt + updatedAt
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
