const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Username and password are required' 
      });
    }

    // Find admin by username
    const admin = await Admin.findOne({ userId: username });
    if (!admin) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, isAdmin: true },
      process.env.JWT_SECRET,
      { 
        expiresIn: '1d',
        algorithm: 'HS256' 
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Admin login successful',
      token,
      data: {
        userId: admin.userId,
        email: admin.email
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ 
      status: 'error',
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
  }
};
