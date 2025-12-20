const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/Bookings");

const Vehicle = require("./models/Vehicle");
const Booking = require("./models/Booking");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Bike Rental API is running 🚀");
});

// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ DB Error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);

/* --------------------------------------------------
   VEHICLE SEARCH
-------------------------------------------------- */
app.post("/api/vehicles/search", async (req, res) => {
  const { startDate, endDate, startTime, endTime } = req.body;

  if (!startDate || !endDate || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing fields" });
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
      return res.status(400).json({ error: "End must be after start" });
    }

    const startDateTime = startDT.toDate();
    const endDateTime = endDT.toDate();
    const durationDays =
      (endDateTime - startDateTime) / (1000 * 60 * 60 * 24);

    const allVehicles = await Vehicle.find();
    const bookings = await Booking.find({
      startDate: { $lt: endDateTime },
      endDate: { $gt: startDateTime },
    });

    const results = allVehicles.map((vehicle) => {
      const availability = vehicle.locations.reduce((acc, loc) => {
        const isBooked = bookings.some(
          (b) =>
            b.vehicleId?.toString() === vehicle._id.toString() &&
            b.location === loc &&
            b.startDate < endDateTime &&
            b.endDate > startDateTime
        );
        acc[loc] = !isBooked;
        return acc;
      }, {});

      return {
        ...vehicle.toObject(),
        calculatedPrice: Math.ceil(durationDays * vehicle.PricePerday),
        calculatedIncludedKm: Math.ceil(durationDays * vehicle.includedKM),
        durationDays,
        availability,
      };
    });

    res.json(results);
  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* --------------------------------------------------
   START SERVER
-------------------------------------------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
