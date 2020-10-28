/*---------------------------------------
| This is the backend framework for Docitoo ,
| built by Ricky Keele. Unauthorized use is strictly
| prohibited and Docitoo reserves the right to take legal action
| at their own discretion
|
|----------------------------------------
|   Load Dependencies
|----------------------------------------*/

/*------------
|   Express Framework
|-------------*/
const express = require('express');
/*------------
|   dotEnv - allows the use of global environment variables with process.env
|-------------*/
const dotenv = require('dotenv');
const config = dotenv.config({
  path: './config/config.env'
});
/*------------
|   Morgan - dev package
|-------------*/
const morgan = require('morgan');
/*------------
|   Console Colors
|-------------*/
const colors = require('colors');
/*------------
|   ErrorHandler Middleware
|-------------*/
const errorHandler = require('./middleware/error');
/*------------
|   Cookie Parser - allows cookies to be sent
|-------------*/
const cookieParser = require('cookie-parser');
/*------------
|   AMAZON WEB SERVICES
|-------------*/
const AWS = require('aws-sdk');
/*------------
|   Cross-Origin Resource Sharing
|-------------*/
const cors = require('cors');
const bodyParser = require('body-parser');
/*------------
|   Request IP
|-------------*/
const requestIp = require('request-ip');
const expressip = require('express-ip');
const connectDB = require('./config/dbConnect');
const http = require('http');
const https = require('https');

/*--------------------------------
| >>**Security**<<
| The following dependencies are required in order to
| ensure the security of the Docitoo Framework. MongoSanitizer
| sanitizes queries, POST and GET, in order to prevent Mongo
| functions from being sent in the query, which can cause
| potential misuse and lead to harm. The helmet package prevents
| harmful HTTP headers, and the XSS package prevents harmful html
| from being sent in the query.*/

const mongoSanitizer = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');

//--------------------------------

// Connect to MongoDB database

connectDB();

// Route files

const user = require('./routes/user');
const admin = require('./routes/admin');
const util = require('./routes/util');
const pill = require('./routes/pill');
const userDoctor = require('./routes/userDoctor');
const driverList = require('./routes/driverList');
const driver = require('./routes/driver');


const app = express();
// JSON interpreter

app.use(express.json({'limit': '50mb'}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(mongoSanitizer());
app.use(helmet());
app.use(xss());
app.use(requestIp.mw());
app.use(expressip().getIpInfoMiddleware);
app.use(cors());
app.use(express.static('public'));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Mount

app.use('/api/admin', admin);
app.use('/api/user', user);
app.use('/api/util', util);
app.use('/api/userDoctor', userDoctor);
app.use('/api/driver', driverList);

// Driver
app.use('/api2/user', driver);

app.use(errorHandler);

app.get('/', async (req, res, next) => {
  res.status(200).send('Welcome to the BADEN api');
});
//
const expressSwagger = require('express-swagger-generator')(app);

let options = {
  swaggerDefinition: {
    info: {
      description: 'BADEN API server',
      title: 'BADEN',
      version: '1.0.0',
    },
    host: 'localhost:3000',
    basePath: '/api',
    produces: [
      "application/json",
      // "application/xml"
    ],
    schemes: [
      'http',
      // 'https'
    ],
    securityDefinitions: {
      JWT: {
        type: 'apiKey',
        in: 'header',
        name: 'userToken',
        description: "",
      }
    }
  },
  basedir: __dirname, //app absolute path
  files: ['./Controllers/*.js'] //Path to the API handle folder
};
expressSwagger(options);


const port = process.env.PORT || 80;

http.createServer(app).listen(port,
  function() {
    console.log(
      `App running in ${process.env.NODE_ENV} mode on port ${port}`.blue.bold
    );
  });

// https.createServer(app).listen(443,
//   function() {
//     console.log(
//       `App running in ${process.env.NODE_ENV} mode on port 443`.blue.bold
//     );
//   });

process.on('unhandledRejection', (err, promise) => {
  console.log(`UnhandledRejection: ${err.message}`.red.bold);
  // Close App
  if (process.env.NODE_ENV !== 'production') {
    //server.close(() => process.exit(1));
  }
});
