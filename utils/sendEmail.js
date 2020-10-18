const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-1' });

const sendEmail = async (user, Template, conf) => {
  var params = {
    Destination: {
      ToAddresses: user.username.split(' ')
    },
    Source: 'no-reply@klynd.com',
    Template,
    TemplateData: JSON.stringify(conf)
  };

  var sendPromise = new AWS.SES({ apiVersion: '2010-12-01' })
    .sendTemplatedEmail(params)
    .promise();

  // Handle promise's fulfilled/rejected states
  sendPromise;
};

module.exports = sendEmail;
