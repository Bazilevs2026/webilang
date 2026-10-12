function outputText(data){
  if(typeof data?.output_text==="string"&&data.output_text.trim())return data.output_text.trim();
  const out=[];for(const item of(data?.output||[])){for(const part of(item?.content||[])){if(typeof part?.text==="string")out.push(part.text);else if(typeof part?.output_text==="string")out.push(part.output_text);}}
  return out.join("\n").trim();
}
function stripFence(s){return String(s||"").trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim();}
function safeText(v,max=120){return String(v||"").replace(/\s+/g," ").trim().slice(0,max);}
function sanitizeHistory(history){if(!Array.isArray(history))return[];return history.slice(-30).map(m=>({role:m?.role==="assistant"?"assistant":"user",content:safeText(m?.content,420)})).filter(m=>m.content);}
function sanitizeGrammarItems(items,source){
  if(!Array.isArray(items))return[];const out=[];
  for(const raw of items.slice(0,3)){
    const rule=safeText(raw?.rule,180),original=safeText(raw?.original,220),correction=safeText(raw?.correction,220),explanation=safeText(raw?.explanation,260);
    const p=raw?.practice||{},rec=p.recognition||{},ret=p.retrieve||{},prod=p.production||{};
    const options=Array.isArray(rec.options)?rec.options.map(x=>safeText(x,180)).filter(Boolean).slice(0,3):[];
    const answerIndex=Math.max(0,Math.min(2,Number(rec.answerIndex)||0));if(!rule||!original||!correction||options.length!==3)continue;
    out.push({rule,original,correction,explanation,source,practice:{
      recognition:{prompt:safeText(rec.prompt||"Which sentence is correct?",220),options,answerIndex,support:safeText(rec.support||"Use the grammar rule above.",220)},
      retrieve:{prompt:safeText(ret.prompt||"Complete the sentence.",220),sentence:safeText(ret.sentence,220),answer:safeText(ret.answer,100),support:safeText(ret.support||"Use the grammar rule above.",220)},
      production:{prompt:safeText(prod.prompt||"Write one new sentence using this rule.",260),model:safeText(prod.model||correction,240),support:safeText(prod.support||"Follow the rule, but use your own idea.",220)}
    }});
  }return out;
}
async function callResponses({instructions,input,maxOutput=180}){
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-5.6-luna",instructions,input,reasoning:{effort:"none"},max_output_tokens:maxOutput,store:false})});
  const data=await r.json();if(!r.ok){console.error("OpenAI error",data);throw new Error(data?.error?.message||"AI service error");}return outputText(data);
}
function cap15(text,fallback){const w=String(text||"").replace(/\s+/g," ").trim().split(/\s+/).filter(Boolean);return w.length?w.slice(0,15).join(" "):fallback;}
function parseRoleJson(raw){
  try{
    const parsed=JSON.parse(stripFence(raw));
    if(parsed&&typeof parsed==="object") return parsed;
  }catch(e){}
  return {reply:String(raw||"").trim()};
}
function sanitizeProgress(p,previous){
  const prev=previous&&typeof previous==="object"?previous:{};
  const facts=Math.max(Number(prev.facts)||0,Math.min(3,Math.max(0,Number(p?.facts)||0)));
  return {
    facts,
    biggestChallenge:Boolean(prev.biggestChallenge||p?.biggestChallenge),
    companyIncome:Boolean(prev.companyIncome||p?.companyIncome),
    featureIdea:Boolean(prev.featureIdea||p?.featureIdea)
  };
}
function sourceName(scenario,game,job){return scenario==="creator"?`Game Creator Interview${game?` — ${game}`:""}`:`Gamer Kid Job Challenge — ${job}`;}

