const mongoose = require('mongoose');
const normalize = require('normalize-mongoose');

const UserNotificationSchema = new mongoose.Schema({
  read: {
    type: Boolean,
    default: false
  },
  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

UserNotificationSchema.pre('save', async function(next) {
  this.updatedAt = new Date(Date.now());
});

module.exports = mongoose.model('UserNotification', UserNotificationSchema);
