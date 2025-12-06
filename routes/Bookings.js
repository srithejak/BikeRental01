const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");

const NodeCache = require("node-cache");
const bookingsCache = new NodeCache({ stdTTL: 30, checkperiod: 60 });

/* --------------------------------------------------
   AUTH MIDDLEWARE (with TEST_MODE bypass)
-------------------------------------------------- */
const authenticateToken = (req, res, next) => {
  if (process.env.TEST_MODE === "true") {
    // Fixed dummy user for load tests
    req.userId = process.env.TEST_USER_ID;
    return next();
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

/* --------------------------------------------------
   CREATE BOOKING (same as before)
-------------------------------------------------- */
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const {
      vehicleId,
      startDate,
      startTime,
      endDate,
      endTime,
      location,
      totalPrice,
    } = req.body;

    if (!vehicleId || !startDate || !startTime || !endDate || !endTime || !location || !totalPrice) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const startDT = new Date(`${startDate} ${startTime}`);
    const endDT = new Date(`${endDate} ${endTime}`);

    let booking = await Booking.create({
      userId: req.userId,
      vehicleId,
      startDate: startDT,
      endDate: endDT,
      startTime,
      endTime,
      location,
      totalPrice,
      status: "confirmed",
    });

    await Vehicle.findByIdAndUpdate(vehicleId, {
      $push: {
        bookings: {
          startDate: startDT,
          endDate: endDT,
          startTime,
          endTime,
          location,
        },
      },
    });

    // ❗ Invalidate cache for the user
    bookingsCache.del(`bookings_${req.userId}`);

    return res.json({
      message: "Booking Created Successfully",
      booking,
    });
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

/* --------------------------------------------------
   GET BOOKINGS FOR LOGGED-IN USER (Optimized)
   - Caching enabled
   - Manual vehicle map (no populate)
-------------------------------------------------- */
router.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const cacheKey = `bookings_${req.userId}`;

    // 1️⃣ Check Cache First
    const cached = bookingsCache.get(cacheKey);
    if (cached) {
      return res.json({ fromCache: true, bookings: cached });
    }

    // 2️⃣ Fetch lightweight bookings
    let bookings = await Booking.find(
      { userId: req.userId },
      {
        vehicleId: 1,
        startDate: 1,
        endDate: 1,
        startTime: 1,
        endTime: 1,
        location: 1,
        totalPrice: 1,
        status: 1,
        createdAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // 3️⃣ Build a vehicle lookup map
    const vehicles = await Vehicle.find(
      {},
      "name image type number PricePerday includedKM"
    ).lean();

    const vehicleMap = {};
    vehicles.forEach(v => (vehicleMap[v._id] = v));

    // 4️⃣ Attach vehicle details manually
    bookings = bookings.map(b => ({
      ...b,
      vehicle: vehicleMap[b.vehicleId] || null,
    }));

    // 5️⃣ Save to cache
    bookingsCache.set(cacheKey, bookings);

    return res.json({ fromCache: false, bookings });
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;





