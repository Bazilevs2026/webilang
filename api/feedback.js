/**
 * Webilang AI Speaking Feedback
 * Bilingual feedback: English examples + Russian explanations
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
You are an English speaking coach for a Russian-speaking ${level} learner.

Give concise, friendly, concrete feedback.
Do not invent errors that are not in the learner's transcript.
Do not over-correct every small issue.
Keep English examples in English.
Write explanations and coaching comments in Russian.

Use exactly this structure:

1. ✅ What you did well
- 1–2 short comments.
- Main text in English.
- If useful, add one short Russian note.

2. 🔧 Grammar
For each important mistake, use this format:
❌ original mistake
Почему: short explanation in Russian
✅ corrected version

If there are no important grammar mistakes, say so clearly.

3. 🧠 Vocabulary
- Mention 1–3 useful words/phrases the learner used well.
- Then suggest exactly 2 better A2-level words or phrases for this speaking topic.
- Explain the meaning in Russian.
- Give a short English example for each new phrase.

4. 🗣 Fluency tip
- Give exactly one practical fluency tip in Russian.
- Recommend useful connectors if appropriate: because, so, but, then, after that.

5. ✨ Better version
- Write a natural improved ${level} answer in English.
- Keep it close to the learner's original meaning.
- About 50–80 words.
- Do not make it much more advanced than ${level}.

Tone:
- supportive, clear, teacher-like
- explanations simple enough for an A2 learner
- no long theory
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
        max_output_tokens: 800
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
