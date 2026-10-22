const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Question 1: who are you?
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not logged in' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look the user up again so deleted users can't keep using an old token
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {

    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Question 2: are you allowed here?
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission' });
  }
  next();
};

module.exports = { protect, authorize };