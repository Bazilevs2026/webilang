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

/* Compact single-row navigation: preserve the original panel IDs and click handlers. */
const navOrder=[
 ['story','📖 Story'],['reading','📖 Reading'],['vocab','🧠 Vocab'],
 ['grammar','🧩 Grammar'],['watching','▶ Watching'],['roleplays','🎭 Roleplays'],
 ['opinion','🎡 Speaking'],['writing','✍ Writing'],['mywords','📚 My Words'],
 ['mygrammar','🧩 My Grammar'],['career','🎮 Game']
];
navOrder.forEach(([tab,label])=>{
 const button=nav.querySelector('[data-tab="'+tab+'"]');
 if(button){button.textContent=label;nav.appendChild(button)}
});
const navStyle=document.createElement('style');
navStyle.textContent='header nav{max-width:1600px;width:100%;box-sizing:border-box;display:flex;flex-wrap:nowrap;gap:clamp(3px,.45vw,7px);justify-content:space-between;overflow-x:auto;scrollbar-width:thin;padding:0 clamp(10px,1.4vw,20px) 9px}header nav .tab{flex:0 0 auto;white-space:nowrap;padding:9px clamp(6px,.72vw,11px);font-size:clamp(11px,.87vw,14px);line-height:1.2;border-radius:10px}@media(min-width:1100px){header nav .tab{flex:0 1 auto;min-width:0}}@media(max-width:1099px){header nav{justify-content:flex-start;overflow-x:auto}header nav .tab{font-size:13px;padding:9px 10px}}';
document.head.append(navStyle);

const speaking=$('panel-opinion');
/* Capture authentic speaking-card content before replacing the old roulette view. */
window.JOBS_A2_ORIGINAL_JOBS=[...speaking.querySelectorAll('.dream-card')].map(card=>{
 const image=card.querySelector('img.dream-photo');
 const heading=card.querySelector('h3')?.textContent?.trim()||'';
 const sourceText=[...card.querySelectorAll('p')].map(p=>p.textContent.trim()).find(t=>t.length>65)||'';
 return {title:heading,description:sourceText,image:image?.getAttribute('src')||''};
}).filter(j=>j.title&&j.image);
speaking.replaceChildren();

