import agentHandler from "./agent.js";

const PREFIX="webilang:tavus:v1";
const TAVUS="https://tavusapi.com/v2/conversations";
function respond(res,code,data){res.setHeader("Cache-Control","no-store");return res.status(code).json(data)}
function valid(s){return typeof s==="string"&&/^[a-zA-Z0-9_-]{5,100}$/.test(s)}
async function redis(cmd){
 const url=(process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL||"").replace(/\/$/,"");
 const key=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;
 if(!url||!key)throw Error("Redis configuration is missing");
 const response=await fetch(url,{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify(cmd)});
 const result=await response.json();
 if(!response.ok||result.error)throw Error("Redis service unavailable");
 return result.result;
}
function getTranscript(events){
 const found=Array.isArray(events)?events.find(e=>e.event_type==="application.transcription_ready"||e.type==="application.transcription_ready"||e.event==="application.transcription_ready"):null;
 const transcript=found?.properties?.transcript||found?.transcript||found?.data?.properties?.transcript;
 if(!Array.isArray(transcript))return null;
 return transcript.filter(x=>["user","assistant"].includes(x?.role))
  .map(x=>({role:x.role,content:String(x.content||"").trim().slice(0,700)}))
  .filter(x=>x.content).slice(0,60);
}
function outputText(data){
 if(typeof data.output_text==="string")return data.output_text;
 return (data.output||[]).flatMap(o=>(o.content||[]).map(p=>p.text||p.output_text||"")).join("\n");
}
async function evaluateGoals(session,history){
 const scenario=session.scenario;
 const instructions=scenario==="creator"?
 `Evaluate ONLY evidence in the learner's actual spoken lines of a fictional game-creator interview about "${session.game}". Did the learner elicit or discuss THREE distinct game facts (facts 0–3), ask about a major development challenge, ask about how the company makes money, and pitch their own new feature? Mark unmet goals false; do not infer from the avatar's replies alone. Return STRICT JSON: {"facts":0,"biggestChallenge":false,"companyIncome":false,"featureIdea":false,"summary":"2-3 short A2 sentences describing achievements and what to practise next."}`:
 `Evaluate ONLY the student/applicant's recorded answers in a fictional ${session.job} job interview caring for a child with excessive gaming. Judge realistic, caring strategies about homework, sleep, rules, arguments, and balanced activities. Do not assess fluency or penalize English mistakes. Return STRICT JSON {"decision":"hired|consider|not_hired","summary":"2-3 short A2 sentences explaining the decision, based on actual answers."}. If little evidence, use consider, never auto-hire.`;
 const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({
  model:"gpt-5.6-luna",reasoning:{effort:"none"},store:false,
  instructions,input:JSON.stringify(history),max_output_tokens:650
 })});
 const data=await r.json();
 if(!r.ok)throw Error("AI mission evaluation unavailable");
 let parsed;try{parsed=JSON.parse(outputText(data).replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,""))}catch{throw Error("Could not parse mission evaluation")}
 if(scenario==="creator")return {facts:Math.max(0,Math.min(3,Number(parsed.facts)||0)),biggestChallenge:parsed.biggestChallenge===true,companyIncome:parsed.companyIncome===true,featureIdea:parsed.featureIdea===true,summary:String(parsed.summary||"").slice(0,550)};
 return {decision:["hired","consider","not_hired"].includes(parsed.decision)?parsed.decision:"consider",summary:String(parsed.summary||"").slice(0,550)};
}
async function grammarFeedback(session,history){
 let result, statusCode=200;
 const mockReq={method:"POST",body:{mode:"feedback",scenario:session.scenario==="job"?"employer":"creator",game:session.game,job:session.job,history}};
 const mockRes={
  status(code){statusCode=code;return this},
  json(value){result=value;return value}
 };
 await agentHandler(mockReq,mockRes);
 if(statusCode!==200)throw Error(result?.error||"Grammar evaluation unavailable");
 return {feedback:String(result.feedback||""),grammarItems:Array.isArray(result.grammarItems)?result.grammarItems:[]};
}
export default async function handler(req,res){
 if(req.method!=="POST")return respond(res,405,{error:"Use POST"});
 if(process.env.TAVUS_LIVE_ENABLED!=="1")return respond(res,503,{error:"Live avatars disabled"});
 try{
  const body=req.body||{},token=String(body.token||""),conversationId=String(body.conversationId||"");
  if(!/^[0-9a-f]{48}$/.test(token)||!valid(conversationId))return respond(res,400,{error:"Invalid session"});
  const record=await redis(["GET",`${PREFIX}:session:${token}`]);
  if(!record)return respond(res,410,{error:"Session expired. The assessment is no longer available."});
  const session=JSON.parse(record);
  if(session.id!==conversationId)return respond(res,403,{error:"Session mismatch"});
  const cached=await redis(["GET",`${PREFIX}:evaluation:${token}`]);
  if(cached)return respond(res,200,{ready:true,...JSON.parse(cached)});
  const r=await fetch(`${TAVUS}/${encodeURIComponent(conversationId)}?verbose=true`,{
   headers:{"x-api-key":process.env.TAVUS_API_KEY}
  });
  if(!r.ok)throw Error(`Transcript request failed (${r.status})`);
  const conversation=await r.json();
  const history=getTranscript(conversation.events);
  if(!history)return respond(res,202,{ready:false,message:"Tavus is preparing the transcript. Please try again in a moment."});
  const user=history.filter(x=>x.role==="user");
  if(!user.length)return respond(res,200,{ready:true,empty:true,message:"No student speech was found in this call, so no score was assigned."});
  if(!process.env.OPENAI_API_KEY)return respond(res,503,{error:"OPENAI_API_KEY is not configured"});
  const [goals,grammar]=await Promise.all([evaluateGoals(session,history),grammarFeedback(session,history)]);
  const outcome={
    scenario:session.scenario,game:session.game,job:session.job,
    turns:user.length,goals,feedback:grammar.feedback,
    grammarItems:grammar.grammarItems,
    transcript:history
  };
  await redis(["SET",`${PREFIX}:evaluation:${token}`,JSON.stringify(outcome),"EX",7200]);
  return respond(res,200,{ready:true,...outcome});
 }catch(e){console.error("Tavus evaluation error",e);return respond(res,502,{error:String(e.message||"Evaluation failed").slice(0,190)})}
}
