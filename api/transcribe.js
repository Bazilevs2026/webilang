/**
 * Webilang cross-browser speech transcription
 * Shared Vercel Function: /api/transcribe
 *
 * Uses OPENAI_API_KEY.
 * Browser MediaRecorder audio is sent only after the learner records a turn.
 */
export const config = {
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

import genderTranscribeHandler from "../lib/gender-transcribe.js";

export default async function handler(req,res){
  // Gender Roles sends {audio, mime}; Video Games sends {audio, mimeType, language}.
  // Keep each module's existing transcription model and response behavior.
  const payload = req.body || {};
  if (Object.prototype.hasOwnProperty.call(payload, "mime") &&
      !Object.prototype.hasOwnProperty.call(payload, "mimeType")) {
    return genderTranscribeHandler(req,res);
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
    return res.status(500).json({error:err?.message||"Server error"});
  }
}