const rouletteNames=['Tools','History','Tester','Mosquitoes','Freedom','Boss','Workplace','Pay'];
const rouletteColors=['#f97373','#fbad55','#f5cf5a','#74c99a','#4fc8ca','#74acf1','#9e92e9','#e493c9'];
const wheelSegments=rouletteColors.map((color,i)=>color+' '+(i*45)+'deg '+((i+1)*45)+'deg').join(', ');
speaking.innerHTML='<div class="section-head"><span class="tag">SPEAKING · A2</span><h2>Jobs Roulette · Spin & Speak</h2><p>Spin the wheel, prepare for 20 seconds and speak for 45 seconds. Eight original speaking challenges.</p></div>'+
'<div class="jobs-v3 jroulette-layout">'+
'<div class="jroulette-side"><div class="jroulette-frame"><div class="jroulette-arrow" aria-hidden="true"></div><div class="jroulette-wheel" id="jWheel" role="img" aria-label="Colourful eight-part speaking challenge wheel" style="background:conic-gradient('+wheelSegments+')">'+
rouletteNames.map((name,i)=>'<span class="jroulette-label" style="--sector:'+i+';--counter:'+(22.5+i*45)+'deg">'+escape(name)+'</span>').join('')+
'</div><button type="button" id="jSpin" class="jroulette-hub" aria-label="Spin the roulette wheel">SPIN</button></div>'+
'<div class="jroulette-progress"><span>🎡 Spin the wheel</span><strong id="jCount">0 / 8</strong></div><p class="jroulette-help">All 8 challenges appear once before a new round.</p></div>'+
'<div class="jroulette-activity"><div id="jQuestion" class="jprompt" aria-live="polite">Spin for a challenge.</div><div class="jrow"><button id="jShowHint">💡 One hint</button></div><div class="jhelp" id="jHint" hidden></div>'+
'<p class="jroulette-instruction">How to answer: 2–4 short sentences. Use your own words.</p><div id="jTimer" class="jroulette-clock" aria-live="off">00:45</div>'+
'<div class="jroulette-controls"><button id="jRecord" class="jroulette-record">🎙 Record Answer</button><button id="jPause" disabled>Ⅱ Pause</button><button id="jFinish" disabled>■ Finish</button><button id="jRestart">↺ Restart</button></div>'+
'<div id="jRecordStatus" class="jroulette-status" role="status" aria-live="polite">Spin the wheel, then select Record Answer.</div>'+
'<label for="jAnswer" class="jroulette-transcript-label">YOUR SPEECH · TRANSCRIPT</label><textarea id="jAnswer" placeholder="Recognized words will appear here as you speak. You can edit the transcript before checking."></textarea>'+
'<button id="jFeedback" class="jroulette-check">✦ Check My Speech</button><div class="jroulette-caption">Live transcription uses browser speech recognition when supported. You can correct the transcript before AI feedback.</div><div id="jResult"></div></div></div>';
const rouletteStyle=document.createElement('style');
rouletteStyle.textContent=`
#panel-opinion .jroulette-layout{display:grid;grid-template-columns:minmax(285px,340px) minmax(0,1fr);align-items:center;gap:24px;padding:24px}
#panel-opinion .jroulette-side{display:flex;flex-direction:column;align-items:center;min-width:0}
#panel-opinion .jroulette-frame{width:min(100%,330px);aspect-ratio:1;position:relative;display:grid;place-items:center;isolation:isolate}
#panel-opinion .jroulette-wheel{position:absolute;inset:8px;border-radius:50%;border:8px solid #fff;box-shadow:0 0 0 3px #243750,0 13px 30px #233a5236;transition:transform 5s cubic-bezier(.12,.78,.14,1);will-change:transform;overflow:hidden}
#panel-opinion .jroulette-wheel::before{content:"";position:absolute;inset:0;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.78) 0deg .55deg,transparent .55deg 45deg);pointer-events:none}
#panel-opinion .jroulette-label{position:absolute;left:50%;top:50%;width:100px;text-align:center;transform:translate(-50%,-50%) rotate(var(--counter)) translateY(-110px) rotate(calc(-1 * var(--counter)));font-size:13px;line-height:1.1;font-weight:900;color:#1a3045;text-shadow:0 1px 1px #fffd;pointer-events:none;white-space:nowrap}
#panel-opinion .jroulette-arrow{position:absolute;top:0;left:50%;transform:translate(-50%,-2px);width:0;height:0;border-left:15px solid transparent;border-right:15px solid transparent;border-top:29px solid #233750;filter:drop-shadow(0 2px 2px #18304444);z-index:5}
#panel-opinion .jroulette-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;width:90px;height:90px;border-radius:50%;border:6px solid #fff;background:#1d3044;color:#fff;box-shadow:0 4px 17px #1a304570;font-size:17px;font-weight:900;letter-spacing:.03em;cursor:pointer}
#panel-opinion .jroulette-hub:hover{background:#145e57}
#panel-opinion .jroulette-hub:disabled{opacity:.75;cursor:wait}
#panel-opinion .jroulette-progress{display:flex;justify-content:center;align-items:center;gap:17px;margin-top:15px;font-size:15px}
#panel-opinion .jroulette-progress strong{background:#e4f6ee;color:#116a49;border-radius:99px;padding:5px 11px}
#panel-opinion .jroulette-help{font-size:12px;color:#64748b;text-align:center;margin:10px 0 0}
#panel-opinion .jroulette-activity{min-width:0;display:flex;flex-direction:column;justify-content:center;gap:5px}
#panel-opinion .jroulette-activity .jprompt{min-height:100px;font-size:20px}
#panel-opinion .jroulette-activity .jprompt h2{margin:0 0 8px;font-size:28px}
#panel-opinion .jroulette-activity .jprompt p{margin:0;line-height:1.5}
#panel-opinion .jroulette-activity .jrow{margin:9px 0}
#panel-opinion .jroulette-activity textarea{min-height:125px}
@media(max-width:830px){#panel-opinion .jroulette-layout{grid-template-columns:1fr;gap:20px;padding:16px}#panel-opinion .jroulette-frame{width:min(100%,300px)}#panel-opinion .jroulette-label{transform:translate(-50%,-50%) rotate(var(--counter)) translateY(-99px) rotate(calc(-1 * var(--counter)));font-size:12px}#panel-opinion .jroulette-activity .jprompt{min-height:0}}
@media(prefers-reduced-motion:reduce){#panel-opinion .jroulette-wheel{transition-duration:.25s}}
`;
document.head.append(rouletteStyle);
const rouletteControlsStyle=document.createElement('style');
rouletteControlsStyle.textContent='#panel-opinion .jroulette-instruction{font-size:15px;color:#5a5970;margin:2px 0 0}#panel-opinion .jroulette-clock{font-size:clamp(50px,6vw,77px);font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.045em;line-height:1.15;color:#20202a;margin:3px 0 9px}#panel-opinion .jroulette-controls{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:0 0 4px}#panel-opinion .jroulette-controls button,#panel-opinion .jroulette-check{font-size:15px;font-weight:800;border:1px solid #29313b;border-radius:13px;padding:12px 15px;cursor:pointer;background:#fff;color:#20242c;box-shadow:0 3px 0 #0003}#panel-opinion .jroulette-controls button:disabled{opacity:.32;cursor:not-allowed;box-shadow:none}#panel-opinion #jRecord,#panel-opinion .jroulette-check{background:#ffd05b;color:#121212}#panel-opinion #jRecord.recording{background:#ef7e70}#panel-opinion .jroulette-status{font-size:13px;color:#665f57;min-height:20px;margin:3px 0 10px}#panel-opinion .jroulette-transcript-label{font-size:12px;font-weight:900;letter-spacing:.12em;color:#615b72;margin:7px 0 0}#panel-opinion .jroulette-activity textarea{width:100%;min-height:130px;border:1.5px solid #b7b3af;border-radius:12px;padding:12px;resize:vertical;box-sizing:border-box}#panel-opinion .jroulette-check{align-self:flex-start;margin:7px 0}#panel-opinion .jroulette-caption{font-size:12px;color:#777180;line-height:1.45}#panel-opinion .jroulette-controls button:focus-visible,#panel-opinion .jroulette-check:focus-visible{outline:3px solid #2472d7;outline-offset:2px}@media(max-width:520px){#panel-opinion .jroulette-controls{gap:7px}#panel-opinion .jroulette-controls button{font-size:13px;padding:10px}}';document.head.append(rouletteControlsStyle);
let seen=[],current=-1,ticker=null,wheelDegrees=0,spinning=false;
function spin(){
 if(spinning)return;
 if(seen.length===8)seen=[];
 const remaining=topics.map((_,i)=>i).filter(i=>!seen.includes(i));
 const picked=remaining[Math.floor(Math.random()*remaining.length)];
 const sectorCenter=picked*45+22.5;
 const normalized=((wheelDegrees%360)+360)%360;
 const destination=(360-sectorCenter)%360;
 const adjustment=(destination-normalized+360)%360;
 wheelDegrees+=360*5+adjustment;
 spinning=true;
 $('jSpin').disabled=true;
 $('jQuestion').textContent='🎡 Spinning…';
 $('jHint').hidden=true;
 $('jWheel').style.transform='rotate('+wheelDegrees+'deg)';
 const reveal=()=>{
  if(!spinning)return;
  spinning=false;$('jSpin').disabled=false;current=picked;seen.push(current);
  const t=topics[current];
  $('jCount').textContent=seen.length+' / 8';
  $('jQuestion').innerHTML='<h2>'+t[0]+' '+escape(rouletteNames[current])+'</h2><p>'+escape(t[2])+'</p>';
  $('jHint').textContent=t[3];$('jHint').hidden=true;
  resetSpeaking();$('jResult').textContent='';$('jRecordStatus').textContent='Situation selected. Press Record Answer.';
 };
 const wheel=$('jWheel');wheel.addEventListener('transitionend',function finished(e){if(e.propertyName!=='transform')return;wheel.removeEventListener('transitionend',finished);reveal()},{once:true});
 // Reduced-motion and hidden-tab fallback.
 setTimeout(reveal,5200);
}
$('jSpin').onclick=spin;$('jShowHint').onclick=()=>{$('jHint').hidden=!$('jHint').hidden};

