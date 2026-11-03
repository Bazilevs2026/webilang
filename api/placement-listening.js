const SCRIPT="Hi Jamie, it's Mia. I'm calling about our trip on Saturday. We planned to meet at the train station at nine fifteen, but the museum doesn't open until eleven. Let's meet at the cafe opposite the station at ten instead. Bring your student card because tickets are cheaper for students. After the museum, we can have lunch near the river. I checked the weather forecast. It might rain in the afternoon, so please take a jacket. Call me if you have any questions. See you on Saturday!";
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'GET only'});
 const key=process.env.ALIBABA_QWEN_API_KEY||process.env.DASHSCOPE_API_KEY;
 if(!key)return res.status(503).json({error:'Qwen voice is not configured'});
 try{
  const r=await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',{
   method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
   body:JSON.stringify({model:'qwen3-tts-flash',input:{text:SCRIPT,voice:process.env.PLACEMENT_QWEN_VOICE||'Cherry',language_type:'English'}})
  });
  const d=await r.json();if(!r.ok||d.code)throw Error(d.message||('Qwen '+r.status));
  const url=d.output?.audio?.url||d.output?.audio_url||d.output?.audio?.audio_url;
  if(!url)throw Error('No Qwen audio URL');
  if(!['http:','https:'].includes(new URL(url).protocol))throw Error('Unexpected audio protocol');
  if(!/(^|\.)aliyuncs\.com$|(^|\.)alibabacloud\.com$/.test(new URL(url).hostname))throw Error('Unexpected audio host');
  const a=await fetch(url);if(!a.ok)throw Error('Audio download failed');
  const bytes=Buffer.from(await a.arrayBuffer());
  res.setHeader('Content-Type',a.headers.get('content-type')||'audio/mpeg');
  return res.status(200).end(bytes);
 }catch(e){return res.status(502).json({error:String(e.message||e).slice(0,200)})}
}
