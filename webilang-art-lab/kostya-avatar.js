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
       <button type="button" id="artlabAvatarContextBtn">↗ Prepare current exercise</button>
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
const showWindow=()=>{windowEl.classList.remove('artlab-avatar-hidden');if(!activated){frame.src=DEFAULT_AVATAR;activated=true;}if(minimized)toggleMinimize(false)};
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
document.getElementById('artlabAvatarContextBtn').onclick=sendContext;

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
