import crypto from "node:crypto";

const MAX_SECONDS = 300;
const MONTH_SECONDS = 240*60; // Reserved quota, not actual billed usage.
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
 const n=new Date(), end=Date.UTC(n.getUTCFullYear(),n.getUTCMonth()+1,1);
 return Math.max(3600,Math.ceil((end-Date.now())/1000)+3600);
}
function validId(s){return typeof s==="string"&&/^[a-zA-Z0-9_-]{5,100}$/.test(s)}
async function releaseLock(token){
 const current=await redis(["GET",`${PREFIX}:active`]);
 if(current===token)await redis(["DEL",`${PREFIX}:active`]);
}
export default async function handler(req,res){
 if(req.method!=="POST")return json(res,405,{error:"Use POST"});
 if(process.env.TAVUS_LIVE_ENABLED!=="1")return json(res,503,{error:"Live avatar calls are disabled for safety. Add TAVUS_LIVE_ENABLED=1 in Vercel to enable them."});
 try{
   config();
   const body=typeof req.body==="object"&&req.body?req.body:{};
   if(body.action==="start"){
     const scenario=body.scenario;
     if(!["creator","job"].includes(scenario))return json(res,400,{error:"Unknown scenario"});
     const game=String(body.game||"").trim().slice(0,80);
     const job=String(body.job||"teacher").toLowerCase();
     if(scenario==="creator"&&!game)return json(res,400,{error:"Please enter a game"});
     if(scenario==="job"&&!["teacher","tutor","nanny"].includes(job))return json(res,400,{error:"Invalid job"});
     const creator=Number(body.creatorNumber)===2?2:1;
     const env=scenario==="job"?"TAVUS_JOB_INTERVIEWER_PAL_ID":`TAVUS_GAME_CREATOR_${creator===1?"A":"B"}_PAL_ID`;
     const pal=process.env[env];
     if(!validId(pal))return json(res,503,{error:`${env} is missing or invalid`});
     const token=crypto.randomBytes(24).toString("hex");
     const lock=await redis(["SET",`${PREFIX}:active`,token,"EX",360,"NX"]);
     if(lock!=="OK")return json(res,429,{error:"An avatar session is already active. Please try after it ends."});
     const budget=monthKey();
     let reserved=false;
     try{
       const used=Number(await redis(["INCRBY",budget,MAX_SECONDS]));
       reserved=true;
       await redis(["EXPIRE",budget,nextMonthExpiry()]);
       const monthlyLimit=Math.max(MAX_SECONDS,Math.min(144000,Number(process.env.TAVUS_MONTHLY_LIMIT_MINUTES||240)*60||MONTH_SECONDS));
       if(used>monthlyLimit){await redis(["INCRBY",budget,-MAX_SECONDS]);reserved=false;return json(res,429,{error:"Monthly live-avatar allowance reached. Use the text roleplay or ask the teacher."});}
       const context=scenario==="creator"
        ?`This is a fictional game developer interview in A2 English. The student's selected game is ${game}. Explain game facts without claiming you are an actual employee. Help student gather three facts, major challenge, income model, and propose a feature. Each reply <=15 words.`
        :`A2 job interview for ${job} position. You are Morgan, a concerned parent whose child plays too much. Ask one short question per turn about homework, sleep, screen time, calm boundaries and practical solutions. Each reply <=15 words.`;
       const data=await tavus("", "POST", {
         pal_id:pal,conversation_name:"Webilang A2 live roleplay",
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
       // The lock stays set for active calls, released only if no session record was created.
       const session=await redis(["GET",`${PREFIX}:session:${token}`]).catch(()=>null);
       if(!session)await releaseLock(token).catch(()=>{});
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
     await tavus(`/${encodeURIComponent(id)}/end`);
     await redis(["SET",`${PREFIX}:ended:${token}`,"1","EX",7200]);
     await releaseLock(token);
     return json(res,200,{ended:true});
   }
   return json(res,400,{error:"Invalid action"});
 }catch(e){return json(res,500,{error:String(e.message||"Server error").slice(0,180)})}
}
