const fs = require('fs');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-1' });
const dotenv = require('dotenv');
const config = dotenv.config({
  path: './config.env'
});
const HTML = fs.readFileSync('./templates/welcome.html', 'utf8');
const txt = fs.readFileSync('./templates/welcome.txt', 'utf8');

const params = {
  Template: {
    TemplateName: 'welcome',
    HtmlPart: HTML,
    SubjectPart: 'Welcome to Docitoo, {{firstName}}!',
    TextPart: txt
  }
};

var templatePromise = new AWS.SES({ apiVersion: '2010-12-01' })
  .updateTemplate(params)
  .promise();

templatePromise
  .then(function(data) {
    console.log(data);
  })
  .catch(function(err) {
    console.error(err, err.stack);
  });
