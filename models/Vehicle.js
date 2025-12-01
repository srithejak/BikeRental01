const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  name: String,
  number: { type: String, unique: true },
  image: String,
  type: String,
  PricePerday: Number,
  includedKM: Number,
  totalPriceFor2Days: Number,
  includedKMFor2Days: Number,
  locations: [String],
});

// Important indexes
vehicleSchema.index({ number: 1 }, { unique: true });
vehicleSchema.index({ type: 1 });
vehicleSchema.index({ locations: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);


