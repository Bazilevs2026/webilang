// Webilang Art Lab — six-step personalized grammar practice.
// Replace only /api/artlab-stock-practice.js. Keeps the existing POST contract.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const body = typeof req.body === 'string' ? (()=>{try{return JSON.parse(req.body)}catch{return {}}})() : (req.body || {});
  const pattern = String(body.pattern || '').trim().slice(0,180);
  if (!pattern) return res.status(400).json({ error: 'No grammar structure provided' });
  const mode = body.mode === 'evaluate' ? 'evaluate' : 'generate';
  const model = process.env.ARTLAB_AI_MODEL || 'gpt-4o-mini';

  // The transcript may yield a metalinguistic description rather than the exact form.
  // These variants all teach the same structure: Let me + base verb.
  const isLetMe = /\blet\s+me\b/i.test(pattern) && !/\blet\s+me\s+not\b/i.test(pattern);
  function letMePractice() {
    return [
      {stage:'recognize',prompt:'Choose the grammatically correct sentence to introduce yourself.',options:['Let me introducing myself.','Let me introduce myself.','Let me to introduce myself.'],answer:'Let me introduce myself.',hint:'After “let me”, use the base verb without “to”.'},
      {stage:'recognize',prompt:'Choose the correct way to offer a suggestion in a meeting.',options:['Let me suggest an idea.','Let me suggesting an idea.','Let me to suggest an idea.'],answer:'Let me suggest an idea.',hint:'Use “let me” + base verb (suggest).'},
      {stage:'retrieve',prompt:'Complete with TWO words to offer to help: “___ ___ show you the painting.”',options:[],answer:'Let me',hint:'A two-word expression that starts with “Let” and ends with “me”.'},
      {stage:'retrieve',prompt:'Complete with ONE word: “Let ___ explain my idea.”',options:[],answer:'me',hint:'The object pronoun used when offering to do something yourself.'},
      {stage:'produce',prompt:'You meet the gallery director for the first time. Introduce yourself using “Let me” and a base verb. Write a complete sentence.',options:[],answer:'Let me introduce myself. I am the new assistant.',hint:'Start with “Let me” and follow it with a base verb. Your own sentence can differ.'},
      {stage:'produce',prompt:'Your team is discussing the Rivera mural. Offer a solution using “Let me” and a base verb. Write a complete sentence.',options:[],answer:'Let me suggest a compromise for the exhibition.',hint:'Offer an idea using “Let me” + suggest / explain / show / propose. Other natural answers are accepted by AI evaluation.'}
    ];
  }

  // For recurring grammar patterns returned by AI feedback, use pedagogically
  // reviewed, deterministic tasks rather than rejecting an entire AI batch.
  function curatedPractice(pattern){
    const p=pattern.toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');
    if(isLetMe)return letMePractice();
    const q=(stage,prompt,answer,options=[],hint='Focus on the grammar structure.')=>({stage,prompt,answer,options,hint});
    if(/question formation|question word order|where are you from/.test(p)) return [
      q('recognize','Which question has correct word order?','Where are you from?',['Where is you from?','Where are you from?','Where you are from?'],'Put are before you.'),
      q('recognize','Choose the grammatically correct question.','Why does the artist disagree?',['Why the artist does disagree?','Why does the artist disagree?','Why does the artist disagrees?'],'Use does + subject + base verb.'),
      q('retrieve','Complete with ONE word: Where ___ you from?','are',[],'Use the present form of be with you.'),
      q('retrieve','Complete with ONE word: What ___ you think about the mural?','do',[],'Use the auxiliary for present-simple questions with you.'),
      q('produce','Ask Nova where she grew up. Write one complete, correctly ordered English question.','Where did you grow up?',[],'Use question word + auxiliary + subject + verb.'),
      q('produce','Ask Chaz what he thinks about the painting. Write one complete English question.','What do you think about the painting?',[],'Use what + do + you + base verb.')
    ];
    if(/subject.verb agreement|i am,? not i is|i am not i is/.test(p)) return [
      q('recognize','Which sentence uses the correct form of be?','I am ready for the exhibition.',['I is ready for the exhibition.','I are ready for the exhibition.','I am ready for the exhibition.'],'Use am with I.'),
      q('recognize','Choose the grammatically correct sentence.','The artist is nervous.',['The artist are nervous.','The artist is nervous.','The artist am nervous.'],'Use is with a singular subject.'),
      q('retrieve','Complete with ONE word: I ___ interested in modern art.','am',[],'After I, use am.'),
      q('retrieve','Complete with ONE word: My friend ___ an artist.','is',[],'A single friend takes is.'),
      q('produce','Write a full sentence introducing yourself with “I am”.','I am interested in painting.',[],'Use I am + complement.'),
      q('produce','Write a full sentence describing Nova using “she is”.','She is a gallery director.',[],'Use She is + complement.')
    ];
    if(/subject\s*\+\s*verb\s*\+\s*object|i think rivera should|opinion sentence/.test(p))return [
      q('recognize','Choose the correct sentence for giving an opinion.','I think Rivera should explain his idea.',['I think Rivera should explains his idea.','I think Rivera should to explain his idea.','I think Rivera should explain his idea.'],'After should, use the base verb.'),
      q('recognize','Which sentence expresses an opinion correctly?','I believe the artist should speak to Nova.',['I believe the artist should speaks to Nova.','I believe the artist should speak to Nova.','I believe the artist should to speak to Nova.'],'Use I believe + subject + should + base verb.'),
      q('retrieve','Complete with ONE word: I think Rivera ___ explain his idea.','should',[],'Use a modal for advice before a base verb.'),
      q('retrieve','Complete with ONE word: I ___ the artist should talk to the sponsor.','think',[],'Use the verb that introduces an opinion after I.'),
      q('produce','Give your opinion about the mural. Begin with “I think…” and write a complete sentence.','I think Rivera should keep the portrait.',[],'I think + subject + verb phrase.'),
      q('produce','Suggest how to resolve the conflict. Use “I believe…” in a complete sentence.','I believe the two sides should discuss the mural.',[],'I believe + a complete clause.')
    ];
    if(/adjectives? to describe opinions|using adjectives|describe opinions/.test(p))return [
      q('recognize','Which sentence uses an adjective correctly after be?','The painting is beautiful.',['The painting is beautifully.','The painting is beautiful.','The painting is beauty.'],'After is, use an adjective.'),
      q('recognize','Choose the correct sentence about an exhibition.','I find this exhibition interesting.',['I find this exhibition interest.','I find this exhibition interestingly.','I find this exhibition interesting.'],'Use an adjective to describe the exhibition.'),
      q('retrieve','Complete with ONE word (use the adjective form of “beauty”): The painting is ___.','beautiful',[],'The adjective is not the noun beauty.'),
      q('retrieve','Complete with ONE word (use the adjective form of “interest”): The exhibition seems ___.','interesting',[],'Describe the thing that creates interest.'),
      q('produce','Describe an unusual painting using one opinion adjective in a complete sentence.','I think the painting is fascinating.',[],'Give a real opinion using an adjective.'),
      q('produce','Tell Nova what you think about the exhibition. Include a descriptive adjective in a full sentence.','I find the exhibition exciting.',[],'Use an adjective such as exciting, unusual, or impressive.')
    ];
    return null;
  }

  const evaluating = `You are a precise A2-B1 language teacher. Assess whether the learner's original sentence uses the specified grammar pattern and responds appropriately to the task. Accept correct, natural alternatives, including answers different from the sample. Distinguish form errors from personal opinions. If the task specifies “Let me” + base verb, accept an appropriate full sentence such as “Let me explain my idea.” Return JSON only: {"correct":boolean,"feedback":"brief constructive feedback","example":"one possible answer"}.`;
  const generating = `You write A2–B1 English practice for exactly one grammar pattern: ${JSON.stringify(pattern)}.
Generate exactly SIX questions in this order: 2 recognize (multiple choice), 2 retrieve (constrained gaps), 2 produce (open-ended sentences).
RECOGNIZE: exactly three different options, exactly ONE grammatical option, two unmistakably ungrammatical distractors. The question must explicitly ask for grammar, NOT an aesthetic judgement or the most interesting opinion. Put choices ONLY in the options array. The answer must match an option exactly.
RETRIEVE: choose a missing grammar form, not a subjective vocabulary item. State whether ONE word or TWO words are needed and supply enough structural context to ensure one correct answer. Use [] for options.
PRODUCE: one realistic communicative task per question; request a full independent sentence using the grammar pattern. The provided answer is an example only. Use [] for options.
Keep scenarios distinct and comprehensible. Do not copy the same prompt across stages. No multi-part question in a single item.
Return JSON only with {"questions":[{"stage":"recognize|retrieve|produce","prompt":"...","options":["..."],"answer":"...","hint":"..."}, ...]}.`;
  async function requestModel(system, user, temperature, max_tokens) {
    if (!process.env.OPENAI_API_KEY) throw Error('OPENAI_API_KEY is not configured');
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',headers: {Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
      body: JSON.stringify({model,temperature,max_tokens,response_format:{type:'json_object'},messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(user)}]})
    });
    const data=await upstream.json();
    if(!upstream.ok){console.error('Art Lab stock practice:',upstream.status,JSON.stringify(data).slice(0,300));throw Error('AI service unavailable')}
    return JSON.parse(data.choices?.[0]?.message?.content||'{}');
  }
  function validate(qs){
    if(!Array.isArray(qs)||qs.length!==6)return 'Six questions are required';
    const stages=['recognize','recognize','retrieve','retrieve','produce','produce'];
    const unique=new Set();
    for(let i=0;i<6;i++){
      const q=qs[i];
      if(!q||q.stage!==stages[i]||typeof q.prompt!=='string'||typeof q.answer!=='string'||!q.prompt.trim()||!q.answer.trim())return 'Invalid question';
      const key=q.prompt.toLowerCase().replace(/[^a-z\d]/g,'');
      if(unique.has(key))return 'Repeated prompts';unique.add(key);
      if(q.stage==='recognize'){
        if(!Array.isArray(q.options)||q.options.length!==3||!q.options.every(x=>typeof x==='string')||!q.options.includes(q.answer)||new Set(q.options.map(x=>x.toLowerCase().trim())).size!==3)return 'Invalid answer choices';
        if(/\b(?:how would you describe|which (?:opinion|description|adjective) is best|what do you think about)\b/i.test(q.prompt))return 'Subjective question';
        if(/(?:\b(?:1|2|3)\s*[.)]\s*\w|\b[A-C]\s*[.)]\s*\w)/.test(q.prompt))return 'Options in prompt';
      } else if(!Array.isArray(q.options)||q.options.length)return 'Unexpected options';
    }
    return null;
  }
  const format=qs=>qs.map(q=>({stage:q.stage,prompt:q.prompt,answer:q.answer,hint:String(q.hint||''),options:q.stage==='recognize'?q.options:[]}));
  try {
    if(mode==='evaluate'){
      const prompt=String(body.prompt||'').slice(0,350);
      const studentAnswer=String(body.studentAnswer||'').slice(0,700).trim();
      if(!studentAnswer)return res.status(400).json({error:'No answer supplied'});
      const result=await requestModel(evaluating,{pattern,prompt,studentAnswer,modelAnswer:String(body.modelAnswer||'').slice(0,350)},0.15,250);
      return res.status(200).json({correct:result.correct===true,feedback:String(result.feedback||'Try again.'),example:String(result.example||'')});
    }
    // Guarantee a well-designed set for the common conversational pattern
    // even when the model returns ambiguity or the service times out.
    const reviewed=curatedPractice(pattern);
    if(reviewed){const issue=validate(reviewed);if(issue)throw Error('Internal grammar template invalid: '+issue);return res.status(200).json({pattern,questions:format(reviewed),source:'curated-grammar-template'});}
    let previousIssue='';
    for(let attempt=0;attempt<3;attempt++){
      const result=await requestModel(generating,{pattern,level:'A2-B1',count:{recognize:2,retrieve:2,produce:2},repair:previousIssue||undefined},0.35,2500);
      previousIssue=validate(result.questions);
      if(!previousIssue)return res.status(200).json({pattern,questions:format(result.questions),source:'ai-generated'});
      console.warn('Art Lab rejected stock questions:',previousIssue);
    }
    return res.status(422).json({error:'AI did not create six reliably checkable exercises for this particular pattern. The saved structure is safe; try a more specific grammar rule.'});
  } catch(e){console.error('Art Lab stock practice:',e);return res.status(502).json({error:'AI practice service temporarily unavailable. Please retry.'})}
}
