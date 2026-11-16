/* Webilang Art Lab: one continuous 5-minute WebRTC roleplay session.
   Client credentials never stored here. Server credentials only in /api/artlab-realtime-session. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const persons={nova:'Nova',chaz:'Chaz'};
let chosen='nova',active=null,serial=0;
// An uncluttered live mode: collect the complete transcript for feedback without forcing reading.
const livePanel=document.createElement('div');livePanel.className='artlab-live-panel';
livePanel.innerHTML='<div class="artlab-live-row"><div><strong>Live conversation · A2–B1</strong><p id="artlabLiveState">Ready to speak</p></div><span id="artlabLiveBadge">Ready</span></div><p class="artlab-live-prompt">Listen and respond naturally. The transcript is being saved for feedback.</p><label class="artlab-captions-toggle"><input id="artlabShowCaptions" type="checkbox"> Show live captions</label><p id="artlabLatestCaption" class="artlab-latest-caption" hidden></p><button type="button" class="artlab-review-transcript" id="artlabReviewTranscript" hidden>Review full transcript</button>';
const messages=document.getElementById('artlabRoleMessages');messages?.parentNode?.insertBefore(livePanel,messages);
const captions=document.getElementById('artlabShowCaptions'),latest=document.getElementById('artlabLatestCaption');
const transcriptReview=document.getElementById('artlabReviewTranscript');
function showCaptions(){latest.hidden=!captions.checked;messages.classList.toggle('artlab-transcript-visible',!!captions.checked)}
captions?.addEventListener('change',showCaptions);
transcriptReview?.addEventListener('click',()=>{messages.classList.toggle('artlab-transcript-visible');transcriptReview.textContent=messages.classList.contains('artlab-transcript-visible')?'Hide full transcript':'Review full transcript'});
showCaptions();
function sendMouth(level){const iframe=document.getElementById('artlabRoleAvatar');try{iframe?.contentWindow?.postMessage({source:'webilang-artlab',type:'avatar-audio-level',level:Math.max(0,Math.min(1,level)),role:chosen},location.origin)}catch{}}
function startLipSync(s,stream){if(!window.AudioContext&&!window.webkitAudioContext)return;try{const C=window.AudioContext||window.webkitAudioContext;s.audioContext=new C();const src=s.audioContext.createMediaStreamSource(stream),a=s.audioContext.createAnalyser();a.fftSize=512;a.smoothingTimeConstant=.45;src.connect(a);const vals=new Uint8Array(a.fftSize);const loop=()=>{if(active!==s)return;a.getByteTimeDomainData(vals);let sum=0;for(const v of vals){const d=(v-128)/128;sum+=d*d}const rms=Math.sqrt(sum/vals.length);const volume=Math.min(1,Math.max(0,(rms-.013)*9));sendMouth(volume);s.animation=requestAnimationFrame(loop)};loop();s.audioContext.resume().catch(()=>{})}catch(e){console.warn('Lip-sync analysis unavailable',e)}}

const oldChoose=window.artlabChooseRole;
function note(message){if($('artlabLiveState'))$('artlabLiveState').textContent=message;const el=$('artlabRoleStatus');if(el)el.textContent=message;const v=$('artlabRoleVoiceStatus');if(v)v.textContent=message}
function pretty(s){const t=Math.max(0,Math.ceil(s));return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`}
function log(who,text){if(!text||!String(text).trim())return;const panel=$('artlabRoleMessages');const msg=document.createElement('div');msg.className='artlab-message '+(who==='You'?'mine':'theirs');const name=document.createElement('strong');name.textContent=who;const p=document.createElement('p');p.textContent=text;msg.append(name,p);panel.append(msg);panel.scrollTop=panel.scrollHeight;if(latest){latest.textContent=who+': '+text;latest.hidden=!captions.checked}}
function setButtons(isOn,connecting=false){$('artlabRoleStart').disabled=isOn;$('artlabRoleEnd').disabled=!isOn;$('artlabRoleStart').textContent=connecting?'Connecting…':'▶ Start conversation';$('artlabRoleSend').disabled=!isOn;$('artlabRoleInput').disabled=!isOn;}
function clearConnection(s){if(!s)return;clearInterval(s.timer);cancelAnimationFrame(s.animation);sendMouth(0);try{s.audioContext?.close()}catch{}try{s.channel?.close()}catch{}try{s.peer?.close()}catch{}for(const t of s.stream?.getTracks()||[])t.stop();const audio=$('artlabRolePartnerAudio');if(audio){audio.pause();audio.srcObject=null;audio.hidden=true}if($('artlabEnableAudio'))$('artlabEnableAudio').hidden=true}
const oldRoleSelect=window.artlabChooseRole;
window.artlabChooseRole=function(next,button){if(active)return note('End the current conversation before switching.');chosen=next==='chaz'?'chaz':'nova';if(typeof oldRoleSelect==='function')oldRoleSelect(next,button);};
async function apiJSON(url,body){const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let data={};try{data=await res.json()}catch{}if(!res.ok)throw Error(data.error||`HTTP ${res.status}`);return data}
function processEvent(s,event){if(active!==s)return;if(event.type==='input_audio_buffer.speech_started')note('🎙 Hearing you…');if(event.type==='input_audio_buffer.speech_stopped')note('Processing your speech…');if(event.type==='response.created')note(persons[s.role]+' is answering…');if(event.type==='response.done')note('🎙 Your turn — speak naturally.');
 if(event.type==='error')note('Realtime service: '+(event.error?.message||'unknown error'));
 if(event.type==='conversation.item.input_audio_transcription.completed'&&event.transcript){const id='u:'+event.item_id;if(!s.seen.has(id)){s.seen.add(id);s.history.push({who:'You',text:event.transcript});log('You',event.transcript)}}
 if((event.type==='response.output_audio_transcript.done'||event.type==='response.audio_transcript.done')&&event.transcript){const id='a:'+(event.item_id||event.response_id||event.transcript);if(!s.seen.has(id)){s.seen.add(id);s.history.push({who:persons[s.role],text:event.transcript});log(persons[s.role],event.transcript)}}
}
window.artlabStartRoleplay=async function(){if(active)return;
 const s={id:++serial,role:chosen,history:[],seen:new Set(),peer:null,stream:null,channel:null,timer:null,start:0,finished:false};active=s;
 $('artlabRoleMessages').replaceChildren();messages.classList.remove('artlab-transcript-visible');transcriptReview.hidden=true;latest.textContent='';latest.hidden=!captions.checked;$('artlabLiveBadge').textContent='Connecting';$('artlabRoleFeedbackBox').hidden=true;$('artlabRoleTime').textContent='05:00';setButtons(true,true);note('Requesting microphone access…');
 try{
  if(!window.RTCPeerConnection||!navigator.mediaDevices?.getUserMedia)throw Error('Use Chrome or Safari with microphone/WebRTC support.');
  s.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  if(active!==s){clearConnection(s);return}
  s.peer=new RTCPeerConnection();s.peer.onconnectionstatechange=()=>{if(active!==s)return;const state=s.peer.connectionState;if(state==='failed'||state==='disconnected')note('Connection '+state+'. End and restart if it does not recover.')};
  s.peer.ontrack=event=>{if(active!==s)return;const audio=$('artlabRolePartnerAudio');audio.srcObject=event.streams[0];audio.hidden=false;startLipSync(s,event.streams[0]);audio.play().catch(()=>{$('artlabEnableAudio').hidden=false;note('Audio ready. Tap Enable audio to hear '+persons[s.role]+'.')})};
  for(const track of s.stream.getAudioTracks())s.peer.addTrack(track,s.stream);
  s.channel=s.peer.createDataChannel('oai-events');s.channel.onmessage=e=>{try{processEvent(s,JSON.parse(e.data))}catch(err){console.warn('Art Lab realtime event',err)}};
  s.channel.onopen=()=>{if(active!==s)return;$('artlabLiveBadge').textContent='● Live';note('Connected. Talk naturally to '+persons[s.role]+'.');s.start=Date.now();
   s.timer=setInterval(()=>{if(active!==s)return;const left=300-(Date.now()-s.start)/1000;$('artlabRoleTime').textContent=pretty(left);if(left<=0)void window.artlabEndRoleplay()},500);
   try{s.channel.send(JSON.stringify({type:'response.create',response:{instructions:'Begin the art gallery roleplay now with one brief in-character greeting and one relevant question. Then listen to the learner.'}}))}catch{}
  };
  note('Connecting securely to '+persons[s.role]+'…');
  const offer=await s.peer.createOffer();await s.peer.setLocalDescription(offer);
  const res=await fetch('/api/artlab-realtime-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sdp:s.peer.localDescription?.sdp||offer.sdp,character:s.role})});
  if(!res.ok){let j={};try{j=await res.json()}catch{}throw Error(j.error||`Server responded ${res.status}`)}
  const answer=await res.text();if(active!==s)return;await s.peer.setRemoteDescription({type:'answer',sdp:answer});
  setButtons(true,false);
 }catch(err){if(active===s){active=null;clearConnection(s);setButtons(false);note('Could not start conversation: '+(err?.message||String(err)))}else clearConnection(s)}
};
window.artlabSendRoleMessage=function(event){event.preventDefault();const s=active;const inp=$('artlabRoleInput');const txt=inp.value.trim();if(!s||!txt)return;if(!s.channel||s.channel.readyState!=='open'){note('Please wait for the connection.');return}inp.value='';s.history.push({who:'You',text:txt});log('You',txt);try{s.channel.send(JSON.stringify({type:'conversation.item.create',item:{type:'message',role:'user',content:[{type:'input_text',text:txt.slice(0,1200)}]}}));s.channel.send(JSON.stringify({type:'response.create'}));note('Message sent to '+persons[s.role]+'.')}catch(e){note('Could not send: '+e.message)}};
window.artlabEndRoleplay=async function(){const s=active;if(!s||s.finished)return;s.finished=true;active=null;clearConnection(s);setButtons(false);note('Conversation finished. Preparing feedback…');
 $('artlabLiveBadge').textContent='Finished';transcriptReview.hidden=false;transcriptReview.textContent='Review full transcript';const box=$('artlabRoleFeedbackBox'),holder=$('artlabRoleFeedback'),save=$('artlabRoleSaveGrammar');box.hidden=false;holder.textContent='Reviewing the conversation…';save.replaceChildren();
 const student=s.history.filter(x=>x.who==='You').map(x=>x.text);
 if(!student.length){holder.textContent='No student speech transcript was received. Check microphone permission and audio transcription, then retry. Feedback cannot be generated without your words.';return}
 try{
  const result=await apiJSON('/api/artlab-coach',{mode:'feedback',task:'roleplay-'+s.role,prompt:'Five-minute live discussion with '+persons[s.role]+'. Evaluate actual student turns in context; give brief A2–B1 feedback.',text:student.join('\n').slice(0,3200)});
  holder.replaceChildren();for(const [key,title] of [['interaction','Interaction'],['grammar','Grammar'],['vocabulary','Vocabulary'],['nextStep','Next step']]){const section=document.createElement('section');section.className='artlab-feedback-row artlab-feedback-'+key;const h=document.createElement('strong');h.textContent=title;const p=document.createElement('p');p.textContent=result[key]||'No comment';section.append(h,p);holder.append(section)}
  for(const item of (result.grammarItems||[]).filter(x=>typeof x==='string').slice(0,4)){const b=document.createElement('button');b.type='button';b.className='action secondary';b.textContent='＋ Save: '+item;b.onclick=()=>{if(typeof window.artSaveGrammarItem==='function')window.artSaveGrammarItem(item,b);else note('Grammar Stock save function unavailable.')};save.append(b)}
 }catch(e){holder.textContent='Feedback service unavailable: '+e.message+'. Transcript remains visible above.'}
};
$('artlabEnableAudio')?.addEventListener('click',()=>{$('artlabRolePartnerAudio').play().then(()=>{$('artlabEnableAudio').hidden=true}).catch(e=>note('Audio blocked: '+e.message))});
window.addEventListener('pagehide',()=>{if(active)clearConnection(active)});
})();