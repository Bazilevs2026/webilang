// Webilang Meet & Speak pilot: Cloudflare RealtimeKit backend (Vercel Serverless Function).
// Deliberately separate from existing Qwen, Kostya and Supabase learning endpoints.
// Organizers use an environment-only host code. Guests join using a signed, expiring invitation.
// Never expose the Cloudflare API token or host code in GitHub or frontend HTML.
const crypto = require('node:crypto');

const ACTIVITIES = Object.freeze({
  secret: 'The Secret Restaurant',
  hometown: 'My Hometown Guide',
  weekend: 'Plan a Weekend',
  wallet: 'The Lost Wallet',
  business: 'Start a Business',
  chat: 'Just Chat'
});
const INVITE_SECONDS = 24 * 60 * 60;
const PARTICIPANT_SECONDS = 8 * 60 * 60;
const b64u = s => Buffer.from(s).toString('base64url');
const getSecret = () => process.env.WEBILANG_RTK_HOST_CODE || '';

function signature(payloadB64) {
  return crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}
function signInvite(meetingId) {
  const payload = b64u(JSON.stringify({ m: meetingId, e: Math.floor(Date.now() / 1000) + INVITE_SECONDS }));
  return `${payload}.${signature(payload)}`;
}
function verifyInvite(invite) {
  if (typeof invite !== 'string' || invite.length > 1000) return null;
  const parts = invite.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]+$/.test(parts[1])) return null;
  const expected = Buffer.from(signature(parts[0]));
  const supplied = Buffer.from(parts[1]);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!data || typeof data.e !== 'number' || data.e < Date.now() / 1000 || data.e > Date.now() / 1000 + INVITE_SECONDS + 120) return null;
    if (typeof data.m !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.m)) return null;
    return data.m;
  } catch (_) { return null; }
}
function safeName(name) {
  return String(name || 'Webilang Student').replace(/[<>\x00-\x1f]/g, '').trim().slice(0, 42) || 'Webilang Student';
}
function safeEqual(a, b) {
  if (!a || !b) return false;
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function cfUrl(path) {
  return `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_RTK_ACCOUNT_ID}/realtime/kit/${process.env.CF_RTK_APP_ID}${path}`;
}
async function cfPost(path, body) {
  const response = await fetch(cfUrl(path), {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CF_RTK_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  });
  let parsed;
  try { parsed = await response.json(); } catch (_) { throw new Error(`Cloudflare returned an unreadable response (${response.status})`); }
  if (!response.ok || parsed.success === false) {
    // Detailed errors for debugging are deliberately kept in server logs.
    console.error('Webilang RTK Cloudflare error:', response.status, JSON.stringify(parsed).slice(0, 700));
    throw new Error(`Cloudflare rejected the request (HTTP ${response.status}). Check the App ID, token permissions and preset.`);
  }
  return parsed.data || parsed.result || null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST required' });
  }
  // Browser callers must be on the same deployment; prevents ordinary cross-origin form use.
  // This is not a replacement for authorization: host code / signed invite are checked below.
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && host) {
    try { if (new URL(origin).host !== host) return res.status(403).json({ error: 'Cross-origin request rejected' }); }
    catch (_) { return res.status(403).json({ error: 'Invalid origin' }); }
  }
  const configured = ['CF_RTK_ACCOUNT_ID', 'CF_RTK_APP_ID', 'CF_RTK_API_TOKEN', 'WEBILANG_RTK_HOST_CODE'].every(key => !!process.env[key]);
  if (!configured) return res.status(503).json({ error: 'RealtimeKit is not configured yet. The administrator must add four Vercel environment variables.' });
  try {
    const raw = req.body;
    const body = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
    const name = safeName(body.name);
    if (body.action === 'create') {
      if (!safeEqual(body.hostCode, getSecret())) return res.status(403).json({ error: 'Incorrect organizer access code' });
      const activity = Object.hasOwn(ACTIVITIES, body.activity) ? body.activity : 'chat';
      const meeting = await cfPost('/meetings', { title: `Webilang · ${ACTIVITIES[activity]}`, record_on_start: false });
      if (!meeting || typeof meeting.id !== 'string') throw new Error('Cloudflare did not return a meeting ID');
      const participant = await cfPost(`/meetings/${encodeURIComponent(meeting.id)}/participants`, {
        name,
        preset_name: process.env.CF_RTK_PRESET_HOST || 'group_call_host',
        custom_participant_id: crypto.randomUUID(),
        token: { expires_on: new Date(Date.now() + PARTICIPANT_SECONDS * 1000).toISOString() }
      });
      if (!participant?.token) throw new Error('Cloudflare did not issue a participant token');
      return res.status(200).json({ authToken: participant.token, invite: signInvite(meeting.id), expiresInHours: 24 });
    }
    if (body.action === 'join') {
      const meetingId = verifyInvite(body.invite);
      if (!meetingId) return res.status(403).json({ error: 'This invitation is invalid or has expired. Request a fresh link.' });
      const participant = await cfPost(`/meetings/${encodeURIComponent(meetingId)}/participants`, {
        name,
        preset_name: process.env.CF_RTK_PRESET_GUEST || 'group_call_participant',
        custom_participant_id: crypto.randomUUID(),
        token: { expires_on: new Date(Date.now() + PARTICIPANT_SECONDS * 1000).toISOString() }
      });
      if (!participant?.token) throw new Error('Cloudflare did not issue a participant token');
      return res.status(200).json({ authToken: participant.token });
    }
    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    console.error('Webilang RTK server error:', String(e));
    return res.status(502).json({ error: e.message && e.message.startsWith('Cloudflare rejected') ? e.message : 'Unable to start the video meeting. Check server configuration and logs.' });
  }
};
