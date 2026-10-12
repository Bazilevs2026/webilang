/**
 * Webilang AI Roleplay speech
 * Vercel Function: /api/speak.js
 * Uses OPENAI_API_KEY.
 */
export default async function handler(req,res){
  if(req.method!=="POST"){
    res.setHeader("Allow","POST");
    return res.status(405).json({error:"Method not allowed"});
  }
  if(!process.env.OPENAI_API_KEY){
    return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
  }

  try{
    const text=String(req.body?.text||"").replace(/\s+/g," ").trim().slice(0,700);
    if(!text) return res.status(400).json({error:"No text supplied"});

    const r=await fetch("https://api.openai.com/v1/audio/speech",{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"gpt-4o-mini-tts",
        voice:"cedar",
        input:text,
        instructions:"Speak as a natural young English-speaking family member: casual, slightly apologetic, mildly defensive but warm. Clear A2-B1 pace. Do not sound theatrical.",
        response_format:"mp3"
      })
    });

    if(!r.ok){
      let data={};try{data=await r.json();}catch(e){}
      console.error("OpenAI TTS error",data);
      return res.status(r.status).json({error:data?.error?.message||"Speech service error"});
    }

    const audio=Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type","audio/mpeg");
    res.setHeader("Cache-Control","no-store");
    return res.status(200).send(audio);
  }catch(err){
    console.error(err);
    return res.status(500).json({error:err?.message||"Server error"});
  }
}
