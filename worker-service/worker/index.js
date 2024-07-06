const { Worker, Job } = require("bullmq");
const debug = require('debug');
const serverLog = debug('express:server');
const haversine = require('haversine-distance');
const connectToMongoDB = require('./dbConnection');


const apiKey = process.env.GEOCODER_API_KEY;
const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
} = process.env;

/**
 *
 * @param {Job} job
 */
async function recommend(job) {
  serverLog(`Worker processing job ${job.id}`);
  const { data } = job;
  const { candidateFlights, userLocation, userId } = data;

  const ponderatedFlights = []

  const userCoord = { latitude: userLocation.lat, longitude: userLocation.lon }

  for (const flight of candidateFlights) {
    try {

      const flightLocationsResponse = await fetch(`https://geocode.maps.co/search?q=${flight.arrival_airport_id}&api_key=${apiKey}`);
      const flightLocations = await flightLocationsResponse.json();
      const flightLocation = flightLocations[0];


      serverLog(`Flight arrival name: ${flightLocation.display_name}`);
      const flightCoord = { latitude: flightLocation.lat, longitude: flightLocation.lon }

      const distance = haversine(userCoord, flightCoord);

      ponderatedFlights.push([ distance / flight.price, flight ]); 
      serverLog(`Ponderation: ${distance / flight.price}`); 
    } catch (error) {
      console.log(error);
    }
    // 1 Request per second
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  }

  ponderatedFlights.sort((a, b) => b[0] - a[0]);

  const flightIds = []
  for (const flight of ponderatedFlights.slice(0, 3)) {
    serverLog(`Flight: ${JSON.stringify(flight[1])}`);
    flightIds.push(flight[1]._id);
    serverLog(`Flight ponderation: ${flight[0]}`)
  }

  const recommendation = {
    flightIds: flightIds,
    createdAt: new Date(),
    userId: userId,
  }

  const db = await connectToMongoDB();
  const collection = db.collection('recommendations');
  await collection.insertOne(recommendation);

  serverLog(`Recommendation for user ${userId} created`);
  return recommendation;
}

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
};

const worker = new Worker("recommendation", recommend, {
  autorun: false,
  connection,
});

console.log("Worker Listening to Jobs...");

worker.on("completed", (job, returnvalue) => {
  serverLog(`Worker completed job ${job.id}`);
});

// Callback on failed jobs
worker.on("failed", (job, error) => {
  serverLog(`Worker completed job ${job.id} with error ${error}`);
  // Do something with the return value.
});

// Callback on error of the worker
worker.on("error", (err) => {
  // log the error
  serverLog(err);
});

worker.run();

// To handle gracefull shutdown of consummers
async function shutdown() {
  console.log("Received SIGTERM signal. Gracefully shutting down...");

  // Perform cleanup or shutdown operations here
  await worker.close();
  // Once cleanup is complete, exit the process
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
