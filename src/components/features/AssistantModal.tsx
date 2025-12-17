"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, X, Paperclip, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    images?: string[];
    timestamp: Date;
}

interface AssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AssistantModal({ isOpen, onClose }: AssistantModalProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hello! I'm your creative assistant. I can help you brainstorm ideas, refine prompts, or generate images directly. What would you like to create today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [attachedImages, setAttachedImages] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const urls = files.map(file => URL.createObjectURL(file));
            setAttachedImages(prev => [...prev, ...urls]);
        }
    };

    const handleSend = async () => {
        if (!input.trim() && attachedImages.length === 0) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            images: attachedImages,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setAttachedImages([]);
        setIsTyping(true);

        // Dummy response simulation
        setTimeout(() => {
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "I'm meant to help you, but I'm currently a mock implementation. Please connect me to a real backend!",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!mounted || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[800px] h-[600px] bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="h-14 border-b border-white/5 flex items-center px-6 bg-[#1a1a1a] justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold text-white">AI Assistant</span>
                        <span className="text-xs text-muted-foreground ml-2 border-l border-white/10 pl-2">
                            Powered by Gemini 3.0 Pro
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0f0f0f]">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-4 max-w-[85%]",
                                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border",
                                msg.role === "assistant"
                                    ? "bg-orange-600/20 border-orange-600/30"
                                    : "bg-blue-600/20 border-blue-600/30"
                            )}>
                                {msg.role === "assistant" ? (
                                    <Bot className="h-4 w-4 text-orange-500" />
                                ) : (
                                    <User className="h-4 w-4 text-blue-500" />
                                )}
                            </div>

                            <div className="space-y-2">
                                <div
                                    className={cn(
                                        "rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm",
                                        msg.role === "user"
                                            ? "bg-blue-600 text-white rounded-tr-sm"
                                            : "bg-[#1a1a1a] text-gray-200 border border-white/5 rounded-tl-sm"
                                    )}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                {msg.images && msg.images.length > 0 && (
                                    <div className="flex gap-2 flex-wrap justify-end">
                                        {msg.images.map((img, idx) => (
                                            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={img} alt="Uploaded" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <span className={cn(
                                    "text-[10px] opacity-50 block mt-1",
                                    msg.role === "user" ? "text-right" : "text-left"
                                )}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-4 mr-auto">
                            <div className="w-8 h-8 rounded-full bg-orange-600/20 flex items-center justify-center border border-orange-600/30 flex-shrink-0">
                                <Bot className="h-4 w-4 text-orange-500" />
                            </div>
                            <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-[#1a1a1a] border-t border-white/5 flex-shrink-0">
                    {attachedImages.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                            {attachedImages.map((img, i) => (
                                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group flex-shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setAttachedImages(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute top-0.5 right-0.5 bg-black/60 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label="Remove image"
                                    >
                                        <X className="h-3 w-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="relative flex items-end gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 flex-shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="Attach image"
                        >
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            aria-label="Upload image"
                        />

                        <div className="relative flex-1">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message AI Assistant..."
                                className="min-h-[40px] max-h-[120px] py-2.5 bg-[#0f0f0f] border-white/10 resize-none rounded-xl focus-visible:ring-orange-500/50"
                            />
                        </div>

                        <Button
                            size="icon"
                            className="h-10 w-10 bg-orange-600 hover:bg-orange-700 text-white rounded-xl flex-shrink-0"
                            onClick={handleSend}
                            disabled={(!input.trim() && attachedImages.length === 0) || isTyping}
                        >
                            {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
