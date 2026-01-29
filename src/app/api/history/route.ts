import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
    try {
        const userId = 1; // Mock User ID

        const stmt = db.prepare(`
            SELECT id, prompt, style, size, image_url as image, quality, created_at, is_favorite, status, reference_image_url
            FROM generations 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `);

        const generations = stmt.all(userId);

        return NextResponse.json({ generations });
    } catch (error: unknown) {
        console.error("Failed to fetch history:", error);
        return NextResponse.json(
            { error: "Failed to fetch history" },
            { status: 500 }
        );
    }
}
