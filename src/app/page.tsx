"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ControlPanel } from "@/components/features/ControlPanel";
import { Feed } from "@/components/features/Feed";
import { Generation } from "@/types";
import { AssistantModal } from "@/components/features/AssistantModal";

export default function Home() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editImage, setEditImage] = useState<string | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Queue System
  const [activeRequests, setActiveRequests] = useState(0);
  const [queue, setQueue] = useState<{ id: number; data: any }[]>([]);

  useEffect(() => {
    const processQueue = async () => {
      if (activeRequests >= 2 || queue.length === 0) return;

      const nextTask = queue[0];
      setQueue((prev) => prev.slice(1));
      setActiveRequests((prev) => prev + 1);

      const endpoint = "/api/generate";
      const { id, data } = nextTask;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok && (result.success || result.imageUrl)) {
          const finalImageUrl = result.image || result.imageUrl;

          // Detect actual image dimensions
          const img = new Image();
          img.src = finalImageUrl;
          await new Promise((resolve) => {
            img.onload = () => resolve(null);
            img.onerror = () => resolve(null);
          });

          setGenerations((prev) =>
            prev.map((g) =>
              g.id === id
                ? {
                  ...g,
                  status: "completed",
                  image: finalImageUrl,
                  size: `${img.naturalWidth || 0}x${img.naturalHeight || 0}`,
                }
                : g
            )
          );
        } else {
          setGenerations((prev) => prev.map(g => g.id === id ? { ...g, status: "failed" } : g));
          console.error("Generation failed:", result.error);
        }
      } catch (error) {
        setGenerations((prev) => prev.map(g => g.id === id ? { ...g, status: "failed" } : g));
        console.error("Error generating:", error);
      } finally {
        setActiveRequests((prev) => prev - 1);
      }
    };

    processQueue();
  }, [queue, activeRequests]);

  const handleEdit = (gen: Generation) => {
    if (gen.image) {
      setEditImage(gen.image);
      setIsEditMode(true);
    }
  };

  const handleGenerate = async (data: {
    prompt: string;
    width: number;
    height: number;
    referenceImages: string[];
    fixedObjects: Record<string, boolean>;
    style?: string;
    editImage?: string;
    editInstruction?: string;
    batchSize?: number;
    engine?: "gemini" | "kie";
    aspectRatio?: string;
    quality?: string;
  }) => {
    const count = data.batchSize || 1;
    const newTasks: { id: number; data: any }[] = [];
    const newGenerations: Generation[] = [];

    for (let i = 0; i < count; i++) {
      const id = Date.now() + i + Math.random(); // Ensure unique ID

      newGenerations.push({
        id,
        status: "pending",
        image: "", // Placeholder
        prompt: data.prompt || data.editInstruction || "Generated Image",
        style: data.engine === "kie" ? "Nano Banana Pro" : (data.style || "None"),
        size: "Thinking...",
        created_at: new Date().toISOString()
      });

      newTasks.push({ id, data });
    }

    setGenerations((prev) => [...newGenerations, ...prev]);
    setQueue((prev) => [...prev, ...newTasks]);
  };

  return (
    <main className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <Sidebar onAssistantClick={() => setIsAssistantOpen(true)} />
      <ControlPanel
        onGenerate={handleGenerate}
        isGenerating={false} // Never block UI now
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        editImage={editImage}
        setEditImage={setEditImage}
      />
      <Feed generations={generations} onEdit={handleEdit} isGenerating={activeRequests > 0} />
      <AssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </main>
  );
}
