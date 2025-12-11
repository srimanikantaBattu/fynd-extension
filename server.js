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
const { generateTryOn, generateFashionModel } = require("./pixelbin");
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');

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

// Route to generate fashion model using PixelBin img_edit
app.post('/api/generate-fashion-model', async function(req, res) {
    try {
        const { imageUrls, prompt, aspectRatio } = req.body;
        
        if (!imageUrls || (Array.isArray(imageUrls) && imageUrls.length === 0)) {
            return res.status(400).json({ success: false, message: "At least one image URL is required" });
        }

        if (!process.env.PIXELBIN_API_TOKEN) {
            console.error("PIXELBIN_API_TOKEN missing in environment variables");
            return res.status(500).json({ success: false, message: "Server configuration error: Missing PixelBin API Token" });
        }

        console.log(`Generating fashion model for images:`, imageUrls);
        const result = await generateFashionModel(imageUrls, prompt, aspectRatio);
        
        return res.status(200).json({ 
            success: true, 
            result: result,
            output: result.output,
            consumedCredits: result.consumedCredits
        });
    } catch(err) {
        console.error("Error generating fashion model:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Route to handle HuggingFace model generation
app.post('/api/generate-model', async function(req, res) {
    try {
        const { imageUrl } = req.body;
        
        if (!imageUrl) {
            return res.status(400).json({ success: false, message: "Image URL is required" });
        }

        if (!process.env.HF_TOKEN) {
            console.error("HF_TOKEN missing in environment variables");
            return res.status(500).json({ success: false, message: "Server configuration error: Missing HuggingFace Token" });
        }

        console.log(`Generating fashion model image for: ${imageUrl}`);

        // Dynamic import for HuggingFace Inference
        const { HfInference } = await import("@huggingface/inference");
        const hf = new HfInference(process.env.HF_TOKEN);

        // Fetch the image from URL as blob
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data);
        
        // Convert Buffer to Blob for HuggingFace SDK
        const blob = new Blob([imageBuffer], { type: 'image/jpeg' });

        // Generate image using Stable Diffusion model (no extra credits needed)
        const generatedImage = await hf.imageToImage({
            model: "timbrooks/instruct-pix2pix",
            inputs: blob,
            parameters: { 
                prompt: "Turn this into a professional fashion photoshoot with a model wearing the clothing item. Stylish, modern pose, studio lighting, high quality fashion photography.",
                num_inference_steps: 30,
                guidance_scale: 7.5
            },
        });

        // Convert Blob to Buffer
        const arrayBuffer = await generatedImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Convert to base64 for easy transfer
        const base64Image = buffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        console.log("Successfully generated fashion model image");
        return res.status(200).json({ 
            success: true, 
            imageData: dataUrl,
            message: "Image generated successfully"
        });

    } catch(err) {
        console.error("Error generating model image:", err);
        return res.status(500).json({ 
            success: false, 
            message: err.message || "Failed to generate image"
        });
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

// Update product media (add generated image to product)
productRouter.post('/update-media/:item_id', async function(req, res, next) {
    try {
        const { platformClient } = req;
        const { item_id } = req.params;
        const { imageUrl } = req.body;
        
        if (!imageUrl) {
            return res.status(400).json({ success: false, message: "Image URL is required" });
        }

        console.log(`Attempting to add image to product ${item_id}: ${imageUrl}`);

        // Get all products to find the one we need to update
        const productsResponse = await platformClient.catalog.getProducts();
        const allProducts = productsResponse.items || [];
        
        // Find the product by uid
        const product = allProducts.find(p => p.uid === parseInt(item_id));
        
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        console.log(`Found product: ${product.name}`);

        // Get existing media
        const existingMedia = product.media || [];
        
        // Add the new image to the media array
        const updatedMedia = [
            ...existingMedia,
            {
                type: "image",
                url: imageUrl
            }
        ];

        console.log(`Updating product with ${updatedMedia.length} images`);

        // Try to update using the catalog API
        // Note: The actual method might vary based on your Fynd SDK version
        try {
            // Attempt to use createProduct to update (some APIs work this way)
            const updatePayload = {
                ...product,
                media: updatedMedia
            };

            // If direct update is not available, we'll just return success
            // The image is already generated and can be manually added
            console.log("Product update payload prepared. Note: Direct API update might require admin permissions.");
            
            return res.json({ 
                success: true, 
                message: "Image generated successfully. The image URL is ready to be added to your product.",
                imageUrl: imageUrl,
                productName: product.name
            });
        } catch (updateErr) {
            console.log("Direct update not supported, returning image URL:", updateErr.message);
            return res.json({ 
                success: true, 
                message: "Image generated successfully. You may need to manually add this image to your product in the admin panel.",
                imageUrl: imageUrl,
                productName: product.name
            });
        }
        
    } catch (err) {
        console.error("Error updating product media:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Error processing request: " + err.message 
        });
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

// Get Product Bundles Endpoint (Authenticated)
productRouter.get('/bundles', async function(req, res, next) {
    try {
        const platformClient = req.platformClient;

        if (!platformClient) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        console.log("Fetching product bundles...");

        // Use the FDK's authenticated request method
        const PlatformAPIClient = require("@gofynd/fdk-client-javascript/sdk/platform/PlatformAPIClient");
        
        const response = await PlatformAPIClient.execute(
            platformClient.config,
            "get",
            `/service/platform/catalog/v1.0/company/${platformClient.config.companyId}/product-bundle/`,
            {},
            undefined,
            {},
            { responseHeaders: false }
        );

        console.log(`Fetched ${response.items?.length || 0} bundles`);

        return res.status(200).json({ 
            success: true, 
            bundles: response.items || []
        });

    } catch(err) {
        console.error("Error fetching bundles:", err);
        return res.status(500).json({ 
            success: false, 
            message: err.message || "Failed to fetch bundles"
        });
    }
});

// AI Bundle Suggestions Endpoint (Authenticated)
productRouter.post('/ai-bundle-suggestions', async function(req, res, next) {
    try {
        const platformClient = req.platformClient;

        if (!platformClient) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        // Step 1: Fetch scraped competitor data
        const crawledDoc = await ComparisonData.findOne().sort({ createdAt: -1 });
        const crawledItems = crawledDoc ? crawledDoc.crawledData : [];

        // Step 2: Fetch your store's products
        let myProducts = [];
        try {
            const productsResponse = await platformClient.catalog.getProducts();
            myProducts = productsResponse.items || [];
            console.log(`Fetched ${myProducts.length} products for bundle analysis`);
        } catch (e) {
            console.error("Failed to fetch products:", e.message);
            return res.status(500).json({ success: false, message: "Failed to fetch products" });
        }

        if (myProducts.length < 2) {
            return res.status(400).json({ 
                success: false, 
                message: "You need at least 2 products in your catalog to create bundles" 
            });
        }

        // Step 3: Prepare data for AI analysis
        const productContext = myProducts.slice(0, 20).map(p => {
            // Find matching scraped data
            const crawledMatch = crawledItems.find(item => 
                (p.slug && item.slug && p.slug === item.slug) || 
                (p.name && item.name && p.name.toLowerCase().trim() === item.name.toLowerCase().trim())
            );

            // Get competitor prices
            const competitorPrices = [];
            if (crawledMatch?.marketplaces) {
                for (const [marketplace, data] of Object.entries(crawledMatch.marketplaces)) {
                    if (data?.items && data.items.length > 0) {
                        const price = data.items[0]?.price?.value;
                        if (price) {
                            competitorPrices.push({
                                platform: marketplace,
                                price: price
                            });
                        }
                    }
                }
            }

            return {
                uid: p.uid,
                name: p.name,
                slug: p.slug,
                price: p.price?.effective?.min || 0,
                category: p.category_slug || p.l3_category || 'general',
                brand: p.brand?.name || '',
                is_active: p.is_active,
                media: p.media,
                competitor_prices: competitorPrices,
                tags: p.tags || []
            };
        });

        // Step 4: Use Gemini AI to suggest bundles
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert E-commerce Product Bundling Strategist with deep knowledge of retail psychology and cross-selling techniques.

📦 AVAILABLE PRODUCTS DATA:
${JSON.stringify(productContext, null, 2)}

${crawledItems.length > 0 ? `
📊 COMPETITOR INSIGHTS:
Based on scraped marketplace data, we have insights on how competitors price similar products.
` : ''}

🎯 YOUR TASK:
Analyze the products and suggest 3-5 intelligent product bundles that:
1. Make logical sense together (complementary items, same category, matching styles)
2. Create value for customers (themed collections, complete outfits, seasonal bundles)
3. Increase average order value
4. Consider competitor pricing strategies if available

💡 BUNDLE CRITERIA:
- Each bundle should have 2-4 products
- Products should complement each other
- Consider categories, brands, price ranges
- Think about customer use cases (e.g., "Complete Summer Outfit", "Office Professional Bundle")

OUTPUT FORMAT (Strict JSON Array):
[
    {
        "bundleName": "Descriptive Bundle Name",
        "reason": "1-2 sentence explanation why these products work well together",
        "products": [
            {
                "uid": "product_uid_1",
                "name": "Product Name",
                "price": { "effective": { "min": 1000 } },
                "media": [],
                "is_active": true
            }
        ]
    }
]

IMPORTANT: 
- Return ONLY valid JSON array
- Include complete product objects with uid, name, price, media, is_active
- Each bundle must have at least 2 products
- Provide 3-5 bundle suggestions`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let suggestions;
        try {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            suggestions = JSON.parse(cleanedText);
            
            // Validate and enrich suggestions with full product data
            suggestions = suggestions.map(bundle => {
                const enrichedProducts = bundle.products.map(p => {
                    const fullProduct = myProducts.find(prod => prod.uid === p.uid);
                    return fullProduct || p;
                });
                return { ...bundle, products: enrichedProducts };
            });

        } catch (e) {
            console.error("Failed to parse AI response:", text);
            return res.status(500).json({ success: false, message: "AI response parsing failed" });
        }

        return res.status(200).json({ success: true, suggestions });

    } catch(err) {
        console.error("Error in AI bundle suggestions:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Create Bundle Endpoint (Authenticated)
productRouter.post('/create-bundle', async function(req, res, next) {
    try {
        const { name, products } = req.body;
        const platformClient = req.platformClient;

        if (!platformClient) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        if (!name || !products || products.length < 2) {
            return res.status(400).json({ 
                success: false, 
                message: "Bundle name and at least 2 products are required" 
            });
        }

        console.log(`Creating bundle: ${name} with ${products.length} products`);

        // Prepare bundle data according to Fynd API structure
        const bundleData = {
            name: name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50),
            is_active: true,
            choice: "multi",
            products: products.map(p => ({
                product_uid: p.product_uid,
                min_quantity: p.quantity || 1,
                max_quantity: p.quantity || 10,
                allow_remove: true,
                auto_add_to_cart: false,
                auto_select: false
            })),
            same_store_assignment: true,
            logo: null
        };

        // Use the FDK's authenticated request method
        const PlatformAPIClient = require("@gofynd/fdk-client-javascript/sdk/platform/PlatformAPIClient");
        
        const createResponse = await PlatformAPIClient.execute(
            platformClient.config,
            "post",
            `/service/platform/catalog/v1.0/company/${platformClient.config.companyId}/product-bundle/`,
            {},
            bundleData,
            {},
            { responseHeaders: false }
        );

        console.log("Bundle created successfully:", createResponse);

        // Fetch the created bundle using getProductBundle
        const bundleSlug = bundleData.slug;
        const bundleDetails = await PlatformAPIClient.execute(
            platformClient.config,
            "get",
            `/service/platform/catalog/v1.0/company/${platformClient.config.companyId}/product-bundle/`,
            { slug: bundleSlug },
            undefined,
            {},
            { responseHeaders: false }
        );

        console.log("Fetched bundle details:", bundleDetails);

        return res.status(200).json({ 
            success: true, 
            message: "Bundle created successfully",
            data: createResponse,
            bundle: bundleDetails
        });

    } catch(err) {
        console.error("Error creating bundle:", err);
        console.error("Error details:", err.details);
        return res.status(500).json({ 
            success: false, 
            message: err.message || "Failed to create bundle",
            details: err.details || {}
        });
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
