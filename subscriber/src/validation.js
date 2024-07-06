// eslint-disable-next-line import/order, import/no-unresolved
const { MongoClient } = require('mongodb');
// eslint-disable-next-line import/order, import/no-unresolved
const mongoose = require('mongoose');
// eslint-disable-next-line import/no-unresolved
const { UUID } = require('uuid-class');

const { MONGODB_URL } = process.env;

async function handleValidation(msg) {
  const data = msg.toString();
  const jsonData = JSON.parse(data);
  console.log('[Validator] Received:', jsonData);
  await new Promise((resolve) => { setTimeout(resolve, 5000); });
  const {
    request_id, valid,
  } = jsonData;
  const reqUUID = new UUID(request_id);
  const client = new MongoClient(MONGODB_URL);
  await client.connect();
  const db = client.db();
  const requests = db.collection('requests');
  const request = await requests.findOne({
    $or: [
      { request_id: reqUUID },
      { request_id },
    ],
  });
  console.log('Request:', request);
  if (!request) {
    console.log('[Validator] Request not found:', request_id);
    return;
  }
  request.validationStatus = valid ? 'accepted' : 'rejected';
  try {
    await request.save();
  } catch (error) {
    const filter = {
      $or: [
        { request_id: reqUUID },
        { request_id },
      ],
    };
    const update = {
      $set: {
        validationStatus: valid ? 'accepted' : 'rejected',
      },
    };
    const options = {
      new: true, // Return the modified document after update
    };
    const updatedRequest = await requests.findOneAndUpdate(filter, update, options);
    if (!updatedRequest) {
      console.log('[Validator] Request not found:', request_id);
      return;
    }
    console.log('[Validator] Request updated successfully:', updatedRequest);
  }
  // await requests.updateOne(
  //     {
  //         $or: [
  //             { request_id: reqUUID },
  //             { request_id },
  //         ],
  //     },
  //     { $set: { validationStatus: valid ? 'accepted' : 'rejected' } },
  // );
  console.log('[Validator] Request updated:', request.validationStatus);
  if (!valid) {
    console.log('Request rejected:', request.request_id);
    const flight_id = request.flight;
    const flights = db.collection('data');
    const obj_id = new mongoose.Types.ObjectId(flight_id);
    const [flight] = await flights.find({ _id: obj_id }).toArray();
    console.log('Flight', flight_id, 'seats', flight.available_seats);
    flight.available_seats += request.quantity;
    try {
      await flight.save();
    } catch (error) {
      console.log('Flight didnt save');
    }
    console.log('Flight updated:', flight._id, flight.available_seats);
  }

  /*
    const request = await requests.findOne({
        $or: [
            { request_id: reqUUID },
            { request_id },
        ],
    });
    if (!request) {
        return;
    }
    if (valid) {
        console.log('Request accepted:', request.request_id);
    } else {
        const flights = db.collection('flights');
        const flight = await flights.findOne({ flight_id: request.flight_id });
        if (!flight) {
            return;
        }
        const seats = flight.available_seats + request.quantity;

        const obj_id = new mongoose.Types.ObjectId(request.flight_id);
        await flights.updateOne({
            _id: obj_id,
        }, {
            $set: { available_seats: seats },
        });
        // console.log('Flight updated:', flight.flight_id, seats);
    }

    // axios.post(`${API_URL}/validation`, jsonData, {
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    // })
    //     .then((response) => {
    //         // console.log('Validation sent to API:', response.data);
    //     })
    //     .catch((error) => {
    //         console.error('Error:', error);
    //     });
    */
}

module.exports = handleValidation;
