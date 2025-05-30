


// const express = require('express');
// const puppeteer = require('puppeteer');
// const cors = require('cors');

// const app = express();
// const PORT = 5000;

// app.use(cors());

// app.get('/api/events', async (req, res) => {
//   const url = 'https://premier.ticketek.com.au/search/SearchResults.aspx?k=sydney';

//   try {
//     const browser = await puppeteer.launch({
//       headless: true,
//       args: ['--no-sandbox', '--disable-setuid-sandbox'],
//     });

//     const page = await browser.newPage();

//     await page.setUserAgent(
//       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
//     );

//     await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

//     await page.waitForSelector('.resultModule', { timeout: 10000 });

//     const events = await page.evaluate(() => {
//       const modules = document.querySelectorAll('.resultModule');
//       return Array.from(modules).map((mod) => {
//         const getText = (sel) => mod.querySelector(sel)?.innerText.trim() || '';
//         const getAttr = (sel, attr) => mod.querySelector(sel)?.getAttribute(attr) || '';

//         return {
//           title: getText('.contentEvent h6'),
//           image: getAttr('.contentImage img', 'src')?.startsWith('//')
//             ? 'https:' + getAttr('.contentImage img', 'src')
//             : getAttr('.contentImage img', 'src'),
//           venue: getText('.contentLocation'),
//           date: getText('.contentDate'),
//           ticketLink: getAttr('.resultBuyNow a', 'href')
//             ? 'https://premier.ticketek.com.au' + getAttr('.resultBuyNow a', 'href')
//             : '',
//         };
//       });
//     });

//     await browser.close();

//     res.json(events);
//   } catch (error) {
//     console.error('Scraping error:', error.message);
//     res.status(500).json({ error: 'Failed to scrape events' });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });


const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

const app = express();
dotenv.config();


app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

const PORT = 3001;

async function scrapeEvents() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('Navigating to Ticketek...');
    await page.goto('https://premier.ticketek.com.au/search/SearchResults.aspx?k=sydney', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for the result modules to load
    await page.waitForSelector('.resultModule', { timeout: 10000 });

    const events = await page.evaluate(() => {
      const modules = Array.from(document.querySelectorAll('.resultModule'));
      
      return modules.map(module => {
        // Extract image information
        const imageDiv = module.querySelector('.contentImage');
        const image = {
          src: imageDiv?.querySelector('img')?.src || '',
          alt: imageDiv?.querySelector('img')?.alt || '',
          link: imageDiv?.querySelector('a')?.href || ''
        };

        // Extract event information
        const eventDiv = module.querySelector('.contentEvent');
        const eventName = eventDiv?.querySelector('h6')?.innerText.trim() || '';

        // Extract location and date
        const eventDetails = module.querySelector('.contentEventAndDate');
        const location = eventDetails?.querySelector('.contentLocation')?.innerText.trim() || '';
        const date = eventDetails?.querySelector('.contentDate')?.innerText.trim() || '';

        // Extract ticket link
        const buyNowDiv = module.querySelector('.resultBuyNow');
        const ticketLink = buyNowDiv?.querySelector('a')?.href || '';

        return {
          eventName,
          image,
          location,
          date,
          ticketLink,
          rawHtml: module.outerHTML // Include raw HTML for debugging
        };
      });
    });

    await browser.close();
    return events;
  } catch (error) {
    console.error('Scraping error:', error);
    await browser.close();
    throw error;
  }
}

app.get('/api/events', async (req, res) => {
  try {
    console.log('Fetching event data...');
    const events = await scrapeEvents();
    res.json(events);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch events',
      details: error.message
    });
  }
});

app.use(express.static(path.join(__dirname, "/client/dist")));
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "client", "dist", "index.html"));
})

app.listen(PORT, () => {
  console.log(`Scraper server running on http://localhost:${PORT}`);
});