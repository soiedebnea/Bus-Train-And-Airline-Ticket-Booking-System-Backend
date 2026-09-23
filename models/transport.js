// models/Transport.js
// A single scheduled departure: a flight, bus trip or train service run by
// one operator. Seats are embedded directly in the document - for the seat
// counts involved here (dozens to a few hundred) this is simpler than a
// separate collection, and it lets us book a seat with a single atomic
// update instead of a multi-document transaction.

const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    seatNumber: { type: String, required: true },
    isBooked: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const transportSchema = new mongoose.Schema({
  operator: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true },
  mode: { type: String, required: true, enum: ['airline', 'bus', 'train'] },
  countryCode: { type: String, required: true, uppercase: true, trim: true },

  // Display name of the specific service, e.g. "Emirates EK202",
  // "Green Line Express", "TGV inOui 6109", "Tokaido Shinkansen Nozomi 1".
  serviceName: { type: String, required: true, trim: true },
  serviceNumber: { type: String, required: true, trim: true },

  source: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },

  journeyDate: { type: String, required: true }, // "YYYY-MM-DD"
  departureTime: { type: String, required: true }, // "HH:MM"
  arrivalTime: { type: String, required: true },   // "HH:MM"

  price: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'USD' },

  seats: { type: [seatSchema], required: true },
});

transportSchema.index({ mode: 1, countryCode: 1, operator: 1 });
transportSchema.index({ source: 1, destination: 1, journeyDate: 1 });

// Not persisted - computed on the way out for convenience.
transportSchema.virtual('totalSeats').get(function () {
  return this.seats.length;
});
transportSchema.virtual('availableSeats').get(function () {
  return this.seats.filter((s) => !s.isBooked).length;
});
transportSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Transport', transportSchema);