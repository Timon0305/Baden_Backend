const mongoose = require('mongoose');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('./errorResponse');
const SessionSchema = require('../Models/Session');

exports.logSession = asyncHandler(async (req, session_token, id) => {
  const date = Date.now();

  await SessionSchema.create({
    session_token,
    createdAt: new Date(date),
    restricted: false,
    expiresAt: new Date(date + 24 * 60 * 60 * 1000),
    user: id,
    ip: req.clientIp,
    user_agent: req.headers['user-agent']
  });
});

exports.checkSession = asyncHandler(async (req, session_token) => {
  const foundSession = await SessionSchema.findOne({
    session_token,
    expiresAt: {
      $gt: Date.now()
    }
  });

  if (foundSession.restricted == true || !foundSession) {
    return false;
  }

  return true;
});
