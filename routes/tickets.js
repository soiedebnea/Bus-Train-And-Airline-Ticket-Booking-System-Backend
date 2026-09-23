// routes/tickets.js
// Booking, lookup by PNR, and cancellation.
//
// Seat booking uses a single atomic MongoDB update instead of a multi-step
// read-then-write: we ask MongoDB to flip isBooked to true ONLY IF that seat
// is still unbooked, in one operation. If two people click the same seat at
// the same moment, only one update can match and succeed - the loser gets a
// clean "seat already booked" response instead of a double-booked seat.

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transport = require('../models/Transport');
const Passenger = require('../models/Passenger');
const Ticket = require('../models/Ticket');

const PNR_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion

function generatePnr() {
  let pnr = '';
  for (let i = 0; i < 8; i++) {
    pnr += PNR_CHARS[Math.floor(Math.random() * PNR_CHARS.length)];
  }
  return pnr;
}

async function buildTicketResponse(pnr) {
  const ticket = await Ticket.findOne({ pnr })
    .populate({
      path: 'transport',
      populate: { path: 'operator', select: 'name mode countryCode' },
    })
    .populate('passenger');
  return ticket;
}

// POST /api/tickets/book
// body: { transport_id, seat_number, passenger: { name, age, gender, email, phone } }
router.post('/book', async (req, res, next) => {
  try {
    const { transport_id, seat_number, passenger } = req.body;

    if (!transport_id || !seat_number || !passenger) {
      return res.status(400).json({ error: 'transport_id, seat_number and passenger are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(transport_id)) {
      return res.status(400).json({ error: 'Invalid transport_id' });
    }
    const { name, age, gender, email, phone } = passenger;
    if (!name || !age || !gender) {
      return res.status(400).json({ error: 'Passenger name, age and gender are required' });
    }

    // Atomic: only matches (and flips) the seat if it's still unbooked.
    const updatedTransport = await Transport.findOneAndUpdate(
      { _id: transport_id, seats: { $elemMatch: { seatNumber: seat_number, isBooked: false } } },
      { $set: { 'seats.$.isBooked': true } },
      { new: true }
    );

    if (!updatedTransport) {
      // Either the transport doesn't exist, the seat number is wrong, or
      // (most likely in a race) someone else just booked it.
      const exists = await Transport.exists({ _id: transport_id });
      if (!exists) return res.status(404).json({ error: 'Transport not found' });
      return res.status(409).json({ error: 'Seat is already booked or does not exist' });
    }

    const newPassenger = await Passenger.create({
      name, age: Number(age), gender, email: email || '', phone: phone || '',
    });

    let pnr = generatePnr();
    while (await Ticket.exists({ pnr })) {
      pnr = generatePnr();
    }

    await Ticket.create({
      pnr,
      transport: updatedTransport._id,
      passenger: newPassenger._id,
      seatNumber: seat_number,
      status: 'confirmed',
      totalFare: updatedTransport.price,
      currency: updatedTransport.currency,
    });

    const ticket = await buildTicketResponse(pnr);
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets/:pnr
router.get('/:pnr', async (req, res, next) => {
  try {
    const ticket = await buildTicketResponse(req.params.pnr.toUpperCase());
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

// POST /api/tickets/:pnr/cancel
router.post('/:pnr/cancel', async (req, res, next) => {
  try {
    const pnr = req.params.pnr.toUpperCase();
    const ticket = await Ticket.findOne({ pnr });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.status === 'cancelled') {
      return res.status(400).json({ error: 'Ticket is already cancelled' });
    }

    ticket.status = 'cancelled';
    await ticket.save();

    await Transport.findOneAndUpdate(
      { _id: ticket.transport, 'seats.seatNumber': ticket.seatNumber },
      { $set: { 'seats.$.isBooked': false } }
    );

    const updated = await buildTicketResponse(pnr);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;