
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { upscaleImageWithMj, varyImageWithMj } from "@/lib/kie-mj";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, taskId, index, generationId } = body;

        // Validations
        if (!["upscale", "vary"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
        if (!taskId || !index) {
            return NextResponse.json({ error: "Missing taskId or index" }, { status: 400 });
        }

        console.log(`--- MJ Action: ${action} [${index}] for task ${taskId} ---`);

        let result;
        if (action === "upscale") {
            result = await upscaleImageWithMj(taskId, index);
        } else {
            result = await varyImageWithMj(taskId, index);
        }

        // We have a new taskId for this action.
        // We should insert a NEW generation record for this action, linked to the original?
        // Or just treat it as a new generation.
        // Let's treat as new generation.

        const userId = 1; // Mock

        // Deduct Credits
        const deductStmt = db.prepare("UPDATE credits SET amount = amount - 1 WHERE user_id = ?");
        deductStmt.run(userId);

        const creditsStmt = db.prepare("SELECT amount FROM credits WHERE user_id = ?");
        const credits = creditsStmt.get(userId) as { amount: number };

        // Fetch original prompt/details if possible, or just use defaults.
        // For accurate history, we might want to fetch the original generation.
        let prompt = "MJ Action";
        let style = "Midjourney v6.0";
        if (generationId) {
            const genStmt = db.prepare("SELECT prompt, style FROM generations WHERE id = ?");
            const original = genStmt.get(generationId) as { prompt: string, style: string };
            if (original) {
                prompt = `${original.prompt} (${action === "upscale" ? "Upscale" : "Variation"} ${index})`;
                style = original.style;
            }
        }

        const insertStmt = db.prepare(`
            INSERT INTO generations (user_id, prompt, style, size, image_url, quality, status, taskId, engine)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStmt.run(
            userId,
            prompt,
            style,
            "1024x1024",
            "",
            "BASE_1K",
            "pending",
            result.taskId,
            "midjourney"
        );

        return NextResponse.json({
            success: true,
            taskId: result.taskId,
            status: "pending",
            credits: credits.amount
        });

    } catch (error: any) {
        console.error("MJ Action Failed:", error);
        return NextResponse.json({ error: error.message || "Action Failed" }, { status: 500 });
    }
}
