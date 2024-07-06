const { model, Schema } = require('mongoose');
// const { randomUUID } = require('crypto');

const FlightSchema = new Schema({
  departure_airport_name: {
    type: String,
  },
  departure_airport_id: {
    type: String,
  },
  departure_time: {
    type: Date,
  },
  arrival_airport_name: {
    type: String,
  },
  arrival_airport_id: {
    type: String,
  },
  arrival_time: {
    type: Date,
  },
  duration: {
    type: Number,
  },
  airplane: {
    type: String,
  },
  airline: {
    type: String,
  },
  airline_logo: {
    type: String,
  },
  price: { type: Number },
  carbon_emissions: {
    type: Map,
    of: Number,
    get: (v) => v || this.carbonEmissions,
  },
  currency: { type: String },
  airlineLogo: { type: String },
  available_seats: {
    type: Number,
    get: (v) => v || this.availableSeats,
  },
  reserved_seats: {
    type: Number,
    get: (v) => v || this.reservedSeats,
  },
}, {
  timestamps: true,
  methods: {
    getParam(param) {
      return this[param]
                || this[`flights.0.${param}`];
    },
  },
});

const Flight = model('Flight', FlightSchema, 'data');

function replaceLastOcurrence(str, find, replace) {
  const index = str.lastIndexOf(find);
  if (index !== -1) {
    return str.substring(0, index) + replace + str.substring(index + find.length);
  }
  return str;
}

Flight.search = function search(params, ...fields) {
  const conditions = [];
  let query;

  // eslint-disable-next-line no-restricted-syntax
  for (const key in params) {
    // eslint-disable-next-line no-prototype-builtins
    if (params.hasOwnProperty(key)) {
      const q = key.split('_')[-1];
      const newKey = replaceLastOcurrence(key, '_', '.');
      conditions.push({
        $or: [
          { [key]: params[key] },
          { [`flights.0.${newKey}`]: params[key] },
          { [`flights.0.departure_airport.${q}`]: params[key] },
        ],
      });
    }
  }
  // // console.log('Conditions:', JSON.stringify(conditions));
  if (conditions.length === 0) {
    // // console.log('No conditions')
    query = {};
  } else if (conditions.length === 1) {
    // // console.log('One condition')
    [query] = conditions;
  } else {
    // // console.log('Multiple conditions')
    query = { $and: conditions };
  }
  return Flight.find(query, ...fields).exec();
};

module.exports = Flight;
