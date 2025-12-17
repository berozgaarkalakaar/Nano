import { Header } from "@/components/features/Header";
import db from "@/lib/db";
import { HistoryGrid } from "./HistoryGrid";

export const dynamic = 'force-dynamic';

export default function HistoryPage() {
    // Mock user ID
    const userId = 1;

    const stmt = db.prepare("SELECT * FROM generations WHERE user_id = ? ORDER BY created_at DESC LIMIT 500");
    const generations = stmt.all(userId) as {
        id: number;
        image_url: string;
        prompt: string;
        style: string;
        size: string;
        created_at: string;
    }[];

    const formattedGenerations = generations.map(g => ({
        ...g,
        status: 'completed' as const,
        image: g.image_url,
    }));

    return (
        <main className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">History</h1>

                <HistoryGrid generations={formattedGenerations} />
            </div>
        </main>
    );
}
