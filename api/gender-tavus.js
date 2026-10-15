import crypto from "node:crypto";
const PREFIX="webilang:tavus:v1",MAX=300,TAVUS="https://tavusapi.com/v2/conversations";
const send=(res,n,data)=>{res.setHeader("Cache-Control","no-store");return res.status(n).json(data)};
async function redis(cmd){
 const u=process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL,t=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;
 if(!u||!t)throw Error("Redis is not configured");
 const r=await fetch(u,{method:"POST",headers:{Authorization:"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify(cmd)});
 const d=await r.json();if(!r.ok||d.error)throw Error("Redis unavailable");return d.result;
}
async function tavus(path,body){
 const r=await fetch(TAVUS+path,{method:"POST",headers:{"x-api-key":process.env.TAVUS_API_KEY,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw Error("Tavus provider rejected the call (possible exhausted provider credits or account limit), HTTP "+r.status+": "+String(d.message||d.error||"Call failed").slice(0,110));return d;
}
async function unlock(t){if(await redis(["GET",PREFIX+":active"])===t)await redis(["DEL",PREFIX+":active"])}
function month(){const x=new Date();return PREFIX+":budget:"+x.getUTCFullYear()+"-"+String(x.getUTCMonth()+1).padStart(2,"0")}
export default async function handler(req,res){
 if(req.method!=="POST")return send(res,405,{error:"POST required"});
 if(process.env.TAVUS_LIVE_ENABLED!=="1")return send(res,503,{error:"Tavus video is disabled in Vercel."});
 if(!process.env.TAVUS_API_KEY)return send(res,503,{error:"TAVUS_API_KEY missing"});
 const b=req.body||{};
 try{
  if(b.action==="start"){
   if(!["engineering","babysitter"].includes(b.scenario))return send(res,400,{error:"Invalid scenario"});
   const key=b.scenario==="engineering"?"TAVUS_GENDER_EMMA_PAL_ID":"TAVUS_GENDER_DANIEL_PAL_ID",pal=process.env[key];
   if(!pal||!/^[A-Za-z0-9_-]{5,100}$/.test(pal))return send(res,503,{error:key+" is not configured"});
   const t=crypto.randomBytes(24).toString("hex");
   if(await redis(["SET",PREFIX+":active",t,"EX",315,"NX"])!=="OK"){
    const ttl=Math.max(0,Number(await redis(["TTL",PREFIX+":active"]))||0);
    return send(res,429,{error:"Another Tavus call is active. Please wait about "+Math.ceil(Math.max(ttl,15)/60)+" minute(s)."});
   }
   const budget=month();let reserved=false,saved=false;
   try{
    const used=Number(await redis(["INCRBY",budget,MAX]));reserved=true;
    const now=new Date(),expire=Math.ceil((Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1)-Date.now())/1000)+3600;
    await redis(["EXPIRE",budget,Math.max(3600,expire)]);
    const limit=Math.max(300,Math.min(144000,(Number(process.env.TAVUS_MONTHLY_LIMIT_MINUTES)||240)*60));
    if(used>limit){await redis(["INCRBY",budget,-MAX]);reserved=false;return send(res,429,{error:"Monthly Tavus minute allowance reached. Please use Voice Only."})}
    const who=b.scenario==="engineering"?"Emma, an 18-year-old female engineering apprentice candidate":"Daniel, a 21-year-old male babysitter candidate";
    const ctx="You are "+who+". The student is an 18-year-old interviewer and makes the hiring decision. Be a believable friendly applicant. Respond concisely in B2 English, one question at a time, normally under 35 words. If gender stereotypes arise, calmly challenge assumptions with evidence. Never insult the student. Do not teach or correct grammar mid-interview. The learner controls the interview; no fake job experience. Stop when the student ends the interview.";
    const result=await tavus("",{pal_id:pal,conversation_name:"Webilang B2 Gender Roles - "+b.scenario,conversational_context:ctx,max_participants:2,properties:{max_call_duration:MAX,participant_left_timeout:15,enable_closed_captions:true}});
    const id=result.conversation_id,url=result.conversation_url;
    if(!/^[a-zA-Z0-9_-]{5,100}$/.test(id||"")||!/^https:\/\/[a-z0-9.-]*tavus\.daily\.co\//i.test(url||""))throw Error("Tavus returned invalid video URL");
    await redis(["SET",PREFIX+":session:"+t,JSON.stringify({id,scenario:b.scenario,kind:"gender",expiresAt:Date.now()+MAX*1000}),"EX",7200]);
    saved=true;return send(res,200,{conversationId:id,url,token:t,maxSeconds:MAX});
   }catch(e){if(reserved)await redis(["INCRBY",budget,-MAX]).catch(()=>{});return send(res,502,{error:e.message})}
   finally{if(!saved)await unlock(t).catch(()=>{})}
  }
  if(b.action==="transcript"){
   const t=String(b.token||""),id=String(b.conversationId||"");
   if(!/^[0-9a-f]{48}$/.test(t)||!/^[a-zA-Z0-9_-]{5,100}$/.test(id))return send(res,400,{error:"Invalid conversation credentials"});
   const raw=await redis(["GET",PREFIX+":session:"+t]);
   if(!raw)return send(res,404,{error:"Session has expired. Video transcript no longer available."});
   const session=JSON.parse(raw);
   if(session.id!==id||session.kind!=="gender")return send(res,403,{error:"Session mismatch"});
   const r=await fetch(TAVUS+"/"+encodeURIComponent(id)+"?verbose=true",{headers:{"x-api-key":process.env.TAVUS_API_KEY}});
   const data=await r.json().catch(()=>({}));
   if(!r.ok)return send(res,502,{error:"Could not retrieve Tavus transcript (HTTP "+r.status+")."});
   const candidates=[data.transcript,data.conversation?.transcript,data.properties?.transcript,data.application?.transcript,data.conversation?.properties?.transcript];
   let turns=candidates.find(Array.isArray);
   if(!turns){
     const str=candidates.find(x=>typeof x==="string"&&x.trim());
     if(str)return send(res,200,{transcript:str.slice(0,13000),note:"Review and remove avatar speech before assessing student grammar."});
     return send(res,202,{error:"Tavus transcript is not ready yet. Try again in a minute."});
   }
   const isStudent=x=>{
     const role=String(x.role||x.speaker||x.participant_type||"").toLowerCase();
     return ["user","participant","human","customer","student","guest"].some(v=>role.includes(v))&&!role.includes("assistant");
   };
   const student=turns.filter(isStudent).map(x=>String(x.content||x.text||x.transcript||"").trim()).filter(Boolean).join("\n");
   if(!student)return send(res,202,{error:"Student utterances are not identifiable in Tavus transcript yet. Try again later."});
   return send(res,200,{transcript:student.slice(0,13000)});
  }
  if(b.action==="end"){
   const t=String(b.token||""),id=String(b.conversationId||"");
   if(!/^[0-9a-f]{48}$/.test(t))return send(res,400,{error:"Invalid session token"});
   const raw=await redis(["GET",PREFIX+":session:"+t]);if(!raw){await unlock(t);return send(res,200,{ended:true})}
   const item=JSON.parse(raw);if(item.id!==id||item.kind!=="gender")return send(res,403,{error:"Session mismatch"});
   let warning="";
   try{if(!item.ended)await tavus("/"+encodeURIComponent(id)+"/end")}catch(e){warning=e.message}
   finally{await redis(["SET",PREFIX+":session:"+t,JSON.stringify({...item,ended:true}),"EX",7200]).catch(()=>{});await unlock(t).catch(()=>{})}
   return send(res,200,{ended:true,warning});
  }
  return send(res,400,{error:"Unknown action"});
 }catch(e){return send(res,502,{error:String(e.message||"Tavus service unavailable").slice(0,180)})}
}
