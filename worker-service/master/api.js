const app = require('./src/app');

const port = process.env.MASTER_PORT;

app.set('trust proxy', true);

app.listen(port, () => {
  console.log(`Job manager server is running on http://localhost:${port}`);
  console.log(`For the UI, open http://localhost:${port}/admin/queues`);
});
