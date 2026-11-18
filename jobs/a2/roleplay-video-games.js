(()=>{'use strict';
const $=id=>document.getElementById(id),root=$('jobsVideoRoleplays');if(!root)return;
const work=$('jvrWorkspace'),cards=$('jvrCards'),avatar=$('jAvatar'),live=$('jvrLive');
if(!work||!cards||!avatar||!live)return;
const style=document.createElement('style');
style.textContent='#jobsVideoRoleplays [hidden]{display:none!important}#jobsVideoRoleplays .jvr-cover.applicant{background:linear-gradient(0deg,#142a3dcc,transparent 85%),url("/avatar-lab/backgrounds/family-home.jpg") center/cover!important}#jobsVideoRoleplays .jvr-cover.employer{background:linear-gradient(0deg,#142a3dcc,transparent 85%),url("/avatar-lab/backgrounds/game-studio.jpg") center/cover!important}#jobsVideoRoleplays .jvr-portrait{display:none!important}#jobsVideoRoleplays .jvr-cover{align-items:flex-end;justify-content:flex-start;padding:18px}#jobsVideoRoleplays .jvr-cover span{color:white;font-size:17px;text-shadow:0 1px 5px #0009}#jobsVideoRoleplays .jvr-start{background:#e9f1ff;color:#235d9c;border:1px solid #d1e2fa}#jobsVideoRoleplays .jvr-prep>summary{padding:18px;border-radius:12px;background:#f1eafb;color:#67488d}#jobsVideoRoleplays .jvr-prep>summary span{display:block;margin-top:5px}#jobsVideoRoleplays #jvrLive{display:none!important}#jobsVideoRoleplays #jvrScreen{padding:16px;border:2px solid #a2c6ea;background:#f7fbff;border-radius:18px;margin:12px 0 24px;scroll-margin-top:105px}#jobsVideoRoleplays #jvrScreen[hidden]{display:none!important}#jobsVideoRoleplays .jvs-top{background:#f4f9ff;border:1px solid #d6e5f4;border-radius:14px;padding:15px;display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap}#jobsVideoRoleplays .jvs-top h2{margin:0;font-size:23px;color:#2d4b64}#jobsVideoRoleplays .jvs-top p{margin:5px 0 0;font-size:12px;color:#728699}#jobsVideoRoleplays .jvs-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}#jobsVideoRoleplays .jvs-toolbar button{font-size:13px;font-weight:850;padding:10px;border:1px solid #9cbadb;border-radius:10px;background:white;color:#265d92}#jobsVideoRoleplays .jvs-toolbar .end{background:#b52e42;color:#fff;border-color:#b52e42}#jobsVideoRoleplays .jvs-clock{font-size:22px;font-weight:900;background:white;padding:7px 12px;border-radius:11px}#jobsVideoRoleplays .jvs-mission{background:#e8f4fd;border:1px solid #d2e6f8;border-radius:12px;padding:13px 16px;margin:13px 0;line-height:1.6;font-size:13px;color:#385975}#jobsVideoRoleplays .jvs-mission b{display:block;font-size:16px}#jobsVideoRoleplays .jvs-main{display:grid;grid-template-columns:minmax(0,3fr) minmax(235px,.9fr);gap:13px}#jobsVideoRoleplays .jvs-stage{position:relative;height:clamp(380px,55vw,590px);min-height:300px;overflow:hidden;background:#e5eee9;border-radius:16px}#jobsVideoRoleplays #jvsAvatar{height:100%;width:100%}#jobsVideoRoleplays #jvsAvatar iframe{display:block;width:100%!important;height:100%!important;border:0!important;border-radius:0!important}#jobsVideoRoleplays .jvs-name{position:absolute;bottom:14px;left:14px;background:#132c3cc9;color:white;border-radius:9px;padding:8px 12px;font-weight:800;font-size:13px;pointer-events:none}#jobsVideoRoleplays .jvs-aside{background:#f6faff;border:1px solid #d7e6f4;border-radius:14px;padding:15px}#jobsVideoRoleplays .jvs-aside h3{font-size:16px;margin:0 0 12px}#jobsVideoRoleplays .jvs-aside ul{padding-left:20px;margin:0}#jobsVideoRoleplays .jvs-aside li{font-size:13px;line-height:1.55;margin-bottom:10px;overflow-wrap:anywhere}#jobsVideoRoleplays .jvs-aside p{font-size:12px;color:#6d8090}#jobsVideoRoleplays .jvs-aside button{border:1px solid #c5d8e9;border-radius:9px;padding:9px;background:white}#jobsVideoRoleplays .jvs-status{display:flex;align-items:center;gap:10px;margin:12px 0;padding:11px;border-radius:12px;background:#fff;border:1px solid #d5e4f1;font-size:13px}#jobsVideoRoleplays .jvs-status b{color:#496982}#jobsVideoRoleplays .jvs-status .turns{margin-left:auto}#jobsVideoRoleplays .jvs-controls{display:flex;flex-wrap:wrap;gap:9px;justify-content:center;margin:13px 0}#jobsVideoRoleplays .jvs-controls button{border-radius:10px;border:1px solid #c6d8e9;background:white;padding:11px 15px;font-weight:800;font-size:14px}#jobsVideoRoleplays .jvs-controls #jvrBegin{background:#2d68a7;color:white;border-color:#2d68a7}#jobsVideoRoleplays .jvs-controls #jvrFinish{background:#b72f42;color:white;border-color:#b72f42}#jobsVideoRoleplays .jvs-controls button:disabled{opacity:.5}#jobsVideoRoleplays .jvs-transcript{border:1px solid #dae7f2;background:white;border-radius:13px;padding:13px}#jobsVideoRoleplays .jvs-transcript summary{cursor:pointer;font-weight:800;font-size:14px}#jobsVideoRoleplays .jvs-feedback{margin:12px 0}#jobsVideoRoleplays .jvs-prep-btn{display:block;width:100%;padding:14px;border-radius:11px;font-size:15px;font-weight:850;cursor:pointer;margin:10px 0}#jobsVideoRoleplays #jvsPrepVoice{background:#e7f0ff;border:1px solid #ccddf6;color:#225b97}#jobsVideoRoleplays #jvsPrepVideo{background:#6c43c0;border:0;color:white}@media(max-width:850px){#jobsVideoRoleplays .jvs-main{grid-template-columns:1fr}#jobsVideoRoleplays .jvs-stage{height:390px}#jobsVideoRoleplays .jvs-toolbar button{flex:1}}';
document.head.append(style);
const screen=document.createElement('section');screen.id='jvrScreen';screen.hidden=true;
screen.innerHTML='<div class="jvs-top"><div><h2 id="jvsTitle">Nova · Job Interview</h2><p>AI avatar · A2 English · Microphone only · No student camera</p></div><div class="jvs-toolbar"><span id="jvsConnection">🔴 Ready</span><span class="jvs-clock" id="jvsClock">05:00</span><button id="jvsReturn">← Return to Roleplay</button><button class="end" id="jvsEnd">☎ End Interview & Get Feedback</button><button id="jvsReset">↺ Reset</button></div></div><div class="jvs-mission"><b>💼 Your interview mission</b><span id="jvsMission"></span></div><div class="jvs-main"><div class="jvs-stage"><div id="jvsAvatar"></div><div class="jvs-name" id="jvsName"></div></div><aside class="jvs-aside"><h3 id="jvsNoteTitle">My talking points</h3><ul id="jvsNotes"></ul><p>Your own notes stay here. You can improvise.</p><button id="jvsEdit">Edit my notes</button></aside></div><div class="jvs-status"><span>🔴</span><b id="jvsState">Ready to start.</b><span class="turns" id="jvsTurns">0 / 15 turns</span></div><div class="jvs-controls" id="jvsControls"></div><details class="jvs-transcript"><summary>💬 Transcript and optional typed reply</summary><div id="jvsTranscript"></div></details><div class="jvs-feedback" id="jvsFeedback"></div>';
work.after(screen);
$('jvsAvatar').append(avatar);
$('jvsControls').append($('jvrBegin'),$('jvrFinish'),$('jvrHint'));
$('jvsTranscript').append($('jvrChat'),work.querySelector('.jvr-fallback'));
$('jvsFeedback').append($('jvrFeedback'));
function configurePortrait(){
try{
 const d=avatar.contentDocument;if(!d)return;
 let st=d.getElementById('jvsPortraitOnly');
 if(!st){st=d.createElement('style');st.id='jvsPortraitOnly';d.head.append(st)}
 st.textContent='html,body{width:100%!important;height:100%!important;margin:0!important;overflow:hidden!important;background:#e5eee9!important}.wrap{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;padding:0!important;margin:0!important;overflow:hidden!important}.wrap>header,.wrap>h1,.wrap>p,.wrap>footer{display:none!important}.layout{position:absolute!important;inset:0!important;display:block!important;margin:0!important;padding:0!important;width:100%!important;height:100%!important}.layout>.panel{position:absolute!important;left:-5000px!important;top:0!important;visibility:hidden!important}.layout>.stage{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;min-height:0!important;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;background:#e5eee9!important}.stageTag{display:none!important}#scene{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}';
 const sel=d.getElementById('modelMode');
 const want=($('jvrRoleLabel')?.textContent||'').toLowerCase().includes('you hire')?'chaz':'nova';
 if(sel&&sel.value!==want){sel.value=want;sel.dispatchEvent(new Event('change',{bubbles:true}))}
 const camera=d.getElementById('cameraMode');if(camera&&camera.value!=='close'){camera.value='close';camera.dispatchEvent(new Event('change',{bubbles:true}))}
 // Use the same realistic settings as the Video Games roleplays:
 // Nova interviews from a welcoming office/home environment, Chaz applies from a game studio.
 // The selected JOB PHOTO belongs to the job cards; do not paste a rover, vault or ice cream
 // directly behind a speaking person's face.
 const stage=d.querySelector('.layout>.stage');
 const scene=d.getElementById('scene');
 const isHiring=want==='chaz';
 const background=isHiring?'/avatar-lab/backgrounds/game-studio.jpg':'/avatar-lab/backgrounds/family-home.jpg';
 if(stage){
   stage.style.setProperty('background-image','url("'+background+'")','important');
   stage.style.setProperty('background-size','cover','important');
   stage.style.setProperty('background-position','center center','important');
   stage.style.setProperty('background-repeat','no-repeat','important');
 }
 if(scene){scene.style.setProperty('background','transparent','important')}
 // Keep head and shoulders in the frame and let the existing avatar idle animation run.
 // Neither the cloned teacher voice nor any generic Avatar Lab UI is used here.
}catch(e){}
}
avatar.addEventListener('load',()=>{configurePortrait();setTimeout(configurePortrait,400)});
function refresh(){
const employer=($('jvrRoleLabel')?.textContent||'').toLowerCase().includes('you hire');
const name=employer?'Chaz':'Nova',job=$('jJob').selectedOptions[0]?.textContent||'Job';
$('jvsTitle').textContent=name+' · '+job;$('jvsName').textContent=name+' · '+(employer?'Job applicant':'Hiring manager');
$('jvsMission').textContent=employer?'Ask at least three of your questions, listen carefully, follow up and make a hiring decision.':'Describe two relevant skills, answer Nova’s questions and ask one question about the job.';
$('jvsNoteTitle').textContent=employer?'📝 My questions':'📝 My answer ideas';
const rows=[...$('jvrFields').querySelectorAll('textarea')].map(x=>x.value.trim()).filter(Boolean);
$('jvsNotes').replaceChildren();(rows.length?rows:['No notes yet. You can improvise.']).forEach(t=>{const li=document.createElement('li');li.textContent=t;$('jvsNotes').append(li)});
configurePortrait();
}
function showScreen(start){
$('jvrSave').click();refresh();screen.hidden=false;work.hidden=true;cards.hidden=true;screen.scrollIntoView({behavior:'smooth',block:'start'});
if(start){$('jvsState').textContent='Connecting to Qwen…';$('jvrBegin').click();}
}
/* One interview launch button is rendered inside each job card. */
$('jvsReturn').onclick=()=>{if($('jvrBegin').disabled){$('jvsState').textContent='End the conversation before returning.';return}screen.hidden=true;work.hidden=false;work.scrollIntoView({behavior:'smooth',block:'start'})};
$('jvsEnd').onclick=()=>{if(!$('jvrFinish').disabled){$('jvrFinish').click();screen.querySelector('.jvs-transcript').open=true}else{$('jvsState').textContent='Start the interview first.'}};
$('jvsReset').onclick=()=>{if(!$('jvrFinish').disabled)$('jvrFinish').click();screen.hidden=true;work.hidden=true;cards.hidden=false;$('jvrReset').click();cards.scrollIntoView({behavior:'smooth',block:'start'})};
$('jvsEdit').onclick=()=>$('jvsReturn').click();

/* Card-based preparation exactly following Video Games: keep both scenarios
   on the chooser, with their own job choices, collapsible preparation, AI check,
   save notes, and two functional interview-start buttons. */
const JOB_COVER_IMAGES=[
 {title:'NASA Curiosity Driver',image:'/jobs/a2/assets/job-nasa.jpg'},
 {title:'Professional Criminal',image:'/jobs/a2/assets/job-criminal.jpg'},
 {title:'Island Caretaker',image:'/jobs/a2/assets/job-island.jpg'},
 {title:'Ice Cream Taster',image:'/jobs/a2/assets/job-icecream.jpg'}
];
const ORIGINAL_DESCRIPTIONS=window.JOBS_A2_ORIGINAL_JOBS||[];
// Distinct two-photo hero covers for the two Video Games-style interview scenarios.
const COVER_GROUPS=[[0,2],[1,3]];
const imageSafe=t=>String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jobPhoto=(index)=>JOB_COVER_IMAGES[index]?.image||'';
const originals=window.JOBS_A2_ORIGINAL_JOBS||[];
const jobs=originals.length===4?originals.map(j=>j.title):['NASA Curiosity Driver','Professional Criminal','Island Caretaker','Ice Cream Taster'];
const descriptions=[
'Explore Mars using cameras, computers and a robotic arm.',
'Test security legally and explain weaknesses to a company.',
'Look after a tropical island, photograph nature and write reports.',
'Taste new ice cream flavours and describe quality.'
];
const ideaBanks=[
'planning carefully · controlling robots · computer skills · teamwork',
'honesty · noticing details · solving problems · reporting clearly',
'working outdoors · nature · photography · writing online',
'describing flavours · trying new foods · good communication · attention to detail'
];
const cardsArray=[...cards.querySelectorAll('.jvr-card')];
const forms={};
cardsArray.forEach((card,i)=>{
 const applicant=i===0,key=applicant?'applicant':'employer';
 const hero=card.querySelector('.jvr-cover');
 if(hero){
   const visuals=document.createElement('div');visuals.className='jvs-dual-cover';visuals.setAttribute('aria-label','Two example jobs for this interview');
   for(const idx of COVER_GROUPS[i]){
     const tile=document.createElement('div');tile.className='jvs-dual-tile';
     const img=document.createElement('img');img.src=jobPhoto(idx);img.alt=JOB_COVER_IMAGES[idx].title;img.loading='lazy';
     const caption=document.createElement('small');caption.textContent=JOB_COVER_IMAGES[idx].title;
     tile.append(img,caption);visuals.append(tile);
   }
   hero.prepend(visuals);hero.style.setProperty('background-image','none','important');
 }
 const oldStart=card.querySelector('.jvr-start');oldStart.hidden=true;
 const body=card.querySelector('.jvr-card-body');
 const holder=document.createElement('div');holder.className='jvs-card-form';
const imagePreview=document.createElement('div');imagePreview.className='jvs-original-job-preview';
    const portrait=document.createElement('iframe');
   portrait.className='jvs-character-preview';
   portrait.title=applicant?'Nova · Hiring Manager':'Chaz · Job Candidate';
   portrait.src='/avatar-lab/realtime-english.html?pilot='+(applicant?'job':'creator')+'&cover=1';
   portrait.loading='lazy';portrait.tabIndex=-1;portrait.setAttribute('aria-hidden','true');
   portrait.addEventListener('load',()=>{
     try{const d=portrait.contentDocument;if(!d)return;const st=d.createElement('style');
     st.textContent='html,body,.wrap,.layout{width:100%!important;height:100%!important;margin:0!important;padding:0!important;max-width:none!important;overflow:hidden!important;background:transparent!important}.wrap{position:absolute!important;inset:0!important}.layout{position:absolute!important;inset:0!important;display:block!important}.layout>.panel,.stageTag,header,h1,footer{display:none!important}.layout>.stage{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-height:0!important;border-radius:0!important;overflow:hidden!important}#scene,#scene canvas{width:100%!important;height:100%!important}';d.head.append(st);
     const cam=d.getElementById('cameraMode');if(cam){cam.value='close';cam.dispatchEvent(new Event('change',{bubbles:true}))}
     }catch(e){console.warn('Portrait cover setup unavailable',e)}
   });

 imagePreview.append(portrait);
 holder.innerHTML='<label class="jvs-job-label">Choose your curious job<select data-job-select>'+
 jobs.map((j,k)=>'<option value="'+k+'">'+j+'</option>').join('')+'</select></label>'+
 '<details class="jvs-prep-accordion"><summary><b>🧩 '+(applicant?'Prepare for my job interview':'Prepare my questions')+'</b><small>'+(applicant?'Choose ideas · Practise English · Check with AI':'Write your own questions · Check with AI · Save for interview')+'</small></summary>'+
 '<div class="jvs-prep-inside"><h3>'+(applicant?'🎯 Get ready: Convince Nova':'🎯 Get ready: Ask YOUR questions')+'</h3><p>'+(applicant?'You are the applicant. Prepare useful ideas, not a speech to memorise.':'You are the employer. You decide which skills matter and ask original questions.')+'</p>'+
 '<div class="jvs-prep-stages"><span>1 · Think of ideas</span><span>2 · Check English</span><span>3 · Interview</span></div>'+
 '<div class="jvs-idea-bank">💡 <b>Ideas, not ready-made answers:</b> <span data-ideas></span></div>'+
 '<p class="jvs-toolbox">'+(applicant?'I am good at… · I can… · I have experience… · I would like…':'What…? · Why…? · How…? · Can you…? · Have you ever…?')+'</p>'+
 '<div class="jvs-prep-fields">'+(applicant?['My strength 1','My strength 2','My experience','Why I want this job','My question for Nova']:['My question 1','My question 2','My question 3','Optional question 4','Optional question 5']).map((label,n)=>'<label>'+label+'<textarea data-note="'+n+'" placeholder="'+(applicant?['I am good at…','I can…','I have experience with…','I want this job because…','Could you tell me about…?'][n]:['Why do you want this job?','Can you…?','What would you do if…?','What is your greatest skill?','Something unexpected…'][n])+'"></textarea></label>').join('')+'</div>'+
 '<div class="jvs-prepare-actions"><button data-check>✨ Check my English with AI</button><button data-save>✓ Save my interview notes</button></div><div data-prep-status aria-live="polite"></div><div data-feedback></div><p class="jvs-prep-small">Your original ideas stay yours. The avatar can ask unexpected questions.</p></div></details>'+
 '<button data-start-voice class="jvs-card-voice">🎙 Start Voice Interview →</button><p class="jvs-caption">Speak at your own pace. No student video.</p>'+
 '<button data-start-video class="jvs-card-video">🎥 Start Live Avatar Interview →</button><p class="jvs-caption">Large live 3D character · up to five minutes.</p>';
 body.append(holder);const selection=holder.querySelector('.jvs-job-label');selection.after(imagePreview);forms[key]=holder;
 const intro=body.querySelector('p');
 const jobSelect=holder.querySelector('[data-job-select]');
 const updateIdeas=()=>{
 const idx=Number(jobSelect.value),item=originals[idx]||ORIGINAL_DESCRIPTIONS[idx];
 holder.querySelector('[data-ideas]').textContent=ideaBanks[idx];
 let p=imagePreview.querySelector('p');
 if(!p){p=document.createElement('p');imagePreview.append(p)}
 p.textContent=item?.description||descriptions[idx]||'';
 const job=jobs[idx];
 intro.textContent=applicant
   ? 'You are applying for the '+job+' position. Nova is the hiring manager. Tell her what you can do, give examples of your skills and experience, and convince her to hire you.'
   : 'You are recruiting a '+job+'. Chaz is the candidate. Ask him about his skills and experience, listen to his answers, then decide whether to offer him the job and explain why.';
 // The two hero-cover images stay fixed by scenario. Only this job preview changes.
};
 jobSelect.onchange=updateIdeas;updateIdeas();
 const getNotes=()=>[...holder.querySelectorAll('textarea[data-note]')].map(x=>x.value.trim());
 const fillWorkspace=()=>{
    oldStart.click();$('jvrJobs').querySelector('[data-job="'+jobSelect.value+'"]')?.click();
    [...$('jvrFields').querySelectorAll('textarea')].forEach((input,n)=>input.value=getNotes()[n]||'');
    $('jvrSave').click();
 };
 const status=holder.querySelector('[data-prep-status]');
 holder.querySelector('[data-save]').onclick=()=>{const arr=getNotes();if(!arr.some(Boolean)){status.textContent='Write at least one question or answer first.';return}fillWorkspace();status.textContent='✓ Saved for your interview.';work.hidden=true;cards.hidden=false};
 holder.querySelector('[data-check]').onclick=async()=>{
   const arr=getNotes().filter(Boolean);
   if(!arr.length){status.textContent='Write your own ideas first.';return}
   status.textContent='Checking grammar and clarity…';
   try{const response=await fetch('/api/jobs-a2-coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'feedback',scene:(applicant?'Applicant preparation':'Employer interview questions')+' · '+jobs[Number(jobSelect.value)],transcript:arr.join('\n')})});const f=await response.json();if(!response.ok)throw Error(f.error||'AI feedback unavailable');
     const out=holder.querySelector('[data-feedback]');out.replaceChildren();
     const title=document.createElement('b');title.textContent='AI language feedback';out.append(title);
     for(const [label,value] of [['Interaction',f.interaction],['Grammar',f.grammar],['Vocabulary',f.vocabulary],['Next step',f.nextStep]]){if(!value)continue;const p=document.createElement('p');p.textContent=label+': '+value;out.append(p)}
     status.textContent='Review the suggestions; your writing has not been overwritten.';
   }catch(e){status.textContent=e.message}
 };
 const launch=()=>{
  const entries=getNotes();/* Preparation is recommended, not compulsory. */
  fillWorkspace();showScreen(true);
 };
 const voiceButton=holder.querySelector('[data-start-voice]');voiceButton?.nextElementSibling?.remove();voiceButton?.remove();
 holder.querySelector('[data-start-video]').onclick=launch;
});
const moreStyle=document.createElement('style');moreStyle.textContent='#jobsVideoRoleplays .jvr-card-body>.jvr-start[hidden]{display:none!important}#jobsVideoRoleplays .jvs-job-label{font-size:13px;font-weight:850;display:block;margin:15px 0 10px}#jobsVideoRoleplays .jvs-job-label select{width:100%;padding:12px;margin-top:7px;border-radius:10px;border:1px solid #c5d6e8;background:#f0f5ff;font:inherit;box-sizing:border-box}#jobsVideoRoleplays .jvs-prep-accordion{background:#f1eafb;border-radius:15px;margin:16px 0;padding:0;border:1px solid #e7dafa}#jobsVideoRoleplays .jvs-prep-accordion summary{cursor:pointer;list-style:none;padding:17px;display:block;color:#5b428b}#jobsVideoRoleplays .jvs-prep-accordion summary small{display:block;margin-top:4px;color:#716489;font-size:12px}#jobsVideoRoleplays .jvs-prep-inside{padding:16px;background:#fff;line-height:1.55;border-radius:0 0 14px 14px}#jobsVideoRoleplays .jvs-prep-inside h3{font-size:17px}#jobsVideoRoleplays .jvs-prep-inside p{font-size:13px;color:#536779;min-height:0}#jobsVideoRoleplays .jvs-prep-stages{display:flex;gap:5px;flex-wrap:wrap;margin:12px 0}#jobsVideoRoleplays .jvs-prep-stages span{font-size:11px;padding:7px;border-radius:9px;background:#e6f1ff;color:#35648e;font-weight:800}#jobsVideoRoleplays .jvs-prep-stages span:nth-child(2){background:#efe5ff;color:#67418d}#jobsVideoRoleplays .jvs-prep-stages span:nth-child(3){background:#e6f7eb;color:#2c7446}#jobsVideoRoleplays .jvs-idea-bank{background:#fff6e0;border:1px solid #f1d38c;padding:12px;border-radius:12px;font-size:13px}#jobsVideoRoleplays .jvs-toolbox{font-size:12px!important}#jobsVideoRoleplays .jvs-prep-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#jobsVideoRoleplays .jvs-prep-fields label{font-size:12px;font-weight:850}#jobsVideoRoleplays .jvs-prep-fields textarea{width:100%;height:64px;resize:vertical;box-sizing:border-box;border:1px solid #bed1e2;border-radius:9px;padding:9px;font:inherit;margin-top:5px}#jobsVideoRoleplays .jvs-prepare-actions{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}#jobsVideoRoleplays .jvs-prepare-actions button{border:1px solid #bccee0;border-radius:9px;background:#fff;padding:9px;color:#455981;font-weight:800;cursor:pointer}#jobsVideoRoleplays .jvs-prepare-actions button:first-child{background:#eae2fd;color:#5e408c}#jobsVideoRoleplays .jvs-prep-small{font-size:11px!important}#jobsVideoRoleplays .jvs-card-voice,#jobsVideoRoleplays .jvs-card-video{width:100%;display:block;border-radius:11px;padding:14px;font-size:14px;font-weight:850;cursor:pointer}#jobsVideoRoleplays .jvs-card-voice{background:#e8f1ff;border:1px solid #cddff6;color:#225b99;margin-top:12px}#jobsVideoRoleplays .jvs-card-video{background:#6745bd;color:white;border:0;margin-top:16px}#jobsVideoRoleplays .jvs-caption{text-align:center;font-size:12px!important;color:#60778c;min-height:0!important;margin:7px 0 12px!important}@media(max-width:570px){#jobsVideoRoleplays .jvs-prep-fields{grid-template-columns:1fr}}';document.head.append(moreStyle);

const coversStyle=document.createElement('style');
coversStyle.textContent='#jobsVideoRoleplays .jvr-cover.applicant,#jobsVideoRoleplays .jvr-cover.employer{background-image:none!important;background:#1b3040!important;position:relative;overflow:hidden;isolation:isolate}#jobsVideoRoleplays .jvs-dual-cover{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;z-index:0;pointer-events:none}#jobsVideoRoleplays .jvs-dual-tile{position:relative;overflow:hidden;min-width:0}#jobsVideoRoleplays .jvs-dual-tile img{display:block;width:100%;height:100%;object-fit:cover;object-position:center;filter:brightness(.82)}#jobsVideoRoleplays .jvs-dual-tile:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(8,24,36,.57),transparent 72%);pointer-events:none}#jobsVideoRoleplays .jvs-dual-tile small{position:absolute;bottom:13px;left:10px;z-index:1;color:#fff;font-size:11px;font-weight:700;text-shadow:0 1px 4px #000b}#jobsVideoRoleplays .jvr-cover>span{position:relative;z-index:2;margin-bottom:27px;background:#132e40b0;padding:6px 10px;border-radius:9px}#jobsVideoRoleplays .jvs-original-job-preview{grid-template-columns:150px minmax(0,1fr)!important;align-items:center!important}#jobsVideoRoleplays .jvs-character-preview{display:block;width:150px;height:145px;border:0;border-radius:9px;background:#d7e3df;pointer-events:none}#jobsVideoRoleplays .jvs-original-job-preview p{align-self:center}@media(max-width:600px){#jobsVideoRoleplays .jvs-original-job-preview{grid-template-columns:120px minmax(0,1fr)!important}#jobsVideoRoleplays .jvs-character-preview{width:120px;height:130px}}';
document.head.append(coversStyle);
const fixStyle=document.createElement('style');
fixStyle.textContent='#jobsVideoRoleplays .jvs-original-job-preview{display:grid;grid-template-columns:130px 1fr;gap:10px;align-items:start;padding:10px;background:#f7fafc;border:1px solid #dce7ef;border-radius:12px;margin:10px 0}#jobsVideoRoleplays .jvs-original-job-preview img{display:block;width:130px;height:110px;object-fit:cover;border-radius:9px}#jobsVideoRoleplays .jvs-original-job-preview p{font-size:12px!important;line-height:1.55;margin:0!important;color:#4b6478;min-height:0!important}#jobsVideoRoleplays .jvs-card-voice,#jobsVideoRoleplays #jvsPrepVoice,#jobsVideoRoleplays #jvsPrepVideo{display:none!important}@media(max-width:600px){#jobsVideoRoleplays .jvs-original-job-preview{grid-template-columns:1fr}#jobsVideoRoleplays .jvs-original-job-preview img{width:100%;height:160px}}';document.head.append(fixStyle);
document.querySelector('.audio-dock')?.remove();
/* Keep playback functions available for exercises; only remove the obsolete fixed toolbar. */
const mirror=()=>{$('jvsState').textContent=$('jvrStatus').textContent||'Ready.';$('jvsClock').textContent=$('jvrClock').textContent||'05:00';$('jvsTurns').textContent=$('jvrTurns').textContent||'0 / 15 turns';$('jvsConnection').textContent=$('jvrBegin').disabled?'🟢 In progress':'🔴 Ready'};
['jvrStatus','jvrClock','jvrTurns'].forEach(id=>new MutationObserver(mirror).observe($(id),{childList:true,subtree:true,characterData:true}));mirror();configurePortrait();
})();