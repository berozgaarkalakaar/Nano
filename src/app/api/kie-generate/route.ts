import { NextRequest, NextResponse } from "next/server";
import { generateImageWithKie } from "@/lib/kie";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check (Mock)
        const userId = 1;

        // 2. Parse Body
        const body = await req.json();
        const {
            prompt,
            aspectRatio,
            resolution, // "1K" | "2K" | "4K"
            outputFormat,
            imageInput,
        } = body;

        if (!prompt) {
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

        console.log("--- KIE GENERATION REQUEST ---");
        console.log("Prompt:", prompt);
        console.log("Params:", { aspectRatio, resolution, outputFormat });
        console.log("------------------------------");

        // 4. Call Kie API
        const result = await generateImageWithKie({
            prompt,
            aspectRatio,
            resolution,
            outputFormat,
            imageInput,
        });

        // 5. Deduct Credits
        const deductStmt = db.prepare(
            "UPDATE credits SET amount = amount - 1 WHERE user_id = ?"
        );
        deductStmt.run(userId);

        // 6. Save to History
        // We'll use the existing 'generations' table.
        // Map Kie resolution to size string if possible, or use the requested resolution.
        const reqResolution = resolution || "1K";
        const sizeStr = reqResolution === "4K" ? "4096x4096" : (reqResolution === "2K" ? "2048x2048" : "1024x1024");

        const insertStmt = db.prepare(`
            INSERT INTO generations (user_id, prompt, style, size, image_url, quality)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        insertStmt.run(
            userId,
            prompt,
            "Nano Banana Pro", // Style
            sizeStr, // Size
            result, // result is the image URL string now
            reqResolution // Quality
        );

        return NextResponse.json({
            success: true,
            imageUrl: result,
            aspectRatio: aspectRatio,
            resolution: reqResolution,
            credits: credits.amount - 1,
        });
    } catch (error: any) {
        console.error("Kie Generation error:", error);
        return NextResponse.json(
            {
                error: error.message || "Something went wrong with Kie generation",
                details: error.toString(),
            },
            { status: 500 }
        );
    }
}
