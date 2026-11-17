// Russian transcription, unlike existing Art Lab transcribe which uses English.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI transcription is not configured'});
 try{
 const b=req.body||{},base64=String(b.audioBase64||'');
 if(!base64||base64.length>6300000)return res.status(413).json({error:'Invalid or too large audio (max 4.5MB)'});
 const raw=Buffer.from(base64,'base64');if(raw.length<100||raw.length>4600000)return res.status(413).json({error:'Invalid audio'});
 const mime=String(b.mimeType||'audio/webm').split(';')[0],ext=mime.includes('mp4')?'mp4':mime.includes('ogg')?'ogg':'webm';
 const fd=new FormData();fd.set('model','whisper-1');fd.set('language','ru');fd.set('file',new Blob([raw],{type:mime}),`recording.${ext}`);
 const r=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:fd});
 if(!r.ok)throw Error('Transcription provider error');const d=await r.json();return res.status(200).json({text:String(d.text||'').slice(0,5500)});
 }catch(e){console.error('RU transcription',e);return res.status(502).json({error:'Transcription unavailable'})}
}
