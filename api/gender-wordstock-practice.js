// Webilang Gender Roles · B2 vocabulary practice.
// AI-generated, quality-gated Recognition → Retrieval → Production.
const MAX_WORD_LENGTH=120;
const clean=s=>String(s||'').trim().slice(0,MAX_WORD_LENGTH);
const norm=s=>String(s||'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();
const text=s=>String(s||'').trim();
function validate(items,target){
 if(!Array.isArray(items)||items.length!==3)throw Error('Incomplete exercise sequence');
 const stages=['Recognition','Retrieval','Production'];
 const bad=/saved (word|expression)|selected (word|expression)|repeat the (word|expression)|write the exact|use the expression|meaning of this expression|which word did you save|think of a sentence with/i;
 for(let i=0;i<3;i++){
  const q=items[i];
  if(q?.stage!==stages[i]||!text(q.prompt)||!text(q.hint))throw Error('Missing task context');
  if(text(q.prompt).length<38||text(q.prompt).length>480||bad.test(q.prompt))throw Error('Generic or malformed prompt');
  if(i===0){
   if(!Array.isArray(q.options)||q.options.length!==3||new Set(q.options.map(norm)).size!==3||!q.options.some(x=>norm(x)===norm(q.answer)))throw Error('Recognition must have one unique answer');
   if(q.options.some(x=>!text(x)||text(x).length>150)||!text(q.answer))throw Error('Invalid choices');
   if(!text(q.context)||text(q.context).length<25)throw Error('Recognition requires context');
   if(![...q.options].some(x=>norm(x).includes(norm(target))||norm(target).includes(norm(x))))throw Error('Target expression not represented');
  }
  if(i===1){
   if(!text(q.answer)||!q.prompt.includes('___'))throw Error('Retrieval must have a contextual gap');
   if(norm(q.prompt).includes(norm(target)))throw Error('Retrieval prompt reveals its answer');
   if(!norm(q.answer).includes(norm(target))&&!norm(target).includes(norm(q.answer)))throw Error('Retrieval target mismatch');
  }
  if(i===2){
   if(!text(q.modelAnswer)||!norm(q.modelAnswer).includes(norm(target)))throw Error('Production model must use the target');
   if(!/(?:ask|explain|respond|reply|write|tell|challenge|persuade|disagree|suggest|negotiate|clarify|justify|address|propose|convince|discuss)/i.test(q.prompt))throw Error('Production requires communicative action');
  }
 }
 return items;
}
async function chat(key,messages,maxTokens=1250){
 const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.GENDER_WORDSTOCK_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},temperature:0.2,max_tokens:maxTokens,messages})});
 if(!resp.ok)throw Error('AI service unavailable');
 const data=await resp.json();
 return JSON.parse(data.choices?.[0]?.message?.content||'{}');
}
const system=`You are a specialist B2-C1 English language teacher designing pedagogically valid personal vocabulary practice for Webilang Gender Roles. The selected expression must be the focus, with realistic contexts from work, care work, family responsibility, education, gender expectations, equal opportunities and social roles. Avoid stereotyping; reasonable contrasting views are valid. Generate three DISTINCT learning steps in order:
1 Recognition: provide a concrete 1-2 sentence realistic micro-situation as "context"; "prompt" asks which exact wording best completes the exchange or explains the situation; exactly three plausible short expressions in "options", one and only one defensibly correct; "answer" exactly equals one option; the correct option contains the selected phrase verbatim, not a synonym. All distractors should be plausible English yet semantically distinct; never offer several defensible answers.
2 Retrieval: provide a different, natural context with one gap "___" and no occurrence of the selected expression anywhere in the prompt. Correct answer must be the selected expression verbatim. Provide a short semantic hint that does NOT contain or reveal the expression.
3 Production: specify a realistic communicative goal (ask, disagree, explain, justify, persuade, suggest, etc.) and an interlocutor (colleague, interviewer, friend, employer) that naturally elicits the expression in 1-3 sentences. "modelAnswer" uses the expression verbatim; it is ONE model, not the only correct formulation. Never ask merely "use the saved expression in a sentence".
Prompts and answers must be appropriate to the precise expression and avoid forcing an unnatural use. Use natural idiomatic English, not generic grammar-theory tasks. B2 level.
Return ONLY JSON {"questions":[{"stage":"Recognition","context":"...","prompt":"...","options":["...","...","..."],"answer":"...","hint":"..."},{"stage":"Retrieval","prompt":"... ___ ...","answer":"...","hint":"..."},{"stage":"Production","prompt":"...","modelAnswer":"...","hint":"..."}]}. Never reveal the target in the retrieval prompt.`;
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 try{
  const data=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  const item=clean(data.item);if(!item||item.length<2)return res.status(400).json({error:'Select a saved word or expression first.'});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI practice is not configured. Saved words are unchanged.'});
  if(data.action==='build'){
   let qs=null;
   for(let attempt=0;attempt<2;attempt++){
    try{const result=await chat(process.env.OPENAI_API_KEY,[{role:'system',content:system},{role:'user',content:JSON.stringify({selectedExpression:item,level:'B2'})}],1350);qs=validate(result.questions,item);break;}catch(e){if(attempt===1)throw e;}
   }
   return res.status(200).json({questions:qs});
  }
  if(data.action==='assess'){
   const answer=text(data.answer).slice(0,1200),prompt=text(data.prompt).slice(0,600);
   if(answer.length<8)return res.status(400).json({error:'Write a meaningful response before requesting feedback.'});
   if(!prompt)return res.status(400).json({error:'Missing task context.'});
   const result=await chat(process.env.OPENAI_API_KEY,[
    {role:'system',content:`You assess a B2 student's short original English response to a communicative roleplay prompt involving a target expression. Evaluate only the supplied student text, do not invent speech, grammar errors, attitudes or background. Semantically appropriate variants are valid, even if different from the model answer. Report whether the selected expression or a clear grammatical inflection is used naturally; be concise and constructive. Return only JSON {"appropriate":boolean,"feedback":"1-2 sentences, specific to the actual answer","suggestion":"a short optional improved alternative, only if useful"}. Do not claim to have heard pronunciation.`},
    {role:'user',content:JSON.stringify({target:item,prompt,studentAnswer:answer})}
   ],400);
   if(typeof result.appropriate!=='boolean'||typeof result.feedback!=='string')throw Error('AI feedback format error');
   return res.status(200).json({appropriate:result.appropriate,feedback:result.feedback.slice(0,500),suggestion:String(result.suggestion||'').slice(0,300)});
  }
  return res.status(400).json({error:'Unknown action'});
 }catch(e){console.error('Gender Word Stock practice:',String(e.message||e));return res.status(503).json({error:'Could not generate a reliable task. Please retry; your words and answers are preserved.'});}
}
