/**
 * Webilang shared AI endpoint
 * /api/feedback.js
 * Handles Speaking Feedback + My Word Stock
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server" });
    }

    const body = req.body || {};

    if (body.mode === "wordstock") {
      const words = Array.isArray(body.words)
        ? body.words.map(x => String(x || "").trim()).filter(Boolean).slice(0, 6)
        : [];
      const level = String(body.level || "A2").slice(0, 20);

      if (!words.length) {
        return res.status(400).json({ error: "Select at least one word or phrase" });
      }

      const instructions = `
You create varied English vocabulary practice for a Russian-speaking ${level} learner.

Selected target items:
${words.map(w => "- " + w).join("\n")}

Create exactly 8 activities:
- 2 gaps
- 2 choices
- 1 natural-English task
- 1 personal task
- 2 speaking tasks

Use ONLY selected items as target vocabulary.
Vary contexts across school, home, friends, hobbies, travel, shopping, family, daily life and gaming.
Do not repeat the same context.
Keep grammar and vocabulary at ${level}.
Preserve multi-word target phrases exactly.

For gaps: exactly one _____ and answer must be a selected item.
For choices: exactly four options and one clearly correct answer.
For natural: one sentence natural, one with a clear usage/collocation problem.
Return JSON only matching the schema.
`;

      const schema = {
        type: "object",
        additionalProperties: false,
        properties: {
          gaps: {
            type: "array", minItems: 2, maxItems: 2,
            items: {
              type: "object", additionalProperties: false,
              properties: {
                word: { type: "string" },
                sentence: { type: "string" },
                answer: { type: "string" }
              },
              required: ["word","sentence","answer"]
            }
          },
          choices: {
            type: "array", minItems: 2, maxItems: 2,
            items: {
              type: "object", additionalProperties: false,
              properties: {
                word: { type: "string" },
                prompt: { type: "string" },
                options: {
                  type: "array", minItems: 4, maxItems: 4,
                  items: { type: "string" }
                },
                correctIndex: { type: "integer", minimum: 0, maximum: 3 }
              },
              required: ["word","prompt","options","correctIndex"]
            }
          },
          natural: {
            type: "array", minItems: 1, maxItems: 1,
            items: {
              type: "object", additionalProperties: false,
              properties: {
                word: { type: "string" },
                a: { type: "string" },
                b: { type: "string" },
                answer: { type: "string", enum: ["A","B"] }
              },
              required: ["word","a","b","answer"]
            }
          },
          personal: {
            type: "array", minItems: 1, maxItems: 1,
            items: {
              type: "object", additionalProperties: false,
              properties: {
                word: { type: "string" },
                prompt: { type: "string" }
              },
              required: ["word","prompt"]
            }
          },
          speaking: {
            type: "array", minItems: 2, maxItems: 2,
            items: {
              type: "object", additionalProperties: false,
              properties: {
                words: {
                  type: "array", minItems: 1, maxItems: 2,
                  items: { type: "string" }
                },
                prompt: { type: "string" }
              },
              required: ["words","prompt"]
            }
          }
        },
        required: ["gaps","choices","natural","personal","speaking"]
      };

      const ai = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-6-luna",
          reasoning: { effort: "none" },
          instructions,
          input: "Generate a fresh compact 8-activity vocabulary round.",
          text: {
            format: {
              type: "json_schema",
              name: "word_stock_practice",
              strict: true,
              schema
            }
          },
          max_output_tokens: 1300,
          store: false
        })
      });

      const data = await ai.json();
      if (!ai.ok) {
        return res.status(ai.status).json({
          error: data?.error?.message || "AI service error"
        });
      }

      let outputText = typeof data.output_text === "string" ? data.output_text.trim() : "";
      if (!outputText && Array.isArray(data.output)) {
        outputText = data.output
          .flatMap(item => Array.isArray(item.content) ? item.content : [])
          .filter(part => part?.type === "output_text" && typeof part.text === "string")
          .map(part => part.text)
          .join("\n")
          .trim();
      }

      if (!outputText) return res.status(502).json({ error: "AI returned no practice data" });

      try {
        return res.status(200).json(JSON.parse(outputText));
      } catch {
        return res.status(502).json({ error: "Could not parse AI practice data" });
      }
    }

    const task = String(body.task || "").slice(0, 1200);
    const transcript = String(body.transcript || "").slice(0, 5000);
    const level = String(body.level || "A2").slice(0, 20);
    const moduleName = String(body.module || "Gaming").slice(0, 100);

    if (!transcript.trim()) {
      return res.status(400).json({ error: "Transcript is required" });
    }

    const instructions = `
You are an experienced English teacher helping a Russian-speaking ${level} learner.

Analyse ONLY the student's actual transcript.
Do not invent mistakes.
Do not over-correct.
Correct only 1–3 useful points.
Keep English examples in English.
Write grammar explanations and coaching comments in Russian.
Plain text only. No Markdown asterisks.

Use exactly this structure:

1. ✅ What you did well
Give 1–2 short positive comments.

2. 🔧 Grammar & natural English
For a real grammar mistake:
❌ student's exact phrase
Почему: short explanation in Russian
✅ corrected English version

For an unnatural but possible phrase:
⚠️ student's exact phrase
Грамматически возможно, но естественнее сказать:
✅ more natural English version

3. 🧠 Vocabulary
Mention useful language the learner used well.
Suggest exactly TWO useful ${level} expressions.
For each:
Expression: English phrase
Значение: Russian meaning
Example: short English example

4. 🗣 Fluency tip
Give exactly ONE practical tip in Russian.

5. ✨ Better version
Write a natural improved ${level} version in English.
Keep the learner's original ideas.
About 50–80 words.
`;

    const input = `
Module: ${moduleName}
Speaking task: ${task}
Student transcript: ${transcript}
`;

    const ai = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-6-luna",
        reasoning: { effort: "none" },
        instructions,
        input,
        max_output_tokens: 1200,
        store: false
      })
    });

    const data = await ai.json();
    if (!ai.ok) {
      return res.status(ai.status).json({
        error: data?.error?.message || "OpenAI API error"
      });
    }

    let feedback = typeof data.output_text === "string" ? data.output_text.trim() : "";
    if (!feedback && Array.isArray(data.output)) {
      feedback = data.output
        .flatMap(item => Array.isArray(item.content) ? item.content : [])
        .filter(part => part?.type === "output_text" && typeof part.text === "string")
        .map(part => part.text)
        .join("\n")
        .trim();
    }

    if (!feedback) {
      return res.status(502).json({ error: "OpenAI returned no visible text. Please try again." });
    }

    feedback = feedback.replace(/\*\*/g, "").replace(/__/g, "").trim();
    return res.status(200).json({ feedback });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
}
