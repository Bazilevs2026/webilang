/** Webilang LEVEL QUEST: authenticated, opt-in submission to teacher.
 * Install with one <script type="module"> tag after the existing placement-test scripts.
 * Existing scoring, Qwen audio, Nova realtime, and adaptive logic are untouched.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '/student-memory/config.js';

const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: true},
});
const q = (s, root = document) => root.querySelector(s);
const text = (s, max = 6500) => String(s || '').trim().slice(0, max);
const safeId = () => crypto.randomUUID();
let user = null;
let attemptId = safeId();
let savedCount = 0;
const keys = ['reading','listening','grammar','vocab','writing','speaking'];

const css = document.createElement('style');
css.textContent = `
#webilang-test-account, #webilang-test-save{background:#eef6ff;color:#1a3456;border:1px solid #bed9ee;border-radius:15px;padding:14px;margin:15px 0;line-height:1.5}
#webilang-test-account h3,#webilang-test-save h3{margin:0 0 7px;font-size:17px}
#webilang-test-account p,#webilang-test-save p{margin:7px 0;font-size:13px}
#webilang-test-account input{background:white;color:#1a3456;width:100%;min-width:0;margin:5px 0 9px}
#webilang-test-account button,#webilang-test-save button{background:#17618b;color:white;border:0;border-radius:11px;padding:10px 12px;font-weight:750}
#webilang-test-save button:disabled{opacity:.6}#webilang-test-save label{display:flex;align-items:flex-start;gap:9px;font-size:14px;font-weight:500}
#webilang-test-save input[type=checkbox]{flex:0 0 auto;margin-top:5px}
#webilang-test-account .sync-info,#webilang-test-save .sync-info{font-size:12px;overflow-wrap:anywhere;color:#395778}
#webilang-test-save .sync-error,#webilang-test-account .sync-error{color:#a52525}
@media(max-width:720px){#webilang-test-account{font-size:13px}}
`;
document.head.append(css);

const sidebar = q('.sidebar');
const finalPanel = document.getElementById('s6');
if(!sidebar || !finalPanel) throw new Error('Placement test layout changed: cannot install teacher sync.');

const account = document.createElement('section');
account.id = 'webilang-test-account';
account.innerHTML = `<h3>🔐 My Webilang account</h3>
  <p id="wpa-user" class="sync-info">Checking sign-in…</p>
  <form id="wpa-login" style="display:none">
    <label>Email<input id="wpa-email" type="email" autocomplete="username" required placeholder="Student email"></label>
    <label>Password<input id="wpa-pass" type="password" autocomplete="current-password" required placeholder="Webilang password"></label>
    <button type="submit">Sign in to save results</button>
  </form><p id="wpa-status" class="sync-info" aria-live="polite"></p>`;
sidebar.append(account);

const save = document.createElement('section');
save.id = 'webilang-test-save';
save.innerHTML = `<h3>📤 Save results to my teacher</h3>
  <p>Use your Webilang Global student account. Scores will be linked to your account, not the optional name you typed.</p>
  <p id="wpa-completeness" class="sync-info">Open or refresh your assessment to check results.</p>
  <label><input id="wpa-consent" type="checkbox">I agree to share this placement assessment, skill scores and AI feedback with authorized Webilang teachers.</label>
  <label style="margin-top:10px"><input id="wpa-transcripts" type="checkbox">Also share my written answer and speaking transcripts (optional; no audio or video recordings).</label>
  <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:12px">
    <button id="wpa-submit" type="button">Save &amp; send to teacher</button>
    <span id="wpa-save-status" class="sync-info" role="status"></span>
  </div>
  <p class="sync-info">Unofficial CEFR-aligned diagnostic. Writing and speaking can be AI or heuristic estimates and should be reviewed by a teacher. Previous unsaved attempts are not recovered.</p>`;
finalPanel.insertBefore(save, q('.section-actions', finalPanel));

const setMsg = (id, message, bad = false) => {
  const el = document.getElementById(id);
  el.textContent = message;
  el.className = 'sync-info' + (bad ? ' sync-error' : '');
};
async function refreshIdentity() {
  const {data, error} = await db.auth.getUser();
  const next = error ? null : data?.user;
  if(user && next && user.id !== next.id){ attemptId=safeId(); savedCount=0; }
  user = next || null;
  const form = document.getElementById('wpa-login');
  form.style.display = user ? 'none' : 'block';
  document.getElementById('wpa-user').textContent = user
    ? 'Signed in: ' + text(user.email,100)
    : 'Not signed in. Complete the test as usual; sign in here before saving.';
  if(user && !q('#studentName')?.value.trim()){
    try{
      const {data:profile}=await db.from('student_profiles').select('display_name').eq('user_id',user.id).maybeSingle();
      if(profile?.display_name)q('#studentName').value=profile.display_name;
    }catch(_){}
  }
  return user;
}
q('#wpa-login').addEventListener('submit', async e => {
  e.preventDefault();
  const email=q('#wpa-email').value.trim(), password=q('#wpa-pass').value;
  setMsg('wpa-status','Signing in…');
  try{
    const {error}=await db.auth.signInWithPassword({email,password});
    if(error)throw error;
    q('#wpa-pass').value='';
    await refreshIdentity();
    setMsg('wpa-status','Signed in. You can now submit your assessment.');
  }catch(err){setMsg('wpa-status','Sign-in failed: '+text(err.message||err,250),true);}
});

function capture() {
  // Calls the original test renderer. It now contains the final adaptive CEFR levels.
  if(typeof window.renderFinal !== 'function')throw new Error('The placement assessment has not loaded.');
  window.renderFinal();
  const tiles = Array.from(document.querySelectorAll('#resultGrid .result-cell'));
  const bars = Array.from(document.querySelectorAll('#skillBars .barrow'));
  const scoreMap={}, levelMap={}, sourceMap={};
  keys.forEach((k,i)=>{
    const bar=bars[i],tile=tiles[i];
    const numeric=(bar?.querySelector('span')?.textContent||'').match(/(\d{1,3})\s*%/);
    const n=numeric?Number(numeric[1]):null;
    scoreMap[k]=n!==null && n>=0 && n<=100 ? n : null;
    const lev=tile?.querySelector('strong')?.textContent?.trim()||'';
    levelMap[k]=['A1','A2','B1','B2'].includes(lev)?lev:null;
    sourceMap[k]=text(tile?.querySelectorAll('.small')?.[1]?.textContent,120);
  });
  const complete=keys.every(k=>scoreMap[k]!==null);
  const finished=keys.filter(k=>scoreMap[k]!==null).length;
  const band={A1:1,A2:2,B1:3,B2:4};
  const validLevels=keys.map(k=>levelMap[k]).filter(k=>k in band).sort((a,b)=>band[a]-band[b]);
  const overall=validLevels.length===6?validLevels[2]:null;
  const sectionText = id => text(document.getElementById(id)?.innerText||document.getElementById(id)?.textContent,8000);
  const evidence={
    sources:sourceMap,
    overall_comment:sectionText('overall'),
    speaking_breakdown:sectionText('speakingDetailedReport'),
    monologue_criteria:sectionText('monoCriteriaResult'),
    dialogue_criteria:sectionText('dialogueCriteriaResult'),
    dialogue_adaptive:sectionText('dialogueAdaptiveEvidence'),
    reading:sectionText('readingAdaptive'), listening:sectionText('listeningAdaptive'),
    grammar:sectionText('grammarAdaptive'), vocabulary:sectionText('vocabAdaptive'),
    writing:sectionText('writingFeedback'), monologue:sectionText('monoFeedback'),
    dialogue:sectionText('dialogueFeedback')
  };
  // Include staged objective-item performance, including wrong-answer explanations.
  // The core test exposes this state expressly for its adaptive result panel.
  const staged=window.adaptiveSkillState||{};
  evidence.adaptive_stage_attempts=Object.fromEntries(
    ['reading','listening','grammar','vocab'].map(k=>[k,
      Array.isArray(staged[k]?.attempts) ? staged[k].attempts.slice(0,8).map(a=>({
        stage:text(a.stage,10),right:Number(a.right)||0,total:Number(a.total)||0,
        errors:Array.isArray(a.errors)?a.errors.slice(0,15).map(x=>text(x,450)):[]
      })) : []
    ])
  );
  const withTranscripts=q('#wpa-transcripts').checked;
  const transcripts=withTranscripts?{
    writing:text(q('#writingText')?.value,9000),
    monologue:text(q('#monoText')?.value,13000),
    dialogue:text(document.getElementById('placementRealtimeTranscript')?.innerText||document.getElementById('chat')?.innerText,18000),
    note:'Browser transcription may be incomplete or inaccurate; no audio/video is stored by this module.'
  }:{};
  return {finished, complete, overall, scoreMap, levelMap, evidence, transcripts, withTranscripts};
}
function showProgress() {
  try {
    const c=capture();
    setMsg('wpa-completeness',`${c.finished}/6 skills assessed · ${c.complete?'Complete placement report':'Partial report'} · Overall ${c.overall||'pending'}.`);
  }catch(e){setMsg('wpa-completeness',text(e.message,180),true);}
}
q('#wpa-submit').addEventListener('click',async()=>{
  const btn=q('#wpa-submit');
  if(!q('#wpa-consent').checked)return setMsg('wpa-save-status','Please confirm that you agree to share the results.',true);
  if(!await refreshIdentity())return setMsg('wpa-save-status','Please sign in to your Webilang account in the left panel first.',true);
  let report;
  try{ report=capture(); }catch(err){return setMsg('wpa-save-status','Cannot capture assessment: '+text(err.message,200),true);}
  showProgress();
  if(!report.finished)return setMsg('wpa-save-status','Complete at least one skill before saving.',true);
  if(!report.complete && !confirm(`Only ${report.finished}/6 skills have results. Save a partial report for the teacher?`))return;
  btn.disabled=true;setMsg('wpa-save-status','Sending report to your teacher…');
  const record={
    id:attemptId, student_id:user.id, test_code:'level-quest-a1-b2', test_version:1,
    display_name:text(q('#studentName')?.value,80), status:report.complete?'complete':'partial',
    submitted_at:new Date().toISOString(),updated_at:new Date().toISOString(),
    overall_level:report.overall,
    skill_scores:report.scoreMap, skill_levels:report.levelMap,
    evidence:report.evidence, transcripts:report.transcripts,
    transcripts_shared:report.withTranscripts
  };
  try{
    const {error}=await db.from('webilang_placement_attempts').upsert(record,{onConflict:'id'});
    if(error)throw error;
    savedCount++;
    setMsg('wpa-save-status','Saved successfully! Your teacher can view the report in Admin → Placement Results. '+(savedCount>1?'Latest changes saved.':''));
  }catch(err){setMsg('wpa-save-status','Save failed: '+text(err.message||err,350)+'. Ask your teacher to install the Supabase placement SQL.',true);}
  finally{btn.disabled=false;}
});

// Reflect completion as the learner checks tasks, without changing the test itself.
const observer=new MutationObserver(()=>{
  clearTimeout(observer.timer);observer.timer=setTimeout(()=>{
    if(document.getElementById('s6')?.classList.contains('active'))showProgress();
  },250);
});
observer.observe(document.getElementById('progressLabel'),{childList:true,subtree:true});
await refreshIdentity();
showProgress();
