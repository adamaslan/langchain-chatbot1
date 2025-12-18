"use server";
import { db, generativeModel } from "@/lib/init";

export async function sendMessage(prompt: string) {
  try {
    // 1. Log the user prompt to Firebase Firestore
    const chatRef = db.collection("chat_history").doc();
    await chatRef.set({ prompt, role: "user", createdAt: new Date() });

    // 2. Call Vertex AI Gemini
    const result = await generativeModel.generateContent(prompt);
    const response = result.response.candidates?.[0].content.parts[0].text || "No response.";

    // 3. Save the AI response to the same document or a sub-collection
    await chatRef.update({ response, role: "model", respondedAt: new Date() });

    return { success: true, response };
  } catch (error) {
    console.error("Chat Error:", error);
    return { success: false, error: "Failed to process message." };
  }
}