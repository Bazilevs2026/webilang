const reply=(res,status,data)=>{res.setHeader('Cache-Control','no-store');return res.status(status).json(data)};
function outputText(data){if(typeof data.output_text==='string')return data.output_text;return (data.output||[]).flatMap(x=>(x.content||[]).map(c=>c.text||c.output_text||'')).join('')}
module.exports = async function handler(req,res){
 if(req.method!=='POST')return reply(res,405,{error:'POST required'});
 if(!process.env.OPENAI_API_KEY)return reply(res,503,{error:'AI configuration missing'});
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
 const instructions=`You are an evidence-grounded A2 English speaking assessor. This is a ${scenario==='creator'?'student-led game developer interview':'babysitter job interview with a parent'}. Assess only student speech, not avatar speech. Do not invent quotes, audio, pronunciation or grammar errors. The transcript cannot reliably assess pronunciation or acoustical fluency; the fluency score must reflect textual turn coherence only and explicitly note its limitation. Provide five category scores integers 1-5 and short useful comments, a short summary, and up to 6 clear grammatical errors with exact original phrases from student turns, corrected phrases and explanations. Return JSON only with keys scores (communication,interaction,grammar,vocabulary,fluency each score and comment), summary, grammarErrors array (original, corrected, explanation). If insufficient evidence, explain uncertainty and avoid pretending precision.`;
 try{
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.INTERVIEW_FEEDBACK_MODEL||'gpt-4.1-mini',instructions,input:JSON.stringify(clean),max_output_tokens:1300})});
  const d=await r.json();if(!r.ok)throw Error(d.error?.message||'AI request failed');
  const raw=outputText(d).replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');const feedback=JSON.parse(raw);return reply(res,200,feedback);
 }catch(e){return reply(res,502,{error:'Feedback generation failed: '+e.message})}
}
