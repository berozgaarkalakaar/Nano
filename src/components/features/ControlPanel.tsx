"use client";

import { useState, useRef, useEffect } from "react";
import {
    Upload,
    X,
    Loader2,
    Sparkles,
    Minus,
    Plus,
    Infinity
} from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";

interface ControlPanelProps {
    onGenerate: (data: {
        prompt: string;
        width: number;
        height: number;
        referenceImages: string[];
        fixedObjects: Record<string, boolean>;
        editImage?: string;
        editInstruction?: string;
        batchSize?: number;
        aspectRatio?: string;
        quality?: string;
        fixedSeed?: boolean;
        engine?: "gemini" | "kie" | "fal";
    }) => Promise<void>;
    isGenerating: boolean;
    isEditMode: boolean;
    setIsEditMode: (value: boolean) => void;
    editImage: string | null;
    setEditImage: (value: string | null) => void;
    engine?: "gemini" | "kie" | "fal";
}

import { Select } from "../ui/select";

const ASPECT_RATIOS = [
    { label: "1:1", ratio: 1 },
    { label: "9:16", ratio: 9 / 16 },
    { label: "16:9", ratio: 16 / 9 },
    { label: "4:5", ratio: 4 / 5 },
    { label: "3:4", ratio: 3 / 4 },
    { label: "4:3", ratio: 4 / 3 },
    { label: "3:2", ratio: 3 / 2 },
];

const QUALITIES = [
    { label: "Base 1K", value: "BASE_1K", base: 1024 },
    { label: "Hi-res 2K", value: "HIRES_2K", base: 2048 },
    { label: "Ultra 4K", value: "ULTRA_4K", base: 4096 },
];

