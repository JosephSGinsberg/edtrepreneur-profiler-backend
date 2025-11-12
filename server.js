const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
console.log('Loaded HF Key:', process.env.HF_API_KEY ? process.env.HF_API_KEY.slice(0, 8) + '...' : '❌ MISSING');

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
console.log("🧩 Auth route loaded:", require('./src/routes/auth'));
app.use('/api/assessment', require('./src/routes/assessment'));

app.get('/', (req, res) => {
  res.json({ message: 'Edtrepreneurship Profiler API is running!' });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
