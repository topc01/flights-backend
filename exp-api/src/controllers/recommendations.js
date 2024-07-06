const jwt = require('jsonwebtoken');
const axios = require('axios');
const mongoose = require('mongoose');
const Flight = require('../models/Flight');

const connectDB = require('../utils/dbConnection');

const { JWT_SECRET } = process.env;
const { MONGODB_URL, WORKER_URL } = process.env;

exports.getUserRecommendations = async (req, res) => {
  try {
    // console.log('>>>>>>>>> REQUEST', req);
    // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    // console.log('>>>>>>>>> req.headers', req.headers);
    const token = req.headers.Authorization || req.header('Authorization');
    // console.log(token);
    if (!token) {
      return res.status(400).json({ error: 'Missing token' });
    }
    const user_id = jwt.verify(token, JWT_SECRET).subject;
    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' });
    }

    const connection_successful = await connectDB();
    if (!connection_successful) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // mongoose.connect(mongoURL, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // });
    await mongoose.connect(MONGODB_URL);

    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
      console.log('Connected to MongoDB');
    });
    const recommendationsCollection = db.collection('recommendations');

    const recommendations = await recommendationsCollection
      .find({ userId: user_id })
      .sort({ createdAt: -1 })
      .toArray();

    const updatedRecommendations = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const recommendation of recommendations) {
      const updatedFlights = [];
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(recommendation.flightIds.map(async (flightId) => {
        if (!flightId) {
          updatedFlights.push(null);
        } else {
          const flight = await Flight.findById(flightId);
          updatedFlights.push(flight);
          console.log('flight', flight);
        }
      }));

      updatedRecommendations.push({ ...recommendation, flights: updatedFlights });
    }
    console.log(':::::::::::::::::::::::::::::::::::::::::::::::::::');
    console.log('updatedRecommendations', updatedRecommendations);
    console.log(':::::::::::::::::::::::::::::::::::::::::::::::::::');
    res.status(200).json({
      recommendations: updatedRecommendations,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
};

exports.startRecommendation = async (info) => {
  try {
    // const token = req.headers.Authorization || req.header('Authorization');
    const {
      user_id, arrival_time, arrival_airport_id, userLocation,
    } = info;
    // console.log(token);
    // if (!token) {
    //   return res.status(400).json({ error: 'Missing token' });
    // }
    // const user_id = jwt.verify(token, JWT_SECRET).subject;
    // if (!user_id) {
    //   return res.status(400).json({ error: 'Missing user_id' });
    // }
    // const { arrival_time, arrival_airport, userLocation } = req;

    if (!arrival_time || !arrival_airport_id || !userLocation || !user_id) {
      console.log('Missing data');
      return;
    }

    const start_date = new Date(arrival_time);
    const weekLater = new Date(start_date);
    weekLater.setDate(weekLater.getDate() + 7);

    console.log('start_date', start_date);
    console.log('weekLater', weekLater);

    // const sampleFlight = await Flight.find({}).limit(3);
    // console.log('===============================================');
    // console.log('sampleFlight', sampleFlight);
    // console.log('===============================================');

    // const flightsDate = await Flight.find({ departure_time: { $gte: start_date, $lte: weekLater } }).limit(20);
    // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    // console.log('flightsDate', flightsDate);
    // console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');

    // const flightsAirport = await Flight.find({ departure_airport_id: arrival_airport_id }).limit(20);
    // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    // console.log('flightsAirport', flightsAirport);
    // console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');

    const candidateFlights = await Flight
      .find({
        departure_time: { $gte: start_date, $lte: weekLater },
        departure_airport_id: arrival_airport_id,
      })
      .sort({ departure_time: -1 })
      .limit(20);

    console.log('\n\n\n\n\n----------------------------------------------');
    console.log('candidateFlights', candidateFlights);
    console.log('----------------------------------------------');

    // const start_date = new Date(arrival_time);
    // date.setDate(date.getDate() + 7);
    // const formattedDate = format(date, 'yyyy-MM-dd');
    // const query1 = `departure=${arrival_airport}`;
    // const query2 = `date=${formattedDate}`;
    // const api_response = await axios.get(`${apiURL}/flights?${query1}&${query2}&count=20`);
    // const candidateFlights = api_response.data.flights;

    const data = {
      candidateFlights,
      userLocation,
      userId: user_id,
    };

    const master_response = await axios.post(`${WORKER_URL}/job`, data);

    if (master_response.status === 400) {
      console.log('Missing data');
      return;
    }
    if (master_response.status === 500) {
      return;
    }
    if (master_response.status === 201) {
      console.log('Job id sent to queue');
    }
  } catch (error) {
    console.log(error);
  }
};
