"use client";

import { useState, useRef } from "react";
import {
    Upload,
    X,
    Loader2,
    Sparkles,
    User,
    Box,
    Palette,
    Camera,
    Wand2,
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
    }) => Promise<void>;
    isGenerating: boolean;
    isEditMode: boolean;
    setIsEditMode: (value: boolean) => void;
    editImage: string | null;
    setEditImage: (value: string | null) => void;
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

const RESOLUTIONS = [
    { label: "1K", base: 1024 },
    { label: "2K", base: 2048 },
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
    const [resolution, setResolution] = useState("1K");
    const [referenceImages, setReferenceImages] = useState<string[]>([]);
    const [safeMode, setSafeMode] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const editImageInputRef = useRef<HTMLInputElement>(null);

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
        const selectedRes = RESOLUTIONS.find(r => r.label === resolution) || RESOLUTIONS[0];
        const base = selectedRes.base;

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
                editInstruction: prompt as any
            } as any);
        } else {
            onGenerate({
                prompt,
                width,
                height,
                referenceImages,
                fixedObjects: {}
            });
        }
    };

    return (
        <div className="w-[400px] flex flex-col h-screen border-r border-white/5 bg-[#0f0f0f] overflow-y-auto">
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
                    <Label className="text-xs font-semibold text-muted-foreground">MODEL</Label>
                    <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/10 p-1 rounded">
                                <span className="font-bold text-white text-xs">G</span>
                            </div>
                            <span className="text-sm font-medium text-white">Google Nano Banana Pro</span>
                        </div>
                    </div>
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
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">INSTRUCTION</Label>
                            <Textarea
                                placeholder="e.g. Make it blue, Add a cat..."
                                className="min-h-[100px] bg-[#1a1a1a] border-white/5 resize-none text-sm"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* References */}
                        <div className="space-y-2">
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
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <ReferenceCard icon={User} label="Character" />
                                <ReferenceCard icon={Box} label="Object" />
                                <ReferenceCard icon={Palette} label="Color" />
                                <ReferenceCard icon={Camera} label="Camera" />
                                <ReferenceCard icon={Wand2} label="Effects" />
                                <ReferenceCard icon={Sparkles} label="Style" />

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
                                placeholder="Describe your image"
                                className="min-h-[120px] bg-[#1a1a1a] border-white/5 resize-none text-sm"
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
                            className="w-full bg-[#1a1a1a] border-white/5 text-white"
                        >
                            {ASPECT_RATIOS.map((ratio) => (
                                <option key={ratio.label} value={ratio.label} className="bg-[#1a1a1a] text-white">
                                    {ratio.label}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground">RESOLUTION</Label>
                        <Select
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            className="w-full bg-[#1a1a1a] border-white/5 text-white"
                        >
                            {RESOLUTIONS.map((res) => (
                                <option key={res.label} value={res.label} className="bg-[#1a1a1a] text-white">
                                    {res.label}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-[#1a1a1a] rounded-lg border border-white/5 p-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-white/10">
                                <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-xs font-medium">1</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-white/10">
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>

                        <div
                            className={cn(
                                "flex items-center rounded-lg border px-2 py-1 gap-2 cursor-pointer ml-auto",
                                safeMode ? "bg-[#1a1a1a] border-white/5 text-green-500" : "bg-red-900/20 border-red-900/50 text-red-500"
                            )}
                            onClick={() => setSafeMode(!safeMode)}
                        >
                            <Infinity className="h-4 w-4" />
                            <span className="text-xs font-bold">{safeMode ? "ON" : "OFF"}</span>
                        </div>
                    </div>
                </div>

                <Button
                    className="w-full bg-white text-black hover:bg-gray-200 h-12 text-base font-semibold"
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

function ReferenceCard({ icon: Icon, label }: { icon: React.ElementType, label: string }) {
    return (
        <div className="border border-dashed border-white/10 rounded-lg p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/5 transition-colors aspect-square">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
    );
}
