
interface FalTaskConfig {
    prompt: string;
    aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
    imageInput?: string[]; // For image-to-image if supported
}

interface FalQueueResponse {
    request_id: string;
    response_url: string;
    status_url: string;
    cancel_url: string;
    logs?: string | null;
}

interface FalStatusResponse {
    status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
    logs?: Array<{ message: string; timestamp: string }>;
    response_url?: string;
}

interface FalResultResponse {
    images: Array<{
        url: string;
        width: number;
        height: number;
        content_type: string;
    }>;
    seed?: number;
    has_nsfw_concepts?: boolean[];
    prompt?: string;
}

const FAL_KEY = process.env.FAL_KEY;
// Using the queue endpoint for reliability
const BASE_URL = "https://queue.fal.run/fal-ai/nano-banana-pro";

export async function generateImageWithFal(config: FalTaskConfig): Promise<string> {
    if (!FAL_KEY) {
        throw new Error("FAL_KEY is not configured");
    }

    // 1. Submit Request
    console.log("Submitting Fal.ai request...");
    const submitRes = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Key ${FAL_KEY}`
        },
        body: JSON.stringify({
            prompt: config.prompt,
            aspect_ratio: config.aspectRatio || "1:1",
            image_url: config.imageInput?.[0] // Assuming single image input for now if needed
        })
    });

    if (!submitRes.ok) {
        const errText = await submitRes.text();
        throw new Error(`Fal.ai Submit Failed (${submitRes.status}): ${errText}`);
    }

    const submitData: FalQueueResponse = await submitRes.json();
    const requestId = submitData.request_id;
    console.log(`Fal Request ID: ${requestId}`);

    // 2. Poll for Status
    const statusUrl = submitData.status_url;
    const maxAttempts = 60; // 1 minute roughly
    const delayMs = 1000;

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, delayMs));

        const statusRes = await fetch(statusUrl, {
            method: "GET",
            headers: {
                "Authorization": `Key ${FAL_KEY}`,
                "Accept": "application/json"
            }
        });

        if (!statusRes.ok) {
            console.warn(`Fal polling warning: ${statusRes.status}`);
            continue;
        }

        const statusData: FalStatusResponse = await statusRes.json();
        console.log(`Fal Status: ${statusData.status}`);

        if (statusData.status === "COMPLETED") {
            // Fetch result
            const responseUrl = submitData.response_url; // Or from statusData if available
            // Usually the queue endpoint result is at response_url

            const resultRes = await fetch(responseUrl, {
                method: "GET",
                headers: {
                    "Authorization": `Key ${FAL_KEY}`,
                    "Accept": "application/json"
                }
            });

            if (!resultRes.ok) {
                throw new Error("Fal Completed but failed to fetch result");
            }

            const resultData: FalResultResponse = await resultRes.json();

            if (resultData.images && resultData.images.length > 0) {
                return resultData.images[0].url;
            } else {
                throw new Error("Fal Success but no image found in response");
            }

        } else if (statusData.status === "FAILED") {
            throw new Error(`Fal Generation Failed`);
        }

        // If IN_QUEUE or IN_PROGRESS, continue
    }

    throw new Error("Fal Generation Timed Out");
}