let remainingSeconds=45,recordState='idle',speechRec=null,mediaStream=null,mediaRecorder=null,audioParts=[],speechFinal='',speechDraft='',speechWanted=false,recordSession=0;
const showTime=()=>{$('jTimer').textContent='00:'+String(remainingSeconds).padStart(2,'0')};
function setRecordButtons(){
 const active=recordState==='recording',paused=recordState==='paused';
 $('jRecord').disabled=active||paused||current<0||spinning;
 $('jRecord').classList.toggle('recording',active);
 $('jPause').disabled=!active&&!paused;
 $('jPause').textContent=paused?'▶ Resume':'Ⅱ Pause';
 $('jFinish').disabled=!active&&!paused;
}
function stopSpeech(){speechWanted=false;if(speechRec){try{speechRec.stop()}catch(e){}speechRec=null}}
function closeMicrophone(){if(mediaRecorder&&mediaRecorder.state!=='inactive'){try{mediaRecorder.stop()}catch(e){}}mediaRecorder=null;if(mediaStream){mediaStream.getTracks().forEach(track=>track.stop());mediaStream=null}}
function resetSpeaking(){
 recordSession++;clearInterval(ticker);stopSpeech();closeMicrophone();recordState='idle';remainingSeconds=45;showTime();
 speechFinal='';speechDraft='';audioParts=[];$('jAnswer').value='';$('jRecordStatus').textContent='Spin the wheel, then press Record Answer.';
 setRecordButtons();
}
function startSpeech(session){
 const Rec=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Rec){$('jRecordStatus').textContent='Recording started. Live transcript is unavailable in this browser; type your response below after finishing.';return}
 function launch(){
  if(session!==recordSession||!speechWanted||recordState!=='recording')return;
  try{
   const r=new Rec();speechRec=r;r.lang='en-US';r.continuous=true;r.interimResults=true;
   r.onresult=e=>{
    if(session!==recordSession)return;
    for(let i=e.resultIndex;i<e.results.length;i++){
     const phrase=e.results[i][0]?.transcript||'';
     if(e.results[i].isFinal){speechFinal+=(speechFinal?' ':'')+phrase.trim();speechDraft=''}
     else speechDraft=phrase.trim();
    }
    $('jAnswer').value=[speechFinal,speechDraft].filter(Boolean).join(' ');
   };
   r.onerror=e=>{if(session===recordSession&&e.error==='not-allowed'){$('jRecordStatus').textContent='Speech recognition permission denied. You can edit or type your transcript.';speechWanted=false}};
   r.onend=()=>{if(speechRec===r)speechRec=null;if(session===recordSession&&speechWanted&&recordState==='recording')launch()};
   r.start();
  }catch(e){speechWanted=false}
 }
 speechWanted=true;launch();
}
function finishSpeaking(){
 if(recordState!=='recording'&&recordState!=='paused')return;
 clearInterval(ticker);stopSpeech();closeMicrophone();recordState='finished';setRecordButtons();
 $('jRecordStatus').textContent='Recording finished. Review your transcript, then select Check My Speech.';
}
function tickRecording(){clearInterval(ticker);ticker=setInterval(()=>{if(recordState!=='recording')return;remainingSeconds=Math.max(0,remainingSeconds-1);showTime();if(remainingSeconds===0)finishSpeaking()},1000)}
$('jRecord').onclick=async()=>{
 if(current<0||spinning){$('jRecordStatus').textContent='Spin the wheel to select a challenge first.';return}
 if(recordState==='recording'||recordState==='paused')return;
 resetSpeaking();recordState='starting';setRecordButtons();const session=recordSession;
 $('jRecordStatus').textContent='Requesting microphone…';
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Microphone capture is not available in this browser');
  const stream=await navigator.mediaDevices.getUserMedia({audio:true});
  if(session!==recordSession){stream.getTracks().forEach(track=>track.stop());return}
  mediaStream=stream;
  if(typeof MediaRecorder!=='undefined'){
   mediaRecorder=new MediaRecorder(stream);audioParts=[];mediaRecorder.ondataavailable=e=>{if(e.data.size)audioParts.push(e.data)};mediaRecorder.start();
  }
  recordState='recording';setRecordButtons();$('jRecordStatus').textContent='Recording… Speak naturally for up to 45 seconds.';
  startSpeech(session);tickRecording();
 }catch(e){if(session!==recordSession)return;recordState='idle';setRecordButtons();$('jRecordStatus').textContent='Microphone unavailable: '+(e.message||e)+'. You can type your answer in the transcript.'}
};
$('jPause').onclick=()=>{
 if(recordState==='recording'){
  recordState='paused';clearInterval(ticker);speechWanted=false;
  if(speechRec){try{speechRec.stop()}catch(e){}speechRec=null}
  if(mediaRecorder?.state==='recording')mediaRecorder.pause();
  $('jRecordStatus').textContent='Paused.';setRecordButtons();
 }else if(recordState==='paused'){
  recordState='recording';
  if(mediaRecorder?.state==='paused')mediaRecorder.resume();
  speechFinal=$('jAnswer').value.trim();speechDraft='';startSpeech(recordSession);
  $('jRecordStatus').textContent='Recording resumed.';tickRecording();setRecordButtons();
 }
};
$('jFinish').onclick=finishSpeaking;
$('jRestart').onclick=()=>{resetSpeaking();$('jResult').textContent='';$('jRecordStatus').textContent=current>=0?'Ready. Press Record Answer to try again.':'Spin the wheel to select a challenge.'};
showTime();setRecordButtons();
window.addEventListener('pagehide',()=>{clearInterval(ticker);stopSpeech();closeMicrophone()});
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
function showFeedback(f,holder){lastKostyaCheck={kind:'ai_feedback',button:'AI feedback',task:holder.closest('section.panel')?.querySelector('h2')?.textContent||'Jobs activity',visibleFeedbackAfter:[f.interaction,f.grammar,f.vocabulary,f.nextStep].filter(Boolean).map(x=>String(x).slice(0,650)),grammarItems:(f.grammarItems||[]).slice(0,5),studentAnswer:'',verifiedCorrectness:'unknown',source:'jobs-ai-feedback',at:Date.now()};sendKostyaContext();holder.innerHTML='<div class="jobs-v3"><h3>AI feedback</h3>'+['interaction','grammar','vocabulary','nextStep'].map(k=>'<p><b>'+escape(k)+':</b> '+escape(f[k]||'No specific issue.')+'</p>').join('')+'</div>';[...(f.grammarItems||[]).map(x=>({...x,kind:'grammar'})),...(f.vocabularyItems||[]).map(x=>({...x,kind:'words'})),...(f.newWords||[]).map(x=>({kind:'words',corrected:x.word,original:x.word,example:x.example}))].forEach(item=>{const b=document.createElement('button');b.textContent='＋ Save '+(item.kind==='words'?'word: ':'grammar: ')+item.corrected;b.onclick=async()=>{b.disabled=true;try{await saveStock(item);b.textContent='✓ Saved to Stock'}catch(e){b.disabled=false;b.textContent=e.message}};holder.lastElementChild.append(b)})}
$('jFeedback').onclick=async()=>{const t=$('jAnswer').value.trim();if(current<0||!t)return alert('Spin first, then answer.');$('jResult').textContent='Analysing…';try{showFeedback(await ask('feedback',{transcript:t,scene:topics[current][2]}),$('jResult'))}catch(e){$('jResult').textContent=e.message}};
$('jCheckNotes').onclick=async()=>{const t=$('jNotes').value.trim();if(!t)return alert('Write your preparation notes first.');$('jStatus').textContent='Checking your notes…';try{showFeedback(await ask('feedback',{transcript:t,scene:role+' '+jobs[+$('jJob').value]}),$('jInterviewFeedback'));$('jStatus').textContent='Preparation checked. Edit your notes if needed.'}catch(e){$('jStatus').textContent=e.message}};
let db=null;async function getDb(){if(db)return db;const [{createClient},c]=await Promise.all([import('https://esm.sh/@supabase/supabase-js@2'),import('/student-memory/config.js')]);return db=createClient(c.SUPABASE_URL,c.SUPABASE_PUBLISHABLE_KEY)}
async function saveStock(item){const client=await getDb(),u=(await client.auth.getUser()).data.user;if(!u)throw Error('Sign in to Webilang Global first.');const value=item.corrected;const {error}=await client.from('student_learning_entries').insert({user_id:u.id,module:'Jobs & Money A2',kind:'memory_note',content:{source:'webilang-ai-stock-v1',type:item.kind,text:value,item:item.kind==='words'?{word:value,source:'Jobs & Money A2'}:{pattern:value,source:'Jobs & Money A2'}}});if(error)throw Error(error.message)}
async function loadStocks(){try{const client=await getDb(),u=(await client.auth.getUser()).data.user;if(!u)throw Error('Please sign in to Webilang Global.');const {data,error}=await client.from('student_learning_entries').select('content').eq('user_id',u.id).eq('module','Jobs & Money A2').eq('kind','memory_note').order('created_at',{ascending:false}).limit(300);if(error)throw Error(error.message);for(const [id,kind] of [['mywords','words'],['mygrammar','grammar']]){const p=$('panel-'+id);p.innerHTML='<h2>'+((kind==='words')?'My Word Stock':'My Grammar Stock')+'</h2><p>Select an expression, retrieve it and use it in an original workplace sentence.</p>';const arr=(data||[]).filter(x=>x.content?.type===kind).map(x=>x.content.text);arr.forEach(x=>{const b=document.createElement('button');b.textContent=x;b.onclick=()=>{p.querySelector('.jobs-v3')?.remove();const area=document.createElement('div');area.className='jobs-v3';area.innerHTML='<h3>Recognition → Retrieval → Production</h3><p>Study: <b>'+escape(x)+'</b></p><p>Now write the expression without looking:</p><input id="jRecall"><button id="jTest">Check</button><p>Use it in a new sentence about work:</p><textarea></textarea><button id="jAskStock">Ask Kostya to review</button><p id="jRecallReply"></p>';p.append(area);area.querySelector('#jTest').onclick=()=>area.querySelector('#jRecallReply').textContent=area.querySelector('#jRecall').value.trim().toLowerCase()===x.toLowerCase()?'Correct!':'Try again. Check the spelling.';area.querySelector('#jAskStock').onclick=()=>{openKostya();$('jQuestionCoach').value='Please check my use of '+x+': '+area.querySelector('textarea').value}};p.append(b)});if(!arr.length)p.innerHTML+='<p>No saved expressions yet. Save them from AI feedback.</p>'}}catch(e){$('panel-mywords').textContent=e.message;$('panel-mygrammar').textContent=e.message}}
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
const p=coachMode?'You are Kostya, a supportive A2 English tutor with the verified page state '+JSON.stringify(snapshot())+'. Answer one short clear question at a time. Do not invent actions.':'You are '+(role==='applicant'?'Nova, an experienced adult hiring manager, calm, confident, and professional. The student applies. Ask concise interview questions, with a measured, natural pace.':'Chaz, an adult male JOB APPLICANT. Your name is Chaz, NOT Nova and NOT Kostya. Use a natural adult male voice. The student is the employer. Let the student lead with interview questions.')+' The job is '+jobs[+$('jJob').value]+'. Student preparation notes: '+$('jNotes').value.slice(0,850)+'. Speak natural A2 English in 1-2 short sentences, with at most one question. Stop and wait after each turn. Do not give feedback during the interview.';
const state=coachMode?$('jCoachStatus'):$('jStatus');state.textContent='Connecting…';
const s={coachMode,state,instructions:p,voice:coachMode?(conf.voices?.kostya||conf.voices?.en||'Aiden'):(role==='applicant'?(conf.voices?.nova||'Katerina'):(conf.voices?.chaz||'Aiden')),seen:new Set(),sent:false,ready:false};live=s;
function onEvent(d){if(live!==s)return;const send=x=>s.channel.send(JSON.stringify(x));if(d.type==='session.created'&&!s.sent){s.sent=true;send({type:'session.update',session:{instructions:s.instructions,audio:{output:{voice:s.voice}}}})}
if(d.type==='session.updated'&&!s.ready){s.ready=true;s.sender.replaceTrack(s.stream.getAudioTracks()[0]);state.textContent='Connected: speak now.';const greeting=coachMode?'Say only: "Hi! I am Kostya. What is your question?"':role==='applicant'?'Say only: "Hello! I’m Nova, your hiring manager. Why are you interested in this job?"':'Say only: "Hello! I’m Chaz. Thank you for interviewing me."';send({type:'response.create',response:{instructions:greeting}})}
if(d.type==='conversation.item.input_audio_transcription.completed'&&d.transcript){const k='u'+(d.item_id||d.transcript);if(!s.seen.has(k)){s.seen.add(k);if(!coachMode)appendLine('student',d.transcript)}}
if(['response.output_audio_transcript.done','response.audio_transcript.done','response.output_audio_transcript.completed'].includes(d.type)&&d.transcript){const k='a'+(d.item_id||d.transcript);if(!s.seen.has(k)){s.seen.add(k);if(coachMode)$('jCoachReply').textContent=d.transcript;else appendLine('avatar',d.transcript)}}
if(d.type==='error')state.textContent=d.error?.message||'Voice error'}
function appendLine(role,text){lines.push({role,text});$('jTranscript').innerHTML=lines.map(x=>'<div class="jreply '+(x.role==='avatar'?'ai':'')+'"><b>'+(x.role==='student'?'You':'Avatar')+':</b> '+escape(x.text)+'</div>').join('')}
try{s.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});s.peer=new RTCPeerConnection();s.peer.ontrack=e=>{const a=coachMode?$('jCoachAudio'):$('jAudio');a.srcObject=e.streams[0];a.play().catch(()=>state.textContent='Please enable browser sound.')};s.sender=s.peer.addTransceiver('audio',{direction:'sendrecv'}).sender;s.channel=s.peer.createDataChannel('oai-events');s.channel.onmessage=e=>{try{onEvent(JSON.parse(e.data))}catch(err){state.textContent=err.message}};s.peer.ondatachannel=e=>e.channel.onmessage=m=>{try{onEvent(JSON.parse(m.data))}catch(err){state.textContent=err.message}};const offer=await s.peer.createOffer();await s.peer.setLocalDescription(offer);const resp=await fetch('/api/qwen-voice-session',{method:'POST',headers:{'Content-Type':'application/sdp'},body:s.peer.localDescription?.sdp||offer.sdp});if(!resp.ok)throw Error('Qwen: '+resp.status);await s.peer.setRemoteDescription({type:'answer',sdp:await resp.text()})}catch(e){closeLive();throw e}}
$('jStart').onclick=async()=>{/* Interview is open even when the student has no prepared notes (Video Games behaviour). */lines=[];$('jTranscript').innerHTML='';$('jStart').disabled=true;$('jEnd').disabled=false;try{await startLive(false)}catch(e){$('jStatus').textContent=e.message;$('jStart').disabled=false;$('jEnd').disabled=true}};
$('jEnd').onclick=async()=>{closeLive();$('jStart').disabled=false;$('jEnd').disabled=true;const text=lines.filter(x=>x.role==='student').map(x=>x.text).join('\n');if(!text){$('jStatus').textContent='No speech transcript received; feedback cannot be generated.';return}try{showFeedback(await ask('feedback',{transcript:text,scene:'Job interview '+jobs[+$('jJob').value]}),$('jInterviewFeedback'))}catch(e){$('jStatus').textContent=e.message}};
$('jCoachLive').onclick=()=>openKostya();$('jCoachStop').onclick=closeKostya;


