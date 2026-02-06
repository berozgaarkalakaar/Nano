
import { NextRequest, NextResponse } from "next/server";
import { fetchMjTask } from "@/lib/kie-mj";
import db from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: { taskId: string } }
) {
    const taskId = params.taskId;

    if (!taskId) {
        return NextResponse.json({ error: "Missing Task ID" }, { status: 400 });
    }

    try {
        console.log(`Checking status for task: ${taskId}`);
        const task = await fetchMjTask(taskId);

        // If completed, update DB
        if (task.status === "SUCCESS" && task.image) {
            console.log("Task succeeded, updating DB...", task.image);

            const updateStmt = db.prepare(`
                UPDATE generations 
                SET status = 'completed', image_url = ? 
                WHERE taskId = ?
            `);
            updateStmt.run(task.image, taskId);
        } else if (task.status === "FAILURE") {
            const updateStmt = db.prepare(`
                UPDATE generations 
                SET status = 'failed' 
                WHERE taskId = ?
            `);
            updateStmt.run(taskId);
        }

        return NextResponse.json(task);

    } catch (error: any) {
        console.error("Status Check Failed:", error);
        return NextResponse.json(
            { error: error.message || "Failed to check status" },
            { status: 500 }
        );
    }
}
