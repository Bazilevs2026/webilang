// Qwen Realtime: avatar-only SDP bridge. Never return API credentials to the browser.
// SDP is application/sdp, NOT JSON. Disable Vercel's default body parser and read
// the request stream directly, preserving line endings and SDP offer contents.
export const config = { api: { bodyParser: false } };

async function readSdp(req, maxBytes = 150000) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) throw new Error('SDP too large');
    chunks.push(buf);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    return res.status(200).json({
      voices: {
        en: 'qwen-omni-vc-kostya_en-voice-20261028012830649-fab3',
        ru: process.env.ALIBABA_QWEN_RU_VOICE_ID || ''
      }
    });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const key = process.env.ALIBABA_QWEN_API_KEY;
  const workspace = process.env.ALIBABA_QWEN_WORKSPACE_ID;
  if (!key || !workspace) return res.status(503).json({ error: 'Qwen Preview environment variables missing' });
  if (!/^ws-[a-zA-Z0-9]+$/.test(workspace)) return res.status(500).json({ error: 'Invalid Workspace ID configuration' });

  let sdp;
  try {
    sdp = await readSdp(req);
  } catch (e) {
    return res.status(413).json({ error: String(e.message || e) });
  }
  if (!sdp.startsWith('v=0') || !sdp.includes('m=audio')) {
    return res.status(400).json({ error: 'Invalid SDP offer', length: sdp.length });
  }

  const endpoint = `https://${workspace}.ap-southeast-1.maas.aliyuncs.com/api/v1/webrtc/realtime?model=qwen3.8-omni-flash-realtime`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/sdp' },
      body: sdp.endsWith('\r\n') ? sdp : `${sdp}\r\n`,
      signal: controller.signal
    });
    const answer = await upstream.text();
    if (!upstream.ok) {
      return res.status(502).json({ error: `Alibaba session rejected: HTTP ${upstream.status}`, details: answer.slice(0, 300) });
    }
    res.setHeader('Content-Type', 'application/sdp');
    return res.status(200).send(answer);
  } catch (e) {
    return res.status(502).json({ error: `Alibaba connection failed: ${String(e.message || e).slice(0, 160)}` });
  } finally {
    clearTimeout(timeout);
  }
}
