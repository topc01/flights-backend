// import mongoose from "mongoose"
const mongoose = require('mongoose');
// const { MongoClient } = require('mongodb');

// const { MONGODB_HOST, MONGODB_PORT, MONGODB_DATABASE } = process.env;
// const mongoURL = `mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`;
const mongoURL = 'mongodb://mongo:27017/flightcol';
const { MONGODB_URL } = process.env;
// async function dbConnection() {
//   try {
//     const client = new MongoClient(mongoURL);
//     await client.connect();
//     // console.log('Connected to MongoDB');
//     return client.db();
//   } catch (error) {
//     console.error('Error connecting to MongoDB:', error);
//     throw error;
//   }
// }

// module.exports = dbConnection;

const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    console.log('🟢 Already connected to database.');
    return true;
  }

  if (!mongoURL) {
    console.error('🔴 mongoURL is not defined.');
    return false;
  }

  try {
    await mongoose.connect(MONGODB_URL);
    console.log('🟢 Successfully connected to MongoDB.');
    return true;
    // const client = new MongoClient(MONGODB_URL);
    // await client.connect();
    // // console.log('Connected to MongoDB');
    // return client.db();
  } catch (error) {
    console.error('🔴 Failed to connect to MongoDB:', error);
    return false;
  }
};

module.exports = connectDB;
