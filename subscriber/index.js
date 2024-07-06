const mqtt = require('mqtt');
const handleFlightInfo = require('./src/info');
const handleRequest = require('./src/request');
const handleValidation = require('./src/validation');
const handleAuction = require('./src/auction');

const {
  MQTT_BROKER_URL, MQTT_BROKER_USER, MQTT_BROKER_PWD,
} = process.env;

// console.log('Attempting to connect to MQTT broker...');

const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
  username: MQTT_BROKER_USER,
  password: MQTT_BROKER_PWD,
});

mqttClient.on('connect', () => {
  // console.log('Connected to MQTT broker');
  mqttClient.subscribe('flights/info'); // Replace 'topic' with your MQTT topic
  mqttClient.subscribe('flights/validation');
  mqttClient.subscribe('flights/requests');
});

mqttClient.on('message', async (topic, message) => {
  try {
    if (topic === 'flights/info') {
      // console.log('Received flight info');
      await handleFlightInfo(message);
    }
    if (topic === 'flights/validation') {
      // console.log('Received request validation');
      await handleValidation(message);
    }
    if (topic === 'flights/requests') {
      // console.log('Received request');
      await handleRequest(message);
    }
    if (topic === 'flights/auctions') {
      // console.log('Received auction');
      await handleAuction(message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
});
