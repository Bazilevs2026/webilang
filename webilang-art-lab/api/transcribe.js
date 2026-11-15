// Short recordings only; base64 posted by browser to avoid multipart parser dependencies.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST required'});
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'AI transcription requires OPENAI_API_KEY in Vercel.'});
 try{
  const encoded=String(req.body?.audioBase64||'');if(!encoded||encoded.length>6300000)return res.status(413).json({error:'Audio missing or larger than 4.5 MB'});
  const audio=Buffer.from(encoded,'base64');if(audio.length<100||audio.length>4600000)return res.status(413).json({error:'Invalid audio length'});
  const mime=String(req.body?.mimeType||'audio/webm').split(';')[0];const ext=mime.includes('mp4')?'mp4':mime.includes('ogg')?'ogg':'webm';
  const data=new FormData();data.set('model','whisper-1');data.set('language','en');data.set('file',new Blob([audio],{type:mime}),`speech.${ext}`);
  const up=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:data});
  if(!up.ok)return res.status(502).json({error:'The recording could not be transcribed.'});
  const response=await up.json();return res.status(200).json({text:String(response.text||'').slice(0,5500)})
 }catch(e){console.error('transcribe',e);return res.status(500).json({error:'Transcription is currently unavailable.'})}
}
