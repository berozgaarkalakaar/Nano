import React, { useState, useEffect } from "react";
import { Share2, Download, MoreHorizontal, RefreshCw, Maximize2, Video, Wand2, Edit2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Generation } from "@/types";

const QUALITY_LABELS: Record<string, string> = {
    "BASE_1K": "Base 1K",
    "HIRES_2K": "Hi-res 2K",
    "ULTRA_4K": "Ultra 4K"
};

interface LightboxProps {
    image: Generation;
    onClose: () => void;
    onEdit?: (gen: Generation) => void;
    onRecreate?: (gen: Generation) => void;
    onDelete?: (gen: Generation) => void;
    onDownload?: (imageUrl: string, prompt: string, bedName?: string) => void;
    onCopyPrompt?: (prompt: string) => void;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext?: boolean;
    hasPrev?: boolean;
    onMjAction?: (action: "upscale" | "vary", index: number) => void;
}

export function Lightbox({ image, onClose, onEdit, onRecreate, onDelete, onDownload, onCopyPrompt, onNext, onPrev, hasNext, hasPrev, onMjAction }: LightboxProps) {

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") onNext?.();
            if (e.key === "ArrowLeft") onPrev?.();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, onNext, onPrev]);

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-full h-full flex overflow-hidden" onClick={(e) => e.stopPropagation()}>

                {/* Left: Image Area */}
                <div className="flex-1 relative flex items-center justify-center bg-[#090909] p-8 overflow-hidden group/nav">

                    {/* Navigation Arrows */}
                    {hasPrev && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-black/50 rounded-full h-12 w-12 opacity-0 group-hover/nav:opacity-100 transition-opacity z-40"
                            onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </Button>
                    )}

                    {hasNext && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-black/50 rounded-full h-12 w-12 opacity-0 group-hover/nav:opacity-100 transition-opacity z-40"
                            onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </Button>
                    )}

                    <div
                        className="relative w-full h-full flex items-center justify-center cursor-move"
                        onWheel={(e) => {
                            e.stopPropagation();
                            // Simple zoom on wheel (placeholder logic or prevent default)
                            // Ideally, we'd implement full wheel zoom, for now let's stick to click/drag
                        }}
                    >
                        <InteractiveImage
                            key={image.image}
                            src={image.image || ""}
                            alt={image.prompt || "Generated Image"}
                        />
                    </div>

                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-4 left-4 text-white hover:bg-white/10 rounded-full z-50"
                        onClick={onClose}
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
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => onDownload?.(image.image || "", image.prompt || "", image.bedName)}>
                                <Download className="h-4 w-4" />
                            </Button>
                            {/* Delete Button */}
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => onDelete?.(image)}>
                                <MoreHorizontal className="h-4 w-4 rotate-90" /> {/* Placeholder icon or use Trash */}
                            </Button>
                        </div>

                        {/* Prompt Section */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PROMPT</h3>
                            <p className="text-sm text-gray-200 leading-relaxed max-h-40 overflow-y-auto cursor-pointer hover:bg-white/5 p-2 rounded transition-colors"
                                onClick={() => onCopyPrompt?.(image.prompt || "")}
                                title="Click to copy"
                            >
                                {image.prompt}
                            </p>
                            <button className="text-xs text-blue-400 hover:text-blue-300 font-medium" onClick={() => onCopyPrompt?.(image.prompt || "")}>Copy Prompt</button>
                        </div>

                        {/* Settings Section */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SETTINGS</h3>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 rounded bg-white/5 text-xs text-gray-300 border border-white/5">
                                    {image.size.replace('x', ':')}
                                </span>
                                {image.quality && (
                                    <span className="px-2 py-1 rounded bg-purple-500/10 text-xs text-purple-300 border border-purple-500/20">
                                        {QUALITY_LABELS[image.quality] || image.quality}
                                    </span>
                                )}
                                <span className="px-2 py-1 rounded bg-white/5 text-xs text-gray-300 border border-white/5">
                                    Google Nano Banana Pro
                                </span>
                            </div>
                        </div>

                        {/* Actions List */}
                        <div className="space-y-1 pt-4">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-white/5 h-12"
                                onClick={() => {
                                    onRecreate?.(image);
                                    onClose();
                                }}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Recreate (Use Prompt)
                            </Button>

                            {image.engine === "midjourney" ? (
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">UPSCALE</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[1, 2, 3, 4].map(idx => (
                                                <Button
                                                    key={`u${idx}`}
                                                    variant="outline"
                                                    className="h-10 border-white/10 hover:bg-white/10 hover:text-white text-gray-400"
                                                    onClick={() => onMjAction?.("upscale", idx)}
                                                >
                                                    U{idx}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">VARIATIONS</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[1, 2, 3, 4].map(idx => (
                                                <Button
                                                    key={`v${idx}`}
                                                    variant="outline"
                                                    className="h-10 border-white/10 hover:bg-white/10 hover:text-white text-gray-400"
                                                    onClick={() => onMjAction?.("vary", idx)}
                                                >
                                                    V{idx}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
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
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="mt-auto p-6 border-t border-white/5 bg-[#1a1a1a]">
                        <Button
                            className="w-full bg-white text-black hover:bg-gray-200 font-semibold h-10"
                            onClick={() => {
                                onEdit?.(image);
                                onClose();
                            }}
                        >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Image
                        </Button>
                        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                            <span>100%</span>
                            <span>{image.size.replace('x', '×')} px</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InteractiveImage({ src, alt }: { src: string, alt: string }) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        // Stop propagation to avoid closing lightbox or scrolling parent
        e.stopPropagation();

        // basic zoom
        const delta = -e.deltaY * 0.001;
        setScale((s: number) => Math.min(Math.max(1, s + delta), 5));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        if (scale > 1) {
            setIsDragging(true);
            setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - startPos.x,
            y: e.clientY - startPos.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };



    return (
        <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                draggable={false}
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (scale === 1) {
                        setScale(2); // Zoom in on click
                    } else {
                        setScale(1); // Zoom out
                        setPosition({ x: 0, y: 0 });
                    }
                }}
            />
        </div>
    );
}
