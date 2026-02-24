const mongoose = require('mongoose');

const defaultUri = 'mongodb://127.0.0.1:27017/buzzit';

const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI || defaultUri;

  if (!mongoUri || typeof mongoUri !== 'string') {
    console.error('MongoDB connection failed: MONGO_URI is missing or invalid');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected ...`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;
