import { useState } from "react";
import { MoreHorizontal, Download, Copy, Maximize2, RefreshCw, History, Users, LayoutTemplate, X } from "lucide-react";
import { Button } from "../ui/button";

interface Generation {
    id: number;
    image: string;
    prompt: string;
    style: string;
    size: string;
    created_at?: string;
}

interface FeedProps {
    generations: Generation[];
    onVary?: (gen: Generation) => void;
    onEdit?: (gen: Generation) => void;
}

export function Feed({ generations, onVary, onEdit }: FeedProps) {
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

    const [selectedImage, setSelectedImage] = useState<Generation | null>(null);

    return (
        <div className="flex-1 h-screen bg-[#090909] flex flex-col overflow-hidden relative">
            {/* Top Bar */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f0f0f]">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="gap-2 bg-white text-black hover:bg-gray-200 rounded-full px-4">
                        <History className="h-4 w-4" />
                        History
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white">
                        <Users className="h-4 w-4" />
                        Community
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white">
                        <LayoutTemplate className="h-4 w-4" />
                        Templates
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">All</Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Feed Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {generations.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <div className="bg-white/5 p-4 rounded-full mb-4">
                            <RefreshCw className="h-8 w-8 opacity-50" />
                        </div>
                        <p>No generations yet. Start creating!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {generations.map((gen) => (
                            <div key={gen.id} className="space-y-3 group">
                                {/* Image Card */}
                                <div
                                    className="relative rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/5 cursor-zoom-in"
                                    onClick={() => setSelectedImage(gen)}
                                >
                                    <div className="aspect-[4/5] relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={gen.image}
                                            alt={gen.prompt}
                                            className="w-full h-full object-cover bg-black/50"
                                        />

                                        {/* Overlay Actions */}
                                        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-8 w-8 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm border border-white/10"
                                                onClick={() => handleCopyPrompt(gen.prompt)}
                                                title="Copy Prompt"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-8 w-8 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm border border-white/10"
                                                onClick={() => handleDownload(gen.image, gen.prompt)}
                                                title="Download Image"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <div
                                                className="bg-white text-black px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-gray-200 shadow-lg"
                                                onClick={() => onEdit?.(gen)}
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                                Edit
                                            </div>
                                            <div
                                                className="bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-black/80 backdrop-blur-sm border border-white/10 shadow-lg"
                                                onClick={() => alert("Upscaling is not supported by this model version yet.")}
                                            >
                                                <Maximize2 className="h-3 w-3" />
                                                Upscale
                                            </div>
                                        </div>

                                        {/* Google Logo Mock */}
                                        <div className="absolute bottom-4 left-4 bg-white/10 p-1 rounded backdrop-blur-sm">
                                            <span className="font-bold text-white text-xs">G</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Header (now Footer) */}
                                <div className="flex items-start justify-between px-1">
                                    <p className="text-sm text-gray-400 line-clamp-1 max-w-[70%] font-light tracking-wide" title={gen.prompt}>
                                        {gen.prompt}
                                    </p>
                                    <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-500">{gen.size}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={selectedImage.image}
                            alt={selectedImage.prompt}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute -top-12 right-0 text-white hover:bg-white/20 rounded-full"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="h-6 w-6" />
                        </Button>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                            <Button
                                variant="secondary"
                                className="bg-white text-black hover:bg-gray-200"
                                onClick={() => handleDownload(selectedImage.image, selectedImage.prompt)}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download Original
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
