import { generateBaseImageWithGemini } from "./gemini";

export interface UpscaledImageResult {
    image: string;
    width: number;
    height: number;
}

export async function upscaleImage(image: string, mode: "HIRES_2X" | "ULTRA_4X"): Promise<UpscaledImageResult> {
    console.log(`Upscaling image with mode: ${mode}`);

    // Determine target resolution description for the prompt
    // Since we are using Gemini, we can't force exact pixels, but we can guide it.
    const resolutionPrompt = mode === "ULTRA_4X" ? "4K Ultra HD, highly detailed" : "2K High Resolution, highly detailed";

    // We use the same Gemini model for upscaling (Image-to-Image)
    // We pass the input image as 'editImage' with a prompt to upscale/enhance it.
    // Note: 'editInstruction' is usually for editing, but we can try using it for enhancement.
    // Alternatively, we can use 'referenceImages' if the model supports it better for style/structure preservation.
    // But 'editImage' implies we want to modify *this* image.

    const result = await generateBaseImageWithGemini({
        prompt: `Enhance this image to ${resolutionPrompt}. Maintain all details and composition.`,
        editImage: image,
        editInstruction: `Enhance to ${resolutionPrompt}`, // Some models prefer this
        imageSize: "2K", // Request max available
        aspectRatio: "1:1", // Default, but ideally we should know the aspect ratio of the input. 
        // For now, we might default or try to detect. 
        // Since we don't have aspect ratio passed in, we might risk cropping.
        // TODO: Pass aspect ratio to upscaleImage if possible.
    });

    return {
        image: result.image,
        width: result.width,
        height: result.height
    };
}
