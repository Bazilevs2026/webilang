/**
 * Webilang My Word Stock — fresh AI practice (compact round)
 * Vercel Function: /api/wordstock.js
 * Secret: OPENAI_API_KEY
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const words = Array.isArray(body.words)
      ? body.words.map(x => String(x || "").trim()).filter(Boolean).slice(0, 6)
      : [];
    const level = String(body.level || "A2").slice(0, 20);

    if (!words.length) {
      return res.status(400).json({ error: "Select at least one word or phrase" });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
    }

    const instructions = `
You create varied English vocabulary practice for a Russian-speaking ${level} learner.

The learner personally selected these target items:
${words.map(w => "- " + w).join("\n")}

Create exactly 8 short interactive activities: 2 gaps, 2 choices, 1 natural-English task, 1 personal task, and 2 speaking tasks.
Use ONLY the learner's selected target items as the target vocabulary.

Context diversity is essential:
- vary contexts across gaming, school, home, friends, hobbies, travel, shopping, family and daily life;
- do not repeat the same situation;
- do not make every sentence about gaming;
- keep grammar and surrounding vocabulary at ${level};
- make sentences natural modern English;
- preserve multi-word phrases exactly when they are the target;
- do not use obscure vocabulary;
- personal prompts must explicitly require the target word;
- speaking prompts should use one or two selected items.

For gaps, sentence must contain exactly one _____ and answer must be a selected item.
For choices, exactly one option is clearly best and correctIndex is 0, 1, 2, or 3.
For natural tasks, one sentence is natural and the other contains a clear collocation/usage problem.
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

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-6-luna",
        reasoning: { effort: "none" },
        instructions,
        input: "Generate a fresh compact 8-activity JSON practice round for the selected vocabulary.",
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

    const data = await openaiResponse.json();
    if (!openaiResponse.ok) {
      console.error("OpenAI error:", data);
      return res.status(openaiResponse.status).json({
        error: data?.error?.message || "AI service error"
      });
    }

    let text = typeof data.output_text === "string" ? data.output_text.trim() : "";
    if (!text && Array.isArray(data.output)) {
      text = data.output
        .flatMap(item => Array.isArray(item.content) ? item.content : [])
        .filter(part => part?.type === "output_text" && typeof part.text === "string")
        .map(part => part.text)
        .join("\n")
        .trim();
    }

    if (!text) {
      return res.status(502).json({ error: "AI returned no practice data" });
    }

    let practice;
    try {
      practice = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: "Could not parse AI practice data" });
    }

    return res.status(200).json(practice);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
}
