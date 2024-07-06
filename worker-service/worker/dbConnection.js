const { MongoClient } = require('mongodb');

const { MONGODB_URL } = process.env;

async function dbConnection() {
  try {
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    return client.db();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

module.exports = dbConnection;
