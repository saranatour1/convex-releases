import { convexGateway } from "@convex-dev/ai-sdk-provider";
import { generateSpeech, generateText, transcribe } from "ai";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action } from "../_generated/server";
import { requireUser } from "../lib";

// No provider keys. Just the Convex AI Gateway.
// One turn costs 3 gateway calls from the caller's AI budget. The chat fills
// in live as each side is saved.
export const talk = action({
  args: { audio: v.bytes() },
  handler: async (ctx, { audio }): Promise<ArrayBuffer> => {
    const userId = await requireUser(ctx)
    // Text to speech transcription models through the AI gateway
    const { text: heard } = await transcribe({
      model: convexGateway.transcriptionModel("openai/whisper-large-v3-turbo"),
      audio: new Uint8Array(audio),
    });
    if (!heard.trim()) throw new Error("I didn't catch that.");

    // Pass { zdr: true } for zero data retention
    const { text: reply } = await generateText({
      model: convexGateway("google/gemini-3.1-flash-lite", { zdr: true }),
      system: "You are a voice assistant. Answer in one short spoken sentence.",
      messages: [{ role: "user", content: heard }],
    })

    // Bonus: Audio generation! 
    const { audio: voice } = await generateSpeech({
      model: convexGateway.speechModel("minimax/speech-2.8-turbo"),
      text: reply,
    })

    return voice.uint8Array.slice().buffer;
  },
});
