"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ControlPanel } from "@/components/features/ControlPanel";
import { Feed } from "@/components/features/Feed";

interface Generation {
  id: number;
  image: string;
  prompt: string;
  style: string;
  size: string;
  created_at?: string;
}

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editImage, setEditImage] = useState<string | null>(null);

  const handleEdit = (gen: Generation) => {
    setEditImage(gen.image);
    setIsEditMode(true);
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
  }) => {
    setIsGenerating(true);
    try {
      const count = data.batchSize || 1;
      const promises = [];

      for (let i = 0; i < count; i++) {
        promises.push(
          fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }).then(async (response) => {
            const result = await response.json();
            if (result.success) {
              // Detect actual image dimensions
              const img = new Image();
              img.src = result.image;
              await new Promise((resolve) => {
                img.onload = () => resolve(null);
              });

              const newGen: Generation = {
                id: Date.now() + i, // Ensure unique ID
                image: result.image,
                prompt: data.prompt || data.editInstruction || "Generated Image",
                style: data.style || "None",
                size: `${img.naturalWidth}x${img.naturalHeight}`, // Use ACTUAL dimensions
                created_at: new Date().toISOString()
              };
              setGenerations((prev) => [newGen, ...prev]);
            } else {
              console.error("Generation failed:", result.error);
            }
          })
        );
      }

      await Promise.all(promises);

    } catch (error) {
      console.error("Error generating:", error);
      alert("Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <Sidebar />
      <ControlPanel
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        editImage={editImage}
        setEditImage={setEditImage}
      />
      <Feed generations={generations} onEdit={handleEdit} />
    </main>
  );
}
