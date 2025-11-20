import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const body = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an advanced AI Fitness Coach.

Generate a complete fitness plan in STRICT JSON FORMAT only.

Input:
Name: ${body.name}
Age: ${body.age}
Gender: ${body.gender}
Height: ${body.height}
Weight: ${body.weight}
Goal: ${body.goal}
Level: ${body.level}
Diet: ${body.diet}
Location: ${body.location}
Notes: ${body.notes}

Return JSON in this exact structure:

{
  "workout_plan": [
    {
      "day": "Day 1",
      "exercises": [
        { "name": "Exercise Name", "sets": 3, "reps": "12-15", "desc": "Short description" }
      ]
    }
  ],
  "diet_plan": {
    "breakfast": ["item1", "item2"],
    "lunch": ["item1", "item2"],
    "dinner": ["item1", "item2"],
    "snacks": ["item1"]
  },
  "tips": ["tip 1", "tip 2"],
  "motivation": "1–2 motivational lines"
}

IMPORTANT:
- DO NOT add text outside JSON.
- DO NOT include markdown.
- ONLY return valid JSON.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("RAW AI TEXT:", text);

    let clean = text.trim();

    clean = clean.replace(/```json/g, "");
    clean = clean.replace(/```/g, "");

    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");

    clean = clean.slice(firstBrace, lastBrace + 1);

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (err) {
      console.error("JSON Parse Error:", err);
      return new Response(
        JSON.stringify({
          error: "AI returned invalid JSON",
          raw: clean,
        }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ result: parsed }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
