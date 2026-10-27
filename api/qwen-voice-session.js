// Qwen live voice experiment ONLY. Never return Alibaba credentials to the browser.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({voices:{en:'qwen-omni-vc-kostya_en-voice-20261028012830649-fab3',ru:process.env.ALIBABA_QWEN_RU_VOICE_ID||''}});
  if (req.method !== 'POST') return res.status(405).json({error:'POST required'});
  const key = process.env.ALIBABA_QWEN_API_KEY;
  const workspace = process.env.ALIBABA_QWEN_WORKSPACE_ID;
  if (!key || !workspace) return res.status(503).json({error:'Set ALIBABA_QWEN_API_KEY and ALIBABA_QWEN_WORKSPACE_ID in Vercel Preview environment'});
  if (!/^ws-[a-zA-Z0-9]+$/.test(workspace)) return res.status(500).json({error:'Invalid Workspace ID configuration'});
  const body = typeof req.body === 'string' ? req.body : req.body?.sdp;
  if (typeof body !== 'string' || body.length > 150000 || !body.startsWith('v=0') || !body.includes('m=audio')) return res.status(400).json({error:'Invalid SDP'});
  const endpoint = `https://${workspace}.ap-southeast-1.maas.aliyuncs.com/api/v1/webrtc/realtime?model=qwen3.8-omni-flash-realtime`;
  const controller = new AbortController(); const tm=setTimeout(()=>controller.abort(),30000);
  try {
    const upstream = await fetch(endpoint, {method:'POST', headers:{'Authorization':'Bearer '+key,'Content-Type':'application/sdp'},body:body.endsWith('\r\n')?body:body+'\r\n',signal:controller.signal});
    const answer = await upstream.text();
    if (!upstream.ok) return res.status(502).json({error:`Alibaba session rejected: HTTP ${upstream.status}`,details:answer.slice(0,300)});
    res.setHeader('Content-Type','application/sdp'); return res.status(200).send(answer);
  } catch(e) {return res.status(502).json({error:'Alibaba connection failed: '+String(e.message||e).slice(0,160)});}
  finally {clearTimeout(tm);}
}
