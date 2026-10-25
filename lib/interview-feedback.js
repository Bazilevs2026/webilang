const reply=(res,status,data)=>{res.setHeader('Cache-Control','no-store');return res.status(status).json(data)};
function outputText(data){if(typeof data.output_text==='string')return data.output_text;return (data.output||[]).flatMap(x=>(x.content||[]).map(c=>c.text||c.output_text||'')).join('')}
export default async function handler(req,res){
 if(req.method!=='POST')return reply(res,405,{error:'POST required'});
 if(!process.env.OPENAI_API_KEY)return reply(res,503,{error:'AI configuration missing'});
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
