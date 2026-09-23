// seed/seedData.js
// Populates MongoDB with countries, real-world airline/bus/train operators,
// and a handful of scheduled departures (with generated seat maps) for each.
//
// Run with: npm run seed
// Safe to re-run: it wipes and rebuilds the four collections below each time.

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../db');

const Country = require('../models/Country');
const Operator = require('../models/Operator');
const Transport = require('../models/Transport');
const Passenger = require('../models/Passenger');
const Ticket = require('../models/Ticket');

// ---------------------------------------------------------------------
// 1. Countries
// ---------------------------------------------------------------------
const countries = [
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
];

// ---------------------------------------------------------------------
// 2. Operators (real airlines, bus companies and train operators) and the
//    scheduled services each one runs. Prices are in the country's own
//    currency. Seat counts: airline 180, bus 40, train 80 (kept uniform
//    for simplicity - real fleets vary by aircraft/coach/train class).
// ---------------------------------------------------------------------

const AIRLINE_SEATS = 180;
const BUS_SEATS = 40;
const TRAIN_SEATS = 80;

const countryData = {
  BD: {
    currency: 'BDT',
    airline: {
      operators: ['Biman Bangladesh Airlines', 'US-Bangla Airlines', 'NOVOAIR'],
      routes: [
        ['Dhaka', 'Chittagong', '07:10', '08:05', 5500],
        ['Dhaka', "Cox's Bazar", '09:30', '10:35', 6200],
        ['Dhaka', 'Sylhet', '13:15', '14:05', 5100],
      ],
    },
    bus: {
      operators: ['Green Line Paribahan', 'Shohagh Paribahan', 'Hanif Enterprise'],
      routes: [
        ['Dhaka', 'Chittagong', '07:00', '14:00', 1200],
        ['Dhaka', 'Sylhet', '08:30', '15:30', 900],
        ['Dhaka', 'Rajshahi', '09:00', '15:00', 850],
      ],
    },
    train: {
      operators: ['Bangladesh Railway'],
      services: [
        ['Subarna Express', 'TRN-701', 'Dhaka', 'Chittagong', '06:40', '12:20', 450],
        ['Parabat Express', 'TRN-709', 'Dhaka', 'Sylhet', '06:20', '13:00', 395],
        ['Silk City Express', 'TRN-754', 'Dhaka', 'Rajshahi', '15:00', '21:00', 340],
      ],
    },
  },

  IN: {
    currency: 'INR',
    airline: {
      operators: ['IndiGo', 'Air India', 'SpiceJet', 'Akasa Air'],
      routes: [
        ['Delhi', 'Mumbai', '06:00', '08:10', 5200],
        ['Bengaluru', 'Chennai', '10:15', '11:20', 3400],
        ['Kolkata', 'Delhi', '17:45', '20:05', 4800],
      ],
    },
    bus: {
      operators: ['VRL Travels', 'SRS Travels', 'Orange Travels'],
      routes: [
        ['Bengaluru', 'Hyderabad', '21:00', '07:00', 950],
        ['Mumbai', 'Pune', '06:30', '09:30', 420],
        ['Chennai', 'Coimbatore', '22:00', '06:30', 780],
      ],
    },
    train: {
      operators: ['Indian Railways'],
      services: [
        ['Rajdhani Express', 'TRN-12951', 'New Delhi', 'Mumbai Central', '16:35', '08:35', 2100],
        ['Shatabdi Express', 'TRN-12002', 'New Delhi', 'Bhopal', '06:15', '14:05', 1250],
        ['Vande Bharat Express', 'TRN-22436', 'New Delhi', 'Varanasi', '06:00', '14:00', 1800],
        ['Duronto Express', 'TRN-12273', 'Howrah', 'New Delhi', '08:35', '10:05', 1950],
      ],
    },
  },

  US: {
    currency: 'USD',
    airline: {
      operators: ['American Airlines', 'Delta Air Lines', 'United Airlines', 'Southwest Airlines'],
      routes: [
        ['New York (JFK)', 'Los Angeles (LAX)', '08:00', '11:20', 310],
        ['Chicago (ORD)', 'Miami (MIA)', '13:10', '17:05', 245],
        ['Dallas (DFW)', 'Seattle (SEA)', '09:45', '12:40', 265],
      ],
    },
    bus: {
      operators: ['Greyhound', 'FlixBus', 'Megabus'],
      routes: [
        ['New York', 'Boston', '07:00', '11:30', 45],
        ['Chicago', 'Detroit', '09:00', '14:15', 55],
        ['Los Angeles', 'Las Vegas', '10:30', '15:45', 40],
      ],
    },
    train: {
      operators: ['Amtrak'],
      services: [
        ['Acela', 'AMT-2151', 'Boston', 'Washington DC', '06:00', '11:35', 180],
        ['Northeast Regional', 'AMT-0195', 'New York', 'Washington DC', '08:05', '11:20', 95],
        ['California Zephyr', 'AMT-0006', 'Chicago', 'Emeryville', '14:00', '16:10', 210],
        ['Empire Builder', 'AMT-0008', 'Chicago', 'Seattle', '14:30', '22:25', 195],
      ],
    },
  },

  GB: {
    currency: 'GBP',
    airline: {
      operators: ['British Airways', 'Virgin Atlantic', 'easyJet'],
      routes: [
        ['London Heathrow', 'Edinburgh', '07:30', '08:55', 95],
        ['London Gatwick', 'Glasgow', '11:20', '12:45', 88],
        ['London City', 'Belfast', '16:10', '17:35', 79],
      ],
    },
    bus: {
      operators: ['National Express', 'FlixBus UK', 'Megabus UK'],
      routes: [
        ['London', 'Manchester', '08:00', '12:45', 28],
        ['London', 'Birmingham', '09:30', '12:15', 18],
        ['London', 'Bristol', '14:00', '17:00', 22],
      ],
    },
    train: {
      operators: ['LNER', 'Avanti West Coast', 'ScotRail', 'CrossCountry'],
      services: [
        ['LNER Azuma', 'LNER-1E09', 'London Kings Cross', 'Edinburgh', '07:00', '11:24', 105],
        ['Avanti Pendolino', 'AWC-1M12', 'London Euston', 'Manchester', '08:20', '10:35', 72],
        ['ScotRail HST', 'SR-1G22', 'Glasgow', 'Inverness', '09:05', '12:20', 45],
        ['CrossCountry Voyager', 'XC-1V44', 'Birmingham', 'Bristol', '13:10', '14:40', 38],
      ],
    },
  },

  DE: {
    currency: 'EUR',
    airline: {
      operators: ['Lufthansa', 'Eurowings', 'Condor'],
      routes: [
        ['Frankfurt', 'Berlin', '07:20', '08:25', 110],
        ['Munich', 'Hamburg', '10:00', '11:15', 125],
        ['Berlin', 'Cologne', '18:40', '19:50', 98],
      ],
    },
    bus: {
      operators: ['FlixBus', 'BlaBlaCar Bus'],
      routes: [
        ['Berlin', 'Munich', '08:00', '16:30', 35],
        ['Hamburg', 'Frankfurt', '09:15', '14:45', 30],
      ],
    },
    train: {
      operators: ['Deutsche Bahn'],
      services: [
        ['ICE Berlin–München', 'DB-ICE-691', 'Berlin', 'Munich', '07:53', '11:58', 89],
        ['ICE Frankfurt–Hamburg', 'DB-ICE-778', 'Frankfurt', 'Hamburg', '10:12', '13:45', 79],
        ['ICE Köln–München', 'DB-ICE-1022', 'Cologne', 'Munich', '14:04', '19:30', 95],
      ],
    },
  },

  FR: {
    currency: 'EUR',
    airline: {
      operators: ['Air France', 'Transavia France'],
      routes: [
        ['Paris (CDG)', 'Nice', '08:15', '09:35', 115],
        ['Paris (Orly)', 'Toulouse', '11:40', '13:05', 95],
        ['Paris (CDG)', 'Marseille', '17:05', '18:25', 105],
      ],
    },
    bus: {
      operators: ['FlixBus', 'BlaBlaCar Bus'],
      routes: [
        ['Paris', 'Lyon', '07:30', '13:15', 25],
        ['Paris', 'Bordeaux', '09:00', '15:30', 28],
      ],
    },
    train: {
      operators: ['SNCF'],
      services: [
        ['TGV inOui 6109', 'SNCF-6109', 'Paris Gare de Lyon', 'Lyon Part-Dieu', '07:02', '09:00', 65],
        ['TGV inOui 6607', 'SNCF-6607', 'Paris Gare de Lyon', 'Marseille St-Charles', '08:16', '11:19', 79],
        ['Ouigo 7825', 'SNCF-7825', 'Paris Montparnasse', 'Bordeaux St-Jean', '09:41', '11:58', 39],
      ],
    },
  },

  JP: {
    currency: 'JPY',
    airline: {
      operators: ['All Nippon Airways (ANA)', 'Japan Airlines (JAL)'],
      routes: [
        ['Tokyo (Haneda)', 'Osaka (Itami)', '07:00', '08:15', 18500],
        ['Tokyo (Haneda)', 'Sapporo', '09:30', '11:05', 21000],
        ['Tokyo (Narita)', 'Fukuoka', '13:20', '15:10', 23500],
      ],
    },
    bus: {
      operators: ['Willer Express', 'JR Bus Kanto'],
      routes: [
        ['Tokyo', 'Osaka', '22:30', '06:50', 6500],
        ['Tokyo', 'Kyoto', '23:00', '07:10', 6200],
      ],
    },
    train: {
      operators: ['JR Central (Tokaido Shinkansen)', 'JR East (Tohoku Shinkansen)'],
      services: [
        ['Nozomi 1', 'JR-NZ001', 'Tokyo', 'Shin-Osaka', '06:00', '08:22', 14500],
        ['Hikari 505', 'JR-HK505', 'Tokyo', 'Shin-Osaka', '07:33', '10:13', 13800],
        ['Hayabusa 1', 'JR-HB001', 'Tokyo', 'Shin-Aomori', '06:32', '09:20', 17000],
        ['Yamabiko 51', 'JR-YM051', 'Tokyo', 'Sendai', '08:20', '09:57', 11500],
      ],
    },
  },

  AE: {
    currency: 'AED',
    airline: {
      operators: ['Emirates', 'Etihad Airways', 'Air Arabia'],
      routes: [
        ['Dubai', 'Riyadh', '09:00', '10:35', 750],
        ['Abu Dhabi', 'Kuwait City', '14:20', '16:00', 690],
        ['Sharjah', 'Dammam', '18:10', '19:30', 520],
      ],
    },
    bus: {
      operators: ['RTA Intercity Bus', 'Emirates Coach'],
      routes: [
        ['Dubai', 'Abu Dhabi', '07:00', '08:50', 30],
        ['Dubai', 'Sharjah', '08:00', '08:45', 12],
      ],
    },
    train: {
      operators: ['Etihad Rail'],
      services: [
        ['Etihad Rail Abu Dhabi–Dubai', 'ER-101', 'Abu Dhabi', 'Dubai', '07:15', '08:12', 45],
        ['Etihad Rail Abu Dhabi–Sharjah', 'ER-203', 'Abu Dhabi', 'Sharjah', '10:00', '11:05', 40],
        ['Etihad Rail Abu Dhabi–Fujairah', 'ER-305', 'Abu Dhabi', 'Fujairah', '15:00', '16:45', 55],
      ],
    },
  },
};

