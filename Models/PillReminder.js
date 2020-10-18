const mongoose = require('mongoose');
const normalize = require('normalize-mongoose');

const PillReminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  medicineName: {
    type: String,
    default: ''
  },
  dosage: {
    type: String,
    default: 'PROJECT_ACTIVATED'
  },
  frequency: {
    type: String,
    default: 'notification'
  },
  timeToTake: {
    type: Number,
    default: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
});


/*-----------------------------------------------------------
|   Process Updates
|------------------------------------------------------------*/

PillReminderSchema.pre('save', async function (next) {
  this.updatedAt = new Date(Date.now());
});

module.exports = mongoose.model('PillReminder', PillReminderSchema);
