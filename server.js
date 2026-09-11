require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();

// 5. Global Middlewares
app.use(cors());
app.use(express.json());

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