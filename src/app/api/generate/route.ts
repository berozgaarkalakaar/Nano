import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "@/lib/db";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check (Simple placeholder for now)
        // const sessionToken = req.cookies.get("session")?.value;
        // if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // const user = getUserFromSession(sessionToken);
        // if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Mock user for MVP
        const userId = 1;

        // 2. Parse Body
        const body = await req.json();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { prompt, style, width, height, referenceImages, baseImageIndex: _baseImageIndex, fixedObjects, editImage, editInstruction } = body;

        if (!prompt && !editInstruction) {
            return NextResponse.json({ error: "Prompt or edit instruction is required" }, { status: 400 });
        }

        // 3. Check Credits
        const creditStmt = db.prepare("SELECT amount FROM credits WHERE user_id = ?");
        const credits = creditStmt.get(userId) as { amount: number };

        if (!credits || credits.amount <= 0) {
            return NextResponse.json({ error: "Out of credits" }, { status: 403 });
        }

        // 4. Prepare Gemini Request
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: any[] = [];

        // Add text prompt
        let fullPrompt = "";

        if (editInstruction && editImage) {
            // Chat-to-Edit Mode
            fullPrompt = `Edit this image: ${editInstruction}\n\nTarget Resolution: ${width}x${height}`;
        } else {
            // Standard Generation Mode
            fullPrompt = `${prompt}\n\nStyle: ${style}\nTarget Resolution: ${width}x${height}`;
            if (fixedObjects) {
                const fixed = Object.entries(fixedObjects)
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    .filter(([_, v]) => v)
                    .map(([k]) => k)
                    .join(", ");
                if (fixed) fullPrompt += `\nKeep fixed: ${fixed}`;
            }
        }

        parts.push({ text: fullPrompt });

        // Add reference images (or edit image)
        if (editImage) {
            // If editing, the editImage is the primary reference
            const base64Data = editImage.split(",")[1];
            const mimeType = editImage.split(";")[0].split(":")[1];
            parts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            });
        } else if (referenceImages && referenceImages.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            referenceImages.forEach((img: string, _index: number) => {
                // Extract base64 (remove data:image/xxx;base64, prefix)
                const base64Data = img.split(",")[1];
                const mimeType = img.split(";")[0].split(":")[1];

                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                });
            });
        }

        // 5. Call API
        // Note: This is a standard generateContent call. 
        // For actual image generation models, the response structure might differ (e.g. images property).
        // We'll assume it returns standard content or we might need to use a specific method if the SDK updates.
        // For now, we'll try to generate.

        // IMPORTANT: If the model is strictly an image generation model, it might not accept 'generateContent' in the same way 
        // or might return a different response. 
        // However, given the instructions, we proceed with standard multimodal input.

        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            generationConfig: {
                // width and height are not supported in standard generationConfig for this model
            } as any
        });

        // This part depends heavily on the actual API response shape for images.
        // Usually for Imagen it's not text.
        // If it returns text (e.g. "I cannot generate images"), we handle it.
        // If it returns inline data (images), we extract it.

        // MOCKING THE RESPONSE FOR SAFETY if API key is missing or model behavior is unknown in this env
        // In a real scenario, we would parse `response.candidates[0].content.parts[0].inlineData` or similar.

        // For this exercise, since I cannot guarantee the API key works or the model is available to me,
        // I will simulate a successful response if the API call fails or returns text.
        // BUT I will try to return the actual image if available.

        const response = await result.response;
        let imageUrl = "";

        // Parse response for image
        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts?.[0]?.inlineData) {
            const part = candidate.content.parts[0];
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        } else if (candidate?.content?.parts?.[0]?.text) {
            const text = candidate.content.parts[0].text;
            if (text.startsWith("http")) {
                imageUrl = text;
            } else {
                console.warn("Model returned text:", text);
                // If the model returns text, it might be a refusal or explanation. 
                // We'll throw an error to let the user know.
                throw new Error(text || "Model returned text instead of image");
            }
        } else {
            console.error("Unexpected response structure:", JSON.stringify(response, null, 2));
            throw new Error("Failed to generate image: Unexpected response format");
        }

        // 6. Deduct Credits
        const deductStmt = db.prepare("UPDATE credits SET amount = amount - 1 WHERE user_id = ?");
        deductStmt.run(userId);

        // 7. Save to History
        const historyPrompt = editInstruction ? `[Edit] ${editInstruction}` : prompt;
        const insertStmt = db.prepare(`
      INSERT INTO generations (user_id, prompt, style, size, image_url)
      VALUES (?, ?, ?, ?, ?)
    `);
        insertStmt.run(userId, historyPrompt, style || "Edit", `${width}x${height}`, imageUrl);

        return NextResponse.json({
            success: true,
            image: imageUrl,
            credits: credits.amount - 1
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Generation error:", error);
        return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
    }
}
