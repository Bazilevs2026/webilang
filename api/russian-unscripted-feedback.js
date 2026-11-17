// Russian Unscripted feedback endpoint. Requires OPENAI_API_KEY on Vercel.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI service not configured'});
 const b=req.body||{},mode=b.mode==='kostya'?'kostya':'feedback',txt=String(b.text||'').trim().slice(0,4000);
 if(txt.length<2)return res.status(400).json({error:'No text'});
 const system=mode==='kostya'
  ? 'Ты Костя, преподаватель русского языка Webilang A1–A2. По умолчанию отвечай по-русски 1–3 короткими предложениями. Если студент прямо просит объяснить по-английски, отвечай по-английски. Учитывай только текущие данные задания из context. Не придумывай результаты проверки и не заявляй, что видел экран; ты получил сведения от интерфейса. Дай одну подсказку без полного решения, если его явно не просили. Ответ JSON: {"answer":"..."}.'
  : `Ты опытный преподаватель РКИ A1–A2. Оценивай ТОЛЬКО речь ученика из поля text, НИКОГДА не реплики собеседника из context. Тема транспорта.
Строго верни один JSON object с ключами interaction, grammar, vocabulary, nextStep (каждый значение — ТОЛЬКО русский текст, не объект, не JSON), grammarItems и vocabularyItems (массивы объектов).
Элемент ошибки: {"original":"ДОСЛОВНАЯ цитата ошибочного фрагмента ученика","corrected":"правильная форма","practice":"короткий правильный образец","explanation":"очень простое объяснение"}. Подготовь максимум 3 грамматические и 3 лексические ошибки.
Важнейшее правило: глагол в неверной форме («Я искать дорога», «Я ехать на парк») и неправильный падеж/предлог относятся к ГРАММАТИКЕ, а не к лексике. Слово «дорога» вместо «дорогу» — ошибка падежа, НЕ лексики. В vocabularyItems включай ТОЛЬКО неверно выбранные по смыслу слова; не добавляй туда грамматические формы или просто полезные выражения.
ПРИМЕР. Для текста «Я искать дорога. Я ехать на парк.» grammarItems должны включать ошибки «Я искать» → «Я ищу», «дорога» → «дорогу», «Я ехать» → «Я еду» (и по возможности направление «на парк» → «в парк»); vocabularyItems должен быть пустым.
Для фразы «Я искать дорога. Я ехать на парк.» grammar НЕ может быть «Ошибок не обнаружено». Не выдумывай ошибок: каждое поле original ДОЛЖНО быть дословным фрагментом text. corrected обязательно меняет ошибку. Все remarks должны быть понятно сформулированы простыми словами, без JSON внутри текста, без сложных терминов и без ВНЖ.
interaction — оцени достигнутую коммуникативную цель, даже если формы неверны. grammar — 1–3 коротких примера реальных исправлений. vocabulary — «Ошибок в выборе слов не обнаружено», если неправильных слов нет. nextStep — одно практическое упражнение.`;
 try{
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.RUSSIAN_UNSCRIPTED_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},temperature:.2,max_tokens:1100,messages:[{role:'system',content:system},{role:'user',content:JSON.stringify({text:txt,task:b.type||'',scene:b.scene??0,context:b.context||null})}]})});
  const data=await r.json();if(!r.ok)throw Error('Provider returned '+r.status);
  const out=JSON.parse(data.choices?.[0]?.message?.content||'{}');
  if(mode==='kostya')return res.status(200).json({answer:String(out.answer||'')});
  // The LLM can occasionally embed serialized correction objects in prose.
  // Do not expose raw JSON to learners or label inflection errors as vocabulary.
  const normalize=t=>String(t||'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
  const fromTranscript=normalize(txt);
  const cleanText=x=>{
    if(typeof x==='string'){
      const t=x.trim();
      if(!t)return '';
      if((t.startsWith('{')&&t.endsWith('}'))||(t.startsWith('[')&&t.endsWith(']'))){
        try{return cleanText(JSON.parse(t));}catch{return 'См. исправления ниже.';}
      }
      return t.slice(0,800);
    }
    if(Array.isArray(x))return x.map(cleanText).filter(Boolean).join('; ').slice(0,800);
    if(x&&typeof x==='object'){
      if(typeof x.original==='string'&&typeof x.corrected==='string')
        return `${x.original} → ${x.corrected}${x.explanation?' — '+x.explanation:''}`.slice(0,800);
      return Object.values(x).map(cleanText).filter(Boolean).join('; ').slice(0,800);
    }
    return '';
  };
  const items=(arr,limit)=>Array.isArray(arr)?arr.filter(x=>{
    if(!x||typeof x!=='object'||Array.isArray(x))return false;
    if(['original','corrected','practice'].some(k=>typeof x[k]!=='string'))return false;
    const original=normalize(x.original),corrected=normalize(x.corrected),practice=x.practice.trim();
    return original.length>=2&&original.length<=180&&corrected.length>0&&corrected.length<=180&&
      original!==corrected&&practice.length>=2&&practice.length<=180&&fromTranscript.includes(original);
  }).filter((x,i,list)=>list.findIndex(y=>normalize(y.original)===normalize(x.original)&&normalize(y.corrected)===normalize(x.corrected))===i)
  .slice(0,limit).map(x=>({original:x.original.trim(),corrected:x.corrected.trim(),practice:x.practice.trim(),explanation:cleanText(x.explanation||'').slice(0,180)})):[];
  let grammarItems=items(out.grammarItems,5);
  let vocabularyItems=items(out.vocabularyItems,5);
  // Fix classification: inflection, wrong case and infinitive instead of finite verb
  // are grammar, never vocabulary. Match short original fragments in pupil's own text.
  const inflectionError=x=>{
    const a=normalize(x.original),b=normalize(x.corrected);
    if(/^(дорога|дорогу|дороге|дороги|парк|парка|парке|касса|кассу|кассе)$/.test(a)&&/^(дорога|дорогу|дороге|дороги|парк|парка|парке|касса|кассу|кассе)$/.test(b))return true;
    if(/(?<![\p{L}])(искать|ехать|идти|ходить|ездить)(?![\p{L}])/.test(a)&&/(?<![\p{L}])(ищу|еду|иду|ходим|ездим|едет|едут|ищет)(?![\p{L}])/.test(b))return true;
    return false;
  };
  const relocated=vocabularyItems.filter(inflectionError);
  grammarItems.push(...relocated);
  vocabularyItems=vocabularyItems.filter(x=>!inflectionError(x));
  // Predictable A1–A2 constructions: use targeted fallbacks only when exact
  // incorrect sequence appears in the student transcript. No invented quotes.
  const patterns=[
   {re:/(?<![\p{L}])я\s+искать(?![\p{L}])/giu,cor:'я ищу',practice:'Я ищу дорогу.',why:'После «я» говорим «ищу», а не «искать».'},
   {re:/(?<![\p{L}])я\s+ехать(?![\p{L}])/giu,cor:'я еду',practice:'Я еду в парк.',why:'После «я» говорим «еду», а не «ехать».'},
   {re:/(?<![\p{L}])я\s+идти(?![\p{L}])/giu,cor:'я иду',practice:'Я иду к кассе.',why:'После «я» говорим «иду», а не «идти».'},
   {re:/(?<![\p{L}])на\s+парк(?![\p{L}])/giu,cor:'в парк',practice:'Я еду в парк.',why:'Для направления к парку говорим «в парк».'}
  ];
  for(const p of patterns){
    const match=[...txt.matchAll(p.re)][0];if(!match)continue;
    const original=match[0];
    if(!grammarItems.some(x=>normalize(x.original)===normalize(original))){
      grammarItems.push({original,corrected:p.cor,practice:p.practice,explanation:p.why});
    }
  }
  // Prefer coverage of distinct grammar errors; remove duplicates across categories.
  const uniq=a=>a.filter((x,i)=>a.findIndex(y=>normalize(y.original)===normalize(x.original))===i).slice(0,4);
  grammarItems=uniq(grammarItems);
  vocabularyItems=uniq(vocabularyItems).filter(x=>!grammarItems.some(g=>normalize(g.original)===normalize(x.original)));
  const grammarSummary=grammarItems.length?grammarItems.map(x=>`${x.original} → ${x.corrected}`).join('; '):cleanText(out.grammar)||'Ошибок не обнаружено.';
  const vocabSummary=vocabularyItems.length?vocabularyItems.map(x=>`${x.original} → ${x.corrected}`).join('; '):'Ошибок в выборе слов не обнаружено.';
  return res.status(200).json({
    interaction:cleanText(out.interaction)||'Вы смогли объяснить, куда хотите попасть.',
    grammar:grammarSummary,vocabulary:vocabSummary,
    nextStep:cleanText(out.nextStep)||'Скажите ещё два предложения о маршруте.',
    grammarItems,vocabularyItems
  });
 }catch(e){console.error('RU feedback',e);return res.status(502).json({error:'AI feedback is currently unavailable'});}
}
