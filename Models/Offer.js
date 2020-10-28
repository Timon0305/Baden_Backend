const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const normalize = require('normalize-mongoose');
const {logSession} = require('../utils/sessionLogger');

/**
 * @typedef OfferSchema
 * @property {string} clientName
 * @property {string} clientId
 * @property {string} vehicleId
 * @property {string} offerLocation
 * @property {string} offerTime
 * @property {string} offerPrice
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */
const OfferSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    vehicleId: {
        type: String,
        required: true
    },
    offerLocation: {
        type: String,
        required: true
    },
    offerTime: {
        type: String,
        required: true
    },
    offerPrice: {
        type: String,
    },
    offerStatus: {
        type: String,
        default: 'Request',
        enum: ['Request', 'Reject', 'Accept']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date,
});

/*-----------------------------------------------------------
|   Server to Client
|------------------------------------------------------------*/

OfferSchema.plugin(normalize);

/*-----------------------------------------------------------
|   Process Updates
|------------------------------------------------------------*/

OfferSchema.pre('save', async function (next) {
    this.updatedAt = new Date(Date.now());
});

/*-----------------------------------------------------------
|   Hash Modified Passwords
|------------------------------------------------------------*/

OfferSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

/*-----------------------------------------------------------
|   Get JSON Web Token
|------------------------------------------------------------*/

OfferSchema.methods.getSignedJwtToken1 = function (req) {
    let token = jwt.sign({id: this._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
    logSession(req, token, this._id);
    return token;
};

module.exports = mongoose.model('Offer', OfferSchema);
