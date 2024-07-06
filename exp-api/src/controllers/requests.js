const geoip = require('geoip-lite');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { format } = require('date-fns');
const mongoose = require('mongoose');
// const { MongoClient } = require('mongodb');
const connectDB = require('../utils/dbConnection');
const Flight = require('../models/Flight');
const User = require('../models/User');
const Request = require('../models/Request');
const trx = require('../utils/trx');
const mailer = require('../utils/mailer');
const { startRecommendation } = require('./recommendations');
// const createTransaction = require('../utils/trx');

const { JWT_SECRET, PUBLISHER_PORT } = process.env;
// const { MONGODB_HOST, MONGODB_PORT, MONGODB_DATABASE } = process.env;

// const mongoURL = `mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`;
// const mongoURL = 'mongodb://mongo:27017/flightcol';

// const { JWT_SECRET } = process.env;
const { WORKER_URL } = process.env;
const { REDIRECT_URL } = process.env;

// POST /request
exports.createRequest = async (req, res) => {
  /*
  Para solicitudes desde la UI, se espera un body con el formato:
  {
    flight_id,
    quantity,
  }
  request nuestras en la db con el formato:
  {
    request_id: 'uuid',
    group_id: '',
    departure_airport: 'SCL',
    arrival_airport: 'MIA',
    departure_time: '2021-10-10 10:00',
    datetime: '',
    deposit_token: '',
    quantity: 1,
    seller: 0,
    NUEVAS:
    flight: ref,
    geoLocation: {},
    user: ref,
  }
  */
  try {
    console.log('[Create request] recieved:', req.body);
    console.log('[Create request]:', req);
    // const token0 = req.headers.authorization || req.header('Authorization');
    const token = req.body.headers.Authorization;
    console.log(token);
    const user_id = jwt.verify(token, JWT_SECRET).subject;

    // get flight_id and quantity from request body
    const { flight_id, quantity } = req.body.body;
    if (!flight_id || !quantity) {
      res.status(400).json({ error: 'Bad Request: missing flight_id or quantity' });
    }

    // siempre da la misma ciudad
    const geo = geoip.lookup(req.ip);
    if (!geo) {
      console.log('[Create request] Error getting geo location for IP:', req.ip);
    }
    const userLocation = {
      city: geo ? geo.city : 'Santiago',
      country: geo ? geo.country : 'CL',
      ip: req.ip,
      lat: geo ? geo.ll[0] : -33.4489,
      lon: geo ? geo.ll[1] : -70.6693,
    };

    // mongoose.connect(mongoURL);

    // const db = mongoose.connection;
    // db.on('error', console.error.bind(console, 'connection error:'));
    // db.once('open', () => {
    //   console.log('Connected to MongoDB');
    // });
    await connectDB();

    console.log('[Create request] flight_id:', flight_id);
    // vuelo de la solicitud
    const flight = await Flight.findById(flight_id);
    if (!flight) {
      console.log('[Create request] flight not found:');
      return res.status(404).json({ error: 'Flight not found' });
    }
    // actualiza los asientos disponibles
    flight.available_seats -= quantity;
    try {
      await flight.save();
    } catch (error) {
      console.error('[Create request] Flight did not save', error);
    }

    // encuentra al usuario
    const user = await User.findById(user_id);

    console.log('>>> flight departure time:', flight.departure_time);
    const formatted = format(new Date(flight.departure_time), 'yyyy-MM-dd HH:mm');
    console.log('>>> formatted departure_time:', formatted);

    const request = {
      // group_id: '1', // default
      departure_airport: flight.departure_airport_id,
      arrival_airport: flight.arrival_airport_id,
      departure_time: formatted, // formato de fecha
      quantity,
      flight: flight._id,
      flight_id,
      userLocation,
      user: user_id,
    };

    // instanciar solicitud
    const newRequest = new Request(request);

    // start transbank transaction
    console.log(trx);
    // TODO: ESTE URL SE DEBE CAMBIAR POR LA DEL FRONTEND EN PRODUCCI'ON
    // TODO: ... AL COMPLETAR LA TRANSACCI'ON EN TRANSBANK
    // TODO: ... ESTE DIRIGE A ESTE URL CON UN QUERY PARAMETER DE LA TRANSACCI'ON
    // TODO: ... DE ESTA FORMA DEBE SER: REDIRECT_URL?token_ws=<token>
    // const REDIRECT_URL1 = 'http://localhost:5173/transaction';
    console.log('[CHECK ENV VARIABLE] REDIRECT_URL:', REDIRECT_URL);
    let newRequestId = newRequest.getData().request_id;
    if (newRequestId.length > 26) {
      newRequestId = newRequestId.slice(0, 26);
    }
    const transactionResponse = await trx.tx.create(
      newRequestId,
      'FlightsUc S.A.',
      flight.price * quantity,
      REDIRECT_URL,
    );
    console.log(transactionResponse);

    // add deposit token from response to request
    newRequest.deposit_token = transactionResponse.token;
    console.log('[Added a new WebpayTOKEN to the flight request] token:', transactionResponse.token);

    // crea la solicitud
    try {
      await newRequest.save();
    } catch (error) {
      console.error('[Create request] Request did not save:', error);
    }
    console.log('[Created request] new request:', newRequest);

    // agrega la solicitud al usuario
    user.requests.push(newRequest._id);
    try {
      await user.save();
    } catch (error) {
      console.error('[Create request] User did not save:', error);
    }

    const request_data = newRequest.getData();

    const departureTime = request_data.departure_time;

    const date = departureTime.toISOString().split('T')[0];
    const hour_min_sec = departureTime.toISOString().split('T')[1].split('.')[0];
    const hour = hour_min_sec.split(':')[0];
    const min = hour_min_sec.split(':')[1];

    request_data.departure_time = `${date} ${hour}:${min}`;
    // console.log('[Create request] request data:', request_data);
    console.log('Request added to be sent to publisher:', request_data);

    // envia la solicitud al publisher
    // DEJAR COMO VARIABLE DE ENTORNO
    axios.post(`http://publisher:${PUBLISHER_PORT}/request`, request_data)
      .then((publisher_response) => {
        if (publisher_response.status !== 200) {
          console.error('Error:', publisher_response);
          return res.status(500).send('Error');
        }
        console.log('Request sent to publisher');
        res.status(202).json({
          request_id: newRequest.request_id,
          transaction_token: transactionResponse.token,
          payment_url: transactionResponse.url,
        });
        setImmediate(() => {
          const data = {
            user_id,
            arrival_time: flight.arrival_time,
            arrival_airport_id: request_data.arrival_airport,
            userLocation,
          };
          startRecommendation(data);
        });
      })
      .catch(() => res.status(500).send('Error'));
  } catch (error) {
    console.error('Error creating request:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /requests
exports.getUserRequests = async (req, res) => {
  /*
  */
  try {
    const token = req.headers.authorization || req.header('Authorization');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user_id = jwt.verify(token, JWT_SECRET).subject;

    await connectDB();

    // encuentra al usuario
    const user = await User.findById(user_id);

    // const requestsIds = user.requests;
    // const client = new MongoClient(mongoURL);
    // await client.connect();
    // const db = client.db();
    // if (!requestsIds) return res.status(507).send('Requests not found');

    // const requests = await Request.find({ _id: { $in: requestsIds } });
    const requests = await user.getRequests();
    // console.log('[Get users requests] requests:', requests);
    // console.log('[Get users requests] requests:', requests);
    const data = await Promise.all(requests.map(async (request) => {
      const flight_id = request.flight;
      const flight_info = await Flight.findById(flight_id);
      const doc = { ...request };
      const ret = { ...(doc._doc), flight_info };
      return ret;
    }));

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Unauthorized', msg: error.message });
  }
};

// PUT /request
exports.addRequest = async (req, res) => {
  /*
  Para solicitudes recibidas desde el broker con el formato:
  {
    request_id: 'uuid',
    group_id: '',
    departure_airport: 'SCL',
    arrival_airport: 'MIA',
    departure_time: '2021-10-10 10:00',
    datetime: '',
    deposit_token: '',
    quantity: 1,
    seller: 0,
  }
  */
  // console.log('[Adding request] recieved:', req.body);
  const request = req.body;
  const { request_id } = request;
  const existingRequest = await Request.findOne({ request_id });
  if (existingRequest) {
    return res.status(409).json({ error: 'Request already exists' });
  }
  const {
    departure_airport, arrival_airport, departure_time, quantity,
  } = request;

  if (!departure_airport || !arrival_airport || !departure_time || !quantity) {
    return res.status(400).json({ error: 'Bad Request' });
  }

  const flight = await Flight.findOne({
    $and: [
      {
        $or: [
          { departure_airport_id: departure_airport },
          { 'flights.0.departure_airport.id': departure_airport },
        ],
      },
      {
        $or: [
          { arrival_airport_id: arrival_airport },
          { 'flights.0.arrival_airport.id': arrival_airport },
        ],
      },
    ],
  });

  // console.log('[Adding request] Flights found:', flights);

  // let error_flight = null;
  // const filtered_flights = flights.filter((flight) => {
  //   try {
  //     console.log('[Adding request] Flight:', flight.departure_time);
  //     const flightDate = new Date(flight.departure_time).toISOString();
  //     const year_month_day = flightDate.split('T')[0];
  //     const hour = flightDate.split('T')[1].split('.')[0].split(':')[0];
  //     const min = flightDate.split('T')[1].split('.')[0].split(':')[1];
  //     const formattedDate = `${year_month_day} ${hour}:${min}`;
  //     console.log('[Adding request] Formatted date:', formattedDate);
  //     return formattedDate === departure_time;
  //   } catch (error) {
  //     error_flight = flight;
  //     console.log('[Adding request] Error with date parsing:');
  //     console.log('                 original:', flight.departure_time);
  //     console.log('                 ISO format:', new Date(flight.departure_time).toISOString());
  //     const flightDate = new Date(flight.departure_time).toISOString();
  //     console.log('                 YYYY-MM-DD:', flightDate.split('T')[0]);
  //     console.log('                 HH:MM:', flightDate.split('T')[1].split('.')[0].split(':').slice(0, 1));
  //     console.error('[Adding request] Error filtering flights:', error);
  //     return false;
  //   }
  // });

  // let flight;
  // console.log('[Adding request] Flights filtered:', filtered_flights);
  // if (filtered_flights.length === 1) {
  //   flight = filtered_flights[0]._id;
  //   console.log('[Adding request] Flight found:', flight);
  // } else if (filtered_flights.length === 0) {
  //   console.log('[Adding request] No flights found');
  //   flight = error_flight;
  //   return res.status(404).json({ error: 'Flight not found' });
  // } else {
  //   console.log('[Adding request] Error with flights found');
  //   return res.status(500).json({ error: 'Multiple flights found' });
  // }

  flight.available_seats -= quantity;
  try {
    await flight.save();
  } catch (error) {
    console.error('[Adding request] Error saving flight:', error);
  }

  request.flight = flight;

  const newRequest = new Request(request);
  try {
    await newRequest.save();
    console.log('[Adding request] Request added:', newRequest);
  } catch (error) {
    console.error('[Adding request] Error adding request:', error);
  }
};

exports.validateRequest = async (req, res) => {
  console.log('[Validating request] recieved:', req.body);
  const {
    request_id, group_id, seller, valid,
  } = req.body;
  if (!request_id || !group_id || !seller || !valid) {
    console.log('[Validating request] Data missing');
    return res.status(400).json({ error: 'Bad Request' });
  }
  // const request = Request.findById(request_id);
  const request = Request.find({ request_id });
  if (!request) {
    console.log('[Validating request] Request not found');
    res.status(404).json({ error: 'Request not found' });
  }
  if (valid) {
    request.validationStatus = 'accepted';
  } else {
    request.validationStatus = 'rejected';

    const query = {
      departure_airport_id: request.departure_airport,
      arrival_airport_id: request.arrival_airport,
      departure_time: request.departure_time,
    };
    mongoose.connect(WORKER_URL);
    const flight = await Flight.findOne(query).exec();

    flight.available_seats += request.quantity;
    await flight.save();
    console.log('[Validating request] Flight updated:', flight);
  }
  await request.save();
  console.log('[Validating request] Request updated:', request);
};

exports.getTransactionStatus = async (req, res) => {
  try {
    console.log('[Getting transaction status from Transbank API]');
    const { token } = req.params;
    if (!token) {
      console.log('[Getting transaction status] Missing token');
      return res.status(400).json({ error: 'Bad Request' });
    }

    const transactionCommit = await trx.tx.commit(token);
    const transactionStatus = await trx.tx.status(token);
    console.log('[Getting transaction status] COMMIT:', transactionCommit);
    console.log('[Getting transaction status] STATUS:', transactionStatus);

    // search request by deposit_token
    const request = await Request
      .findOne({ deposit_token: token })
      .exec();
    console.log('[Getting request linked with transaction] Request:', request);
    // update request and change its validationStatus to 'accepted'
    if (transactionStatus.status === 'AUTHORIZED') {
      request.validationStatus = 'accepted';
    } else if (transactionStatus.status === 'FAILED') {
      request.validationStatus = 'rejected';
    }
    await request.save();
    console.log('[Updated request with transaction status] Request:', request);
    // send email to user
    const user = await User.findById(request.user);
    console.log('[Getting transaction status: FOUND USER] User:', user);
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
    if (transactionStatus.status === 'AUTHORIZED') {
      mailer.sendOrderConfirmationEmail(mailOptions);
    }

    // envia la solicitud al publisher
    console.log('[SENDING LOCAL REQUEST VALIDATION TO PUBLISHER]');
    const formattedRequestForBroker = {
      request_id: request.request_id,
      group_id: request.group_id,
      seller: request.seller,
      valid: transactionStatus.status === 'AUTHORIZED',
    };
    axios.post(`http://publisher:${PUBLISHER_PORT}/propagate_validation`, formattedRequestForBroker);

    return res.status(200).json({ transactionCommit, transactionStatus });
  } catch (error) {
    console.error('[Getting transaction status] Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
