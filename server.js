const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');
const movieRoutes = require('./routes/movieRoutes');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

// Verify environment variables
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not set in .env file');
  process.exit(1);
}

console.log('MongoDB URI:', process.env.MONGO_URI);

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;

console.log('Connecting to MongoDB...');

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  
  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/movies', movieRoutes);

  app.get('/', (req, res) => {
    res.json({
      status: 'success',
      message: 'Movie Review API is running',
      timestamp: new Date().toISOString()
    });
  });

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection failed!');
  console.error('Connection String:', MONGO_URI);
  console.error('Error Message:', err.message);
  console.error('Error Code:', err.code);
  console.error('Error Name:', err.name);
  console.error('Error Stack:', err.stack);
  
  // Try a basic connection test
  console.log('Attempting basic connection test...');
  mongoose.connect('mongodb://localhost:27017/test', {
    serverSelectionTimeoutMS: 1000
  }).catch(testErr => {
    console.error('Local MongoDB test failed:', testErr.message);
  });
  
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });
});
