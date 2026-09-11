const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 1. Load Environment Variables (সবকিছুর আগে)
const envResult = dotenv.config();
console.log("Dotenv Parsed Keys:", envResult.parsed);

// 2. Database Connection & Routes Import
const connectDB = require('./config/db');
const sellerRoutes=require('./routes/sellerRoutes'); // sellerRouter ke  niye aslam
const adminRoutes=require('./routes/adminRoutes');  // admin routes ke niye aslam

// 3. Connect to MongoDB Atlas
connectDB();

// 4. Initialize Express App
const app = express();

// 5. Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Govaly Backend API is running successfully'
  });
});


// API for Register 
app.use('/api/v1/seller',sellerRoutes);
// Api for vericication for seller  in admin page 
app.use('/api/v1/admin',adminRoutes);

// 8. Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});