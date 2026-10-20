const json = (res,status,body)=>{res.setHeader("Cache-Control","no-store");return res.status(status).json(body)};
const outputText = data => String(data.output_text||data.output?.flatMap(x=>(x.content||[]).map(p=>p.text||p.output_text||"")).join("\n")||"");
export default async function handler(req,res){
 if(req.body?.action==="build"||req.body?.action==="check")return genderWordPracticeHandler(req,res);
 if(req.method!=="POST")return json(res,405,{error:"POST required"});
 const body=req.body||{},kind=body.kind,task=String(body.task||"").slice(0,1600),response=String(body.response||"").trim();
 if(!["speaking","writing"].includes(kind))return json(res,400,{error:"Select speaking or writing"});
 if(response.length<45||response.length>14000)return json(res,400,{error:"Response must be 45–14,000 characters."});
 if(!process.env.OPENAI_API_KEY)return json(res,503,{error:"OPENAI_API_KEY is missing in Vercel."});
 const instructions=`You are a rigorous yet supportive English-language tutor for CEFR B2–C1, reviewing a learner response in the original Gender Roles: Then & Now thematic module.
Evaluate the learner's OWN response only; do not attribute errors to speech recognition unless clearly evidenced. The module explores gender roles, Soviet women's legal equality and double burden, gender expectations in Germany, Justin Baldoni's talk about masculinity and vulnerability, Elena's life story, and the interpretive limitation of Hofstede's masculinity/femininity dimension. Do not fabricate module quotations or overclaim historical details.
This is ${kind} assessment for a specific prompt supplied separately. Feedback must address relevance to THAT prompt, argument/evidence, coherence, B2–C1 language, nuance, and possible unsupported sweeping generalizations. For writing, explicitly assess paragraph organization; for speaking, assess cohesion and discourse markers but DO NOT assess actual pronunciation or fluency from text alone.
Return STRICT JSON object, without markdown, fields:
{"level":"B2–C1","taskAchievement":"2-3 sentences","contentFeedback":"2 sentences with evidence grounded in learner words","organizationFeedback":"1-2 sentences","vocabularyFeedback":"1-2 sentences including positive evidence","grammarFeedback":"1-2 sentences","corrections":[{"original":"exact original span (verbatim)","corrected":"plausible correction","explanation":"specific rule"}],"grammarPatterns":[{"pattern":"specific construction","original":"exact verbatim original span","corrected":"corrected form","rule":"short precise English grammar rule","recognition":"brief recognition instruction/question about their error","recognitionAnswer":"short expected answer","retrieval":"specific correction task","retrievalAnswer":"correct form","production":"new communicative prompt that elicits this same pattern"}],"nextTask":"one short transfer task for independent reuse"}.
Only flag clear grammatical or lexical form mistakes, not stylistic differences as errors. Every 'original' in corrections/grammarPatterns MUST be an exact substring of the learner's text. Maximum 4 grammarPatterns; never invent student mistakes. If no real grammar errors, return empty grammarPatterns and corrections. Do not automatically label political claims true/false; evaluate support and precision.
Output safe plain text, not HTML.`;
 try{
 const r=await fetch("https://api.openai.com/v1/responses",{
  method:"POST",headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
  body:JSON.stringify({model:process.env.GENDER_AI_MODEL||"gpt-4.1-mini",instructions,input:`Return a valid JSON object only. Use JSON syntax and the fields specified in the instructions.\n\nTASK:\n${task}\n\nSTUDENT ${kind.toUpperCase()}:\n${response}`,temperature:0.2,max_output_tokens:1800,store:false,
   text:{format:{type:"json_object"}}})
 });
 const d=await r.json();if(!r.ok)throw Error(d.error?.message||"AI provider request failed");
 let parsed=JSON.parse(outputText(d));
 const clean=x=>String(x||"").slice(0,1500);
 let corrections=Array.isArray(parsed.corrections)?parsed.corrections:[],
 patterns=Array.isArray(parsed.grammarPatterns)?parsed.grammarPatterns:[];
 corrections=corrections.filter(x=>x&&typeof x.original==="string"&&response.includes(x.original)&&String(x.corrected||"").trim()!==x.original).slice(0,6)
  .map(x=>({original:clean(x.original),corrected:clean(x.corrected),explanation:clean(x.explanation)}));
 patterns=patterns.filter(x=>x&&typeof x.original==="string"&&response.includes(x.original)&&String(x.corrected||"").trim()!==x.original).slice(0,4)
 .map(x=>Object.fromEntries(["pattern","original","corrected","rule","recognition","recognitionAnswer","retrieval","retrievalAnswer","production"].map(k=>[k,clean(x[k])])));
 return json(res,200,{level:"B2–C1",taskAchievement:clean(parsed.taskAchievement),contentFeedback:clean(parsed.contentFeedback),
 organizationFeedback:clean(parsed.organizationFeedback),vocabularyFeedback:clean(parsed.vocabularyFeedback),grammarFeedback:clean(parsed.grammarFeedback),
 corrections,grammarPatterns:patterns,nextTask:clean(parsed.nextTask)});
 }catch(err){console.error("Gender AI feedback failed",err);return json(res,502,{error:String(err.message||"AI service failure").slice(0,220)})}
}


