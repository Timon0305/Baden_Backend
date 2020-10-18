const CountrySchema = require('../Models/Country');
const UserSchema = require('../Models/User');
const UserDeviceSchema = require('../Models/UserDevice');
const NotificationSchema = require('../Models/Notification');
const UserNotificationSchema = require('../Models/UserNotification');
const asyncHandler = require('../middleware/async');
const base64Img = require('base64-img');
const OneSignal = require('onesignal-node');
const tag = 'Controller::util';

module.exports.getCountries = asyncHandler(async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      countries: CountrySchema.getAll()
    })
  } catch (e) {
    next(e)
  }
});

exports.saveImageBase64 = asyncHandler(async (data, path, name) => {
  let fileName = null;
  try {
    if (data.startsWith('data:')) {

      const filepath = await base64Img.imgSync(data, path, name);
      const pathArr = filepath.split('/');
      fileName = pathArr[pathArr.length - 1];
    }
    // await oldUser.save();
  } catch (e) {
    console.log(tag, 'imageSave Ex', e.message)
  }
  return fileName;
});

const NOTIFICATION_TYPE = {
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  REMINDER: 'REMINDER',
  ALERT: 'ALERT'
};
exports.NOTIFICATION_TYPE = NOTIFICATION_TYPE;
const OneSignalConfig = {
  appId: '59c80d9f-7824-4202-9ddb-83a4d779926e',
  apiKey: 'OWExMWM1NDItOGM2Yi00Y2VlLTllZTEtOGViY2NjM2FiZTkz'
};
const OneSignalClient = new OneSignal.Client(OneSignalConfig.appId, OneSignalConfig.apiKey);
exports.sendNotification = asyncHandler(async (type, data, recipient) => {
  const {title, subTitle, content} = data;
  if (!title || !content) {
    console.log(tag, 'Sending Notification Cancelled:', 'Invalid data');
    return;
  }

  try {
    let deviceUserIds = [];

    if (type === NOTIFICATION_TYPE.ANNOUNCEMENT) {
      const userDevices = await UserDeviceSchema.find({});
      for (let device of userDevices) {
        deviceUserIds.push(device.deviceUserId)
      }
    }
    else {
      const userDevices = await UserDeviceSchema.find({
        user: recipient.id
      });
      for (let device of userDevices) {
        deviceUserIds.push(device.deviceUserId)
      }
    }

    const notification = {
      contents: {
        "en": content,
      },
      headings: {
        "en": title,
      },
      subtitle: {
        "en": subTitle,
      },
      // template_id: '',
      include_player_ids: deviceUserIds,
      // included_segments: ['Active Users']
    };

    // store into database
    const newNotification = await NotificationSchema.create({
      type,
      title,
      subTitle,
      content,
    });
    await newNotification.save();

    const newUserNotification = await UserNotificationSchema.create({
      notification: newNotification,
      user: recipient,
      read: false,
    });
    await newUserNotification.save();

    const response = await OneSignalClient.createNotification(notification);
    console.log(tag, 'Sending Notification', response.body);
  } catch (e) {
    console.log(tag, 'Sending Notification Exception', e.message)
  }
});
