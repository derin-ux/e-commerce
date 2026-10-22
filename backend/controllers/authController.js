const jwt = require("jsonwebtoken");
const User = require("../models/User"); // adjust to your actual path

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // Public signup can only create customers or shop owners.
    // Admins never come from this route.
    const allowedRoles = ["customer", "shopOwner"];
    const safeRole = allowedRoles.includes(role) ? role : "customer";

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // The model's pre("save") hook hashes the password
    const user = await User.create({ name, email, password, role: safeRole });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // password is select: false in the model, so we must ask for it
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    const valid = user && (await user.comparePassword(password));

    // Same message for both failures so attackers can't probe which emails exist
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated" });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};
