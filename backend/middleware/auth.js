const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // For development, allow simple token
    if (token === 'dev-token') {
      const user = await User.findOne({ telegramId: '123456789' });
      if (!user) {
        // Create a test user if not exists
        const testUser = new User({
          telegramId: '123456789',
          username: 'testuser',
          telegram: {
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User'
          }
        });
        await testUser.save();
        req.user = testUser;
      } else {
        req.user = user;
      }
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Telegram authentication middleware
const telegramAuth = async (req, res, next) => {
  try {
    const { telegramId, username, firstName, lastName } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }

    let user = await User.findOne({ telegramId });
    
    if (!user) {
      // Create new user
      user = new User({
        telegramId,
        username: username || '',
        telegram: {
          username: username || '',
          firstName: firstName || '',
          lastName: lastName || ''
        }
      });
      await user.save();
    } else {
      // Update existing user
      if (username) user.username = username;
      if (firstName) user.telegram.firstName = firstName;
      if (lastName) user.telegram.lastName = lastName;
      user.lastSeenAt = new Date();
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Telegram auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. Admin token required.' });
    }

    // For development, allow simple admin token
    if (token === 'admin-token') {
      req.user = { isAdmin: true };
      return next();
    }

    // Verify admin JWT token
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'admin-secret');
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ error: 'Invalid admin token.' });
  }
};

module.exports = {
  auth,
  telegramAuth,
  adminAuth
};
