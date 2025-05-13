const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");
const Event = require("./models/Event");
require("dotenv").config();

const scrapeEvents = async () => {
  try {
    const url = "https://www.eventbrite.com.au/d/australia--sydney/events/";
    const { data } = await axios.get(url, {
      headers: {
        // Helps bypass some basic bot protections
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    const events = [];

    // Updated wrapper and selectors (confirm via browser inspect)
    $("div.eds-event-card-content__content").each((_, el) => {
      const title = $(el).find("div.eds-event-card-content__primary-content > a > div > div").text().trim();
      const date = $(el).find("div.eds-event-card-content__sub-title").text().trim();
      const link = $(el).find("a").attr("href");

      if (title && link) {
        events.push({ title, date, link: link.startsWith("http") ? link : `https://eventbrite.com.au${link}` });
      }
    });

    if (events.length > 0) {
      await Event.deleteMany(); // Optional: clear old events
      await Event.insertMany(events);
      console.log("✅ Events saved:", events.length);
    } else {
      console.log("⚠️ No events found. Check the selector or page layout.");
    }
  } catch (error) {
    console.error("❌ Error scraping events:", error.message);
  } finally {
    mongoose.disconnect();
  }
};

// Connect and start
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("📦 MongoDB connected");
  scrapeEvents();
}).catch(err => {
  console.error("❌ MongoDB connection error:", err.message);
});

