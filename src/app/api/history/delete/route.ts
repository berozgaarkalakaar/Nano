
import { NextResponse } from "next/server";
import db from "@/lib/db";
import fs from "fs";

export async function POST(req: Request) {
    try {
        const { ids } = await req.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        // 1. Fetch generations to identify files to delete
        const placeholders = ids.map(() => "?").join(",");
        const stmt = db.prepare(`SELECT id, local_path FROM generations WHERE id IN (${placeholders})`);
        const generations = stmt.all(...ids) as { id: number; local_path: string | null }[];

        // 2. Delete local files
        for (const gen of generations) {
            if (gen.local_path && fs.existsSync(gen.local_path)) {
                try {
                    // Delete image
                    fs.unlinkSync(gen.local_path);

                    // Try to delete associated txt file
                    const txtPath = gen.local_path.replace(/\.png$/, ".txt");
                    if (fs.existsSync(txtPath)) {
                        fs.unlinkSync(txtPath);
                    }
                } catch (err) {
                    console.error(`Failed to delete file for generation ${gen.id}:`, err);
                    // Continue deleting from DB even if file delete fails
                }
            }
        }

        // 3. Delete from DB
        const deleteStmt = db.prepare(`DELETE FROM generations WHERE id IN (${placeholders})`);
        deleteStmt.run(...ids);

        return NextResponse.json({ success: true, deletedCount: generations.length });

    } catch (error) {
        console.error("Delete operation failed:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
