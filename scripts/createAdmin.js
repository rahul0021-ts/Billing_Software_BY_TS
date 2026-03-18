require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

async function createAdmin() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error("Usage: node scripts/createAdmin.js <username> <password>");
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("Password must be at least 6 characters");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const existing = await User.findOne({ username: username.toLowerCase().trim() });

    if (existing) {
      existing.password = password;
      existing.isActive = true;
      await existing.save();
      console.log(`Admin updated: ${existing.username}`);
    } else {
      const user = await User.create({
        username: username.toLowerCase().trim(),
        password,
        role: "admin",
      });
      console.log(`Admin created: ${user.username}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

createAdmin();