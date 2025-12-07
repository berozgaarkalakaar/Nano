
interface KieTaskConfig {
    prompt: string;
    aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
    resolution?: "1K" | "2K" | "4K";
    outputFormat?: "png" | "jpg";
    imageInput?: string[]; // Array of base64 images
}

interface KieTaskResponse {
    code: number;
    msg: string;
    data: {
        taskId: string;
    } | null;
}

interface KieJobResponse {
    code: number;
    msg: string;
    data: {
        status: number; // 0: Queueing, 1: Running, 2: Success, 3: Failed, 4: Timeout
        progress: number;
        result?: {
            images: Array<{
                url: string;
            }>;
        };
    } | null;
}

const KIE_API_KEY = process.env.KIE_API_KEY;
const BASE_URL = "https://api.kie.ai/api/v1";

export async function generateImageWithKie(config: KieTaskConfig): Promise<string> {
    if (!KIE_API_KEY) {
        throw new Error("KIE_API_KEY is not configured");
    }

    // 1. Create Task
    const createRes = await fetch(`${BASE_URL}/jobs/createTask`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${KIE_API_KEY}`
        },
        body: JSON.stringify({
            model: "nano-banana-pro",
            input: {
                prompt: config.prompt,
                aspect_ratio: config.aspectRatio || "1:1",
                resolution: config.resolution || "1K",
                output_format: config.outputFormat || "png",
                image_input: config.imageInput
            }
        })
    });

    const createData: KieTaskResponse = await createRes.json();

    if (createData.code !== 200 || !createData.data) {
        throw new Error(`Kie API Error (${createData.code}): ${createData.msg}`);
    }

    const taskId = createData.data.taskId;
    console.log(`Kie Task Created: ${taskId}`);

    // 2. Poll for Completion
    const maxAttempts = 60; // 1 minute timeout roughly
    const delayMs = 2000; // 2 seconds

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, delayMs));

        // Note: Using the 'info' or 'fetch' endpoint based on what seemed available in docs/tests
        // The test script tried multiple, let's use the one that's usually standard or try the 'fetch' one which implies getting results
        const checkRes = await fetch(`${BASE_URL}/jobs/fetch?taskId=${taskId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${KIE_API_KEY}`
            }
        });

        if (!checkRes.ok) {
            console.warn(`Kie polling warning: ${checkRes.status}`);
            continue;
        }

        const checkData: KieJobResponse = await checkRes.json();

        if (checkData.code !== 200 || !checkData.data) {
            // If code is not 200, it might be a temporary error or actual failure
            // But usually 200 means "request successful", inside data.status tells us job status
            console.warn(`Kie polling non-200: ${JSON.stringify(checkData)}`);
            continue;
        }

        const status = checkData.data.status;

        // 0: Queueing, 1: Running, 2: Success, 3: Failed, 4: Timeout
        if (status === 2) {
            if (checkData.data.result?.images?.[0]?.url) {
                return checkData.data.result.images[0].url;
            } else {
                throw new Error("Kie Task Success but no image URL found");
            }
        } else if (status === 3 || status === 4) {
            throw new Error(`Kie Task Failed with status ${status}: ${checkData.msg}`);
        }

        // If 0 or 1, continue polling
    }

    throw new Error("Kie Task Timed Out");
}
