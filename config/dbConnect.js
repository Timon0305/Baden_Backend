const mongoose = require('mongoose');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true
  });

  console.log(`Connected to MongoDB: ${conn.connection.host}`.yellow.bold);
};

module.exports = connectDB;
