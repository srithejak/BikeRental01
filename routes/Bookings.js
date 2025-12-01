const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");

// -------------------------------------------
// AUTH MIDDLEWARE (supports TEST_MODE)
// -------------------------------------------
const authenticateToken = (req, res, next) => {
  if (process.env.TEST_MODE === "true") {
    req.userId = "67432d1b3fd4d34abcd11111"; // Test user
    return next();
  }

  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

// -------------------------------------------
// CREATE BOOKING (fast + lean)
// -------------------------------------------
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
      !location
    ) {
      return res.status(400).json({ error: "Missing fields" });
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
    });

    await Vehicle.findByIdAndUpdate(vehicleId, {
      $push: {
        bookings: {
          startDate: startDT,
          endDate: endDT,
          location,
        },
      },
    });

    return res.json({ message: "Booking Created", booking });
  } catch (error) {
    console.error("Booking error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------------
// GET MY BOOKINGS (FINAL VERSION)
// -------------------------------------------
router.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find(
      { userId: req.userId },
      {
        startDate: 1,
        endDate: 1,
        startTime: 1,
        endTime: 1,
        location: 1,
        totalPrice: 1,
        status: 1,
        vehicleId: 1,
      }
    )
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({ count: bookings.length, bookings });
  } catch (err) {
    console.error("My bookings error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;


