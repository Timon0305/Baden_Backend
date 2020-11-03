const UserSchema = require('../Models/User');
const SessionSchema = require('../Models/Session');
const VehicleSchema = require('../Models/Vehicle');
const NotificationSchema = require('../Models/Notification');
const UserNotificationSchema = require('../Models/UserNotification');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../middleware/async');
const UserDeviceSchema = require('../Models/UserDevice');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const util = require('./util');
const Const = require('../const/app');

const tag = 'Controllers::Admin';

exports.login = asyncHandler(async (req, res, next) => {
  const {email, password} = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Credentials Required', 401));
  }

  const LoginUser = await UserSchema.findOne({email}).select('+password');
  const userDetails = await UserSchema.findOne({email});

  if (!LoginUser) {
    return res.status(404).json({
      success: false,
      status_code: ErrorResponse.StatusCode.UNAUTHORIZED,
      error: 'You are not registered, sign up first.'
    });
  }


  if (LoginUser.accountType !== 'Admin') {
    return res.status(401).json({
      success: false,
      status_code: ErrorResponse.StatusCode.UNAUTHORIZED,
      error: 'You are not allowed to login as admin'
    })
  }

  const isMatch = await LoginUser.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      status_code: ErrorResponse.StatusCode.WRONG_PASSWORD,
      error: 'Password is incorrect'
    })
  }

  const LogonUserToken = LoginUser.getSignedJwtToken(req);
  // sendTokenResponse(LoginUser, res);
  res.status(200).json({
    success: true,
    userDetails,
    sessionToken: LogonUserToken
  });
});

/**
 * @route POST /admin/logout
 * @group User
 * @returns {object} 200 - {success: true}
 */
exports.logout = asyncHandler(async (req, res, next) => {
  try {
    const FoundSession = await SessionSchema.findOne({
      session_token: req.headers.usertoken
    });
    if (!FoundSession) {
      return next(new ErrorResponse('Invalid Credentials', 401))
    }
    FoundSession.restricted = true;
    await FoundSession.save();
    res.status(200).json({
      success: true
    });
  } catch (e) {
    next(e)
  }
});


exports.getUsers = asyncHandler(async (req, res, next) => {
  try {
    const users = await UserSchema.find({accountType: 'User'});
    console.log('getUsers', users)

    res.status(200).json({
      success: true,
      users
    })
  } catch (e) {
    console.log(tag, 'getUsers', e.message);
    return next(e);
  }
});

exports.getDoctors = asyncHandler(async (req, res, next) => {
  try {
    const users = await UserSchema.find({accountType: 'Doctor'});

    res.status(200).json({
      success: true,
      users
    })
  } catch (e) {
    console.log(tag, 'getUsers', e.message);
    return next(e);
  }

});

exports.updateUser = asyncHandler(async (req, res, next) => {
  const {id} = req.params;
  const {newUser} = req.body;

  let oldUser = await UserSchema.findById(id);

  if (!oldUser) {
    return res.status(408).json({
      success: false,
      status_code: ErrorResponse.StatusCode.ID_NOT_FOUND,
      error: 'ID doesn\'t exist',
    })
  }

  // console.log(newUser.avatarUrl);
  try {
    const fileName = await util.saveImageBase64(newUser.avatarUrl, Const.PATH_AVATAR, 'user_' + id);

    if (fileName) {
      oldUser.avatarUrl = Const.URL_PREFIX_AVATAR + fileName;
    }
    // await oldUser.save();
  } catch (e) {
  }

  oldUser.fullName = newUser.fullName;
  oldUser.email = newUser.email;
  oldUser.language = newUser.language;
  oldUser.bloodType = newUser.bloodType;
  oldUser.gender = newUser.gender;
  oldUser.status = newUser.status;
  oldUser.speciality = newUser.speciality;
  oldUser.phoneNumber = newUser.phoneNumber;
  oldUser.street = newUser.street;
  oldUser.city = newUser.city;
  oldUser.country = newUser.country;

  await oldUser.save();

  return res.status(200).json({
    success: true,
  })
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const {id} = req.params;

  let oldUser = await UserSchema.findById(id);

  if (!oldUser) {
    return res.status(408).json({
      success: false,
      status_code: ErrorResponse.StatusCode.ID_NOT_FOUND,
      error: 'ID doesn\'t exist',
    })
  }

  oldUser.status = 'DELETED';

  await oldUser.save();

  return res.status(200).json({
    success: true,
  })
});

