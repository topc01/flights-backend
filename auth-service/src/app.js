const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const { signup, login, validation } = require('./controllers/auth');

const { FRONTEND_URL } = process.env;

const app = express();

// app.use(cors());

app.use(cors({
  origin: FRONTEND_URL,
}));

app.use(logger('dev'));
app.use(express.json());
app.post('/signup', signup);
app.post('/login', login);
app.patch('/validation', validation);

module.exports = app;
