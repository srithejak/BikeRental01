const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");

/* --------------------------------------------------
   AUTH MIDDLEWARE (Production)
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

    if (!vehicleId || !startDate || !startTime || !endDate || !endTime || !location || !totalPrice) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const startDT = new Date(`${startDate} ${startTime}`);
    const endDT = new Date(`${endDate} ${endTime}`);

    // Create booking
    let booking = await Booking.create({
      userId: req.userId,
      vehicleId,
      startDate: startDT,
      startTime,
      endDate: endDT,
      endTime,
      location,
      totalPrice,
      status: "confirmed",
    });

    // Attach booking to vehicle
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

    // Populate vehicle details
    booking = await Booking.findById(booking._id).populate(
      "vehicleId",
      "name image type number PricePerday includedKM"
    );

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
   GET BOOKINGS FOR LOGGED-IN USER (Production)
-------------------------------------------------- */
router.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.userId })
      .populate({
        path: "vehicleId",
        select: "name image type number PricePerday includedKM",
      })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ bookings });
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;



