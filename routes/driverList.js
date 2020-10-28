const express = require('express');
const router = express.Router();
const cors = require('cors');

/*---------------------------------------------------
|   Import pillReminder Control Methods
|----------------------------------------------------*/
const {
  getDriverById,
    sentOffer
} = require('../Controllers/driverList');


const { registered } = require('../middleware/auth');
const { uploadS3 } = require('../utils/aws');

router.route('/getDriverList')
  .get(registered, getDriverById);

router.route('/offerSent')
    .post(registered, sentOffer)

module.exports = router;
