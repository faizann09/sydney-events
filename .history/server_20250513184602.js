const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const scrapeEvents = require("./scraper.js");

// Load environment variables
dotenv.config();
const app = express();

// View Engine and Static
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1); // Exit if connection fails
  }
};

// Routes
const eventRoutes = require("./routes/events.js");
app.use("/", eventRoutes);

// Start the server and run scraper only after DB connection
const startServer = async () => {
  await connectDB(); // Wait for DB connection
  scrapeEvents(); // Run scraper after DB is connected

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
};

// Start the server
startServer();

// Global error handler for uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});