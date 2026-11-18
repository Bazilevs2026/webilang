// Gender Roles B2: form-focused translation and production checks for two taught rules.
const rules={
 ing:'After a preposition (by, without, after, instead of), use a gerund (verb-ing).',
 contrast:'Although/even though + clause; despite/in spite of + noun or -ing; whereas/while + contrasting clause.'
};
const clean=(x,n=900)=>String(x||'').trim().slice(0,n);
function parseText(d){const x=d?.choices?.[0]?.message?.content||'';return JSON.parse(x)}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST required'});
 const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
 const rule=body.rule,stage=body.stage;
 if(!rules[rule]||!['retrieval','production'].includes(stage))return res.status(400).json({error:'Invalid task'});
 const answer=clean(body.answer),prompt=clean(body.prompt),model=clean(body.model);
 if(!answer||!prompt)return res.status(400).json({error:'Write your response first.'});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI feedback unavailable.'});
 try{
 const instructions=`You are an exacting B2 English grammar assessor. Evaluate ONLY the student's actual English, focusing on this grammar rule: ${rules[rule]}. Stage: ${stage}.
 For retrieval, the student is translating the short Russian sentence in the prompt; check semantic fidelity, grammar and particularly whether the TARGET GRAMMAR RULE is demonstrated correctly. Accept idiomatic alternative translations using the rule, even when different from the sample. For production, assess grammatical accuracy and correct use of the target rule, not the student's beliefs, argument, politics, or persuasiveness. Ignore capitalization and punctuation completely (including missing commas, apostrophes and final punctuation): never penalize or mention them.
 Never invent student mistakes or assess pronunciation. A fluent sentence that fails to demonstrate the target structure does NOT pass the rule-practice exercise; explain which structure is missing. Explain specific errors with quoted short fragments and corrections. Return JSON only: {"correct":boolean,"feedbackEn":"1-2 specific English sentences","feedbackRu":"1-2 equivalent Russian sentences","suggestion":"one short natural corrected sample when useful; otherwise empty"}. Model is a reference, not the only accepted answer.`;
 const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.GENDER_WORDSTOCK_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},temperature:0.1,max_tokens:520,messages:[{role:'system',content:instructions},{role:'user',content:JSON.stringify({rule,stage,prompt,model,studentAnswer:answer})}]})});
 const data=await response.json();
 if(!response.ok)throw Error('AI service error');
 const check=parseText(data);
 if(typeof check.correct!=='boolean'||!clean(check.feedbackEn)||!clean(check.feedbackRu))throw Error('Malformed AI feedback');
 return res.status(200).json({correct:check.correct,feedbackEn:clean(check.feedbackEn,550),feedbackRu:clean(check.feedbackRu,550),suggestion:clean(check.suggestion,400)});
 }catch(e){console.error('Gender grammar AI check',String(e));return res.status(503).json({error:'Could not check this answer. Your text is preserved; please retry.'});}
}