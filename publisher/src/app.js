const mqtt = require('mqtt');
// const axios = require('axios');
const express = require('express');
const logger = require('morgan');

const {
    MQTT_BROKER_URL, MQTT_BROKER_USER, MQTT_BROKER_PWD,
} = process.env;

const app = express();

app.use(logger('dev'));

const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
    username: MQTT_BROKER_USER,
    password: MQTT_BROKER_PWD,
});

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe('flights/requests'); // Replace 'topic' with your MQTT topic
});

app.use(express.json());

app.post('/request', async (req, res) => {
    const { body } = req;
    console.log('Received request:', body);

    mqttClient.publish('flights/requests', JSON.stringify(body), (error) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).send('Error');
        } else {
            console.log('Request sent to broker');
            res.status(200).send('Request sent to broker');
        }
    });
});


app.post('/propagate_validation', async (req, res) => {
    const { body } = req;
    console.log('[Received request for VALIDATION PROPAGATION]:', body);

    mqttClient.publish('flights/validation', JSON.stringify(body), (error) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).send('Error');
        } else {
            console.log('[VALIDATION PROPAGATION] Request sent to broker');
            res.status(200).send('Request sent to broker');
        }
    });
});

app.post('/offer', async (req, res) => {
    const { body } = req;
    console.log('Received offer:', body);
    const data = JSON.stringify(body);

    data.group_id = 1;
    data.type = 'offer';

    mqttClient.publish('flights/auctions', data, (error) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).send('Error');
        } else {
            console.log('Offer sent to broker');
            res.status(200).send('Offer sent to broker');
        }
    });
});

app.post('/auction', async (req, res) => {
    const { body } = req;
    console.log('Received answer:', body);
    const data = JSON.stringify(body);

    mqttClient.publish('flights/auctions', data, (error) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).send('Error');
        } else {
            console.log('Answer sent to broker');
            res.status(200).send('Answer sent to broker');
        }
    });
});

module.exports = app;