/* Video Games A2 roleplay pattern, adapted to Jobs & Money.
   Keep the original Qwen controls and preparation fields as operational anchors. */
(()=>{
const area=$('panel-roleplays');if(!area)return;
const legacy=area.querySelector('.jobs-v3');
if(!legacy)return;
const originalHeader=area.querySelector('.section-head');
if(originalHeader)originalHeader.hidden=true;
legacy.id='jobsLegacyRoleplay';
legacy.hidden=true;
const appJobs=[
 {title:'NASA Curiosity Driver',description:'Explore Mars with cameras, computers and a robot arm.',skills:'technology · planning · teamwork · patience',ideas:'solving technical problems · studying images · working with scientists · staying calm'},
 {title:'Professional Criminal',description:'Test a company’s security legally and report weak points.',skills:'honesty · observation · communication · IT',ideas:'finding problems · protecting people · writing reports · respecting rules'},
 {title:'Island Caretaker',description:'Live on an island, care for nature and share photos.',skills:'photography · writing · responsibility · swimming',ideas:'exploring nature · taking photos · writing online · working alone'},
 {title:'Ice Cream Taster',description:'Describe flavours, textures and new ice cream recipes.',skills:'taste · attention to detail · description · teamwork',ideas:'trying flavours · describing food · checking quality · talking to customers'}
];
const escapeHTML=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const chosen={role:'applicant',job:0},notes={applicant:{},employer:{}};
const layout=document.createElement('div');layout.id='jobsVideoRoleplays';
layout.innerHTML='<header class="jvr-hero"><div><span class="jvr-kicker">AI ROLEPLAY · A2</span><h2>Choose your interview</h2><p>Two perspectives, four unusual jobs. Prepare your own language, then have a real conversation with Nova or Chaz.</p></div><div><span class="jvr-badge">🎙 Speak or type</span><span class="jvr-badge">15 turns max</span><span class="jvr-badge">Feedback → Stocks</span><button type="button" id="jvrReset">↺ Reset Roleplay</button></div></header>'+
'<div class="jvr-cards" id="jvrCards">'+
'<article class="jvr-card"><div class="jvr-cover applicant"><div class="jvr-portrait">👩🏻‍💼</div><span>Nova · Hiring Manager</span></div><div class="jvr-card-body"><small>INTERVIEW 1 · YOU ARE THE APPLICANT</small><h3>Apply for an unusual job</h3><p>Nova interviews you. Explain your skills and convince her that you are suitable for the position.</p><div class="jvr-chips"><span>✓ Nova begins</span><span>✓ A2 English</span><span>✓ 15 turns</span></div><button type="button" class="jvr-start" data-role="applicant">Choose this interview →</button></div></article>'+
'<article class="jvr-card"><div class="jvr-cover employer"><div class="jvr-portrait">👨🏻‍💼</div><span>Chaz · Job Candidate</span></div><div class="jvr-card-body"><small>INTERVIEW 2 · YOU ARE THE EMPLOYER</small><h3>Hire an unusual employee</h3><p>You are the boss. Interview Chaz, ask your own questions and decide whether to hire him.</p><div class="jvr-chips"><span>✓ You begin</span><span>✓ A2 English</span><span>✓ 15 turns</span></div><button type="button" class="jvr-start" data-role="employer">Choose this interview →</button></div></article></div>'+
'<section class="jvr-workspace" id="jvrWorkspace" hidden><div class="jvr-workspace-title"><button type="button" id="jvrBack">← Change scenario</button><div><small id="jvrRoleLabel"></small><h3 id="jvrHeading"></h3></div></div>'+
'<div class="jvr-jobpicker"><h4>1 · Choose a curious job</h4><div id="jvrJobs" class="jvr-jobgrid"></div></div>'+
'<details id="jvrPrep" class="jvr-prep" open><summary>🧩 Prepare my interview <span>Choose ideas · Practise English · Save my notes</span></summary><div class="jvr-prep-body"><h3 id="jvrPrepHeading"></h3><p id="jvrPrepIntro"></p><div class="jvr-steps"><span>1 · Think of ideas</span><span>2 · Check your English</span><span>3 · Speak and follow up</span></div><div class="jvr-idea"><b>💡 Ideas, not ready-made answers:</b> <span id="jvrIdeas"></span></div><div class="jvr-toolbox" id="jvrToolbox"></div><div class="jvr-fields" id="jvrFields"></div><div class="jvr-actions"><button type="button" id="jvrCheck">✨ Check my English with AI</button><button type="button" id="jvrSave">✓ Save my interview notes</button></div><div class="jvr-note" id="jvrPrepNotice" aria-live="polite"></div><div id="jvrPrepFeedback"></div><p class="jvr-caption">These are YOUR ideas. The AI checks language, not creativity. The avatar may ask unexpected questions.</p></div></details>'+
'<section class="jvr-live" id="jvrLive"><div class="jvr-live-top"><h3 id="jvrLiveTitle">Ready for your interview?</h3><div><span id="jvrTurns">0 / 15 turns</span><span id="jvrClock">05:00</span></div></div><div class="jvr-livegrid"><div class="jvr-agent"><div id="jvrAvatarMount"></div><b id="jvrAgentName">Nova</b><p id="jvrAgentDescription">Hiring manager</p></div><div class="jvr-talk"><div class="jvr-status" id="jvrStatus">Prepare your notes, then start the interview.</div><div id="jvrChat" class="jvr-chat" aria-live="polite"><p>Your conversation will appear here.</p></div><div class="jvr-actions"><button id="jvrBegin" class="jvr-primary" type="button">🎙 Start Voice Interview</button><button id="jvrFinish" type="button" disabled>■ End & AI Feedback</button><button id="jvrHint" type="button">💡 One hint</button></div><details class="jvr-fallback"><summary>⌨️ Type instead of speaking</summary><div><input type="text" id="jvrTyped" placeholder="Write one interview answer or question…"><button id="jvrSendTyped" type="button">Send</button></div><p>Text mode uses AI chat if voice is unavailable. Do not use voice and text at the same time.</p></details><div id="jvrFeedback"></div></div></div></section></section>';
area.prepend(layout);
const get=id=>document.getElementById(id);
let startedAt=0,clockTimer=null,lastTextHistory=[],textBusy=false,liveTurns=0;
function roleLabel(){return chosen.role==='applicant'?'You apply · Nova interviews':'You hire · Chaz applies'}
function saveCurrent(){const texts=[...get('jvrFields').querySelectorAll('textarea')].map(x=>x.value.trim());notes[chosen.role][chosen.job]=texts}
function jobSelect(index){if(!Number.isInteger(index)||index<0||index>3)return;if(get('jvrBegin')?.disabled){get('jvrStatus').textContent='Finish your interview before switching jobs.';return}chosen.job=index;get('jJob').value=String(index);get('jJob').dispatchEvent(new Event('change'));renderJobs();renderPrep()}
function renderJobs(){get('jvrJobs').innerHTML=appJobs.map((j,i)=>'<button type="button" data-job="'+i+'" class="jvr-job '+(i===chosen.job?'selected':'')+'"><b>'+escapeHTML(j.title)+'</b><span>'+escapeHTML(j.description)+'</span></button>').join('');get('jvrJobs').querySelectorAll('button').forEach(b=>b.onclick=()=>{saveCurrent();jobSelect(+b.dataset.job)})}
function renderPrep(){
const employer=chosen.role==='employer',j=appJobs[chosen.job];
get('jvrRoleLabel').textContent=roleLabel();get('jvrHeading').textContent=(employer?'Interview Chaz for ':'Apply for ')+j.title;
get('jvrPrepHeading').textContent=employer?'🎯 Get ready: Ask YOUR questions':'🎯 Get ready: Convince Nova';
get('jvrPrepIntro').textContent=employer?'You are the interviewer. Choose what matters to you. Prepare up to five questions, including one unexpected question.':'You are the applicant. Prepare your experience, your skills and a question for the employer. You can invent suitable experience for this roleplay.';
get('jvrIdeas').textContent=j.ideas;
get('jvrToolbox').innerHTML=employer?'<b>Language toolbox:</b> Why / How / What / When · Can you…? · Have you ever…? · Would you…?':'<b>Language toolbox:</b> I am good at… · I can… · I have experience in… · I would like to… · Could you tell me…?';
const labels=employer?['My question 1','My question 2','My question 3','Optional question 4','Optional question 5']:['My strength 1','My strength 2','My experience','Why I want this job','My question for Nova'];
const placeholders=employer?['Why do you want this job?','Can you…?','What would you do if…?','An unexpected question is welcome!','Anything else you are curious about…']:['I am good at…','I can…','I have experience with… / I am ready to learn…','I want this job because…','Could you tell me about…?'];
const stored=notes[chosen.role][chosen.job]||[];
get('jvrFields').innerHTML=labels.map((lab,i)=>'<label>'+lab+'<textarea data-field="'+i+'" rows="2" placeholder="'+escapeHTML(placeholders[i])+'">'+escapeHTML(stored[i]||'')+'</textarea></label>').join('');
get('jvrAgentName').textContent=employer?'Chaz':'Nova';get('jvrAgentDescription').textContent=employer?'Job applicant':'Hiring manager';
get('jvrLiveTitle').textContent=employer?'You are the employer — lead the interview':'Nova is the employer — answer her questions';
get('jvrPrepNotice').textContent='';get('jvrPrepFeedback').replaceChildren();
}
function selectRole(role){if(get('jvrWorkspace').hidden===false)saveCurrent();lastTextHistory=[];get('jvrBegin').disabled=false;get('jvrFinish').disabled=true;chosen.role=role;get('jvrCards').hidden=true;get('jvrWorkspace').hidden=false;get('jvrPrep').open=true;get('jvrLive').classList.remove('is-live');const target=role==='employer'?get('jHire'):get('jApply');target.click();renderJobs();renderPrep();get('jvrStatus').textContent='Prepare your interview notes first.';get('jvrChat').innerHTML='<p>Your conversation will appear here.</p>';get('jvrTurns').textContent='0 / 15 turns';get('jvrClock').textContent='05:00';get('jvrWorkspace').scrollIntoView({behavior:'smooth',block:'start'})}
get('jvrCards').querySelectorAll('.jvr-start').forEach(b=>b.onclick=()=>selectRole(b.dataset.role));
get('jvrBack').onclick=()=>{if(!get('jvrBegin').disabled){saveCurrent();get('jvrWorkspace').hidden=true;get('jvrCards').hidden=false}else get('jvrStatus').textContent='End the current interview before changing scenario.'};
get('jvrCheck').onclick=async()=>{saveCurrent();const text=(notes[chosen.role][chosen.job]||[]).filter(Boolean).join('\n');if(!text){get('jvrPrepNotice').textContent='Write your own questions or answers first.';return}get('jvrPrepNotice').textContent='Checking your language…';try{const result=await ask('feedback',{transcript:text,scene:'Interview preparation · '+roleLabel()+' · '+jobs[chosen.job]});showFeedback(result,get('jvrPrepFeedback'));get('jvrPrepNotice').textContent='Language feedback ready. Your original ideas are unchanged.';}catch(e){get('jvrPrepNotice').textContent=e.message}};
get('jvrSave').onclick=()=>{saveCurrent();const text=(notes[chosen.role][chosen.job]||[]).filter(Boolean).join('\n');get('jNotes').value=text;get('jvrPrepNotice').textContent='✓ Your notes are saved for this interview.'};
get('jvrBegin').onclick=()=>{get('jvrSave').click();get('jStart').click();if(get('jStart').disabled){get('jvrBegin').disabled=true;get('jvrFinish').disabled=false;get('jvrPrep').open=false;get('jvrLive').classList.add('is-live');startedAt=Date.now();clearInterval(clockTimer);clockTimer=setInterval(()=>{const left=Math.max(0,300-Math.floor((Date.now()-startedAt)/1000));get('jvrClock').textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(left===0){clearInterval(clockTimer);get('jvrFinish').click()}},1000);get('jvrStatus').textContent='Connecting to your interview partner…'}};
get('jvrFinish').onclick=async()=>{clearInterval(clockTimer);const typedOnly=lastTextHistory.length>0&&!live;if(typedOnly){const own=lastTextHistory.filter(x=>x.role==='user').map(x=>x.content).join('\n');if(own){get('jvrStatus').textContent='Reviewing your interview answers…';try{showFeedback(await ask('feedback',{transcript:own,scene:'Jobs interview · '+roleLabel()+' · '+jobs[chosen.job]}),get('jvrFeedback'))}catch(e){get('jvrStatus').textContent=e.message}}}else{get('jEnd').click()}get('jvrBegin').disabled=false;get('jvrFinish').disabled=true;get('jvrLive').classList.remove('is-live');if(!typedOnly)get('jvrStatus').textContent='Interview complete. Review your transcript and feedback below.'};
get('jvrHint').onclick=()=>{const s=chosen.role==='employer'?'Ask about a skill, an example or availability. Use one short question.':'Answer one question and give a reason. Try: I can… because…';get('jvrStatus').textContent='💡 '+s};
get('jvrSendTyped').onclick=async()=>{if(live){get('jvrStatus').textContent='End the voice call before using text mode.';return}const input=get('jvrTyped');const text=input.value.trim();if(!text||textBusy)return;const turnCount=lastTextHistory.filter(x=>x.role==='user').length;if(turnCount>=15){get('jvrStatus').textContent='15-turn limit reached. End the interview for feedback.';return}if(!get('jvrBegin').disabled&&lastTextHistory.length===0){get('jvrStatus').textContent='Type-mode interview started. End it when ready.';get('jvrBegin').disabled=true;get('jvrFinish').disabled=false;get('jvrPrep').open=false;}
textBusy=true;input.value='';get('jvrChat').insertAdjacentHTML('beforeend','<p class="jvr-student"><b>You:</b> '+escapeHTML(text)+'</p>');lastTextHistory.push({role:'user',content:text});get('jvrStatus').textContent=(chosen.role==='applicant'?'Nova':'Chaz')+' is thinking…';try{const d=await ask('chat',{scene:chosen.role==='applicant'?'interview':'colleague',job:jobs[chosen.job],interviewRole:chosen.role,history:lastTextHistory});lastTextHistory.push({role:'assistant',content:d.answer});get('jvrChat').insertAdjacentHTML('beforeend','<p class="jvr-avatar-reply"><b>'+(chosen.role==='employer'?'Chaz':'Nova')+':</b> '+escapeHTML(d.answer)+'</p>');get('jvrStatus').textContent='Your turn. Ask or answer naturally.';}catch(e){get('jvrStatus').textContent=e.message}finally{textBusy=false;get('jvrChat').scrollTop=get('jvrChat').scrollHeight}};
function syncUI(){
 get('jvrChat').innerHTML=lines.length?lines.map(x=>'<p class="'+(x.role==='student'?'jvr-student':'jvr-avatar-reply')+'"><b>'+(x.role==='student'?'You':chosen.role==='employer'?'Chaz':'Nova')+':</b> '+escapeHTML(x.text)+'</p>').join(''):'<p>Conversation will appear here after transcription.</p>';
 const turns=lines.filter(x=>x.role==='student').length;get('jvrTurns').textContent=turns+' / 15 turns';if(turns>=15&&get('jvrBegin').disabled&&get('jvrFinish').disabled===false){get('jvrStatus').textContent='15 turns complete. The interview is ending.';queueMicrotask(()=>get('jvrFinish').click())}
 if(live?.state) get('jvrStatus').textContent=live.state.textContent||'Interview connected.';
 const feedback=get('jInterviewFeedback');if(feedback.children.length){get('jvrFeedback').replaceChildren(...[...feedback.children]);}
}
const voiceStateObserver=new MutationObserver(()=>{if(get('jvrBegin').disabled&&!live&&get('jStart').disabled===false&&lastTextHistory.length===0){get('jvrBegin').disabled=false;get('jvrFinish').disabled=true;clearInterval(clockTimer);get('jvrStatus').textContent=get('jStatus').textContent||'Voice connection unavailable. Please retry.'}});voiceStateObserver.observe(get('jStatus'),{childList:true,subtree:true,characterData:true});
const observer=new MutationObserver(()=>syncUI());observer.observe(get('jTranscript'),{childList:true,subtree:true});observer.observe(get('jInterviewFeedback'),{childList:true,subtree:true});
const agentMount=get('jvrAvatarMount'),rawFrame=get('jAvatar');agentMount.append(rawFrame);rawFrame.removeAttribute('loading');
function portraitOnly(){try{const d=rawFrame.contentDocument;if(!d)return;let st=d.getElementById('jvrPortraitMode');if(!st){st=d.createElement('style');st.id='jvrPortraitMode';d.head.append(st)}st.textContent='body{overflow:hidden!important}.wrap,.layout{margin:0!important;padding:0!important;width:100%!important;max-width:none!important}.layout{display:block!important}.panel,header,footer,.stageTag{display:none!important}.stage{height:260px!important;min-height:0!important;border:0!important;border-radius:0!important;background:#f0f5f2!important}';let sel=d.getElementById('modelMode');if(sel){const model=chosen.role==='applicant'?'nova':'chaz';if(sel.value!==model){sel.value=model;sel.dispatchEvent(new Event('change',{bubbles:true}))}}}catch(e){}}
rawFrame.addEventListener('load',portraitOnly);portraitOnly();get('jvrCards').querySelectorAll('.jvr-start').forEach(b=>b.addEventListener('click',()=>setTimeout(portraitOnly,300)));get('jvrJobs').addEventListener('click',()=>setTimeout(portraitOnly,200));
const css=document.createElement('style');css.textContent=
'#jobsLegacyRoleplay[hidden]{display:none!important}#jobsVideoRoleplays{font-family:Inter,system-ui,sans-serif;color:#243d50}#jobsVideoRoleplays [hidden]{display:none!important}'+
'.jvr-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;background:#f6f9fd;border:1px solid #dbe6ed;border-radius:19px;padding:20px;margin:8px 0 18px}.jvr-hero h2{font-size:27px;margin:4px 0 7px}.jvr-hero p{margin:0;color:#607789;line-height:1.55}.jvr-kicker,.jvr-card-body small{font-weight:900;font-size:11px;letter-spacing:.09em;color:#667d90}.jvr-badge{display:inline-block;padding:6px 9px;border-radius:20px;background:white;border:1px solid #dae5e9;font-size:11px;margin:3px}.jvr-hero button{display:block;margin-top:8px;background:#fff4f1;border:1px solid #e5b0a8;color:#9e4c44;border-radius:9px;padding:8px 12px}'+
'.jvr-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.jvr-card{background:#fff;overflow:hidden;border:1px solid #dce7ec;border-radius:18px;box-shadow:0 7px 22px #24485d10}.jvr-cover{height:225px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px}.jvr-cover.applicant{background:linear-gradient(145deg,#ddebf2,#f1eee8)}.jvr-cover.employer{background:linear-gradient(145deg,#ece5f5,#e7eff3)}.jvr-portrait{font-size:97px}.jvr-cover span{font-weight:800;color:#32526a}.jvr-card-body{padding:19px}.jvr-card-body h3{font-size:22px;margin:8px 0}.jvr-card-body p{color:#5f7786;min-height:68px;line-height:1.55}.jvr-chips{display:flex;gap:5px;flex-wrap:wrap;margin:11px 0 15px}.jvr-chips span{font-size:11px;padding:5px 8px;background:#edf5ee;border-radius:22px;color:#386c4f}.jvr-start{background:#23765b;color:#fff;border:0;border-radius:10px;font-size:15px;font-weight:800;padding:12px;width:100%;cursor:pointer}'+
'.jvr-workspace-title{display:flex;align-items:center;gap:16px;margin:10px 0 18px}.jvr-workspace-title button{border:1px solid #ccdae1;background:#fff;padding:9px;border-radius:10px}.jvr-workspace-title h3{margin:4px 0;font-size:24px}.jvr-workspace-title small{color:#68849a;font-weight:900}.jvr-jobpicker,.jvr-prep,.jvr-live{border:1px solid #d7e3e9;border-radius:17px;background:#fff;padding:18px;margin-bottom:16px}.jvr-jobgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.jvr-job{background:#f6fafb;border:1px solid #dbe7ed;border-radius:12px;padding:12px;text-align:left;cursor:pointer}.jvr-job.selected{border:2px solid #27876b;background:#eaf7f0}.jvr-job b{display:block;margin-bottom:5px}.jvr-job span{font-size:12px;color:#627887}.jvr-prep summary{cursor:pointer;font-weight:900;font-size:18px}.jvr-prep summary span{font-size:12px;font-weight:500;color:#6a8190;padding-left:10px}.jvr-prep-body{padding-top:16px}.jvr-steps{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0}.jvr-steps span{border-radius:10px;padding:9px 11px;font-size:12px;font-weight:800;background:#eaf2fe;color:#365d89}.jvr-steps span:nth-child(2){background:#f2eafd;color:#6b4e94}.jvr-steps span:nth-child(3){background:#e6f8ed;color:#347653}.jvr-idea{padding:15px;border-radius:12px;background:#fff5dc;border:1px solid #f2d18b;line-height:1.6;color:#755321}.jvr-toolbox{margin:12px 0;color:#596f80;font-size:13px}.jvr-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.jvr-fields label{font-size:13px;font-weight:800;color:#38546b}.jvr-fields textarea{display:block;width:100%;box-sizing:border-box;min-height:69px;padding:10px;border:1px solid #c7d9e5;border-radius:10px;font:inherit;resize:vertical;margin-top:5px}.jvr-actions{display:flex;gap:8px;flex-wrap:wrap;margin:13px 0}.jvr-actions button{border:1px solid #b9d2cd;background:#fff;padding:10px 13px;border-radius:10px;cursor:pointer;font-weight:750}.jvr-actions .jvr-primary{background:#188765;color:white;border-color:#188765}.jvr-note{font-size:13px;color:#46755f;margin:7px 0}.jvr-caption{font-size:12px;color:#688293}.jvr-live-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.jvr-live-top h3{margin:0}.jvr-live-top span{padding:5px 9px;background:#f1f5f7;border-radius:20px;font-size:12px;font-weight:800;margin-left:5px}.jvr-livegrid{display:grid;grid-template-columns:minmax(220px,.35fr) minmax(0,.65fr);gap:16px;margin-top:15px}.jvr-agent{border:1px solid #dce8e8;border-radius:14px;overflow:hidden;text-align:center}.jvr-agent b{display:block;margin-top:9px}.jvr-agent p{font-size:13px;color:#688092}.jvr-agent iframe{width:100%;height:260px!important;border:0}.jvr-talk{min-width:0}.jvr-status{background:#edf5f2;padding:10px;border-radius:10px;color:#416e5f;font-size:13px}.jvr-chat{min-height:160px;max-height:360px;overflow:auto;padding:12px;border:1px solid #e1eaee;border-radius:12px;margin-top:10px}.jvr-student,.jvr-avatar-reply{padding:11px;border-radius:11px;max-width:90%;margin:8px 0}.jvr-student{background:#e6f3ed;margin-left:auto}.jvr-avatar-reply{background:#edf3fa}.jvr-fallback{font-size:12px;color:#687d8c;border-top:1px dashed #d3e1e6;padding-top:8px}.jvr-fallback div{display:flex;gap:8px;margin-top:9px}.jvr-fallback input{flex:1;min-width:0;padding:9px;border:1px solid #cddce4;border-radius:8px}.jvr-fallback button{padding:8px 12px;border-radius:8px;background:#fff;border:1px solid #cbd9e0}'+
'@media(max-width:850px){.jvr-cards,.jvr-livegrid{grid-template-columns:1fr}.jvr-jobgrid{grid-template-columns:1fr}.jvr-fields{grid-template-columns:1fr}.jvr-hero{flex-direction:column}}';
document.head.append(css);
get('jvrReset').onclick=()=>{if(get('jvrBegin').disabled){get('jvrFinish').click()}clearInterval(clockTimer);lastTextHistory=[];lines=[];get('jTranscript').replaceChildren();get('jInterviewFeedback').replaceChildren();get('jvrWorkspace').hidden=true;get('jvrCards').hidden=false;get('jvrBegin').disabled=false;get('jvrFinish').disabled=true;get('jvrStatus').textContent='Ready.'};
})();

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

