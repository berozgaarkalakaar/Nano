"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ControlPanel } from "@/components/features/ControlPanel";
import { Feed } from "@/components/features/Feed";
import { Generation } from "@/types";
import { AssistantModal } from "@/components/features/AssistantModal";

function HomeContent() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editImage, setEditImage] = useState<string | null>(null);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const editImgObj = searchParams.get("editImage");
    const promptObj = searchParams.get("prompt");

    if (editImgObj) {
      setEditImage(editImgObj);
      setIsEditMode(true);
    }
    if (promptObj) {
      setInitialPrompt(promptObj);
    }
  }, [searchParams]);

  // Queue System
  const [activeRequests, setActiveRequests] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    engine?: "gemini" | "kie" | "fal";
    aspectRatio?: string;
    quality?: string;
    fixedSeed?: boolean;
    seed?: number;
  }) => {
    const count = data.batchSize || 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        if (data.generations) {
          setGenerations((prev) => {
            const pending = prev.filter(g => g.status === 'pending');
            const history = data.generations.map((g: Generation) => ({
              ...g,
              size: g.size || "1024x1024"
            }));
            return [...pending, ...history];
          });
        }
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  return (
    <main className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <Sidebar onAssistantClick={() => setIsAssistantOpen(true)} onShowHistory={loadHistory} />
      <ControlPanel
        onGenerate={handleGenerate}
        isGenerating={false} // Never block UI now
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        editImage={editImage}
        setEditImage={setEditImage}
        initialPrompt={initialPrompt}
      />
      <Feed generations={generations} onEdit={handleEdit} onShowHistory={loadHistory} isGenerating={activeRequests > 0} />
      <AssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black text-white">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
