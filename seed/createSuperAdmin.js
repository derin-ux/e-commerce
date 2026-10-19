require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const createSuperAdmin = async () => {
  const { SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } =
    process.env;

  if (!SUPER_ADMIN_NAME || !SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    console.error("Missing SUPER_ADMIN_* values in .env");
    process.exit(1);
  }

  await connectDB();

  try {
    const existing = await User.findOne({ role: "superAdmin" });

    if (existing) {
      console.log(`A super admin already exists: ${existing.email}`);
    } else {
      await User.create({
        name: SUPER_ADMIN_NAME,
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        role: "superAdmin",
      });
      console.log(`Super admin created: ${SUPER_ADMIN_EMAIL}`);
    }
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
  } finally {
    await mongoose.disconnect();
  }
};

createSuperAdmin();