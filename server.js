require('dotenv').config();

const express = require('express');
const dns = require('dns');
const cors = require('cors');
const connectDB = require('./config/db');

const adminRoutes = require('./routes/adminRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const customerRoutes = require('./routes/customerRoutes');
const sellerProductRoutes = require('./routes/sellerProductRoutes');

const app = express();

dns.setServers(
    (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
        .split(",")
        .map((server) => server.trim())
        .filter(Boolean)
);

connectDB();

/*
 * Two separate Vite dev apps (Admin_repo, Seller_repo) hit this
 * backend, and Vite bumps to the next free port whenever one is
 * already taken (5173, 5174, 5175, ...) — a single hardcoded origin
 * silently breaks whichever app didn't land on it. CLIENT_URL can
 * still override/extend this with a comma-separated list in
 * production; the localhost range below only matters in dev.
 */
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // same-origin / curl / server-to-server
  if (configuredOrigins.includes(origin)) return true;
  return /^http:\/\/localhost:5\d{3}$/.test(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.use('/seller', sellerProductRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/seller', sellerRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/customer', customerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});