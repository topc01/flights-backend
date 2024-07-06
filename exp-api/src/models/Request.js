const { Schema, model } = require('mongoose');
const { randomUUID } = require('crypto');

const getRandomStringUUID = () => randomUUID().toString();

const RequestSchema = new Schema({
  request_id: {
    type: String,
    default: getRandomStringUUID,
    unique: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  user_id: {
    type: String,
    default: '',
  },
  flight_id: {
    type: String,
    default: '',
  },
  group_id: {
    type: String,
    default: '1',
  },
  departure_airport: {
    type: String,
  },
  arrival_airport: {
    type: String,
  },
  departure_time: {
    type: Date,
  },
  flight: {
    type: Schema.Types.ObjectId,
    ref: 'Flight',
    default: null,
  },
  datetime: { type: String, default: new Date().toString() },
  deposit_token: { type: String, default: '' },
  quantity: { type: Number, required: true },
  seller: { type: Number, default: 0 },
  validationStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  /*
    must use Map type for nested objects
    usage:
        Request.userLocation.set('city', 'Santiago')
        Request.userLocation.get('city') -> 'Santiago'
    */
  userLocation: { type: Map, of: String },
}, {
  timestamps: true,
  methods: {
    async getUser() {
      return this.populate('user').exec();
    },
    async getFlight() {
      if (!this.flight) return null;
      return this.populate('flight').exec();
    },
    // getter for the publisher
    getData() {
      return {
        request_id: this.request_id,
        group_id: this.group_id,
        departure_airport: this.departure_airport,
        arrival_airport: this.arrival_airport,
        departure_time: this.departure_time,
        datetime: this.datetime,
        deposit_token: this.deposit_token,
        quantity: this.quantity,
        seller: this.seller,
      };
    },
  },
});

const Request = model('Request', RequestSchema, 'requests');

module.exports = Request;
