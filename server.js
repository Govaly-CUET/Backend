require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const adminRoutes = require('./routes/adminRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
// const authRoutes = require('./routes/authRoutes');

const app = express();

// Connect to MongoDB (uses the connectDB() you already wrote in config/db.js)
connectDB();

// Global middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Routes
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/seller', sellerRoutes);
// app.use('/api/v1/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});