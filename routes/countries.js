// routes/countries.js
// Step 1 of the booking flow: list countries to choose from.

const express = require('express');
const router = express.Router();
const Country = require('../models/Country');

// GET /api/countries
router.get('/', async (req, res, next) => {
  try {
    const countries = await Country.find().sort({ name: 1 });
    res.json(countries);
  } catch (err) {
    next(err);
  }
});

module.exports = router;