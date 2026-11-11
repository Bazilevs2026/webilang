/** Webilang Global · Admin partner directory controls, November 2026.
 * Requires the additive supabase/admin-partner-management.sql migration.
 * Existing student partner preferences, video, Kostya and lessons are untouched.
 */
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from '/student-memory/config.js';

const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

// Load the names entered in Supabase Authentication, with a user-ID join.
// Fail safely: leave existing names intact if this optional admin RPC is unavailable.
async function applyAuthDisplayNames(client, learners) {
  try {
    const { data, error } = await client.rpc('webilang_admin_auth_display_names');
    if (error) throw error;
    const namesById = new Map((Array.isArray(data) ? data : [])
      .filter(row => row.user_id && typeof row.display_name === 'string' && row.display_name.trim())
      .map(row => [row.user_id, row.display_name.trim()]));
    for (const learner of learners) {
      const name = namesById.get(learner.user_id);
      if (name) learner.display_name = name;
    }
  } catch (error) {
    console.warn('Authentication display names unavailable: retaining current student labels.', error);
  }
}

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=(s,max=80)=>String(s??'').trim().slice(0,max);
const langs={en:'English',ru:'Russian',other:'Another language'};
let students=[],profiles=new Map(),loading=false;

const section=document.createElement('section');
section.className='card';section.id='partner-management';
section.innerHTML=`<div class="pm-title"><div><h2>🤝 Learning Partners · Admin</h2><p class="muted">Manage visibility in the real Webilang partner directory. Only students with recorded permission may be enabled. Students can hide themselves at any time.</p></div><a class="pm-link" href="/webilang-global/webilang-missions.html?view=teams" target="_blank" rel="noopener">Open Teams &amp; Lounge ↗</a></div>
<p id="pm-status" class="muted" role="status">Checking administrator permissions…</p>
<div id="pm-controls" style="display:none">
 <div class="pm-grid">
  <div><label for="pm-student">Registered student</label><select id="pm-student"><option value="">Select a learner…</option></select></div>
  <div><label for="pm-filter">Directory status</label><select id="pm-filter"><option value="all">All registered learners</option><option value="visible">Discoverable</option><option value="hidden">Hidden</option><option value="optedout">Student opted out</option></select></div>
 </div>
 <div id="pm-selected" class="pm-selected" hidden>
  <div id="pm-summary" class="pm-summary"></div>
  <div id="pm-start-settings">
   <p class="muted" style="margin:8px 0 6px">For students without a partner profile, enter initial preferences. Students can edit these themselves later.</p>
   <div class="pm-grid pm-three">
    <div><label for="pm-learning">Learning</label><select id="pm-learning"><option value="en">English</option><option value="ru">Russian</option></select></div>
    <div><label for="pm-help">Can help with</label><select id="pm-help"><option value="ru">Russian</option><option value="en">English</option><option value="other">Other / not sure</option></select></div>
    <div><label for="pm-level">Level</label><select id="pm-level"><option>A1</option><option selected>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></div>
   </div>
  </div>
  <div id="pm-permission-panel">
   <label for="pm-method">How did the student agree to join the partner directory?</label>
   <select id="pm-method"><option value="">Select permission source…</option><option value="in_person">Student agreed in class / conversation</option><option value="email">Student agreed by message / email</option><option value="enrollment_form">Enrollment / registration consent</option><option value="other_documented">Other documented agreement</option></select>
   <label class="pm-check"><input type="checkbox" id="pm-consent"/> <span>I confirm this student has explicitly agreed to appear by name in the Webilang partner directory and receive student invitations.</span></label>
  </div>
  <div class="pm-buttons"><button type="button" id="pm-enable">Make discoverable</button><button type="button" id="pm-hide" class="secondary">Hide from directory</button></div>
  <p class="muted pm-footnote" id="pm-optout-note"></p>
 </div>
 <div class="scroll"><table><thead><tr><th>Student</th><th>Learning</th><th>Can help</th><th>Level</th><th>Status</th><th>Last teacher action</th></tr></thead><tbody id="pm-rows"></tbody></table></div>
 <p class="muted pm-footnote">Discoverable means listed to other signed-in Webilang learners. It does not mean online right now. No student email or Student Memory is published. An opted-out student must personally re-enable visibility.</p>
</div>`;
const style=document.createElement('style');style.textContent=`
#partner-management{scroll-margin-top:14px}#partner-management h2{margin:0 0 6px}#partner-management .pm-title{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
#partner-management .pm-link{background:#eaf4f1;color:#195e52;border-radius:11px;padding:10px 13px;font-weight:700;text-decoration:none}
#partner-management .pm-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0}#partner-management .pm-three{grid-template-columns:repeat(3,minmax(0,1fr))}
#partner-management label{display:block;font-size:13px;font-weight:750;margin:0 0 6px}#partner-management select{font:inherit;width:100%;min-width:0;border:1px solid #c8d5e4;border-radius:10px;padding:10px;background:#fff;color:#243451}
#partner-management .pm-selected{border:1px solid #d5e6df;background:#f8fcfa;border-radius:14px;padding:16px;margin:15px 0}#partner-management .pm-selected[hidden]{display:none}
#partner-management .pm-summary{font-weight:700;margin-bottom:12px}#partner-management .pm-check{display:flex;align-items:flex-start;gap:9px;font-weight:500;font-size:13px;margin:12px 0}#partner-management .pm-check input{margin-top:3px;flex:0 0 auto}
#partner-management .pm-buttons{display:flex;flex-wrap:wrap;gap:10px;margin:13px 0}#partner-management .pm-footnote{font-size:12px;line-height:1.55}
#partner-management .pm-good{color:#176a3b;font-weight:700}#partner-management .pm-error{color:#ad3933;font-weight:700}#partner-management td{vertical-align:top}
#partner-management .pm-pill{display:inline-block;border-radius:13px;background:#eaf4f1;color:#185d4f;padding:5px 10px;font-size:12px;font-weight:750}
#partner-management .pm-pill.hidden{display:inline-block!important;background:#f0f2f5;color:#626e7a}#partner-management .pm-pill.optout{background:#fff2e5;color:#a45019}
@media(max-width:700px){#partner-management .pm-grid,#partner-management .pm-three{grid-template-columns:1fr}#partner-management table{min-width:680px}}
`;document.head.append(style);
const after=$('lesson-assignments');if(after)after.insertAdjacentElement('beforebegin',section);else $('admin')?.append(section);

