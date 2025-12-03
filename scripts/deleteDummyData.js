const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");

dotenv.config();

async function cleanup() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected!");

  await Booking.deleteMany({});
  console.log("Deleted all bookings");

  await User.deleteMany({});
  console.log("Deleted all users");

  await Vehicle.deleteMany({});
  console.log("Deleted all vehicles");

  process.exit(0);
}

cleanup();
