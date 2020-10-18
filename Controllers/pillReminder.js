const PillReminderSchema = require('../Models/PillReminder');

const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @route GET /pill
 * @group PillReminder
 * @return {object} 200 - {success: true, pillReminders = []}
 */
exports.getPillReminders = asyncHandler(async (req, res, next) => {
  try {
    let pillReminders = [];

    let items = await PillReminderSchema.find({
      user: req.user.id
    });

    //console.log(items);
    for (let item of items) {
      pillReminders.push({
        id: item.id,
        medicineName: item.medicineName,
        dosage: item.dosage,
        frequency: item.frequency,
        timeToTake: item.timeToTake,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      });
    }

    res.status(200).json({
      success: true,
      pillReminders
    })
  } catch (e) {
    next(e)
  }
});

/**
 * @route POST /pill
 * @group PillReminder
 * @param {string} medicineName.body.required
 * @param {string} dosage.body.required
 * @param {string} frequency.body.required
 * @param {number} timeToTake.body.required
 * @returns {object} 200 - {}
 * @returns {object} 400 - Bad request
 */
exports.createPillReminder = asyncHandler(async (req, res, next) => {
  try {
    const {medicineName, dosage, frequency, timeToTake} = req.body;
    if (!medicineName) {
      return next(new ErrorResponse('Name is required', 400))
    }

    const pillReminder = await PillReminderSchema.create({
      medicineName,
      dosage,
      frequency,
      timeToTake,
      user: req.user.id,
    });
    await pillReminder.save();

    res.status(200).json({
      pillReminder
    })
  } catch (e) {
    next(e)
  }
});

/**
 * @route GET /pill/:id
 * @group PillReminder
 * @param {string} id.params.required
 * @returns {object} 200 - {}
 */
exports.getPillReminder = asyncHandler(async (req, res, next) => {
  try {
    const {id} = req.params;
    if (!id) {
      return next(new ErrorResponse('PillReminderId is required', 400))
    }

    const pillReminder = await PillReminderSchema.findById(id);
    // console.log(pillReminderUser);

    res.status(200).json({
      ...pillReminder
    })
  } catch (e) {
    next(e)
  }
});

/**
 * @route PUT /pill/:id
 * @group PillReminder
 * @param {string} id.params.required
 * @param {string} medicineName.body.required
 * @param {string} dosage.body.required
 * @param {string} frequency.body.required
 * @param {number} timeToTake.body.required
 * @returns {object} 200 - {}
 * @returns {object} 404 - Not found
 */
exports.updatePillReminder = asyncHandler(async (req, res, next) => {
  try {
    const {medicineName, dosage, frequency, timeToTake} = req.body;
    const {id} = req.params;

    let pillReminder = await PillReminderSchema.findById(id);
    if (!pillReminder) {
      return next(new ErrorResponse('PillReminder doesn\'t exist', 404))
    }
    pillReminder.medicineName = medicineName;
    pillReminder.dosage = dosage;
    pillReminder.frequency = frequency;
    pillReminder.timeToTake = timeToTake;
    await pillReminder.save();

    res.status(200).json({
      ...pillReminder
    })
  } catch (e) {
    next(e)
  }
});

/**
 * @route DELETE /pill/:id
 * @group PillReminder
 * @param {string} id.params.required
 * @returns {object} 200 - {}
 * @returns {object} 404 - Not Found
 */
exports.deletePillReminder = asyncHandler(async (req, res, next) => {
  try {
    const {pillReminderId} = req.params;

    let pillReminder = await PillReminderSchema.findById(pillReminderId);
    if (!pillReminder) {
      return next(new ErrorResponse('PillReminder doesn\'t exist', 404))
    }
    await pillReminder.remove();

    res.status(200).json({})
  } catch (e) {
    next(e)
  }
});
