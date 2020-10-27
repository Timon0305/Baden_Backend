const express = require('express');
const router = express.Router();
const cors = require('cors');

/*---------------------------------------------------
|   Import pillReminder Control Methods
|----------------------------------------------------*/
const {
  getHospital,
  getReviews,
  createReview,
  requestBooking,
  cancelBooking,
  searchDoctorsByCategory,
  searchDoctors,
  getDriverById
} = require('../Controllers/userDoctor');


const { registered } = require('../middleware/auth');
const { uploadS3 } = require('../utils/aws');

router.route('/:id')
  .get(registered, getDriverById);

router.route('/:id/hospital')
  .get(registered, getHospital);

router.route('/:id/review')
  .get(registered, getReviews)
  .put(registered, createReview);

router.route('/:id/booking')
  .put(registered, requestBooking)
  .delete(registered, cancelBooking);

router.route('/searchDoctorsByCategory')
  .post(registered, searchDoctorsByCategory);

router.route('/searchDoctors')
  .post(registered, searchDoctors);

module.exports = router;
