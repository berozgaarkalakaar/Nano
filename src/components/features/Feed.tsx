import { useState, useEffect } from "react";
import { MoreHorizontal, Download, RefreshCw, History, Folder, Video, Edit2, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Generation } from "@/types";
import { ProgressiveImage } from "../ui/ProgressiveImage";
import { cn } from "@/lib/utils";
import { Lightbox } from "../ui/Lightbox";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

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

const FUNNY_MESSAGES = [
    "Hold my coffee, I'm imaging...",
    "Convincing the pixels to cooperate...",
    "Reticulating splines...",
    "Consulting the oracle of creativity...",
    "Waking up the hamsters...",
    "Teaching the AI to paint...",
    "Summoning the art spirits...",
    "Googling 'how to draw'...",
    "Adding extra sparkle...",
    "Generating masterpiece (hopefully)...",
    "Feeding the GPU...",
    "Thinking really hard...",
    "Do not turn off console...",
    "Making it pop...",
    "Applying magic dust..."
];

function SkeletonCard() {
    const [message, setMessage] = useState("Creating magic...");

    useEffect(() => {
        setMessage(FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)]);
    }, []);

    return (
        <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/5 aspect-[4/5] flex items-center justify-center group">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10 animate-pulse" />

                {/* Dynamic Center Animation */}
                <div className="flex flex-col items-center gap-4 z-10 p-4 text-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 blur-2xl rounded-full animate-pulse opacity-50" />
                        <div className="relative flex items-center justify-center">
                            {/* Double Spinner Effect */}
                            <div className="absolute inset-0 border-2 border-t-transparent border-l-transparent border-purple-400 rounded-full animate-spin"></div>
                            <div className="absolute inset-[-4px] border-2 border-b-transparent border-r-transparent border-pink-400 rounded-full animate-spin-reverse opacity-70"></div>

                            <Sparkles className="h-8 w-8 text-white relative z-10 animate-pulse" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 text-transparent bg-clip-text animate-pulse">
                            {message}
                        </span>
                        <span className="text-[10px] text-white/30 font-mono tracking-wider animate-pulse delay-75">
                            PLEASE WAIT...
                        </span>
                    </div>
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
    const router = useRouter();

    // Polling for pending tasks
    useEffect(() => {
        const pendingItems = generations.filter(g => g.status === 'pending' && g.taskId);
        if (pendingItems.length === 0) return;

        const intervalId = setInterval(async () => {
            let shouldRefresh = false;
            for (const item of pendingItems) {
                if (!item.taskId) continue;
                try {
                    const res = await fetch(`/api/generate/status/${item.taskId}`);
                    const data = await res.json();
                    if (data.status === 'succeeded' || data.status === 'failed') {
                        shouldRefresh = true;
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }
            if (shouldRefresh) {
                console.log("Task completed, refreshing feed...");
                router.refresh(); // Triggers server re-fetch
                onShowHistory?.(); // Update if using client-side fetch callback
            }
        }, 3000); // Check every 3 seconds

        return () => clearInterval(intervalId);
    }, [generations, router, onShowHistory]);

    const handleDownload = async (imageUrl: string, prompt: string, bedName?: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;

            // Construct filename: BedName or sanitized prompt slug
            const safeName = bedName
                ? bedName.trim().replace(/[^a-z0-9\-_]/gi, '_')
                : (prompt || "image").slice(0, 20).replace(/[^a-z0-9]/gi, '_');

            link.download = `${safeName}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            // Fallback
            const link = document.createElement("a");
            link.href = imageUrl;

            // Construct filename for fallback too
            const safeName = bedName
                ? bedName.trim().replace(/[^a-z0-9\-_]/gi, '_')
                : (prompt || "image").slice(0, 20).replace(/[^a-z0-9]/gi, '_');

            link.download = `${safeName}.png`;
            link.click();
        }
    };

    const [selectedImage, setSelectedImage] = useState<Generation | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleBulkDownload = async () => {
        const items = generations.filter(g => selectedIds.has(g.id));
        for (const item of items) {
            if (item.image) {
                await handleDownload(item.image, item.prompt || "image", item.bedName);
                // Small delay to prevent throttling
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        setSelectedIds(new Set());
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} items?`)) return;

        setIsDeleting(true);
        try {
            const response = await fetch("/api/history/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedIds) }),
            });

            if (response.ok) {
                onShowHistory?.();
                setSelectedIds(new Set());
            } else {
                alert("Failed to delete items.");
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting items.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRecreate = (gen: Generation) => {
        const params = new URLSearchParams();
        if (gen.prompt) params.set("prompt", gen.prompt);
        router.push(`/?${params.toString()}`);
        setSelectedImage(null);
    };

    const handleSingleDelete = async (gen: Generation) => {
        if (!window.confirm("Delete this image?")) return;
        try {
            await fetch("/api/history/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: [gen.id] }),
            });
            onShowHistory?.();
            setSelectedImage(null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleMjAction = async (action: "upscale" | "vary", index: number, gen: Generation) => {
        if (!gen.taskId) {
            alert("No Task ID found for this generation.");
            return;
        }
        try {
            const response = await fetch("/api/generate/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    taskId: gen.taskId,
                    index,
                    generationId: gen.id
                })
            });
            const data = await response.json();
            if (response.ok) {
                alert(`Action ${action} initiated!`);
                onShowHistory?.();
                // Ideally close lightbox or show toast.
                setSelectedImage(null);
            } else {
                alert(`Action failed: ${data.error}`);
            }
        } catch (error) {
            console.error("MJ Action Error:", error);
            alert("Failed to trigger action.");
        }
    };

    const handleCopyPrompt = (prompt: string) => {
        navigator.clipboard.writeText(prompt);
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
                        <>
                            <span className="text-xs text-muted-foreground mr-2">{selectedIds.size} selected</span>
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isDeleting}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                            <Button variant="default" size="sm" onClick={handleBulkDownload}>
                                <Download className="h-4 w-4 mr-2" /> Download
                            </Button>
                        </>
                    )}
                    {!selectedIds.size && (
                        <>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">All</Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </>
                    )}
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
                                                            handleDownload(gen.image || "", gen.prompt || "image", gen.bedName);
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

                                    {/* Footer */}
                                    <div className="flex items-start justify-between px-1">
                                        <p className="text-sm text-gray-400 line-clamp-1 max-w-[60%] font-light tracking-wide" title={gen.prompt}>
                                            {gen.bedName ? (
                                                <span className="text-white font-medium mr-2">{gen.bedName}</span>
                                            ) : null}
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

            {selectedImage && (
                <Lightbox
                    image={selectedImage}
                    onClose={() => setSelectedImage(null)}
                    onEdit={onEdit}
                    onRecreate={handleRecreate}
                    onDelete={handleSingleDelete}
                    onDownload={handleDownload}
                    onCopyPrompt={handleCopyPrompt}
                    onNext={() => {
                        const idx = generations.findIndex(g => g.id === selectedImage.id);
                        if (idx < generations.length - 1) setSelectedImage(generations[idx + 1]);
                    }}
                    onPrev={() => {
                        const idx = generations.findIndex(g => g.id === selectedImage.id);
                        if (idx > 0) setSelectedImage(generations[idx - 1]);
                    }}
                    hasNext={generations.findIndex(g => g.id === selectedImage.id) < generations.length - 1}
                    hasPrev={generations.findIndex(g => g.id === selectedImage.id) > 0}
                    onMjAction={(action, index) => handleMjAction(action, index, selectedImage)}
                />
            )}
        </div>
    );
}
