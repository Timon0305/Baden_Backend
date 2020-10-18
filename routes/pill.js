const express = require('express');
const router = express.Router();
const cors = require('cors');

/*---------------------------------------------------
|   Import pillReminder Control Methods
|----------------------------------------------------*/
const {
  getPillReminders,
  getPillReminder,
  createPillReminder,
  updatePillReminder,
  deletePillReminder,
} = require('../Controllers/pillReminder');


const { registered } = require('../middleware/auth');
const { uploadS3 } = require('../utils/aws');

router.route('/')
  .get(registered, getPillReminders)
  .post(registered, createPillReminder);

router.route('/:id')
  .get(registered, getPillReminder)
  .put(registered, updatePillReminder)
  .delete (registered, deletePillReminder);

module.exports = router;
