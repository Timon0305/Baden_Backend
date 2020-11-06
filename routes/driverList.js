const express = require('express');
const router = express.Router();
const cors = require('cors');

/*---------------------------------------------------
|   Import pillReminder Control Methods
|----------------------------------------------------*/
const {
  getDriverById,
  sentOffer,
  getVehicleName,
  offerAccept,
    getAllOffer
} = require('../Controllers/driverList');


const { registered } = require('../middleware/auth');
const { uploadS3 } = require('../utils/aws');

router.route('/getVehicleName')
  .get(registered, getVehicleName);

router.route('/getDriverList')
  .post(registered, getDriverById);

router.route('/offerSent')
    .post(registered, sentOffer)

router.route('/getAllOffer')
    .post(registered, getAllOffer)

router.route('/offerAccept')
    .post(registered, offerAccept)
module.exports = router;
