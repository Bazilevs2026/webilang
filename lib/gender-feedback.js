const json = (res,status,body)=>{res.setHeader("Cache-Control","no-store");return res.status(status).json(body)};
const outputText = data => String(data.output_text||data.output?.flatMap(x=>(x.content||[]).map(p=>p.text||p.output_text||"")).join("\n")||"");
export default async function handler(req,res){
 if(req.body?.action==="build"||req.body?.action==="check")return genderWordPracticeHandler(req,res);
 if(req.body?.action==="grammar_build"||req.body?.action==="grammar_check")return genderGrammarPracticeHandler(req,res);
 if(req.method!=="POST")return json(res,405,{error:"POST required"});
 const body=req.body||{},kind=body.kind,task=String(body.task||"").slice(0,6000),response=String(body.response||"").trim();
 if(!["speaking","writing"].includes(kind))return json(res,400,{error:"Select speaking or writing"});
 if(response.length<20||response.length>14000)return json(res,400,{error:"Response must be 20–14,000 characters."});
 if(!process.env.OPENAI_API_KEY)return json(res,503,{error:"OPENAI_API_KEY is missing in Vercel."});
 const instructions=`You are a rigorous yet supportive English-language tutor for CEFR B2–C1, reviewing a learner response in the original Gender Roles: Then & Now thematic module.
Evaluate the learner's OWN response only; do not attribute errors to speech recognition unless clearly evidenced. The module explores gender roles, Soviet women's legal equality and double burden, gender expectations in Germany, Justin Baldoni's talk about masculinity and vulnerability, Elena's life story, and the interpretive limitation of Hofstede's masculinity/femininity dimension. Do not fabricate module quotations or overclaim historical details.
This is ${kind} assessment for a specific prompt supplied separately. Feedback must address relevance to THAT prompt, argument/evidence, coherence, B2–C1 language, nuance, and possible unsupported sweeping generalizations. For writing, explicitly assess paragraph organization; for speaking, assess cohesion and discourse markers but DO NOT assess actual pronunciation or fluency from text alone.
Return STRICT JSON object, without markdown, fields:
{"level":"B2–C1","taskAchievement":"2-3 sentences","contentFeedback":"2 sentences with evidence grounded in learner words","organizationFeedback":"1-2 sentences","vocabularyFeedback":"1-2 sentences including positive evidence","vocabularySuggestions":[{"original":"optional exact student phrase","suggested":"natural B2 collocation or upgraded expression","explanation":"why this expression fits the interview"}],"grammarFeedback":"1-2 sentences","corrections":[{"original":"exact original span (verbatim)","corrected":"plausible correction","explanation":"specific rule"}],"grammarPatterns":[{"pattern":"specific construction","original":"exact verbatim original span","corrected":"corrected form","rule":"short precise English grammar rule","recognition":"brief recognition instruction/question about their error","recognitionAnswer":"short expected answer","retrieval":"specific correction task","retrievalAnswer":"correct form","production":"new communicative prompt that elicits this same pattern"}],"nextTask":"one short transfer task for independent reuse"}.
For vocabularySuggestions, return 1-5 specific useful interview expressions or collocations. Each suggested expression must be a short reusable natural English phrase (not a feedback sentence). If it improves student wording, original must quote the learner exactly; otherwise original can be empty. Never present a grammatically correct alternative as an error. Communication feedback must distinguish authentic follow-up from isolated prepared statements and use candidate replies for context. Only flag clear grammatical or lexical form mistakes, not stylistic differences as errors. Every 'original' in corrections/grammarPatterns MUST be an exact substring of the learner's text. Maximum 4 grammarPatterns; never invent student mistakes. If no real grammar errors, return empty grammarPatterns and corrections. Do not automatically label political claims true/false; evaluate support and precision.
Output safe plain text, not HTML.`;
 try{
 const r=await fetch("https://api.openai.com/v1/responses",{
  method:"POST",headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
  body:JSON.stringify({model:process.env.GENDER_AI_MODEL||"gpt-4.1-mini",instructions,input:`Return a valid JSON object only. Use JSON syntax and the fields specified in the instructions.\n\nTASK:\n${task}\n\nSTUDENT ${kind.toUpperCase()}:\n${response}`,temperature:0.2,max_output_tokens:1800,store:false,
   text:{format:{type:"json_object"}}})
 });
 const d=await r.json();if(!r.ok)throw Error(d.error?.message||"AI provider request failed");
 let parsed=JSON.parse(outputText(d));
 const clean=x=>String(x||"").slice(0,1500);
 const vocabularySuggestions=(Array.isArray(parsed.vocabularySuggestions)?parsed.vocabularySuggestions:[]).slice(0,6).map(x=>({original:clean(x?.original).slice(0,160),suggested:clean(x?.suggested).slice(0,100),explanation:clean(x?.explanation).slice(0,220)})).filter(x=>x.suggested&&x.suggested.split(/\s+/).length<=12);
 let corrections=Array.isArray(parsed.corrections)?parsed.corrections:[],
 patterns=Array.isArray(parsed.grammarPatterns)?parsed.grammarPatterns:[];
 corrections=corrections.filter(x=>x&&typeof x.original==="string"&&response.includes(x.original)&&String(x.corrected||"").trim()!==x.original).slice(0,6)
  .map(x=>({original:clean(x.original),corrected:clean(x.corrected),explanation:clean(x.explanation)}));
 patterns=patterns.filter(x=>x&&typeof x.original==="string"&&response.includes(x.original)&&String(x.corrected||"").trim()!==x.original).slice(0,4)
 .map(x=>Object.fromEntries(["pattern","original","corrected","rule","recognition","recognitionAnswer","retrieval","retrievalAnswer","production"].map(k=>[k,clean(x[k])])));
 return json(res,200,{level:"B2–C1",taskAchievement:clean(parsed.taskAchievement),contentFeedback:clean(parsed.contentFeedback),
 organizationFeedback:clean(parsed.organizationFeedback),vocabularyFeedback:clean(parsed.vocabularyFeedback),vocabularySuggestions,grammarFeedback:clean(parsed.grammarFeedback),
 corrections,grammarPatterns:patterns,nextTask:clean(parsed.nextTask)});
 }catch(err){console.error("Gender AI feedback failed",err);return json(res,502,{error:String(err.message||"AI service failure").slice(0,220)})}
}


