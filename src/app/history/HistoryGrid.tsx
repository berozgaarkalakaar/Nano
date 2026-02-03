"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";
import { Lightbox } from "@/components/ui/Lightbox";
import { Generation } from "@/types";

interface HistoryGridProps {
    generations: Generation[];
}

export function HistoryGrid({ generations: initialGenerations }: HistoryGridProps) {
    const router = useRouter();
    const [generations, setGenerations] = useState(initialGenerations);
    const [selectedImage, setSelectedImage] = useState<Generation | null>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedItems(new Set());
    };

    const toggleItemSelection = (id: number) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };

    const handleSelectAll = () => {
        if (selectedItems.size === generations.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(generations.map(g => g.id)));
        }
    };

    const handleDownload = async (imageUrl: string, prompt: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${prompt.slice(0, 20).replace(/[^a-z0-9]/gi, '_')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            // Fallback for direct links if fetch fails (CORS etc)
            const link = document.createElement("a");
            link.href = imageUrl;
            link.download = `${prompt.slice(0, 20)}.png`;
            link.click();
        }
    };

    const handleBulkDownload = async () => {
        const itemsToDownload = generations.filter(g => selectedItems.has(g.id));
        for (const item of itemsToDownload) {
            if (item.image) {
                await handleDownload(item.image, item.prompt || "image");
                // Small delay to prevent browser throttling
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        setIsSelectionMode(false);
        setSelectedItems(new Set());
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedItems.size} items? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch("/api/history/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedItems) }),
            });

            if (response.ok) {
                setGenerations(prev => prev.filter(g => !selectedItems.has(g.id)));
                setSelectedItems(new Set());
                setIsSelectionMode(false);
            } else {
                alert("Failed to delete items.");
            }
        } catch (error) {
            console.error("Delete failed:", error);
            alert("An error occurred while deleting.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopyPrompt = (prompt: string) => {
        navigator.clipboard.writeText(prompt);
        alert("Prompt copied to clipboard!");
    };

    const handleEdit = (gen: Generation) => {
        const params = new URLSearchParams();
        if (gen.image) params.set("editImage", gen.image);
        if (gen.prompt) params.set("prompt", gen.prompt);
        router.push(`/?${params.toString()}`);
    };

    const handleRecreate = (gen: Generation) => {
        // Just set prompt, do not toggle edit mode with image
        const params = new URLSearchParams();
        if (gen.prompt) params.set("prompt", gen.prompt);
        // Force replace to ensure we reset state if needed? 
        // Note: page.tsx useEffect listens to params.
        router.push(`/?${params.toString()}`);
    };

    const handleSingleDelete = async (gen: Generation) => {
        if (!window.confirm("Are you sure you want to delete this generation?")) {
            return;
        }

        try {
            const response = await fetch("/api/history/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: [gen.id] }),
            });

            if (response.ok) {
                setGenerations(prev => prev.filter(g => g.id !== gen.id));
                setSelectedImage(null); // Close Lightbox
            } else {
                alert("Failed to delete item.");
            }
        } catch (error) {
            console.error("Delete failed:", error);
            alert("An error occurred while deleting.");
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-gray-400">
                    {generations.length} generations
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={isSelectionMode ? "secondary" : "outline"}
                        onClick={toggleSelectionMode}
                    >
                        {isSelectionMode ? "Cancel Selection" : "Select Items"}
                    </Button>
                </div>
            </div>

            {isSelectionMode && (
                <div className="sticky top-4 z-50 bg-[#1a1a1a] border border-white/10 rounded-lg p-4 mb-6 flex justify-between items-center shadow-xl animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-4">
                        <span className="font-medium text-white">{selectedItems.size} selected</span>
                        <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                            {selectedItems.size === generations.length ? "Deselect All" : "Select All"}
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={selectedItems.size === 0 || isDeleting}
                            onClick={handleBulkDelete}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            disabled={selectedItems.size === 0}
                            onClick={handleBulkDownload}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {generations.map((gen) => (
                    <Card
                        key={gen.id}
                        className={`overflow-hidden group border-white/10 bg-[#1a1a1a] relative ${selectedItems.has(gen.id) ? "ring-2 ring-blue-500" : ""
                            }`}
                    >
                        <div
                            className="aspect-square relative cursor-pointer"
                            onClick={() => {
                                if (isSelectionMode) {
                                    toggleItemSelection(gen.id);
                                } else {
                                    setSelectedImage(gen);
                                }
                            }}
                        >
                            <ProgressiveImage src={gen.image || ""} alt={gen.prompt || "Generated"} />

                            {/* Selection Checkbox Overlay */}
                            {isSelectionMode && (
                                <div className={`absolute top-2 left-2 z-20 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedItems.has(gen.id)
                                        ? "bg-blue-500 border-blue-500"
                                        : "bg-black/50 border-white/50 hover:border-white"
                                    }`}>
                                    {selectedItems.has(gen.id) && <Check className="h-4 w-4 text-white" />}
                                </div>
                            )}

                            {!isSelectionMode && (
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
                            )}
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
                    onRecreate={handleRecreate}
                    onDelete={handleSingleDelete}
                    onDownload={(url, prompt) => handleDownload(url || "", prompt || "")}
                    onCopyPrompt={handleCopyPrompt}
                />
            )}
        </>
    );
}
