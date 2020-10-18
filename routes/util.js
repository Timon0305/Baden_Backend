const express = require('express');
const router = express.Router();
const cors = require('cors');

const {
  getCountries
} = require('../Controllers/util');

router.route('/countries').get(getCountries);

module.exports = router;
