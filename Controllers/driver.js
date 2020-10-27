const DriverSchema = require('../Models/Driver');
const SessionSchema = require('../Models/Session');
const NotificationSchema = require('../Models/Notification');
const UserNotificationSchema = require('../Models/UserNotification');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../middleware/async');
const UserDeviceSchema = require('../Models/UserDevice');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const tag = 'Controllers::User';
const Const = require('../const/app');
const util = require('./util');

/**
 * @description     Register on the Docitoo Platform
 * @operationId     registerUser
 * @route           POST /user/register
 * @group           User
 * @param {string}  email.body.required - email - user@example.com
 * @param {string}  fullName.body.required
 * @param {string}  phoneNumber.body
 * @param {string}  password.body.required
 * @returns {object} 200 - {success: true}
 */
exports.registerUser = asyncHandler(async (req, res, next) => {
    console.log(req.body);
    const {email, fullName, phoneNumber, password, deviceUserId, deviceType} = req.body;

    try {
        const registeredUser = await DriverSchema.findOne({email});
        if (registeredUser) {
            return res.status(409).json({
                success: false,
                status_code: ErrorResponse.StatusCode.DUPLICATE_EMAIL,
                error: 'Email already exists'
            })
        }

        const createdUser = await DriverSchema.create({
            email,
            fullName,
            phoneNumber,
            password,
        });

        const sessionToken = createdUser.getSignedJwtToken1(req);
        const email_code = createdUser.generateVerificationCode1();
        await createdUser.save();
        //
        // console.log(email_code);
        //
        const userDetails = await DriverSchema.findOne({email});
        console.log('user detail', userDetails)
        // let email1 = await sendEmail(userDetails, 'welcome', {
        //   fullName: fullName
        // });
        // let email2 = await sendEmail(userDetails, 'verify', {
        //   code: email_code
        // });

        await registerDeviceUserId(userDetails, deviceUserId, deviceType);

        res.status(200).json({
            success: true,
            sessionToken,
            userDetails
        });
    } catch (err) {
        return next(err);
    }
});


/**
 * @route POST /user/login - Login
 * @group User - operations about user
 * @param {string} email.body.required - email - eg: user@domain
 * @param {string} password.body.required - user's password
 * @returns {object} 200 - An array of user info
 * @returns {object} 401 - Incorrect password
 * @returns {object} 403 - Not verified yet
 * @returns {object} 404 - Invalid Email
 */
exports.logonUser = asyncHandler(async (req, res, next) => {
    const {email, password, deviceUserId, deviceType} = req.body;

    console.log(tag, 'login, body', req.body);
    if (!email || !password) {
        return next(new ErrorResponse('Credentials Required', 401));
    }

    const LoginUser = await DriverSchema.findOne({email}).select('+password');
    const userDetails = await DriverSchema.findOne({email});

    if (!LoginUser) {
        return res.status(404).json({
            success: false,
            status_code: ErrorResponse.StatusCode.UNAUTHORIZED,
            error: 'You are not registered, sign up first.'
        });
    }

    const isMatch = await LoginUser.matchPassword(password);

    if (!isMatch) {
        return res.status(401).json({
            success: false,
            status_code: ErrorResponse.StatusCode.WRONG_PASSWORD,
            error: 'Password is incorrect'
        })
    }

    if (!LoginUser.emailVerified) {
        return res.status(403).json({
            success: false,
            status_code: ErrorResponse.StatusCode.EMAIL_NOT_VERIFIED,
            error: 'Email is not verified yet'
        })
    }

    if (LoginUser.status === 'DELETED') {
        LoginUser.activateAccount();
        await sendEmail(LoginUser, 'welcome_back', {
            firstName: LoginUser.firstName,
            lastName: LoginUser.lastName
        });
        await LoginUser.save({
            validateBeforeSave: false
        });
    }

    const LogonUserToken = LoginUser.getSignedJwtToken1(req);
    // sendTokenResponse(LoginUser, res);

    // register device token for push notification
    await registerDeviceUserId(LoginUser, deviceUserId, deviceType);

    res.status(200).json({
        success: true,
        userDetails,
        sessionToken: LogonUserToken
    });
});


/**
 * @route POST /user/logout
 * @group User
 * @returns {object} 200 - {success: true}
 */
