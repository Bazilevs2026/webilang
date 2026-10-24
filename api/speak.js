/**
 * Webilang speech endpoint.
 * Maintains the existing default for other lessons and gives Reading Unit 3
 * distinct Russian voices selected by speaker.
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
    if(!text)return res.status(400).json({error:"No text supplied"});
    const unit3=req.body?.module==="russian-03" && req.body?.targetLanguage==="ru";
    const speaker=String(req.body?.speaker||"").toLowerCase();
    const isAvatar=req.body?.module==="avatar-lab" || (req.body?.module==="russian-03" && req.body?.avatarVoice);
    const avatarVoice=req.body?.avatarVoice==="male" ? "male" : "female";
    const voice=isAvatar ? (avatarVoice==="female" ? "nova" : "cedar") : (unit3 && speaker==="anna" ? "nova" : "cedar");
    const instructions=isAvatar
      ? `Speak naturally in ${req.body?.targetLanguage==="ru" ? "Russian" : "American English"} with a ${avatarVoice === "female" ? "friendly feminine" : "friendly masculine"} voice. Speak clearly for a language learner. Avoid theatrical delivery.`
      : unit3
      ? (speaker==="anna"
          ? "Speak in natural, clear Russian with a friendly young woman's voice, at a measured A1 learner-friendly pace. Do not sound theatrical."
          : "Speak in natural, clear Russian with a friendly young man's voice, at a measured A1 learner-friendly pace. Do not sound theatrical.")
      : "Speak as a natural young English-speaking family member: casual, slightly apologetic, mildly defensive but warm. Clear A2-B1 pace. Do not sound theatrical.";
    const r=await fetch("https://api.openai.com/v1/audio/speech",{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"gpt-4o-mini-tts", voice, input:text, instructions,
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
