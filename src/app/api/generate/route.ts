
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { generateBaseImageWithGemini } from "@/lib/gemini";
import { upscaleImage } from "@/lib/upscaler";
import { generateImageWithKie } from "@/lib/kie";
import { generateImageWithFal } from "@/lib/fal";
import fs from "fs";
import path from "path";
import os from "os";

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
            fixedSeed,
            quality = "BASE_1K",
            engine = "kie" // Default to Kie
        } = body;

        if (!prompt && !editInstruction) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        // 3. Check Credits
        const creditStmt = db.prepare(
            "SELECT amount FROM credits WHERE user_id = ?"
        );
        const credits = creditStmt.get(userId) as { amount: number };

        if (!credits || credits.amount <= 0) {
            return NextResponse.json({ error: "Out of credits" }, { status: 403 });
        }

        console.log("--- GENERATION REQUEST ---");
        console.log("Engine:", engine);
        console.log("Quality:", quality);
        console.log("Prompt:", prompt);
        console.log("--------------------------");

        let finalImage = "";
        let finalWidth = width || 1024;
        let finalHeight = height || 1024;

        // Calculate Seed if Fixed
        let seed: number | undefined;
        if (fixedSeed) {
            const str = (prompt || "") + (style || "");
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            seed = Math.abs(hash);
        }

        if (engine === "kie") {
            try {
                // Map Nano Banana Pro parameters
                let resolution: "1K" | "2K" | "4K" = "1K";
                if (quality === "HIRES_2K") resolution = "2K";
                if (quality === "ULTRA_4K") resolution = "4K";

                // Map Aspect Ratio strict validation
                const validRatios = ["1:1", "16:9", "9:16", "4:3", "3:4", "2:3", "3:2", "4:5", "21:9"];
                const ar = validRatios.includes(aspectRatio) ? aspectRatio : "1:1";

                const imageInputs = referenceImages || [];
                if (editImage) {
                    imageInputs.unshift(editImage);
                }

                finalImage = await generateImageWithKie({
                    prompt: editInstruction ? `${prompt} . ${editInstruction}` : prompt,
                    aspectRatio: ar as "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2" | "4:5" | "21:9",
                    resolution: resolution,
                    outputFormat: "png",
                    imageInput: imageInputs,
                    seed: seed
                });

                // Estimates
                finalWidth = resolution === "4K" ? 4096 : (resolution === "2K" ? 2048 : 1024);
                finalHeight = finalWidth; // Simplified for square, could infer from AR

            } catch (kieError: unknown) {
                console.error("Kie Generation Failed:", kieError);
                console.log("Falling back to Gemini...");
                // Allow fallthrough to Gemini by not throwing and ensuring finalImage is empty
            }
        } else if (engine === "fal") {
            try {
                console.log("Using Fal.ai engine...");
                const validRatios = ["1:1", "16:9", "9:16", "4:3", "3:4", "2:3", "3:2", "4:5", "21:9"];
                const ar = validRatios.includes(aspectRatio) ? aspectRatio : "1:1";

                const imageInputs = referenceImages || [];
                if (editImage) {
                    // Fal typically expects the init image as the primary image_url or first in list
                    // Depending on the specific model endpoint, correct field might vary.
                    // Assuming imageInput array handles it.
                    imageInputs.unshift(editImage);
                }

                finalImage = await generateImageWithFal({
                    prompt: editInstruction ? `${prompt} . ${editInstruction}` : prompt,
                    aspectRatio: ar as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
                    imageInput: imageInputs
                });
                // Fal usually returns 1024x1024 or similar for default
            } catch (falError: unknown) {
                console.error("Fal Generation Failed:", falError);
                throw falError;
            }
        }

        // Gemini Logic (Default or Fallback)
        if (!finalImage) {
            console.log("Generating with Gemini (Default or Fallback)...");
            let baseImageSize = "1K";
            if (quality === "HIRES_2K" || quality === "ULTRA_4K") {
                baseImageSize = "2K";
            }

            const baseResult = await generateBaseImageWithGemini({
                prompt,
                style,
                width,
                height,
                aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2" | "4:5" | "21:9",
                imageSize: baseImageSize as "1K" | "2K",
                referenceImages,
                editImage,
                editInstruction,
                fixedObjects,
                fixedSeed: !!fixedSeed,
                seed: seed
            });

            finalImage = baseResult.image;
            finalWidth = baseResult.width;
            finalHeight = baseResult.height;

            // Upscaling for Gemini if needed
            if (quality === "HIRES_2K") {
                console.log("Quality is HIRES_2K, running upscaler...");
                const upscaled = await upscaleImage(finalImage, "HIRES_2X");
                finalImage = upscaled.image;
                finalWidth = upscaled.width;
                finalHeight = upscaled.height;
            } else if (quality === "ULTRA_4K") {
                console.log("Quality is ULTRA_4K, running upscaler...");
                const upscaled = await upscaleImage(finalImage, "ULTRA_4X");
                finalImage = upscaled.image;
                finalWidth = upscaled.width;
                finalHeight = upscaled.height;
            }
        }

        // 5. Deduct Credits
        const deductStmt = db.prepare(
            "UPDATE credits SET amount = amount - 1 WHERE user_id = ?"
        );
        deductStmt.run(userId);

        // 6. Save to History
        const insertStmt = db.prepare(`
            INSERT INTO generations (user_id, prompt, style, size, image_url, quality, reference_image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        // Determine reference/edit image URL to save
        let savedRefImage = null;
        if (editImage) {
            savedRefImage = editImage;
        } else if (referenceImages && referenceImages.length > 0) {
            savedRefImage = referenceImages[0];
        }

        insertStmt.run(
            userId,
            prompt || editInstruction || "Image",
            engine === "kie" ? "Nano Banana Pro" : (engine === "fal" ? "Nano Banana Pro (Fal)" : (style || "None")),
            `${finalWidth}x${finalHeight}`,
            finalImage,
            quality,
            savedRefImage
        );

        // 7. Save Locally (Silent Fail)
        try {
            const defaultPath = path.join(os.homedir(), "Downloads", "My gen");
            const SAVE_DIR = process.env.LOCAL_SAVE_PATH || defaultPath;

            if (!fs.existsSync(SAVE_DIR)) {
                fs.mkdirSync(SAVE_DIR, { recursive: true });
            }

            const timestamp = Date.now();
            const filenameBase = `img_${timestamp}`;
            const imagePath = path.join(SAVE_DIR, `${filenameBase}.png`);
            const textPath = path.join(SAVE_DIR, `${filenameBase}.txt`);

            // Save Text
            const textContent = `Prompt: ${prompt}\nInstruction: ${editInstruction || ''}\nEngine: ${engine}\nStyle: ${style}\nSeed: ${seed || 'Random'}\nQuality: ${quality}`;
            fs.writeFileSync(textPath, textContent);

            // Save Image
            if (finalImage.startsWith('data:')) {
                const base64Data = finalImage.replace(/^data:image\/\w+;base64,/, "");
                fs.writeFileSync(imagePath, base64Data, 'base64');
            } else if (finalImage.startsWith('http')) {
                const imgRes = await fetch(finalImage);
                const buffer = await imgRes.arrayBuffer();
                fs.writeFileSync(imagePath, Buffer.from(buffer));
            }

        } catch (saveError) {
            console.error("Local save failed:", saveError);
            // Don't fail the request, just log
        }

        return NextResponse.json({
            success: true,
            imageUrl: finalImage,
            aspectRatio,
            quality,
            credits: credits.amount - 1,
        });

    } catch (error: unknown) {
        console.error("Generation error:", error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg = (error as any).message || "Something went wrong";
        return NextResponse.json(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { error: msg, details: (error as any).toString() },
            { status: 500 }
        );
    }
}
