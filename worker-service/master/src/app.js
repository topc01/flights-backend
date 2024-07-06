const { Queue } = require("bullmq");
const debug = require('debug');
const serverLog = debug('express:server');
const express = require('express');
const logger = require('morgan');

const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");

const {
  REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
} = process.env;
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

const queue = new Queue("recommendation", {
  connection: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  },
});

const {} = createBullBoard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter: serverAdapter,
});

const app = express();

app.use(logger('dev'));

app.use(express.json());

app.use("/admin/queues", serverAdapter.getRouter());

app.get('/heartbeat', (req, res) => {
  serverLog('[heartbeat] Received heartbeat');
  res.send(true);
});

app.post('/job', async (req, res) => {
  serverLog(`[job post] Received job post with data ${JSON.stringify(req.body)}`);

  const data = req.body;

  if(!data.candidateFlights || !data.userLocation || !data.userId)
  {
    serverLog('[job post] Missing data');
    return res.status(400).json({ error: 'Missing data' });
  }

  const job = await queue.add("recommendation", data, { removeOnComplete: 100000, removeOnFail: 500000 },);
  
  if (!job.id) {
    serverLog('[job post] Job id not found');
    return res.status(500).json({ error: 'Internal Server Error', reason });
  }

  serverLog(`[job post] Job id ${job.id} sent to queue`);
  res.status(201).json({ id: job.id });
});

app.get('/job/:id', async (req, res) => {
  serverLog('[job get] Received job get');

  const job = await queue.getJob(req.params.id);
  if (!job) {
    serverLog('[job get] Job not found');
    return res.status(404).json({ error: 'Job not found' });
  }

  serverLog(`[job get] Job found: ${job.id} with data ${job.data} and return value ${job.returnvalue}`);
  serverLog(`[job get] Job status: ${job.status}`);
  res.json(job.data);
})

module.exports = app;
