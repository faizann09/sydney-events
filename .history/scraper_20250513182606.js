const axios = require("axios");
const cheerio = require("cheerio");
const Event = require("./models/Event");


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

  await Event.deleteMany({});
  await Event.insertMany(events);
};
scrapeEvents().then(events => {
  console.log(events);
});


module.exports = scrapeEvents;