// A handful of journey dates spread over the next few weeks.
const JOURNEY_DATES = ['2026-09-24', '2026-09-27', '2026-10-01', '2026-10-05'];

function seatsFor(mode) {
  const count = mode === 'airline' ? AIRLINE_SEATS : mode === 'bus' ? BUS_SEATS : TRAIN_SEATS;
  const seats = [];
  for (let i = 1; i <= count; i++) {
    seats.push({ seatNumber: 'S' + String(i).padStart(3, '0'), isBooked: false });
  }
  return seats;
}

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    Country.deleteMany({}),
    Operator.deleteMany({}),
    Transport.deleteMany({}),
    Passenger.deleteMany({}),
    Ticket.deleteMany({}),
  ]);

  console.log('Inserting countries...');
  await Country.insertMany(countries);

  console.log('Inserting operators and scheduled services...');
  let operatorCount = 0;
  let transportCount = 0;

  for (const [countryCode, data] of Object.entries(countryData)) {
    const currency = data.currency;

    // Airlines & buses: each operator in the list runs every route.
    for (const mode of ['airline', 'bus']) {
      const { operators, routes } = data[mode];
      for (const operatorName of operators) {
        const operator = await Operator.create({ name: operatorName, mode, countryCode });
        operatorCount++;

        for (let i = 0; i < routes.length; i++) {
          const [source, destination, departureTime, arrivalTime, price] = routes[i];
          const journeyDate = JOURNEY_DATES[i % JOURNEY_DATES.length];
          const numberPrefix = mode === 'airline' ? 'FL' : 'BS';

          await Transport.create({
            operator: operator._id,
            mode,
            countryCode,
            serviceName: operatorName,
            serviceNumber: `${numberPrefix}-${countryCode}-${operatorCount}${i}`,
            source,
            destination,
            journeyDate,
            departureTime,
            arrivalTime,
            price,
            currency,
            seats: seatsFor(mode),
          });
          transportCount++;
        }
      }
    }

    // Trains: one operator record per country, but each named service
    // (e.g. "Subarna Express", "TGV inOui 6109") becomes its own transport.
    const { operators: trainOperators, services } = data.train;
    const trainOperatorDocs = [];
    for (const operatorName of trainOperators) {
      const operator = await Operator.create({ name: operatorName, mode: 'train', countryCode });
      trainOperatorDocs.push(operator);
      operatorCount++;
    }

    for (let i = 0; i < services.length; i++) {
      const [serviceName, serviceNumber, source, destination, departureTime, arrivalTime, price] = services[i];
      const journeyDate = JOURNEY_DATES[i % JOURNEY_DATES.length];
      // Spread services round-robin across the country's train operator(s).
      const operator = trainOperatorDocs[i % trainOperatorDocs.length];

      await Transport.create({
        operator: operator._id,
        mode: 'train',
        countryCode,
        serviceName,
        serviceNumber,
        source,
        destination,
        journeyDate,
        departureTime,
        arrivalTime,
        price,
        currency,
        seats: seatsFor('train'),
      });
      transportCount++;
    }
  }

  console.log(`Seeded ${countries.length} countries, ${operatorCount} operators, ${transportCount} scheduled services.`);
  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});