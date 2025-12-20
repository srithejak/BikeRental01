const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");

const NodeCache = require("node-cache");
const bookingsCache = new NodeCache({
  stdTTL: 30,       // cache for 30 seconds
  checkperiod: 60,  // cleanup every 60 seconds
});

/* --------------------------------------------------
   AUTH MIDDLEWARE (PRODUCTION ONLY)
-------------------------------------------------- */
const authenticateToken = (req, res, next) => {
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
   CREATE BOOKING
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

    if (
      !vehicleId ||
      !startDate ||
      !startTime ||
      !endDate ||
      !endTime ||
      !location ||
      !totalPrice
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const startDT = new Date(`${startDate} ${startTime}`);
    const endDT = new Date(`${endDate} ${endTime}`);

    const booking = await Booking.create({
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

    // Attach booking snapshot to vehicle
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

    // 🔥 Invalidate cache for this user
    bookingsCache.del(`bookings_${req.userId}`);

    return res.json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

/* --------------------------------------------------
   GET MY BOOKINGS (OPTIMIZED + CACHED)
-------------------------------------------------- */
router.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const cacheKey = `bookings_${req.userId}`;

    // 1️⃣ Check cache
    const cachedBookings = bookingsCache.get(cacheKey);
    if (cachedBookings) {
      return res.json({
        fromCache: true,
        bookings: cachedBookings,
      });
    }

    // 2️⃣ Fetch bookings (lightweight query)
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

    // 3️⃣ Fetch vehicle data once
    const vehicles = await Vehicle.find(
      {},
      "name image type number PricePerday includedKM"
    ).lean();

    const vehicleMap = {};
    vehicles.forEach((v) => {
      vehicleMap[v._id.toString()] = v;
    });

    // 4️⃣ Attach vehicle info manually
    bookings = bookings.map((b) => ({
      ...b,
      vehicle: vehicleMap[b.vehicleId?.toString()] || null,
    }));

    // 5️⃣ Store in cache
    bookingsCache.set(cacheKey, bookings);

    return res.json({
      fromCache: false,
      bookings,
    });
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;






