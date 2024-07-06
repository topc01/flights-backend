const app = require('./src/app');

const { PUBLISHER_PORT } = process.env;

app.listen(PUBLISHER_PORT, () => {
    console.log(`Publisher waiting on port ${PUBLISHER_PORT}`);
});
