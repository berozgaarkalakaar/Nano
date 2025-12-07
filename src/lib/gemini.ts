import { GoogleGenerativeAI } from "@google/generative-ai";

// Parse API keys from environment
const keys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
    .split(",")
    .map(k => k.trim())
    .filter(k => k.length > 0);

if (keys.length === 0) {
    console.warn("No GEMINI_API_KEYS or GEMINI_API_KEY found in environment variables.");
} else {
    console.log(`Loaded ${keys.length} Gemini API key(s).`);
}

let currentKeyIndex = 0;

function getNextKey(): string {
    if (keys.length === 0) return "";
    const key = keys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    return key;
}

interface GenerateBaseImageParams {
    prompt: string;
    style?: string;
    width?: number;
    height?: number;
    aspectRatio?: string;
    imageSize?: string; // "1K" | "2K"
    referenceImages?: string[];
    editImage?: string;
    editInstruction?: string;
    fixedObjects?: Record<string, boolean>;
    fixedSeed?: boolean;
}

interface BaseImageResult {
    image: string; // Base64 or URL
    width: number;
    height: number;
    seed?: number;
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1500;

async function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateBaseImageWithGemini(params: GenerateBaseImageParams): Promise<BaseImageResult> {
    const modelName = "gemini-3-pro-image-preview";

    // Construct prompt
    let fullPrompt = "";
    if (params.editInstruction && params.editImage) {
        fullPrompt = `Edit this image: ${params.editInstruction}`;
    } else {
        fullPrompt = `${params.prompt}\n\nStyle: ${params.style || "None"}`;
        if (params.fixedObjects) {
            const fixed = Object.entries(params.fixedObjects)
                .filter(([_, v]) => v)
                .map(([k]) => k)
                .join(", ");
            if (fixed) fullPrompt += `\nKeep fixed: ${fixed}`;
        }
    }

    // Prepare parts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [{ text: fullPrompt }];

    if (params.editImage) {
        const base64Data = params.editImage.split(",")[1];
        const mimeType = params.editImage.split(";")[0].split(":")[1];
        parts.push({
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        });
    } else if (params.referenceImages && params.referenceImages.length > 0) {
        params.referenceImages.forEach((img) => {
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

    // Calculate seed if needed
    let seed: number | undefined;
    if (params.fixedSeed) {
        const str = fullPrompt + (params.style || "");
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        seed = Math.abs(hash);
    }

    // Retry loop
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Rotate key for each attempt
            const currentKey = getNextKey();
            const genAI = new GoogleGenerativeAI(currentKey);
            const model = genAI.getGenerativeModel({ model: modelName });

            console.log(`Attempt ${attempt + 1} for Gemini generation using key ending in ...${currentKey.slice(-4)}`);

            const result = await model.generateContent({
                contents: [{ role: "user", parts }],
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                generationConfig: {
                    imageConfig: {
                        aspectRatio: params.aspectRatio || "1:1",
                        imageSize: params.imageSize || "1K",
                        seed: seed
                    }
                } as any
            });

            const response = await result.response;

            // Extract image
            const candidate = response.candidates?.[0];
            if (candidate?.content?.parts?.[0]?.inlineData) {
                const part = candidate.content.parts[0];
                const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;

                return {
                    image: imageUrl,
                    width: 0, // Placeholder
                    height: 0, // Placeholder
                    seed
                };
            } else if (candidate?.content?.parts?.[0]?.text) {
                const text = candidate.content.parts[0].text;
                if (text.startsWith("http")) {
                    return {
                        image: text,
                        width: 0,
                        height: 0,
                        seed
                    };
                }
                throw new Error(text || "Model returned text instead of image");
            } else {
                throw new Error("Unexpected response format");
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(`Attempt ${attempt + 1} failed:`, error.message);
            lastError = error;

            // Check for 503, 429 (Too Many Requests), or overload
            const isOverload = error.message?.includes("503") || error.message?.includes("overloaded") || error.status === 503;
            const isRateLimit = error.message?.includes("429") || error.status === 429;

            // If it's a rate limit or overload, we definitely want to retry (potentially with a new key)
            if ((isOverload || isRateLimit) && attempt < MAX_RETRIES) {
                const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
                console.log(`Retrying in ${delay}ms with next key...`);
                await wait(delay);
                continue;
            }

            // If it's another error, we might still want to retry with a different key just in case
            // e.g. one key is invalid or quota exceeded
            if (attempt < MAX_RETRIES) {
                console.log(`Encountered error, switching key and retrying...`);
                await wait(1000); // Short wait for non-overload errors
                continue;
            }

            break;
        }
    }

    throw lastError || new Error("Failed to generate image after retries");
}
