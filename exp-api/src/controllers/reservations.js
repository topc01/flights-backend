// const mongoose = require('mongoose');
// const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const geoip = require('geoip-lite');
const User = require('../models/User');
const Request = require('../models/Request');
const Flight = require('../models/Flight');
const connectDB = require('../utils/dbConnection');
const mailer = require('../utils/mailer');
const trx = require('../utils/trx');
const { startRecommendation } = require('./recommendations');

// eslint-disable-next-line no-use-before-define
module.exports = { getReservations, buyReservation };

const { REDIRECT_URL } = process.env;

async function getReservations(req, res) {
  try {
    await connectDB();
    const admin = await User.findOne({ isAdmin: true });
    console.log(admin);

    const requests = await admin.getRequests();
    // console.log('[Get users requests] requests:', requests);
    console.log('[Get users requests] requests:', requests);
    const data = await Promise.all(requests.map(async (request) => {
      const flight_id = request.flight;
      const flight_info = await Flight.findById(flight_id);
      const doc = { ...request };
      const ret = { ...(doc._doc), flight_info };
      return ret;
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// const getParameters = (req) => {
//   const token = req.header('Authorization') || req.headers.Authorization;
//   const user_id = jwt.verify(token, process.env.JWT_SECRET).subject;
//   const { request_id } = req.body;
//   return { user_id, request_id };
// };

async function transaction(request_id, price, quantity) {
  const transactionResponse = await trx.tx.create(
    request_id,
    'FlightsUc S.A.',
    price * quantity,
    REDIRECT_URL,
  );
  return transactionResponse.token;
}

async function buyReservation(req, res) {
  try {
    const token = req.header('Authorization') || req.headers.Authorization;
    const user_id = jwt.verify(token, process.env.JWT_SECRET).subject;
    console.log(0);
    const { request_id } = req.params;
    console.log(0.1);
    await connectDB();
    // const { user_id, request_id } = getParameters(req);
    
    const admin = await User.findOne({ isAdmin: true });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    console.log(0.2);
    
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(403).json({ error: 'Admin required' });
    }
    console.log(0.3);
    
    const request = await Request.find({ request_id });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    console.log(0.4);
    
    const flight = await Flight.findById(request.flight);
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }
    console.log(1, request_id);
    
    const geo = geoip.lookup(req.ip);
    const userLocation = {
      city: geo.city,
      country: geo.country,
      ip: req.ip,
      lat: geo.ll[0],
      lon: geo.ll[1],
    };
    
    console.log(2);
    const { price } = flight;
    const { _id, quantity } = request;
    console.log(3);
    const deposit_token = await transaction(_id, price, quantity);
    console.log(4);
    
    request.deposit_token = deposit_token;
    request.user = user._id;
    request.user_id = user.user_id;
    request.userLocation = userLocation;
    await request.save();
    console.log(5);
    
    user.requests.push(request._id);
    await user.save();
    console.log(6);
    
    // delete bought request from admin list
    await User.updateOne(
      { isAdmin: true },
      { $pull: { requests: request._id } },
    );
    console.log(7, admin.requests);
    admin.requests = admin.requests.filter((r) => r !== request._id);
    await admin.save();
    console.log(8, admin.requests);
    if (request._id in admin.requests) {
      return res.status(488).json({ error: 'Request not deleted from admin' });
    }
    console.log(9);
    
    let text = `Sr(a). ${user.name},\n\n`;
    text += `Se ha confirmado su compra de ${request.quantity} pasajes de`;
    text += `${request.departure_airport} a ${request.arrival_airport}`;
    text += `para el día ${request.departure_time}.\n\n`;
    const mailOptions = {
      from: 'arquisis1@gmail.com',
      to: user.email,
      subject: `Confirmación de compra: ${request.departure_airport} - ${request.arrival_airport}`,
      text,
    };
    mailer.sendOrderConfirmationEmail(mailOptions);
    console.log(10);
    
    const data = {
      user_id,
      arrival_time: flight.arrival_time,
      arrival_airport_id: flight.arrival_airport_id,
      userLocation,
    };
    startRecommendation(data);
    console.log(11);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
