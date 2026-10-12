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

      const instructions=`You create fresh English vocabulary practice for an A2 learner.
Use ONLY the supplied saved words/phrases as target vocabulary.
Create exactly 8 activities total:
- gaps: 2
- choices: 2
- natural: 2
- personal: 1
- speaking: 1

Pedagogy:
- Stage 1 gaps must NOT show the answer anywhere in the sentence.
- Keep sentences short, natural, and easy to infer from context.
- Do not put the target word in a gap sentence except in the hidden "answer" field.
- Choice activities should test meaning/use in a new context.
- Natural/unnatural pairs must have only one clearly natural answer.
- Personal and speaking prompts must be short and practical.
- Do not add explanations outside the JSON.

Return STRICT JSON only with this exact shape:
{
  "gaps":[
    {"sentence":"... _____ ...","answer":"target"},
    {"sentence":"... _____ ...","answer":"target"}
  ],
  "choices":[
    {"word":"target","prompt":"Which sentence uses this saved expression correctly?","options":["...","...","..."],"correctIndex":0},
    {"word":"target","prompt":"Which sentence uses this saved expression correctly?","options":["...","...","..."],"correctIndex":1}
  ],
  "natural":[
    {"word":"target","a":"...","b":"...","answer":"A"},
    {"word":"target","a":"...","b":"...","answer":"B"}
  ],
  "personal":[{"word":"target","prompt":"..."}],
  "speaking":[{"words":["target","target"],"prompt":"..."}]
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
