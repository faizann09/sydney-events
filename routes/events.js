const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

router.get("/", async (req, res) => {
  const events = await Event.find();
  res.render("index", { events });
});

module.exports = router;

