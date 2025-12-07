const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require("path");
const sqlite3 = require('sqlite3').verbose();
const serveStatic = require("serve-static");
const { readFileSync } = require('fs');
const { setupFdk } = require("@gofynd/fdk-extension-javascript/express");
const { SQLiteStorage } = require("@gofynd/fdk-extension-javascript/express/storage");
const sqliteInstance = new sqlite3.Database('session_storage.db');
const { generateTryOn } = require("./pixelbin");
const mongoose = require('mongoose');

// Connect to MongoDB
if (process.env.DB_URL) {
    mongoose.connect(process.env.DB_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));
} else {
    console.warn("DB_URL not found in environment variables");
}

const comparisonSchema = new mongoose.Schema({
  crawledData: Array,
  createdAt: Date
}, { collection: 'fynd' });

const ComparisonData = mongoose.model('ComparisonData', comparisonSchema);

const productRouter = express.Router();


const fdkExtension = setupFdk({
    api_key: process.env.EXTENSION_API_KEY,
    api_secret: process.env.EXTENSION_API_SECRET,
    base_url: process.env.EXTENSION_BASE_URL,
    cluster: process.env.FP_API_DOMAIN,
    callbacks: {
        auth: async (req) => {
            // Write you code here to return initial launch url after auth process complete
            if (req.query.application_id)
                return `${req.extension.base_url}/company/${req.query['company_id']}/application/${req.query.application_id}`;
            else
                return `${req.extension.base_url}/company/${req.query['company_id']}`;
        },
        
        uninstall: async (req) => {
            // Write your code here to cleanup data related to extension
            // If task is time taking then process it async on other process.
        }
    },
    storage: new SQLiteStorage(sqliteInstance,"exapmple-fynd-platform-extension"), // add your prefix
    access_mode: "online",
    webhook_config: {
        api_path: "/api/webhook-events",
        notification_email: "useremail@example.com",
        event_map: {
            "company/product/delete": {
                "handler": (eventName) => {  console.log(eventName)},
                "version": '1'
            }
        }
    },
});

const STATIC_PATH = process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), 'frontend', 'public' , 'dist')
    : path.join(process.cwd(), 'frontend');
    
const app = express();
const platformApiRoutes = fdkExtension.platformApiRoutes;

// Middleware to parse cookies with a secret key
app.use(cookieParser("ext.session"));

// Middleware to parse JSON bodies with a size limit of 2mb
app.use(bodyParser.json({
    limit: '2mb'
}));

// Serve static files from the React dist directory
app.use(serveStatic(STATIC_PATH, { index: false }));

// FDK extension handler and API routes (extension launch routes)
app.use("/", fdkExtension.fdkHandler);

// Route to handle webhook events and process it.
app.post('/api/webhook-events', async function(req, res) {
    try {
      console.log(`Webhook Event: ${req.body.event} received`)
      await fdkExtension.webhookRegistry.processWebhook(req);
      return res.status(200).json({"success": true});
    } catch(err) {
      console.log(`Error Processing ${req.body.event} Webhook`);
      return res.status(500).json({"success": false});
    }
})

// Route to handle virtual try-on
app.post('/api/try-on', async function(req, res) {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) {
            return res.status(400).json({ success: false, message: "Image URL is required" });
        }
        console.log(`Received try-on request for image: ${imageUrl}`);
        const output = await generateTryOn(imageUrl);
        return res.status(200).json({ success: true, output });
    } catch(err) {
        console.error("Error processing try-on request:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Route to get comparison data
app.get('/api/comparison-data', async function(req, res) {
    try {
        const data = await ComparisonData.findOne().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data });
    } catch(err) {
        console.error("Error fetching comparison data:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

productRouter.get('/', async function view(req, res, next) {
    try {
        const {
            platformClient
        } = req;
        const data = await platformClient.catalog.getProducts()
        return res.json(data);
    } catch (err) {
        next(err);
    }
});

// Get products list for application
productRouter.get('/application/:application_id', async function view(req, res, next) {
    try {
        const {
            platformClient
        } = req;
        const { application_id } = req.params;
        const data = await platformClient.application(application_id).catalog.getAppProducts()
        return res.json(data);
    } catch (err) {
        next(err);
    }
});

// Aggregate comparison data
productRouter.get('/compare', async function view(req, res, next) {
    try {
        const {
            platformClient
        } = req;

        // 1. Fetch Latest Crawled Data (Primary Source)
        const crawledDoc = await ComparisonData.findOne().sort({ createdAt: -1 });
        const crawledItems = crawledDoc ? crawledDoc.crawledData : [];
        console.log(`Fetched ${crawledItems.length} crawled items from MongoDB.`);

        // 2. Fetch Company Products (Enrichment Source - Optional)
        let appProducts = [];
        try {
            const appProductsResponse = await platformClient.catalog.getProducts();
            appProducts = appProductsResponse.items || [];
            console.log(`Fetched ${appProducts.length} products from Fynd.`);
        } catch (e) {
            console.warn("Failed to fetch Fynd products:", e.message);
        }

        // 3. Aggregate Data (Driving off Crawled Data)
        const aggregatedData = crawledItems.map(crawledItem => {
            // Find matching Fynd product for extra details (like official image)
            const fyndMatch = appProducts.find(p => 
                (p.slug && crawledItem.slug && p.slug === crawledItem.slug) || 
                (p.name && crawledItem.name && p.name.toLowerCase().trim() === crawledItem.name.toLowerCase().trim())
            );

            // Construct Fynd Details
            // Use matched product if available, otherwise fallback to crawled data basic info
            const fynd_details = fyndMatch || {
                name: crawledItem.name,
                slug: crawledItem.slug,
                // Fallback image from first available marketplace item
                media: [] 
            };

            // If no official image, try to grab one from marketplace data for display
            let displayImage = null;
            if (fyndMatch && fyndMatch.media && fyndMatch.media.length > 0) {
                 displayImage = fyndMatch.media[0].url;
            } else {
                 // Iterate marketplaces to find a valid image
                 const markets = crawledItem.marketplaces || {};
                 for (const mKey of Object.keys(markets)) {
                     if (markets[mKey]?.items?.[0]?.image_url) {
                         displayImage = markets[mKey].items[0].image_url;
                         break;
                     }
                 }
            }
            // Attach custom property for frontend to use easily
            fynd_details.display_image = displayImage;


            let competitorData = crawledItem.marketplaces || {};
            let bestPrice = Infinity;
            let bestPlatform = null;

            // Calculate best price
            Object.entries(competitorData).forEach(([platform, data]) => {
                if (data && data.items && data.items.length > 0) {
                    const price = data.items[0].price.value;
                    if (price < bestPrice) {
                        bestPrice = price;
                        bestPlatform = platform;
                    }
                }
            });

            if (bestPrice === Infinity) {
                bestPrice = null;
                bestPlatform = null;
            }

            return {
                fynd_details: fynd_details,
                competitor_details: competitorData,
                best_price: bestPrice,
                best_platform: bestPlatform,
                has_competitor_data: true
            };
        });

        return res.json({ success: true, items: aggregatedData });
    } catch (err) {
        console.error("Aggregation Error:", err);
        next(err);
    }
});

// FDK extension api route which has auth middleware and FDK client instance attached to it.
platformApiRoutes.use('/products', productRouter);

// If you are adding routes outside of the /api path, 
// remember to also add a proxy rule for them in /frontend/vite.config.js
app.use('/api', platformApiRoutes);

// Serve the React app for all other routes
app.get('*', (req, res) => {
    return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(path.join(STATIC_PATH, "index.html")));
});

module.exports = app;
