const reply=(res,status,body)=>{res.setHeader("Cache-Control","no-store");return res.status(status).json(body)};
export default async function handler(req,res){
 if(req.method!=="POST")return reply(res,405,{error:"POST required"});
 if(!process.env.OPENAI_API_KEY)return reply(res,503,{error:"OPENAI_API_KEY is missing in Vercel."});
 try{
  const data=req.body||{},b64=data.audio,mime=String(data.mime||"audio/webm");
  if(typeof b64!=="string"||!b64||b64.length>12000000||!/^[A-Za-z0-9+/=]+$/.test(b64))return reply(res,413,{error:"Invalid or oversized audio. Record a shorter answer (under ~5 MB)."});
  const bytes=Buffer.from(b64,"base64");
  if(!bytes.length||bytes.length>8500000)return reply(res,413,{error:"Audio is too large."});
  const ext=mime.includes("mp4")?"mp4":mime.includes("ogg")?"ogg":"webm";
  const body=new FormData();
  body.append("file",new Blob([bytes],{type:mime}),"gender-response."+ext);
  body.append("model","gpt-4o-mini-transcribe");
  body.append("language","en");
  const r=await fetch("https://api.openai.com/v1/audio/transcriptions",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body});
  const result=await r.json();
  if(!r.ok)throw Error(result.error?.message||"Transcription request failed");
  return reply(res,200,{text:String(result.text||"").slice(0,13000)});
 }catch(e){console.error("Gender transcription failure",e);return reply(res,502,{error:String(e.message||"Transcription unavailable").slice(0,200)})}
}
