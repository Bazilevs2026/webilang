// Vercel serverless endpoint: Kostya, speaking feedback and personal Stock exercises.
// Uses a project-level secret; no OpenAI key is sent to the browser.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST required'});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI is not configured. Set OPENAI_API_KEY in Vercel Environment Variables.'});
 const body=req.body||{},mode=String(body.mode||'');
 if(!['feedback','practice','kostya'].includes(mode))return res.status(400).json({error:'Unknown mode'});
 const txt=String(body.text||'').slice(0,2400),context=String(body.context||'').slice(0,160),prompt=String(body.prompt||'').slice(0,300);
 const items=Array.isArray(body.items)?body.items.slice(-20).map(v=>String(v).slice(0,80)):[];
 let system='',request={};
 if(mode==='feedback'){
  system='You are a supportive experienced English-language teacher reviewing a CEFR A2-B1 learner’s spoken or typed response. Respond with JSON only, fields interaction, grammar, vocabulary, nextStep as concise English strings, grammarItems as an array of 1-3 accurate pedagogically useful grammar patterns. Give specific actionable feedback grounded in the supplied text; do not invent spoken pronunciation evidence. Keep feedback encouraging but truthful. Do not quote or endorse the learner’s political opinions.';
  request={task:String(body.task||''),question:prompt,learnerResponse:txt};
 }else if(mode==='practice'){
  system='You write short accurate English-learning exercises for a CEFR A2-B1 learner based ONLY on their saved items. Reply with JSON only: questions is an array of exactly 5 objects, each with prompt, answer, hint. Include single clear answer and an unambiguous short sentence with a gap for each prompt. For vocabulary items use suitable words/phrases; for grammar use the named structures. No politics persuasion or ideological instruction.';
  request={kind:String(body.stockType||'words'),savedItems:items};
 }else{
  system='You are Kostya, a helpful independent English speaking art companion. Return JSON with a single key answer containing the response. Reply in the same language as the user, concise 2-5 sentences, generally at A2-B1 if in English. Focus on paintings, artists, English vocabulary, and the Rivera-Rockefeller historical dispute. Be factual: Rivera painted Man at the Crossroads at Rockefeller Center in 1933; Nelson Rockefeller asked to remove Lenin; Rivera declined and suggested including Lincoln; mural was covered and destroyed in Feb 1934; Rivera produced a related mural in Mexico. Distinguish documented events from imagined comic dialogue. Avoid presenting fiction as fact, and do not manufacture facts. If asked for learning help offer a concise useful example. You are not the real human Kostya.';
  request={currentPage:context,userQuestion:txt};
 }
 if(mode==='practice'&&!items.length)return res.status(400).json({error:'No saved items supplied'});
 if(mode!=='practice'&&txt.length<2)return res.status(400).json({error:'No text supplied'});
 try{
  const upstream=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.ARTLAB_AI_MODEL||'gpt-4o-mini',temperature:.35,max_tokens:750,response_format:{type:'json_object'},messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(request)}]})});
  const data=await upstream.json();if(!upstream.ok)return res.status(502).json({error:'AI service temporarily unavailable'});
  const raw=data.choices?.[0]?.message?.content||'{}';let parsed=JSON.parse(raw);
  if(mode==='kostya'){parsed={answer:String(parsed.answer||parsed.response||'I cannot answer that right now.').slice(0,1800)}}
  return res.status(200).json(parsed)
 }catch(err){console.error('coach',err);return res.status(500).json({error:'Unable to process this request at the moment.'})}
}
