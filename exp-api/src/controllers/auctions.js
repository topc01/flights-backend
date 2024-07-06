const axios = require('axios');
const { format } = require('date-fns');
const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');
const connectDB = require('../utils/dbConnection');
const Flight = require('../models/Flight');
const Auction = require('../models/Auction');
const Request = require('../models/Request');
const User = require('../models/User');

const { PUBLISHER_PORT, JWT_SECRET } = process.env;
const PAGE_SIZE = 25;

const getToken = (req, res) => {
  try {
    const token = req.header('Authorization') || req.headers.Authorization;
    return token;
  } catch (_) {
    try {
      const token = req.body.headers.Authorization;
      return token;
    } catch (error) {
      console.log('Error getting token:', error);
      console.log('For request:', req);
      return res.status(401).send({ message: 'Token not foun' });
    }
  }
}

const getUserId = (req) => {
  const token = req.header('Authorization') || req.headers.Authorization;
  const user_id = jwt.verify(token, JWT_SECRET).subject;
  console.log('user verified');
  return user_id;
};

async function getRequestData(request) {
  const {
    quantity, departure_airport, arrival_airport, departure_time, flight_id,
  } = request;
  await connectDB();
  const flight = await Flight.findById(flight_id);
  let airline;
  if (!flight) {
    airline = 'Qantas';
  } else {
    airline = flight.airline;
  }
  console.log(airline);
  let departure_time_formatted;
  try {
    departure_time_formatted = format(new Date(departure_time), 'yyyy-MM-dd HH:mm');
  } catch (error) {
    console.log('Error formatting date:', departure_time);
    departure_time_formatted = departure_time;
  }
  return {
    quantity,
    departure_airport,
    arrival_airport,
    departure_time: departure_time_formatted,
    airline,
    flight_id,
  };
}

function getAuctionData(auction) {
  const {
    auction_id,
    departure_airport,
    arrival_airport,
    departure_time,
    airline,
    quantity,
    group_id,
    type,
  } = auction;
  const departure_time_formatted = format(new Date(departure_time), 'yyyy-MM-dd HH:mm');
  return {
    auction_id,
    departure_airport,
    arrival_airport,
    departure_time: departure_time_formatted,
    airline,
    quantity,
    group_id,
    type,
  };
}

async function findOrCreateFlight(data) {
  const {
    departure_airport, arrival_airport, departure_time, airline,
  } = data;
  await connectDB();
  const flight = await Flight.findOne({
    departure_airport_id: departure_airport,
    arrival_airport_id: arrival_airport,
    departure_time,
    airline,
  }) || await Flight.findOne({
    departure_airport_id: departure_airport,
    arrival_airport_id: arrival_airport,
    airline,
  }) || new Flight({
    departure_airport_id: departure_airport,
    arrival_airport_id: arrival_airport,
    departure_time,
    airline,
  });
  if (!flight) {
    return null;
  }
  await flight.save();
  return flight;
}
async function addAuction(req, res) {
  const data = req.body;
  if (data.group_id === 1) {
    return res.status(208).send({ message: 'Auction already in DB' });
  }
  const flight = await findOrCreateFlight(data);
  if (!flight) {
    return res.status(500).send({ message: 'Error creating flight' });
  }
  await connectDB();
  const auction = new Auction({
    auction_id: data.auction_id,
    proposal_id: data.proposal_id,

    departure_airport: data.departure_airport,
    arrival_airport: data.arrival_airport,
    departure_time: data.departure_time,
    airline: data.airline,

    flight_id: flight._id,

    quantity: data.quantity,
    group_id: data.group_id,
    type: data.type,
  });
  await auction.save();
  res.status(200).send('Auction added');
}

