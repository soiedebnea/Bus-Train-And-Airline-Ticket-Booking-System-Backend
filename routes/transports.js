// routes/transports.js
// Step 4: the specific scheduled departures for a chosen company (or a
// general search), plus their seat maps.

const express = require('express');
const router = express.Router();
const Transport = require('../models/Transport');
const Operator = require('../models/Operator');

function seatGenerator(count) {
  const seats = [];
  for (let i = 1; i <= count; i++) {
    seats.push({ seatNumber: 'S' + String(i).padStart(2, '0'), isBooked: false });
  }
  return seats;
}

// GET /api/transports?operator=<id>&country=BD&mode=airline&source=&destination=&date=
router.get('/', async (req, res, next) => {
  try {
    const { operator, country, mode, source, destination, date } = req.query;
    const filter = {};
    if (operator) filter.operator = operator;
    if (country) filter.countryCode = country.toUpperCase();
    if (mode) filter.mode = mode;
    if (source) filter.source = new RegExp(source, 'i');
    if (destination) filter.destination = new RegExp(destination, 'i');
    if (date) filter.journeyDate = date;

    const transports = await Transport.find(filter)
      .populate('operator', 'name mode countryCode')
      .sort({ journeyDate: 1, departureTime: 1 });

    res.json(transports);
  } catch (err) {
    next(err);
  }
});

// GET /api/transports/:id
router.get('/:id', async (req, res, next) => {
  try {
    const transport = await Transport.findById(req.params.id).populate('operator', 'name mode countryCode');
    if (!transport) return res.status(404).json({ error: 'Transport not found' });
    res.json(transport);
  } catch (err) {
    next(err);
  }
});

// GET /api/transports/:id/seats
router.get('/:id/seats', async (req, res, next) => {
  try {
    const transport = await Transport.findById(req.params.id, 'seats');
    if (!transport) return res.status(404).json({ error: 'Transport not found' });
    res.json(transport.seats);
  } catch (err) {
    next(err);
  }
});

// POST /api/transports  (admin: add a new scheduled flight/bus/train)
router.post('/', async (req, res, next) => {
  try {
    const {
      operatorId, source, destination, journeyDate,
      departureTime, arrivalTime, totalSeats, price, currency,
      serviceName, serviceNumber,
    } = req.body;

    if (!operatorId || !source || !destination || !journeyDate ||
        !departureTime || !arrivalTime || !totalSeats || !price || !serviceName || !serviceNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const operator = await Operator.findById(operatorId);
    if (!operator) return res.status(404).json({ error: 'Operator not found' });

    if (Number(totalSeats) <= 0 || Number(price) <= 0) {
      return res.status(400).json({ error: 'totalSeats and price must be positive numbers' });
    }

    const transport = await Transport.create({
      operator: operator._id,
      mode: operator.mode,
      countryCode: operator.countryCode,
      serviceName,
      serviceNumber,
      source,
      destination,
      journeyDate,
      departureTime,
      arrivalTime,
      price: Number(price),
      currency: currency || 'USD',
      seats: seatGenerator(Number(totalSeats)),
    });

    const populated = await transport.populate('operator', 'name mode countryCode');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/transports/:id  (admin)
router.delete('/:id', async (req, res, next) => {
  try {
    const Ticket = require('../models/Ticket');
    const activeTickets = await Ticket.countDocuments({ transport: req.params.id, status: 'confirmed' });
    if (activeTickets > 0) {
      return res.status(400).json({ error: 'Cannot delete: confirmed tickets exist for this transport' });
    }
    const transport = await Transport.findByIdAndDelete(req.params.id);
    if (!transport) return res.status(404).json({ error: 'Transport not found' });
    res.json({ message: 'Transport deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;