const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");

dotenv.config();

const TOTAL = 1000000;
const BATCH = 2000;

const LOCATIONS = [
  "Adajan", "Vesu", "Piplod", "Rander", "City Light",
  "Nanpura", "Udhna", "Katargam", "Dindoli"
];

const START_TIMES = ["08:00 AM", "09:00 AM", "10:00 AM"];
const END_TIMES = ["05:00 PM", "06:00 PM", "07:00 PM"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedBookings() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected!");

  const vehicles = await Vehicle.find({}, "_id");
  const users = await User.find({}, "_id");
  if (!vehicles.length || !users.length) {
    console.log("Seed users and vehicles first!");
    process.exit(1);
  }

  for (let i = 0; i < TOTAL; i += BATCH) {
    let batch = [];

    for (let j = 0; j < BATCH && i + j < TOTAL; j++) {
      const start = new Date();
      start.setDate(start.getDate() - Math.floor(Math.random() * 365));

      const end = new Date(start);
      end.setDate(start.getDate() + (1 + Math.floor(Math.random() * 5)));

      batch.push({
        userId: pick(users)._id,
        vehicleId: pick(vehicles)._id,
        startDate: start,
        endDate: end,
        startTime: pick(START_TIMES),
        endTime: pick(END_TIMES),
        location: pick(LOCATIONS),
        totalPrice: 400 + Math.floor(Math.random() * 1500),
        status: "confirmed"
      });
    }

    await Booking.insertMany(batch, { ordered: false });
    console.log(`Inserted ${i + BATCH} / ${TOTAL}`);
  }

  console.log("DONE inserting 1 million bookings.");
  process.exit(0);
}

seedBookings();
