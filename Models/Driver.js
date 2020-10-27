const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const normalize = require('normalize-mongoose');
const {logSession} = require('../utils/sessionLogger');

/**
 * @typedef UserSchema
 * @property {string} email
 * @property {string} fullName
 * @property {string} password
 * @property {string} avatarUrl
 * @property {string} accountType
 * @property {string} street
 * @property {string} city
 * @property {string} country
 * @property {string} phoneNumber
 * @property {string} language
 * @property {number} notificationCount
 * @property {string} status
 * @property {boolean} emailVerified
 * @property {string} emailVerifyCode
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {string} resetPasswordToken
 * @property {Date} resetPasswordExpire
 * @property {boolean} isOnline
 */
const DriverSchema = new mongoose.Schema({
    email: {
        type: String,
        match: [
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Valid email address required'
        ],
        required: [true, 'Email address is required']
    },
    emailVerified: {
        type: Boolean,
        default: true
    },
    emailVerifyCode: {
        type: String,
        default: null,
        select: false
    },
    fullName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false,
        // match: /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).{6,32})/
    },
    carUrl: {
        type: String,
        default: "/images/cars/default_car.png"
    },
    licenseUrl: {
        type: String,
        default: null
    },
    insuranceUrl: {
        type: String,
        default: null
    },
    accountType: {
        type: String,
        default: 'Driver',
    },
    phoneNumber: String,
    status: {
        type: String,
        default: 'ACTIVE',
        enum: ['DELETED', 'ACTIVE']
    },
    notificationCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date,
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpire: {
        type: Date,
        select: false
    },
    speciality: String,
    isOnline: {
        type: Boolean,
        default: false
    },
});

/*-----------------------------------------------------------
|   Server to Client
|------------------------------------------------------------*/

DriverSchema.plugin(normalize);

/*-----------------------------------------------------------
|   Process Updates
|------------------------------------------------------------*/

DriverSchema.pre('save', async function (next) {
    this.updatedAt = new Date(Date.now());
});

/*-----------------------------------------------------------
|   Generate Email Code
|------------------------------------------------------------*/

DriverSchema.methods.generateVerificationCode1 = function () {
    this.emailVerifyCode = Math.floor((1 + Math.random()) * 100000).toString();
    return this.emailVerifyCode;
};

/*-----------------------------------------------------------
|   Update Password
|------------------------------------------------------------*/

DriverSchema.methods.updatePassword = function (newPassword) {
    this.password = newPassword;
};

/*-----------------------------------------------------------
|   Hash Modified Passwords
|------------------------------------------------------------*/

DriverSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

/*-----------------------------------------------------------
|   Get JSON Web Token
|------------------------------------------------------------*/

DriverSchema.methods.getSignedJwtToken1 = function (req) {
    let token = jwt.sign({id: this._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
    logSession(req, token, this._id);
    return token;
};

/*-----------------------------------------------------------
|   Compare input to hashed password
|------------------------------------------------------------*/

DriverSchema.methods.matchPassword = async function (inputPassword) {
    return await bcrypt.compare(inputPassword, this.password);
};

/*-----------------------------------------------------------
|   Compare input to hashed email code
|------------------------------------------------------------*/

DriverSchema.methods.matchVerifyCode = async function (inputCode) {
    if (inputCode !== this.emailVerifyCode) {
        return false;
    }
    return true;
};

/*-----------------------------------------------------------
|   Get password reset token
|------------------------------------------------------------*/

DriverSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return this.resetPasswordToken;
};

/*-----------------------------------------------------------
|   Invalidate a password reset token
|------------------------------------------------------------*/

DriverSchema.methods.invalidateResetToken = function () {
    this.resetPasswordToken = undefined;
    this.resetPasswordExpire = undefined;
};

/*-----------------------------------------------------------
|   Undelete account
|------------------------------------------------------------*/

DriverSchema.methods.activateAccount = function () {
    this.status = 'ACTIVE';
};

module.exports = mongoose.model('Driver', DriverSchema);
