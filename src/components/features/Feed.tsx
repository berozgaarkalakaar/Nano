import { useState } from "react";
import { MoreHorizontal, Download, Maximize2, RefreshCw, History, X, Sparkles, Folder, Video, Edit2, Share2, Wand2 } from "lucide-react";
import { Button } from "../ui/button";
import { Generation } from "@/types";
import { ProgressiveImage } from "../ui/ProgressiveImage";
import { cn } from "@/lib/utils";

const QUALITY_LABELS: Record<string, string> = {
    "BASE_1K": "Base 1K",
    "HIRES_2K": "Hi-res 2K",
    "ULTRA_4K": "Ultra 4K"
};

interface FeedProps {
    generations: Generation[];
    onVary?: (gen: Generation) => void;
    onEdit?: (gen: Generation) => void;
    onShowHistory?: () => void;
    isGenerating?: boolean;
}

function SkeletonCard() {
    return (
        <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/5 aspect-[4/5] flex items-center justify-center group">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10 animate-pulse" />
                <div className="flex flex-col items-center gap-3 z-10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
                        <Sparkles className="h-8 w-8 text-purple-400 animate-bounce" />
                    </div>
                    <span className="text-sm font-medium text-purple-200/70 animate-pulse">Dreaming...</span>
                </div>
                {/* Scanning line effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent -translate-y-full animate-[shimmer_2s_infinite]" />
            </div>
            <div className="flex justify-between items-center px-1">
                <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-8 bg-white/5 rounded animate-pulse" />
            </div>
        </div>
    );
}



export function Feed({ generations, onVary, onEdit, onShowHistory }: FeedProps) {
    // ... existing handlers ...
    const handleDownload = (imageUrl: string, prompt: string) => {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `${prompt.slice(0, 20)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [selectedImage, setSelectedImage] = useState<Generation | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const toggleSelection = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === generations.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(generations.map(g => g.id)));
        }
    };

    return (
        <div className="flex-1 h-screen bg-[#090909] flex flex-col overflow-hidden relative">
            {/* Top Bar */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f0f0f] z-30 relative">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 bg-white text-black hover:bg-gray-200 rounded-full px-4"
                        onClick={onShowHistory}
                    >
                        <History className="h-4 w-4" />
                        History
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("gap-2 text-muted-foreground hover:text-white", selectedIds.size > 0 && "text-blue-400")}
                        onClick={toggleSelectAll}
                    >
                        <span className={cn("w-4 h-4 rounded-full border border-current flex items-center justify-center transition-colors", selectedIds.size === generations.length && generations.length > 0 && "bg-blue-400 border-blue-400")}>
                            {selectedIds.size === generations.length && generations.length > 0 && <span className="w-2 h-2 bg-white rounded-full" />}
                        </span>
                        {selectedIds.size === generations.length && generations.length > 0 ? "Deselect All" : "Select All"}
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <span className="text-xs text-muted-foreground mr-2">{selectedIds.size} selected</span>
                    )}
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
                        {generations.map((gen) => {
                            if (gen.status === 'pending') {
                                return <SkeletonCard key={gen.id} />;
                            }
                            if (gen.status === 'failed' || !gen.image) {
                                return null;
                            }
                            return (
                                <div key={gen.id} className="space-y-3 group">
                                    <div
                                        className="relative rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/5 cursor-zoom-in"
                                        onClick={() => setSelectedImage(gen)}
                                    >
                                        <div className="aspect-[4/5] relative">
                                            <ProgressiveImage src={gen.image} alt={gen.prompt} />

                                            {/* Hover Overlay */}
                                            <div className={cn(
                                                "absolute inset-0 bg-black/20 transition-opacity duration-200",
                                                selectedIds.has(gen.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                            )}>
                                                {/* Top Left: Selection */}
                                                <div className="absolute top-3 left-3">
                                                    <div
                                                        className={cn(
                                                            "w-5 h-5 rounded border cursor-pointer transition-colors flex items-center justify-center",
                                                            selectedIds.has(gen.id)
                                                                ? "bg-blue-500 border-blue-500"
                                                                : "border-white/50 bg-black/20 hover:bg-black/40 hover:border-white"
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleSelection(gen.id);
                                                        }}
                                                    >
                                                        {selectedIds.has(gen.id) && <span className="text-white text-[10px] font-bold">✓</span>}
                                                    </div>
                                                </div>

                                                {/* Top Right: Actions */}
                                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm">
                                                        <Folder className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(gen.image || "", gen.prompt);
                                                        }}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* Bottom Left: Google Logo */}
                                                <div className="absolute bottom-3 left-3">
                                                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                        <span className="font-bold text-black text-xs">G</span>
                                                    </div>
                                                </div>

                                                {/* Bottom Right: Primary Actions */}
                                                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-white text-black hover:bg-gray-200 shadow-lg">
                                                        <Video className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-9 w-9 rounded-full bg-white text-black hover:bg-gray-200 shadow-lg"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit?.(gen);
                                                        }}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        className="h-9 px-4 rounded-full bg-white text-black hover:bg-gray-200 font-medium shadow-lg"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onVary?.(gen);
                                                        }}
                                                    >
                                                        Vary
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Header (now Footer) */}
                                    <div className="flex items-start justify-between px-1">
                                        <p className="text-sm text-gray-400 line-clamp-1 max-w-[60%] font-light tracking-wide" title={gen.prompt}>
                                            {gen.prompt}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {gen.quality && (
                                                <span className="text-[10px] bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded border border-purple-500/20">
                                                    {QUALITY_LABELS[gen.quality] || "1K"}
                                                </span>
                                            )}
                                            <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-500">{gen.size}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
                    <div className="w-full h-full flex overflow-hidden" onClick={(e) => e.stopPropagation()}>

                        {/* Left: Image Area */}
                        <div className="flex-1 relative flex items-center justify-center bg-[#090909] p-8">
                            <ProgressiveImage
                                src={selectedImage.image || ""}
                                alt={selectedImage.prompt}
                                className="max-w-full max-h-full object-contain shadow-2xl"
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute top-4 left-4 text-white hover:bg-white/10 rounded-full"
                                onClick={() => setSelectedImage(null)}
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        {/* Right: Details Panel */}
                        <div className="w-[400px] bg-[#1a1a1a] border-l border-white/5 flex flex-col h-full overflow-y-auto">
                            <div className="p-6 space-y-8">
                                {/* Header Actions */}
                                <div className="flex items-center justify-end gap-2">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white">
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => handleDownload(selectedImage.image || "", selectedImage.prompt)}>
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Prompt Section */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PROMPT</h3>
                                    <p className="text-sm text-gray-200 leading-relaxed">
                                        {selectedImage.prompt}
                                    </p>
                                    <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">See more</button>
                                </div>

                                {/* Reference Section (Mock) */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">REFERENCE</h3>
                                    {selectedImage.reference_image_url ? (
                                        <div className="w-16 h-12 rounded border border-white/10 overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={selectedImage.reference_image_url} alt="Reference" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-12 rounded border border-white/10 bg-black/40 flex items-center justify-center">
                                            <span className="text-[10px] text-gray-600">None</span>
                                        </div>
                                    )}
                                </div>

                                {/* Settings Section */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SETTINGS</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 rounded bg-white/5 text-xs text-gray-300 border border-white/5">
                                            {selectedImage.size.replace('x', ':')}
                                        </span>
                                        {selectedImage.quality && (
                                            <span className="px-2 py-1 rounded bg-purple-500/10 text-xs text-purple-300 border border-purple-500/20">
                                                {QUALITY_LABELS[selectedImage.quality] || selectedImage.quality}
                                            </span>
                                        )}
                                        <span className="px-2 py-1 rounded bg-white/5 text-xs text-gray-300 border border-white/5">
                                            Google Nano Banana Pro
                                        </span>
                                    </div>
                                </div>

                                {/* Actions List */}
                                <div className="space-y-1 pt-4">
                                    <Button variant="ghost" className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-white/5 h-12">
                                        <RefreshCw className="h-4 w-4" />
                                        Recreate
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-white/5 h-12">
                                        <Maximize2 className="h-4 w-4" />
                                        Upscale
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-white/5 h-12">
                                        <Video className="h-4 w-4" />
                                        Create video
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-white/5 h-12">
                                        <Wand2 className="h-4 w-4" />
                                        Variations
                                    </Button>
                                </div>
                            </div>

                            {/* Footer Action */}
                            <div className="mt-auto p-6 border-t border-white/5 bg-[#1a1a1a]">
                                <Button
                                    className="w-full bg-white text-black hover:bg-gray-200 font-semibold h-10"
                                    onClick={() => {
                                        onEdit?.(selectedImage);
                                        setSelectedImage(null);
                                    }}
                                >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit Image
                                </Button>
                                <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                                    <span>100%</span>
                                    <span>{selectedImage.size.replace('x', '×')} px</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
