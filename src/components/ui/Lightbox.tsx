"use client";

import { Share2, Download, MoreHorizontal, RefreshCw, Maximize2, Video, Wand2, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";
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
    onDownload?: (imageUrl: string, prompt: string) => void;
    onCopyPrompt?: (prompt: string) => void;
}

export function Lightbox({ image, onClose, onEdit, onDownload, onCopyPrompt }: LightboxProps) {
    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-full h-full flex overflow-hidden" onClick={(e) => e.stopPropagation()}>

                {/* Left: Image Area */}
                <div className="flex-1 relative flex items-center justify-center bg-[#090909] p-8">
                    <ProgressiveImage
                        src={image.image || ""}
                        alt={image.prompt || "Generated Image"}
                        className="max-w-full max-h-full object-contain shadow-2xl"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-4 left-4 text-white hover:bg-white/10 rounded-full"
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
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => onDownload?.(image.image || "", image.prompt || "")}>
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
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