exports.logoffUser = asyncHandler(async (req, res, next) => {
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

/**
 * @description     Verify Email
 * @route           POST /user/verifyEmail
 * @group           User
 * @param           {string} code.body.required
 * @returns         {object} 400 - invalid code
 * @returns         {object} 200 - {success: true}
 */

exports.verifyEmail = asyncHandler(async (req, res, next) => {
    const {code} = req.body;

    const fullUser = await DriverSchema.findById(req.user._id).select(
        '+emailVerifyCode'
    );

    if (fullUser.emailVerifyCode == '' || req.user.emailVerified == true) {
        return next(
            new ErrorResponse(
                'No verification code supported or email already verified',
                400
            )
        );
    }

    const isMatched = await fullUser.matchVerifyCode(code);

    if (!isMatched) {
        return next(new ErrorResponse('Invalid Code', 400));
    }

    req.user.emailVerified = true;
    req.user.emailVerifyCode = undefined;
    req.user.save({
        validateBeforeSave: false
    });

    res.status(200).json({
        success: true
    });
});


/**
 * @description     Resend Email Verification Code
 * @route           POST /user/resendVerificationEmail
 * @group           User
 * @returns {object} 200 - {success: true}
 */

exports.resendVerificationEmail = asyncHandler(async (req, res, next) => {
    try {
        const fullUser = await DriverSchema.findById(req.user._id).select(
            '+emailVerifyCode'
        );
        await sendEmail(fullUser, 'verify', {
            code: fullUser.emailVerifyCode
        });

        res.status(200).json({
            success: true
        })
    } catch (err) {
        next(err)
    }
});

/**
 * @route           POST /user/avatar - Allows users to change their avatar
 * @group           User
 * @param           {file} avatar.file.required
 * @return {object} 200 - {success: true}
 */
exports.changeAvatar = asyncHandler(async (req, res, next) => {
    req.user.avatar = req.file.location;
    await req.user.save();
    res.status(200).json({
        success: true
    });
});

/**
 * @route           POST /user/forgetPassword
 * @group           User
 * @param  {string} email.body.required
 * @return {object} 200 - {success: true}
 */
exports.forgetPassword = asyncHandler(async (req, res, next) => {
    const PwdUser = await DriverSchema.findOne({email: req.body.email});

    if (!PwdUser) return next(new ErrorResponse('User Not Found'), 404);

    const resetToken = PwdUser.getResetPasswordToken();

    await PwdUser.save({
        validateBeforeSave: false
    });

    const resetUrl = `https://Docitoo.com/resetPassword?token=${resetToken}`;

    try {
        await sendEmail(PwdUser, 'reset', {
            email: PwdUser.email,
            link: resetUrl
        });

        res.status(200).json({
            success: true
        });
    } catch (err) {
        await PwdUser.invalidateResetToken();

        await PwdUser.save({
            validateBeforeSave: false
        });
        console.log(err);
        return next(new ErrorResponse('Email could not be sent', 500));
    }
});

/**
 * @route           GET /user/details
 * @group           User
 * @return {object} 200 - {success: true, userDetails: {}}
 */
exports.getUserDetails = asyncHandler(async (req, res, next) => {
    try {
        let userDetails = await DriverSchema.findById(req.user._id);
        res.status(200).json({
            success: true,
            userDetails
        });
    } catch (err) {
        next(err);
    }
});
/**
 * @description     Update User Details
 * @route           POST /user/details
 * @group           User
 * @param {string}  fullName.body - user's full name
 * @param {string}  language.body
 * @param {string}  avatar.body
 * @param {string}  street.body
 * @param {string}  city.body
 * @param {string}  country.body
 * @param {string}  accountType.body
 * @param {string}  gender.body
 */

exports.updateUserDetails = asyncHandler(async (req, res, next) => {
    console.log('Confirm')
    let {
        carUrl,
    } = req.body;

    try {
        let updateData = {};

        if (carUrl && carUrl.uri) {
            try {
                const fileName = await util.saveImageBase64(carUrl.uri, Const.PATH_CAR, 'cars_' + req.user.id);

                if (fileName) {
                    updateData.carUrl = Const.URL_PREFIX_CAR + fileName;
                    updateData.carUrl = updateData.carUrl.split("public")[1].replace(/\\/g, '/');
                }
                // await oldUser.save();
            } catch (e) {
                console.log('Exception', e.message);
            }
        }
        let userDetails = await DriverSchema.findByIdAndUpdate(
            req.user.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );
        // await userDetails.updatePassword(password);
        await userDetails.save();

        res.status(200).json({
            success: true,
            userDetails
        });
    } catch (err) {
        console.log(tag, 'UpdateUserDetail', err.message);
        next(err);
    }
});

/**
 * @description     Deactivate User Account
 * @route           DELETE /user
 * @group           UserAdmin
 *
 */

exports.deleteUser = asyncHandler(async (req, res, next) => {
    req.user.status = 'DELETED';
    await req.user.save();
    await sendEmail(req.user, 'soft_delete', {
        firstName: req.user.firstName,
        lastName: req.user.lastName
    });

    res.status(200).json({
        success: true
    });
});

/**
 * @description     Search for users and display their projects
 * @route           GET /user/search
 * @group           UserAdmin
 */

exports.searchUsers = asyncHandler(async (req, res, next) => {
    const q = req.query.searchText;

    let users = await DriverSchema.find({
        $or: [
            {
                email: {
                    $regex: new RegExp([q].join(''), "i")
                }
            },
            {
                fullName: {
                    $regex: new RegExp([q].join(''), "i")
                }
            }
        ]
    }).select('id email firstName lastName avatarUrl accountType');

    for (let i = 0; i < users.length; i++) {
        let user = users[i];
        console.log(user.id, req.user.id)
        if (user.id === req.user.id) {
            users.splice(i, 1)
        }
    }

    res.status(200).json({
        success: true,
        users
    });
});

/**
 * @description     Reset a user's password
 * @route           POST /user/resetPassword
 * @group           User
 * @param {string}  token.body.required
 * @param {string}  newPassword.body.required
 * @returns {object} 200 - {success: true}
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
    if (!req.body.newPassword || !req.body.token) {
        return next(new ErrorResponse('Invalid Credentials', 401));
    }

    const resetPasswordToken = req.body.token;

    //console.log(req.body);

    const user = await DriverSchema.findOne({
        resetPasswordToken,
        resetPasswordExpire: {
            $gt: Date.now()
        }
    });

    if (!user) {
        return next(new ErrorResponse('Invalid Credentials Provided', 400));
    }

    user.updatePassword(req.body.newPassword);
    user.invalidateResetToken();
    await user.save();

    res.status(200).json({
        success: true,
        data: user
    });
});

/**
 * @description     Change a user's password
 * @route           PUT /user/password
 * @group           User
 * @param {string}  oldPassword.body.required
 * @param {string}  password.body.required
 * @return {object} 200 - {success: true, sessionToken: ''}
 */
exports.changePassword = asyncHandler(async (req, res, next) => {
    const {oldPassword, password} = req.body;
    const newPassword = password;

    if (!oldPassword || !newPassword) {
        return next(new ErrorResponse('Invalid Credentials', 401));
    }

    const userDetails = await DriverSchema.findOne({_id: req.user.id}).select(
        '+password'
    );

    const isMatchedPassword = await userDetails.matchPassword(oldPassword);

    if (!isMatchedPassword) {
        return next(new ErrorResponse('Invalid Credentials', 401));
    }

    await userDetails.updatePassword(newPassword);
    await userDetails.save();

    const newSessionToken = await userDetails.getSignedJwtToken();

    res.status(200).json({
        success: true,
        sessionToken: newSessionToken
    });
});

/**
 * @route           GET /user/session
 * @group           User
 * @returns {object} 200 - {success: true, sessions: [...]}
 */
exports.getSessions = asyncHandler(async (req, res, next) => {
    try {
        const sessionArray = await SessionSchema.find({user: req.user.id});
        if (!sessionArray) return next(new ErrorResponse('Not found', 404));
        let sessions = [];
        for (let session of sessionArray) {
            sessions.push({
                id: session.id,
                ip: session.ip,
                country: session.country,
                city: session.city,
                userAgent: session.user_agent,
                createdAt: session.createdAt,
                current: session.restricted
            })
        }

        res.status(200).json({
            success: true,
            sessions
        });
    } catch (e) {
        next(e)
    }
});

/**
 * @route           DELETE /user/session
 * @group           User
 * @param       {string} id.query.required - session_token
 * @returns {object} 200 - {success: true}
 */
exports.deleteSession = asyncHandler(async (req, res, next) => {
    try {
        const foundSession = await SessionSchema.findOne({
            session_token: req.query.id,
            user: req.user.id
        });
        if (!foundSession) return next(new ErrorResponse('Not found', 404));

        foundSession.restricted = true;
        await foundSession.save();
        res.status(200).json({
            success: true
        });
    } catch (e) {
        next(e)
    }
});

//------------------------------------------------------//
// @description     Register a device
// @route           POST /user/registerDeviceUserId
const registerDeviceUserId = asyncHandler(async (user, deviceUserId, deviceType) => {
    try {
        const oldUserDevices = await UserDeviceSchema.find({
            deviceUserId: deviceUserId
        });
        if (oldUserDevices && oldUserDevices.length > 0) {
            for (let oldUserDevice of oldUserDevices) {
                oldUserDevice.user = user;
                await oldUserDevice.save();
            }
        } else {
            const newUserDevice = await UserDeviceSchema.create({
                user,
                deviceUserId,
                deviceType
            });
            await newUserDevice.save();
        }

        await util.sendNotification(
            util.NOTIFICATION_TYPE.ALERT,
            {
                title: 'Welcome',
                subTitle: '',
                content: `${user.fullName} is signed right now.`
            },
            user
        );
        return true;

    } catch (e) {
        console.log(tag, 'exception', e.message);
    }
    return false;
});

const getUser = userToken => {
    let UserInformation = jwt.verify(userToken, process.env.JWT_SECRET);
    return UserInformation.id;
};
