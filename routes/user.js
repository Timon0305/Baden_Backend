const express = require('express');
const router = express.Router();
const cors = require('cors');

/*---------------------------------------------------
|   Import User Control Methods
|----------------------------------------------------*/

const {
  registerUser,
  verifyEmail,
  getUserDetails,
  deleteUser,
  forgetPassword,
  resendVerificationEmail,
  changeAvatar,
  logonUser,
  logonOptions,
  updateUserDetails,
  changePassword,
  resetPassword,
  logoffUser,
  searchUsers,
  deleteSession,
  getSessions,
} = require('../Controllers/user');


const { registered } = require('../middleware/auth');
const { uploadS3 } = require('../utils/aws');

//----------------------------------------------------------
// @endpoint    DELETE /user
router.route('/').delete(registered, deleteUser);

//----------------------------------------------------------
// @endpoint    GET, PATCH /user/details
router
  .route('/details')
  .get(registered, getUserDetails)
  .post(registered, updateUserDetails);

//----------------------------------------------------------
// @endpoint    POST /user/register
router.route('/register').post(registerUser);

//----------------------------------------------------------
// @endpoint    POST /user/verifyEmail
router.route('/verifyEmail').post(registered, verifyEmail);

//----------------------------------------------------------
// @endpoint    POST /user/avatar
router
  .route('/avatar')
  .post(registered, uploadS3('upload').single('image'), changeAvatar);

//----------------------------------------------------------
// @endpoint    POST /user/forgetPassword
router.route('/forgetPassword').post(forgetPassword);

//----------------------------------------------------------
// @endpoint    POST /user/resendVerificationEmail
router.route('/resendVerificationEmail').post(registered, resendVerificationEmail);

//----------------------------------------------------------
// @endpoint    GET /user/search
router.route('/search').get(registered, searchUsers);

//----------------------------------------------------------
// @endpoint    POST /user/logout
router.route('/logout').post(registered, logoffUser);

//----------------------------------------------------------
// @endpoint    POST /user/resetPassword
router.route('/resetPassword').post(resetPassword);

//----------------------------------------------------------
// @endpoint    PUT /user/password
router.route('/password').put(registered, changePassword);

//----------------------------------------------------------
// @endpoint    POST, OPTIONS /user/login
router
  .route('/login')
  .post(logonUser)
  .options(registered, cors());

//----------------------------------------------------------
// @endpoint    DELETE /user/session
router.route('/session').delete(registered, deleteSession);

//----------------------------------------------------------
// @endpoint    GET /user/sessions
router.route('/sessions').get(registered, getSessions);

module.exports = router;