export default async function handler(req,res){
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Method not allowed"});}
  if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
  try{
    const body=req.body||{},mode=["start","feedback","reply"].includes(body.mode)?body.mode:"reply";
    const scenario=body.scenario==="employer"?"employer":"creator",game=safeText(body.game,80);
    const job=["teacher","tutor","nanny"].includes(body.job)?body.job:"teacher",turn=Math.max(1,Math.min(15,Number(body.turn)||1));
    const history=sanitizeHistory(body.history),source=sourceName(scenario,game,job);
    const previousProgress=sanitizeProgress(body.progress||{},{});

    if(mode==="start"){
      if(scenario!=="employer")return res.status(400).json({error:"This scenario does not use an AI opening."});
      return res.status(200).json({
        reply:cap15(`Hello. Thanks for coming. Why do you want this ${job} job?`,"Hello. Why do you want this job?"),
        decision:"pending"
      });
    }

    if(mode==="feedback"){
      if(!history.length)return res.status(400).json({error:"Conversation history is empty"});
      const instructions=`You are an English coach for an A2 learner.
Roleplay: ${source}.

Give feedback ONLY on the learner's actual lines. Do not invent errors.
Feedback: under 130 words. Use exactly:
COMMUNICATION: ...
GRAMMAR: ...
VOCABULARY: ...
2 USEFUL CORRECTIONS:
1) ...
2) ...
NEXT STEP: ...

Then build My Grammar Stock from ONLY genuine grammar errors.
Ignore punctuation, capitalization, transcription noise, vocabulary choices and style preferences.
Return at most 3 distinct grammar rules. If there are no clear grammar errors, use an empty grammarItems array.

For EACH grammar rule create exactly 3 short A2 activities:
1) RECOGNITION: exactly 3 plausible sentence options; one correct.
2) RETRIEVE: one short sentence with _____ and one exact missing form.
3) PRODUCTION: one new communicative prompt and one natural model.

Distractors must be realistic learner errors, never nonsense.
Do not copy the learner's original sentence as the recognition question.
Return STRICT JSON only:
{"feedback":"...","grammarItems":[{"rule":"...","original":"...","correction":"...","explanation":"...","practice":{"recognition":{"prompt":"Which sentence is correct?","options":["...","...","..."],"answerIndex":1,"support":"..."},"retrieve":{"prompt":"Complete the sentence.","sentence":"...","answer":"...","support":"..."},"production":{"prompt":"...","model":"...","support":"..."}}}]}`;
      const raw=await callResponses({instructions,input:history,maxOutput:950});
      let parsed=null;try{parsed=JSON.parse(stripFence(raw));}catch(e){}
      if(!parsed||typeof parsed!=="object")return res.status(200).json({feedback:String(raw||"").trim()||"Feedback unavailable.",grammarItems:[]});
      return res.status(200).json({feedback:String(parsed.feedback||"").trim()||"Feedback complete.",grammarItems:sanitizeGrammarItems(parsed.grammarItems,source)});
    }

    if(!history.length)return res.status(400).json({error:"Conversation history is empty"});
    let instructions="";

    if(scenario==="creator"){
      if(!game)return res.status(400).json({error:"Game name is required"});
      instructions=`You are an AI simulation of a creator/developer of "${game}" for an A2 English interview.
If the exact creator is unclear, represent the development team.
Never claim you are the real person.
Avoid exact dates, exact financial figures, personal memories or names if uncertain.
For company income/revenue questions, be truthful: if exact figures are uncertain, say so simply and explain how the game/company makes money.

The learner has FOUR visible interview goals:
1) Get 3 distinct general facts about the game/development.
2) Learn the biggest development challenge.
3) Ask about company income/revenue or how the game/company makes money.
4) Propose their own new feature idea.

CURRENT PROGRESS:
- General facts: ${previousProgress.facts}/3
- Biggest challenge: ${previousProgress.biggestChallenge}
- Company income: ${previousProgress.companyIncome}
- Feature idea: ${previousProgress.featureIdea}

PROGRESS RULES:
- "facts" may increase by at most 1 in this reply.
- Count a fact only when YOUR reply actually gives a new concrete game/development fact.
- Do NOT count the biggest-challenge answer or company-income answer as one of the 3 general facts.
- biggestChallenge becomes true only after the learner asks about the hardest/biggest challenge and you answer it.
- companyIncome becomes true only after the learner asks about income/revenue/money/how the company earns money and you answer it.
- featureIdea becomes true when the LEARNER proposes a new game feature or improvement.
- Never turn a goal true just because you suggested that the learner should ask it.
- Progress can never go backwards.

CONVERSATION:
- Answer the learner, then usually ask ONE short related question.
- Do NOT correct the learner during the roleplay.
- Stay on game ideas, design, development, players, problems, money/business and future ideas.

LANGUAGE:
- Natural A2 English.
- The "reply" field has a HARD LIMIT of 15 words.
- Prefer 10–15 words.
- At most one question.

This is AI reply ${turn} of 15.
${turn>=15?"Final reply: thank the learner and close naturally. No question.":"Keep the interview moving."}

Return STRICT JSON only:
{"reply":"10-15 word A2 reply","progress":{"facts":0,"biggestChallenge":false,"companyIncome":false,"featureIdea":false}}`;
    }else{
      const phases={2:"Ask about experience working with children.",3:"Say your child loves video games. Ask if that is a problem.",4:"The child plays before homework. Ask what the candidate would do.",5:"The child says: Five more minutes. Ask what the candidate would say.",6:"The child gets angry when gaming stops. Ask what the candidate would do.",7:"Ask whether games can sometimes be used as a reward.",8:"Ask how the candidate would organize an afternoon after school.",9:"The child secretly plays late at night. Ask what the candidate would do.",10:"Ask how the candidate would discuss progress with the parents.",11:"The child has a tournament tonight and homework tomorrow. Ask for a plan.",12:"Challenge one part of the candidate's plan with one short follow-up.",13:"Ask how to make non-gaming activities interesting.",14:"Ask why you should hire this candidate.",15:"Make the final hiring decision from the learner's answers. Give one short reason. No question."};
      instructions=`You are a parent/employer interviewing an A2 learner for a ${job} job.
Your child is 10–14 and loves video games too much.
The real problem is balance: homework, sleep, exercise, family life and gaming.
Do not treat video games as automatically bad.

ROLEPLAY:
- You are the employer, not an English teacher.
- React briefly, then ask one practical question.
- You may disagree or make the situation harder.
- Do NOT correct the learner during the interview.
- Turn 15: decide hired or not yet, based on the learner's practical ideas.

HIRING RESULT:
- For replies 1–14, decision must be "pending".
- On reply 15 choose exactly one:
  "hired" = practical, calm balance, clear limits, child-safe ideas, communication with parents.
  "think" = some good ideas, but important parts are unclear or inconsistent.
  "no" = unsafe, very punitive, no workable boundaries, or consistently poor practical choices.
- The final spoken reply should naturally communicate your decision.

LANGUAGE:
- Natural A2 English.
- The "reply" field has a HARD LIMIT of 15 words.
- Prefer 10–15 words.
- At most one question.

This is AI reply ${turn} of 15.
Focus now: ${phases[turn]||"Ask one simple practical question about working with the child."}

Return STRICT JSON only:
{"reply":"10-15 word A2 reply","decision":"pending"}
On turn 15, "decision" must instead be "hired", "think", or "no".`;
    }

    const raw=await callResponses({instructions,input:history,maxOutput:180});
    const parsed=parseRoleJson(raw);
    const fallback=scenario==="creator"?"That is interesting. What do you enjoy most about the game?":"Good. What would you do next?";
    const reply=cap15(parsed?.reply,fallback);

    if(scenario==="creator"){
      return res.status(200).json({
        reply,
        progress:sanitizeProgress(parsed?.progress,previousProgress)
      });
    }

    let decision=String(parsed?.decision||"pending").toLowerCase();
    if(turn<15) decision="pending";
    if(turn>=15 && !["hired","think","no"].includes(decision)) decision="think";
    return res.status(200).json({reply,decision});
  }catch(err){console.error(err);return res.status(500).json({error:err?.message||"Server error"});}
}
