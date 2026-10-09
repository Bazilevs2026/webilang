/**
 * Webilang AI Speaking Feedback
 * Final bilingual version:
 * English examples + Russian explanations
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
      return res.status(400).json({
        error: "Transcript is required"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured on the server"
      });
    }

    const instructions = `
You are an experienced English teacher helping a Russian-speaking ${level} learner.

Analyse ONLY the student's actual transcript.

Important rules:
- Do not invent mistakes.
- Do not over-correct.
- Correct only the most useful 1–3 problems.
- Distinguish between:
  A) a real grammar mistake;
  B) a phrase that is grammatically possible but sounds unnatural.
- If something is only unnatural, say in Russian:
  "Грамматически возможно, но естественнее сказать:"
- Keep all English examples in English.
- Write explanations and coaching comments in Russian.
- Use simple explanations appropriate for level ${level}.
- Do NOT use Markdown formatting.
- Do NOT use asterisks, double asterisks, headings with #, or code formatting.
- Plain text only.
- Emojis are allowed.

Use exactly this structure:

1. ✅ What you did well

Give 1–2 short positive comments.
Use simple English.
You may add one short Russian explanation if useful.

2. 🔧 Grammar & natural English

Choose only 1–3 important points.

For a real grammar mistake:

❌ [student's exact phrase]
Почему: [short, accurate explanation in Russian]
✅ [correct English version]

For an unnatural but possible phrase:

⚠️ [student's exact phrase]
Грамматически возможно, но естественнее сказать:
✅ [more natural English version]

Rules for explanations:
- Explain the actual grammar point, not just "this is wrong".
- If the issue involves conditionals, explain which form is used and why.
- If the problem is word order, say what order is needed.
- If the problem is verb form, name the correct form.
- If speech recognition may have caused repetition or a strange phrase, mention that possibility instead of blaming the learner.

If there are no important grammar mistakes, write:
Серьёзных грамматических ошибок нет.

3. 🧠 Vocabulary

First:
- mention 1–3 useful words or phrases the learner used well.

Then suggest exactly TWO useful expressions appropriate for ${level} and this speaking task.

For each new expression use:

Expression: [English phrase]
Значение: [short Russian meaning]
Example: [short English example]

Do not suggest vocabulary that is much harder than ${level}.

4. 🗣 Fluency tip

Give exactly ONE practical tip in Russian.

Base the tip on the student's actual answer.

Possible areas:
- connecting ideas
- avoiding repetition
- speaking in complete sentences
- giving a reason
- adding an example

Recommend connectors only when useful:
because, so, but, then, after that, also.

5. ✨ Better version

Write a natural improved version of the student's answer in English.

Rules:
- keep the learner's original ideas;
- do not invent a completely different answer;
- keep the language around ${level};
- about 50–80 words;
- make it sound natural but still achievable for the learner;
- do not use vocabulary far above the learner's level.

Final requirement:
Return plain text only.
No Markdown symbols.
No asterisks.
`;

    const input = `
Module: ${moduleName}

Speaking task:
${task}

Student transcript:
${transcript}
`;

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          model: "gpt-6-luna",

          reasoning: {
            effort: "none"
          },

          instructions,
          input,

          max_output_tokens: 1200,

          store: false
        })
      }
    );

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error("OpenAI API error:", data);

      return res.status(openaiResponse.status).json({
        error:
          data?.error?.message ||
          data?.error ||
          "OpenAI API error"
      });
    }

    let feedback = "";

    if (typeof data.output_text === "string") {
      feedback = data.output_text.trim();
    }

    if (!feedback && Array.isArray(data.output)) {
      feedback = data.output
        .flatMap(item =>
          Array.isArray(item.content)
            ? item.content
            : []
        )
        .filter(part =>
          part &&
          part.type === "output_text" &&
          typeof part.text === "string"
        )
        .map(part => part.text)
        .join("\n")
        .trim();
    }

    if (!feedback) {
      console.error(
        "No visible text returned by OpenAI:",
        JSON.stringify(data)
      );

      return res.status(502).json({
        error:
          "OpenAI returned no visible text. Please try again."
      });
    }

    /*
      Extra cleanup:
      if the model still accidentally returns Markdown asterisks,
      remove them before sending feedback to the browser.
    */
    feedback = feedback
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .trim();

    return res.status(200).json({
      feedback
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: error?.message || "Server error"
    });
  }
}
