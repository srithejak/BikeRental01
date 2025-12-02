const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  startDate: Date,
  endDate: Date,
  startTime: String,
  endTime: String,
  location: String
});

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    number: { type: String, unique: true, required: true, index: true },
    image: String,
    type: String,

    PricePerday: Number,
    includedKM: Number,
    totalPriceFor2Days: Number,
    includedKMFor2Days: Number,

    locations: [String],

    bookings: [bookingSchema],
  },
  { timestamps: true }
);

// Indexes for fast searches + bookings merging
vehicleSchema.index({ type: 1 });
vehicleSchema.index({ locations: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);



