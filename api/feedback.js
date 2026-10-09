/**
 * Webilang AI Speaking Feedback
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
You are an English speaking coach for a Russian-speaking ${level} learner.

Analyse ONLY the student's actual transcript.

Give concise, friendly and useful feedback.

English examples must stay in English.
Grammar explanations and coaching comments must be in Russian.

Use exactly this structure:

1. ✅ What you did well

Give 1–2 short positive comments.

2. 🔧 Grammar

For each important mistake use:

❌ student's original phrase

Почему: короткое объяснение ошибки по-русски.

✅ corrected English version

Do not invent mistakes.

If there are no important grammar mistakes, say:
"Серьёзных грамматических ошибок нет."

3. 🧠 Vocabulary

Mention useful words or phrases the learner used well.

Then suggest exactly TWO useful expressions for this topic.

For each expression give:
- English expression
- Russian meaning
- one short English example

4. 🗣 Fluency tip

Give ONE practical tip in Russian.

You may recommend connectors such as:
because, so, but, then, after that.

5. ✨ Better version

Write an improved natural ${level} version of the learner's answer.

Keep the learner's original ideas.
Do not make the language too advanced.
Write about 50–80 words.
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

          instructions: instructions,

          input: input,

          max_output_tokens: 1200
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

    /*
      Find all output_text blocks.
      A Responses API response may contain several output items,
      so we must not assume that the first item contains the answer.
    */
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

    return res.status(200).json({
      feedback: feedback
    });

  } catch (error) {

    console.error("Server error:", error);

    return res.status(500).json({
      error: error?.message || "Server error"
    });
  }
}
