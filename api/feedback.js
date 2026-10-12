/**
 * Webilang shared AI feedback + Word Stock practice
 * Vercel Function: /api/feedback.js
 *
 * Modes:
 * 1) speaking feedback: {task, transcript, level, module}
 * 2) Word Stock practice: {mode:"wordstock", words, level, module}
 *
 * Uses OPENAI_API_KEY.
 */
function outputText(data){
  if(typeof data?.output_text==="string" && data.output_text.trim()) return data.output_text.trim();
  const out=[];
  for(const item of (data?.output||[])){
    for(const part of (item?.content||[])){
      if(typeof part?.text==="string") out.push(part.text);
      else if(typeof part?.output_text==="string") out.push(part.output_text);
    }
  }
  return out.join("\n").trim();
}

function stripFence(s){
  return String(s||"").trim()
    .replace(/^```(?:json)?\s*/i,"")
    .replace(/\s*```$/,"")
    .trim();
}

async function ask({instructions,input,maxOutput=500}){
  const r=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{
      "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      model:"gpt-5.6-luna",
      instructions,
      input,
      reasoning:{effort:"none"},
      max_output_tokens:maxOutput,
      store:false
    })
  });
  const data=await r.json();
  if(!r.ok){
    console.error("OpenAI feedback error",data);
    throw new Error(data?.error?.message||"AI service error");
  }
  return outputText(data);
}

function cleanWords(words){
  if(!Array.isArray(words)) return [];
  const out=[];
  for(const w of words){
    const s=String(w||"").replace(/\s+/g," ").trim().slice(0,80);
    if(s && !out.some(x=>x.toLowerCase()===s.toLowerCase())) out.push(s);
  }
  return out.slice(0,6);
}

