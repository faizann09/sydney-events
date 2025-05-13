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
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    const events = [];

    // Updated selector: Look for event cards (adjust based on inspection)
    $("div[class*='event-card'], div[class*='Stack_root']").each((_, el) => {
      const title = $(el).find("h2, [class*='event-name'], [class*='title']").text().trim();
      const date = $(el).find("[class*='date'], [class*='time'], [class*='sub-title']").text().trim();
      const link = $(el).find("a").attr("href");

      if (title && link) {
        const fullLink = link.startsWith("http") ? link : `https://www.eventbrite.com.au${link}`;
        events.push({ title, date, link: fullLink });
      }
    });

    if (events.length > 0) {
      await Event.deleteMany(); // Clear old events
      await Event.insertMany(events);
      console.log("✅ Events saved:", events.length);
    } else {
      console.log("⚠️ No events found. Check the selector or page layout.");
    }
  } catch (error) {
    console.error("❌ Error scraping events:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
};

// Connect and start
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("📦 MongoDB connected");
  scrapeEvents();
}).catch(err => {
  console.error("❌ MongoDB connection error:", err.message);
});