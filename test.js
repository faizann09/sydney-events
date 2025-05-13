const mongoose = require("mongoose");
const Event = require("./models/Event");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const events = await Event.find();
  console.log("📦 Events in DB:", events);
  mongoose.disconnect();
});