function status(message,bad=false){$('pm-status').textContent=message;$('pm-status').className=bad?'pm-error':'muted pm-good'}
function getStudent(id){return students.find(x=>x.user_id===id)}
function profileStatus(p){return !p?'No profile':p.student_opted_out?'Student opted out':p.available?'Discoverable':'Hidden'}
function draw(){
  const filter=$('pm-filter').value,body=$('pm-rows');body.replaceChildren();
  const shown=students.filter(s=>{const p=profiles.get(s.user_id);return filter==='all'||filter==='visible'&&p?.available||filter==='optedout'&&p?.student_opted_out||filter==='hidden'&&(!p||!p.available)});
  for(const s of shown){const p=profiles.get(s.user_id),tr=document.createElement('tr');
    const add=t=>{const td=document.createElement('td');td.textContent=t;tr.append(td);return td;};
    const who=add((s.display_name||p?.display_name||'Student')+'\n'+(s.email||''));
    const choose=document.createElement('button');choose.type='button';choose.className='secondary';choose.style.cssText='display:block;margin-top:8px;padding:6px 10px;font-size:12px';choose.textContent='Manage';choose.onclick=()=>{$('pm-student').value=s.user_id;chooseStudent();section.scrollIntoView({behavior:'smooth',block:'start'});};who.append(choose);
    add(p?.learning_language?langs[p.learning_language]||p.learning_language:'—');
    add(p?.can_help_with?langs[p.can_help_with]||p.can_help_with:'—');
    add(p?.learner_level||s.english_level||'—');
    const td=add('');const badge=document.createElement('span');badge.className='pm-pill '+(p?.student_opted_out?'optout':!p?.available?'hidden':'');badge.textContent=profileStatus(p);td.append(badge);
    add(p?.last_admin_action?`${p.last_admin_action} · ${new Date(p.last_admin_action_at).toLocaleDateString()}`:'—');body.append(tr);
  }
  if(!shown.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=6;td.textContent='No students for this filter.';tr.append(td);body.append(tr)}
}
function chooseStudent(){const id=$('pm-student').value,student=getStudent(id),p=profiles.get(id);$('pm-selected').hidden=!student;if(!student)return;
  $('pm-summary').textContent=(student.display_name||p?.display_name||student.email||'Student')+' · '+profileStatus(p)+(p?.available?' · Visible to signed-in students':'');
  $('pm-start-settings').hidden=!!p;
  $('pm-learning').value=p?.learning_language||'en';$('pm-help').value=p?.can_help_with||'ru';
  $('pm-level').value=['A1','A2','B1','B2','C1','C2'].includes(p?.learner_level||student.english_level)?(p?.learner_level||student.english_level):'A2';
  $('pm-consent').checked=false;$('pm-method').value='';
  $('pm-enable').disabled=!!p?.student_opted_out||!!p?.available;
  $('pm-hide').disabled=!p?.available;
  $('pm-permission-panel').hidden=!!p?.student_opted_out||!!p?.available;
  $('pm-optout-note').textContent=p?.student_opted_out?'The student opted out. The teacher cannot override this decision. Ask the student to enable visibility themselves in Teams & Lounge.':p?.available?'This learner is already discoverable; you may hide them from the directory.':'You may enable this student only after confirming their permission.';
}
async function load(){if(loading)return;loading=true;status('Loading registered students and directory settings…');
 try{
   const auth=await db.auth.getUser();if(!auth.data?.user)throw Error('Sign in to Webilang as an administrator first.');
   const a=await db.from('webilang_admins').select('user_id').eq('user_id',auth.data.user.id).maybeSingle();if(a.error||!a.data)throw Error('This account does not have administrator access.');
   const [roster,partnerRows]=await Promise.all([db.rpc('webilang_admin_list_students'),db.rpc('webilang_admin_list_partner_profiles')]);
   if(roster.error)throw roster.error;if(partnerRows.error)throw partnerRows.error;
   students=Array.isArray(roster.data)?roster.data:[];await applyAuthDisplayNames(db,students);profiles=new Map((partnerRows.data||[]).map(p=>[p.user_id,p]));
   const select=$('pm-student'),previous=select.value;select.replaceChildren(new Option('Select a learner…',''));
   students.forEach(s=>select.add(new Option((s.display_name||s.email||'Student')+' — '+(s.email||''),s.user_id)));
   if([...select.options].some(o=>o.value===previous))select.value=previous;
   $('pm-controls').style.display='';chooseStudent();draw();
   const listed=students.filter(s=>profiles.get(s.user_id)?.available).length;
   status(`${students.length} registered learner(s) · ${listed} currently discoverable. Select a student to manage.`);
 }catch(err){status('Could not load partner management: '+clean(err.message||err,280)+'. Make sure the new SQL has been run in Supabase.',true)}
 finally{loading=false}
}
async function setVisibility(visible){const student=getStudent($('pm-student').value),p=student&&profiles.get(student.user_id);if(!student)return status('Select a learner first.',true);
 if(visible&&p?.student_opted_out)return status('This student opted out. Only the student can re-enable visibility.',true);
 const confirmBox=$('pm-consent'),method=$('pm-method').value;
 if(visible&&(!confirmBox.checked||!method))return status('Confirm that the learner gave permission and select how permission was obtained.',true);
 if(!visible&&!confirm('Hide this learner from the partner directory?'))return;
 const buttons=[$('pm-enable'),$('pm-hide')];buttons.forEach(b=>b.disabled=true);status(visible?'Enabling partner visibility…':'Hiding learner…');
 try{
  const args={p_student_id:student.user_id,p_visible:visible,p_permission_confirmed:visible&&confirmBox.checked,p_consent_method:visible?method:null};
  if(!p){args.p_display_name=clean(student.display_name||'Webilang learner',80);args.p_learning_language=$('pm-learning').value;args.p_can_help_with=$('pm-help').value;args.p_learner_level=$('pm-level').value;}
  const {error}=await db.rpc('webilang_admin_set_partner_visibility',args);if(error)throw error;
  await load();status(visible?'Partner visibility enabled. The student will now appear in Available Learning Partners.':'Learner hidden from the partner directory.');
 }catch(err){status('Update failed: '+clean(err.message||err,260),true);chooseStudent()}
 finally{buttons.forEach(b=>b.disabled=false);chooseStudent()}
}
$('pm-student').addEventListener('change',chooseStudent);
$('pm-filter').addEventListener('change',draw);
$('pm-enable').addEventListener('click',()=>setVisibility(true));
$('pm-hide').addEventListener('click',()=>setVisibility(false));
// Preserve the existing admin page's authentication and data-loading workflows.
await load();
