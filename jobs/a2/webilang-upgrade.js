(()=>{'use strict';
/* Remove retired Home/progress data; personal Supabase Stocks are not affected. */
try{localStorage.removeItem('jobs_money_mission_a2_v2');localStorage.removeItem('jobs_money_mission_activity_v1')}catch(e){}
const $=id=>document.getElementById(id), escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jobs=['NASA Curiosity Driver','Professional Criminal (ethical security tester)','Island Caretaker','Ice Cream Taster'];
const topics=[
['🦾','Modern tool','Look at a robotic arm and a camera. What job uses these tools? Why?','It can… A worker needs to…'],
['🏮','Obsolete job','A person lights gas lamps in the streets at night. What was this job? Why has it disappeared?','In the past… Nowadays…'],
['🛏️','Funny job','Would you like to be a professional bed tester? What would your working day be like?','I would / wouldn’t… because…'],
['🦟','Crazy money','You can earn $10,000 a month counting mosquitoes in a swamp. Would you accept?','Even for a lot of money, I would…'],
['⚖️','Money or freedom?','Choose: a very well-paid job with no free time OR an average salary with lots of free time. Why?','I would prefer… because…'],
['📆','A difficult boss','Your boss asks you to work on Sunday, but you have a family party. What do you say?','I am sorry, but… Could I… instead?'],
['🌍','Dream workplace','Work for a year on a space station, a tropical island, or in a big city. Where and why?','I would like to work…'],
['💸','Fair pay?','Who should earn the most: a cleaner, a doctor, or a famous actor? Give two reasons.','I think… because…']
];
const style=document.createElement('style');style.textContent='#panel-home,.progress,.adaptive-top-strip{display:none!important}.jobs-v3{background:#fff;border:1px solid #d8e4df;border-radius:18px;padding:18px;margin:13px 0}.jobs-v3 textarea{display:block;width:100%;min-height:88px;padding:11px;border:1px solid #bfcfc7;border-radius:11px;font:inherit;box-sizing:border-box}.jobs-v3 .jrow{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.jobs-v3 .jrow button,.jobs-v3 select{padding:10px 13px;border-radius:9px;border:1px solid #c5d6cf;background:#fff;cursor:pointer}.jobs-v3 button.primary{background:#15935f!important;color:white!important}.jobs-v3 .jhelp{padding:13px;background:#edf8f2;border-left:4px solid #15935f;margin:10px 0;line-height:1.65}.jobs-v3 .jprompt{font-size:18px;line-height:1.6}.jobs-v3 .jreply{padding:10px;background:#eaf6ed;border-radius:10px;margin:8px 0;white-space:pre-wrap}.jobs-v3 .jreply.ai{background:#eaf1f8}.jobs-v3 iframe{display:block;width:100%;height:220px;border:0;border-radius:14px;background:#dbe9ec}.jfloat{position:fixed;right:17px;bottom:17px;z-index:9999;background:#f3a22f;color:#16252e;border:0;border-radius:30px;padding:13px 17px;box-shadow:0 5px 18px #0003;font-weight:800}.jcoach{position:fixed;z-index:10000;right:15px;bottom:15px;width:min(385px,calc(100vw - 30px));background:white;border-radius:17px;padding:18px;box-shadow:0 12px 65px #1235;max-height:80vh;overflow:auto}.jcoach[hidden]{display:none}/* Compact floating Kostya: override oversized global lesson button typography */#jCoach.jcoach{box-sizing:border-box!important;position:fixed!important;right:16px!important;bottom:16px!important;left:auto!important;top:auto!important;width:min(354px,calc(100vw - 24px))!important;max-width:354px!important;max-height:min(660px,85dvh)!important;overflow-y:auto!important;padding:15px!important;margin:0!important;border-radius:16px!important;z-index:10000!important;font-family:Inter,system-ui,sans-serif!important;font-size:14px!important;line-height:1.45!important;box-shadow:0 14px 48px #15293e36!important}#jCoach.jcoach[hidden]{display:none!important}#jCoach.jcoach .jrow{margin:8px 0!important;gap:7px!important;align-items:center}#jCoach.jcoach .jrow:first-child{justify-content:space-between!important;margin:0 0 12px!important}#jCoach.jcoach strong{font-size:16px!important;line-height:1.2!important;font-weight:800!important}#jCoach.jcoach p{font-size:12px!important;line-height:1.5!important;color:#617286!important;margin:7px 0 11px!important}#jCoach.jcoach button{font:600 12px/1.25 Inter,system-ui,sans-serif!important;letter-spacing:0!important;text-transform:none!important;padding:9px 10px!important;width:auto!important;min-height:34px!important;border-radius:9px!important;box-shadow:none!important}#jCoachClose{font-size:18px!important;min-width:34px!important;min-height:34px!important;padding:4px!important}#jCoach.jcoach textarea{font:400 14px/1.4 Inter,system-ui,sans-serif!important;width:100%!important;height:78px!important;min-height:78px!important;max-height:130px!important;resize:vertical!important;border-radius:9px!important;padding:10px!important;margin:8px 0!important}#jCoachReply.jreply{font-size:13px!important;line-height:1.5!important;min-height:0!important;padding:11px!important;margin:8px 0!important;max-height:185px!important;overflow-y:auto!important}#jCoachReply.jreply:empty{display:none!important}#jCoachStatus{display:block;font-size:12px!important;color:#617286!important;margin-top:5px}#jCoachStatus:empty{display:none!important}@media(max-width:420px){#jCoach.jcoach{right:8px!important;bottom:8px!important;width:calc(100vw - 16px)!important;max-width:none!important;max-height:82dvh!important;padding:12px!important}}';document.head.append(style);
document.querySelectorAll('[data-tab="home"]').forEach(x=>x.remove());
$('panel-home')?.remove();
document.querySelectorAll('.header-actions button').forEach(x=>{if((x.getAttribute('onclick')||'').includes("showPanel('home')"))x.remove()});
$('panel-home')?.classList.remove('active');$('panel-story')?.classList.add('active');document.querySelector('[data-tab="story"]')?.classList.add('active');
const nav=document.querySelector('header nav');if(!nav)return;
const speakingTab=nav.querySelector('[data-tab="opinion"]');speakingTab.textContent='🎡 Speaking';
nav.querySelector('[data-tab="career"]').textContent='🎮 Game';
const tabs=[['roleplays','🎭 Roleplays'],['mywords','📚 My Word Stock'],['mygrammar','🧩 My Grammar Stock']];
const main=document.querySelector('main');
tabs.forEach(([id,name])=>{const b=document.createElement('button');b.className='tab';b.dataset.tab=id;b.textContent=name;nav.append(b);b.addEventListener('click',()=>{if(typeof showPanel==='function')showPanel(id);if(id!=='roleplays')loadStocks()});const section=document.createElement('section');section.className='panel';section.id='panel-'+id;main.append(section)});
const speaking=$('panel-opinion');speaking.replaceChildren();
speaking.innerHTML='<div class="section-head"><span class="tag">SPEAKING · A2</span><h2>Jobs Roulette · 8 challenges</h2><p>20 seconds to prepare, 45 seconds to speak. Different kinds of prompts, one at a time.</p></div><div class="jobs-v3"><div class="jrow"><button id="jSpin" class="primary">🎲 Spin</button><span id="jCount">0 / 8</span></div><div id="jQuestion" class="jprompt">Spin for a challenge.</div><div class="jhelp" id="jHint" hidden></div><div class="jrow"><button id="jShowHint">💡 One hint</button><button id="jPrep">⏱ Prepare 20s</button><button id="jSpeak">🎙 Speak 45s</button><span id="jTimer"></span></div><textarea id="jAnswer" placeholder="Speak, dictate, or type your answer."></textarea><div class="jrow"><button id="jDictate">🎤 Dictate</button><button id="jFeedback" class="primary">Get AI feedback</button></div><div id="jResult"></div></div>';
let seen=[],current=-1,ticker=null;
function spin(){if(seen.length===8)seen=[];const remaining=topics.map((_,i)=>i).filter(i=>!seen.includes(i));current=remaining[Math.floor(Math.random()*remaining.length)];seen.push(current);const t=topics[current];$('jCount').textContent=seen.length+' / 8';$('jQuestion').innerHTML='<h2>'+t[0]+' '+escape(t[1])+'</h2><p>'+escape(t[2])+'</p>';$('jHint').textContent=t[3];$('jHint').hidden=true;$('jAnswer').value='';$('jResult').textContent='';clearInterval(ticker);$('jTimer').textContent=''}
$('jSpin').onclick=spin;$('jShowHint').onclick=()=>{$('jHint').hidden=!$('jHint').hidden};
function count(seconds){clearInterval(ticker);$('jTimer').textContent=seconds+'s';ticker=setInterval(()=>{seconds--;$('jTimer').textContent=seconds>0?seconds+'s':'Time is up!';if(seconds<=0)clearInterval(ticker)},1000)}
$('jPrep').onclick=()=>count(20);$('jSpeak').onclick=()=>count(45);
function dictate(target){const Rec=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Rec){alert('Speech recognition is unavailable in this browser.');return}const r=new Rec();r.lang='en-US';r.onresult=e=>{target.value=(target.value+' '+e.results[0][0].transcript).trim();target.dispatchEvent(new Event('input',{bubbles:true}))};r.start()}
$('jDictate').onclick=()=>dictate($('jAnswer'));
const rp=$('panel-roleplays');rp.innerHTML='<div class="section-head"><span class="tag">ROLEPLAY · A2</span><h2>Job Interview — Two Perspectives</h2><p>Prepare your language first, then interview with your AI partner.</p></div><div class="jobs-v3"><h3>1 · Select your role</h3><div class="jrow"><button id="jApply" class="primary">I am applying · Nova interviews me</button><button id="jHire">I am hiring · Chaz applies</button></div><h3>2 · Choose a curious job</h3><select id="jJob" aria-label="Choose the job">'+jobs.map((x,i)=>'<option value="'+i+'">'+escape(x)+'</option>').join('')+'</select><div class="jhelp" id="jScaffold"></div><h3>3 · Prepare your own answers / questions</h3><p>Choose helpful chunks, build 2–3 sentences, and check them before you talk.</p><textarea id="jNotes" placeholder="I am good at…"></textarea><div class="jrow"><button id="jCheckNotes">✓ Check my preparation</button><button class="primary" id="jStart">🎙 Start live interview</button><button id="jEnd" disabled>■ End & feedback</button></div><p id="jStatus" aria-live="polite"></p><iframe id="jAvatar" src="/avatar-lab/index.html" title="Job interview avatar" loading="lazy"></iframe><audio id="jAudio" autoplay playsinline></audio><div id="jTranscript"></div><div id="jInterviewFeedback"></div></div>';
let role='applicant',lines=[],live=null;
function scaffold(){const job=jobs[Number($('jJob').value)];$('jApply').classList.toggle('primary',role==='applicant');$('jHire').classList.toggle('primary',role==='employer');$('jScaffold').innerHTML=role==='applicant'?'<b>Your job: '+escape(job)+'</b><br>Useful phrases:<br><b>I want this job because…<br>I am good at…<br>I can…<br>I have experience with… / I am ready to learn…<br>Could you tell me about the working hours?</b><br>Goal: describe two skills and ask one question.':'<b>You are interviewing an applicant for '+escape(job)+'</b><br>Useful questions:<br><b>Why do you want this job?<br>Are you good at…?<br>Can you…?<br>Do you have any experience?<br>When can you start?<br>Why should we hire you?</b><br>Goal: ask three questions, listen and decide.';const f=$('jAvatar');const change=()=>{try{const sel=f.contentDocument?.getElementById('modelMode');if(sel){sel.value=role==='applicant'?'nova':'chaz';sel.dispatchEvent(new Event('change',{bubbles:true}))}}catch(e){}};f.addEventListener('load',change,{once:true});change()}
$('jApply').onclick=()=>{role='applicant';scaffold()};$('jHire').onclick=()=>{role='employer';scaffold()};$('jJob').onchange=scaffold;scaffold();

/* Guided A2 preparation: recognition, paraphrase, retrieval and independent notes. */
const preparation=document.createElement('div');preparation.className='jobs-v3';preparation.id='jGuidedPrep';
$('jScaffold').after(preparation);
let prepChoice=-1,prepRecall='';
function prepExercise(){
 const applying=role==='applicant';
 const correct=applying?'I am good at working with people.':'Do you have any experience with computers?';
 const wrong=applying?['I am good in working with people.','I good at working with people.']:['Are you have experience with computers?','You have any experienced with computers?'];
 const choices=[correct,...wrong];const order=[2,0,1];
 preparation.innerHTML='<h3>Before the interview · three small steps</h3><p><b>Step 1 — Recognition:</b> Choose the most suitable and grammatically correct sentence.</p>'+
 order.map((ix,n)=>'<label style="display:block;margin:8px 0"><input type="radio" name="jPrepChoice" value="'+ix+'"> '+escape(choices[ix])+'</label>').join('')+
 '<button id="jPrepCheck">Check + explain</button><div id="jPrepExplanation" class="jhelp" hidden></div>'+
 '<p><b>Step 2 — Paraphrase:</b> Say the same idea in a different way.</p>'+
 '<p>'+escape(applying?'I am good at working with people.':'Do you have any experience with computers?')+'</p>'+
 '<textarea id="jParaphrase" placeholder="'+(applying?'I work well with people.':'Have you worked with computers before?')+'"></textarea>'+
 '<button id="jParaphraseCheck">Check my paraphrase with Kostya</button><div id="jParaphraseResult"></div>'+
 '<p><b>Step 3 — Retrieval:</b> Hide the support above and write your own interview questions or answers in the notes below.</p>'+
 '<button id="jPrepHide">Hide example phrases</button>';
 preparation.querySelector('#jPrepCheck').onclick=()=>{
  const selected=preparation.querySelector('input[name=jPrepChoice]:checked');
  const msg=preparation.querySelector('#jPrepExplanation');msg.hidden=false;
  if(!selected){msg.textContent='Select one answer first.';return}
  msg.innerHTML=(Number(selected.value)===0?'✅ Correct. ':'Try again. ')+
  (applying?'Use “good at” + -ing: “good at working”. “I good” needs “am”. Русский: после good at используем глагол с -ing; в английском предложении нужен am.':
  'Use “Do you have…?” for a Present Simple question. “Are you have” combines incompatible question structures. Русский: в вопросе Present Simple с have нужен вспомогательный do.')};
 preparation.querySelector('#jParaphraseCheck').onclick=async()=>{
   const answer=preparation.querySelector('#jParaphrase').value.trim();
   if(!answer){preparation.querySelector('#jParaphraseResult').textContent='Write a paraphrase first.';return}
   const response=preparation.querySelector('#jParaphraseResult');response.textContent='Checking…';
   try{const r=await ask('teacher',{history:[{role:'user',content:'For A2 interview preparation, check if this is a natural paraphrase of "'+correct+'": "'+answer+'". Say whether meaning is preserved; give one clear correction if necessary. Explain briefly in English and Russian.'}]});response.textContent=r.answer}catch(e){response.textContent=e.message}
 };
 preparation.querySelector('#jPrepHide').onclick=()=>{
   const el=$('jScaffold');el.hidden=!el.hidden;
   preparation.querySelector('#jPrepHide').textContent=el.hidden?'Show example phrases':'Hide example phrases';
 };
}
const oldScaffold=scaffold;
scaffold=function(){oldScaffold();prepExercise()};
prepExercise();

let actions=[];
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const sect=b.closest('main section.panel');if(!sect)return;actions.push({tab:sect.id,action:(b.textContent||'').trim().slice(0,75)});actions=actions.slice(-10)},true);
function snapshot(){const panel=document.querySelector('main>.panel.active');return {module:'Jobs & Money A2',activeTab:panel?.id,heading:panel?.querySelector('h2')?.textContent,job:jobs[Number($('jJob').value)],role,inputs:[...panel?.querySelectorAll('textarea,input,select')||[]].filter(x=>!x.disabled&&x.offsetParent).slice(0,12).map(x=>({label:x.placeholder||x.id,value:String(x.value||'').slice(0,350)})),recentActions:actions,interviewSpeech:lines.filter(x=>x.role==='student').slice(-4)}}
async function ask(type,data){const r=await fetch('/api/jobs-a2-coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,...data})});const d=await r.json();if(!r.ok)throw Error(d.error||'AI unavailable');return d}
function showFeedback(f,holder){holder.innerHTML='<div class="jobs-v3"><h3>AI feedback</h3>'+['interaction','grammar','vocabulary','nextStep'].map(k=>'<p><b>'+escape(k)+':</b> '+escape(f[k]||'No specific issue.')+'</p>').join('')+'</div>';[...(f.grammarItems||[]).map(x=>({...x,kind:'grammar'})),...(f.vocabularyItems||[]).map(x=>({...x,kind:'words'})),...(f.newWords||[]).map(x=>({kind:'words',corrected:x.word,original:x.word,example:x.example}))].forEach(item=>{const b=document.createElement('button');b.textContent='＋ Save '+(item.kind==='words'?'word: ':'grammar: ')+item.corrected;b.onclick=async()=>{b.disabled=true;try{await saveStock(item);b.textContent='✓ Saved to Stock'}catch(e){b.disabled=false;b.textContent=e.message}};holder.lastElementChild.append(b)})}
$('jFeedback').onclick=async()=>{const t=$('jAnswer').value.trim();if(current<0||!t)return alert('Spin first, then answer.');$('jResult').textContent='Analysing…';try{showFeedback(await ask('feedback',{transcript:t,scene:topics[current][2]}),$('jResult'))}catch(e){$('jResult').textContent=e.message}};
$('jCheckNotes').onclick=async()=>{const t=$('jNotes').value.trim();if(!t)return alert('Write your preparation notes first.');$('jStatus').textContent='Checking your notes…';try{showFeedback(await ask('feedback',{transcript:t,scene:role+' '+jobs[+$('jJob').value]}),$('jInterviewFeedback'));$('jStatus').textContent='Preparation checked. Edit your notes if needed.'}catch(e){$('jStatus').textContent=e.message}};
let db=null;async function getDb(){if(db)return db;const [{createClient},c]=await Promise.all([import('https://esm.sh/@supabase/supabase-js@2'),import('/student-memory/config.js')]);return db=createClient(c.SUPABASE_URL,c.SUPABASE_PUBLISHABLE_KEY)}
async function saveStock(item){const client=await getDb(),u=(await client.auth.getUser()).data.user;if(!u)throw Error('Sign in to Webilang Global first.');const value=item.corrected;const {error}=await client.from('student_learning_entries').insert({user_id:u.id,module:'Jobs & Money A2',kind:'memory_note',content:{source:'webilang-ai-stock-v1',type:item.kind,text:value,item:item.kind==='words'?{word:value,source:'Jobs & Money A2'}:{pattern:value,source:'Jobs & Money A2'}}});if(error)throw Error(error.message)}
async function loadStocks(){try{const client=await getDb(),u=(await client.auth.getUser()).data.user;if(!u)throw Error('Please sign in to Webilang Global.');const {data,error}=await client.from('student_learning_entries').select('content').eq('user_id',u.id).eq('module','Jobs & Money A2').eq('kind','memory_note').order('created_at',{ascending:false}).limit(300);if(error)throw Error(error.message);for(const [id,kind] of [['mywords','words'],['mygrammar','grammar']]){const p=$('panel-'+id);p.innerHTML='<h2>'+((kind==='words')?'My Word Stock':'My Grammar Stock')+'</h2><p>Select an expression, retrieve it and use it in an original workplace sentence.</p>';const arr=(data||[]).filter(x=>x.content?.type===kind).map(x=>x.content.text);arr.forEach(x=>{const b=document.createElement('button');b.textContent=x;b.onclick=()=>{p.querySelector('.jobs-v3')?.remove();const area=document.createElement('div');area.className='jobs-v3';area.innerHTML='<h3>Recognition → Retrieval → Production</h3><p>Study: <b>'+escape(x)+'</b></p><p>Now write the expression without looking:</p><input id="jRecall"><button id="jTest">Check</button><p>Use it in a new sentence about work:</p><textarea></textarea><button id="jAskStock">Ask Kostya to review</button><p id="jRecallReply"></p>';p.append(area);area.querySelector('#jTest').onclick=()=>area.querySelector('#jRecallReply').textContent=area.querySelector('#jRecall').value.trim().toLowerCase()===x.toLowerCase()?'Correct!':'Try again. Check the spelling.';area.querySelector('#jAskStock').onclick=()=>{coach.hidden=false;float.hidden=true;$('jQuestionCoach').value='Please check my use of '+x+': '+area.querySelector('textarea').value}};p.append(b)});if(!arr.length)p.innerHTML+='<p>No saved expressions yet. Save them from AI feedback.</p>'}}catch(e){$('panel-mywords').textContent=e.message;$('panel-mygrammar').textContent=e.message}}
const realKostyaStyle=document.createElement('style');realKostyaStyle.textContent="\n#jCoach.jcoach{width:min(480px,calc(100vw - 26px))!important;max-width:480px!important;max-height:min(760px,calc(100dvh - 20px))!important;padding:12px!important}\n#jCoach .jcoach-title{justify-content:space-between!important;cursor:move}\n#jCoach .jcoach-title>div{display:flex;gap:5px}\n#jCoach .jcoach-title strong{font-size:15px!important}\n#jCoach .jcoach-frame{height:min(565px,calc(100dvh - 190px));min-height:300px;width:100%;border-radius:12px;overflow:hidden;background:#eef3ef}\n#jCoach .jcoach-frame iframe{display:block;width:100%;height:100%;border:0}\n#jCoach .jcoach-note{font-size:11px!important;margin:8px 0!important}\n#jCoach .jcoach-text{border-top:1px solid #e1e8e3;padding-top:8px;font-size:12px}\n#jCoach .jcoach-text summary{cursor:pointer;font-weight:700;color:#345b4b}\n#jCoach.minimized{height:auto!important;max-height:none!important}\n#jCoach.minimized .jcoach-frame,#jCoach.minimized .jcoach-note,#jCoach.minimized .jcoach-text,#jCoach.minimized #jCoachStatus{display:none!important}\n@media(max-width:520px){#jCoach.jcoach{width:calc(100vw - 16px)!important;max-width:none!important;right:8px!important;bottom:8px!important}#jCoach .jcoach-frame{height:min(540px,calc(100dvh - 180px))}}\n";document.head.append(realKostyaStyle);
const coach=document.createElement('div');coach.className='jcoach jobs-v3';coach.hidden=true;coach.id='jCoach';
coach.innerHTML='<div class="jrow jcoach-title"><strong>🎙 Kostya · AI English Teacher</strong><div><button type="button" id="jCoachMin" title="Minimize">−</button><button type="button" id="jCoachClose" title="Close">✕</button></div></div><div id="jCoachFrameHost" class="jcoach-frame"></div><p class="jcoach-note">Meet Kostya, then press ▶ Talk to Kostya in his window. His cloned English voice is provided by Qwen.</p><details class="jcoach-text"><summary>Type a question instead</summary><div id="jCoachReply" class="jreply ai"></div><textarea id="jQuestionCoach" placeholder="Ask about your current task…"></textarea><div class="jrow"><button id="jCoachAsk" class="primary">Ask</button><button id="jCoachSpeak">🔊 Hear reply</button></div></details><div class="jcoach-legacy" hidden><button id="jCoachLive" type="button">Live voice</button><button id="jCoachStop" type="button">Stop</button></div><span id="jCoachStatus" role="status"></span><audio id="jCoachAudio" autoplay playsinline></audio>';
document.body.append(coach);
const float=document.createElement('button');float.className='jfloat';float.textContent='🎙 Ask Kostya';document.body.append(float);
let kostyaFrame=null,kostyaMinimized=false,lastKostyaContext='',lastKostyaCheck=null;
function contextForKostya(){
 const state=snapshot(), panel=document.querySelector('main > section.panel.active');
 const headings=[...panel?.querySelectorAll('h2,h3')||[]].slice(0,9).map(x=>x.textContent.trim().slice(0,140));
 const focus=document.activeElement, group=focus?.closest('.card,.jobs-v3,.recorder,.grammar-item,.voice-item');
 const activeTask=(group?.querySelector('h3,h4,.reason-prompt')?.textContent||state.heading||'').trim().slice(0,750);
 const fields=[...panel?.querySelectorAll('textarea,input,select')||[]].filter(x=>!x.disabled&&x.offsetParent!==null).slice(0,8);
 const studentInputs=fields.map(x=>({field:x.id||x.name||'answer',value:String(x.value||'').slice(0,350)}));
 const last=lastKostyaCheck;
 const question=(group?.querySelector('h3,h4,label,.reason-prompt')?.textContent||activeTask).trim().slice(0,850);
 return {source:'webilang-lesson',type:'context',version:1,activeSection:state.activeTab?.replace('panel-','')||'',courseLanguage:'English',title:'Jobs & Money A2',url:location.pathname,headings,activeLabels:[jobs[Number($('jJob').value)],state.role],activeTask,focusedField:focus?.id||'',focusedPassage:(group?.textContent||'').trim().slice(0,750),studentInputs,currentExercise:{question,studentAnswer:String(focus?.value||'').slice(0,350),field:focus?.id||'',options:[]},lastCheck:last};
}
function sendKostyaContext(force=false){
 if(!kostyaFrame?.contentWindow||coach.hidden)return;
 try{const msg=contextForKostya(),key=JSON.stringify(msg);if(!force&&key===lastKostyaContext)return;lastKostyaContext=key;kostyaFrame.contentWindow.postMessage(msg,location.origin)}catch(e){console.warn('Jobs context:',e)}
}
function openKostya(){
 coach.hidden=false;coach.classList.toggle('minimized',kostyaMinimized);float.hidden=true;
 if(!kostyaFrame){const frame=document.createElement('iframe');frame.src='/avatar-lab/realtime-english.html?pilot=kostya_teacher&embed=gender';frame.title='Kostya — your 3D AI English teacher';frame.allow='microphone; autoplay';frame.id='jRealKostya';frame.addEventListener('load',()=>{lastKostyaContext='';sendKostyaContext(true)});$('jCoachFrameHost').append(frame);kostyaFrame=frame;}
 sendKostyaContext(true);
}
function closeKostya(){coach.hidden=true;float.hidden=false;kostyaFrame?.remove();kostyaFrame=null;lastKostyaContext='';kostyaMinimized=false;coach.classList.remove('minimized')}
float.onclick=openKostya;$('jCoachClose').onclick=closeKostya;
$('jCoachMin').onclick=()=>{kostyaMinimized=!kostyaMinimized;coach.classList.toggle('minimized',kostyaMinimized);$('jCoachMin').textContent=kostyaMinimized?'▢':'−';if(!kostyaMinimized)sendKostyaContext(true)};
document.addEventListener('click',e=>{if(kostyaFrame&&e.target.closest('main,nav,header'))queueMicrotask(()=>sendKostyaContext())});
document.addEventListener('input',e=>{if(kostyaFrame&&e.target.closest('main'))queueMicrotask(()=>sendKostyaContext())});
document.addEventListener('change',e=>{if(kostyaFrame&&e.target.closest('main'))queueMicrotask(()=>sendKostyaContext())});
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==kostyaFrame?.contentWindow||e.data?.source!=='webilang-realtime-english'||e.data.type!=='lesson-context-ack')return;$('jCoachStatus').textContent=e.data.connected?'Kostya has your current lesson context.':'Lesson context received. Press Talk to Kostya.'});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!coach.hidden)closeKostya()});
let coachHistory=[];$('jCoachAsk').onclick=async()=>{const q=$('jQuestionCoach').value.trim();if(!q)return;coachHistory.push({role:'user',content:JSON.stringify({question:q,context:snapshot()})});$('jCoachStatus').textContent='Kostya is thinking…';try{const r=await ask('teacher',{history:coachHistory.slice(-8)});coachHistory.push({role:'assistant',content:r.answer});$('jCoachReply').textContent=r.answer;$('jCoachStatus').textContent='Ready.'}catch(e){$('jCoachStatus').textContent=e.message}};
$('jCoachSpeak').onclick=()=>{speechSynthesis.cancel();const x=new SpeechSynthesisUtterance($('jCoachReply').textContent);x.lang='en-US';speechSynthesis.speak(x)};
function closeLive(){const s=live;live=null;if(!s)return;try{s.peer?.close()}catch(e){}try{s.channel?.close()}catch(e){}s.stream?.getTracks().forEach(t=>t.stop())}
async function startLive(coachMode){if(live)throw Error('Finish the current conversation first.');if(!window.RTCPeerConnection||!navigator.mediaDevices?.getUserMedia)throw Error('This browser cannot connect a realtime microphone.');try{if(typeof releaseSharedMicrophone==='function')releaseSharedMicrophone()}catch(e){}
const r=await fetch('/api/qwen-voice-session',{cache:'no-store'});if(!r.ok)throw Error('Voice configuration unavailable');const conf=await r.json();
const p=coachMode?'You are Kostya, a supportive A2 English tutor with the verified page state '+JSON.stringify(snapshot())+'. Answer one short clear question at a time. Do not invent actions.':'You are '+(role==='applicant'?'Nova, a professional job INTERVIEWER. The student applies. Ask concise questions.':'Chaz, a JOB APPLICANT. The student is the employer. Let them ask you interview questions.')+' The job is '+jobs[+$('jJob').value]+'. Student preparation notes: '+$('jNotes').value.slice(0,850)+'. Speak natural A2 English in 1-2 short sentences, with at most one question. Stop and wait after each turn. Do not give feedback during the interview.';
const state=coachMode?$('jCoachStatus'):$('jStatus');state.textContent='Connecting…';
const s={coachMode,state,instructions:p,voice:coachMode?(conf.voices?.kostya||conf.voices?.en||'Aiden'):(role==='applicant'?(conf.voices?.nova||conf.voices?.en||'Tina'):(conf.voices?.chaz||conf.voices?.en||'Aiden')),seen:new Set(),sent:false,ready:false};live=s;
function onEvent(d){if(live!==s)return;const send=x=>s.channel.send(JSON.stringify(x));if(d.type==='session.created'&&!s.sent){s.sent=true;send({type:'session.update',session:{instructions:s.instructions,audio:{output:{voice:s.voice}}}})}
if(d.type==='session.updated'&&!s.ready){s.ready=true;s.sender.replaceTrack(s.stream.getAudioTracks()[0]);state.textContent='Connected: speak now.';const greeting=coachMode?'Say only: "Hi! I am Kostya. What is your question?"':role==='applicant'?'Say only: "Hello! Why are you interested in this job?"':'Say only: "Hello! Thank you for interviewing me."';send({type:'response.create',response:{instructions:greeting}})}
if(d.type==='conversation.item.input_audio_transcription.completed'&&d.transcript){const k='u'+(d.item_id||d.transcript);if(!s.seen.has(k)){s.seen.add(k);if(!coachMode)appendLine('student',d.transcript)}}
if(['response.output_audio_transcript.done','response.audio_transcript.done','response.output_audio_transcript.completed'].includes(d.type)&&d.transcript){const k='a'+(d.item_id||d.transcript);if(!s.seen.has(k)){s.seen.add(k);if(coachMode)$('jCoachReply').textContent=d.transcript;else appendLine('avatar',d.transcript)}}
if(d.type==='error')state.textContent=d.error?.message||'Voice error'}
function appendLine(role,text){lines.push({role,text});$('jTranscript').innerHTML=lines.map(x=>'<div class="jreply '+(x.role==='avatar'?'ai':'')+'"><b>'+(x.role==='student'?'You':'Avatar')+':</b> '+escape(x.text)+'</div>').join('')}
try{s.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});s.peer=new RTCPeerConnection();s.peer.ontrack=e=>{const a=coachMode?$('jCoachAudio'):$('jAudio');a.srcObject=e.streams[0];a.play().catch(()=>state.textContent='Please enable browser sound.')};s.sender=s.peer.addTransceiver('audio',{direction:'sendrecv'}).sender;s.channel=s.peer.createDataChannel('oai-events');s.channel.onmessage=e=>{try{onEvent(JSON.parse(e.data))}catch(err){state.textContent=err.message}};s.peer.ondatachannel=e=>e.channel.onmessage=m=>{try{onEvent(JSON.parse(m.data))}catch(err){state.textContent=err.message}};const offer=await s.peer.createOffer();await s.peer.setLocalDescription(offer);const resp=await fetch('/api/qwen-voice-session',{method:'POST',headers:{'Content-Type':'application/sdp'},body:s.peer.localDescription?.sdp||offer.sdp});if(!resp.ok)throw Error('Qwen: '+resp.status);await s.peer.setRemoteDescription({type:'answer',sdp:await resp.text()})}catch(e){closeLive();throw e}}
$('jStart').onclick=async()=>{if(!$('jNotes').value.trim())return alert('Prepare at least two sentences or questions first.');lines=[];$('jTranscript').innerHTML='';$('jStart').disabled=true;$('jEnd').disabled=false;try{await startLive(false)}catch(e){$('jStatus').textContent=e.message;$('jStart').disabled=false;$('jEnd').disabled=true}};
$('jEnd').onclick=async()=>{closeLive();$('jStart').disabled=false;$('jEnd').disabled=true;const text=lines.filter(x=>x.role==='student').map(x=>x.text).join('\n');if(!text){$('jStatus').textContent='No speech transcript received; feedback cannot be generated.';return}try{showFeedback(await ask('feedback',{transcript:text,scene:'Job interview '+jobs[+$('jJob').value]}),$('jInterviewFeedback'))}catch(e){$('jStatus').textContent=e.message}};
$('jCoachLive').onclick=()=>openKostya();$('jCoachStop').onclick=closeKostya;

