const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const TOTAL_USERS = 500;

function randomPhone() {
  return "9" + Math.floor(100000000 + Math.random() * 900000000);
}

function randomEmail(i) {
  return `user${i}@example.com`;
}

function randomName() {
  const names = ["Raj", "Teja", "Arun", "Karthik", "Sai", "Rohit", "Anil"];
  return names[Math.floor(Math.random() * names.length)];
}

async function seedUsers() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected!");

  const users = [];

  for (let i = 0; i < TOTAL_USERS; i++) {
    users.push({
      phone: randomPhone(),
      firstName: randomName(),
      lastName: "User",
      email: randomEmail(i)
    });
  }

  await User.insertMany(users, { ordered: false });
  console.log(`Inserted ${TOTAL_USERS} users`);
  process.exit(0);
}

seedUsers();
