const express = require('express');
const router = express.Router();
const cors = require('cors');

const {
  login,
  logout,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  createDoctor,
  getDoctors,
  getReviews,
  updateReview,
  deleteReview,
} = require('../Controllers/admin');

const { registered } = require('../middleware/auth');

//----------------------------------------------------------
// @endpoint    POST, OPTIONS /user/login
router
  .route('/login')
  .post(login);

router
  .route('/login')
  .post(logout);

router
  .route('/users')
  .get(registered, getUsers)
  .put(registered, createUser);

router
  .route('/users/:id')
  .post(registered, updateUser)
  .delete(registered, deleteUser);

router
  .route('/doctors')
  .get(registered, getDoctors)
  .put(registered, createDoctor);

router
  .route('/doctors/:id')
  .post(registered, updateUser)
  .delete(registered, deleteUser);

router
  .route('/reviews')
  .get(registered, getReviews);
  // .put(registered, createDoctor);

router
  .route('/review/:id')
  .post(registered, updateReview)
  .delete(registered, deleteReview);

module.exports = router;


