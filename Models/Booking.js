const mongoose = require('mongoose');
const normalize = require('normalize-mongoose');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date: {
    type: String, // timestamp

  },
  durationInMin: {
    type: Number,
    default: 30
  },
  status: {
    type: String,
    default: 'REQUESTED',
    enum: ['REQUESTED', 'ACCEPTED', 'REJECTED', 'CANCELED', 'COMPLETED']
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

BookingSchema.pre('save', async function(next) {
  this.updatedAt = new Date(Date.now());
});

module.exports = mongoose.model('Booking', BookingSchema);
