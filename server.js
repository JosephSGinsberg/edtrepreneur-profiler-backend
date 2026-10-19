const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Fail fast if required settings are missing (names only, never values)
const missing = ['MONGO_URI', 'HF_API_KEY', 'JWT_SECRET'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing in .env: ${missing.join(', ')} (see .env.example)`);
  process.exit(1);
}

const app = express();

// Security and setup
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Rate limiter
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', limiter);

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000
});

    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
  }
};
connectDB();

// Simple route
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/assessment', require('./src/routes/assessment'));

app.get('/', (req, res) => {
  res.json({ message: 'Edtrepreneurship Profiler API is running!' });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
