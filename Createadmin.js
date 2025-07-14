
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');

    const userId = 'admin2';
    const email = 'admin2@gmail.com';
    const plainPassword = 'admin123';

    const existing = await Admin.findOne({ userId });
    if (existing) {
      console.log('⚠️ Admin already exists');
      return mongoose.disconnect();
    }

    const newAdmin = new Admin({ userId, email, password: plainPassword });
    await newAdmin.save();
    console.log('🎉 Admin created successfully');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    mongoose.disconnect();
  }
}

createAdmin();
