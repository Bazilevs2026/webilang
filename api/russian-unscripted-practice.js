/* Webilang Russian Unscripted - target-anchored, situational A1-A2 Stock practice.
   A model response is used only when it actually tests the selected expression. */
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 const b=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
 const item=String(b.item||'').trim().slice(0,160),kind=b.kind==='word'?'word':'grammar';
 if(!item)return res.status(400).json({error:'Сначала выберите одну фразу'});
 const norm=x=>String(x||'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[«»".!?]/g,'').replace(/\s+/g,' ').trim();
 const target=norm(item);
 const stages=['Recognition','Retrieval','Production'];
 const questionsFor=(phrase)=>{
  // Direct practice of the learner's exact saved expression, never an unrelated rule.
  if(/что мне делать в этой ситуации/.test(norm(phrase)))return [
   {stage:'Recognition',prompt:'Ты опоздал на поезд и не знаешь, как поступить. Выбери: Что мне делать в этой ситуации? / Где у вас автобус? / Я живу в Москве.',answer:'Что мне делать в этой ситуации?',hint:'Нужно вежливо попросить совета.'},
   {stage:'Retrieval',prompt:'Ты потерял билет. Спроси сотрудника вокзала, что тебе теперь делать.',answer:'Что мне делать в этой ситуации?',hint:'Начни с «Что мне делать…».'},
   {stage:'Production',prompt:'Представь, что ты опоздал на поезд. Попроси совета, объяснив свою проблему.',answer:'Я опоздал на поезд. Что мне делать в этой ситуации?',hint:'Назови проблему, затем попроси совета.'}
  ];
  const safe=phrase.replace(/\s+/g,' ').trim().slice(0,125);
  return [
   {stage:'Recognition',prompt:`Ты разговариваешь с человеком на вокзале. Выбери подходящую фразу: ${safe} / Сладкого сна! / С Новым годом!`,answer:safe,hint:'Выбери фразу, которая может пригодиться во время поездки.'},
   {stage:'Retrieval',prompt:`Ты на вокзале. Вспомни сохранённую фразу и скажи её человеку.`,answer:safe,hint:`Начни так: «${safe.split(' ').slice(0,Math.min(2,safe.split(' ').length)).join(' ')}…».`},
   {stage:'Production',prompt:`Ты в незнакомом городе. Придумай короткий разговор, используя сохранённую фразу.`,answer:`Извините. ${safe}`,hint:'Сначала объясни ситуацию. Затем используй фразу.'}
  ];
 };
 const fallback=questionsFor(item);
 if(/что мне делать в этой ситуации/.test(target))return res.status(200).json({questions:fallback});
 if(!process.env.OPENAI_API_KEY)return res.status(200).json({questions:fallback});
 const instructions=`Ты опытный преподаватель русского как иностранного уровня A1–A2. Создай ровно ТРИ упражнения, каждое на одну и ту же выбранную учеником фразу "${item}". Не переключайся на другие правила, даже если фраза грамматически правильна. Тренируем употребление фразы в ситуации с поездом, вокзалом, автобусом, билетом или потерянной дорогой.
Формат строго JSON {"questions":[{"stage":"Recognition","prompt":"...","answer":"...","hint":"..."},{"stage":"Retrieval","prompt":"...","answer":"...","hint":"..."},{"stage":"Production","prompt":"...","answer":"...","hint":"..."}]}.
1 Recognition: контекст + три коротких варианта в конце в формате "Выбери: вариант / вариант / вариант", верный ответ совпадает с одним вариантом.
2 Retrieval: нужно самому вспомнить и написать выбранную фразу (answer — выбранная фраза).
3 Production: конкретная живая ситуация для 1–2 предложений с выбранной фразой, answer — естественный ПРИМЕР.
Не спрашивай о названиях правил или частей речи. Никакого английского. Нельзя генерировать задания на "на вокзале", "на метро" или любые посторонние выражения, если выбрана другая фраза. Нельзя говорить "поехать на метро": если нужно, пиши "ехать на метро" или "поехать в метро". Все ответы короткие и понятные.`;
 try{
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.RUSSIAN_UNSCRIPTED_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},temperature:.15,max_tokens:650,messages:[{role:'system',content:instructions},{role:'user',content:JSON.stringify({kind,item})}]})});
  if(!r.ok)throw Error('AI service');
  const data=await r.json();
  const q=JSON.parse(data.choices?.[0]?.message?.content||'{}').questions;
  const forbidden=/как называется|определите падеж|назовите (?:часть речи|правило)|поехать на метро/i;
  if(!Array.isArray(q)||q.length!==3||q.some((v,i)=>!v||v.stage!==stages[i]||typeof v.prompt!=='string'||typeof v.answer!=='string'||!v.prompt.trim()||!v.answer.trim()||forbidden.test(v.prompt+' '+v.answer)))throw Error('Invalid AI exercises');
  // Each exercise must teach the saved expression: do not silently switch topics.
  if(norm(q[0].answer)!==target||norm(q[1].answer)!==target||!norm(q[2].answer).includes(target))throw Error('Unrelated AI exercises');
  return res.status(200).json({questions:q.map(x=>({stage:x.stage,prompt:x.prompt.slice(0,400),answer:x.answer.slice(0,250),hint:String(x.hint||'').slice(0,250)}))});
 }catch(e){
  return res.status(200).json({questions:fallback});
 }
}
