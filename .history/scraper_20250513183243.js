const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");
const Event = require("./models/Event");
require("dotenv").config();

const scrapeEvents = async () => {
  const url = "https://www.eventbrite.com.au/d/australia--sydney/events/";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const events = [];

  $(".search-event-card-wrapper").each((_, el) => {
    const title = $(el).find(".eds-event-card__formatted-name--is-clamped").text().trim();
    const date = $(el).find(".eds-text-bs--fixed").text().trim();
    const link = $(el).find("a").attr("href");
    if (title && link) {
      events.push({ title, date, link });
    }
  });

  if (events.length > 0) {
    await Event.deleteMany(); // Optional: clear old events
    await Event.insertMany(events);
    console.log("✅ Events saved:", events.length);
  } else {
    console.log("⚠️ No events found");
  }

  mongoose.disconnect();
};

mongoose.connect(process.env.MONGO_URI).then(scrapeEvents);
