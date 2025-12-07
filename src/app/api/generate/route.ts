import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { uploadImageToDrive } from "@/lib/drive";
import { generateBaseImageWithGemini } from "@/lib/gemini";
import { upscaleImage } from "@/lib/upscaler";
import { generateImageWithKie } from "@/lib/kie";

export async function POST(req: NextRequest) {
    try {
        // ... (Auth Check and Body Parse remain the same)
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
            engine = "kie" // Default to Kie now
        } = body;

        // ... (Validation and Credits check remain the same)

        console.log("--- GENERATION REQUEST ---");
        console.log("Engine:", engine);
        console.log("Quality:", quality);
        console.log("Prompt:", prompt);
        console.log("--------------------------");

        let finalImage = "";
        let finalWidth = 0;
        let finalHeight = 0;
        let wasUpscaled = false;

        if (engine === "kie") {
            try {
                // Map Nano Banana Pro parameters
                let resolution: "1K" | "2K" | "4K" = "1K";
                if (quality === "HIRES_2K") resolution = "2K";
                if (quality === "ULTRA_4K") resolution = "4K";

                // Map Aspect Ratio strictly if needed, or pass through
                // Kie expects 1:1, 16:9, etc.
                const validRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];
                const ar = validRatios.includes(aspectRatio) ? aspectRatio as any : "1:1";

                finalImage = await generateImageWithKie({
                    prompt: editInstruction ? `${prompt} . ${editInstruction}` : prompt, // Combine for now or handle edit mode
                    aspectRatio: ar,
                    resolution: resolution,
                    outputFormat: "png",
                    imageInput: referenceImages
                });

                // Kie returns URL, we don't know exact dims yet unless we fetch metadata, 
                // but we can infer from resolution 1K/2K/4K appx.
            } catch (kieError: any) {
                console.error("Kie Generation Failed:", kieError);
                // Fallback or throw? User said "just kie key", so let's throw.
                throw kieError;
            }

        } else {
            // ... (Gemini Logic)
            // Step 1: Base Generation
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

            finalImage = baseResult.image;
            finalWidth = baseResult.width;
            finalHeight = baseResult.height;
        }

        // ... (Upscaling Logic - only for Gemini if Kie already did high res?)
        // If Kie returned a 4K image, we probably don't need to upscale again.
        // Let's only upscale if engine was gemini AND quality dictates it.
        // OR if needed. For now, assume Kie gives the requested resolution directly.

        if (engine !== "kie") {
            // Step 2: Upscaling (if needed)
            if (quality === "HIRES_2K") {
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
        }

        // ... (Credits and Saving remaining logic)
        // ...


        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Generation error:", error);
        return NextResponse.json({ error: error.message || "Something went wrong", details: error.toString() }, { status: 500 });
    }
}
