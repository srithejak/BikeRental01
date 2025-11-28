const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// ------------------------------
// SEND OTP
// ------------------------------
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number required" });

  try {
    const response = await axios.get(
      `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${phone}/AUTOGEN`
    );

    if (response.data.Status !== "Success") {
      return res.status(500).json({ error: "Failed to send OTP" });
    }

    res.json({ sessionId: response.data.Details });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

// ------------------------------
// VERIFY OTP
// ------------------------------
router.post("/verify-otp", async (req, res) => {
  const { sessionId, otp, phone } = req.body;

  if (!sessionId || !otp || !phone)
    return res.status(400).json({ error: "Missing Fields" });

  try {
    const response = await axios.get(
      `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`
    );

    if (response.data.Status !== "Success") {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({ phone });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------------
// AUTH MIDDLEWARE
// ------------------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

// ------------------------------
// COMPLETE PROFILE
// ------------------------------
router.post("/complete-profile", authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { firstName, lastName, email },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
