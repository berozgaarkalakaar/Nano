import { NextResponse } from "next/server";
import { generateImageWithMj } from "@/lib/kie-mj";

export async function POST(req: Request) {
    try {
        const apiKey = process.env.KIE_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "KIE_API_KEY is not configured" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { prompt, aspectRatio, options } = body;

        console.log("Kie Generate Route Request:", { prompt, aspectRatio, options });

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        const result = await generateImageWithMj(prompt, aspectRatio || "1:1", options);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Kie Generate Route Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
