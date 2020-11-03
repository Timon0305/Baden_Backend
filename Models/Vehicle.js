const mongoose = require('mongoose');
const normalize = require('normalize-mongoose');

const VehicleSchema = new mongoose.Schema({
  carUrl: {
    type: String,
    default: "/images/cars/default_cars.png"
  },
  fullName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'ACTIVE',
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

VehicleSchema.pre('save', async function(next) {
  this.updatedAt = new Date(Date.now());
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
