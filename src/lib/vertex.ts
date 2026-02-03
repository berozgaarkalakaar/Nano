
interface VertexImageResult {
    image: string; // Base64 or URL
    width: number;
    height: number;
    seed?: number;
}

interface GenerateVertexParams {
    prompt: string;
    aspectRatio?: string;
    style?: string;
    seed?: number;
}

const API_KEY = "AQ.Ab8RN6IynES0kT02OM25ecwIZ0ZktWo3oNxgmZ6ZWPqUQqqm7w";
const MODEL = "gemini-3-pro-image-preview";

// Helper to convert text to an SVG image data URI
function textToImage(text: string): string {
    const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg" style="background: #111;">
        <rect width="100%" height="100%" fill="#111"/>
        <text x="50%" y="50%" font-family="monospace" font-size="24" fill="#eee" text-anchor="middle" dominant-baseline="middle">
            ${text.slice(0, 50).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </text>
        <text x="50%" y="55%" font-family="monospace" font-size="16" fill="#888" text-anchor="middle">
             (Text Response from Vertex)
        </text>
    </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export async function generateImageWithVertex(params: GenerateVertexParams): Promise<VertexImageResult> {
    const url = `https://aiplatform.googleapis.com/v1/publishers/google/models/${MODEL}:generateContent?key=${API_KEY}`;

    // Construct the payload as per user's curl example
    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: params.prompt + (params.style ? ` Style: ${params.style}` : "")
                    }
                ]
            }
        ],
        generationConfig: {
            // We can add config here if needed, but keeping it minimal as per curl
        }
    };

    console.log("Calling Vertex API:", url);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Vertex API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();

        // Parse response
        // Structure: candidates[0].content.parts[0].text (for text)
        // Or candidates[0].content.parts[0].inlineData (for images/multimodal)

        const candidate = data.candidates?.[0];
        const part = candidate?.content?.parts?.[0];

        if (part?.inlineData) {
            // It returned an image!
            return {
                image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                width: 1024,
                height: 1024
            };
        } else if (part?.text) {
            console.log("Vertex returned text:", part.text);
            // If the text looks like a URL, return it
            if (part.text.trim().startsWith("http")) {
                return {
                    image: part.text.trim(),
                    width: 1024,
                    height: 1024
                };
            }
            // Otherwise, convert text to image so it displays in the UI
            return {
                image: textToImage(part.text),
                width: 1024,
                height: 1024
            };
        }

        throw new Error("No valid content in Vertex response");

    } catch (error) {
        console.error("Vertex generation failed:", error);
        throw error;
    }
}
