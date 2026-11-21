/** Webilang AI C1 personalised Stock practice.
 * Accepts account sessions or limited same-origin guest practice; cloud data stays protected.
 * The browser supplies the student's explicitly selected items; it never exposes the OpenAI key.
 */
const SUPABASE_URL=process.env.SUPABASE_URL||'https://molfznxvxuhuaklyfmmc.supabase.co';
const PUBLISHABLE=process.env.SUPABASE_PUBLISHABLE_KEY||'sb_publishable_m4NmBJBx8Lnibu69Vwd1mQ_C5iPw0bI';
const guestLimits=new Map();
function respond(res,status,data){res.setHeader('Cache-Control','no-store');return res.status(status).json(data);}
export default async function handler(req,res){
 if(req.method!=='POST')return respond(res,405,{error:'POST only'});
 try{
  const access=(req.headers.authorization||'').match(/^Bearer\s+(\S+)$/i)?.[1];
  const body=req.body||{},kind=body.type;
  let authenticated=false;
  if(access)try{
   const verify=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:PUBLISHABLE,Authorization:'Bearer '+access},signal:AbortSignal.timeout(6000)});
   authenticated=verify.ok&&!!(await verify.json())?.id;
  }catch{}
  if(!authenticated){
   const host=String(req.headers.host||'').toLowerCase();
   const origin=req.headers.origin&&req.headers.origin!=='null'?req.headers.origin:req.headers.referer;
   try {
    if(!host||(origin?new URL(origin).host.toLowerCase()!==host:req.headers['sec-fetch-site']!=='same-origin'))
     return respond(res,403,{error:'Start AI practice from the Webilang module.'});
   }catch{return respond(res,403,{error:'Start AI practice from the Webilang module.'});}
   const ip=String(req.headers['x-forwarded-for']||req.headers['x-real-ip']||'guest').split(',')[0].trim().slice(0,90);
   const key=ip,now=Date.now(),windowMs=3600000,limit=20;
   const counter=guestLimits.get(key)||{start:now,count:0};
   if(now-counter.start>=windowMs){counter.start=now;counter.count=0;}
   counter.count++;guestLimits.set(key,counter);
   if(guestLimits.size>1500)for(const [k,v] of guestLimits)if(now-v.start>=windowMs)guestLimits.delete(k);
   if(counter.count>limit)return respond(res,429,{error:'Guest AI practice limit reached for now. Please try later.'});
  }
  if(!['words','grammar'].includes(kind))return respond(res,400,{error:'Invalid practice type'});
  if(!Array.isArray(body.items)||body.items.length<1||body.items.length>6)return respond(res,400,{error:'Select between 1 and 6 saved items.'});
  const items=body.items.map(x=>{
   if(typeof x!=='object'||!x)return null;
   return kind==='words'?String(x.word||'').slice(0,130):[x.pattern,x.original,x.corrected,x.rule].map(v=>String(v||'').slice(0,170)).join(' | ');
  }).filter(Boolean);
  if(!items.length)return respond(res,400,{error:'No valid practice items'});
  if(!process.env.OPENAI_API_KEY)return respond(res,503,{error:'OPENAI_API_KEY is not configured in Vercel.'});
  const instruction=`Create exactly FIVE short, diverse C1 English ${kind==='words'?'vocabulary':'grammar'} exercises based strictly on the learner-selected targets. Vary formats: two multiple-choice questions (type choice, exactly 3 or 4 plausible options, and answer must be an option verbatim), two short gap-fill or rewrite tasks (type rewrite), and one meaningful personal speaking/writing task (type open). Use the topic of AI, education, work and real life, with natural C1 English. Include clear model answers and short linguistic explanations. Each question should test the selected pattern(s); avoid invented or contradictory keys. Return only valid JSON.`;
  const schema={type:'object',additionalProperties:false,properties:{exercises:{type:'array',minItems:5,maxItems:5,items:{type:'object',additionalProperties:false,properties:{type:{type:'string',enum:['choice','rewrite','open']},prompt:{type:'string'},options:{type:'array',items:{type:'string'}},answer:{type:'string'},explanation:{type:'string'}},required:['type','prompt','options','answer','explanation']}}},required:['exercises']};
  const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.OPENAI_STOCK_MODEL||'gpt-4o-mini',temperature:0.55,max_tokens:1900,messages:[{role:'system',content:instruction},{role:'user',content:'Student-selected C1 items:\n'+items.map((v,i)=>`${i+1}. ${v}`).join('\n')}],response_format:{type:'json_schema',json_schema:{name:'stock_practice',strict:true,schema}}})});
  const data=await response.json();if(!response.ok)return respond(res,502,{error:'AI practice service unavailable: '+(data.error?.message||response.status)});
  const value=JSON.parse(data.choices?.[0]?.message?.content||'{}');
  if(!Array.isArray(value.exercises)||value.exercises.length!==5)return respond(res,502,{error:'AI practice response was incomplete. Please retry.'});
  return respond(res,200,{exercises:value.exercises});
 }catch(e){return respond(res,500,{error:'Unable to generate practice. '+e.message});}
}
