const express = require('express');
const logger = require('morgan');
const cors = require('cors');

const {
  createRequest, getUserRequests, validateRequest, addRequest,
  getTransactionStatus,
} = require('./controllers/requests');

const {
  addFlight, getAllFlights, getFlightById,
} = require('./controllers/flights');

const {
  createUser, getUser,
} = require('./controllers/users');

const {
  getUserRecommendations, startRecommendation,
} = require('./controllers/recommendations');

const { getReservations, buyReservation } = require('./controllers/reservations');

const {
  getExternalOffers,
  getSentOffers,
  getRecievedProposals,
  postOffer,
  sendProposal,
  sendAnswer,
  handleAnswer,
  claimTickets,
  getSentProposals,
  addAuction,
  getAuction,
} = require('./controllers/auctions');

const { FRONTEND_URL } = process.env;

const app = express();

// const use_cors = false;
// if (use_cors) {
app.use(cors({ origin: FRONTEND_URL, methods: 'GET,PUT,POST' }));
//   ));
// } else {
// }
// app.use(cors());
// app.use(cors({
//   origin: 'https://web.javieranecochea.me',
//   methods: ['GET', 'POST', 'PUT'],
//   credentials: true,
// }));

// app.use(cors());

app.use(logger('dev'));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World! 5');
});

// add flight from the broker
app.post('/flight', addFlight);

// get all flights
app.get('/flights', getAllFlights);

// get flight by id
app.get('/flights/:identifier', getFlightById);

// create user
app.post('/user', createUser);

// add broker requests
app.put('/broker_request', addRequest);

// handle request validation from broker
app.post('/validation', validateRequest);

// get user by id
app.get('/user/:id/:password', getUser);

app.get('/transaction/:token', getTransactionStatus);

// app.use(checkJWT); // CHECK JWT middleware

// create request from UI and start recommendation process
app.post('/request', createRequest);

// get user requests
app.get('/requests', getUserRequests);

// get user recommendations
app.get('/recommendations', getUserRecommendations);

// TEMPORAL
app.post('/startRecommendation', startRecommendation);

app.get('/reservations', getReservations);

app.post('/reservation/:request_id', buyReservation);

// app.post('/auctions/offer', addOffer);

// app.post('/auctions/proposal', addProposal);

// optional page, count in query
app.get('/auctions/:auction_id', getAuction);

app.get('/auctions', getExternalOffers);

app.get('/offers/sent', getSentOffers);

app.get('/proposals/:auction_id', getRecievedProposals);

app.get('/sent/proposals', getSentProposals);

app.post('/auctions/offer/:request_id', postOffer);

app.post('/auctions/proposal/:auction_id/:request_id', sendProposal);

// auction_id and proposal_id in body
app.post('/auctions/answer/:type', sendAnswer);

// data in body
app.post('/auctions/broker/auction', addAuction);

// auction_id and proposal_id in body
app.post('/auctions/broker/answer/:type', handleAnswer);

app.post('/auctions/claim/:proposal_id', claimTickets);

module.exports = app;
