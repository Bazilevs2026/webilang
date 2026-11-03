// Qwen natural speech proxy for Level Quest. Never expose API keys to the browser.
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'POST only'});
  const key=process.env.ALIBABA_QWEN_API_KEY||process.env.DASHSCOPE_API_KEY;
  if(!key)return res.status(503).json({error:'ALIBABA_QWEN_API_KEY is not configured on Vercel'});
  const text=String(req.body?.text||'').trim().slice(0,550);
  if(!text)return res.status(400).json({error:'Text is required'});
  const voice=process.env.PLACEMENT_QWEN_VOICE||'Cherry';
  try{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),25000);
    let response;
    try{
      response=await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',{
        method:'POST',signal:controller.signal,
        headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},
        body:JSON.stringify({model:'qwen3-tts-flash',input:{text,voice,language_type:'English'}})
      });
    }finally{clearTimeout(timeout)}
    const data=await response.json();
    if(!response.ok||data.code)throw Error(data.message||data.code||('Qwen HTTP '+response.status));
    const output=data.output||{};
    const url=output.audio?.url||output.audio_url||output.audio?.audio_url;
    if(!url)throw Error('Qwen returned no downloadable audio URL');
    const parsed=new URL(url);
    // Qwen's signed OSS URLs can legitimately use HTTP; download server-side only.
    if(!['http:','https:'].includes(parsed.protocol) ||
       !/(^|\.)aliyuncs\.com$|(^|\.)alibabacloud\.com$/.test(parsed.hostname))
      throw Error('Unexpected audio host');
    const audio=await fetch(url);
    if(!audio.ok)throw Error('Could not retrieve Qwen audio '+audio.status);
    const bytes=Buffer.from(await audio.arrayBuffer());
    if(bytes.length>6_000_000)throw Error('Audio response too large');
    res.setHeader('Content-Type',audio.headers.get('content-type')||'audio/mpeg');
    res.setHeader('Content-Length',String(bytes.length));
    return res.status(200).end(bytes);
  }catch(e){console.error('placement-qwen-speak',e);return res.status(502).json({error:String(e.message||e).slice(0,200)})}
}
