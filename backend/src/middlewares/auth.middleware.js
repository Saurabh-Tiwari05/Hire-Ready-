// Authentication middleware
const jwt = require('jsonwebtoken');
const { models } = require('../models');
const User = models.User;

exports.protect = async (req, res, next) => {
  try {
    let token = req.cookies.jwt;

    // Also accept Bearer token from Authorization header (used by frontend SPA)
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized to access this route' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id);

      if (!req.user) {
        return res.status(401).json({ error: 'User no longer exists' });
      }

      req.user.id = decoded.id;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    next(error);
  }
};