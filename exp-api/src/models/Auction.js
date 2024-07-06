const { Schema, models, model } = require('mongoose');
const { randomUUID } = require('crypto');

const getRandomStringUUID = () => randomUUID().toString();

const AuctionSchema = new Schema(
  {
    auction_id: {
      type: String,
      default: getRandomStringUUID,
    },
    proposal_id: {
      type: String,
      default: '',
    },

    departure_airport: {
      type: String,
      required: true,
    },
    arrival_airport: {
      type: String,
      required: true,
    },
    departure_time: {
      type: Date,
      required: true,
    },
    airline: {
      type: String,
      required: true,
    },

    flight_id: {
      type: Schema.Types.ObjectId,
      ref: 'Flight',
      default: null,
    },

    quantity: {
      type: Number,
      required: true,
    },
    group_id: {
      type: Number,
      default: 1,
    },
    type: {
      type: String,
      enum: ['offer', 'proposal', 'acceptance', 'rejection'],
      default: 'offer',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'claimed'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

const Auction = models.Auction || model('Auction', AuctionSchema, 'auctions');

module.exports = Auction;
