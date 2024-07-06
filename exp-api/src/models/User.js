const { Schema, model } = require('mongoose');
// const { randomUUID } = require('crypto');

const UserSchema = new Schema({
  // user_id: {
  //     type: Schema.Types.ObjectId,
  //     unique: true
  // },
  rut: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  requests: [{ type: Schema.Types.ObjectId, ref: 'Request' }],
  isAdmin: { type: Boolean, default: false },
  refresh_token: { type: String, default: '' },
  access_token: { type: String, default: '' },
}, {
  timestamps: true,
  methods: {
    async getRequests() {
      await this.populate('requests');
      return this.requests;
    },
  },
});

UserSchema.index({ email: 1, sweepstakes_id: 1 }, { unique: true });

const User = model('User', UserSchema, 'users');

module.exports = User;