/* Optional evidence-based feedback for existing, otherwise unchanged activities. */
['story','reading','watching','writing'].forEach(tab=>{
 const section=$('panel-'+tab);if(!section)return;
 section.querySelectorAll('.recorder').forEach((rec,i)=>{
   const actions=rec.querySelector('.rec-extra')||rec;
   const btn=document.createElement('button');btn.className='tiny';btn.type='button';btn.textContent='✨ AI feedback + Stocks';
   const out=document.createElement('div');out.className='jobs-v3';out.hidden=true;
   btn.onclick=async()=>{
     const transcript=rec.querySelector('textarea.transcript')?.value?.trim()||'';
     if(!transcript){out.hidden=false;out.textContent='Please record or enter your own words before requesting feedback.';return}
     out.hidden=false;out.textContent='Reviewing your speech…';
     try{showFeedback(await ask('feedback',{transcript,scene:'Jobs & Money A2 · '+tab+' · '+(rec.dataset.label||rec.dataset.task||i)}),out)}
     catch(e){out.textContent=e.message}
   };
   actions.append(btn);rec.after(out);
 });
 if(tab==='writing'){
   const area=[...section.querySelectorAll('textarea')].find(x=>!x.classList.contains('transcript'));
   if(area){
     const row=document.createElement('div');row.className='jobs-v3';
     const btn=document.createElement('button');btn.textContent='✨ AI writing feedback + save useful language';btn.className='primary';
     const result=document.createElement('div');
     btn.onclick=async()=>{const transcript=area.value.trim();if(!transcript){result.textContent='Write your application first.';return}result.textContent='Reviewing your own text…';try{showFeedback(await ask('feedback',{transcript,scene:'A2 job application writing task'}),result)}catch(e){result.textContent=e.message}};
     row.append(btn,result);area.after(row);
   }
 }
});

/* Keep live Kostya aware of recent in-page actions without claiming omniscience. */
document.addEventListener('click',()=>{
 const active=live;
 if(active?.coachMode&&active.ready&&active.channel?.readyState==='open'){
  try{active.channel.send(JSON.stringify({type:'session.update',session:{instructions:'You are Kostya, A2 Webilang tutor. CURRENT verified page state: '+JSON.stringify(snapshot()).slice(0,4500)+'. Respond to the student’s latest utterance with one helpful short answer. Never invent actions or hidden data.'}}))}catch(e){}
 }
},false);
})();