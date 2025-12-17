"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressiveImageProps {
    src: string;
    alt: string;
    className?: string;
}

export function ProgressiveImage({ src, alt, className }: ProgressiveImageProps) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className={cn("relative overflow-hidden bg-black/50", className?.includes("h-") ? "" : "w-full h-full", className)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                className={cn(
                    "w-full h-full transition-all duration-[2000ms] ease-out",
                    isLoading ? "scale-110 blur-xl grayscale opacity-0" : "scale-100 blur-0 grayscale-0 opacity-100",
                    "object-cover" // Default, can be overridden by className via cn if properly ordered, but specific class logic might be needed
                )}
                // Note: If className passes 'object-contain', it might conflict with 'object-cover' here if cn merges simply.
                // In Feed logic: className was `${className || "object-cover"}`.
                // To be safe and support object-contain override:
                style={{ objectFit: className?.includes("object-contain") ? "contain" : "cover" }}
                onLoad={() => setIsLoading(false)}
            />
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full bg-white/5 animate-pulse" />
                </div>
            )}
        </div>
    );
}
