/**
 * Webilang cross-browser speech transcription
 * Vercel Function: /api/transcribe.js
 *
 * Uses OPENAI_API_KEY.
 * Browser MediaRecorder audio is sent only after the learner records a turn.
 */
const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb"
    }
  }
};

function extensionFromMime(type=""){
  const t=String(type).toLowerCase();
  if(t.includes("ogg")) return "ogg";
  if(t.includes("mp4")||t.includes("m4a")) return "m4a";
  if(t.includes("wav")) return "wav";
  return "webm";
}

async function handler(req,res){
  // Gender Roles uses {audio, mime}; Video Games uses {audio, mimeType, language}.
  // Both formats are supported by this single CommonJS Vercel function.
  const payload=req.body||{};
  if(Object.prototype.hasOwnProperty.call(payload,"mime") &&
     !Object.prototype.hasOwnProperty.call(payload,"mimeType")){
    return genderHandler(req,res);
  }

  if(req.method!=="POST"){
    res.setHeader("Allow","POST");
    return res.status(405).json({error:"Method not allowed"});
  }
  if(!process.env.OPENAI_API_KEY){
    return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
  }

  try{
    const body=req.body||{};
    const audio=String(body.audio||"");
    const mimeType=String(body.mimeType||"audio/webm").slice(0,100);
    const lang=String(body.language||"en").toLowerCase().slice(0,12);

    if(!audio) return res.status(400).json({error:"No audio supplied"});
    const buffer=Buffer.from(audio,"base64");
    if(!buffer.length) return res.status(400).json({error:"Audio is empty"});
    if(buffer.length>3_000_000){
      return res.status(413).json({error:"Audio clip is too large. Please record a shorter answer."});
    }

    const form=new FormData();
    form.append("file",new Blob([buffer],{type:mimeType}),`speech.${extensionFromMime(mimeType)}`);
    form.append("model","gpt-transcribe");
    form.append("prompt","English language learning lesson. Possible topic words: gaming, fishing trip, Grandma, computer, Wi-Fi, router, password, video call.");
    form.append("languages[]",lang.startsWith("en")?"en":lang);

    const r=await fetch("https://api.openai.com/v1/audio/transcriptions",{
      method:"POST",
      headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`},
      body:form
    });

    const data=await r.json();
    if(!r.ok){
      console.error("Transcription API error",data);
      return res.status(r.status).json({error:data?.error?.message||"Transcription service error"});
    }
    return res.status(200).json({text:String(data?.text||"").trim()});
  }catch(err){
    console.error(err);
    return res.status(500).json({error:err?.message||"Server error"});
  }
}


async function genderHandler(req,res){
  const reply=(status,body)=>{res.setHeader("Cache-Control","no-store");return res.status(status).json(body);};
  if(req.method!=="POST")return reply(405,{error:"POST required"});
  if(!process.env.OPENAI_API_KEY)return reply(503,{error:"OPENAI_API_KEY is missing in Vercel."});
  try{
    const data=req.body||{},b64=data.audio,mime=String(data.mime||"audio/webm");
    if(typeof b64!=="string"||!b64||b64.length>12000000||!/^[A-Za-z0-9+/=]+$/.test(b64)){
      return reply(413,{error:"Invalid or oversized audio. Record a shorter answer (under ~5 MB)."});
    }
    const bytes=Buffer.from(b64,"base64");
    if(!bytes.length||bytes.length>8500000)return reply(413,{error:"Audio is too large."});
    const ext=mime.includes("mp4")?"mp4":mime.includes("ogg")?"ogg":"webm";
    const body=new FormData();
    body.append("file",new Blob([bytes],{type:mime}),"gender-response."+ext);
    body.append("model","gpt-4o-mini-transcribe");
    body.append("language","en");
    const r=await fetch("https://api.openai.com/v1/audio/transcriptions",{
      method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body
    });
    const result=await r.json();
    if(!r.ok)throw Error(result.error?.message||"Transcription request failed");
    return reply(200,{text:String(result.text||"").slice(0,13000)});
  }catch(e){
    console.error("Gender transcription failure",e);
    return reply(502,{error:String(e.message||"Transcription unavailable").slice(0,200)});
  }
}

module.exports = handler;
module.exports.config = config;
