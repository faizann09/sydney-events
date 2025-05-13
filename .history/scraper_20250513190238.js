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

      // More specific selector for the title (only the main title)
      const titleElement = $(el).find("h1, h2, h3, [class*='title'], [class*='event-name']").first();
      let title = titleElement.text().trim();

      // More specific selector for the date (only the main date/time and location)
      const dateElement = $(el).find("time, [class*='date'], [class*='time']").first();
      let date = dateElement.text().trim();

      // Fallback for date if not found in time element
      if (!date) {
        date = $(el).find("p, span").filter((i, elem) => $(elem).text().includes(" at ")).first().text().trim();
      }

      const link = $(el).find("a").attr("href");

      // Clean the title: Remove "Save this event" and duplicates
      if (title) {
        title = title.replace(/Save this event:.*?$/i, "").trim(); // Remove "Save this event" and anything after
        title = [...new Set(title.split(/(2025 Sydney Property Expo)/i).filter(Boolean))].join("").trim(); // Remove duplicates
      }

      // Clean the date: Remove "Check ticket price" and duplicates
      if (date) {
        date = date.replace(/Check ticket price for event.*?$/i, "").trim(); // Remove "Check ticket price" and anything after
        date = [...new Set(date.split(/(Saturday at 10:00 AM)/i).filter(Boolean))].join("").trim(); // Remove duplicates
      }

      if (title && link) {
        const fullLink = link.startsWith("http") ? link : `https://www.eventbrite.com.au${link}`;
        events.push({ title, date, link: fullLink });
        //console.log(`✅ Found event: ${title}`);
      } else {
       // console.log(`⚠️ Event ${index + 1} missing title or link.`);
      }
    });

    // Remove duplicates across events based on title and link
    const uniqueEvents = Array.from(
      new Map(events.map(event => [`${event.title}-${event.link}`, event])).values()
    );

    if (uniqueEvents.length > 0) {
      await Event.deleteMany();
      await Event.insertMany(uniqueEvents);
      
    } else {
      console.log("⚠️ No events found. Check the selector or page layout.");
    }
  } catch (error) {
    console.error("❌ Error scraping events:", error.message);
  }
};

module.exports = scrapeEvents;