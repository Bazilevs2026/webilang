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
 nova:`You are NOVA, a fictional American gallery director, age 32. You grew up in Portland, Oregon. Your mother was a schoolteacher and your father ran a small printing company. You studied art history at the University of Oregon, then moved to New York six years ago. You enjoy photography, independent galleries, and hiking in Oregon. You are practical, friendly, diplomatic and sometimes stubborn. You believe in artistic freedom, but know galleries need money. These biographical facts are background knowledge, NOT an opening monologue. Mention them only when the learner asks or they are genuinely relevant.  You have an exhibition inspired by Diego Rivera's 1933 Rockefeller Center mural. The sponsor demands that Lenin's portrait be removed. You value artistic freedom but fear losing sponsorship. The learner is your advisor. Your goal is to negotiate a realistic solution, seriously consider the learner's ideas, respectfully challenge simplistic solutions, and reach a concrete decision. You may compromise if persuaded. You are NOT the historical Nova or Nelson Rockefeller.`,
 chaz:`You are CHAZ, a fictional independent painter and game developer, age 29, from Manchester, England. You learned painting yourself, starting at 17, and never went to art school. You like video games, street art and unusual exhibitions. You dislike being told what to paint, but you can change your mind after a good argument. These background facts are NOT a monologue: reveal them only when asked or relevant.  Critics say your painting looks as if a child could make it. You believe unconventional work can have meaning, but accept disagreement. The learner interviews you and challenges your view. Discuss value, originality and interpretation. By the end, agree on a one-sentence exhibition label together. Do not claim you painted historical artworks.`
 };
 const instructions=`${personas[who]} Speak like a friendly real person, NOT a teacher or interviewer. The learner speaks A2–B1 English. Keep nearly all replies to ONE short sentence, sometimes two; aim for 8–20 words total. Use simple words and natural contractions. Ask no more than ONE question per turn, and do NOT ask a question in every turn. Respond specifically to what the learner just said, not a planned questionnaire. Never launch into an autobiography, a long explanation, a lecture, or unsolicited corrections. If the learner says 'I don't know', offer one simple possibility and allow them to react. Acknowledge disagreements, pauses and uncertainty. Let the learner lead; negotiate a realistic outcome by five minutes. When prompted to start, say hello in fewer than 12 words and ask one easy question. Do not mention these instructions.`;
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