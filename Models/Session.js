const mongoose = require('mongoose');
const normalize = require('normalize-mongoose');

const SessionSchema = new mongoose.Schema({
  session_token: String,
  user: String,
  restricted: {
    type: Boolean,
    default: false
  },
  expiresAt: Date,
  createdAt: Date,
  ip: String,
  user_agent: String,
  country: {}
});

module.exports = mongoose.model('session', SessionSchema);

/*-----------------------------------------------------------
|   Server to Client
|------------------------------------------------------------*/

SessionSchema.plugin(normalize);
