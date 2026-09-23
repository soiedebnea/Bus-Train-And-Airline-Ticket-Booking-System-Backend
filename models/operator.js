// models/Operator.js
// An "operator" is the company running the service: an airline, a bus
// company, or a train operator (e.g. "Emirates", "Green Line Paribahan",
// "Amtrak"). Each belongs to one country and one mode.

const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mode: { type: String, required: true, enum: ['airline', 'bus', 'train'] },
  countryCode: { type: String, required: true, uppercase: true, trim: true },
  description: { type: String, trim: true, default: '' },
});

operatorSchema.index({ countryCode: 1, mode: 1 });

module.exports = mongoose.model('Operator', operatorSchema);