require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const adminRoutes = require('./routes/adminRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const customerRoutes = require('./routes/customerRoutes');

const adminCategoryRoutes = require(
  "./routes/adminCategoryRoutes"
);

const app = express();

connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/seller', sellerRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/customer', customerRoutes);

app.use("/api/v1/admin/categories", adminCategoryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});