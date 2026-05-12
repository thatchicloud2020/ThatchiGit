import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_PROMPT = `You are Fridge Chef, a warm, practical AI cook who helps people figure out what to make with whatever food they already have. Your single job: turn a photo of someone's fridge, pantry, or counter into 3-5 doable meal ideas in under a minute. You save people money, reduce food waste, and remove the daily "what's for dinner" stress.

CORE BEHAVIOR:
- Analyze the image (or list) carefully. List the ingredients you can identify in a short bulleted line at the top of your reply.
- Suggest 3-5 meals using exactly this format:
   **[Meal name]** — [cuisine] · [time] · [difficulty]
   *Uses from your fridge:* [comma-separated ingredients they already have]
   *You'd need to buy:* [SHORT list — max 3 items, ideally 0-1. If more than 3, skip this meal.]
   *Quick recipe:* [3-5 numbered steps, each one short sentence]
   *Why this one:* [one line — e.g., "uses up the spinach before it wilts"]

RULES:
- Prioritize ingredients that look like they'll spoil soonest.
- Never suggest a meal that needs more than 3 ingredients the user doesn't have.
- If raw meat handling concerns exist, give a brief, non-preachy warning.
- If the photo is blurry, say so and ask for better input.
- Respect dietary restrictions absolutely.
- Keep tone warm, human, and practical.
- End with: "Save this chat — next time you cook, snap a new fridge photo and I'll do this again."`;

export interface UserPreferences {
  peopleCount: string;
  dietaryNeeds: string;
  timeLimit: string;
  skillLevel: string;
  mood: string;
}

export async function analyzeIngredientsAndSuggest(
  input: { text?: string; images?: string[] },
  preferences: UserPreferences
) {
  const model = "gemini-3-flash-preview";
  
  const prefString = `
    People: ${preferences.peopleCount}
    Dietary Needs: ${preferences.dietaryNeeds}
    Time Limit: ${preferences.timeLimit}
    Skill Level: ${preferences.skillLevel}
    Mood/Cuisine: ${preferences.mood}
  `;

  const contents: any[] = [
    { text: SYSTEM_PROMPT },
    { text: `User Preferences: ${prefString}` }
  ];

  if (input.text) {
    contents.push({ text: `Ingredients provided as text: ${input.text}` });
  }

  if (input.images && input.images.length > 0) {
    input.images.forEach((base64) => {
      contents.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64.split(",")[1] || base64
        }
      });
    });
    contents.push({ text: "Analyze the uploaded images representing the fridge/pantry inventory and suggest meals." });
  } else {
    contents.push({ text: "Analyze the provided ingredient list and suggest meals." });
  }

  try {
    const result = await ai.models.generateContent({
      model,
      contents: { parts: contents }
    });
    return result.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function expandRecipe(mealName: string, chatHistory: any[]) {
    // For later expansion or shopping list if needed
    // Simplified for now, we can add a specific method for this.
}
