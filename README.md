# Airline, Bus & Train Ticket Booking System — Backend

REST API for a booking system covering **airlines, buses, and trains**
across multiple countries. The booking flow is: pick a **country**, then a
**mode of transport** (airline / bus / train), then a **company** (e.g.
Emirates, Green Line Paribahan, Amtrak), then a specific **scheduled
service**, then a **seat**, then passenger details and a **ticket**.

Built with **Node.js, Express, and MongoDB** (via Mongoose).

## Requirements

- Node.js 18 or later
- A MongoDB server you can connect to — either:
  - **Local MongoDB** installed on your machine ([install guide](https://www.mongodb.com/docs/manual/administration/install-community/)), or
  - A free **MongoDB Atlas** cluster ([atlas.mongodb.com](https://www.mongodb.com/cloud/atlas/register)) — no local install needed.

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set `MONGODB_URI`:

```bash
# Local MongoDB (default):
MONGODB_URI=mongodb://127.0.0.1:27017/transit_booking

# Or MongoDB Atlas:
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/transit_booking
```

If you're running MongoDB locally, start it first (varies by OS/install
method, commonly `mongod` or `sudo systemctl start mongod`).

Then seed the database with countries, real-world airline/bus/train
operators, and sample scheduled services:

```bash
npm run seed
```

This wipes and rebuilds the `countries`, `operators`, `transports`,
`passengers`, and `tickets` collections, and prints a summary like:

```
Seeded 8 countries, 44 operators, 96 scheduled services.
```

Finally, start the API:

```bash
npm start
```

It runs on **http://localhost:5000**. To use a different port, set `PORT`
in `.env` or run `PORT=4000 npm start`.

## Project structure

```
backend/
├── server.js              Express app setup and route mounting
├── db.js                  Mongoose connection (reads MONGODB_URI from .env)
├── .env.example            Copy to .env and fill in your MongoDB URI
├── models/
│   ├── Country.js           { code, name, flag }
│   ├── Operator.js          An airline/bus/train company: { name, mode, countryCode }
│   ├── Transport.js         A scheduled departure, with embedded seats
│   ├── Passenger.js         Captured at booking time
│   └── Ticket.js            Links a passenger to a seat, with a PNR
├── routes/
│   ├── countries.js          List countries
│   ├── operators.js          List/add/delete companies
│   ├── transports.js         List/add/delete scheduled services, seat maps
│   └── tickets.js            Book, look up, and cancel tickets
├── seed/
│   └── seedData.js           Populates countries, operators & services
└── package.json
```

## Data model

- **Country** — `{ code: "BD", name: "Bangladesh", flag: "🇧🇩" }`.
- **Operator** — a real airline, bus, or train company, e.g. `{ name:
  "Emirates", mode: "airline", countryCode: "AE" }`. For trains, the
  "operator" is the rail company (e.g. "Bangladesh Railway", "SNCF") and
  each named service (e.g. "Subarna Express", "TGV inOui 6109") is a
  separate **Transport**.
- **Transport** — one scheduled departure: operator reference, mode,
  country, service name/number, source, destination, date, times, price,
  currency, and an **embedded array of seats** (`{ seatNumber, isBooked }`).
  Seats are embedded rather than a separate collection because the counts
  involved (dozens to a few hundred) are small, and it lets seat booking
  happen as a single atomic MongoDB update (see below) instead of a
  multi-document transaction.
- **Passenger** — captured at booking time (name, age, gender, contact).
- **Ticket** — links a passenger to a seat on a transport, with a PNR,
  status (`confirmed` / `cancelled`), fare, and currency.

## How seat booking avoids double-booking

Booking a seat uses one atomic MongoDB operation:

```js
Transport.findOneAndUpdate(
  { _id: transportId, seats: { $elemMatch: { seatNumber, isBooked: false } } },
  { $set: { 'seats.$.isBooked': true } },
  { new: true }
);
```

This only matches (and flips) the seat if it is *still* unbooked at the
moment the update runs. If two people click the same seat at the same
time, only one update can match — the other gets a clean `409 Seat is
already booked` response instead of silently overbooking the seat. No
transactions or manual locking needed.

## API reference

Base URL: `http://localhost:5000/api`

### Countries

| Method | Path          | Description        |
|--------|---------------|----------------------|
| GET    | `/countries`  | List all countries. |

### Operators (airlines, bus companies, train operators)

| Method | Path              | Description                                                        |
|--------|-------------------|----------------------------------------------------------------------|
| GET    | `/operators`      | List. Query params: `country` (ISO code), `mode` (`airline`/`bus`/`train`). |
| GET    | `/operators/:id`  | Get one operator.                                                   |
| POST   | `/operators`      | Add a new company: `{ name, mode, countryCode, description? }`.     |
| DELETE | `/operators/:id`  | Remove a company. Fails with 400 if it still has scheduled services. |

### Transports (scheduled flights/buses/trains)

| Method | Path                     | Description                                                                 |
|--------|--------------------------|---------------------------------------------------------------------------|
| GET    | `/transports`            | Search. Query params: `operator`, `country`, `mode`, `source`, `destination`, `date`. |
| GET    | `/transports/:id`        | Get one scheduled service, including `availableSeats`/`totalSeats`.        |
| GET    | `/transports/:id/seats`  | Full seat map: `[{ seatNumber, isBooked }, ...]`.                          |
| POST   | `/transports`            | Add a new scheduled service (see body below).                              |
| DELETE | `/transports/:id`        | Remove a service. Fails with 400 if it has confirmed tickets.              |

`POST /transports` body:
```json
{
  "operatorId": "6650...",
  "serviceName": "TGV inOui 6109",
  "serviceNumber": "SNCF-6109",
  "source": "Paris Gare de Lyon",
  "destination": "Lyon Part-Dieu",
  "journeyDate": "2026-10-05",
  "departureTime": "07:02",
  "arrivalTime": "09:00",
  "totalSeats": 80,
  "price": 65,
  "currency": "EUR"
}
```

### Tickets

| Method | Path                    | Description                                                     |
|--------|-------------------------|-------------------------------------------------------------------|
| POST   | `/tickets/book`         | Book a specific seat for a new passenger. See body below.        |
| GET    | `/tickets/:pnr`         | Full ticket details (transport, operator, passenger) by PNR.     |
| POST   | `/tickets/:pnr/cancel`  | Cancel a confirmed ticket and release its seat.                  |

`POST /tickets/book` body:
```json
{
  "transport_id": "6650...",
  "seat_number": "S012",
  "passenger": {
    "name": "Rahim Uddin",
    "age": 29,
    "gender": "Male",
    "email": "rahim@example.com",
    "phone": "01710000000"
  }
}
```

## Trying it with curl

```bash
# countries
curl http://localhost:5000/api/countries

# airlines operating in Japan
curl "http://localhost:5000/api/operators?country=JP&mode=airline"

# that airline's scheduled flights (replace OPERATOR_ID)
curl "http://localhost:5000/api/transports?operator=OPERATOR_ID"

# book a seat (replace TRANSPORT_ID)
curl -X POST http://localhost:5000/api/tickets/book \
  -H "Content-Type: application/json" \
  -d '{"transport_id":"TRANSPORT_ID","seat_number":"S001","passenger":{"name":"Yuki Tanaka","age":34,"gender":"Female"}}'

# look up / cancel (replace PNR)
curl http://localhost:5000/api/tickets/PNR
curl -X POST http://localhost:5000/api/tickets/PNR/cancel
```

## Countries and operators included in the seed data

Bangladesh, India, United States, United Kingdom, Germany, France, Japan,
and the United Arab Emirates — each with several real airlines, bus
companies, and train operators (e.g. Biman Bangladesh Airlines, IndiGo,
Delta Air Lines, British Airways, Lufthansa, Air France, ANA/JAL, Emirates
for airlines; Green Line Paribahan, Greyhound, FlixBus, National Express
for buses; Bangladesh Railway, Indian Railways, Amtrak, LNER/Avanti West
Coast, Deutsche Bahn, SNCF, JR Central/JR East, and the newly-launching
Etihad Rail for trains). Feel free to add more via the admin endpoints or
by extending `seed/seedData.js`.

## Connecting the frontend

The companion frontend expects this API at `http://localhost:5000/api`
(see `frontend/js/api.js`, `API_BASE`). CORS is enabled for all origins.
Start this backend (and run `npm run seed` at least once) before opening
the frontend.

## Notes on this being a learning/demo project

- No authentication — the admin page is open to anyone who can reach it.
- Prices use each country's real currency code (BDT, INR, USD, GBP, EUR,
  JPY, AED) but are illustrative, not live fares.
- Good next steps if you extend this: add login/auth, real payments, email
  confirmations, or pagination for larger timetables.
