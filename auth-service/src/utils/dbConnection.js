const { MongoClient } = require('mongodb');

const { MONGODB_URL } = process.env;

async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    // console.log('Connected to MongoDB');
    return client.db();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

module.exports = connectToMongoDB;
