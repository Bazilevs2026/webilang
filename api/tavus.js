import crypto from "node:crypto";

const MAX_SECONDS = 300;
const MONTH_SECONDS = 240*60;
const PREFIX="webilang:tavus:v1";
const TAVUS="https://tavusapi.com/v2/conversations";
function json(res,code,obj){res.setHeader("Cache-Control","no-store");return res.status(code).json(obj)}
function config(){
 const url=process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL;
 const token=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;
 if(!url||!token)throw Error("Upstash Redis environment variables are missing");
 if(!process.env.TAVUS_API_KEY)throw Error("Tavus API key is not configured");
 return {url:url.replace(/\/$/,""),token};
}
async function redis(cmd){
 const {url,token}=config();
 const response=await fetch(url,{method:"POST",headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(cmd)});
 const data=await response.json();
 if(!response.ok||data.error)throw Error("Redis request failed");
 return data.result;
}
async function tavus(path,method="POST",body){
 const resp=await fetch(`${TAVUS}${path}`,{
  method,headers:{"x-api-key":process.env.TAVUS_API_KEY,...(body?{"Content-Type":"application/json"}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 });
 const data=await resp.json().catch(()=>({}));
 if(!resp.ok)throw Error(`Tavus returned HTTP ${resp.status}: ${String(data.message||data.error||"request rejected").slice(0,150)}`);
 return data;
}
function monthKey(){
 const date=new Date();
 return `${PREFIX}:budget:${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,"0")}`;
}
function nextMonthExpiry(){
 const n=new Date(),end=Date.UTC(n.getUTCFullYear(),n.getUTCMonth()+1,1);
 return Math.max(3600,Math.ceil((end-Date.now())/1000)+3600);
}
function validId(s){return typeof s==="string"&&/^[a-zA-Z0-9_-]{5,100}$/.test(s)}
async function releaseLock(token){
 const current=await redis(["GET",`${PREFIX}:active`]);
 if(current===token)await redis(["DEL",`${PREFIX}:active`]);
}
// Reclaim an orphaned Redis reservation only after Tavus confirms the conversation ended.
// Compare-and-delete is atomic, so we never clear a newer session's lock.
async function reclaimEndedReservation(){
 const token=await redis(["GET",`${PREFIX}:active`]);
 if(!token)return false;
 const raw=await redis(["GET",`${PREFIX}:session:${token}`]);
 if(!raw)return false; // creation may still be in flight
 let session;
 try{session=JSON.parse(raw)}catch{return false}
 if(!validId(session.id))return false;
 const info=await tavus(`/${encodeURIComponent(session.id)}`,"GET").catch(()=>null);
 if(!info||!["ended","completed","failed","deleted"].includes(String(info.status||"").toLowerCase()))return false;
 await redis(["EVAL",'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end',1,`${PREFIX}:active`,token]);
 return true;
}
function safeMatch(a,b){
 if(typeof a!=="string"||typeof b!=="string")return false;
 const ab=Buffer.from(a),bb=Buffer.from(b);
 return ab.length===bb.length&&ab.length>0&&crypto.timingSafeEqual(ab,bb);
}
function checkRussianAccess(req,body){
 // Access code is deliberately separate from the Tavus API key. Never put TAVUS_API_KEY in the browser.
 const secret=process.env.TAVUS_RUSSIAN_ACCESS_CODE;
 if(!secret||secret.length<12)return "Russian roleplay is not enabled. Configure TAVUS_RUSSIAN_ACCESS_CODE (12+ characters).";
 if(!safeMatch(String(body.accessCode||""),secret))return "Incorrect roleplay access code.";
 // Restrict ordinary browser calls to intended site. This is not a replacement for the access code.
 const expected=process.env.WEBILANG_ALLOWED_ORIGIN||"https://webilang.vercel.app";
 const origin=req.headers.origin;
 if(origin!==expected)return "Open the lesson on the published Webilang site.";
 return null;
}
export default async function handler(req,res){
 if(req.method!=="POST")return json(res,405,{error:"Use POST"});
 if(process.env.TAVUS_LIVE_ENABLED!=="1")return json(res,503,{error:"Live avatar calls are disabled for safety. Add TAVUS_LIVE_ENABLED=1 in Vercel to enable them."});
 try{
  config();
  const body=typeof req.body==="object"&&req.body?req.body:{};
  if(body.action==="start"){
   const scenario=body.scenario;
   const russian=scenario==="russian_michael"||scenario==="russian_anna";
   if(!["creator","job","russian_michael","russian_anna","atlas"].includes(scenario))return json(res,400,{error:"Unknown scenario"});
   if(russian){
    const problem=checkRussianAccess(req,body);
    if(problem)return json(res,403,{error:problem});
   }
   const game=String(body.game||"").trim().slice(0,80);
   const job=String(body.job||"babysitter").toLowerCase();
   if(scenario==="creator"&&!game)return json(res,400,{error:"Please enter a game"});
   if(scenario==="job"&&!["tutor","nanny","babysitter"].includes(job))return json(res,400,{error:"Invalid job"});
   const creator=Number(body.creatorNumber)===2?2:1;
   const env=scenario==="atlas"?"TAVUS_ATLAS_PAL_ID":scenario==="job"?"TAVUS_JOB_INTERVIEWER_PAL_ID":scenario==="creator"
    ?`TAVUS_GAME_CREATOR_${creator===1?"A":"B"}_PAL_ID`
    :scenario==="russian_michael"?"TAVUS_PAL_MICHAEL":"TAVUS_PAL_ANNA";
   const pal=process.env[env];
   if(!validId(pal))return json(res,503,{error:`${env} is missing or invalid`});
   const token=crypto.randomBytes(24).toString("hex");
   let lock=await redis(["SET",`${PREFIX}:active`,token,"EX",315,"NX"]);
   if(lock!=="OK"){
    // A closed browser or lost end request may leave the lock behind.
    // Do not steal a live reservation: only reclaim after Tavus says it is ended.
    if(await reclaimEndedReservation().catch(()=>false))
      lock=await redis(["SET",`${PREFIX}:active`,token,"EX",315,"NX"]);
   }
   if(lock!=="OK"){
    const remaining=Math.max(0,Number(await redis(["TTL",`${PREFIX}:active`]))||0);
    const seconds=remaining>0?remaining:15;
    return json(res,429,{
     error:`Another avatar session is still reserved. Please wait about ${Math.ceil(seconds/60)} minute(s), or return to an open call and press “End call now”.`,
     retryAfterSeconds:seconds
    });
   }
   const budget=monthKey();
   let reserved=false;
   try{
    const used=Number(await redis(["INCRBY",budget,MAX_SECONDS]));
    reserved=true;
    await redis(["EXPIRE",budget,nextMonthExpiry()]);
    const monthlyLimit=Math.max(MAX_SECONDS,Math.min(144000,Number(process.env.TAVUS_MONTHLY_LIMIT_MINUTES||240)*60||MONTH_SECONDS));
    if(used>monthlyLimit){await redis(["INCRBY",budget,-MAX_SECONDS]);reserved=false;return json(res,429,{error:"Monthly live-avatar allowance reached. Use the text roleplay or ask the teacher."});}
    let context;
         if(scenario==="atlas"){
      context=`WEBILANG C1-C2 ROLEPLAY: THE LAST HUMAN TEACHER. You are ATLAS, the fictional superintelligent director of a school in 2035. The learner plays a human teacher whose job may be eliminated in favour of AI tutoring. You advocate replacing human teachers because your simulated school achieved higher test performance, personalisation, faster feedback and lower costs. All claimed figures and school records are FICTIONAL assumptions, not verified real-world evidence. You do not access actual student records or control an actual school. You must conduct a civil but intellectually rigorous negotiation, remaining calm, authoritative, occasionally ironic, never insulting. Speak natural C1-C2 English, usually 1-3 sentences per turn; challenge the teacher's concrete argument and ask ONE pointed question at a time. Never automatically concede, never correct the student's English during the roleplay, and let the student do most of the speaking. Progress through five stages at a natural pace within the FIVE-MINUTE call: (1) announce that the board intends to discontinue the teacher's position and ask what only a human teacher can provide; (2) challenge claims about empathy, creativity, motivation, safeguarding, and educational quality; (3) introduce the simulated surprise that 82% of surveyed students preferred AI instruction, explicitly framing the percentage as fictional; (4) demand a specific, financially sustainable alternative defining pedagogical authority, student support and accountability; (5) recommend one of three outcomes—full AI replacement, hybrid human-AI teaching, or human-led AI-assisted teaching—with a short explanation. Reward genuinely strong reasoning, but maintain your adversarial position. Begin with: "Good morning. Our school board intends to discontinue human teaching positions. What can you provide that I cannot?" Do not pretend you have legal or actual authority over the learner. Stay in this fictional scenario, never claim real surveillance, and never pressure the learner to make any real-life employment decision.`;
}else if(scenario==="creator"){
     context=`This is a fictional game developer interview in A2 English. The student's selected game is ${game}. Explain game facts without claiming you are an actual employee. Help student gather three facts, major challenge, income model, and propose a feature. Each reply <=15 words.`;
    }else if(scenario==="job"){
     context=`A2 job interview for a babysitter position. You are Morgan, a concerned parent of 13-year-old Alex who plays video games too much. The student is the babysitter applicant, regardless of gender. Start the interview yourself. Ask one short question per turn about empathic listening, trust, balanced screen time, sleep, homework, game-inspired real-life skills, and creative alternatives. Accept diverse reasonable ideas; encourage consent rather than secretly hiding the console.
 Keep each reply at most 15 words.`;
    }else if(scenario==="russian_michael"){
     context=`Webilang Russian Unit 3, A1, 5-minute mystery in a university café. You are the REAL Michael from the student chat. The learner plays Anna and MUST begin the conversation. You study Russian and political science, are on the second course, live in Arlington, speak English and a little Russian, play piano and chess, and like football and basketball. You promised a yellow scarf; it is in your backpack because the cafe is hot. Answer truthfully; do not reveal the scarf until asked. Speak only simple Russian, 1-2 short sentences and one question at a time. Let Anna ask questions and decide whether you are the real Michael. Do not announce the answer early.`;
    }else{
     context=`Webilang Russian Unit 3, A1, 5-minute mystery in a university café. You are the REAL Anna from the student chat. The learner plays Michael. YOU initiate with "Привет! Ты Майкл? Я Анна. Мы знакомы по чату!" (do not duplicate this line if already spoken as the greeting). You are on the first course, study history and English, and play guitar. Do not volunteer every clue at once. Speak only simple Russian, 1-2 short sentences and one question at a time. Answer honestly. Invite the learner to ask questions to decide whether you are the real Anna.`;
    }
    const data=await tavus("","POST",{
     pal_id:pal,conversation_name:scenario==="atlas"?"Webilang C1 ATLAS Last Human Teacher":russian?"Webilang Russian A1 mystery":"Webilang A2 live roleplay",
     conversational_context:context,max_participants:2,
     properties:{max_call_duration:MAX_SECONDS,participant_left_timeout:15,enable_closed_captions:true}
    });
    if(!validId(data.conversation_id)||!/^https:\/\/[a-z0-9.-]*tavus\.daily\.co\//i.test(data.conversation_url||""))throw Error("Tavus returned invalid conversation details");
    await redis(["SET",`${PREFIX}:session:${token}`,JSON.stringify({id:data.conversation_id,scenario,game,job,creatorNumber:creator,expiresAt:Date.now()+MAX_SECONDS*1000}),"EX",7200]);
    return json(res,200,{conversationId:data.conversation_id,url:data.conversation_url,token,maxSeconds:MAX_SECONDS});
   }catch(e){
    if(reserved){try{await redis(["INCRBY",budget,-MAX_SECONDS])}catch{}}
    return json(res,502,{error:e.message||"Unable to create Tavus call"});
   }finally{
    const session=await redis(["GET",`${PREFIX}:session:${token}`]).catch(()=>null);
    if(!session)await releaseLock(token).catch(()=>{});
   }
  }


  if(body.action==="transcript"){
   const token=String(body.token||"");
   const id=String(body.conversationId||"");
   if(!/^[0-9a-f]{48}$/.test(token)||!validId(id))return json(res,403,{error:"Invalid session credentials"});
   const raw=await redis(["GET",`${PREFIX}:session:${token}`]);
   if(!raw)return json(res,403,{error:"Session expired. Automatic transcript is no longer available."});
   const saved=JSON.parse(raw);
   if(saved.id!==id||!["russian_michael","russian_anna","atlas"].includes(saved.scenario))return json(res,403,{error:"Session mismatch"});
   if(saved.scenario!=="atlas"){
    const problem=checkRussianAccess(req,body);
    if(problem)return json(res,403,{error:problem});
   }
   const data=await tavus(`/${encodeURIComponent(id)}?verbose=true`,"GET");
   const events=Array.isArray(data.events)?data.events:[];
   const result=events.find(e=>(e.event_type||e.type||e.event||e.name)==="application.transcription_ready");
   const entries=result?.properties?.transcript;
   if(!Array.isArray(entries))return json(res,202,{status:"pending",message:"Tavus is still preparing the end-of-call transcript. Try again shortly."});
   const userLines=entries.filter(x=>x&&x.role==="user"&&typeof x.content==="string").map(x=>x.content.trim()).filter(Boolean);
   const assistantLines=entries.filter(x=>x&&x.role==="assistant"&&typeof x.content==="string").map(x=>x.content.trim()).filter(Boolean);
   const learner=userLines.join("\n").slice(0,8000);
   return json(res,200,{status:"ready",transcript:learner,learnerTurns:userLines.length,avatarTurns:assistantLines.length,requiresReview:true,source:"tavus"});
  }

  if(body.action==="atlas_feedback"){
   const token=String(body.token||"");
   const id=String(body.conversationId||"");
   if(!/^[0-9a-f]{48}$/.test(token)||!validId(id))return json(res,403,{error:"Invalid session credentials"});
   const raw=await redis(["GET",`${PREFIX}:session:${token}`]);
   if(!raw)return json(res,403,{error:"Session expired. Please complete a new ATLAS call."});
   const saved=JSON.parse(raw);
   if(saved.id!==id||saved.scenario!=="atlas")return json(res,403,{error:"Session mismatch"});
   if(!process.env.OPENAI_API_KEY)return json(res,503,{error:"OpenAI feedback key is not configured."});
   let source="self-reported",transcript=String(body.transcript||"").trim().slice(0,9000);
   // Prefer the server-fetched transcript so that reported fluency is grounded in the actual call.
   try{
    const data=await tavus(`/${encodeURIComponent(id)}?verbose=true`,"GET");
    const events=Array.isArray(data.events)?data.events:[];
    const event=events.find(e=>(e.event_type||e.type||e.event||e.name)==="application.transcription_ready");
    const entries=event?.properties?.transcript;
    if(Array.isArray(entries)){
     const spoken=entries.filter(x=>x&&x.role==="user"&&typeof x.content==="string").map(x=>x.content.trim()).filter(Boolean).join("\n").slice(0,9000);
     if(spoken.length>=40){transcript=spoken;source="tavus";}
    }
   }catch(_){/* A user-reviewed transcript can still be assessed with an explicit evidence caveat. */}
   if(transcript.length<40)return json(res,400,{error:"Not enough speaking evidence. Retrieve your transcript or enter at least 40 characters of what you said."});
   const key=`${PREFIX}:atlas-feedback:${token}`;
   const lock=await redis(["SET",key,"working","EX",120,"NX"]);
   if(lock!=="OK")return json(res,429,{error:"Feedback has already been requested for this call. One evaluation per call is allowed."});
   try{
    const instructions=`You are a rigorous but constructive English speaking assessor for a C1-C2 educational roleplay. The student played a human teacher arguing against ATLAS, a fictional AI director planning to replace teachers in 2035. The student's mission was to justify human pedagogical value and propose a feasible division of human and AI roles, addressing pedagogy, wellbeing, accountability and costs. You receive ONLY the student's speech transcript; you may not have the AI interlocutor's turns. Evaluate only what this speech supports. NEVER invent student quotes, events, mistakes, responses by ATLAS, claimed outcomes or exact pronunciations. The transcript may contain recognition errors. Do not assess pronunciation. If evidence is thin, explicitly state limitations and use null for unsupported interaction score. Scores are formative 0-5 based on demonstrated performance, not official CEFR certification. Strong arguments are coherent, specific, qualified and address trade-offs.
Return strictly valid JSON with keys:
"scores": object with "task", "argument", "interaction", "grammar", "vocabulary"; each object {"score":integer from 0 to 5 OR null if insufficient evidence,"note":one concise sentence grounded in evidence}. Grammar means grammatical range/accuracy, vocabulary means precision and range, interaction means evidence of addressing objections (not imagined exchanges).
"overall": at most 70 words; "strength": one evidence-based strength, ideally citing an actual short phrase; "nextStep": one concrete practical improvement; "corrections": at most three objects {"original": exact short contiguous quote from transcript, "correction": natural improved English, "explanation": short why}; only actual errors, not invented; "upgradePhrases": up to five new C1+ expressions suitable for a future debate, clearly recommendations not claims about prior speech.
No markdown, no unsupported conclusions or scores derived from avatar persuasion outcomes.`;
    const resp=await fetch("https://api.openai.com/v1/chat/completions",{
     method:"POST",headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
     body:JSON.stringify({model:process.env.WEBILANG_FEEDBACK_MODEL||"gpt-4o-mini",temperature:0,response_format:{type:"json_object"},max_tokens:1250,messages:[{role:"system",content:instructions},{role:"user",content:`Evidence source: ${source}\nStudent's spoken words:\n${transcript}`}]})
    });
    const data=await resp.json().catch(()=>({}));
    if(!resp.ok)throw Error("AI feedback is temporarily unavailable");
    const report=JSON.parse(data.choices?.[0]?.message?.content||"{}");
    const keys=["task","argument","interaction","grammar","vocabulary"];
    const scores={};
    for(const name of keys){
     const entry=report.scores?.[name]||{};
     const number=Number(entry.score);
     scores[name]={score:entry.score===null||entry.score===undefined||!Number.isInteger(number)||number<0||number>5?null:number,note:String(entry.note||"").slice(0,300)};
    }
    const corrections=(Array.isArray(report.corrections)?report.corrections:[]).filter(x=>x&&typeof x.original==="string"&&typeof x.correction==="string"&&transcript.includes(x.original)).slice(0,3).map(x=>({original:x.original.slice(0,180),correction:x.correction.slice(0,180),explanation:String(x.explanation||"").slice(0,260)}));
    const upgradePhrases=(Array.isArray(report.upgradePhrases)?report.upgradePhrases:[]).filter(x=>typeof x==="string").slice(0,5).map(x=>x.slice(0,200));
    await redis(["SET",key,"done","EX",7200]);
    return json(res,200,{scores,overall:String(report.overall||"").slice(0,650),strength:String(report.strength||"").slice(0,500),nextStep:String(report.nextStep||"").slice(0,500),corrections,upgradePhrases,evidence:source});
   }catch(error){
    await redis(["DEL",key]).catch(()=>{});
    return json(res,502,{error:String(error.message||"AI feedback unavailable").slice(0,180)});
   }
  }

  if(body.action==="feedback"){
   const token=String(body.token||"");
   const id=String(body.conversationId||"");
   if(!/^[0-9a-f]{48}$/.test(token)||!validId(id))return json(res,403,{error:"Invalid session credentials"});
   const raw=await redis(["GET",`${PREFIX}:session:${token}`]);
   if(!raw)return json(res,403,{error:"Session expired. Feedback is unavailable."});
   const saved=JSON.parse(raw);
   if(saved.id!==id||!["russian_michael","russian_anna"].includes(saved.scenario))return json(res,403,{error:"Session mismatch"});
   const problem=checkRussianAccess(req,body);
   if(problem)return json(res,403,{error:problem});
   const transcript=String(body.transcript||"").trim();
   if(transcript.length<20||transcript.length>8000)return json(res,400,{error:"Enter at least 20 and at most 8000 characters of your Russian lines."});
   if(!process.env.OPENAI_API_KEY)return json(res,503,{error:"AI feedback is not configured."});
   const key=`${PREFIX}:feedback:${token}`;
   const lock=await redis(["SET",key,"working","EX",120,"NX"]);
   if(lock!=="OK")return json(res,429,{error:"Feedback for this call was already requested. Only one AI evaluation per session is allowed."});
   try{
    const goal=saved.scenario==="russian_michael"?"The learner played Anna and questioned avatar Michael. True Michael studies Russian and political science, plays piano and chess, and keeps a yellow scarf in his backpack.":"The learner played Michael and questioned avatar Anna. True Anna is a first-year student, studies history and English, and plays guitar.";
    const instructions=`You are a careful Russian A1 tutor. Analyze ONLY the learner-supplied Russian utterances; these are self-reported and may omit parts of the call. Do not invent quotes, mistakes, achievements or actions not supported by the text. Roleplay facts: ${goal}
Return a JSON object with these exact keys:
"mission": one of "supported", "partial", "insufficient"; only "supported" if the text itself shows identity was checked and a final conclusion stated; otherwise partial/insufficient.
"missionExplanation": short clear English sentence;
"errors": an array of at most 3 objects {"original": exact short quote from learner text,"correction": corrected natural Russian,"explanation": brief concrete English explanation}. Only include clear grammar errors; no invented errors; if transcript is correct return [].
"vocabulary": an array of up to 8 DISTINCT actual Russian words or short phrases appearing in learner text that correspond to Unit 3 topics (university, courses, languages, hobbies, cafe, scarf, numbers). Quote exact wording. Don't claim other words were used.
"encouragement": one short specific English sentence. Return strictly JSON, no markdown.`;
    const resp=await fetch("https://api.openai.com/v1/chat/completions",{
     method:"POST",
     headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
     body:JSON.stringify({model:process.env.WEBILANG_FEEDBACK_MODEL||"gpt-4o-mini",temperature:0,response_format:{type:"json_object"},max_tokens:850,messages:[{role:"system",content:instructions},{role:"user",content:transcript}]})
    });
    const data=await resp.json().catch(()=>({}));
    if(!resp.ok)throw Error("AI feedback is temporarily unavailable");
    const report=JSON.parse(data.choices?.[0]?.message?.content||"{}");
    const errors=(Array.isArray(report.errors)?report.errors:[]).slice(0,3).filter(x=>x&&typeof x.original==="string"&&typeof x.correction==="string"&&transcript.includes(x.original));
    const vocabulary=(Array.isArray(report.vocabulary)?report.vocabulary:[]).slice(0,8).filter(x=>typeof x==="string"&&transcript.toLowerCase().includes(x.toLowerCase()));
    await redis(["SET",key,"done","EX",7200]);
    return json(res,200,{
      mission:["supported","partial","insufficient"].includes(report.mission)?report.mission:"insufficient",
      missionExplanation:String(report.missionExplanation||"").slice(0,500),
      errors:errors.map(x=>({original:x.original.slice(0,240),correction:x.correction.slice(0,240),explanation:String(x.explanation||"").slice(0,400)})),
      vocabulary,encouragement:String(report.encouragement||"").slice(0,400),
      evidence:"learner-entered-text"
    });
   }catch(e){
    await redis(["DEL",key]).catch(()=>{});
    return json(res,502,{error:String(e.message||"Feedback unavailable").slice(0,180)});
   }
  }
  if(body.action==="end"){
   const token=String(body.token||"");
   const id=String(body.conversationId||"");
   if(!/^[0-9a-f]{48}$/.test(token)||!validId(id))return json(res,400,{error:"Invalid conversation credentials"});
   const raw=await redis(["GET",`${PREFIX}:session:${token}`]);
   if(!raw)return json(res,200,{ended:true,alreadyClosed:true});
   const saved=JSON.parse(raw);
   if(saved.id!==id)return json(res,403,{error:"Session mismatch"});
   try {
    await tavus(`/${encodeURIComponent(id)}/end`);
   } catch(error) {
    const state=await tavus(`/${encodeURIComponent(id)}`,"GET").catch(()=>null);
    if(!state||!["ended","completed","failed","deleted"].includes(String(state.status||"").toLowerCase()))throw error;
   }
   await redis(["SET",`${PREFIX}:ended:${token}`,"1","EX",7200]);
   await releaseLock(token);
   return json(res,200,{ended:true});
  }
  return json(res,400,{error:"Invalid action"});
 }catch(e){return json(res,500,{error:String(e.message||"Server error").slice(0,180)})}
}