/* Desktop density refinement without changing exercise state or handlers. */
const densityStyle=document.createElement('style');densityStyle.textContent="\n/* Compact responsive exercise layout: Watching, Grammar, Vocabulary. */\n@media (min-width: 980px) {\n #panel-vocab .retrieve-grid,\n #panel-vocab .voice-list,\n #panel-grammar .grammar-list {\n   display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:stretch;\n }\n #panel-vocab .retrieve-item,#panel-vocab .voice-item,\n #panel-grammar .grammar-item,#panel-grammar .order-item {\n   min-width:0;height:100%;margin:0;\n }\n #panel-grammar .grammar-item.voice-grammar-item{padding:12px 14px!important}\n #panel-watching .card:has(> .video-q) {\n   display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px;align-items:stretch;\n }\n #panel-watching .card:has(> .video-q)>:not(.video-q){grid-column:1/-1}\n #panel-watching .card:has(> .video-q)>.video-q{margin-top:0;min-width:0;display:flex;flex-direction:column}\n #panel-watching .video-q .voice-answer-row{margin-top:auto;padding-top:10px}\n #panel-watching .video-q .mc-options{gap:5px}\n #panel-watching .video-q .mc-option{padding:7px 9px}\n}\n@media (min-width: 680px) and (max-width:979px){\n #panel-vocab .voice-item{padding:10px}\n #panel-grammar .grammar-item.voice-grammar-item{padding:10px!important}\n #panel-watching .video-q{padding:12px}\n}\n#panel-vocab .voice-item .voice-content,#panel-grammar .grammar-item{min-width:0}\n#panel-vocab .voice-item .voice-answer-row,#panel-watching .voice-answer-row{gap:6px}\n#panel-vocab .voice-item .btn.blue,#panel-watching .video-q .btn.blue{padding:9px 12px;font-size:14px}\n";document.head.append(densityStyle);
})();