require("dotenv").config();

const express = require("express");
const dns = require("dns");
const mongoose = require("mongoose");
const cors = require("cors");
const productRoutes = require('./routes/productRoutes');
const sellerRoutes = require('./routes/sellerRoutes');

const app = express();

dns.setServers(
    (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
        .split(",")
        .map((server) => server.trim())
        .filter(Boolean)
);

app.use(cors());
app.use(express.json());
app.use('/seller', productRoutes);
app.use('/api/v1/seller', sellerRoutes);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully!");
    })
    .catch((error) => {
        console.log("MongoDB connection failed:");
        console.log(error.message);
    });

app.get("/", (req, res) => {
    res.send("Backend is running!");
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});