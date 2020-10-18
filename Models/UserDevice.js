const mongoose = require('mongoose');
const normalize = require('normalize-mongoose');

const UserDeviceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deviceType: String,
  deviceUserId: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,

});
/*-----------------------------------------------------------
|   Server to Client
|------------------------------------------------------------*/

UserDeviceSchema.plugin(normalize);

/*-----------------------------------------------------------
|   Process Updates
|------------------------------------------------------------*/

UserDeviceSchema.pre('save', async function (next) {
  this.updatedAt = new Date(Date.now());
});

module.exports = mongoose.model('UserDevice', UserDeviceSchema);
