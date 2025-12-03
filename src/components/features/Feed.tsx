import { MoreHorizontal, Download, Copy, Maximize2, RefreshCw, History, Users, LayoutTemplate } from "lucide-react";
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

    return (
        <div className="flex-1 h-screen bg-[#090909] flex flex-col overflow-hidden">
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
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {generations.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <div className="bg-white/5 p-4 rounded-full mb-4">
                            <RefreshCw className="h-8 w-8 opacity-50" />
                        </div>
                        <p>No generations yet. Start creating!</p>
                    </div>
                ) : (
                    generations.map((gen) => (
                        <div key={gen.id} className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <p className="text-sm text-gray-300 line-clamp-2 max-w-[80%] font-light tracking-wide">
                                    {gen.prompt}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">{gen.size || "1:1"}</span>
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">google nano banana pro</span>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <input type="checkbox" className="rounded border-white/20 bg-transparent" title="Select for today" />
                                        <span>Today</span>
                                    </div>
                                </div>
                            </div>

                            {/* Image Card */}
                            <div className="relative group rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/5">
                                <div className="aspect-[16/9] relative"> {/* Using 16/9 container for feed look, image will fit */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={gen.image}
                                        alt={gen.prompt}
                                        className="w-full h-full object-contain bg-black/50"
                                    />

                                    {/* Overlay Actions */}
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
