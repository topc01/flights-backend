const app = require('./src/app');

const { API_PORT, API_URL } = process.env;

app.set('trust proxy', true);

// Start the Express server
app.listen(API_PORT, () => {
  console.log(`API server is running on ${API_URL}`);
});
