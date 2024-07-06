const { model, Schema } = require('mongoose');

const RecommendationSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  flightIds: {
    type: [String],
    required: true,
  },
  createdAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

const Recommendation = model('Recommendation', RecommendationSchema, 'recommendations');

module.exports = Recommendation;
