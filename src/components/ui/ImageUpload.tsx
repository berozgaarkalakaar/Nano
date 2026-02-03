import React, { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { Label } from './label';

interface ImageUploadProps {
    value?: string | null;
    onChange?: (value: string | null) => void;
    onUpload?: (files: File[]) => void;
    label?: string;
    multiple?: boolean;
    className?: string;
    placeholder?: string;
    isLoading?: boolean;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    children?: React.ReactNode;
}

export function ImageUpload({
    value,
    onChange,
    onUpload,
    label,
    multiple = false,
    className,
    placeholder = "Upload Image",
    isLoading = false,
    onClick,
    children
}: ImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileProcess = (files: FileList | File[]) => {
        if (!files || files.length === 0) return;

        const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (validFiles.length === 0) return;

        if (multiple && onUpload) {
            onUpload(validFiles);
        } else if (onChange && validFiles.length > 0) {
            // For single file, just read the first one
            const file = validFiles[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileProcess(e.dataTransfer.files);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        if (e.clipboardData.files && e.clipboardData.files.length > 0) {
            e.preventDefault();
            handleFileProcess(e.clipboardData.files);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFileProcess(e.target.files);
        }
    };

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!value) {
            inputRef.current?.click();
        } else if (onClick) {
            onClick(e);
        }
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {label && <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>}
            <div
                ref={containerRef}
                tabIndex={0}
                className={cn(
                    "border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center relative overflow-hidden transition-colors outline-none focus:ring-1 focus:ring-blue-500/50 flex-1 min-h-0",
                    !value && "cursor-pointer hover:bg-white/5",
                    value && "border-solid border-blue-500/50",
                    isDragging && "bg-white/10 border-blue-500",
                    !className?.includes("h-") && "h-32"
                )}
                onClick={handleContainerClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                        <span className="text-xs">Processing...</span>
                    </div>
                ) : value ? (
                    <div className="relative w-full h-full group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={value} alt="Preview" className="w-full h-full object-contain pointer-events-none select-none" />

                        {onChange && (
                            <Button
                                size="icon"
                                variant="destructive"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(null);
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                        {children}
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
                        <Upload className="h-6 w-6 mb-2 opacity-50" />
                        <span className="text-xs font-medium">{placeholder}</span>
                        <span className="text-[10px] text-muted-foreground/70 mt-1">Drag & drop or Paste (Cmd+V)</span>
                    </div>
                )}

                <input
                    type="file"
                    ref={inputRef}
                    className="hidden"
                    accept="image/*"
                    multiple={multiple}
                    onChange={handleChange}
                />
            </div>
        </div>
    );
}
