const SCRIPTS = {"A1": ["Bus to the Library", "Hello Sam, it's Lucy. Our English class starts at half past three today, not three o'clock. Please meet me at the bus stop outside the library at three fifteen. Bring your notebook. We can get a drink after class, if you like. See you soon!"], "A2C": ["A Changed Meeting", "Hi Ben, it's Sophie. About our picnic tomorrow: the weather forecast says it will be windy in the morning, so I think we should meet at the sports centre instead of the park. Let's meet at half past eleven. You don't need to bring food because there's a small café there, but please bring your water bottle. Text me if you prefer another place."], "B1": ["Volunteer Shift Change", "Hi Alex, this is Priya from the community centre. Thanks for offering to help at Saturday's food festival. We originally needed you at the entrance at nine, but two volunteers have already taken that shift. Would you be able to help at the information desk from eleven until two instead? Visitors sometimes ask about food allergies, so we will give you a printed guide before the event. If you're uncomfortable answering those questions, you can help distribute maps. Please let me know by Thursday evening because we need to finish the rota. Oh, and don't worry about lunch: volunteers get a meal voucher. Thanks again!"], "B2": ["Local Transport Radio Discussion", "Host: Today we're discussing the city's plan to reduce car traffic in the centre. Maya, you support the proposal. Why? Maya: The main goal isn't to punish drivers. It's to make buses more reliable and give people a realistic alternative to driving. When buses get stuck in the same traffic as cars, everyone loses time. Host: Daniel, you're less convinced. Daniel: I agree with the goal, but the council has announced restrictions before improving services in the outer districts. Someone who works late might have no practical alternative to a car. Maya: That's a fair concern. I'd support introducing restrictions gradually, after buses run later and more frequently. Daniel: Then we may agree on more than it sounds. I also want cleaner air. What I don't want is a policy whose costs fall mostly on people with the fewest options. Host: So the disagreement is less about the destination than about the order of the changes."]};
const ALLOWED = new Set(['A1','A2C','B1','B2']);
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'GET only'});
 const level=String(req.query?.level||'');
 if(!ALLOWED.has(level))return res.status(400).json({error:'Unknown stage'});
 const key=process.env.ALIBABA_QWEN_API_KEY||process.env.DASHSCOPE_API_KEY;
 if(!key)return res.status(503).json({error:'Qwen is not configured'});
 try{
  const text=SCRIPTS[level][1];
  const r=await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',{
   method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},
   body:JSON.stringify({model:'qwen3-tts-flash',input:{text,voice:process.env.PLACEMENT_QWEN_VOICE||'Cherry',language_type:'English'}})
  });
  const d=await r.json();if(!r.ok||d.code)throw Error(d.message||'Qwen error '+r.status);
  const url=d.output?.audio?.url||d.output?.audio_url||d.output?.audio?.audio_url;
  if(!url)throw Error('No Qwen audio URL');
  const parsed=new URL(url);
  if(!['https:','http:'].includes(parsed.protocol))throw Error('Unsupported audio protocol');
  if(!/(^|\.)(aliyuncs\.com|alibabacloud\.com)$/.test(parsed.hostname))throw Error('Untrusted audio host');
  const audio=await fetch(url);if(!audio.ok)throw Error('Audio download failed');
  const bytes=Buffer.from(await audio.arrayBuffer());
  res.setHeader('Content-Type',audio.headers.get('content-type')||'audio/mpeg');
  return res.status(200).end(bytes);
 }catch(e){return res.status(502).json({error:String(e.message||e).slice(0,180)})}
}
