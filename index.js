const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/Bookings");
const vehiclesData = require("./vehicles");
const Vehicle = require("./models/Vehicle");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Bike Rental API is running 🚀");
});

// -----------------------------
// MongoDB Connection
// -----------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// -----------------------------
// Routes
// -----------------------------
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);

// -----------------------------
// Vehicle Search
// -----------------------------
app.post("/api/vehicles/search", async (req, res) => {
  try {
    const { startDate, endDate, startTime, endTime } = req.body;

    if (!startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing date/time" });
    }

    const dayjs = require("dayjs");
    require("dayjs/plugin/customParseFormat");
    require("dayjs/plugin/isSameOrBefore");

    const startDT = dayjs(`${startDate} ${startTime}`, "YYYY-MM-DD hh:mm A");
    const endDT = dayjs(`${endDate} ${endTime}`, "YYYY-MM-DD hh:mm A");

    if (!startDT.isValid() || !endDT.isValid()) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (endDT.isSameOrBefore(startDT)) {
      return res.status(400).json({ error: "End date must be after start" });
    }

    const startDateTime = startDT.toDate();
    const endDateTime = endDT.toDate();

    const durationDays =
      (endDateTime - startDateTime) / (1000 * 60 * 60 * 24);

    // Query once — optimized
    const allVehicles = await Vehicle.find({}, null, { lean: true });

    const bookings = await mongoose.model("Booking").find(
      {
        startDate: { $lt: endDateTime },
        endDate: { $gt: startDateTime },
      },
      { vehicleId: 1, location: 1, startDate: 1, endDate: 1 },
      { lean: true }
    );

    const results = allVehicles.map((vehicle) => {
      const availability = {};
      vehicle.locations.forEach((loc) => {
        const isBooked = bookings.some(
          (b) =>
            b.vehicleId?.toString() === vehicle._id.toString() &&
            b.location === loc
        );
        availability[loc] = !isBooked;
      });

      return {
        ...vehicle,
        calculatedPrice: Math.ceil(durationDays * vehicle.PricePerday),
        calculatedIncludedKm: Math.ceil(durationDays * vehicle.includedKM),
        durationDays,
        availability,
      };
    });

    return res.json(results);
  } catch (err) {
    console.error("❌ Vehicle search error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
});

// -----------------------------
// Seed Vehicles (runs once)
// -----------------------------
const seedVehicles = async () => {
  try {
    const existing = await Vehicle.distinct("number");
    const newVehicles = vehiclesData.filter(
      (v) => !existing.includes(v.number)
    );

    if (newVehicles.length > 0) {
      await Vehicle.insertMany(newVehicles, { ordered: false });
      console.log(`🚀 Seeded ${newVehicles.length} new vehicles`);
    } else {
      console.log("Seed: no new vehicles");
    }
  } catch (err) {
    console.error("Seed error:", err);
  }
};
seedVehicles();

// -----------------------------
// Create Indexes (performance)
// -----------------------------
(async () => {
  console.log("📌 Creating MongoDB indexes...");

  try {
    await mongoose.model("Booking").createIndexes();
    await mongoose.model("Vehicle").createIndexes();
    console.log("✅ Indexes created successfully!");
  } catch (err) {
    console.error("❌ Index creation error:", err);
  }
})();

// -----------------------------
// Start Server
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
