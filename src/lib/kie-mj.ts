

const KIE_API_KEY = process.env.KIE_API_KEY || "";
const BASE_URL = "https://api.kie.ai/api/v1"; // Verify exact base URL

// Kie MJ Task Types



interface KieMJResponse {
    code: number;
    msg: string;
    data: {
        taskId: string;
    };
}

interface KieRecordInfoResponse {
    code: number;
    msg: string;
    data: {
        taskId: string;
        model: string;
        state: string; // "waiting", "generating", "success", "failed"
        resultJson: string; // Stringified JSON
        failMsg: string | null;
    } | null;
}

// Generate Image (Text to Image)
export async function generateImageWithMj(
    prompt: string,
    aspectRatio: string,
    options?: {
        stylize?: number;
        weirdness?: number;
        variety?: number;
        version?: string;
        speed?: string;
    }
): Promise<{ taskId: string }> {
    if (!KIE_API_KEY) throw new Error("KIE_API_KEY is not set");

    // Input Validation
    if (!prompt) throw new Error("Prompt is required");

    // Standardize aspect ratio
    const ar = aspectRatio.replace(":", ":") || "1:1";

    // Default values
    const stylize = options?.stylize ?? 100;
    const weirdness = options?.weirdness ?? 0;
    const variety = options?.variety ?? 0;

    // Process Version: Strip 'v' prefix
    let version = options?.version ?? "6.0";
    if (version.startsWith("v")) {
        version = version.substring(1);
    }

    const speed = options?.speed || "fast";

    // Construct Payload
    // User requested model: "midjourney_generate"
    // Endpoint: /mj/generate (verified 200 OK)
    const payload = {
        model: "midjourney_generate",
        taskType: "mj_txt2img",
        prompt: prompt,
        aspectRatio: ar,
        version: version,
        stylization: stylize,
        weirdness: weirdness,
        variety: variety,
        speed: speed
    };

    console.log("Kie MJ Request Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(`${BASE_URL}/mj/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${KIE_API_KEY}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Kie MJ API Error (${response.status}):`, errorText);
        throw new Error(`Kie MJ Submit Failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: KieMJResponse = await response.json();

    // Validate response data
    if (!data.data || !data.data.taskId) {
        console.error("Invalid Kie MJ Response:", data);
        if (data.code !== 200) {
            throw new Error(`Kie MJ Error (${data.code}): ${data.msg}`);
        }
        throw new Error("Kie MJ Response missing taskId");
    }

    return { taskId: data.data.taskId };
}

// Upscale Image
export async function upscaleImageWithMj(originTaskId: string, index: number): Promise<{ taskId: string }> {
    if (!KIE_API_KEY) throw new Error("KIE_API_KEY is not set");

    // For Upscale, we might need a different task parameters or use the same createTask with specific input
    // Assuming 'midjourney' model handles this via input parameters like 'action' or 'index'
    // Or we stick to the specialized endpoints if they exist. 
    // Given the 404, specialized endpoints likely don't exist at /mj/submit.
    // We will attempt to use a known pattern for variations/upscales if documented, 
    // but for now, let's try to fit it into createTask with an 'action' input if possible, 
    // OR we might have to use a separate endpoint if discovered.
    // FAILURE RISK: This logic is presumptive.

    const payload = {
        model: "midjourney",
        input: {
            action: "upscale",
            taskId: originTaskId,
            index: index
        }
    };

    const response = await fetch(`${BASE_URL}/jobs/createTask`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${KIE_API_KEY}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Kie MJ Upscale Failed`);

    const data: KieMJResponse = await response.json();
    return { taskId: data.data.taskId };
}

// Vary Image
export async function varyImageWithMj(originTaskId: string, index: number): Promise<{ taskId: string }> {
    if (!KIE_API_KEY) throw new Error("KIE_API_KEY is not set");

    const payload = {
        model: "midjourney",
        input: {
            action: "variation",
            taskId: originTaskId,
            index: index
        }
    };

    const response = await fetch(`${BASE_URL}/jobs/createTask`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${KIE_API_KEY}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Kie MJ Vary Failed`);
    const data: KieMJResponse = await response.json();
    return { taskId: data.data.taskId };
}

// Fetch Task Result (Polling)
export async function fetchMjTask(taskId: string): Promise<{ status: string, image?: string, progress?: string, failReason?: string }> {
    if (!KIE_API_KEY) throw new Error("KIE_API_KEY is not set");

    const response = await fetch(`${BASE_URL}/jobs/recordInfo?taskId=${taskId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${KIE_API_KEY}`
        }
    });

    if (!response.ok) throw new Error("Failed to fetch task");

    const data: KieRecordInfoResponse = await response.json();

    if (data.code !== 200) throw new Error(`Fetch Error: ${data.msg}`);
    if (!data.data) throw new Error("No data received");

    // Map Kie status to our MJ status
    // Kie: "waiting", "generating", "success", "failed"
    // Our wrapper return: "SUCCESS", "FAILURE", "IN_PROGRESS"
    let status = "IN_PROGRESS";
    if (data.data.state === "success") status = "SUCCESS";
    if (data.data.state === "failed") status = "FAILURE";

    let imageUrl = "";
    if (status === "SUCCESS") {
        try {
            const res = JSON.parse(data.data.resultJson);
            imageUrl = res.resultUrls?.[0] || res.images?.[0] || "";
        } catch (e) {
            console.error("Failed to parse resultJson", e);
        }
    }

    return {
        status: status,
        image: imageUrl,
        progress: data.data.state === "generating" ? "Running" : data.data.state,
        failReason: data.data.failMsg || undefined
    };
}
