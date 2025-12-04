const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testNanoBanana() {
    const key = process.env.GEMINI_API_KEY;
    console.log("Testing API Key:", key ? key.substring(0, 5) + "..." : "MISSING");

    if (!key) {
        console.error("No API key provided");
        return;
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

    try {
        console.log("Generating content with gemini-3-pro-image-preview...");
        // Simple text prompt
        const result = await model.generateContent("A cute robot eating a banana");
        const response = await result.response;
        console.log("Success!");
        console.log("Response:", JSON.stringify(response, null, 2));
    } catch (error) {
        console.error("Error with gemini-3-pro-image-preview:", error);
        if (error.response) {
            console.error("Error response:", JSON.stringify(error.response, null, 2));
        }
    }
}

testNanoBanana();
