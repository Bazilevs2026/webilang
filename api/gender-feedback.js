const json = (res,status,body)=>{res.setHeader("Cache-Control","no-store");return res.status(status).json(body)};
const outputText = data => String(data.output_text||data.output?.flatMap(x=>(x.content||[]).map(p=>p.text||p.output_text||"")).join("\n")||"");
export default async function handler(req,res){
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
  body:JSON.stringify({model:process.env.GENDER_AI_MODEL||"gpt-4.1-mini",instructions,input:`TASK:\n${task}\n\nSTUDENT ${kind.toUpperCase()}:\n${response}`,temperature:0.2,max_output_tokens:1800,store:false,
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
