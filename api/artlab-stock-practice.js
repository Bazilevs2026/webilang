// Place at repository-root /api/artlab-stock-practice.js (Vercel).
// Dedicated route to avoid changing the functioning Kostya/feedback endpoint.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST required'});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'OPENAI_API_KEY is not configured'});
 const body=req.body||{};
 const pattern=String(body.pattern||'').slice(0,180).trim();
 if(!pattern)return res.status(400).json({error:'No grammar structure provided'});
 const model=process.env.ARTLAB_AI_MODEL||'gpt-4o-mini';
 const mode=body.mode==='evaluate'?'evaluate':'generate';
 const system=mode==='evaluate'?`You are a precise, kind A2-B1 English teacher. Assess whether the student's original sentence genuinely uses the requested grammar pattern and responds to the prompt. Accept varied natural formulations, not just one model answer. Do not demand unnecessary complexity. Return JSON only {"correct":boolean,"feedback":"one concise supportive sentence","example":"one model sentence if needed"}. Do not judge political opinions.`:
 `Create a PERSONALIZED, DIVERSE A2-B1 grammar practice set for exactly ONE saved grammar structure. Return JSON with exactly 6 questions in this order: 2 recognize (multiple choice), 2 retrieve (student supplies an exact short grammatical form), 2 produce (student writes their own meaningful sentence). Each question MUST practise the specified structure; do NOT ask unrelated generic adjective or noun questions. Use DIFFERENT scenarios, subjects, verbs, functions, and prompt templates. Avoid repetition and ambiguous missing words. Topics: personal experiences, choosing art, galleries, everyday life, advice, decisions. For recognize, include 3 options, exactly one correct, and answer equal to that option. For retrieve, use an unambiguous fill-in context and a single short answer; specify the required form precisely. For produce, ask a genuinely open question requiring the structure, with a sensible example answer as 'answer' (not a literal-only answer). Give each a brief hint. JSON format {"questions":[{"stage":"recognize|retrieve|produce","prompt":"...","options":["..."],"answer":"...","hint":"..."}, ...]}. For retrieve/produce, options must be []. Never use placeholder prompts like 'What do you think about ___?' twice. Never generate the same prompt twice. No markdown.`;
 const request=mode==='evaluate'?{pattern,prompt:String(body.prompt||'').slice(0,350),studentAnswer:String(body.studentAnswer||'').slice(0,700),modelAnswer:String(body.modelAnswer||'').slice(0,350)}:{pattern,languageLevel:'A2-B1',count:{recognize:2,retrieve:2,produce:2}};
 if(mode==='evaluate'&&!request.studentAnswer.trim())return res.status(400).json({error:'No answer supplied'});
 try{
 const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model,temperature:mode==='generate'?.75:.15,max_tokens:mode==='generate'?1600:250,response_format:{type:'json_object'},messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(request)}]})});
 const raw=await response.json();if(!response.ok){console.error('Art Lab stock upstream:',response.status,JSON.stringify(raw).slice(0,400));return res.status(502).json({error:'AI exercise service failed; please try again.'})}
 const parsed=JSON.parse(raw.choices?.[0]?.message?.content||'{}');
 if(mode==='evaluate')return res.status(200).json({correct:parsed.correct===true,feedback:String(parsed.feedback||'Try again.'),example:String(parsed.example||'')});
 const qs=parsed.questions;
 if(!Array.isArray(qs)||qs.length!==6)return res.status(502).json({error:'AI returned an incomplete exercise set. Please regenerate.'});
 const stages=['recognize','recognize','retrieve','retrieve','produce','produce'];
 const seen=new Set();
 for(let i=0;i<6;i++){
  const q=qs[i];if(!q||q.stage!==stages[i]||typeof q.prompt!=='string'||typeof q.answer!=='string'||!q.prompt.trim()||!q.answer.trim())return res.status(502).json({error:'AI returned a malformed exercise. Please regenerate.'});
  const normalized=q.prompt.trim().toLowerCase().replace(/[^a-z\d]/g,'');if(seen.has(normalized))return res.status(502).json({error:'AI repeated a question. Please regenerate.'});seen.add(normalized);
  if(q.stage==='recognize'&&(!Array.isArray(q.options)||q.options.length!==3||!q.options.includes(q.answer)))return res.status(502).json({error:'Invalid multiple choice question. Please regenerate.'});
 }
 return res.status(200).json({pattern,questions:qs.map(q=>({stage:q.stage,prompt:q.prompt,answer:q.answer,hint:String(q.hint||''),options:q.stage==='recognize'?q.options:[]}))});
 }catch(err){console.error('Art Lab stock API',err);return res.status(500).json({error:'Could not generate grammar exercises right now.'})}
}
