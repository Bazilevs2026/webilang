/**
 * Webilang AI Speaking Feedback
 * Vercel Serverless Function
 *
 * Secret required in Vercel:
 * OPENAI_API_KEY
 *
 * IMPORTANT:
 * Never put the API key in index.html.
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const task = String(body.task || "").slice(0, 1200);
    const transcript = String(body.transcript || "").slice(0, 5000);
    const level = String(body.level || "A2").slice(0, 20);
    const moduleName = String(body.module || "Gaming").slice(0, 100);

    if (!transcript.trim()) {
      return res.status(400).json({ error: "Transcript is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured on the server"
      });
    }

    const instructions = `
You are an English speaking coach for a ${level} learner.

Give short, supportive, concrete feedback in English.
Focus only on the learner's actual transcript.
Do not invent mistakes that are not present.

Use exactly these sections:
1. What you did well
2. Grammar: mistakes → short explanation → corrected examples
3. Vocabulary: useful words used + 2 better words/phrases for this topic
4. Fluency: one practical improvement
5. Better version: a natural ${level} model answer of about 50–80 words

Keep the feedback easy to understand and concise.
`;

    const input = `
Module: ${moduleName}
Speaking task: ${task}

Student transcript:
${transcript}
`;

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-6-luna",
        instructions,
        input,
        max_output_tokens: 700
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error("OpenAI error:", data);
      return res.status(openaiResponse.status).json({
        error: data?.error?.message || "AI service error"
      });
    }

    const feedback = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(part => part.type === "output_text")
      .map(part => part.text || "")
      .join("\n")
      .trim();

    if (!feedback) {
      return res.status(502).json({ error: "Empty AI response" });
    }

    return res.status(200).json({ feedback });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
