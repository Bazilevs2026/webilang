/* Webilang Art Lab — reuse the actual Kostya realtime avatar without replacing the working Art Lab AI chat. */
(() => {
'use strict';
const DEFAULT_AVATAR='/avatar-lab/realtime-english.html?pilot=kostya_teacher';
const oldPane=document.getElementById('kostyaPane');
const oldToggle=window.artShowKostya;
if(!oldPane || document.getElementById('artlabKostyaWindow'))return;

const windowEl=document.createElement('section');
windowEl.id='artlabKostyaWindow';
windowEl.className='artlab-avatar-window artlab-avatar-hidden';
windowEl.setAttribute('role','dialog');
windowEl.setAttribute('aria-label','Kostya AI Teacher');
windowEl.innerHTML=`
 <header class="artlab-avatar-titlebar" id="artlabKostyaDrag">
   <span class="artlab-avatar-title">✦ Kostya · AI Teacher</span>
   <span class="artlab-avatar-buttons">
     <button type="button" id="artlabKostyaMin" title="Minimize Kostya" aria-label="Minimize Kostya">−</button>
     <button type="button" id="artlabKostyaClose" title="Close Kostya" aria-label="Close Kostya">×</button>
   </span>
 </header>
 <nav class="artlab-avatar-tabs" aria-label="Choose Kostya mode">
   <button type="button" id="artlabAvatarTab" class="selected" aria-selected="true">🎙 Talking avatar</button>
   <button type="button" id="artlabTextTab" aria-selected="false">✎ Text chat</button>
 </nav>
 <div id="artlabAvatarBody" class="artlab-avatar-body">
   <div id="artlabAvatarView">
     <iframe id="artlabAvatarFrame" title="Kostya voice avatar" allow="microphone; autoplay" loading="lazy"></iframe>
     <div class="artlab-avatar-toolbar">
       <button type="button" id="artlabAvatarReloadBtn" title="Reload avatar">↻ Reload</button>
     </div>
     <p class="artlab-avatar-status" id="artlabAvatarStatus" aria-live="polite">Press “Talk to Kostya” inside the avatar to start voice. You can also use Text chat if realtime voice is unavailable.</p>
   </div>
   <div id="artlabTextView" hidden></div>
 </div>
 <footer class="artlab-avatar-min-footer" id="artlabKostyaMinFooter" hidden>Tap the title to expand</footer>`;
document.body.append(windowEl);
const frame=document.getElementById('artlabAvatarFrame');
const textContainer=document.getElementById('artlabTextView');
const status=document.getElementById('artlabAvatarStatus');
const avatarBody=document.getElementById('artlabAvatarBody');
const minFooter=document.getElementById('artlabKostyaMinFooter');
let activated=false, isText=false, minimized=false;
// Move the existing, working text-chat implementation into the new window.
oldPane.classList.remove('hide');oldPane.classList.add('artlab-avatar-text-pane');
textContainer.append(oldPane);
const hideWindow=()=>{windowEl.classList.add('artlab-avatar-hidden');windowEl.classList.remove('artlab-avatar-minimized');minimized=false;avatarBody.hidden=false;minFooter.hidden=true};
const showWindow=()=>{windowEl.classList.remove('artlab-avatar-hidden');if(!activated){frame.src=DEFAULT_AVATAR;activated=true;}else sendArtLessonContext();if(minimized)toggleMinimize(false)};
const toggleMinimize=(force)=>{minimized=force===undefined?!minimized:!!force;windowEl.classList.toggle('artlab-avatar-minimized',minimized);avatarBody.hidden=minimized;minFooter.hidden=!minimized;document.getElementById('artlabKostyaMin').textContent=minimized?'+':'−';};
const changeTab=(text)=>{isText=!!text;document.getElementById('artlabAvatarView').hidden=isText;textContainer.hidden=!isText;document.getElementById('artlabAvatarTab').classList.toggle('selected',!isText);document.getElementById('artlabTextTab').classList.toggle('selected',isText);document.getElementById('artlabAvatarTab').setAttribute('aria-selected',String(!isText));document.getElementById('artlabTextTab').setAttribute('aria-selected',String(isText));if(isText)document.getElementById('kostyaQuestion')?.focus();};
window.artShowKostya=function(force){if(force===false){hideWindow();return}if(force===true){showWindow();return}windowEl.classList.contains('artlab-avatar-hidden')?showWindow():hideWindow()};
document.getElementById('artlabKostyaClose').onclick=hideWindow;
document.getElementById('artlabKostyaMin').onclick=()=>toggleMinimize();
document.getElementById('artlabKostyaDrag').addEventListener('dblclick',()=>toggleMinimize());
document.getElementById('artlabAvatarTab').onclick=()=>changeTab(false);
document.getElementById('artlabTextTab').onclick=()=>changeTab(true);
document.getElementById('artlabAvatarReloadBtn').onclick=()=>{frame.src=DEFAULT_AVATAR;status.textContent='Avatar reloaded. Start the voice conversation again.'};

const brief=(s,max=600)=>String(s||'').trim().replace(/\s+/g,' ').slice(0,max);
function collectContext(){
 const panel=document.querySelector('.panel.active')||document.querySelector('.panel:not([hidden])');
 const title=brief(panel?.querySelector('h2')?.textContent||'Art Lab');
 const prompt=brief(panel?.querySelector('.task:not([hidden]) p, .task:not([hidden]) h4, .grammar-task-prompt, .comic-dialogue p, .lead')?.textContent||'',350);
 const answer=brief([...panel?.querySelectorAll('textarea, input[type="text"]')||[]].map(x=>x.value).filter(x=>x&&x.trim()).slice(0,3).join(' / '),600);
 const feedback=brief(panel?.querySelector('.review-section, .quiz-feedback, .grammar-answer-status, .feedback-grammar')?.textContent||'',280);
 const parts=['Art Lab lesson context: '+title,prompt&&'Current task: '+prompt,answer&&'My answer: '+answer,feedback&&'Recent feedback: '+feedback,'Please answer my question about this activity briefly at A2–B1 level. Answer and stop.'];
 return parts.filter(Boolean).join('\n');
}
function sendContext(){
 const message=collectContext();
 // The embedded Webilang avatar is same-origin. We fill the avatar’s existing typed
 // prompt for the learner to review and send; we never submit it without a click.
 try{
  const doc=frame.contentDocument;
  const input=doc?.getElementById('wlKostyaQuestion');
  if(!input)throw new Error('The avatar’s input is not ready.');
  input.value=message+'\n\nMy question: ';
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.focus();
  status.textContent='Your current exercise and answer are copied into Kostya’s message box. Add your question and click “Send to Kostya” inside the avatar. Start voice first.';
 }catch(e){
  changeTab(true);
  const input=document.getElementById('kostyaQuestion');
  if(input)input.value='Please help me with '+brief(document.querySelector('.panel.active h2')?.textContent||'this art lesson',55)+'.';
  status.textContent='Could not reach the embedded voice input. Text chat is available instead.';
 }
}


/* Art Lab → Kostya live lesson context bridge.
   Same-origin postMessage schema already implemented by realtime-english.html.
   Send only student actions and verified checker feedback, never claim screen vision. */
let lastArtCheck=null;
let lastArtExercise=null;
const artLessonSection=()=>document.querySelector('.panel.active')||document.querySelector('.panel:not([hidden])');
const artCurrentTitle=()=>brief(artLessonSection()?.querySelector('h2')?.textContent||'Art Lab',160);
function sendArtLessonContext(){
 if(!activated||!frame.contentWindow)return;
 const panel=artLessonSection();
 const context={
  source:'webilang-lesson',type:'context',version:1,
  activeSection:brief(panel?.id||'art-lab',60),courseLanguage:'English',
  title:artCurrentTitle(),url:location.pathname,
  activeTask:brief(lastArtExercise?.question||panel?.querySelector('.lead')?.textContent||'',850),
  currentExercise:lastArtExercise?{question:lastArtExercise.question,studentAnswer:lastArtExercise.studentAnswer,options:lastArtExercise.options||[],field:lastArtExercise.field||'grammar'}:null,
  lastCheck:lastArtCheck
 };
 frame.contentWindow.postMessage(context,location.origin);
}
function artCheckedResult(container,button){
 let task=container?.querySelector('.stock-six-prompt,.grammar-task-prompt,.quiz-item h4,.practice-frame .prompt,.task h4,.task p')?.textContent||'';
 let answer=container?.querySelector('.stock-six-options .selected,.quiz-options .chosen,.exercise-choices .selected')?.textContent||'';
 if(!answer)answer=container?.querySelector('textarea,input:not([type="hidden"]):not([type="radio"])')?.value||'';
 const feedback=container?.querySelector('.stock-six-feedback,.quiz-feedback,.grammar-answer-status,.practice-item-feedback,.stock-six-voice-status,.learning-feedback')||null;
 let verdict='unknown';
 if(feedback?.classList.contains('correct')||/^(?:✓\s*)?correct\b/i.test(feedback?.textContent||''))verdict='correct';
 else if(feedback?.classList.contains('incorrect')||/^(not quite|not yet|try again)/i.test(feedback?.textContent.trim()||''))verdict='incorrect';
 // Never send a correctness claim until the checker has produced a result.
 const options=[...(container?.querySelectorAll('.stock-six-options button,.quiz-options button,.exercise-choices button')||[])].map(x=>brief(x.textContent,120));
 if(!task)return;
 lastArtExercise={question:brief(task,850),studentAnswer:brief(answer,450),options,field:'Art Lab exercise'};
 lastArtCheck={kind:button.textContent.toLowerCase().includes('feedback')?'ai_review':'answer_check',button:brief(button.textContent,90),task:brief(task,650),studentAnswer:brief(answer,200),expectedAnswer:'',verifiedCorrectness:verdict,visibleFeedbackAfter:feedback?.textContent.trim()?[brief(feedback.textContent,1900)]:[],source:'Art Lab check button',at:Date.now()};
 sendArtLessonContext();
}
function artWatchCheckButton(button){
 const card=button.closest('.stock-six-task,.quiz-item,.task,.oral-feedback,.card,.practice-frame')||button.parentElement;
 if(!card)return;
 const status=card.querySelector('.stock-six-feedback,.quiz-feedback,.grammar-answer-status,.practice-item-feedback,.learning-feedback');
 // Listen for a changed checker response; never treat an old 'Try again' as a new check.
 const initial=status?.textContent||'';
 let sent=false;
 const publish=()=>{
  if(sent)return;
  const txt=(status?.textContent||'').trim();
  if(!txt||txt===initial.trim()||/^(checking|select an answer|choose or enter|now check)/i.test(txt))return;
  sent=true;observer?.disconnect();artCheckedResult(card,button);
 };
 let observer=null;
 if(status){observer=new MutationObserver(publish);
  observer.observe(status,{childList:true,characterData:true,subtree:true,attributes:true});
  setTimeout(()=>observer.disconnect(),12000);
 }
 setTimeout(publish,180);
}
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 const label=button.textContent.trim();
 if(!/^(check answer|check|AI feedback|✓ checked)$/i.test(label))return;
 if(button.closest('#artlabKostyaWindow'))return;
 // These two lessons publish their exact, verified result directly.
 if(button.closest('#grammarExercise,#vocabExercise'))return;
 artWatchCheckButton(button);
},true);
// Authoritative results from the mandatory Grammar and Vocabulary lessons.
// These are generated by the checker itself, not guessed from DOM text.
window.addEventListener('webilang-artlab-answer-checked',event=>{
 const d=event.detail||{};
 if(!d.question || !d.studentAnswer)return;
 const panel=artLessonSection();
 const title=brief(d.topic||artCurrentTitle(),160);
 lastArtExercise={question:brief(d.question,850),studentAnswer:brief(d.studentAnswer,450),
   options:[],field:brief(d.area||'Art Lab',100)};
 lastArtCheck={kind:'answer_check',task:brief(d.question,650),
   studentAnswer:brief(d.studentAnswer,250),expectedAnswer:brief(d.expectedAnswer,250),
   verifiedCorrectness:d.verifiedCorrectness==='correct'?'correct':'incorrect',
   visibleFeedbackAfter:[d.verifiedCorrectness==='correct'?'Correct.': 'Incorrect. '+brief(d.hint,280)],
   section:brief(panel?.id,60),topic:title,stage:brief(d.stage,80),
   source:'verified Art Lab '+brief(d.area,50)+' checker',at:Date.now()};
 sendArtLessonContext();
});
// When the student changes activities, announce the new section without
// inventing a checked answer for it. Earlier results stay clearly labelled.
window.addEventListener('webilang-artlab-activity-reset',()=>{
 lastArtCheck=null;lastArtExercise=null;sendArtLessonContext();
});

