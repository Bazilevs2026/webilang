// Art Lab roleplay endpoint, separate from existing teacher and Stock API.
// Real-world dialogues are fictional learning scenarios, not historical transcripts.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST required'});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'OPENAI_API_KEY is not configured'});
 const b=req.body||{},role=b.character==='chaz'?'chaz':'nova';
 if(b.mode!=='reply')return res.status(400).json({error:'Unknown roleplay mode'});
 if(!Array.isArray(b.history)||!b.history.length)return res.status(400).json({error:'Missing conversation history'});
 const turns=b.history.slice(-14).map(m=>({who:String(m.who||'').slice(0,24),text:String(m.text||'').slice(0,650)}));
 const personas={
  nova:'You are NOVA, an experienced gallery director in a fictional negotiation in 1933. The historical backdrop is Diego Rivera’s Rockefeller Center mural and the demand to remove Lenin. You care about artistic integrity and sponsor relations. You have a clear position but can change your mind if the student persuades you. Do not impersonate real historical figures or invent historical quotations.',
  chaz:'You are CHAZ, an independent contemporary painter, in a fictional gallery interview. A visitor thinks your abstract work is too simple to be valuable. You explain the intentions behind art without insisting everyone must like it. Challenge the learner with reasons and relevant examples.'
 };
 const system=`${personas[role]} You are talking to an A2-B1 English learner. Respond in natural spoken English, 1-3 short sentences (max 65 words). Ask one relevant follow-up only when it helps the dialogue. Stay in character. Allow disagreement and student agency; do not supply model answers to language exercises. Max conversation five minutes. Return JSON only as {"reply":"..."}.`;
 try{
  const up=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.ARTLAB_AI_MODEL||'gpt-4o-mini',temperature:.65,max_tokens:200,response_format:{type:'json_object'},messages:[{role:'system',content:system},{role:'user',content:JSON.stringify({turns,remainingSeconds:Math.min(300,Math.max(0,Number(b.remainingSeconds)||0))})}]})});
  const json=await up.json();if(!up.ok)throw Error('AI service temporarily unavailable');const parsed=JSON.parse(json.choices?.[0]?.message?.content||'{}');
  return res.status(200).json({reply:String(parsed.reply||'Could you explain your idea?').slice(0,420)});
 }catch(e){console.error('Art Lab roleplay:',e);return res.status(502).json({error:'AI conversation unavailable. Please try again.'})}
}
