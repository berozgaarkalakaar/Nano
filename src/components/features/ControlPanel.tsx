"use client";

import { useState, useRef, useEffect } from "react";
import {
    Upload,
    X,
    Loader2,
    Sparkles,
    Minus,
    Plus,

    Camera,
    MousePointer,
    Type,
    RotateCw,
    Maximize,
    MoveVertical
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
    initialPrompt?: string;
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
    setEditImage,
    initialPrompt
}: ControlPanelProps) {
    const [prompt, setPrompt] = useState(initialPrompt || "");
    const [aspectRatio, setAspectRatio] = useState("4:5");
    const [quality, setQuality] = useState("BASE_1K");
    const [batchSize, setBatchSize] = useState(1);
    const [referenceImages, setReferenceImages] = useState<string[]>([]);

    const [fixedSeed, setFixedSeed] = useState(false);
    const [engine, setEngine] = useState<"gemini" | "kie" | "fal">("kie");

    const [activeTab, setActiveTab] = useState<"prompt" | "visual" | "camera">("prompt");
    const [annotations, setAnnotations] = useState<{ x: number; y: number; text: string }[]>([]);
    const [camera, setCamera] = useState({ rotate: 0, vertical: 0, closeup: 0 });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const editImageInputRef = useRef<HTMLInputElement>(null);
    const promptInputRef = useRef<HTMLTextAreaElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (promptInputRef.current) {
            // ... existing code ...
        }
    }, [prompt, isEditMode, activeTab]);

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (activeTab !== "visual" || !editImage || !imageContainerRef.current) return;

        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const text = window.prompt("Enter annotation:");
        if (text) {
            setAnnotations(prev => [...prev, { x, y, text }]);
        }
    };

    useEffect(() => {
        if (promptInputRef.current) {
            promptInputRef.current.style.height = "auto";
            promptInputRef.current.style.height = promptInputRef.current.scrollHeight + "px";
        }
    }, [prompt, isEditMode]);

    // Clear annotations when editImage changes
    useEffect(() => {
        setAnnotations([]);
    }, [editImage]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleEditImageDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onloadend = () => {
                setEditImage(reader.result as string);
                // Annotations are cleared by the useEffect
            };
            reader.readAsDataURL(file);
        }
    };

    const handleReferenceImageDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files) {
            const files = Array.from(e.dataTransfer.files);
            files.forEach(file => {
                if (!file.type.startsWith('image/')) return;
                const reader = new FileReader();
                reader.onloadend = () => {
                    setReferenceImages(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

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

    useEffect(() => {
        if (initialPrompt) {
            setPrompt(initialPrompt);
        }
    }, [initialPrompt]);

    // Keyboard Shortcut: Cmd/Ctrl + Enter to Generate
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prompt, isEditMode, editImage, annotations, camera, aspectRatio, quality, batchSize, referenceImages, fixedSeed, engine]);

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
            // Construct visual edits prompt
            let augmentedPrompt = "";

            // Add annotations
            if (annotations.length > 0) {
                const notes = annotations.map(a => {
                    let pos = "";
                    if (a.y < 33) pos += "Top"; else if (a.y > 66) pos += "Bottom"; else pos += "Center";
                    if (a.x < 33) pos += " Left"; else if (a.x > 66) pos += " Right";
                    return `${pos.trim()}: ${a.text}`;
                }).join(", ");
                augmentedPrompt += ` Annotations: ${notes}.`;
            }

            // Add camera
            if (camera.rotate !== 0 || camera.vertical !== 0 || camera.closeup > 0) {
                augmentedPrompt += ` Camera details: ${camera.rotate} deg rotation, ${camera.vertical} deg vertical angle, ${camera.closeup}% closeup.`;
            }

            console.log("Augmented Instruction:", augmentedPrompt);

            onGenerate({
                prompt: prompt,
                width,
                height,
                referenceImages: referenceImages,
                fixedObjects: {},
                editImage: editImage,
                editInstruction: augmentedPrompt.trim(),
                batchSize: 1,
                fixedSeed: fixedSeed,
                engine: engine
            });
        } else {
            onGenerate({
                prompt,
                width,
                height,
                referenceImages,
                fixedObjects: {},
                batchSize: batchSize,
                aspectRatio: aspectRatio,
                quality: quality,
                fixedSeed: fixedSeed,
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
                        {/* Edit Mode Tabs */}
                        <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-white/5">
                            <button
                                onClick={() => setActiveTab("prompt")}
                                className={cn("flex-1 text-xs py-1.5 rounded transition-all", activeTab === "prompt" ? "bg-white/10 text-white font-medium" : "text-muted-foreground hover:text-white")}
                            >
                                <Type className="h-3 w-3 inline mr-1" />
                                Prompt
                            </button>
                            <button
                                onClick={() => setActiveTab("visual")}
                                className={cn("flex-1 text-xs py-1.5 rounded transition-all", activeTab === "visual" ? "bg-white/10 text-white font-medium" : "text-muted-foreground hover:text-white")}
                            >
                                <MousePointer className="h-3 w-3 inline mr-1" />
                                Visual
                            </button>
                            <button
                                onClick={() => setActiveTab("camera")}
                                className={cn("flex-1 text-xs py-1.5 rounded transition-all", activeTab === "camera" ? "bg-white/10 text-white font-medium" : "text-muted-foreground hover:text-white")}
                            >
                                <Camera className="h-3 w-3 inline mr-1" />
                                Camera
                            </button>
                        </div>

                        {/* Image Preview (Always visible in Edit Mode, but interactive in Visual) */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">IMAGE</Label>
                            <div
                                ref={imageContainerRef}
                                className={cn(
                                    "border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center relative overflow-hidden transition-colors",
                                    !editImage && "p-8 cursor-pointer hover:bg-white/5",
                                    editImage && activeTab === "visual" && "cursor-crosshair ring-1 ring-blue-500/50"
                                )}
                                onClick={!editImage ? () => editImageInputRef.current?.click() : handleImageClick}
                                onDragOver={handleDragOver}
                                onDrop={handleEditImageDrop}
                            >
                                {editImage ? (
                                    <div className="relative w-full aspect-video bg-black/50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={editImage} alt="Edit Target" className="w-full h-full object-contain pointer-events-none select-none" />

                                        {/* Remove Button */}
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="absolute top-2 right-2 h-6 w-6 z-10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditImage(null);
                                                setAnnotations([]);
                                            }}
                                            aria-label="Remove image"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>

                                        {/* Annotations Overlay */}
                                        {annotations.map((a, i) => (
                                            <div
                                                key={i}
                                                className="absolute w-4 h-4 -ml-2 -mt-2 bg-blue-500 rounded-full border border-white shadow-lg flex items-center justify-center text-[8px] font-bold text-white z-0 group"
                                                style={{ left: `${a.x}%`, top: `${a.y}%` }}
                                            >
                                                {i + 1}
                                                {/* Tooltip */}
                                                <div className="absolute top-full text-[10px] mt-1 bg-black/80 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {a.text}
                                                </div>
                                            </div>
                                        ))}
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

                        {/* Tab Content */}
                        {activeTab === "prompt" && (
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
                        )}

                        {activeTab === "visual" && (
                            <div className="bg-[#1a1a1a] rounded-lg p-3 text-[10px] text-muted-foreground border border-white/5">
                                <p>Click on the image above to add an annotation (e.g. &quot;Change this&quot;). These will be added to your prompt.</p>
                                <div className="mt-2 space-y-1">
                                    {annotations.map((a, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="bg-blue-500 text-white w-3 h-3 rounded-full flex items-center justify-center text-[8px]">{i + 1}</span>
                                            <span className="text-white">{a.text}</span>
                                            <button onClick={() => setAnnotations(prev => prev.filter((_, idx) => idx !== i))} className="ml-auto text-red-400 hover:text-red-300">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "camera" && (
                            <div className="space-y-4 bg-[#1a1a1a] p-3 rounded-lg border border-white/5">
                                {/* Rotate */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><RotateCw className="h-3 w-3" /> Rotate</span>
                                        <span className="text-white">{camera.rotate}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-45"
                                        max="45"
                                        value={camera.rotate}
                                        onChange={(e) => setCamera(prev => ({ ...prev, rotate: parseInt(e.target.value) }))}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                {/* Vertical */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><MoveVertical className="h-3 w-3" /> Vertical</span>
                                        <span className="text-white">{camera.vertical}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-90"
                                        max="90"
                                        value={camera.vertical}
                                        onChange={(e) => setCamera(prev => ({ ...prev, vertical: parseInt(e.target.value) }))}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                {/* Closeup */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Maximize className="h-3 w-3" /> Closeup</span>
                                        <span className="text-white">{camera.closeup}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={camera.closeup}
                                        onChange={(e) => setCamera(prev => ({ ...prev, closeup: parseInt(e.target.value) }))}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}

                        {/* References (Edit Mode) */}
                        <div className="space-y-2 relative">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-muted-foreground">REFERENCES</Label>
                                <Button variant="ghost" size="sm" className="h-6 text-blue-400 hover:text-blue-300 text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
                                    <Plus className="h-3 w-3" /> Add
                                </Button>
                            </div>

                            <div className="grid grid-cols-3 gap-2"
                                onDragOver={handleDragOver}
                                onDrop={handleReferenceImageDrop}
                            >
                                {referenceImages.map((img, i) => (
                                    <div
                                        key={i}
                                        className="relative rounded-lg overflow-hidden aspect-square group cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all"
                                        // onClick={() => setPrompt(prev => prev + (prev.length > 0 && !prev.endsWith(" ") ? " " : "") + `@img${i + 1}`)}
                                        title="Reference Image"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img} alt="Ref" className="w-full h-full object-cover" />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent adding tag when deleting
                                                setReferenceImages(prev => prev.filter((_, idx) => idx !== i));
                                            }}
                                            className="absolute top-1 right-1 bg-black/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                                            aria-label="Remove image"
                                        >
                                            <X className="h-3 w-3 text-white" />
                                        </button>
                                    </div>
                                ))}
                                <div
                                    className="border border-dashed border-white/10 rounded-lg p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/5 transition-colors aspect-square"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
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
                            </div>

                            <div className="grid grid-cols-3 gap-2"
                                onDragOver={handleDragOver}
                                onDrop={handleReferenceImageDrop}
                            >
                                <div
                                    className="border border-dashed border-white/10 rounded-lg p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/5 transition-colors aspect-square"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground">Upload</span>
                                </div>

                                {referenceImages.map((img, i) => (
                                    <div
                                        key={i}
                                        className="relative rounded-lg overflow-hidden aspect-square group cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all"
                                        onClick={() => setPrompt(prev => prev + (prev.length > 0 && !prev.endsWith(" ") ? " " : "") + `@img${i + 1}`)}
                                        title="Click to add tag to prompt"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img} alt="Ref" className="w-full h-full object-cover" />
                                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none">
                                            @img{i + 1}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent adding tag when deleting
                                                setReferenceImages(prev => prev.filter((_, idx) => idx !== i));
                                            }}
                                            className="absolute top-1 right-1 bg-black/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
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
                                    fixedSeed ? "left-[18px]" : "left-0.5"
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

                {/* Hidden File Input for References - Always Rendered */}
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
        </div>
    );
}