// Shared Gender Roles word practice endpoint; mounted on /api/gender-feedback.
// Vercel serverless endpoint. Set OPENAI_API_KEY in Vercel environment variables.
const MODEL=process.env.OPENAI_MODEL||"gpt-4o-mini";
async function openai(messages){
 const response=await fetch("https://api.openai.com/v1/chat/completions",{
  method:"POST",headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},
  body:JSON.stringify({model:MODEL,temperature:0.2,response_format:{type:"json_object"},messages})
 });
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(payload.error?.message||"AI generation failed");
 const content=payload.choices?.[0]?.message?.content;
 if(!content)throw Error("AI returned no content");
 return JSON.parse(content);
}
const system=`You are a B2-C1 ESL curriculum designer and fair language assessor.
Tasks must be concise, clear and meaningful, grounded in natural language; never use meta-sentences or empty generic clues.
For each SAVED vocabulary item produce exactly:
recognize: a meaningful short sentence with the target word already in it, and three distinct explanations (options) of which precisely one is correct; prompt: "In this sentence, what does [word] mean? [short contextual sentence]".
retrieve: a DIFFERENT meaningful contextual sentence with "_____" replacing the saved word or phrase; no options.
produce: an original relevant scenario asking the learner to use the word in one new sentence.
Use 9-18 words in example sentences whenever possible; B2-C1 English, not artificially complicated.
For EVERY exercise return ruHint starting with a full natural Russian translation of its English task instruction AND contextual sentence, rather than a generic grammar hint. For recognize also translate the three answer options briefly when helpful; keep the correct choice unrevealed. Grammar explanation may follow the translation. Never omit the Russian translation.
On checks, consider intended meaning and context, allow correct variants and spelling/format differences where harmless.
Never claim that an article or word is missing if present. Never invent an error.
Do not penalize a correct answer for style. Distinguish optional enhancements.
For negative judgments identify a verifiable mistake. When uncertain return review, never reject.
Return ONLY JSON.`;
async function genderWordPracticeHandler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Use POST"});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"OPENAI_API_KEY is not configured"});
 try{
  const b=typeof req.body==="string"?JSON.parse(req.body):req.body||{};
  if(b.action==="build"){
   const items=Array.isArray(b.items)?b.items.slice(0,6).map(x=>String(x.word||"").trim()).filter(x=>x&&x.length<100):[];
   if(!items.length)return res.status(400).json({error:"Select words first"});
   const output=await openai([{role:"system",content:system},{role:"user",content:`Build three tasks for EACH item, in the supplied order: ${JSON.stringify(items)}. Use JSON {"items":[{"word":"...","recognize":{"prompt":"...","options":["...","...","..."],"correctOption":"...","ruHint":"..."},"retrieve":{"prompt":"... _____ ...","answer":"...","ruHint":"..."},"produce":{"prompt":"...","ruHint":"..."}}]}. Recognition correctOption must EXACTLY match one options string. All prompts and translations are needed.`}]);
   const normalizeTasks=(value)=>{
     const arr=Array.isArray(value.items)?value.items:[];
     if(arr.length!==items.length)return null;
     const completed=[];
     for(let i=0;i<arr.length;i++){
       const x=arr[i]||{}, rec=x.recognize||{}, ret=x.retrieve||{}, prod=x.produce||{};
       const options=Array.isArray(rec.options)?rec.options.map(z=>String(z||'').trim()):[];
       const match=options.find(z=>z.toLowerCase()===String(rec.correctOption||'').trim().toLowerCase());
       const blank=String(ret.prompt||'').replace(/_{3,}|\[blank\]|\{blank\}/gi,'_____');
       if(!rec.prompt||options.length!==3||!options.every(Boolean)||!match||!blank.includes('_____')||!prod.prompt)return null;
       completed.push({word:items[i],recognize:{...rec,options,correctOption:match},retrieve:{...ret,prompt:blank,answer:ret.answer||items[i]},produce:prod});
     }
     return completed;
   };
   let arr=normalizeTasks(output);
   if(!arr){
     const retry=await openai([{role:"system",content:system},{role:"user",content:`The previous exercise JSON did not meet the schema. Regenerate EXACTLY ${items.length} entries in this order ${JSON.stringify(items)}. Each entry needs word, recognize {prompt, options: three strings, correctOption: an exact option string, ruHint}, retrieve {prompt with literal _____, answer, ruHint}, and produce {prompt, ruHint}. Return {"items":[...]}. No omissions.`}]);
     arr=normalizeTasks(retry);
   }
   if(!arr)throw Error("AI could not generate valid exercises after two attempts. Please retry with fewer words.");
   return res.status(200).json({items:arr});
  }
  if(b.action==="check"){
   const stage=String(b.stage||"");
   const answer=String(b.answer||"").trim().slice(0,500);
   const word=String(b.word||"").trim().slice(0,100);
   const task=b.task||{};
   if(!answer||!word||!["recognize","retrieve","produce"].includes(stage))return res.status(400).json({error:"Invalid check request"});
   const normalize=s=>String(s||"").toLowerCase().replace(/[.!?]+$/,"").replace(/\s+/g," ").trim();
   if(stage==="recognize"){
    const correct=normalize(answer)===normalize(task.correctOption);
    return res.status(200).json({status:correct?"correct":"incorrect",feedback:correct?"Exactly right.":"Look at the meaning in this context and try another choice."});
   }
   if(stage==="retrieve"){
    const expected=normalize(task.answer||word),response=normalize(answer);
    const prompt=String(task.prompt||"");
    const completed=normalize(prompt.replace("_____",answer));
    const fullExpected=normalize(prompt.replace("_____",task.answer||word));
    if(response===expected||response===fullExpected||completed===fullExpected)return res.status(200).json({status:"correct",feedback:"Correct use of the expression."});
   }
   const out=await openai([{role:"system",content:system},{role:"user",content:`Check the student's response. Target word: ${JSON.stringify(word)}; stage ${stage}; task ${JSON.stringify(task)}; exact student response: ${JSON.stringify(answer)}. Allow full completed sentences for gap-fill. Return JSON {"status":"correct"|"incorrect"|"review","feedback":"<=28 words in clear English","suggestion":""}. Only return incorrect if a real, demonstrable error affects this task. The response may express unexpected ideas.`}]);
   if(!["correct","incorrect","review"].includes(out.status))out.status="review";
   if(out.status==="incorrect"&&!out.suggestion)out.status="review";
   return res.status(200).json({status:out.status,feedback:String(out.feedback||"Please review your response.").slice(0,350),suggestion:String(out.suggestion||"").slice(0,350)});
  }
  return res.status(400).json({error:"Unknown action"});
 }catch(e){return res.status(502).json({error:e.message||"AI service failed"})}
};



