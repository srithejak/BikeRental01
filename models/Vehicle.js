const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  startDate: Date,
  endDate: Date,
  location: String
});

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    number: { type: String, unique: true, required: true }, // Unique vehicle number

    image: String,
    type: String,

    PricePerday: Number,
    includedKM: Number,
    totalPriceFor2Days: Number,
    includedKMFor2Days: Number,

    locations: [String],

    bookings: [bookingSchema]
  },
  { timestamps: true }
);

/* ------------------------------------------
   🔥 PERFORMANCE INDEXES
-------------------------------------------- */

// Fast search by location
vehicleSchema.index({ locations: 1 });

// Ensures vehicle numbers are unique and searchable
vehicleSchema.index({ number: 1 }, { unique: true });

// If you ever filter by type (bike/scooter)
vehicleSchema.index({ type: 1 });

// To optimize availability check queries
vehicleSchema.index({ "bookings.startDate": 1, "bookings.endDate": 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);

