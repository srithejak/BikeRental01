const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const vehiclesData = require("./vehicles");
const Vehicle = require("./models/Vehicle");
const Booking = require("./models/Booking");
const bookingRoutes = require("./routes/Bookings");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------------
// HEALTH CHECK
// -------------------------------------
app.get("/", (req, res) => {
  res.send("Bike Rental API is running 🚀");
});

// -------------------------------------
// MONGO CONNECTION
// -------------------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection Error:", err));

// -------------------------------------
// ROUTES
// -------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);

// -------------------------------------
// SEARCH VEHICLES API (Optimized)
// -------------------------------------
app.post("/api/vehicles/search", async (req, res) => {
  const { startDate, endDate, startTime, endTime } = req.body;

  if (!startDate || !endDate || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const dayjs = require("dayjs");
    const customParseFormat = require("dayjs/plugin/customParseFormat");
    const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
    dayjs.extend(customParseFormat);
    dayjs.extend(isSameOrBefore);

    const startDT = dayjs(`${startDate} ${startTime}`, "YYYY-MM-DD hh:mm A");
    const endDT = dayjs(`${endDate} ${endTime}`, "YYYY-MM-DD hh:mm A");

    if (!startDT.isValid() || !endDT.isValid()) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (endDT.isSameOrBefore(startDT)) {
      return res.status(400).json({
        error: "End datetime must be after start datetime",
      });
    }

    const startDateTime = startDT.toDate();
    const endDateTime = endDT.toDate();

    const durationMs = endDateTime - startDateTime;
    const durationDays = durationMs / (1000 * 60 * 60 * 24);

    // 🚀 Optimized DB calls
    const allVehicles = await Vehicle.find().lean();

    // Indexed search: only fetch overlapping bookings
    const bookings = await Booking.find(
      {
        startDate: { $lt: endDateTime },
        endDate: { $gt: startDateTime },
      },
      { vehicleId: 1, startDate: 1, endDate: 1, location: 1 }
    ).lean();

    const results = allVehicles.map((vehicle) => {
      const totalPrice = Math.ceil(durationDays * vehicle.PricePerday);
      const totalIncludedKm = Math.ceil(durationDays * vehicle.includedKM);

      // Build availability map
      const availability = vehicle.locations.reduce((acc, loc) => {
        const isBooked = bookings.some(
          (bk) =>
            bk.vehicleId?.toString() === vehicle._id.toString() &&
            bk.location === loc &&
            bk.startDate < endDateTime &&
            bk.endDate > startDateTime
        );
        acc[loc] = !isBooked;
        return acc;
      }, {});

      return {
        ...vehicle,
        calculatedPrice: totalPrice,
        calculatedIncludedKm: totalIncludedKm,
        durationDays,
        availability,
      };
    });

    return res.json(results);
  } catch (err) {
    console.error("❌ Error in /api/vehicles/search:", err);
    return res.status(500).json({ error: "Server Error" });
  }
});

// -------------------------------------
// SEED VEHICLES (RUN ONCE)
// -------------------------------------
const seedVehicles = async () => {
  try {
    const existingNumbers = await Vehicle.distinct("number");
    const newVehicles = vehiclesData.filter(
      (v) => !existingNumbers.includes(v.number)
    );

    if (newVehicles.length > 0) {
      const created = await Vehicle.insertMany(newVehicles, {
        ordered: false,
      });
      console.log(`Seeded Vehicles: ${created.length} added`);
    } else {
      console.log("No new vehicles to seed.");
    }
  } catch (err) {
    if (err.code === 11000) {
      console.log("Duplicate vehicle number detected.");
    } else {
      console.error("Error seeding vehicles:", err);
    }
  }
};

seedVehicles();

// -------------------------------------
// START SERVER
// -------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
