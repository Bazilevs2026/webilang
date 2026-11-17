// Russian Unscripted feedback endpoint. Requires OPENAI_API_KEY on Vercel.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI service not configured'});
 const b=req.body||{},mode=b.mode==='kostya'?'kostya':'feedback',txt=String(b.text||'').trim().slice(0,4000);
 if(txt.length<2)return res.status(400).json({error:'No text'});
 const system=mode==='kostya'
  ? 'Ты Костя, доброжелательный преподаватель русского языка как иностранного. Уровень A1–A2. Объясняй коротко, на простом русском, до 65 слов. Короткий перевод на английский только при необходимости. Не выполняй задание вместо ученика. Ответ JSON: {"answer":"..."}.'
  : `Ты преподаватель русского языка как иностранного A1–A2. Анализируй ТОЛЬКО текст ученика, не реплики персонажа. Тема: транспорт и поездки.
Верни JSON:
{"interaction":"краткая оценка успешности общения","grammar":"исправления ошибок или «Ошибок не обнаружено»","vocabulary":"исправления ошибок или «Ошибок не обнаружено»","nextStep":"один практический совет","grammarItems":[],"vocabularyItems":[]}.
КРИТИЧЕСКОЕ ПРАВИЛО: grammarItems и vocabularyItems — ТОЛЬКО ТО, ГДЕ УЧЕНИК ДЕЙСТВИТЕЛЬНО ОШИБСЯ. НЕ предлагай просто полезные слова, правильные фразы, правильные слова из диалога или конструкции на будущее. Если ошибки нет — пустой массив.
Каждый элемент обоих массивов — объект {"original":"точная цитата ошибочного фрагмента ученика","corrected":"исправленный фрагмент","practice":"короткая правильная конструкция / слово для сохранения","explanation":"короткое простое объяснение"}.
original ОБЯЗАТЕЛЬНО должен дословно встречаться в тексте ученика, учитывая регистр и ё/е. corrected должен действительно исправлять ошибку, а не просто перефразировать верный вариант. В grammarItems — ошибки грамматической формы или предлога, в vocabularyItems — неверное слово или словосочетание. Не записывай одну ошибку в оба списка.
Не включай ошибки распознавания речи, если не уверен в них. Не оценивай произношение. Не более трёх объектов на каждый массив. Без лингвистической теории и упоминания ВНЖ.`;
 try{
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.RUSSIAN_UNSCRIPTED_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},temperature:.2,max_tokens:1100,messages:[{role:'system',content:system},{role:'user',content:JSON.stringify({text:txt,task:b.type||'',scene:b.scene??0,context:b.context||null})}]})});
  const data=await r.json();if(!r.ok)throw Error('Provider returned '+r.status);
  const out=JSON.parse(data.choices?.[0]?.message?.content||'{}');
  if(mode==='kostya')return res.status(200).json({answer:String(out.answer||'')});
  const pickString=x=>typeof x==='string'?x:'';
  const normalize=t=>String(t||'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
  const fromTranscript=normalize(txt);
  const items=(arr,limit)=>Array.isArray(arr)?arr.filter(x=>{
    if(!x||typeof x!=='object'||Array.isArray(x))return false;
    const fields=['original','corrected','practice','explanation'];
    if(fields.some(k=>typeof x[k]!=='string'))return false;
    const original=normalize(x.original),corrected=normalize(x.corrected),practice=x.practice.trim();
    return original.length>=2&&original.length<=180&&corrected.length>0&&corrected.length<=180&&
      original!==corrected&&practice.length>=2&&practice.length<=180&&fromTranscript.includes(original);
  }).filter((x,i,list)=>list.findIndex(y=>normalize(y.original)===normalize(x.original)&&normalize(y.corrected)===normalize(x.corrected))===i)
  .slice(0,limit).map(x=>({original:x.original.trim(),corrected:x.corrected.trim(),practice:x.practice.trim(),explanation:x.explanation.trim().slice(0,180)})):[];
  const grammarItems=items(out.grammarItems,3);
  const vocabularyItems=items(out.vocabularyItems,3).filter(x=>!grammarItems.some(g=>normalize(g.original)===normalize(x.original)));
  return res.status(200).json({interaction:pickString(out.interaction),grammar:pickString(out.grammar),vocabulary:pickString(out.vocabulary),nextStep:pickString(out.nextStep),grammarItems,vocabularyItems});
 }catch(e){console.error('RU feedback',e);return res.status(502).json({error:'AI feedback is currently unavailable'});}
}