export default async function handler(req,res){
  if(req.method!=="POST"){
    res.setHeader("Allow","POST");
    return res.status(405).json({error:"Method not allowed"});
  }
  if(!process.env.OPENAI_API_KEY){
    return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
  }

  try{
    const body=req.body||{};

    if(body.mode==="wordstock"){
      const words=cleanWords(body.words);
      if(!words.length) return res.status(400).json({error:"No Word Stock items supplied"});

      const instructions=`You create an adaptive English vocabulary practice round for an A2 learner.
Use ONLY the supplied saved words/phrases as TARGET vocabulary.
Create exactly 8 activities:
- gaps: 2
- choices: 2
- natural: 2
- personal: 1
- speaking: 1

CRITICAL PEDAGOGY:
1. CONTEXT FIRST.
   - The 2 gap sentences are Stage 1.
   - NEVER print the English target anywhere in a Stage-1 sentence or support clue.
   - The learner must infer it from context before seeing later stages.
2. SHORT CONTEXT.
   - Keep gap and choice sentences natural and usually 6–12 words.
3. DISTRACTORS MUST BE LOGICAL.
   - In each choice activity, give exactly 3 word/phrase options.
   - One is the saved target.
   - The other 2 must be plausible in the same topic and the same grammatical category / phrase type.
   - They should be tempting but wrong in this exact context because of meaning, collocation, or grammar.
   - NEVER use absurd, random, obviously unrelated distractors.
4. SUPPORT AFTER A MISTAKE.
   - Every activity must include "support": one short English clue that helps the learner reason toward the answer.
   - Support must NOT directly state the English answer.
5. RU HINT.
   - Every activity must include "ruHint": a concise Russian meaning/translation of the target expression.
   - Do not include the English target inside ruHint.
6. NATURAL ENGLISH.
   - Each natural pair contains the target expression, but only one sentence is clearly idiomatic/natural.
7. PERSONAL.
   - Ask for one short personal sentence using the target.
8. FINAL RETRIEVAL — STAGE 5 ONLY.
   - There is NO Stage 6.
   - The final activity lets the learner SAY OR WRITE only one saved word or phrase.
   - It is NOT a full-sentence speaking task.
   - Use the instruction exactly: "Say the word or phrase or write it."
9. Use contemporary, realistic everyday contexts. No bizarre sentences.
10. Return JSON only. No markdown or commentary.

Return STRICT JSON with exactly this shape:
{
  "gaps":[
    {"sentence":"... _____ ...","answer":"target","support":"short clue without the English target","ruHint":"краткий перевод"},
    {"sentence":"... _____ ...","answer":"target","support":"short clue without the English target","ruHint":"краткий перевод"}
  ],
  "choices":[
    {"sentence":"... _____ ...","answer":"target","options":["target","plausible distractor","plausible distractor"],"support":"short clue","ruHint":"краткий перевод"},
    {"sentence":"... _____ ...","answer":"target","options":["plausible distractor","target","plausible distractor"],"support":"short clue","ruHint":"краткий перевод"}
  ],
  "natural":[
    {"word":"target","a":"natural/unnatural sentence","b":"natural/unnatural sentence","answer":"A","support":"short collocation or grammar clue","ruHint":"краткий перевод"},
    {"word":"target","a":"natural/unnatural sentence","b":"natural/unnatural sentence","answer":"B","support":"short collocation or grammar clue","ruHint":"краткий перевод"}
  ],
  "personal":[
    {"word":"target","prompt":"short personal prompt","support":"short usage clue","ruHint":"краткий перевод"}
  ],
  "speaking":[
    {"word":"target","prompt":"Say the word or phrase or write it.","support":"short meaning/use reminder","ruHint":"краткий перевод"}
  ]
}`;

      const raw=await ask({
        instructions,
        input:`Saved words/phrases: ${JSON.stringify(words)}`,
        maxOutput:900
      });

      let data;
      try{data=JSON.parse(stripFence(raw));}
      catch(e){throw new Error("AI returned invalid Word Stock JSON");}

      const result={
        gaps:Array.isArray(data.gaps)?data.gaps.slice(0,2):[],
        choices:Array.isArray(data.choices)?data.choices.slice(0,2):[],
        natural:Array.isArray(data.natural)?data.natural.slice(0,2):[],
        personal:Array.isArray(data.personal)?data.personal.slice(0,1):[],
        speaking:Array.isArray(data.speaking)?data.speaking.slice(0,1):[]
      };

      const total=result.gaps.length+result.choices.length+result.natural.length+result.personal.length+result.speaking.length;
      if(total!==8) throw new Error("AI practice round did not contain exactly 8 activities");

      for(const ex of result.gaps){
        if(!ex?.answer || !ex?.sentence || !String(ex.sentence).includes("_____")){
          throw new Error("Invalid context-gap activity");
        }
        if(String(ex.sentence).toLowerCase().includes(String(ex.answer).toLowerCase())){
          throw new Error("Stage-1 gap revealed its answer");
        }
      }

      for(const ex of result.choices){
        if(!ex?.answer || !ex?.sentence || !Array.isArray(ex.options) || ex.options.length!==3){
          throw new Error("Invalid choice activity");
        }
        const answer=String(ex.answer).trim().toLowerCase();
        const options=ex.options.map(x=>String(x).trim().toLowerCase());
        if(options.filter(x=>x===answer).length!==1){
          throw new Error("Choice activity must contain the target exactly once");
        }
        if(new Set(options).size!==3){
          throw new Error("Choice distractors must be distinct");
        }
      }

      return res.status(200).json(result);
    }

    const task=String(body.task||"").trim().slice(0,1800);
    const transcript=String(body.transcript||"").trim().slice(0,5000);
    const level=String(body.level||"A2").trim().slice(0,20);
    const module=String(body.module||"Gaming").trim().slice(0,80);
    if(!transcript) return res.status(400).json({error:"No transcript supplied"});

    const instructions=`You are a concise English speaking coach.
Learner level: ${level}. Module: ${module}.
Evaluate ONLY the learner transcript against the speaking task.
Do not invent errors or content the learner did not say.
Keep feedback under 180 words.
Use this compact structure:
COMMUNICATION: ...
GRAMMAR: ...
VOCABULARY: ...
PRONUNCIATION / FLUENCY: Comment only on what a transcript can support; do not pretend you heard sounds.
2 USEFUL CORRECTIONS:
1) learner wording -> better wording
2) learner wording -> better wording
NEXT STEP: ...
If there are fewer than two genuine errors, give natural upgrades instead.`;

    const feedbackText=await ask({
      instructions,
      input:`TASK:\n${task}\n\nLEARNER TRANSCRIPT:\n${transcript}`,
      maxOutput:320
    });

    return res.status(200).json({feedback:feedbackText});
  }catch(err){
    console.error(err);
    return res.status(500).json({error:err?.message||"Server error"});
  }
}
