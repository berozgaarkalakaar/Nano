/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Settings2, Image as ImageIcon, X, Loader2, Sparkles, Lock, Unlock } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { cn } from "../ui/button"; // Re-using cn

interface Generation {
    id: number;
    image: string;
    prompt: string;
    style: string;
}

const SIZE_PRESETS = [
    { label: "Square (1:1)", width: 1024, height: 1024, desc: "Standard" },
    { label: "Square HD (1:1)", width: 1536, height: 1536, desc: "HD" },
    { label: "Square 2K (1:1)", width: 2048, height: 2048, desc: "2K" },
    { label: "Story (9:16)", width: 1080, height: 1920, desc: "Stories/Reels" },
    { label: "Landscape (16:9)", width: 1920, height: 1080, desc: "Video" },
    { label: "Portrait (4:5)", width: 1080, height: 1350, desc: "Social" },
    { label: "Poster (4:5)", width: 1200, height: 1500, desc: "Print" },
    { label: "Landscape (5:4)", width: 1500, height: 1200, desc: "Print" },
    { label: "Classic (4:3)", width: 1350, height: 1080, desc: "General" },
    // Interpreting the conflicting user requests as high-res variants
    { label: "High Res (4:5)", width: 1638, height: 2048, desc: "2K" },
    { label: "High Res (9:16)", width: 1152, height: 2048, desc: "2K" },
];

const STYLES = [
    "None", "Photo", "Flat Illustration", "3D Render", "Line Art",
    "Vector Icon", "Poster", "UI Background", "Logo Concept",
    "Cinematic", "Anime", "Digital Art", "Oil Painting"
];

