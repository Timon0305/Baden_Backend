const mongoose = require('mongoose');
const normalize = require('normalize-mongoose');

const Notificationchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'ANNOUNCEMENT'
  },
  title: {
    type: String,
    required: [true, 'name is required']
  },
  subTitle: String,
  content: {
    type: String,
    default: "1"
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

Notificationchema.pre('save', async function(next) {
  this.updatedAt = new Date(Date.now());
});

module.exports = mongoose.model('Notification', Notificationchema);
