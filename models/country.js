// models/Country.js
const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true }, // ISO-2, e.g. "BD"
  name: { type: String, required: true, trim: true },                                 // e.g. "Bangladesh"
  flag: { type: String, required: true },                                             // flag emoji, e.g. "🇧🇩"
});

module.exports = mongoose.model('Country', countrySchema);