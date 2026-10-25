const reply=(res,status,data)=>{res.setHeader('Cache-Control','no-store');return res.status(status).json(data)};
function outputText(data){if(typeof data.output_text==='string')return data.output_text;return (data.output||[]).flatMap(x=>(x.content||[]).map(c=>c.text||c.output_text||'')).join('')}
module.exports = async function handler(req,res){
 if(req.method!=='POST')return reply(res,405,{error:'POST required'});
 if(!process.env.OPENAI_API_KEY)return reply(res,503,{error:'AI configuration missing'});
 if(req.query.action==='russian_feedback'){
  const {role,transcript}=req.body||{};
  if(!['michael','anna'].includes(role)||typeof transcript!=='string'||transcript.trim().length<8||transcript.length>10000)return reply(res,400,{error:'A short Russian learner transcript is required'});
  const instructions=`You assess a beginner A1 Russian roleplay in a university cafe: ${role==='michael'?'student plays Anna and interviews Michael':'student plays Michael and interviews Anna'}. Only evaluate the student's supplied utterances. Never invent or assume a statement. Produce brief, easy English and short Russian corrections. Only flag actual grammatical mistakes, NOT spelling punctuation from automatic speech transcription, natural incomplete conversational answers, or vocabulary style choices. Return JSON only: {mission:'supported'|'partial'|'insufficient',missionExplanation:string (<=20 words),errors:[{original:string,correction:string,explanation:string}] (max 3),vocabulary:string[] (max 3),encouragement:string (<=16 words)}. The corrected sentences must preserve the student's intended meaning. If no clear errors, return [].`;
  try{
   const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.INTERVIEW_FEEDBACK_MODEL||'gpt-4.1-mini',instructions,input:transcript,max_output_tokens:900,store:false})});
   const d=await r.json();if(!r.ok)throw Error(d.error?.message||'Russian feedback failed');
   const raw=outputText(d).replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');const report=JSON.parse(raw);
   report.errors=(Array.isArray(report.errors)?report.errors:[]).slice(0,3).filter(x=>typeof x.original==='string'&&transcript.toLowerCase().includes(x.original.toLowerCase().trim())&&x.correction&&x.original.trim()!==x.correction.trim());
   return reply(res,200,report);
  }catch(e){return reply(res,502,{error:'Russian feedback failed: '+e.message})}
 }
 if(req.query.action==='practice'){
  const errors=Array.isArray(req.body?.errors)?req.body.errors.slice(0,3):[];
  const clean=errors.map(e=>({original:String(e.original||'').trim().slice(0,240),correction:String(e.correction||'').trim().slice(0,240),explanation:String(e.explanation||'').trim().slice(0,300)})).filter(e=>e.original&&e.correction&&e.original!==e.correction);
  if(!clean.length)return reply(res,400,{error:'Choose a valid correction first'});
  const instructions=`You are an expert CEFR A2-B1 English grammar tutor. Create personalized grammar exercises from these user-reviewed error/correction pairs; do not add different mistakes. Return STRICT JSON with grammarItems array of up to 3 items. Each item: rule (specific clear grammar rule), original (verbatim student wording), correction (verbatim reviewed correction), explanation (brief), practice: recognition {prompt,options (exactly 3 short complete sentences, one correct),answerIndex (0-2),support}, retrieve {prompt,sentence (one sentence with _____ blank),answer (exact fill),support}, production {prompt,model,support}. All practice must teach the identified grammar rule, not simply rephrase the student's original statement. No Markdown.`;
  try{
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.INTERVIEW_FEEDBACK_MODEL||'gpt-4.1-mini',instructions,input:JSON.stringify(clean),max_output_tokens:2000,store:false})});
    const d=await r.json();if(!r.ok)throw Error(d.error?.message||'AI practice request failed');
    const raw=outputText(d).replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');const data=JSON.parse(raw);
    const items=(Array.isArray(data.grammarItems)?data.grammarItems:[]).slice(0,3).map((x,i)=>({
      rule:String(x.rule||'').slice(0,180),original:clean[i]?.original||'',correction:clean[i]?.correction||'',explanation:String(x.explanation||clean[i]?.explanation||'').slice(0,300),source:'Realtime interview',practice:x.practice
    })).filter(x=>x.rule&&x.practice?.recognition?.options?.length===3&&Number.isInteger(x.practice.recognition.answerIndex)&&x.practice.recognition.answerIndex>=0&&x.practice.recognition.answerIndex<3&&x.practice?.retrieve?.answer&&x.practice?.retrieve?.sentence&&x.practice?.production?.prompt);
    if(!items.length)throw Error('AI did not return valid exercises');return reply(res,200,{grammarItems:items});
  }catch(e){return reply(res,502,{error:'Practice generation failed: '+e.message})}
 }
 const {scenario,transcript}=req.body||{};
 if(!['creator','job'].includes(scenario)||!Array.isArray(transcript)||transcript.length>120)return reply(res,400,{error:'Invalid transcript'});
 const clean=transcript.filter(x=>['student','avatar'].includes(x?.speaker)&&typeof x.text==='string').map(x=>({speaker:x.speaker,text:x.text.slice(0,1500)}));
 if(!clean.some(x=>x.speaker==='student')||JSON.stringify(clean).length>22000)return reply(res,400,{error:'No valid student transcript'});
 const instructions=`You assess an A2-B1 English roleplay from a written transcript. Scenario: ${scenario==='creator'?'student interviewing a game developer':'student applying as a babysitter'}. Assess ONLY what the student actually said, not the avatar. Keep feedback friendly, accurate, very short and easy to read at A2 level. Return JSON only: scores {interaction,grammar,vocabulary,fluency}, each {score: integer 1-5, comment: 1 simple English sentence of MAXIMUM 15 words}; summary: MAXIMUM 25 simple English words; grammarErrors: 0-3 items {original,corrected,explanation}, each explanation MAXIMUM 15 words.
CRITICAL distinction: grammarErrors must contain ONLY undeniable GRAMMATICAL mistakes in EXACT student speech. Short complete replies such as "Yes", "No" or "I don't know" are grammatically acceptable. Do NOT treat short answers, weak communication, limited detail, word choice, conversation strategy or lack of clarity as grammar mistakes. Do NOT alter pronouns like he/she/I merely because you assume the topic is self-reference. Do NOT invent missing context or expand grammatically correct utterances into longer ones. Original MUST be a verbatim contiguous phrase or sentence spoken by student; corrected must change only clearly wrong grammar. If there are no certain grammar errors, return an EMPTY grammarErrors array. For uncertain transcription or context, omit the error. Fluency measures only textual connectedness and ability to take turns, NOT speech speed or pronunciation; acknowledge this briefly in the fluency comment. No additional scoring category. Avoid repetitive negative feedback when evidence is limited.`;
 try{
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.INTERVIEW_FEEDBACK_MODEL||'gpt-4.1-mini',instructions,input:JSON.stringify(clean),max_output_tokens:1300})});
  const d=await r.json();if(!r.ok)throw Error(d.error?.message||'AI request failed');
  const raw=outputText(d).replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');const feedback=JSON.parse(raw);
  const actualStudent=clean.filter(x=>x.speaker==='student').map(x=>x.text);
  const matchOriginal=o=>actualStudent.some(s=>s.toLocaleLowerCase().includes(o.toLocaleLowerCase()));
  feedback.grammarErrors=(Array.isArray(feedback.grammarErrors)?feedback.grammarErrors:[])
    .filter(x=>x&&typeof x.original==='string'&&typeof x.corrected==='string'&&typeof x.explanation==='string')
    .filter(x=>x.original.trim()&&x.corrected.trim()&&x.original.trim()!==x.corrected.trim()&&matchOriginal(x.original.trim()))
    .filter(x=>!(/^(yes|no|ok|okay|sure|thanks|thank you|i don.t know)[.!? ]*$/i.test(x.original.trim())))
    .slice(0,3).map(x=>({original:x.original.trim().slice(0,240),corrected:x.corrected.trim().slice(0,240),explanation:x.explanation.trim().slice(0,170)}));
  return reply(res,200,feedback);
 }catch(e){return reply(res,502,{error:'Feedback generation failed: '+e.message})}
}
