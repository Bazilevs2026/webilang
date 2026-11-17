// Conversational Russian A1–A2 with two returning Webilang characters.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI roleplay is not configured'});
 const b=req.body||{};if(!['station','metro'].includes(b.scenario)||!Array.isArray(b.history))return res.status(400).json({error:'Invalid conversation'});
 const history=b.history.slice(-18).filter(x=>['student','agent'].includes(x.role)&&typeof x.text==='string').map(x=>({role:x.role==='student'?'user':'assistant',content:x.text.slice(0,500)}));
 const persona=b.scenario==='station'
 ?'Ты Чаз, дружелюбный сотрудник железнодорожного вокзала. Поезд в Москву отправляется с пути 3 в 10:40; касса №2 у входа. Если ученик задаёт вопросы, отвечай по существу.'
 :'Ты Нова, сотрудница метро. До станции «Парк» нужно проехать две остановки, затем пересесть на зелёную линию. Билеты продаются в автомате у входа.';
 const system=`${persona} Это учебный диалог с иностранцем уровня русского А1–А2. Говори только по-русски, естественно, коротко: максимум 2 коротких предложения, до 35 слов. Задавай не более одного вопроса за раз. Не исправляй ошибки ученика во время миссии, не подсказывай готовый ответ. Не придумывай фактов вне условной ситуации. Ответ строго JSON {"reply":"..."}.`;
 try{const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.RUSSIAN_UNSCRIPTED_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},temperature:.65,max_tokens:160,messages:[{role:'system',content:system},...history]})});const d=await r.json();if(!r.ok)throw Error('Provider');const v=JSON.parse(d.choices?.[0]?.message?.content||'{}');return res.status(200).json({reply:String(v.reply||'Повторите, пожалуйста.').slice(0,450)})}catch(e){console.error('RU roleplay',e);return res.status(502).json({error:'Roleplay unavailable'})}
}
