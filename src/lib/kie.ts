
interface KieTaskConfig {
    prompt: string;
    aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2" | "4:5" | "21:9";
    resolution?: "1K" | "2K" | "4K";
    outputFormat?: "png" | "jpg";
    imageInput?: string[]; // Array of base64 images
    seed?: number;
}

// Supported image MIME types
const SUPPORTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

interface KieUploadResponse {
    code: number;
    msg: string;
    data: {
        downloadUrl: string;
    } | null;
}

/**
 * Upload a base64 image to Kie's file upload API
 * Returns the download URL that can be used as image_input
 * 
 * Kie API expects accessible URLs for image_input, not inline base64
 * Supported formats: JPEG, PNG, WEBP (max 30MB)
 */
async function uploadImageToKie(imageData: string): Promise<string> {
    // If it's already a URL, return as-is
    if (imageData.startsWith('http')) {
        return imageData;
    }

    // Extract MIME type and base64 data
    let mimeType = 'image/png';
    let base64Data = imageData;

    if (imageData.startsWith('data:')) {
        const match = imageData.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (match) {
            mimeType = match[1];
            base64Data = match[2];
        } else {
            // Try to extract base64 after comma
            const commaIndex = imageData.indexOf(',');
            if (commaIndex !== -1) {
                base64Data = imageData.substring(commaIndex + 1);
            }
        }
    }

    // Validate MIME type
    if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
        console.warn(`MIME type ${mimeType} may not be supported by Kie API. Supported: PNG, JPEG, WEBP`);
    }

    // Determine file extension
    const extMap: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/webp': 'webp'
    };
    const ext = extMap[mimeType] || 'png';
    const filename = `upload_${Date.now()}.${ext}`;

    console.log(`Uploading image to Kie: ${mimeType}, filename: ${filename}, base64 length: ${base64Data.length}`);

    // Use Kie's base64 file upload API
    // Correct domain: kieai.redpandaai.co (not api.kie.ai)
    // Endpoint: /api/file-base64-upload
    // Params: base64Data (can include data URL prefix), uploadPath, fileName (optional)
    const uploadRes = await fetch('https://kieai.redpandaai.co/api/file-base64-upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIE_API_KEY}`
        },
        body: JSON.stringify({
            base64Data: imageData.startsWith('data:') ? imageData : `data:${mimeType};base64,${base64Data}`,
            uploadPath: '/nano-banana-uploads',
            fileName: filename
        })
    });

    const uploadData: KieUploadResponse = await uploadRes.json();
    console.log('Kie upload response:', JSON.stringify(uploadData, null, 2));

    if (!uploadData.data?.downloadUrl) {
        console.error('Kie upload failed:', uploadData);
        throw new Error(`Kie Upload Error (${uploadData.code}): ${uploadData.msg || 'No download URL returned'}`);
    }

    console.log(`Kie upload successful: ${uploadData.data.downloadUrl}`);
    return uploadData.data.downloadUrl;
}

interface KieTaskResponse {
    code: number;
    msg: string;
    data: {
        taskId: string;
    } | null;
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

const KIE_API_KEY = process.env.KIE_API_KEY;
const BASE_URL = "https://api.kie.ai/api/v1";

export async function generateImageWithKie(config: KieTaskConfig): Promise<string> {
    if (!KIE_API_KEY) {
        throw new Error("KIE_API_KEY is not configured");
    }

    // Upload images first if provided
    let imageUrls: string[] | undefined;
    if (config.imageInput && config.imageInput.length > 0) {
        console.log(`Uploading ${config.imageInput.length} image(s) to Kie...`);
        imageUrls = await Promise.all(
            config.imageInput.map(img => uploadImageToKie(img))
        );
        console.log('Image URLs:', imageUrls);
    }

    const createRes = await fetch(`${BASE_URL}/jobs/createTask`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${KIE_API_KEY}`
        },
        body: JSON.stringify({
            model: "nano-banana-pro",
            input: (() => {
                const input = {
                    prompt: config.prompt,
                    aspect_ratio: config.aspectRatio || "1:1",
                    resolution: config.resolution || "1K",
                    output_format: config.outputFormat || "png",
                    image_input: imageUrls,
                    seed: config.seed
                };
                console.log("Kie Input Payload:", JSON.stringify(input, null, 2));
                return input;
            })()
        })
    });

    const createData: KieTaskResponse = await createRes.json();

    if (createData.code !== 200 || !createData.data) {
        throw new Error(`Kie API Error (${createData.code}): ${createData.msg}`);
    }

    const taskId = createData.data.taskId;
    console.log(`Kie Task Created: ${taskId}`);

    // 2. Poll for Completion
    const maxAttempts = 150; // 5 minutes timeout (150 * 2s)
    const delayMs = 2000; // 2 seconds

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, delayMs));

        const checkRes = await fetch(`${BASE_URL}/jobs/recordInfo?taskId=${taskId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${KIE_API_KEY}`
            }
        });

        if (!checkRes.ok) {
            console.warn(`Kie polling warning: ${checkRes.status}`);
            continue;
        }

        const checkData: KieRecordInfoResponse = await checkRes.json();

        if (checkData.code !== 200 || !checkData.data) {
            console.warn(`Kie polling non-200: ${JSON.stringify(checkData)}`);
            continue;
        }

        const state = checkData.data.state;

        if (state === 'success') {
            try {
                const result = JSON.parse(checkData.data.resultJson);
                if (result.resultUrls && result.resultUrls.length > 0) {
                    return result.resultUrls[0];
                } else {
                    throw new Error("Kie Task Success but no image URL found in resultJson");
                }
            } catch {
                throw new Error(`Failed to parse resultJson: ${checkData.data.resultJson}`);
            }
        } else if (state === 'failed' || state === 'generate_failed') { // Covering bases
            throw new Error(`Kie Task Failed: ${checkData.data.failMsg || 'Unknown error'}`);
        }

        // If 'waiting' or 'generating', continue polling
    }

    throw new Error("Kie Task Timed Out");
}