// The parent already knows the exact checked result; sharing it doesn't trigger speech.
frame.addEventListener('load',()=>{setTimeout(sendArtLessonContext,250)});
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
 if(event.data?.source==='webilang-realtime-english'&&event.data.type==='lesson-context-ack'){
  status.textContent=event.data.connected?'✓ Kostya is aware of your latest checked exercise. Ask him about it.':'✓ Exercise context received. Start Talk to Kostya for voice assistance.';
 }
});
// The learner never needs to update Kostya manually.
// His voice session receives automatic, silent updates on every check.

// Desktop drag; touch devices keep the window pinned so controls remain on-screen.
const handle=document.getElementById('artlabKostyaDrag');
let drag=null;
handle.addEventListener('pointerdown',e=>{
 if(e.button!==0||e.target.closest('button')||window.matchMedia('(max-width:700px)').matches)return;
 const rect=windowEl.getBoundingClientRect();drag={startX:e.clientX,startY:e.clientY,left:rect.left,top:rect.top};handle.setPointerCapture(e.pointerId);e.preventDefault();
});
handle.addEventListener('pointermove',e=>{
 if(!drag)return;
 const left=Math.min(Math.max(8,drag.left+e.clientX-drag.startX),Math.max(8,innerWidth-windowEl.offsetWidth-8));
 const top=Math.min(Math.max(8,drag.top+e.clientY-drag.startY),Math.max(8,innerHeight-60));
 windowEl.style.left=left+'px';windowEl.style.top=top+'px';windowEl.style.right='auto';windowEl.style.bottom='auto';
});
handle.addEventListener('pointerup',()=>drag=null);
handle.addEventListener('pointercancel',()=>drag=null);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!windowEl.classList.contains('artlab-avatar-hidden'))hideWindow()});
changeTab(false);
})();