// Shared Gender Roles word practice endpoint; mounted on /api/gender-feedback.
// Vercel serverless endpoint. Set OPENAI_API_KEY in Vercel environment variables.
const MODEL=process.env.OPENAI_MODEL||"gpt-4o-mini";
async function openai(messages){
 const response=await fetch("https://api.openai.com/v1/chat/completions",{
  method:"POST",headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},
  body:JSON.stringify({model:MODEL,temperature:0.2,response_format:{type:"json_object"},messages})
 });
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(payload.error?.message||"AI generation failed");
 const content=payload.choices?.[0]?.message?.content;
 if(!content)throw Error("AI returned no content");
 return JSON.parse(content);
}
const system=`You are a B2-C1 ESL curriculum designer and fair language assessor.
Tasks must be concise, clear and meaningful, grounded in natural language; never use meta-sentences or empty generic clues.
For each SAVED vocabulary item produce exactly:
recognize: a meaningful short sentence with the target word already in it, and three distinct explanations (options) of which precisely one is correct; prompt: "In this sentence, what does [word] mean? [short contextual sentence]".
retrieve: a DIFFERENT meaningful contextual sentence with "_____" replacing the saved word or phrase; no options.
produce: an original relevant scenario asking the learner to use the word in one new sentence.
Use 9-18 words in example sentences whenever possible; B2-C1 English, not artificially complicated.
Provide a short accurate Russian translation of each task instruction and context (ruHint).
On checks, consider intended meaning and context, allow correct variants and spelling/format differences where harmless.
Never claim that an article or word is missing if present. Never invent an error.
Do not penalize a correct answer for style. Distinguish optional enhancements.
For negative judgments identify a verifiable mistake. When uncertain return review, never reject.
Return ONLY JSON.`;
async function genderWordPracticeHandler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Use POST"});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"OPENAI_API_KEY is not configured"});
 try{
  const b=typeof req.body==="string"?JSON.parse(req.body):req.body||{};
  if(b.action==="build"){
   const items=Array.isArray(b.items)?b.items.slice(0,6).map(x=>String(x.word||"").trim()).filter(x=>x&&x.length<100):[];
   if(!items.length)return res.status(400).json({error:"Select words first"});
   const output=await openai([{role:"system",content:system},{role:"user",content:`Build three tasks for EACH item, in the supplied order: ${JSON.stringify(items)}. Use JSON {"items":[{"word":"...","recognize":{"prompt":"...","options":["...","...","..."],"correctOption":"...","ruHint":"..."},"retrieve":{"prompt":"... _____ ...","answer":"...","ruHint":"..."},"produce":{"prompt":"...","ruHint":"..."}}]}. Recognition correctOption must EXACTLY match one options string. All prompts and translations are needed.`}]);
   const arr=output.items;
   if(!Array.isArray(arr)||arr.length!==items.length)throw Error("Incomplete exercise response; please retry");
   for(let i=0;i<arr.length;i++){
    const x=arr[i];if(!x||String(x.word).toLowerCase()!==items[i].toLowerCase()||!x.recognize?.prompt||!Array.isArray(x.recognize.options)||x.recognize.options.length!==3||!x.recognize.options.includes(x.recognize.correctOption)||!x.retrieve?.prompt?.includes("_____")||!x.produce?.prompt)throw Error("AI returned an invalid task; please retry");
   }
   return res.status(200).json({items:arr});
  }
  if(b.action==="check"){
   const stage=String(b.stage||"");
   const answer=String(b.answer||"").trim().slice(0,500);
   const word=String(b.word||"").trim().slice(0,100);
   const task=b.task||{};
   if(!answer||!word||!["recognize","retrieve","produce"].includes(stage))return res.status(400).json({error:"Invalid check request"});
   const normalize=s=>String(s||"").toLowerCase().replace(/[.!?]+$/,"").replace(/\s+/g," ").trim();
   if(stage==="recognize"){
    const correct=normalize(answer)===normalize(task.correctOption);
    return res.status(200).json({status:correct?"correct":"incorrect",feedback:correct?"Exactly right.":"Look at the meaning in this context and try another choice."});
   }
   if(stage==="retrieve"){
    const expected=normalize(task.answer||word),response=normalize(answer);
    const prompt=String(task.prompt||"");
    const completed=normalize(prompt.replace("_____",answer));
    const fullExpected=normalize(prompt.replace("_____",task.answer||word));
    if(response===expected||response===fullExpected||completed===fullExpected)return res.status(200).json({status:"correct",feedback:"Correct use of the expression."});
   }
   const out=await openai([{role:"system",content:system},{role:"user",content:`Check the student's response. Target word: ${JSON.stringify(word)}; stage ${stage}; task ${JSON.stringify(task)}; exact student response: ${JSON.stringify(answer)}. Allow full completed sentences for gap-fill. Return JSON {"status":"correct"|"incorrect"|"review","feedback":"<=28 words in clear English","suggestion":""}. Only return incorrect if a real, demonstrable error affects this task. The response may express unexpected ideas.`}]);
   if(!["correct","incorrect","review"].includes(out.status))out.status="review";
   if(out.status==="incorrect"&&!out.suggestion)out.status="review";
   return res.status(200).json({status:out.status,feedback:String(out.feedback||"Please review your response.").slice(0,350),suggestion:String(out.suggestion||"").slice(0,350)});
  }
  return res.status(400).json({error:"Unknown action"});
 }catch(e){return res.status(502).json({error:e.message||"AI service failed"})}
};
