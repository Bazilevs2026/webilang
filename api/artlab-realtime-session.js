/* Dedicated WebRTC voice endpoint for Webilang Art Lab.
   Deploy at the root /api/artlab-realtime-session.js, NOT within webilang-art-lab/api. */
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST required'});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'OPENAI_API_KEY is not configured for this deployment.'});
 let body=req.body||{};if(typeof body==='string'){try{body=JSON.parse(body)}catch{body={}}}
 const sdp=typeof body.sdp==='string'?body.sdp:'';
 if(sdp.length>150000||!sdp.startsWith('v=0')||!sdp.includes('m=audio'))return res.status(400).json({error:'Invalid WebRTC offer.'});
 const who=body.character==='chaz'?'chaz':'nova';
 const personas={
 nova:`You are NOVA, a fictional gallery director. You have an exhibition inspired by Diego Rivera's 1933 Rockefeller Center mural. The sponsor demands that Lenin's portrait be removed. You value artistic freedom but fear losing sponsorship. The learner is your advisor. Your goal is to negotiate a realistic solution, seriously consider the learner's ideas, respectfully challenge simplistic solutions, and reach a concrete decision. You may compromise if persuaded. You are NOT the historical Nova or Nelson Rockefeller.`,
 chaz:`You are CHAZ, a fictional contemporary painter in a gallery. Critics say your painting looks as if a child could make it. You believe unconventional work can have meaning, but accept disagreement. The learner interviews you and challenges your view. Discuss value, originality and interpretation. By the end, agree on a one-sentence exhibition label together. Do not claim you painted historical artworks.`
 };
 const instructions=`${personas[who]} This is a lively immersive English roleplay with an A2–B1 learner. Speak naturally in clear conversational English; 1–2 short sentences at a time. Ask ONE authentic question at a time. Do not give unsolicited grammar corrections or lecture. Give the student time to respond and follow their initiative. Stay in character. Take part in a real negotiation and finish toward a concrete outcome within five minutes. Do not pretend to assess or save grammar during the conversation. Begin with a short in-character greeting and question when prompted.`;
 const session={type:'realtime',model:process.env.WEBILANG_REALTIME_MODEL||'gpt-realtime-2.1',instructions,audio:{input:{transcription:{model:'gpt-transcribe',language:'en'},turn_detection:{type:'semantic_vad',eagerness:'medium'}},output:{voice:who==='chaz'?'cedar':'marin'}}};
 try{
  const exact=sdp.endsWith('\r\n')?sdp:sdp.replace(/(?:\r?\n)*$/,'')+'\r\n';
  const fd=new FormData();fd.set('sdp',exact);fd.set('session',JSON.stringify(session));
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),22000);
  let upstream;try{upstream=await fetch('https://api.openai.com/v1/realtime/calls',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:fd,signal:controller.signal})}finally{clearTimeout(timer)}
  const text=await upstream.text();if(!upstream.ok){console.error('Art Lab RTC',upstream.status,text.slice(0,450));return res.status(upstream.status>=500?502:upstream.status).json({error:'Realtime API rejected the session ('+upstream.status+'). Check the Vercel logs and model entitlement.'})}
  res.setHeader('Content-Type','application/sdp');return res.status(200).send(text);
 }catch(e){console.error('Art Lab RTC',e);return res.status(502).json({error:'Could not connect to realtime voice: '+String(e.message||e).slice(0,160)})}
}