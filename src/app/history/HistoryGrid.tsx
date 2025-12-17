"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";
import { Lightbox } from "@/components/ui/Lightbox";
import { Generation } from "@/types";

interface HistoryGridProps {
    generations: Generation[];
}

export function HistoryGrid({ generations }: HistoryGridProps) {
    const router = useRouter();
    const [selectedImage, setSelectedImage] = useState<Generation | null>(null);

    const handleDownload = (imageUrl: string, prompt: string) => {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `${prompt.slice(0, 20)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyPrompt = (prompt: string) => {
        navigator.clipboard.writeText(prompt);
        alert("Prompt copied to clipboard!");
    };

    const handleEdit = (gen: Generation) => {
        // Navigate to home with query params
        const params = new URLSearchParams();
        if (gen.image) params.set("editImage", gen.image);
        if (gen.prompt) params.set("prompt", gen.prompt);
        router.push(`/?${params.toString()}`);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {generations.map((gen) => (
                    <Card key={gen.id} className="overflow-hidden group border-white/10 bg-[#1a1a1a]">
                        <div
                            className="aspect-square relative cursor-pointer"
                            onClick={() => setSelectedImage(gen)}
                        >
                            <ProgressiveImage src={gen.image || ""} alt={gen.prompt || "Generated"} />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-white">
                                <p className="text-sm line-clamp-3 mb-2">{gen.prompt}</p>
                                <div className="text-xs text-white/70">
                                    <p>Style: {gen.style}</p>
                                    <p>Size: {gen.size}</p>
                                    <p>{gen.created_at ? new Date(gen.created_at).toLocaleDateString() : ""}</p>
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-white/20" onClick={(e) => { e.stopPropagation(); handleDownload(gen.image || "", gen.prompt || ""); }}>
                                        <Download className="h-3 w-3" />
                                    </Button>
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

            {selectedImage && (
                <Lightbox
                    image={selectedImage}
                    onClose={() => setSelectedImage(null)}
                    onEdit={handleEdit}
                    onDownload={handleDownload}
                    onCopyPrompt={handleCopyPrompt}
                />
            )}
        </>
    );
}