export function PromptGenerator() {
    const [prompt, setPrompt] = useState("");
    const [style, setStyle] = useState("None");
    const [selectedSize, setSelectedSize] = useState(0); // Index of preset
    const [customSize, setCustomSize] = useState({ width: 1024, height: 1024 });
    const [isCustomSize, setIsCustomSize] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [referenceImages, setReferenceImages] = useState<string[]>([]); // Base64 strings
    const [baseImageIndex, setBaseImageIndex] = useState<number | null>(null);
    const [fixedObjects, setFixedObjects] = useState({
        logo: false,
        product: false,
        character: false,
        background: false
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [safeMode, setSafeMode] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const removeImage = (index: number) => {
        setReferenceImages(prev => prev.filter((_, i) => i !== index));
        if (baseImageIndex === index) setBaseImageIndex(null);
        if (baseImageIndex !== null && baseImageIndex > index) setBaseImageIndex(baseImageIndex - 1);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    style,
                    width: isCustomSize ? customSize.width : SIZE_PRESETS[selectedSize].width,
                    height: isCustomSize ? customSize.height : SIZE_PRESETS[selectedSize].height,
                    referenceImages,
                    baseImageIndex,
                    fixedObjects,
                    safeMode
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Generation failed");
            }

            setGenerations(prev => [{
                id: Date.now(),
                image: data.image,
                prompt,
                style
            }, ...prev]);
        } catch (error) {
            console.error(error);
            alert("Failed to generate image. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Main Input Section */}
            <div className="space-y-6">
                <div className="relative">
                    <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your imagination in detail..."
                        className="min-h-[160px] text-lg p-6 resize-none shadow-lg border-primary/20 focus:border-primary/50 transition-all rounded-xl"
                    />
                    <div className="absolute bottom-4 right-4 flex gap-4 items-center">
                        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50">
                            <Label htmlFor="safe-mode" className="text-xs cursor-pointer select-none">Safe Mode</Label>
                            <input
                                id="safe-mode"
                                type="checkbox"
                                checked={safeMode}
                                onChange={(e) => setSafeMode(e.target.checked)}
                                className="accent-primary h-4 w-4"
                            />
                        </div>
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-purple-500/25 rounded-full px-8"
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Quick Controls */}
                <div className="flex flex-wrap gap-4 items-center justify-between bg-card/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Style</Label>
                            <Select
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                                className="w-[180px] bg-background/50"
                            >
                                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Size</Label>
                            <Select
                                value={isCustomSize ? "custom" : selectedSize}
                                onChange={(e) => {
                                    if (e.target.value === "custom") setIsCustomSize(true);
                                    else {
                                        setIsCustomSize(false);
                                        setSelectedSize(Number(e.target.value));
                                    }
                                }}
                                className="w-[220px] bg-background/50"
                            >
                                {SIZE_PRESETS.map((preset, i) => (
                                    <option key={i} value={i}>
                                        {preset.label} ({preset.width}x{preset.height})
                                    </option>
                                ))}
                                <option value="custom">Custom Size...</option>
                            </Select>
                        </div>

                        {isCustomSize && (
                            <div className="flex gap-2 items-end animate-in fade-in slide-in-from-left-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">W</Label>
                                    <Input
                                        type="number"
                                        value={customSize.width}
                                        onChange={(e) => setCustomSize(prev => ({ ...prev, width: Number(e.target.value) }))}
                                        className="w-20 h-10"
                                        max={2048}
                                    />
                                </div>
                                <span className="pb-3 text-muted-foreground">x</span>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">H</Label>
                                    <Input
                                        type="number"
                                        value={customSize.height}
                                        onChange={(e) => setCustomSize(prev => ({ ...prev, height: Number(e.target.value) }))}
                                        className="w-20 h-10"
                                        max={2048}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={cn("gap-2", showAdvanced && "bg-accent text-accent-foreground")}
                    >
                        <Settings2 className="h-4 w-4" />
                        Advanced
                    </Button>
                </div>
            </div>

            {/* Advanced Panel */}
            <AnimatePresence>
                {showAdvanced && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="border-dashed border-2 bg-card/30">
                            <div className="p-6 space-y-6">
                                {/* Reference Images */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4" /> Reference Images
                                        </Label>
                                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                            <Upload className="h-4 w-4 mr-2" /> Upload
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

                                    {referenceImages.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {referenceImages.map((img, idx) => (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "relative group rounded-lg overflow-hidden border-2 transition-all aspect-square",
                                                        baseImageIndex === idx ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/50"
                                                    )}
                                                >
                                                    <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => removeImage(idx)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant={baseImageIndex === idx ? "default" : "secondary"}
                                                            size="sm"
                                                            className="text-xs h-7"
                                                            onClick={() => setBaseImageIndex(baseImageIndex === idx ? null : idx)}
                                                        >
                                                            {baseImageIndex === idx ? "Base Image" : "Set as Base"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                            No reference images uploaded
                                        </div>
                                    )}
                                </div>

                                {/* Fixed Objects (Only if base image selected) */}
                                {baseImageIndex !== null && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <Label className="text-base font-semibold flex items-center gap-2">
                                            <Lock className="h-4 w-4" /> Fixed Objects
                                            <span className="text-xs font-normal text-muted-foreground ml-2">
                                                Keep these elements unchanged from the base image
                                            </span>
                                        </Label>
                                        <div className="flex flex-wrap gap-4">
                                            {Object.entries(fixedObjects).map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    onClick={() => setFixedObjects(prev => ({ ...prev, [key]: !value }))}
                                                    className={cn(
                                                        "flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-all select-none",
                                                        value ? "bg-primary/10 border-primary text-primary" : "bg-background border-border hover:border-primary/50"
                                                    )}
                                                >
                                                    {value ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                                                    <span className="capitalize">{key}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Gallery Section */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Recent Generations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generations.map((gen) => (
                        <Card key={gen.id} className="overflow-hidden group">
                            <div className="aspect-square relative bg-muted">
                                <img src={gen.image} alt={gen.prompt} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                    <p className="text-white text-sm line-clamp-2">{gen.prompt}</p>
                                    <div className="flex gap-2 mt-2">
                                        <Button size="sm" variant="secondary" className="w-full">Download</Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {generations.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            Start creating to see your masterpieces here.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
