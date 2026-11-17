// Vercel serverless API for Russian Unscripted. Requires OPENAI_API_KEY.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI service not configured'});
 const b=req.body||{}, mode=b.mode==='kostya'?'kostya':'feedback', txt=String(b.text||'').trim().slice(0,4000);
 if(txt.length<2)return res.status(400).json({error:'No text'});
 const system=mode==='kostya'
 ?'Ты Костя, доброжелательный преподаватель русского языка как иностранного. Уровень ученика A1–A2. Объясняй по-русски простыми словами, кратко (до 65 слов). Можно вставить короткий перевод на английский при необходимости. Отвечай только на вопрос, не выполняй экзаменационное задание вместо ученика. Ответ JSON: {"answer":"..."}.'
 :'Ты преподаватель русского языка как иностранного, эксперт по коммуникативной подготовке к экзамену на ВНЖ. Оцени ТОЛЬКО данный текст ученика, не выдумывай ошибок и данных о произношении. Ответ на простом русском. Формат JSON: {"interaction":"...","grammar":"...","vocabulary":"...","nextStep":"...","grammarItems":["точная грамматическая конструкция и пример"]}. Указывай ошибки с точными цитатами, корректным вариантом и кратким правилом. От 0 до 4 наиболее полезных grammarItems. Сохраняй тему вокзала и метро.';
 try{
 const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.RUSSIAN_UNSCRIPTED_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},temperature:.2,max_tokens:850,messages:[{role:'system',content:system},{role:'user',content:JSON.stringify({text:txt,task:b.type||'',scene:b.scene??0})}]})});
 const data=await r.json();if(!r.ok)throw Error('Provider returned '+r.status);
 return res.status(200).json(JSON.parse(data.choices?.[0]?.message?.content||'{}'));
 }catch(e){console.error('RU feedback',e);return res.status(502).json({error:'AI feedback is currently unavailable'})}
}
