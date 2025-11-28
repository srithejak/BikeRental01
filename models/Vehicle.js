
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    startDate: Date,
    endDate: Date,
    location: String
});

const vehicleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    number: { type: String, unique: true, required: true },
    image: String,
    type: String,

    // IMPORTANT: Must match vehicles.js EXACT NAME
    PricePerday: Number,

    includedKM: Number,
    totalPriceFor2Days: Number,
    includedKMFor2Days: Number,

    locations: [String],

    bookings: [bookingSchema]
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
