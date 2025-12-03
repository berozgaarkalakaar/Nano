import { Header } from "@/components/features/Header";
import db from "@/lib/db";
import { Card } from "@/components/ui/card";

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

    return (
        <main className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">History</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {generations.map((gen) => (
                        <Card key={gen.id} className="overflow-hidden group">
                            <div className="aspect-square relative bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={gen.image_url} alt={gen.prompt} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-white">
                                    <p className="text-sm line-clamp-3 mb-2">{gen.prompt}</p>
                                    <div className="text-xs text-white/70">
                                        <p>Style: {gen.style}</p>
                                        <p>Size: {gen.size}</p>
                                        <p>{new Date(gen.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {generations.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No history found.
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
