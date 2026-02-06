
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const userId = 1; // Mock user ID

        const stmt = db.prepare("SELECT amount FROM credits WHERE user_id = ?");
        const credits = stmt.get(userId) as { amount: number } | undefined;

        if (!credits) {
            // Initialize if missing
            const insert = db.prepare("INSERT INTO credits (user_id, amount) VALUES (?, ?)");
            insert.run(userId, 100); // Default to 100
            return NextResponse.json({ credits: 100 });
        }

        return NextResponse.json({ credits: credits.amount });

    } catch (error: any) {
        console.error("Fetch Credits Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch credits" },
            { status: 500 }
        );
    }
}
