const axios = require('axios');

const { API_URL } = process.env;

async function handleRequest(msg) {
  const data = msg.toString();
  const jsonData = JSON.parse(data);
  const groupId = parseInt(jsonData.group_id, 10);
  if (groupId !== 1) {
    axios.put(`${API_URL}/broker_request`, jsonData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        console.log('Request sent to API:', response.data);
      })
      .catch((error) => {
        try {
          if (error.status === 404) {
            console.log('Flight not found in database', error.response.data);
          }
        } catch (e) {
          console.error('Error:', error);
        }
        // console.log('> Error:', error.response.data);
      });
  }
  // console.log('NO PASA NADA');
}

module.exports = handleRequest;