async function getExternalOffers(req, res) {
  console.log('> Getting external offers');
  try {
    const {
      page, count,
    } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const skip = (pageNumber - 1) * (parseInt(count, 10) || PAGE_SIZE);

    const auctions = await Auction.find({
      type: 'offer',
      status: 'pending',
      group_id: { $ne: 1 },
    }).skip(skip).limit(PAGE_SIZE).exec();

    res.status(200).json({
      page: pageNumber,
      pageSize: PAGE_SIZE,
      auctions,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getSentOffers(req, res) {
  const token = getToken(req, res);
  const user_id = jwt.verify(token, JWT_SECRET).subject;
  await connectDB();
  const user = await User.findById(user_id);
  if (!user.isAdmin) {
    return res.status(403).json({ error: 'Admin required' });
  }
  const auctions = await Auction.find({ group_id: 1, type: 'offer' });
  res.status(200).json(auctions);
}

async function getRecievedProposals(req, res) {
  const { auction_id } = req.params;
  await connectDB();
  const proposals = await Auction.find({
    auction_id,
    type: 'proposal',
  });
  res.status(200).json(proposals);
}

async function getSentProposals(req, res) {
  const user_id = getUserId(req);
  await connectDB();
  const user = await User.findById(user_id);
  if (!user.isAdmin) {
    return res.status(403).json({ error: 'Admin required' });
  }
  const proposals = await Auction.find({ group_id: 1, type: 'proposal' });
  const accepted = proposals.filter((proposal) => proposal.status === 'accepted');
  const rejected = proposals.filter((proposal) => proposal.status === 'rejected');
  const pending = proposals.filter((proposal) => proposal.status === 'pending');
  const data = {
    accepted,
    pending,
    rejected,
  };
  res.status(200).json(data);
}

async function postOffer(req, res) {
  console.log('> Posting offer');
  const { request_id } = req.params;

  const token = getToken(req, res);
  const user_id = jwt.verify(token, JWT_SECRET).subject;
  const user = await User.findById(user_id);
  if (!user.isAdmin) {
    console.log('User is not admin', user);
    return res.status(403).json({ error: 'Admin required' });
  }
  // const request_list = user.requests;
  // if (!(request_list.includes(request_id))) {
  //   return res.status(405).json({ error: 'Cant auction request if it is not yours' });
  // }

  await connectDB();
  const request = (await Request.find({ request_id }))[0];
  if (!request) {
    return res.status(404).send({ message: 'Request not found' });
  }
  console.log('request:', request);
  const auctionData = await getRequestData(request);
  console.log('auctionData:', auctionData);

  const auction = new Auction(auctionData);
  await auction.save();

  const data = getAuctionData(auction);
  axios.post(`http://publisher:${PUBLISHER_PORT}/auction`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(() => {
      res.status(200).send('Offer sent to broker');
    })
    .catch((error) => {
      console.error('Error:', error.response.status);
      res.status(500).send('Error');
    });
}

async function sendProposal(req, res) {
  console.log('> Sending proposal');
  const { auction_id, request_id } = req.params;
  const token = req.body.headers.Authorization;
  // if (!token) {
  //   console.log(req);
  // }
  // console.log('token:', token, 'secret:', JWT_SECRET);
  const user_id = jwt.verify(token, JWT_SECRET).subject;
  await connectDB();
  const user = await User.findById(user_id);
  if (!user.isAdmin) {
    return res.status(403).json({ error: 'Admin required' });
  }
  const request_list = user.requests;
  if (!(request_list.includes(request_id))) {
    console.log('request_id:', request_id, 'request_list:', request_list);
    return res.status(405).json({ error: 'Cant auction request if it is not yours' });
  }

  await connectDB();
  const auction = await Auction.findOne({ auction_id, type: 'offer' });
  console.log('auction:', auction);
  if (!auction) {
    return res.status(404).send({ message: 'Auction not found' });
  }
  // if (auction.group_id === 1) {
  //   return res.status(405).send({ message: 'Auction already yours' });
  // }
  await connectDB();
  const request = await Request.findById(request_id);
  if (!request) {
    return res.status(404).send({ message: 'Request not found' });
  }
  console.log('request:', request);
  const auctionData = await getRequestData(request);
  const proposal = new Auction(auctionData);
  proposal.proposal_id = randomUUID().toString();
  proposal.type = 'proposal';
  await proposal.save();

  const data = getAuctionData(proposal);
  axios.post(`http://publisher:${PUBLISHER_PORT}/auction`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(() => {
      res.status(200).send('Offer sent to broker');
    })
    .catch((error) => {
      console.error('Error:', error.response.status);
      res.status(500).send('Error');
    });
}

async function sendAnswer(req, res) {
  const { type } = req.params;
  const { auction_id, proposal_id } = req.body;

  if (!type === 'acceptance' || !type === 'rejection') {
    return res.status(405).send({ message: 'Invalid status' });
  }

  const auction = await Auction.find({ auction_id, type: 'offer' });
  if (!auction) {
    return res.status(404).send({ message: 'Auction not found' });
  }
  const proposal = await Auction.find({ proposal_id, type: 'proposal' });
  if (!proposal) {
    return res.status(404).send({ message: 'Proposal not found' });
  }
  if (proposal.auction_id !== auction_id) {
    return res.status(405).send({ message: 'Proposal does not belong to auction' });
  }

  const data = getAuctionData(auction);
  data.proposal_id = proposal_id;
  data.type = type;
  axios.post(`http://publisher:${PUBLISHER_PORT}/auction`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(() => {
      res.status(200).send('Answer sent to broker');
    })
    .catch((error) => {
      console.error('Error:', error.response.status);
      res.status(500).send('Error');
    });
}

async function handleAnswer(req, res) {
  const { type } = req.params;
  const { auction_id, proposal_id } = req.body;
  await connectDB();
  const auction = await Auction.findOne({ auction_id, type: 'offer' });
  if (!auction) {
    return res.status(404).send({ message: 'Auction offered not found' });
  }
  const proposal = await Auction.findOne({ auction_id, proposal_id, type: 'proposal' });
  if (!proposal) {
    return res.status(404).send({ message: 'Auction proposed not found' });
  }
  if (proposal.status !== 'pending') {
    return res.status(405).send({ message: 'Proposal already answered' });
  }
  if (type === 'acceptance') {
    proposal.status = 'accepted';
    auction.status = 'accepted';
  } else if (type === 'rejection') {
    proposal.status = 'rejected';
  } else {
    return res.status(405).send({ message: 'Invalid status' });
  }
  await proposal.save();
  await auction.save();
}

async function claimTickets(req, res) {
  const { proposal_id } = req.params;
  const user_id = getUserId(req);
  await connectDB();
  const user = await User.findById(user_id);
  if (!user.isAdmin) {
    return res.status(403).json({ error: 'Admin required' });
  }
  const proposal = await Auction.findOne({ proposal_id });
  if (!proposal) {
    return res.status(404).send({ message: 'Proposal not found' });
  }
  if (proposal.status !== 'accepted') {
    return res.status(405).send({ message: 'Proposal must be accepted' });
  }
  const {
    departure_airport, arrival_airport, departure_time, airline,
  } = proposal;
  let { flight_id } = proposal;
  let flight;
  if (!flight_id) {
    flight = await Flight.findOne({
      departure_airport_id: departure_airport,
      arrival_airport_id: arrival_airport,
      departure_time,
      airline,
    });
  }
  if (!flight) {
    flight = new Flight({
      departure_airport_id: departure_airport,
      arrival_airport_id: arrival_airport,
      departure_time,
      airline,
    });
    await flight.save();
  }
  flight_id = flight._id;
  const request = new Request({
    user_id: user.user_id,
    flight_id,
    departure_airport,
    arrival_airport,
    departure_time,
    validationStatus: 'accepted',
    quantity: proposal.quantity,
  });
  await request.save();
  user.requests.push(request._id);
  await user.save();
  proposal.status = 'claimed';
}

async function getAuction(req, res) {
  const { auction_id } = req.params;
  await connectDB();
  const auction = await Auction.findOne({ auction_id });
  if (!auction) {
    return res.status(404).send({ message: 'Auction not found' });
  }
  res.status(200).json(auction);
}

module.exports = {
  getExternalOffers,
  getSentOffers,
  getRecievedProposals,
  getSentProposals,
  postOffer,
  sendProposal,
  sendAnswer,
  handleAnswer,
  claimTickets,
  addAuction,
  getAuction,
};
