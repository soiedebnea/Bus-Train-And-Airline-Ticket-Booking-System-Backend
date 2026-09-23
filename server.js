// server.js
// Entry point for the Airline, Bus & Train Ticket Booking System API.

const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const countriesRouter = require('./routes/countries');
const operatorsRouter = require('./routes/operators');
const transportsRouter = require('./routes/transports');
const ticketsRouter = require('./routes/tickets');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Airline, Bus & Train Ticket Booking System API is running' });
});

app.use('/api/countries', countriesRouter);
app.use('/api/operators', operatorsRouter);
app.use('/api/transports', transportsRouter);
app.use('/api/tickets', ticketsRouter);

// Fallback 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Ticket Booking API running on http://localhost:${PORT}`);
  });
});