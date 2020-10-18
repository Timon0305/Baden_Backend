const aws = require('aws-sdk');
const asyncHandler = require('../middleware/async');
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const multer = require('multer');
const multerS3 = require('multer-s3');

exports.uploadS3 = function upload(destinationPath) {
  return multer({
    storage: multerS3({
      s3: s3,
      acl: 'public-read',
      bucket: process.env.S3_BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        cb(
          null,
          destinationPath +
            '/' +
            Date.now().toString() +
            '_' +
            req.user.id +
            '_' +
            file.originalname
        );
      }
    })
  });
};
