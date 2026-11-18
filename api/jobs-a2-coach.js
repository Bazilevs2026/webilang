export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST required'});
 const b=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
 const type=b.type==='feedback'?'feedback':b.type==='teacher'?'teacher':'chat';
 const practiceMode=b.type==='practice';
 if(practiceMode){
  try{
   const kind=b.kind==='grammar'?'grammar':'words';
   const targets=Array.isArray(b.items)?b.items.map(x=>String(x||'').trim().slice(0,130)).filter(Boolean).slice(0,6):[];
   if(!targets.length)return res.status(400).json({error:'Choose at least one saved item first.'});
   if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI service not configured'});
   const prompt='Create exactly 4 varied A2 English practice questions for the selected '+kind+' items. Use a realistic jobs and money context. Include two multiple-choice questions with exactly three plausible options and one correct option, one short gap-fill with one unambiguous answer, and one personal production question. Every item must test the provided targets. Keep instructions simple A2 English. Return only JSON object {"exercises":[{"type":"choice"|"gap"|"open","prompt":"string","options":["string"],"answer":"string","explanation":"string"}]}. For open questions use a helpful example as answer. Do not use C1 grammar or vocabulary.';
   const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.JOBS_A2_MODEL||'gpt-4o-mini',temperature:.35,max_tokens:1100,response_format:{type:'json_object'},messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify({kind,targets})}]})});
   if(!response.ok)return res.status(502).json({error:'AI practice service unavailable'});
   const result=await response.json(),parsed=JSON.parse(result.choices?.[0]?.message?.content||'{}');
   const exercises=Array.isArray(parsed.exercises)?parsed.exercises.slice(0,4).map(x=>({type:['choice','gap','open'].includes(x.type)?x.type:'gap',prompt:String(x.prompt||'').slice(0,340),options:Array.isArray(x.options)?x.options.slice(0,4).map(t=>String(t).slice(0,100)):[],answer:String(x.answer||'').slice(0,180),explanation:String(x.explanation||'').slice(0,300)})):[];
   if(exercises.length!==4)return res.status(502).json({error:'Incomplete AI exercise set. Try again.'});
   return res.status(200).json({exercises});
  }catch(e){return res.status(502).json({error:'AI practice unavailable. Please try again.'})}
 }
 const transcript=String(b.transcript||'').slice(0,6500);
 const scene=String(b.scene||'job interview').slice(0,120);
 const job=String(b.job||'').slice(0,120),interviewRole=b.interviewRole==='employer'?'employer':'applicant';
 const history=Array.isArray(b.history)?b.history.slice(-12).map(x=>({role:x.role==='assistant'?'assistant':'user',content:String(x.content||'').slice(0,700)})):[];
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI service not configured'});
 const scenes={
  interview:'You are a friendly but realistic interviewer recruiting a part-time assistant. Start: "Hello! Thanks for coming. Can you tell me a little about yourself?" Ask about experience, skills, availability and why they want the job. Do not assume the student has work experience.',
  salary:'You are a manager discussing working hours and salary with a new employee. Start: "Hello! What would you like to know about this job?" Do not promise specific real-world legal rights or invent company policies.',
  firstday:'You are an experienced colleague helping a new employee on their first day. Start: "Hi! Welcome to the team. Is there anything you need help with?"',
  colleague:'You are a colleague who misunderstood the student’s work schedule. Start: "Hi, I thought you were working on Saturday. Is that right?" Be open to clarification.'
 };
 try{
  const system=type==='chat'&&job?('You are '+(interviewRole==='employer'?'Chaz, a friendly A2 JOB APPLICANT. The learner is hiring you.':'Nova, a professional A2 JOB INTERVIEWER. The learner is applying.')+' Job: '+job+'. '+(interviewRole==='employer'?'Let the student lead. Answer the actual question with one concise, natural reply. Do not act as an interviewer.':'Ask realistic questions one at a time about skills, motivation, relevant experience and availability.')+' Use no more than 15 English words per response. Do not invent the students answers. Stop after each turn. Avoid giving language feedback during the interview.'):type==='teacher'?'You are Kostya, a supportive and precise English teacher for Webilang Jobs & Money A2. Explain the learner\'s current question or sentence in simple English, with at most one example and one follow-up question. Recognize valid alternatives. Do not roleplay as an employer. Keep answers under 80 words.':type==='chat'?('You are a realistic roleplay partner in an A2 English lesson about Jobs & Money. '+(scenes[b.scene]||scenes.interview)+' Use simple, natural English. Respond to the learner\'s last utterance, usually 1-2 short sentences and AT MOST ONE question. Never give a lesson, explanations, scores or a list during a roleplay. Never make up learner biography. If the learner asks for help, give one brief hint and continue.'):('You are Kostya, an English language teacher assessing a Jobs & Money A2 learner. Assess ONLY the student utterances, never attribute agent speech to student. Return valid JSON object with fields interaction, grammar, vocabulary, nextStep, grammarItems, vocabularyItems, newWords. newWords is an array of 1-3 useful NEW workplace A2 phrases, each object with word and example. Do not claim that newWords were spoken by the student. Each item: original (EXACT quote found in student speech), corrected, explanation, practice. Correct real errors only; no invented quotations. If there is no actual error, use empty arrays. vocabularyItems may include a useful correctly used expression with original=corrected. Simple A2-level clear actionable feedback. No grading without evidence.');
  const messages=[{role:'system',content:system},...(type!=='feedback'?history:[{role:'user',content:JSON.stringify({scene,transcript})}])];
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.JOBS_A2_MODEL||'gpt-4o-mini',temperature:type==='chat'?.6:.2,max_tokens:type==='chat'?160:1100,...(type==='feedback'?{response_format:{type:'json_object'}}:{}),messages})});
  const d=await r.json();if(!r.ok)throw Error('AI provider error '+r.status);
  const content=d.choices?.[0]?.message?.content||'';
  if(type!=='feedback')return res.status(200).json({answer:String(content).slice(0,800)});
  const out=JSON.parse(content||'{}'),student=history.length?history.filter(x=>x.role==='user').map(x=>x.content).join(' '):transcript;
  const filterItems=(v,grammar)=>Array.isArray(v)?v.filter(x=>x&&typeof x.original==='string'&&typeof x.corrected==='string'&&student.toLowerCase().includes(x.original.toLowerCase())&&(!grammar||x.original.trim().toLowerCase()!==x.corrected.trim().toLowerCase())).slice(0,5).map(x=>({original:x.original.slice(0,180),corrected:x.corrected.slice(0,180),explanation:String(x.explanation||'').slice(0,280),practice:String(x.practice||'').slice(0,180)})):[];
  return res.status(200).json({interaction:String(out.interaction||'').slice(0,900),grammar:String(out.grammar||'').slice(0,900),vocabulary:String(out.vocabulary||'').slice(0,900),nextStep:String(out.nextStep||'').slice(0,400),grammarItems:filterItems(out.grammarItems,true),vocabularyItems:filterItems(out.vocabularyItems,false),newWords:Array.isArray(out.newWords)?out.newWords.filter(x=>x&&typeof x.word==='string'&&typeof x.example==='string').slice(0,3).map(x=>({word:x.word.slice(0,110),example:x.example.slice(0,180)})):[]});
 }catch(e){console.error('Jobs A2',e);return res.status(502).json({error:'AI service temporarily unavailable. Please try again.'})}
}