export function ControlPanel({
    onGenerate,
    isGenerating,
    isEditMode,
    setIsEditMode,
    editImage,
    setEditImage
}: ControlPanelProps) {
    const [prompt, setPrompt] = useState("");
    const [aspectRatio, setAspectRatio] = useState("1:1");
    const [quality, setQuality] = useState("BASE_1K");
    const [batchSize, setBatchSize] = useState(1);
    const [referenceImages, setReferenceImages] = useState<string[]>([]);
    const [safeMode, setSafeMode] = useState(true);
    const [fixedSeed, setFixedSeed] = useState(false);
    const [engine, setEngine] = useState<"gemini" | "kie" | "fal">("kie");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const editImageInputRef = useRef<HTMLInputElement>(null);
    const promptInputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (promptInputRef.current) {
            promptInputRef.current.style.height = "auto";
            promptInputRef.current.style.height = promptInputRef.current.scrollHeight + "px";
        }
    }, [prompt, isEditMode]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setReferenceImages(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (!prompt) return;

        // Calculate dimensions
        const selectedRatio = ASPECT_RATIOS.find(r => r.label === aspectRatio) || ASPECT_RATIOS[0];
        const selectedQuality = QUALITIES.find(q => q.value === quality) || QUALITIES[0];
        const base = selectedQuality.base;

        let width, height;
        if (selectedRatio.ratio === 1) {
            width = base;
            height = base;
        } else if (selectedRatio.ratio < 1) {
            // Portrait
            width = Math.round(base * selectedRatio.ratio);
            height = base;
        } else {
            // Landscape
            width = base;
            height = Math.round(base / selectedRatio.ratio);
        }

        if (isEditMode && editImage) {
            onGenerate({
                prompt: "",
                width,
                height,
                referenceImages: [],
                fixedObjects: {},
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                editImage: editImage as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                editInstruction: prompt as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                batchSize: 1 as any, // Edit mode usually 1 at a time
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                fixedSeed: fixedSeed as any,
                engine: engine
            } as any);
        } else {
            onGenerate({
                prompt,
                width,
                height,
                referenceImages,
                fixedObjects: {},
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                batchSize: batchSize as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                aspectRatio: aspectRatio as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                quality: quality as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                fixedSeed: fixedSeed as any,
                engine: engine
            });
        }
    };

    return (
        <div className="w-[400px] flex flex-col h-screen glass-panel border-r-0 border-l border-white/5 overflow-y-auto z-10">
            {/* Top Tabs */}
            <div className="flex items-center p-2 border-b border-white/5">
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn("text-white hover:bg-white/20", !isEditMode && "bg-white/10")}
                    onClick={() => setIsEditMode(false)}
                >
                    Generate
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn("text-muted-foreground hover:text-white", isEditMode && "bg-white/10 text-white")}
                    onClick={() => setIsEditMode(true)}
                >
                    Chat / Edit
                </Button>
            </div>

            <div className="p-4 space-y-6">
                {/* Model Selector */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">ENGINE</Label>
                    <Select
                        value={engine}
                        onChange={(e) => setEngine(e.target.value as "gemini" | "kie" | "fal")}
                        className="w-full premium-input border-white/10 text-white"
                    >
                        <option value="gemini" className="bg-[#1a1a1a] text-white">Gemini (Google)</option>
                        <option value="kie" className="bg-[#1a1a1a] text-white">Nano Banana Pro (Kie.ai)</option>
                        <option value="fal" className="bg-[#1a1a1a] text-white">Nano Banana Pro (Fal.ai)</option>
                    </Select>
                </div>



                {isEditMode ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">IMAGE TO EDIT</Label>
                            <div
                                className="border border-dashed border-white/10 rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => editImageInputRef.current?.click()}
                            >
                                {editImage ? (
                                    <div className="relative w-full aspect-video">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={editImage} alt="Edit Target" className="w-full h-full object-contain" />
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="absolute top-2 right-2 h-6 w-6"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditImage(null);
                                            }}
                                            aria-label="Remove image"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Upload image to edit</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={editImageInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleEditImageChange}
                                    aria-label="Upload image to edit"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">INSTRUCTION</Label>
                            <Textarea
                                ref={promptInputRef}
                                placeholder="e.g. Make it blue, Add a cat..."
                                className="min-h-[60px] max-h-[300px] premium-input border-white/10 text-sm overflow-y-auto"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* References */}
                        <div className="space-y-2 relative">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-muted-foreground">REFERENCES</Label>
                                <Button variant="ghost" size="sm" className="h-6 text-blue-400 hover:text-blue-300 text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
                                    <Plus className="h-3 w-3" /> Add
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    aria-label="Upload reference images"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div
                                    className="border border-dashed border-white/10 rounded-lg p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/5 transition-colors aspect-square"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground">Upload</span>
                                </div>

                                {referenceImages.map((img, i) => (
                                    <div key={i} className="relative rounded-lg overflow-hidden aspect-square group">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img} alt="Ref" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setReferenceImages(prev => prev.filter((_, idx) => idx !== i))}
                                            className="absolute top-1 right-1 bg-black/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Remove image"
                                        >
                                            <X className="h-3 w-3 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Prompt */}
                        <div className="space-y-2 flex-1 flex flex-col">
                            <Label className="text-xs font-semibold text-muted-foreground">PROMPT</Label>
                            <Textarea
                                ref={promptInputRef}
                                placeholder="Describe your image"
                                className="min-h-[60px] max-h-[300px] premium-input border-white/10 text-sm overflow-y-auto"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                        </div>
                    </>
                )}

                {/* Controls Row */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground">ASPECT RATIO</Label>
                        <Select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="w-full premium-input border-white/10 text-white"
                        >
                            {ASPECT_RATIOS.map((ratio) => (
                                <option key={ratio.label} value={ratio.label} className="bg-[#1a1a1a] text-white">
                                    {ratio.label}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground">QUALITY</Label>
                        <Select
                            value={quality}
                            onChange={(e) => setQuality(e.target.value)}
                            className="w-full premium-input border-white/10 text-white"
                        >
                            {QUALITIES.map((q) => (
                                <option key={q.value} value={q.value} className="bg-[#1a1a1a] text-white">
                                    {q.label}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-[#1a1a1a] rounded-lg border border-white/5 p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded hover:bg-white/10"
                                onClick={() => setBatchSize(Math.max(1, batchSize - 1))}
                            >
                                <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-xs font-medium">{batchSize}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded hover:bg-white/10"
                                onClick={() => setBatchSize(Math.min(4, batchSize + 1))}
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>


                    </div>

                    {/* Fixed Seed Toggle */}
                    <div className="bg-[#1a1a1a] rounded-lg p-3 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-white">Fixed seed</Label>
                            <div
                                className={cn(
                                    "w-8 h-4 rounded-full relative cursor-pointer transition-colors",
                                    fixedSeed ? "bg-white" : "bg-white/20"
                                )}
                                onClick={() => setFixedSeed(!fixedSeed)}
                            >
                                <div className={cn(
                                    "absolute top-0.5 w-3 h-3 rounded-full bg-black transition-all",
                                    fixedSeed ? "left-4.5" : "left-0.5"
                                )} />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                            Enable this to get consistent results every time you use the same prompt.
                        </p>
                    </div>
                </div>

                <Button
                    className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white h-12 text-base font-bold shadow-lg shadow-purple-500/20 transition-all duration-300 transform hover:scale-[1.02]"
                    onClick={handleSubmit}
                    disabled={isGenerating || !prompt || (isEditMode && !editImage)}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {isEditMode ? "Edit Image" : "Generate"}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
