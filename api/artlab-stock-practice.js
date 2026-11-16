// Art Lab practice generator: objective recognition and constrained retrieval.
// Repo location: /api/artlab-stock-practice.js
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({error:'POST required'});
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({error:'OPENAI_API_KEY is not configured'});
  const body = req.body || {};
  const pattern = String(body.pattern || '').trim().slice(0, 180);
  if (!pattern) return res.status(400).json({error:'No grammar structure provided'});
  const mode = body.mode === 'evaluate' ? 'evaluate' : 'generate';
  const model = process.env.ARTLAB_AI_MODEL || 'gpt-4o-mini';

  const evaluating = `You are a precise A2-B1 language teacher. Assess whether a learner's original sentence actually uses the specified grammar pattern and answers the prompt. Accept natural alternatives, do not demand one model sentence, and do not judge the learner's personal or political opinion. Return JSON only: {"correct":boolean,"feedback":"one concise supportive sentence","example":"one possible model sentence"}.`;
  const generating = `You design psychometrically defensible English practice at A2-B1 for ONE target grammar pattern: ${JSON.stringify(pattern)}.
Return JSON with exactly six questions IN ORDER: 2 recognize, 2 retrieve, 2 produce.
CRITICAL RULES FOR RECOGNIZE:
- Each must have EXACTLY ONE defensibly correct answer; both distractors MUST contain a clear grammatical error relative to the named target pattern. Do NOT use subjective or preference-based choices.
- Do NOT ask which adjective, painting, opinion, emotion, interpretation, or aesthetic judgment is best without an explicit linguistic criterion. In particular, 'How would you describe the exhibit? dull / spectacular / ordinary' is INVALID because all are grammatical.
- For adjective grammar, contrast adjective vs noun vs adverb (e.g., 'I found the exhibition ___' choices 'impressive', 'impress', 'impressively') or a clear comparative/form error. For patterns about giving an opinion, contrast correctly structured sentences with sentences containing specific grammatical mistakes, never three valid opinions.
- Prompt must name the precise linguistic task, e.g. 'Choose the grammatically correct sentence using an adjective after found.' NOT just 'Choose the correct answer' or 'What do you think?'.
- Put answer choices ONLY in options[]. Do not put numbered answers, lists, 1./2./3., or A/B/C inside the prompt.
- Answer must EQUAL one of the three options. Vary position of correct answer across the two recognition questions.
RETRIEVE: exactly two tightly constrained fill-in tasks, each specifying a particular grammar form (and root word if needed). Do not demand a single lexical choice when several are grammatically plausible. Make the missing form directly inferable from a named rule and context.
PRODUCE: exactly two open-ended writing/speaking prompts, with different, specific everyday or art-related scenarios. Demand use of the target pattern; sample answer is just an example, not the only correct answer.
All six prompts must differ in subject, situation and structure. No repeated prompts, no ambiguous blanks. Questions must be appropriate to the stated pattern even when it is expressed in informal teacher language.
Return valid JSON only: {"questions":[{"stage":"recognize|retrieve|produce","prompt":"...","options":["..."],"answer":"...","hint":"..."}, ...]}. Use [] for non-recognition options. No markdown.`;

  async function requestModel(system, user, temperature, max_tokens) {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {Authorization:`Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type':'application/json'},
      body: JSON.stringify({model,temperature,max_tokens,response_format:{type:'json_object'},messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(user)}]})
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      console.error('Art Lab practice upstream:',upstream.status,JSON.stringify(data).slice(0,300));
      throw new Error('AI service unavailable');
    }
    return JSON.parse(data.choices?.[0]?.message?.content || '{}');
  }

  function validate(questions) {
    if (!Array.isArray(questions) || questions.length !== 6) return 'Six questions are required';
    const stages=['recognize','recognize','retrieve','retrieve','produce','produce'];
    const normalized=new Set();
    for (let i=0;i<questions.length;i++) {
      const q=questions[i];
      if (!q || q.stage!==stages[i] || typeof q.prompt!=='string' || typeof q.answer!=='string' || !q.prompt.trim() || !q.answer.trim()) return 'Invalid question format';
      const key=q.prompt.toLowerCase().replace(/[^a-z\d]/g,'');
      if (normalized.has(key)) return 'Repeated prompts';
      normalized.add(key);
      if (q.stage==='recognize') {
        if (!Array.isArray(q.options) || q.options.length!==3 || !q.options.every(v=>typeof v==='string') || !q.options.includes(q.answer) || new Set(q.options.map(x=>x.toLowerCase().trim())).size!==3) return 'Invalid answer choices';
        if (/\b(?:how would you describe|which (?:opinion|description|adjective) is best|what do you think about)\b/i.test(q.prompt)) return 'Subjective recognition question';
        if (/(?:\b(?:1|2|3)\s*[.)]\s*\w|\b[A-C]\s*[.)]\s*\w)/.test(q.prompt)) return 'Options embedded in prompt';
      } else if (!Array.isArray(q.options) || q.options.length) return 'Unexpected options';
    }
    return null;
  }

  try {
    if (mode==='evaluate') {
      const prompt=String(body.prompt||'').slice(0,350);
      const studentAnswer=String(body.studentAnswer||'').slice(0,700).trim();
      if (!studentAnswer) return res.status(400).json({error:'No answer supplied'});
      const result=await requestModel(evaluating,{pattern,prompt,studentAnswer,modelAnswer:String(body.modelAnswer||'').slice(0,350)},0.15,250);
      return res.status(200).json({correct:result.correct===true,feedback:String(result.feedback||'Try again.'),example:String(result.example||'')});
    }
    let previousIssue='';
    for(let attempt=0;attempt<3;attempt++) {
      const additional = attempt ? `Your previous generation was rejected for: ${previousIssue}. Fix the issue. Verify that each recognition distractor is GRAMMATICALLY WRONG rather than simply a different acceptable opinion. Return six fresh questions.` : '';
      const result=await requestModel(generating,{pattern,level:'A2-B1',count:{recognize:2,retrieve:2,produce:2},additional},0.55,2000);
      previousIssue=validate(result.questions);
      if(!previousIssue) {
        return res.status(200).json({pattern,questions:result.questions.map(q=>({stage:q.stage,prompt:q.prompt,answer:q.answer,hint:String(q.hint||''),options:q.stage==='recognize'?q.options:[]}))});
      }
      console.warn('Art Lab practice rejected:',previousIssue);
    }
    return res.status(422).json({error:'Could not generate unambiguous exercises. Please try again.'});
  } catch(e) {
    console.error('Art Lab practice:',e);
    return res.status(502).json({error:'AI practice service is temporarily unavailable. Please retry.'});
  }
}
