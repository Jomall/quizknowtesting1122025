const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Update last seen on authenticated requests
    user.lastSeen = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

const checkApproved = (req, res, next) => {
  if (req.user.role === 'instructor' && !req.user.isApproved) {
    return res.status(403).json({ message: 'Account not approved' });
  }
  next();
};

const checkSuspended = (req, res, next) => {
  if (req.user.isSuspended) {
    return res.status(403).json({ message: 'Account suspended' });
  }
  next();
};

module.exports = { auth, authorize, checkApproved, checkSuspended };
