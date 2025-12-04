import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { uploadImageToDrive } from "@/lib/drive";
import { generateBaseImageWithGemini } from "@/lib/gemini";
import { upscaleImage } from "@/lib/upscaler";

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check (Mock)
        const userId = 1;

        // 2. Parse Body
        const body = await req.json();
        const {
            prompt,
            style,
            width,
            height,
            referenceImages,
            fixedObjects,
            editImage,
            editInstruction,
            aspectRatio,
            // resolution, // We use quality now
            fixedSeed,
            quality = "BASE_1K" // "BASE_1K" | "HIRES_2K" | "ULTRA_4K"
        } = body;

        if (!prompt && !editInstruction) {
            return NextResponse.json({ error: "Prompt or edit instruction is required" }, { status: 400 });
        }

        // 3. Check Credits
        const creditStmt = db.prepare("SELECT amount FROM credits WHERE user_id = ?");
        const credits = creditStmt.get(userId) as { amount: number };

        if (!credits || credits.amount <= 0) {
            return NextResponse.json({ error: "Out of credits" }, { status: 403 });
        }

        console.log("--- GENERATION REQUEST ---");
        console.log("Quality:", quality);
        console.log("Prompt:", prompt);
        console.log("--------------------------");

        // 4. Pipeline Execution

        // Step 1: Base Generation
        // Map quality to imageSize
        let baseImageSize = "1K";
        if (quality === "HIRES_2K" || quality === "ULTRA_4K") {
            baseImageSize = "2K";
        }

        const baseResult = await generateBaseImageWithGemini({
            prompt,
            style,
            width,
            height,
            aspectRatio,
            imageSize: baseImageSize,
            referenceImages,
            editImage,
            editInstruction,
            fixedObjects,
            fixedSeed: !!fixedSeed
        });

        let finalImage = baseResult.image;
        let finalWidth = baseResult.width;
        let finalHeight = baseResult.height;
        let wasUpscaled = false;

        // Step 2: Upscaling (if needed)
        if (quality === "HIRES_2K") {
            // If base is already 2K (which we requested), we might skip upscaling unless we want "enhancement".
            // Since Gemini 3 Pro Image Preview might return 1K even if we ask for 2K (preview behavior),
            // we should check dimensions. But we don't have accurate dimensions from base64 easily here.
            // So we will force upscaling if the user asked for HIRES_2K, to ensure quality/detail.
            // OR we can trust the base generation if it claims 2K.
            // Let's run the upscaler in 2X mode to be safe and ensure "High Res" look.
            console.log("Quality is HIRES_2K, running upscaler...");
            const upscaled = await upscaleImage(finalImage, "HIRES_2X");
            finalImage = upscaled.image;
            finalWidth = upscaled.width;
            finalHeight = upscaled.height;
            wasUpscaled = true;
        } else if (quality === "ULTRA_4K") {
            console.log("Quality is ULTRA_4K, running upscaler...");
            const upscaled = await upscaleImage(finalImage, "ULTRA_4X");
            finalImage = upscaled.image;
            finalWidth = upscaled.width;
            finalHeight = upscaled.height;
            wasUpscaled = true;
        }

        // 5. Deduct Credits
        const deductStmt = db.prepare("UPDATE credits SET amount = amount - 1 WHERE user_id = ?");
        deductStmt.run(userId);

        // 6. Save to History (and Drive if configured)
        let savedImageUrl = finalImage;

        if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
            try {
                console.log("Uploading to Google Drive...");
                const filename = `nano_banana_${Date.now()}.png`;
                const driveLink = await uploadImageToDrive(finalImage, filename, process.env.GOOGLE_DRIVE_FOLDER_ID);
                if (driveLink) {
                    savedImageUrl = driveLink;
                    console.log("Uploaded to Drive:", savedImageUrl);
                }
            } catch (driveError) {
                console.error("Failed to upload to Drive, falling back to original URL/Base64:", driveError);
            }
        }

        const historyPrompt = editInstruction ? `[Edit] ${editInstruction}` : prompt;

        // Use the new 'quality' column if possible, or store in style/size
        // We added 'quality' column in db.ts
        const insertStmt = db.prepare(`
            INSERT INTO generations (user_id, prompt, style, size, image_url, quality)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        // If finalWidth/Height are 0 (unknown), use a placeholder or the requested size
        const sizeStr = (finalWidth && finalHeight) ? `${finalWidth}x${finalHeight}` : (quality === "ULTRA_4K" ? "4096x4096" : (quality === "HIRES_2K" ? "2048x2048" : "1024x1024"));

        insertStmt.run(userId, historyPrompt, style || "Edit", sizeStr, savedImageUrl, quality);

        return NextResponse.json({
            success: true,
            image: finalImage,
            credits: credits.amount - 1,
            metadata: {
                width: finalWidth,
                height: finalHeight,
                upscaled: wasUpscaled,
                quality: quality
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Generation error:", error);
        return NextResponse.json({ error: error.message || "Something went wrong", details: error.toString() }, { status: 500 });
    }
}
