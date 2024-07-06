const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Flight = require('../models/Flight');

const { MONGODB_URL } = process.env;

const PAGE_SIZE = 25;

exports.addFlight = asyncHandler(async (req, res) => {
  try {
    const data = req.body;
    const carbonEmission = JSON.parse(data.carbonEmission);
    data.carbon_emissions = carbonEmission;
    data.departure_time = new Date(data.departure_time);
    await mongoose.connect(MONGODB_URL);
    const flight = new Flight(data);
    try {
      await flight.save();
    } catch (error) {
      // console.log(error.errors);
    }
    res.status(201).json(flight);
  } catch (error) {
    // console.log(req.body);
    console.error('Error adding data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

exports.getFlightById = async (req, res) => {
  try {
    const { identifier } = req.params;

    await mongoose.connect(MONGODB_URL);
    const data = await Flight.findById(identifier);

    if (!data) {
      return res.status(404).json({ error: 'Data not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching data by identifier:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getAllFlights = async (req, res) => {
  try {
    const {
      departure, arrival, date, page, count,
    } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const skip = (pageNumber - 1) * (parseInt(count, 10) || PAGE_SIZE);

    await mongoose.connect(MONGODB_URL);
    const query = {};
    if (departure) {
      query.departure_airport_id = departure;
    }
    if (arrival) {
      query.arrival_airport_id = arrival;
    }
    if (date) {
      const formattedDate = new Date(date);
      query.departure_time = { $gte: formattedDate };
    }
    mongoose.connect(MONGODB_URL);
    const flights = await Flight.find(query).skip(skip).limit(PAGE_SIZE).exec();

    res.status(200).json({
      page: pageNumber,
      pageSize: PAGE_SIZE,
      flights,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