exports.createUser = asyncHandler(async (req, res, next) => {
  const {
    email, fullName, phoneNumber, password,
    gender, bloodType, language, avatarUrl,
  } = req.body.newUser;

  try {
    const registeredUser = await UserSchema.findOne({email});
    if (registeredUser) {
      return res.status(409).json({
        success: false,
        status_code: ErrorResponse.StatusCode.DUPLICATE_EMAIL,
        error: 'Email already exists'
      })
    }

    const createdUser = await UserSchema.create({
      email,
      fullName,
      phoneNumber,
      password,
      gender,
      bloodType,
      language,
      accountType: 'User',
    });

    let newAvatar = null;
    if (avatarUrl) {
      newAvatar = await util.saveImageBase64(avatarUrl, Const.PATH_AVATAR, 'user_' + createdUser.id);
      if (newAvatar) {
        createdUser.avatarUrl = Const.URL_PREFIX_AVATAR + newAvatar;
      }
    }

    await createdUser.save();

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.log(err.message);
    return next(err);
  }
});

exports.createDoctor = asyncHandler(async (req, res, next) => {
  const {
    email, fullName, phoneNumber, password,
    gender, bloodType, language, avatarUrl, speciality
  } = req.body.newUser;

  try {
    const registeredUser = await UserSchema.findOne({email});
    if (registeredUser) {
      return res.status(409).json({
        success: false,
        status_code: ErrorResponse.StatusCode.DUPLICATE_EMAIL,
        error: 'Email already exists'
      })
    }

    const createdUser = await UserSchema.create({
      email,
      fullName,
      phoneNumber,
      password,
      gender,
      bloodType,
      language,
      speciality,
      accountType: 'Doctor',
    });

    let newAvatar = null;
    if (avatarUrl) {
      newAvatar = await util.saveImageBase64(avatarUrl, Const.PATH_AVATAR, 'user_' + createdUser.id);
      if (newAvatar) {
        createdUser.avatarUrl = Const.URL_PREFIX_AVATAR + newAvatar;
      }
    }

    await createdUser.save();

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.log(err.message);
    return next(err);
  }
});

exports.getVehicle = asyncHandler(async (req, res, next) => {
  try {
    const vehicles = await VehicleSchema.find();

    res.status(200).json({
      success: true,
      vehicles
    })
  } catch (e) {
    console.log(tag, 'get Vehicles', e.message);
    return next(e);
  }
});

exports.createVehicle = asyncHandler(async (req, res, next) => {
  const {
    carUrl, fullName
  } = req.body.newVehicle;
  console.log(req.body.newVehicle)

  try {
    const registeredUser = await VehicleSchema.findOne({fullName});
    if (registeredUser) {
      return res.status(409).json({
        success: false,
        status_code: ErrorResponse.StatusCode.DUPLICATE_EMAIL,
        error: 'Vehicle Name already exists'
      })
    }

    const createVehicle = await VehicleSchema.create({
     fullName
    });

    let newAvatar = null;
    if (carUrl) {
      newAvatar = await util.saveImageBase64(carUrl, Const.PATH_CAR, 'cars_' + createVehicle.id);
      if (newAvatar) {
        createVehicle.carUrl = Const.URL_PREFIX_CAR + newAvatar;
      }
    }

    await createVehicle.save();

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.log(err.message);
    return next(err);
  }
});

exports.updateVehicle = asyncHandler(async (req, res, next) => {
  const {id} = req.params;
  const {newVehicle} = req.body;

  let oldVehicle = await VehicleSchema.findById(id);

  if (!oldVehicle) {
    return res.status(408).json({
      success: false,
      status_code: ErrorResponse.StatusCode.ID_NOT_FOUND,
      error: 'ID doesn\'t exist',
    })
  }

  // console.log(newUser.avatarUrl);
  try {
    const fileName = await util.saveImageBase64(newVehicle.carUrl, Const.PATH_CAR, 'cars_' + id);
    if (fileName) {
      oldVehicle.carUrl = Const.URL_PREFIX_CAR + fileName;
      oldVehicle.carUrl = oldVehicle.carUrl.split("public")[1].replace(/\\/g, '/');
    }
    // await oldUser.save();
  } catch (e) {
  }

  oldVehicle.fullName = newVehicle.fullName;

  await oldVehicle.save();

  return res.status(200).json({
    success: true,
  })
});

exports.deleteVehicle = asyncHandler(async (req, res, next) => {
  const {id} = req.params;

  let oldVehicle = await VehicleSchema.findById(id);

  if (!oldVehicle) {
    return res.status(408).json({
      success: false,
      status_code: ErrorResponse.StatusCode.ID_NOT_FOUND,
      error: 'ID doesn\'t exist',
    })
  }

  oldVehicle.status = 'DELETED';

  await oldVehicle.save();

  return res.status(200).json({
    success: true,
  })
});




