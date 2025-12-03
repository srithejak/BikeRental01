const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Vehicle = require("../models/Vehicle");
const baseVehicles = require("../vehicles");

dotenv.config();

const TARGET = 2000;

async function seedVehicles() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected!");

  const count = await Vehicle.countDocuments();

  if (count >= TARGET) {
    console.log("Already enough vehicles.");
    process.exit(0);
  }

  const needed = TARGET - count;

  const vehicles = [];
  for (let i = 0; i < needed; i++) {
    const base = baseVehicles[i % baseVehicles.length];

    vehicles.push({
      ...base,
      number: base.number + "_CLONE_" + i,
      name: base.name + " #" + i
    });
  }

  await Vehicle.insertMany(vehicles, { ordered: false });
  console.log(`Inserted ${vehicles.length} vehicles`);
  process.exit(0);
}

seedVehicles();
