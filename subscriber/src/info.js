const axios = require('axios');

const { API_URL } = process.env;

async function handleFlightInfo(msg) {
  const data = msg.toString();
  const jsonData = JSON.parse(data.slice(1, -1));
  const flightData = JSON.parse(jsonData.flights.replace(/\\"/g, '"'))[0];
  const departure_airport_name = flightData.departure_airport.name;
  const departure_airport_id = flightData.departure_airport.id;
  const departure_time = flightData.departure_airport.time;
  const arrival_airport_name = flightData.arrival_airport.name;
  const arrival_airport_id = flightData.arrival_airport.id;
  const arrival_time = flightData.arrival_airport.time;
  const {
    duration, airplane, airline, airline_logo,
  } = flightData;
  const {
    carbonEmission, price, currency, airlineLogo,
  } = jsonData;
  const available_seats = 90;

  const flight = {
    departure_airport_name,
    departure_airport_id,
    departure_time,
    arrival_airport_name,
    arrival_airport_id,
    arrival_time,
    duration,
    airplane,
    airline,
    airline_logo,
    price,
    carbonEmission,
    currency,
    airlineLogo,
    available_seats,
  };

  axios.post(`${API_URL}/flight`, flight, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(() => {
      // console.log('Flight info sent to API');
    })
    .catch((error) => {
      console.error('Error:', error.response.status);
    });
}

module.exports = handleFlightInfo;
