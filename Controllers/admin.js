const UserSchema = require('../Models/User');
const SessionSchema = require('../Models/Session');
const ReviewSchema = require('../Models/Review');
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

exports.getReviews = asyncHandler(async (req, res, next) => {
  try {
    const _reviews = await ReviewSchema.find();
    let reviews = [];
    for (let _review of _reviews) {
      const doctor = await UserSchema.findById(_review.doctor);
      const author = await UserSchema.findById(_review.author);
      reviews.push({
        id: _review.id,
        doctor: doctor,
        author: author,
        rating: _review.rating,
        description: _review.description,
        createdAt: _review.createdAt,
        updatedAt: _review.updatedAt
      })
    }

    res.status(200).json({
      success: true,
      reviews
    })
  } catch (e) {
    console.log(tag, 'getReviews', e.message);
    return next(e);
  }
});

exports.updateReview = asyncHandler(async (req, res, next) => {
  const {id} = req.params;
  const {rating, description} = req.body;

  let oldReview = await ReviewSchema.findById(id);

  if (!oldReview) {
    return res.status(408).json({
      success: false,
      status_code: ErrorResponse.StatusCode.ID_NOT_FOUND,
      error: 'ID doesn\'t exist',
    })
  }

  oldReview.rating = rating;
  oldReview.description = description;

  await oldReview.save();

  return res.status(200).json({
    success: true,
  })
});

exports.deleteReview = asyncHandler(async (req, res, next) => {
  const {id} = req.params;

  try {
    let oldUser = await ReviewSchema.findById(id);

    if (oldUser) {
      await oldUser.remove();
    }

    return res.status(200).json({
      success: true,
    })
  } catch (e) {
    next(e);
  }
});



