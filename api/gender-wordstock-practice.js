// Webilang Gender Roles · B2 vocabulary practice.
// AI-generated, quality-gated Recognition → Retrieval → Production.
const MAX_WORD_LENGTH=120;
const clean=s=>String(s||'').trim().slice(0,MAX_WORD_LENGTH);
const norm=s=>String(s||'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();
const text=s=>String(s||'').trim();
function validate(items,target){
 if(!Array.isArray(items)||items.length!==3)throw Error('Incomplete sequence');
 const targetNorm=norm(target);
 const labels=['Recognition','Retrieval','Production'];
 const generic=/saved (word|expression)|selected (word|expression)|repeat the (word|expression)|write the exact|use the expression|which word did you save|think of a sentence with|target vocabulary|insert the word/i;
 for(let i=0;i<3;i++){
  const q=items[i];
  if(q?.stage!==labels[i]||!text(q.prompt)||!text(q.hint))throw Error('Missing stage or context');
  if(q.prompt.length<12||q.prompt.length>550||generic.test(q.prompt))throw Error('Generic prompt');
  if(i===0){
   if(!Array.isArray(q.options)||q.options.length!==3||new Set(q.options.map(norm)).size!==3||!q.options.some(x=>norm(x)===norm(q.answer)))throw Error('Exactly one matching definition required');
   if(q.options.some(x=>text(x).length<8||text(x).length>220||norm(x).includes(targetNorm)))throw Error('Invalid or revealing definition');
   if(/\b(?:complete|fill|blank|gap|which expression|which word)\b/i.test(q.prompt))throw Error('Recognition must ask for meaning');
   
  }
  if(i===1){
   // Retrieval now means translating one complete short Russian sentence,
   // using the selected English target naturally in a complete translation.
   if(!/[А-Яа-яЁё]/.test(q.prompt)||q.prompt.length>210||q.prompt.length<22)throw Error('Retrieval needs a concise Russian sentence');
   if(/___|\.\.\./.test(q.prompt)||norm(q.prompt).includes(targetNorm))throw Error('Retrieval reveals or omits the language task');
   if(!text(q.answer)||!norm(q.answer).includes(targetNorm))throw Error('English model translation must contain the selected expression');
   if(q.answer.split(/\s+/).length<5||q.answer.length>260)throw Error('Expected a meaningful full-sentence English translation');
  }
  if(i===2){
   if(!text(q.modelAnswer)||!norm(q.modelAnswer).includes(targetNorm))throw Error('Production model must naturally use target');
   if(norm(q.prompt).includes(targetNorm)||q.prompt.includes('___'))throw Error('Production gives away the target');
   if(/\b(?:complete|fill|blank|gap|target word|target expression|vocabulary item|use the word|use the phrase|include the word|include the phrase|three sentences|1-3 sentences|sentence using)\b/i.test(q.prompt))throw Error('Production is forced wording, not conversation');
   
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
const system=`You are a specialist B2 English materials designer. Design three NON-REDUNDANT micro-tasks for ONE selected expression. Use precise idiomatic English and realistic professional, family and social contexts. Avoid stereotypes and ambiguous multiple-choice answers.

1 RECOGNITION / MEANING: The learner's saved expression is visible as the heading. Ask which definition or explanation BEST captures its meaning. Supply exactly three FULL explanatory definitions (NOT three substitute words in a sentence). Exactly ONE must match the expression's specific meaning. Other two definitions should be plausible but clearly different, not near-synonyms. "answer" is an exact option. "context" can state the situation in which the word is used, without giving its definition. Do not show the target word in any options or the question; it is displayed separately as the heading.
2 RETRIEVAL / TRANSLATION: Generate ONE short complete RUSSIAN sentence for the student to translate INTO ENGLISH. It should use the Russian equivalent of the selected target meaningfully and naturally, with a realistic B2 collocation/relationship. Limit to 8-16 Russian words, never a long story or only one word. Format "Переведи предложение: «... .»" (under 175 characters). Example for comparable: "Переведи предложение: «Их опыт вполне сравним, хотя они работали в разных сферах.»" Correct "answer" is a COMPLETE idiomatic English translation containing the exact target expression "comparable", e.g. "Their experience is quite comparable, although they worked in different fields." NEVER set answer to a bare word. Do not put the English target in the Russian prompt or the hint. Other accurate English translations using the target are acceptable; the frontend will ask AI to assess them, never exact-match the model. No blanks, riddles, synonym identification or single-word translation.
3 PRODUCTION / INTERACTION: Provide a believable nuanced disagreement, professional decision, or dilemma involving a colleague, interviewer, or friend and ask the learner to RESPOND and justify their stance in their own words. The interface explicitly asks the learner to use the target expression NATURALLY and APPROPRIATELY; do not mention it or repeat this instruction in the prompt. No half-finished answer, word-insertion task, fixed number of sentences, gaps, or model answer in the prompt. "modelAnswer" is ONE natural possible response containing the target expression, for post-attempt reflection only. The learner should aim to use the selected expression; assess communicative appropriateness separately from whether the expression is used accurately. The learner's response can be any natural length.
Return exactly JSON {"questions":[{"stage":"Recognition","context":"...","prompt":"Which definition best explains this expression?","options":["...","...","..."],"answer":"...","hint":"..."},{"stage":"Retrieval","prompt":"...","answer":"...","hint":"..."},{"stage":"Production","prompt":"...","modelAnswer":"...","hint":"..."}]}.
Before returning, check for leaked answers, artificial repetition, subjective distractors, and forced phrase insertion. Never generate a 'complete the gap' task in this module.`;
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 try{
  const data=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  const item=clean(data.item);if(!item||item.length<2)return res.status(400).json({error:'Select a saved word or expression first.'});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI practice is not configured. Saved words are unchanged.'});
  if(data.action==='build'){
   // Well-tested fallback for a common target: still meaningful if the AI service
   // is down or returns a format the strict parser cannot use.
   const known=norm(item)==='comparable'?[
    {stage:'Recognition',context:'An interviewer needs to evaluate qualifications across different professional backgrounds.',prompt:'Which definition best describes this word?',options:['Similar enough in relevant qualities to allow a fair comparison, without being identical.','Exactly the same in every detail, so no comparison is necessary.','Impossible to evaluate against one another because the criteria cannot be shared.'],answer:'Similar enough in relevant qualities to allow a fair comparison, without being identical.',hint:'Think about whether two things must be identical to be meaningfully compared.'},
    {stage:'Retrieval',prompt:'Переведи предложение: «Их опыт вполне сравним, хотя они работали в разных сферах.»',answer:'Their experience is quite comparable, although they worked in different fields.',hint:'The English target describes things that can reasonably be compared.'},
    {stage:'Production',prompt:'Your colleague argues: “We should automatically rank applicants with university degrees above applicants who learned on the job.” Respond professionally and explain how the evidence should be evaluated.',modelAnswer:'Their experience may be comparable in the skills that matter for this position, so we should assess both against the same criteria.',hint:'You can challenge the assumption while focusing on relevant skills.'}
   ]:null;
   let qs=null;
   for(let attempt=0;attempt<2;attempt++){
    try{
     const result=await chat(process.env.OPENAI_API_KEY,[{role:'system',content:system},{role:'user',content:JSON.stringify({selectedExpression:item,level:'B2',attempt:attempt+1,retrievalFormat:'translate_short_russian_sentence',variation:Number(data.variation)||0})}],1500);
     qs=validate(result.questions,item);break;
    }catch(e){console.warn('Gender Word Stock generation attempt '+(attempt+1)+': '+String(e.message||e));}
   }
   if(!qs&&known)qs=known;
   if(!qs)return res.status(503).json({error:'AI did not generate a reliable B2 practice sequence. Try again; your saved words are unchanged.'});
   return res.status(200).json({questions:qs});
  }
  if(data.action==='assess_retrieval'){
   const answer=text(data.answer).slice(0,900),prompt=text(data.prompt).slice(0,450),model=text(data.modelAnswer).slice(0,450);
   if(!answer||!prompt||!model)return res.status(400).json({error:'Translation, source sentence and model are required.'});
   try{
    const result=await chat(process.env.OPENAI_API_KEY,[
     {role:'system',content:`You assess the FORMAL ACCURACY of a B2 learner's English translation of ONE short Russian sentence. Evaluate: (a) whether the meaning of the entire Russian sentence is preserved, including qualifications, contrasts and negation; (b) grammar, tense, articles, prepositions and natural phrasing; (c) especially whether the required target English expression is USED naturally and correctly. The target can be inflected as grammar requires. Accept diverse idiomatic translations; the model answer is only ONE possibility. Do not demand exact wording, do not evaluate political opinions, and do not infer pronunciation from text. If target is missing or incorrect, point this out specifically. Return ONLY JSON {"appropriate":boolean,"feedback":"1-3 specific concise sentences on accuracy and target usage","suggestion":"optional improved translation that uses the target, or empty string"}. appropriate is true only when the meaning is substantially accurate, English grammar natural, AND target appropriately used.`},
     {role:'user',content:JSON.stringify({russianSentence:prompt,targetExpression:item,modelTranslation:model,learnerTranslation:answer})}
    ],470);
    if(typeof result.appropriate!=='boolean'||typeof result.feedback!=='string')throw Error('Invalid assessment format');
    return res.status(200).json({appropriate:result.appropriate,feedback:result.feedback.slice(0,600),suggestion:String(result.suggestion||'').slice(0,350)});
   }catch(e){return res.status(503).json({error:'Translation feedback is temporarily unavailable. Your answer has been preserved.'});}
  }
  if(data.action==='assess'){
   const answer=text(data.answer).slice(0,1200),prompt=text(data.prompt).slice(0,600);
   if(answer.length<8)return res.status(400).json({error:'Write a meaningful response before requesting feedback.'});
   if(!prompt)return res.status(400).json({error:'Missing task context.'});
   const result=await chat(process.env.OPENAI_API_KEY,[
    {role:'system',content:`You are a B2 English FORM-FOCUSED language assessor for a learner's short written or speech-transcribed response. Evaluate ONLY (1) grammar, syntax, agreement, tense, articles and prepositions, and (2) lexical accuracy, natural collocation and in particular the correct, appropriate use of the supplied TARGET WORD or expression. Check whether the target expression is actually present (including a legitimate inflected form), and whether its meaning, register, syntax, preposition patterns, and collocation are appropriate in this specific response. If the target is missing, say so plainly and give a natural example of including it. If present but misused, identify the exact learner phrase and the correction. Do NOT evaluate the learner's beliefs, argument strength, relevance, persuasiveness, interaction, factual accuracy, moral position, or task achievement. Do not invent quotations, errors, audio evidence or pronunciation judgments; transcript alone cannot establish pronunciation. Do not penalize valid alternative grammatical constructions. Return only JSON {"appropriate":boolean,"feedback":"2-3 concise sentences focused exclusively on grammatical correctness and especially precise use of the target expression; identify an actual error if present, or confirm correctness; note missing target explicitly","suggestion":"one short corrected/natural version containing the target expression when helpful, otherwise empty string"}. Set appropriate to true ONLY when the response is grammatically acceptable AND the target is used correctly and naturally.`},
    {role:'user',content:JSON.stringify({target:item,prompt,studentAnswer:answer})}
   ],400);
   if(typeof result.appropriate!=='boolean'||typeof result.feedback!=='string')throw Error('AI feedback format error');
   return res.status(200).json({appropriate:result.appropriate,feedback:result.feedback.slice(0,500),suggestion:String(result.suggestion||'').slice(0,300)});
  }
  return res.status(400).json({error:'Unknown action'});
 }catch(e){console.error('Gender Word Stock practice:',String(e.message||e));return res.status(503).json({error:'Could not generate a reliable task. Please retry; your words and answers are preserved.'});}
}
