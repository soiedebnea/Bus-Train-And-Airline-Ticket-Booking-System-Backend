// db.js
// Opens the Mongoose connection to MongoDB. Reads MONGODB_URI from .env,
// falling back to a local default so the app still boots without one.

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/transit_booking';

async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB connected -> ${MONGODB_URI}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.error('Is MongoDB running? See README.md for setup instructions.');
    process.exit(1);
  }
}

module.exports = connectDB;