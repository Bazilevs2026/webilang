// Server-only natural spoken listening audio. Requires OPENAI_API_KEY.
const SCRIPT="Hi Jamie, it's Mia. I'm calling about our trip on Saturday. We planned to meet at the train station at nine fifteen, but the museum doesn't open until eleven. Let's meet at the cafe opposite the station at ten instead. Bring your student card because tickets are cheaper for students. After the museum, we can have lunch near the river. I checked the weather forecast. It might rain in the afternoon, so please take a jacket. Call me if you have any questions. See you on Saturday!";
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'GET only'});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'Natural voice is not configured'});
  try{
    const r=await fetch('https://api.openai.com/v1/audio/speech',{
      method:'POST',
      headers:{'Authorization':'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({
        model:process.env.PLACEMENT_TTS_MODEL||'gpt-4o-mini-tts',
        voice:'coral',response_format:'mp3',speed:1,
        input:SCRIPT,
        instructions:'You are Mia, a friendly young adult leaving a real voicemail for a friend in clear natural British English. Speak warmly, with conversational pacing, natural pitch variation, short pauses, subtle emphasis on the changed meeting place and time. Avoid artificial announcer intonation. Do not add or remove any words.'
      })
    });
    if(!r.ok)throw Error('Speech provider error '+r.status+': '+(await r.text()).slice(0,200));
    const bytes=Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type','audio/mpeg');
    res.setHeader('Content-Length',String(bytes.length));
    res.setHeader('Cache-Control','private, max-age=3600');
    return res.status(200).end(bytes);
  }catch(e){return res.status(502).json({error:String(e.message).slice(0,250)})}
}