// A saved exercise can contain a plausible example and an incorrect AI-generated
// formula. Repair known patterns before presenting or assessing it.
function canonicalGrammarExercise(exercise, context){
 const e=exercise||{};
 const model=String(e.modelSentence||"");
 const form=String(e.targetStructure||"");
 const pattern=String(context?.pattern||"");
 const pastEvidence=/\b(?:was|were)\s+\w+ing\b/i.test(model);
 const pastName=/past\s+continuous|past\s+progressive/i.test(pattern+" "+form);
 const brokenPast=/\b(?:was|were)\s*\+\s*(?:base|infinitive|bare)\s*(?:verb|form)\b/i.test(form);
 if(pastName||brokenPast||(pastEvidence&&/\bwere\b/i.test(form)&&/\bbase\s+verb\b/i.test(form))){
   e.targetStructure="Past Continuous: subject + was/were + verb-ing";
   const produce=e.produce||{};
   produce.prompt="Write your own sentence about gender roles, education or work using Past Continuous (was/were + verb-ing). Choose any suitable subject.";
   produce.promptTranslationRu="Напишите собственное предложение о гендерных ролях, образовании или работе, используя Past Continuous (was/were + глагол с окончанием -ing). Вы можете выбрать любое подходящее подлежащее.";
   produce.ruHint=produce.promptTranslationRu;
   e.produce=produce;
   // Model must actually demonstrate the canonical form; do not fabricate
   // another model and mislabel an unrelated construction.
   if(!pastEvidence)e.modelSentence="Women were entering professions that had traditionally been dominated by men.";
   if(!pastEvidence)e.modelTranslationRu="Женщины начинали работать в профессиях, в которых раньше преимущественно работали мужчины.";
 }
 // Broaden example-specific "is" when practising the missing copular BE.
 const saved=String(context?.pattern||"")+" "+String(context?.rule||"");
 const narrow=/subject\s*\+\s*is\s*\+\s*adjective|\bis\s*\+\s*adjective/i.test(form);
 const singularOnly=/third.person singular|3rd.person singular|he\/she\/it only/i.test(saved);
 if(narrow&&!singularOnly){
   e.targetStructure="subject + am/is/are + adjective (subject–verb agreement)";
   if(e.produce){
     e.produce.prompt="Write an original sentence about gender roles, work or education using am, is or are followed by an adjective, agreeing with your chosen subject.";
     e.produce.promptTranslationRu="Напишите собственное предложение о гендерных ролях, работе или образовании, используя am, is или are перед прилагательным в соответствии с подлежащим.";
     e.produce.ruHint=e.produce.promptTranslationRu;
   }
 }
 return e;
}

