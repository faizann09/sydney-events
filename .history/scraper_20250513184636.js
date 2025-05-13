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

    console.log("🔍 Inspecting page HTML...");
    const eventCards = $("div[class*='event-card'], div[class*='Stack_root'], section[class*='event'], article[class*='card']");
    console.log(`Found ${eventCards.length} potential event cards.`);

    eventCards.each((index, el) => {
      console.log(`Event ${index + 1} HTML:`, $(el).html().substring(0, 200) + "...");

      const title = $(el).find("h1, h2, h3, [class*='title'], [class*='event-name']").text().trim();
      const date = $(el).find("time, [class*='date'], [class*='time'], p, span").text().trim();
      const link = $(el).find("a").attr("href");

      if (title && link) {
        const fullLink = link.startsWith("http") ? link : `https://www.eventbrite.com.au${link}`;
        events.push({ title, date, link: fullLink });
        console.log(`✅ Found event: ${title}`);
      } else {
        console.log(`⚠️ Event ${index + 1} missing title or link.`);
      }
    });

    if (events.length > 0) {
      await Event.deleteMany();
      await Event.insertMany(events);
      console.log("✅ Events saved:", events.length);
    } else {
      console.log("⚠️ No events found. Check the selector or page layout.");
    }
  } catch (error) {
    console.error("❌ Error scraping events:", error.message);
  }
};

// Export the function
module.exports = scrapeEvents;