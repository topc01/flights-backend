// eslint-disable-next-line no-use-before-define
module.exports = handleAuction;

const axios = require('axios');

const { API_URL } = process.env;

async function handleAuction(message) {
  const data = message.toString();
  const jsonData = JSON.parse(data);
  const { type } = jsonData;
  let route = type;
  if (type === 'acceptance' || type === 'rejection') {
    route = `answer/${type}`;
  } else {
    route = 'auction';
  }

  axios.post(`${API_URL}/auctions/broker/${route}`, jsonData, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(() => {
      console.log('Auction sent to API');
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}
