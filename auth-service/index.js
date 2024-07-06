const dotenv = require('dotenv');
const app = require('./src/app');

dotenv.config();

const { AUTH_SERVICE_PORT } = process.env;

app.listen(AUTH_SERVICE_PORT, () => {
  // console.log(`Authentication service listening on port ${AUTH_SERVICE_PORT}`);
});
