// Russian Unscripted feedback endpoint. Requires OPENAI_API_KEY on Vercel.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI service not configured'});
 const b=req.body||{},mode=b.mode==='kostya'?'kostya':'feedback',txt=String(b.text||'').trim().slice(0,4000);
 if(txt.length<2)return res.status(400).json({error:'No text'});
 const system=mode==='kostya'
  ? 'Ты Костя, доброжелательный преподаватель русского языка как иностранного. Уровень A1–A2. Объясняй коротко, на простом русском, до 65 слов. Короткий перевод на английский только при необходимости. Не выполняй задание вместо ученика. Ответ JSON: {"answer":"..."}.'
  : `Ты преподаватель русского языка как иностранного уровня A1–A2. Анализируй ТОЛЬКО фактически приведённую речь ученика, не выдумывай ошибки. Тема: вокзал, автобус, транспорт и поездки. Твоя обратная связь — короткие понятные рекомендации на русском без теоретических терминов. Верни JSON с полями:
"interaction": строка — удалось ли объяснить задачу и поддержать разговор;
"grammar": строка — исправь конкретные ошибки в форме «было → лучше»; не выдумывай ошибок;
"vocabulary": строка — исправь или предложи конкретные слова и устойчивые выражения;
"nextStep": строка — один короткий практический шаг;
"grammarItems": массив из 0–4 СТРОК, каждая — конкретная полезная конструкция с примером, которую ученик вправе сохранить для тренировки;
"vocabularyItems": массив из 0–5 СТРОК, каждая — ОДНО правильное русское слово или выражение из исправления/рекомендации (например «искать дорогу», «доехать до остановки», «опоздать на поезд»).
Для массивов используй строки, НЕ объекты, НЕ длинные объяснения; не повторяй одинаковые элементы. Если замечаний нет, возвращай пустые массивы. Не оценивай произношение по транскрипту. Не упоминай ВНЖ.`;
 try{
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.RUSSIAN_UNSCRIPTED_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},temperature:.2,max_tokens:1100,messages:[{role:'system',content:system},{role:'user',content:JSON.stringify({text:txt,task:b.type||'',scene:b.scene??0,context:b.context||null})}]})});
  const data=await r.json();if(!r.ok)throw Error('Provider returned '+r.status);
  const out=JSON.parse(data.choices?.[0]?.message?.content||'{}');
  if(mode==='kostya')return res.status(200).json({answer:String(out.answer||'')});
  const pickString=x=>typeof x==='string'?x:'';
  const items=(arr,limit)=>Array.isArray(arr)?[...new Set(arr.map(x=>typeof x==='string'?x.trim():'').filter(x=>x&&x!=='[object Object]'&&x.length<250))].slice(0,limit):[];
  return res.status(200).json({interaction:pickString(out.interaction),grammar:pickString(out.grammar),vocabulary:pickString(out.vocabulary),nextStep:pickString(out.nextStep),grammarItems:items(out.grammarItems,4),vocabularyItems:items(out.vocabularyItems,5)});
 }catch(e){console.error('RU feedback',e);return res.status(502).json({error:'AI feedback is currently unavailable'});}
}
