const { PixelbinConfig, PixelbinClient } = require("@pixelbin/admin");

// Initialize the client
const pixelbin = new PixelbinClient(
  new PixelbinConfig({
    domain: "https://api.pixelbin.io",
    apiSecret: process.env.PIXELBIN_API_TOKEN || "API_TOKEN",
  }),
);

async function generateTryOn(imageUrl) {
  try {
    // Step 1: Create the prediction job
    const job = await pixelbin.predictions.create({
      name: "vg_generate",
      input: {
        image: imageUrl,
        prompt: "Generate a realistic model wearing this exact clothing item with all design details preserved. Use a modern, stylish pose and a clean, premium studio look. Do not alter the clothing.",
        variations: "1",
        Seed: "0",
        auto: "true"
      },
    });

    console.log("Job created:", job._id);
    console.log("Initial status:", job.status);

    // Step 2: Wait for the job to complete
    const result = await pixelbin.predictions.wait(job._id);

    // Step 3: Handle the result
    if (result.status === "SUCCESS") {
      console.log("Prediction completed successfully!");
      console.log("Output:", result.output);
      return result.output;
    } else {
      console.error("Prediction failed:", result.status);
      console.error("Error details:", result.error);
      throw new Error(`Prediction failed with status: ${result.status}`);
    }
  } catch (error) {
    console.error("Error running prediction:", error.message);
    if (error.details) {
      console.error("Error details:", JSON.stringify(error.details, null, 2));
    }
    throw error;
  }
}

async function generateFashionModel(imageUrls, prompt, aspectRatio) {
  try {
    // Step 1: Create the prediction job for img_edit
    const job = await pixelbin.predictions.create({
      name: "img_edit",
      input: {
        prompt: prompt || "Transform this clothing item into a professional fashion photoshoot with a model wearing it. Modern, stylish pose, studio lighting, high-quality fashion photography.",
        images: Array.isArray(imageUrls) ? imageUrls : [imageUrls],
        aspect_ratio: aspectRatio || ""
      },
    });

    console.log("Fashion Model Job created:", job._id);
    console.log("Initial status:", job.status);

    // Step 2: Wait for the job to complete
    const result = await pixelbin.predictions.wait(job._id);

    // Step 3: Handle the result
    if (result.status === "SUCCESS") {
      console.log("Fashion model generation completed successfully!");
      console.log("Output:", result.output);
      return result;
    } else {
      console.error("Fashion model generation failed:", result.status);
      console.error("Error details:", result.error);
      throw new Error(`Prediction failed with status: ${result.status}`);
    }
  } catch (error) {
    console.error("Error generating fashion model:", error.message);
    if (error.details) {
      console.error("Error details:", JSON.stringify(error.details, null, 2));
    }
    throw error;
  }
}

module.exports = { generateTryOn, generateFashionModel };