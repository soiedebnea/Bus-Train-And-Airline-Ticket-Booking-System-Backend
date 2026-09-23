// models/Ticket.js
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  pnr: { type: String, required: true, unique: true, uppercase: true },
  transport: { type: mongoose.Schema.Types.ObjectId, ref: 'Transport', required: true },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'Passenger', required: true },
  seatNumber: { type: String, required: true },
  bookingDate: { type: Date, required: true, default: Date.now },
  status: { type: String, required: true, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  totalFare: { type: Number, required: true },
  currency: { type: String, required: true, default: 'USD' },
});

module.exports = mongoose.model('Ticket', ticketSchema);