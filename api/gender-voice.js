const reply=(res,code,data)=>{res.setHeader('Cache-Control','no-store');return res.status(code).json(data)};
export default async function handler(req,res){
 if(req.method!=='POST')return reply(res,405,{error:'POST required'});
 const text=String(req.body?.text||'').trim(),scenario=String(req.body?.scenario||'');
 if(!['babysitter','engineering'].includes(scenario))return reply(res,400,{error:'Invalid scenario'});
 if(!text||text.length>500)return reply(res,400,{error:'Voice text must be 1–500 characters'});
 if(!process.env.OPENAI_API_KEY)return reply(res,503,{error:'OPENAI_API_KEY is not configured'});
 const voice=scenario==='babysitter'?'onyx':'nova';
 const instructions=scenario==='babysitter'
  ?'Speak as Daniel, a friendly 21-year-old British male university student applying to be a babysitter. Warm, genuine, conversational, confident but not salesy. Natural pauses, varied intonation, relaxed medium pace. Never sound like a narrator.'
  :'Speak as Emma, an 18-year-old British female engineering apprentice candidate. Youthful, warm, enthusiastic, occasionally slightly nervous, with a natural conversational rhythm and medium pace. Never sound like a narrator.';
 try{
  const r=await fetch('https://api.openai.com/v1/audio/speech',{
   method:'POST',
   headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},
   body:JSON.stringify({
    model:process.env.GENDER_VOICE_MODEL||'gpt-4o-mini-tts',
    voice,
    input:text,
    instructions,
    response_format:'mp3',
    speed:1.0
   })
  });
  if(!r.ok){
   const d=await r.json().catch(()=>({}));
   throw Error(d.error?.message||'Speech generation failed: HTTP '+r.status);
  }
  const buf=Buffer.from(await r.arrayBuffer());
  if(buf.length>3_500_000)throw Error('Generated audio is too large');
  res.setHeader('Content-Type','audio/mpeg');
  res.setHeader('Content-Length',String(buf.length));
  res.setHeader('Cache-Control','no-store');
  return res.status(200).send(buf);
 }catch(e){
  console.error('Gender voice TTS error:',e.message);
  return reply(res,502,{error:String(e.message||'Voice service unavailable').slice(0,180)});
 }
}