async function genderGrammarPracticeHandler(req,res){
 const b=req.body||{};
 if(req.method!=="POST")return json(res,405,{error:"POST required"});
 if(!process.env.OPENAI_API_KEY)return json(res,503,{error:"OPENAI_API_KEY is missing"});
 try{
  const item=b.item||{};
  const safe=x=>String(x||"").trim().slice(0,800);
  const context={pattern:safe(item.pattern),original:safe(item.original),corrected:safe(item.corrected),rule:safe(item.rule),module:"Gender Roles: Then & Now",level:"B2–C1"};
  if(!context.pattern||!context.original||!context.corrected)return json(res,400,{error:"Missing saved grammar pattern"});
  if(b.action==="grammar_build"){
   const baseInstruction=`For a missing "be" learner error such as "culture very interesting", generate the GENERAL copular BE + adjective target: subject + am/is/are + adjective, respecting agreement (I am, she is, women are). Never specify "subject + is + adjective" as a blanket rule. Do NOT mark valid "are" sentences as incorrect merely because the model used "is". Recognition must have precisely one actually grammatical option and two genuinely ungrammatical options for the targeted phenomenon. Retrieval and production can use any grammatically appropriate subject. 
Create ONE complete B2-C1 grammar exercise set in JSON for the saved learner pattern. Output EXACTLY this schema, with all properties as strings except the options array:
{"targetStructure":"short explicit grammar form to practise (e.g. she + doesn't + base verb)","modelSentence":"one original full English sentence accurately demonstrating targetStructure on gender roles","modelTranslationRu":"accurate Russian translation of modelSentence","recognize":{"prompt":"one specific target-pattern question","promptTranslationRu":"accurate Russian translation of prompt","options":["full sentence A","full sentence B","full sentence C"],"correctOption":"EXACT text of one of the options","ruHint":"Russian translation of the question and brief target grammar explanation"},"retrieve":{"prompt":"a different sentence to correct or complete","promptTranslationRu":"accurate Russian translation of prompt","modelAnswer":"one valid full corrected sentence","ruHint":"Russian translation of the task and, optionally, brief rule"},"produce":{"prompt":"a new independent communicative sentence task explicitly requiring targetStructure","promptTranslationRu":"accurate Russian translation of prompt","ruHint":"Russian translation of the task, without supplying the student's own sentence"}}.
Choose a precise morphosyntactic target, and ensure the formula is linguistically correct (e.g. Past Continuous is subject + was/were + verb-ing, NEVER "were + base verb"). Derive targetStructure from the demonstrated verb form and double-check modelSentence conforms. Do not turn the model sentence into a mandatory answer: student may choose ANY suitable subject and independent phrasing. Production prompts MUST name the grammar construction and a broad topic only; NEVER require a particular subject, wording or details unless that constraint is explicitly stated in the displayed student-facing prompt. Avoid under-specified prompts where hidden requirements would be needed to assess the answer.
Recognize must have exactly THREE distinct, non-empty options; EXACTLY ONE option correct for the target grammar rule. correctOption MUST match it character-for-character. Retrieval must differ from recognition. Production must elicit ORIGINAL text about gender roles, education or work. The target grammar FORM must be named in the production prompt and demonstrated naturally in modelSentence; if a concrete subject is required, it MUST be stated in the learner-facing prompt, otherwise accept any suitable subject. The target grammar may be different from merely describing the topic; explicitly ask for the target structure. Russian hints must begin with accurate Russian translations, never only vague advice. Avoid ambiguous distractors and stylistic-only questions. Never invent learner errors. Return ONE JSON object only.`;
   const failures=[];
   let instruction=baseInstruction;
   for(let attempt=0;attempt<3;attempt++){
    const result=await openai([
     {role:"system",content:instruction},
     {role:"user",content:JSON.stringify({item:context,requiredSchema:{targetStructure:"",modelSentence:"",modelTranslationRu:"",recognize:{prompt:"",promptTranslationRu:"",options:["","",""],correctOption:"",ruHint:""},retrieve:{prompt:"",promptTranslationRu:"",modelAnswer:"",ruHint:""},produce:{prompt:"",promptTranslationRu:"",ruHint:""}}})}
    ]);
    // Models sometimes nest a perfectly valid object inside "exercise" or "exercises".
    const source=(result.exercise&&typeof result.exercise==="object")?result.exercise:
                 (result.exercises&&typeof result.exercises==="object"&&!Array.isArray(result.exercises))?result.exercises:result;
    const r=source.recognize||source.recognition||{},t=source.retrieve||source.retrieval||{},p=source.produce||source.production||{};
    const text=x=>typeof x==="string"?x.trim():"";
    const options=Array.isArray(r.options)?r.options.map(text):[];
    const correctRaw=text(r.correctOption||r.correctAnswer||r.answer);
    const correct=options.find(o=>o===correctRaw)||options.find(o=>o.toLowerCase()===correctRaw.toLowerCase())||
      (/^[ABC]$/i.test(correctRaw)?options["ABC".indexOf(correctRaw.toUpperCase())]:/^[123]$/.test(correctRaw)?options[Number(correctRaw)-1]:null);
    const exercise={
     targetStructure:text(source.targetStructure||source.targetForm||source.grammarStructure)||context.pattern,
     modelSentence:text(source.modelSentence||source.exampleSentence)||context.corrected,
     modelTranslationRu:text(source.modelTranslationRu||source.exampleTranslationRu),
     recognize:{prompt:text(r.prompt||r.question),options,correctOption:correct||"",promptTranslationRu:text(r.promptTranslationRu||r.translationRu),ruHint:text(r.ruHint||r.hintRu)},
     retrieve:{prompt:text(t.prompt||t.question),modelAnswer:text(t.modelAnswer||t.correctAnswer||t.answer),promptTranslationRu:text(t.promptTranslationRu||t.translationRu),ruHint:text(t.ruHint||t.hintRu)},
     produce:{prompt:text(p.prompt||p.question),promptTranslationRu:text(p.promptTranslationRu||p.translationRu),ruHint:text(p.ruHint||p.hintRu)}
    };
    canonicalGrammarExercise(exercise,context);
    const missing=[];
    if(!exercise.recognize.prompt)missing.push("recognize.prompt");
    if(options.length!==3||options.some(x=>!x)||new Set(options).size!==3)missing.push("recognize.options (three distinct full sentences)");
    if(!exercise.recognize.correctOption)missing.push("recognize.correctOption (verbatim option)");
    if(!exercise.retrieve.prompt)missing.push("retrieve.prompt");
    if(!exercise.retrieve.modelAnswer)missing.push("retrieve.modelAnswer");
    if(!exercise.produce.prompt)missing.push("produce.prompt");
    if(!exercise.modelTranslationRu)missing.push("modelTranslationRu");
    if(!exercise.recognize.promptTranslationRu)missing.push("recognize.promptTranslationRu");
    if(!exercise.retrieve.promptTranslationRu)missing.push("retrieve.promptTranslationRu");
    if(!exercise.produce.promptTranslationRu)missing.push("produce.promptTranslationRu");
    if(!missing.length){
     // Structural checks passed. Do not block valid exercises with a second generative audit.
     // The student's answers are still assessed separately by the existing grammar_check route.
     return json(res,200,{exercise});
    }
    failures.push(missing.join(", "));
    instruction=baseInstruction+"\nPREVIOUS ATTEMPT WAS INVALID. Regenerate ALL THREE STAGES, not only missing fields. Fix these missing/invalid fields: "+missing.join("; ")+".";
   }
   console.error("Gender grammar AI schema failure after 3 attempts:",failures);
   return json(res,502,{error:"AI did not return complete grammar exercises after three attempts. Please retry."});
  }
  if(b.action==="grammar_check"){
   const stage=safe(b.stage).toLowerCase(),answer=safe(b.answer),exercise=b.exercise||{};
   if(!["recognize","retrieve","produce"].includes(stage)||!answer)return json(res,400,{error:"Answer and stage required"});
   if(stage==="recognize"){
    const target=String(exercise.correctOption||"");
    const normalized=x=>String(x).trim().toLowerCase().replace(/[.!?]+$/,"").replace(/\s+/g," ");
    const correct=normalized(answer)===normalized(target);
    return json(res,200,{status:correct?"correct":"incorrect",feedback:correct?"Correct choice — the grammar agrees with the target pattern.":"Review the target grammar and try again.",suggestion:correct?"":target});
   }
   const checkedExercise=canonicalGrammarExercise({...exercise},context);
   const result=await openai([
    {role:"system",content:`You are a rigorous but fair B2–C1 ESL grammar assessor. The LEARNER-FACING PROMPT is the only source of task constraints. A MODEL SENTENCE is an illustration, NOT a required answer. NEVER demand the same subject, nouns, vocabulary, or phrasing as a model unless the learner-facing prompt EXPLICITLY and unambiguously requires them. Example: "People were working hard to support their families" is grammatically valid Past Continuous and must NOT be rejected because the model said "Men were working". Judge (1) grammatical accuracy, (2) use of the target grammatical FORM, (3) relevance to the ACTUAL displayed prompt. If the sentence uses the required form correctly and is broadly on topic, return correct; optionally suggest richer topical specificity without penalizing. Grammar-correct but missing the target pattern: give constructive "correct English, target not demonstrated" feedback, never falsely call it a grammatical error. If the targetStructure contains an invalid formula, infer the accurate pattern from the model sentence and grammar-pattern context, not the erroneous formula (e.g. were working = was/were + verb-ing, never were + base verb). Do not judge copied model wording more favorably than original correct language. Never invent errors or misclassify speech recognition artifacts as grammar errors. If uncertain return review. Return ONLY JSON {"status":"correct|incorrect|review","grammarAccuracy":"correct|incorrect|review","targetUsed":true|false,"topicRelevant":true|false,"feedback":"specific supportive feedback","suggestion":"optional example"}. Mark correct for accurate grammar + demonstrated target + sufficiently relevant answer, NOT lexical similarity.`},
    {role:"user",content:JSON.stringify({target:context,targetStructure:safe(checkedExercise.targetStructure||b.targetStructure||item.pattern),stage,learnerFacingPrompt:safe(checkedExercise.prompt),modelAnswerForIllustrationOnly:safe(exercise.modelAnswer),modelSentenceForIllustrationOnly:safe(checkedExercise.modelSentence||b.modelSentence),studentAnswer:answer,explicitInstruction:"Do not impose any unstated subject requirement; evaluate valid independent alternatives fairly."})}
   ]);
   const status=["correct","incorrect","review"].includes(result.status)?result.status:"review";
   const accuracy=["correct","incorrect","review"].includes(result.grammarAccuracy)?result.grammarAccuracy:"review";
   const targetUsed=result.targetUsed===true;
   const topicRelevant=result.topicRelevant===true;
   const finalStatus=status==="correct"&&accuracy==="correct"&&targetUsed&&topicRelevant?"correct":status==="review"||accuracy==="review"?"review":"incorrect";
   return json(res,200,{status:finalStatus,grammarAccuracy:accuracy,targetUsed,topicRelevant,feedback:safe(result.feedback)||"Review this answer with your teacher.",suggestion:safe(result.suggestion)});
  }
  return json(res,400,{error:"Unknown grammar action"});
 }catch(e){console.error("Gender grammar exercise error",e);return json(res,502,{error:String(e.message||"Grammar AI unavailable").slice(0,220)})}
}
