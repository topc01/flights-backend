// const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../utils/dbConnection');

// const { WORKER_URL } = process.env;

exports.createUser = async (req, res) => {
  const {
    rut, name, lastname, email, password,
  } = req.body;
  if (!rut || !name || !lastname || !email || !password) {
    return res.status(400).send('Missing required fields');
  }
  await connectDB();
  const newUser = new User(req.body);
  try {
    await newUser.save();
  } catch (error) {
    const { code } = error;
    const item = Object.keys(error.keyValue)[0];
    return res.status(409).json({ code, item, error: error.message });
  }
  const user_id = newUser._id;
  res.status(201).json({ user_id });
};

// GET /user
exports.getUser = async (req, res) => {
  const { id } = req.params;
  await connectDB();
  const user = await User.findOne({ email: id }).exec();
  if (user) {
    // console.log('> User found:', user);
    res.status(200).json({
      id: user._id,
      password: user.password,
    });
  } else {
    // console.log('> User not found');
    res.status(404).json({ msg: 'User not in database' });
  }
};
