const express = require('express');
const router = express.Router();
const cors = require('cors');

/*---------------------------------------------------
|   Import pillReminder Control Methods
|----------------------------------------------------*/
const {
  getDriverById
} = require('../Controllers/driverList');


const { registered } = require('../middleware/auth');
const { uploadS3 } = require('../utils/aws');

router.route('/driverList')
  .get(registered, getDriverById);


module.exports = router;
