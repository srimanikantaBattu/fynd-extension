const express = require('express');
require('dotenv').config();
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
const { GoogleGenerativeAI } = require("@google/generative-ai");

const { createClient } = require("@boltic/sdk");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// Route for Boltic Post
app.post('/api/boltic-post', async function(req, res) {
    try {
        const { product_name, image_url, price, slug, content } = req.body;
        
        // Basic validation
        if (!product_name || !price || !slug) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        if (!process.env.BOLTIC_API_KEY) {
             console.error("BOLTIC_API_KEY missing in environment variables");
             return res.status(500).json({ success: false, message: "Server configuration error: Missing Boltic API Key" });
        }

        const boltic = createClient(process.env.BOLTIC_API_KEY);

        console.log(`Posting to Boltic Table 'Instagram table' for product: ${product_name}`);

        const { data, error } = await boltic.records.insert("Instagram table", {
            content: content || "Check out this amazing product!",
            product_name: product_name,
            image_url: image_url || "",
            price: String(price), // Ensuring string if required, or keep as is if number. User implied "Have you changed price according to AI", so likely numeric or string. 
            // In docs, price can be currency/number. Let's pass as is or string? 
            // The user listed fields: content, product_name, image_url, price, slug.
            // Boltic might need exact types. I will assume flexible or string for safety unless number is obvious.
            // If price text "2499" passed, assume number. 
            // Safest is to pass what we have.
            slug: slug
        });

        if (error) {
            console.error("Boltic Insert Error:", error);
            return res.status(500).json({ success: false, message: "Failed to insert into Boltic table", error });
        }

        return res.status(200).json({ success: true, data });

    } catch(err) {
        console.error("Error in Boltic post:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Route for Trigger Crawling
app.post('/api/trigger-crawl', async function(req, res) {
    try {
        const { slug } = req.body;
        
        // Basic validation
        if (!slug) {
            return res.status(400).json({ success: false, message: "Product slug is required" });
        }

        if (!process.env.BOLTIC_API_KEY) {
             console.error("BOLTIC_API_KEY missing in environment variables");
             return res.status(500).json({ success: false, message: "Server configuration error: Missing Boltic API Key" });
        }

        const boltic = createClient(process.env.BOLTIC_API_KEY);

        console.log(`Triggering crawl for product slug: ${slug}`);

        // Insert row into TriggerTableForCrawling
        // Only passing slug - id, created_at, and updated_at should be auto-generated by Boltic
        const { data, error } = await boltic.records.insert("TriggerTableForCrawling", {
            slug: slug
        });

        if (error) {
            console.error("Boltic Trigger Crawl Insert Error:", error);
            return res.status(500).json({ success: false, message: "Failed to trigger crawling", error });
        }

        console.log(`Successfully triggered crawl for slug: ${slug}`);
        return res.status(200).json({ success: true, data, message: "Crawling triggered successfully" });

    } catch(err) {
        console.error("Error in trigger crawl:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Route to fetch offers from OfferTable
app.post('/api/offers', async function(req, res) {
    try {
        if (!process.env.BOLTIC_API_KEY) {
            console.error("BOLTIC_API_KEY missing in environment variables");
            return res.status(500).json({ success: false, message: "Server configuration error: Missing Boltic API Key" });
        }

        const boltic = createClient(process.env.BOLTIC_API_KEY);

        console.log("Fetching latest offers from OfferTable...");

        // Fetch records from OfferTable
        // Note: Boltic SDK uses findAll for querying
        let records = [];
        try {
             const result = await boltic.records.findAll("OfferTable", {
                sort: [{ field: "created_at", direction: "desc" }],
                limit: 50 // Fetch more records to ensure we get latest from both marketplaces
            });
            records = result.data || [];
            
            // In-memory sort to ensure correctness if SDK sort behaves unexpectedly
            records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            // Get the latest record for each unique marketplace (Amazon & Flipkart)
            console.log(`Total records fetched: ${records.length}`);
            const marketplaceMap = new Map();
            for (const record of records) {
                const marketplace = record.marketplace ? record.marketplace.toLowerCase() : 'unknown';
                console.log(`Processing record: ${record.id}, marketplace: ${marketplace}, created_at: ${record.created_at}`);
                // Only add if we haven't seen this marketplace yet (so we get the latest one)
                if (!marketplaceMap.has(marketplace)) {
                    marketplaceMap.set(marketplace, record);
                    console.log(`Added ${marketplace} to map`);
                }
                // Stop once we have 2 unique marketplaces
                if (marketplaceMap.size >= 2) {
                    console.log('Found 2 unique marketplaces, stopping iteration');
                    break;
                }
            }
            
            // Convert map back to array
            records = Array.from(marketplaceMap.values());
            console.log(`Final records count: ${records.length}`);
            console.log('Marketplaces:', records.map(r => r.marketplace));
        } catch (sdkError) {
             console.error("Boltic SDK Fetch Error:", sdkError);
             return res.status(500).json({ success: false, message: "Failed to fetch offers from Boltic", error: sdkError.message });
        }

        if (records.length === 0) {
            return res.status(200).json({ success: true, offers: [] });
        }

        // Parse the output JSON for each record
        const parsedOffers = records.map(record => {
            try {
                // Clean the output string - remove markdown code blocks if present
                let outputStr = record.output || "{}";
                
                // Remove markdown code blocks like ```json ... ```
                outputStr = outputStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                
                // Parse the JSON
                const parsedOutput = JSON.parse(outputStr);
                
                return {
                    marketplace: record.marketplace,
                    data: parsedOutput,
                    created_at: record.created_at,
                    id: record.id
                };
            } catch (parseErr) {
                console.error(`Failed to parse output for record ${record.id}:`, parseErr);
                console.error("Raw output:", record.output);
                return {
                    marketplace: record.marketplace,
                    data: null,
                    error: "Failed to parse JSON",
                    created_at: record.created_at,
                    id: record.id
                };
            }
        });

        console.log(`Successfully fetched and parsed ${parsedOffers.length} offers`);
        return res.status(200).json({ success: true, offers: parsedOffers });

    } catch(err) {
        console.error("Error fetching offers:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Route for AI Price Analysis
app.post('/api/ai-analyze-price', async function(req, res) {
    try {
        const { productName, myPrice } = req.body;
        
        if (!process.env.BOLTIC_API_KEY) {
            return res.status(500).json({ success: false, message: "Server configuration error: Missing Boltic API Key" });
        }

        const boltic = createClient(process.env.BOLTIC_API_KEY);

        // 1. Fetch Latest 2 Competitor Records from OfferTable
        let competitorRecords = [];
        try {
             const result = await boltic.records.findAll("OfferTable", {
                sort: [{ field: "created_at", direction: "desc" }],
                limit: 10
            });
            competitorRecords = result.data || [];

            // In-memory sort to ensure correctness if SDK sort behaves unexpectedly
            competitorRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            // Take top 2 strictly
            competitorRecords = competitorRecords.slice(0, 2);
        } catch (sdkError) {
             console.error("Boltic SDK Fetch Error inside Analyze:", sdkError);
             return res.status(500).json({ success: false, message: "Failed to fetch competitor data for analysis" });
        }

        if (competitorRecords.length === 0) {
            return res.status(404).json({ success: false, message: "No competitor data found to analyze." });
        }

        // 2. Parse Data
        const parsedCompetitors = competitorRecords.map(r => {
            try {
                let outputStr = r.output || "{}";
                outputStr = outputStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                return { platform: r.marketplace, data: JSON.parse(outputStr) };
            } catch (e) { return null; }
        }).filter(Boolean);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are an expert E-commerce Strategy Consultant.
        
        TARGET PRODUCT: "${productName}"
        CURRENT PRICE: ${myPrice ? myPrice : 'Not Set'}

        COMPETITOR DATA (Latest Scraped):
        ${JSON.stringify(parsedCompetitors, null, 2)}

        ANALYSIS TASK:
        1. **Compare** the competitor offers against my product.
        2. **Identify Offers**: Which specific offers (Bank discounts, coupons, EMI) are competitors running that I should also run? "What offers can be kept?"
        3. **Pricing Strategy**: How should I change my price to GRAB USER ATTENTION immediately? (e.g., Psychological pricing, massive discount display, undercutting key rival).

        OUTPUT FORMAT (Strict JSON):
        {
            "comparison_summary": "Brief 1-sentence comparison.",
            "pricing_strategy": {
                "recommended_price": <number>,
                "action": "<Short title, e.g., Undercut Amazon>",
                "attention_tactic": "<How to grab attention, e.g. Show 60% OFF>"
            },
            "suggested_offers_to_adopt": [
                "<Specific Offer 1>",
                "<Specific Offer 2>"
            ]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        let jsonResponse;
        try {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            jsonResponse = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse Gemini response:", text);
            return res.status(500).json({ success: false, message: "AI response parsing failed" });
        }

        return res.status(200).json({ success: true, data: jsonResponse });

    } catch(err) {
        console.error("Error in AI analysis:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Route for RAG Chat


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

// RAG Chat Endpoint (Authenticated)
productRouter.post('/chat-rag', async function(req, res, next) {
    try {
        const { query } = req.body;
        const platformClient = req.platformClient;

        if (!query) {
            return res.status(400).json({ success: false, message: "Query is required" });
        }

        // Step 1: Fetch Scraped Competitor Data from MongoDB
        const crawledDoc = await ComparisonData.findOne().sort({ createdAt: -1 });
        const crawledItems = crawledDoc ? crawledDoc.crawledData : [];

        if (crawledItems.length === 0) {
            return res.status(200).json({ 
                success: true, 
                answer: "I don't have any competitor data available at the moment. Please ensure the scraping process has run successfully." 
            });
        }

        // Step 2: Fetch Your Store's Products
        let myProducts = [];
        if (platformClient) {
            try {
                const productsResponse = await platformClient.catalog.getProducts();
                myProducts = productsResponse.items || [];
                console.log(`Fetched ${myProducts.length} products from your store`);
            } catch (e) {
                console.warn("Failed to fetch your products:", e.message);
            }
        }

        // Step 3: Build Rich Context for RAG
        const productContext = crawledItems.map((item, index) => {
            // Find matching product in your store
            const myProduct = myProducts.find(p => 
                (p.slug && item.slug && p.slug === item.slug) || 
                (p.name && item.name && p.name.toLowerCase().trim() === item.name.toLowerCase().trim())
            );

            // Extract your price
            const myPrice = myProduct?.price?.effective?.min;
            const myPriceStr = myPrice ? `₹${myPrice}` : 'Not in your store';

            // Extract competitor prices (Amazon, Flipkart, Myntra, etc.)
            const competitorPrices = [];
            const marketplaces = item.marketplaces || {};
            
            for (const [marketplace, data] of Object.entries(marketplaces)) {
                if (data?.items && data.items.length > 0) {
                    const price = data.items[0]?.price?.value;
                    const rating = data.items[0]?.rating;
                    const delivery = data.items[0]?.delivery_time;
                    
                    if (price) {
                        competitorPrices.push({
                            platform: marketplace.charAt(0).toUpperCase() + marketplace.slice(1),
                            price: `₹${price}`,
                            rating: rating || 'N/A',
                            delivery: delivery || 'N/A'
                        });
                    }
                }
            }

            // Calculate price insights
            const allPrices = competitorPrices.map(c => parseFloat(c.price.replace('₹', '').replace(',', '')));
            if (myPrice) allPrices.push(myPrice);
            
            const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
            const highestPrice = allPrices.length > 0 ? Math.max(...allPrices) : null;
            const avgPrice = allPrices.length > 0 ? (allPrices.reduce((a, b) => a + b, 0) / allPrices.length).toFixed(2) : null;

            return `
### Product ${index + 1}: ${item.name}
**Slug**: ${item.slug}
**Your Store Price**: ${myPriceStr}

**Competitor Prices**:
${competitorPrices.map(c => `- ${c.platform}: ${c.price} (Rating: ${c.rating}, Delivery: ${c.delivery})`).join('\n') || '- No competitor data available'}

**Market Analysis**:
- Lowest Market Price: ₹${lowestPrice}
- Highest Market Price: ₹${highestPrice}
- Average Market Price: ₹${avgPrice}
- Your Position: ${myPrice ? (myPrice === lowestPrice ? 'BEST PRICE ✓' : myPrice === highestPrice ? 'HIGHEST PRICE' : 'COMPETITIVE') : 'Not Listed'}
            `.trim();
        }).join('\n\n' + '='.repeat(80) + '\n\n');

        // Step 4: Create RAG Prompt with Rich Context
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const ragPrompt = `You are an expert E-commerce Pricing Analyst and Assistant. You have access to comprehensive product comparison data between the user's store and major marketplaces (Amazon, Flipkart, Myntra, etc.).

📊 COMPLETE PRODUCT COMPARISON DATA:
${productContext}

${myProducts.length === 0 ? '\n⚠️ NOTE: Unable to fetch your store products. Analysis will focus only on competitor data.\n' : ''}

👤 USER QUESTION: "${query}"

🎯 YOUR ROLE AS PRICING ASSISTANT:
You must analyze the data above and provide intelligent, actionable insights based on the user's question.

GUIDELINES:
1. **Answer Based on Data**: Use ONLY the product comparison data provided above
2. **Be Specific**: Reference actual product names, prices, and platforms from the data
3. **Compare Intelligently**: 
   - Highlight price differences between your store and competitors
   - Identify best deals and opportunities
   - Suggest optimal pricing strategies
4. **Provide Context**: Explain WHY certain prices are better (considering ratings, delivery, etc.)
5. **Be Concise**: Give clear, actionable answers without unnecessary fluff
6. **Handle All Questions**: 
   - Product comparisons ("compare product X")
   - Pricing advice ("should I lower prices?")
   - Market insights ("which platform has best prices?")
   - Specific queries ("what's the price of X on Amazon?")
   - General help ("help me optimize pricing")

7. **Format Well**: Use bullet points, bold text, and clear structure for readability

🤖 YOUR INTELLIGENT RESPONSE:`;

        const result = await model.generateContent(ragPrompt);
        const response = await result.response;
        const answer = response.text();

        return res.status(200).json({ success: true, answer });

    } catch(err) {
        console.error("Error in RAG Chat:", err);
        return res.status(500).json({ success: false, message: err.message });
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
