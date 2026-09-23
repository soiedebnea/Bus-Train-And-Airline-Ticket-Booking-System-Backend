// routes/operators.js
// Step 3 of the booking flow: list airline/bus/train companies for the
// chosen country and mode.

const express = require('express');
const router = express.Router();
const Operator = require('../models/Operator');
const Transport = require('../models/Transport');

// GET /api/operators?country=BD&mode=airline
router.get('/', async (req, res, next) => {
  try {
    const { country, mode } = req.query;
    const filter = {};
    if (country) filter.countryCode = country.toUpperCase();
    if (mode) filter.mode = mode;

    const operators = await Operator.find(filter).sort({ name: 1 });
    res.json(operators);
  } catch (err) {
    next(err);
  }
});

// GET /api/operators/:id
router.get('/:id', async (req, res, next) => {
  try {
    const operator = await Operator.findById(req.params.id);
    if (!operator) return res.status(404).json({ error: 'Operator not found' });
    res.json(operator);
  } catch (err) {
    next(err);
  }
});

// POST /api/operators  (admin: add a new airline/bus/train company)
router.post('/', async (req, res, next) => {
  try {
    const { name, mode, countryCode, description } = req.body;
    if (!name || !mode || !countryCode) {
      return res.status(400).json({ error: 'name, mode and countryCode are required' });
    }
    if (!['airline', 'bus', 'train'].includes(mode)) {
      return res.status(400).json({ error: "mode must be 'airline', 'bus' or 'train'" });
    }
    const operator = await Operator.create({
      name,
      mode,
      countryCode: countryCode.toUpperCase(),
      description: description || '',
    });
    res.status(201).json(operator);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/operators/:id  (admin: only if it has no transports left)
router.delete('/:id', async (req, res, next) => {
  try {
    const inUse = await Transport.exists({ operator: req.params.id });
    if (inUse) {
      return res.status(400).json({ error: 'Cannot delete: this company still has scheduled transports' });
    }
    const operator = await Operator.findByIdAndDelete(req.params.id);
    if (!operator) return res.status(404).json({ error: 'Operator not found' });
    res.json({ message: 'Operator deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;