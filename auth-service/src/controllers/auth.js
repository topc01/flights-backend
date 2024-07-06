// const { Router } = require('express');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
// eslint-disable-next-line import/order, import/no-unresolved
const axios = require('axios');
const connectToMongoDB = require('../utils/dbConnection');

const { JWT_SECRET, JWT_EXPIRATION } = process.env;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

const { API_URL } = process.env;

exports.signup = asyncHandler(async (req, res) => {
  const {
    rut, name, lastname, email, password,
  } = req.body;
  // console.log(password);
  // console.log(API_HOST + API_PORT);
  const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
  const userData = {
    rut,
    name,
    lastname,
    email,
    password: hashedPassword,
  };
  // let user_id;
  await axios.post(`${API_URL}/user`, userData)
    .then((api_response) => {
      if (api_response.status === 201) {
        const { user_id } = api_response.data;
        const token = jwt.sign({
          subject: user_id,
          expiresIn: JWT_EXPIRATION,
        }, JWT_SECRET);
        return res.status(201).json({
          access_token: token,
        });
      }
      // console.log('Error obteniendo id del usuario');
    })
    .catch((error) => {
      if (error.response.status === 409) {
        return res.status(409).send(`${error.response.data.item} already in use`);
      }
      return res.status(507).send('Error creando usuario');
    });
});

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send('Missing required fields');
    }

    const db = await connectToMongoDB();
    const collection = db.collection('users');
    const user = await collection.findOne({ email });
    // console.log(1);
    if (!user) {
      // console.log('DB could not find user');
      return res.status(404).send('User not found');
    }
    // console.log('User found:', user);

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(403).send('Invalid credentials');
    }
    // console.log('User: id', user._id.toString());
    const token = jwt.sign({
      subject: user._id.toString(),
      expiresIn: JWT_EXPIRATION,
    }, JWT_SECRET);
    // console.log(3);
    return res.status(200).json({
      name: user.name,
      lastname: user.lastname,
      access_token: token,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    if (error.response.status === 404) {
      return res.status(404).send('User not found');
    }
    return res.status(499).send('Error logging in');
  }
};

exports.validation = asyncHandler(async (req, res) => {
  const token = req.headers.authorization || req.header('Authorization');
  if (!token) {
    return res.status(400).send('Missing token');
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.subject;
    const db = await connectToMongoDB();
    const collection = db.collection('users');
    const user = await collection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).send('User not found');
    }
    return res.status(200);
  } catch (error) {
    console.error('Error validating token:', error);
    return res.status(401).send('Invalid token');
  }
});
