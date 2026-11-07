/** Webilang Admin Dashboard — placement-test records. Protected by
 * the existing webilang_admins table + database RLS. Destructive actions use
 * administrator-gated database RPC functions; no private API keys in browser.
 * Install one <script type="module"> tag after the existing admin scripts.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '/student-memory/config.js';
const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const e=id=>document.getElementById(id);
const clean=(v,max=12000)=>String(v??'').slice(0,max);
const labels={reading:'Reading',listening:'Listening',grammar:'Grammar',vocab:'Vocabulary',writing:'Writing',speaking:'Speaking'};
const section=document.createElement('section');
section.id='placement-admin';section.className='card';
section.innerHTML=`<div class="placement-admin-top"><div><h2>🎯 Placement Test Results</h2><p class="muted">LEVEL QUEST · Student reports stored in Webilang's private Supabase database. Scores are provisional and require teacher review.</p></div><a href="/placement-test/" target="_blank" rel="noopener" class="placement-admin-link">Open Placement Test ↗</a></div>
<div class="placement-admin-actions"><label for="placement-admin-student">Student<br><select id="placement-admin-student"><option value="">All registered students</option></select></label>
<label for="placement-admin-state">Status<br><select id="placement-admin-state"><option value="">All attempts</option><option value="complete">Complete</option><option value="partial">Partial</option></select></label>
<button type="button" id="placement-admin-refresh" class="secondary">Refresh placement results</button>
<button type="button" id="placement-admin-reset" class="placement-danger" disabled title="Select a student first">Reset selected student</button></div>
<p class="muted" id="placement-admin-help">Delete attempt removes one saved submission. Reset selected student removes all of that student’s Placement Test submissions. Neither action deletes their Webilang account or learning profile.</p>
<p id="placement-admin-status" class="muted" role="status" aria-live="polite">Checking teacher access…</p>
<div class="scroll"><table><thead><tr><th>Date</th><th>Student</th><th>Report</th><th>Placement</th><th>Skills completed</th><th></th></tr></thead><tbody id="placement-admin-rows"></tbody></table></div>
<section id="placement-admin-detail" class="placement-admin-detail hidden" aria-live="polite"><div class="placement-detail-head"><h3 id="placement-detail-title">Assessment</h3><div><button type="button" id="placement-detail-download" class="secondary">Download teacher report</button> <button type="button" id="placement-detail-close" class="secondary">Close</button></div></div><p id="placement-detail-info" class="muted"></p><div class="scroll"><table><thead><tr><th>Skill</th><th>CEFR estimate</th><th>Score</th><th>Assessment source</th></tr></thead><tbody id="placement-detail-skills"></tbody></table></div><div id="placement-detail-evidence"></div></section>`;
const style=document.createElement('style');style.textContent=`
#placement-admin{scroll-margin-top:20px}#placement-admin h3{margin:0 0 9px}#placement-admin .placement-admin-top{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
#placement-admin .placement-admin-actions{display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin:16px 0}
#placement-admin select{font:inherit;min-width:170px;max-width:100%;background:#fff;color:#243451;border:1px solid #c8d5e4;border-radius:9px;padding:10px}
#placement-admin .placement-admin-actions label{font-weight:700;font-size:13px}
#placement-admin .placement-admin-link{border-radius:10px;background:#e87917;color:#fff;padding:10px 14px;font-weight:700;text-decoration:none;display:inline-block}
#placement-admin .placement-admin-detail{background:#f6f9fd;border:1px solid #ccdaeb;padding:17px;border-radius:13px;margin-top:20px}
#placement-admin .placement-detail-head{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap}
#placement-admin .placement-detail-head button{padding:9px 12px}
#placement-admin .placement-evidence{background:#fff;border:1px solid #dfe7f0;border-radius:11px;padding:12px 14px;margin:12px 0}
#placement-admin .placement-evidence summary{font-weight:750;cursor:pointer}
#placement-admin .placement-evidence pre{font-size:13px;line-height:1.55;font-family:inherit;white-space:pre-wrap;overflow-wrap:anywhere;max-height:400px;overflow:auto;margin:12px 0 0;color:#30435a}
#placement-admin .placement-view{background:#e87917;color:#fff;font-size:13px;padding:7px 12px}
#placement-admin .placement-danger{background:#fff;color:#a52b2b;border:1px solid #c65f5f;border-radius:9px;padding:8px 11px;font-weight:700;cursor:pointer}
#placement-admin .placement-danger:disabled{opacity:.45;cursor:not-allowed}
#placement-admin .placement-admin-row-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#placement-admin #placement-admin-help{font-size:13px;margin:0 0 12px}
@media(max-width:700px){#placement-admin table{min-width:600px}}
`;
document.head.append(style);
const admin=e('admin');
if(!admin)throw new Error('Admin Dashboard container not found.');
const after=e('lesson-assignments');
if(after)after.insertAdjacentElement('afterend',section);else admin.append(section);
let attempts=[],studentMap=new Map(),current=null;
const setStatus=(s)=>e('placement-admin-status').textContent=s;
function cell(row,value){const td=document.createElement('td');td.textContent=clean(value,250);row.append(td);return td;}
const formatDate=d=>{try{return new Date(d).toLocaleString()}catch(_){return clean(d,50)}};
function reportString(record){
  const student=studentMap.get(record.student_id);
  const header=['WEBILANG LEVEL QUEST — TEACHER REPORT', 'Student: '+clean(student?.display_name||record.display_name||'Unknown',150),'Email: '+clean(student?.email||'',150),'Submitted: '+formatDate(record.submitted_at),'Status: '+record.status,'Overall placement: '+clean(record.overall_level||'Pending'),'Unofficial CEFR-aligned diagnostic, not a certified result.',''];
  const rows=Object.entries(labels).map(([key,title])=>title+': '+(record.skill_scores?.[key]==null?'Pending':record.skill_scores[key]+'%')+' · '+(record.skill_levels?.[key]||'Not assessed')+' · '+(record.evidence?.sources?.[key]||'unknown source'));
  const details=Object.entries(record.evidence||{}).filter(([k,v])=>k!=='sources'&&String(v||'').trim()).flatMap(([k,v])=>['',k.toUpperCase(),clean(typeof v==='object'?JSON.stringify(v,null,2):v,15000)]);
  const samples=record.transcripts_shared?Object.entries(record.transcripts||{}).flatMap(([k,v])=>['',k.toUpperCase()+' SAMPLE',clean(v,18000)]):['','Transcripts: NOT SHARED'];
  return [...header,...rows,...details,...samples,'','Teacher review required before placement.'].join('\n');
}
function downloadText(data,name){
  const blob=new Blob([data],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function detail(record){
  current=record;
  const student=studentMap.get(record.student_id);
  e('placement-admin-detail').classList.remove('hidden');
  e('placement-detail-title').textContent=(student?.display_name||record.display_name||student?.email||'Student')+' — Placement Test';
  e('placement-detail-info').textContent=formatDate(record.submitted_at)+' · '+record.status+' · Overall '+(record.overall_level||'pending')+' · No pronunciation/acoustic fluency verification';
  const tbody=e('placement-detail-skills');tbody.replaceChildren();
  for(const [key,title] of Object.entries(labels)){
    const tr=document.createElement('tr');cell(tr,title);cell(tr,record.skill_levels?.[key]||'Not assessed');cell(tr,record.skill_scores?.[key]==null?'—':record.skill_scores[key]+'%');cell(tr,record.evidence?.sources?.[key]||'—');tbody.append(tr);
  }
  const out=e('placement-detail-evidence');out.replaceChildren();
  const parts=[['Objective item-by-item attempts','adaptive_stage_attempts'],['Overall teacher notes','overall_comment'],['Speaking: monologue and dialogue','speaking_breakdown'],['Monologue rubric','monologue_criteria'],['Dialogue rubric','dialogue_criteria'],['Adaptive speaking evidence','dialogue_adaptive'],['Reading evidence','reading'],['Listening evidence','listening'],['Grammar evidence','grammar'],['Vocabulary evidence','vocabulary'],['Writing feedback','writing'],['Monologue feedback','monologue'],['Dialogue feedback','dialogue']];
  for(const [title,key] of parts){const value=record.evidence?.[key];if(!String(value||'').trim())continue;const d=document.createElement('details');d.className='placement-evidence';if(key==='speaking_breakdown')d.open=true;const s=document.createElement('summary');s.textContent=title;const pre=document.createElement('pre');pre.textContent=clean(typeof value==='object'?JSON.stringify(value,null,2):value,18000);d.append(s,pre);out.append(d);}
  if(record.transcripts_shared && record.transcripts){for(const [key,value] of Object.entries(record.transcripts)){
    if(!String(value||'').trim())continue;const d=document.createElement('details');d.className='placement-evidence';const s=document.createElement('summary');s.textContent='Shared sample · '+key;const pre=document.createElement('pre');pre.textContent=clean(typeof value==='object'?JSON.stringify(value,null,2):value,18000);d.append(s,pre);out.append(d);
  }}else{const p=document.createElement('p');p.className='muted';p.textContent='Student did not opt in to share writing/speaking transcripts.';out.append(p);}
  e('placement-admin-detail').scrollIntoView({behavior:'smooth',block:'start'});
}
function draw(){
  const filter=e('placement-admin-student').value,state=e('placement-admin-state').value;
  e('placement-admin-reset').disabled=!filter || !attempts.some(a=>a.student_id===filter);
  const rows=attempts.filter(a=>(!filter||a.student_id===filter)&&(!state||a.status===state));
  const tbody=e('placement-admin-rows');tbody.replaceChildren();
  for(const a of rows){
    const who=studentMap.get(a.student_id)||{};
    const tr=document.createElement('tr');cell(tr,formatDate(a.submitted_at));cell(tr,(who.display_name||a.display_name||who.email||'Student')+'\n'+(who.email||''));cell(tr,a.status);cell(tr,a.overall_level||'Pending');cell(tr,Object.values(a.skill_scores||{}).filter(x=>typeof x==='number').length+'/6');
    const td=document.createElement('td'),actions=document.createElement('div');actions.className='placement-admin-row-actions';
    const button=document.createElement('button');button.type='button';button.className='placement-view';button.textContent='View report';button.onclick=()=>detail(a);
    const del=document.createElement('button');del.type='button';del.className='placement-danger';del.textContent='Delete attempt';del.onclick=()=>deleteAttempt(a);
    actions.append(button,del);td.append(actions);tr.append(td);tbody.append(tr);
  }
  setStatus(rows.length+' result(s) shown · '+attempts.length+' submissions loaded (latest 300).');
  if(rows.length===0){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=6;td.textContent='No reports yet. Students must sign in to Webilang Global and select Save & send to teacher in the Placement Test.';tr.append(td);tbody.append(tr);}
}

// Never delete from the browser directly. The Supabase RPC functions verify
// auth.uid() is a member of webilang_admins on every invocation.
let pendingMutation=false;
async function adminMutation(rpc,args,success){
  if(pendingMutation)return;
  pendingMutation=true;
  const resetButton=e('placement-admin-reset');resetButton.disabled=true;
  setStatus('Updating saved placement results…');
  try{
    const {data,error}=await db.rpc(rpc,args);
    if(error)throw error;
    e('placement-admin-detail').classList.add('hidden');current=null;
    await load();
    setStatus(success+' · '+Number(data||0)+' submission(s) removed.');
  }catch(err){
    setStatus('Could not update results: '+clean(err.message||err,300)+'. Check that the administrator SQL setup was installed.');
  }finally{pendingMutation=false;drawResetState();}
}
function drawResetState(){
  const selected=e('placement-admin-student').value;
  e('placement-admin-reset').disabled=pendingMutation||!selected||!attempts.some(a=>a.student_id===selected);
}
async function deleteAttempt(attempt){
  const who=studentMap.get(attempt.student_id)||{};
  const name=who.display_name||who.email||attempt.display_name||'this student';
  if(!confirm('Permanently delete this Placement Test submission?\n\nStudent: '+name+'\nSubmitted: '+formatDate(attempt.submitted_at)+'\n\nThe saved report and any shared transcripts will be deleted. This cannot be undone.'))return;
  await adminMutation('webilang_admin_delete_placement_attempt',{p_attempt_id:attempt.id},'Attempt deleted');
}
async function resetSelectedStudent(){
  const id=e('placement-admin-student').value;if(!id)return;
  const records=attempts.filter(a=>a.student_id===id);
  const who=studentMap.get(id)||{};
  const name=who.display_name||who.email||'Selected student';
  const typed=prompt('RESET ALL PLACEMENT RESULTS for '+name+'?\n\nThis permanently deletes every saved attempt and any shared transcripts. It does not delete the student account, profile or other learning data.\n\nType RESET to confirm:');
  if(typed!=='RESET')return;
  await adminMutation('webilang_admin_reset_student_placement',{p_student_id:id},'Student placement history reset');
}

async function load(){
  const btn=e('placement-admin-refresh');btn.disabled=true;setStatus('Loading placement reports…');
  try{
    const auth=await db.auth.getUser();const user=auth.data?.user;
    if(!user)throw new Error('Sign in to Webilang Global as an administrator first.');
    const check=await db.from('webilang_admins').select('user_id').eq('user_id',user.id).maybeSingle();
    if(check.error||!check.data)throw new Error('This Webilang account does not have administrator permission.');
    const learners=await db.rpc('webilang_admin_list_students');
    if(learners.error)throw learners.error;
    const list=Array.isArray(learners.data)?learners.data:[];
    studentMap=new Map(list.map(x=>[x.user_id,x]));
    const select=e('placement-admin-student'),old=select.value;
    select.replaceChildren(new Option('All registered students',''));
    for(const x of list){select.add(new Option((x.display_name||x.email||'Student')+' — '+(x.email||''),x.user_id));}
    if([...select.options].some(x=>x.value===old))select.value=old;
    const rows=await db.from('webilang_placement_attempts')
      .select('id,student_id,display_name,test_code,test_version,submitted_at,status,overall_level,skill_scores,skill_levels,evidence,transcripts,transcripts_shared')
      .order('submitted_at',{ascending:false}).limit(300);
    if(rows.error)throw rows.error;
    attempts=rows.data||[];draw();
  }catch(err){setStatus('Could not load Placement Results: '+clean(err.message||err,350)+'. If the table is missing, run the supplied Supabase SQL script.');}
  finally{btn.disabled=false;}
}
e('placement-admin-refresh').addEventListener('click',load);
e('placement-admin-student').addEventListener('change',draw);
e('placement-admin-reset').addEventListener('click',resetSelectedStudent);
e('placement-admin-state').addEventListener('change',draw);
e('placement-detail-close').addEventListener('click',()=>e('placement-admin-detail').classList.add('hidden'));
e('placement-detail-download').addEventListener('click',()=>{if(current)downloadText(reportString(current),'Webilang_Level_Quest_'+String(current.submitted_at||'').slice(0,10)+'.txt');});
await load();
