/* Webilang Art Lab — Nov 2026 integrated audio, AI feedback & two roleplays.
   Never embed API credentials; all provider requests are server-side. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const roleInfo={
 nova:{name:'Nova',role:'Gallery director',brief:'You direct a gallery preparing a Rivera exhibition. The sponsor worries about controversy. Negotiate a fair decision with the learner.',hello:'Welcome. The sponsor wants us to remove Lenin’s portrait. What would you recommend, and why?',goal:'Nova wants to keep the sponsor but protect the artist. Your goal: agree on a fair solution.'},
 chaz:{name:'Chaz',role:'Independent artist',brief:'You are an independent painter whose work is criticized as too simple. Challenge the learner to explain artistic value without attacking personal opinions.',hello:'Someone said my painting looks like a child could make it. Do you think it can still be good art?',goal:'Chaz believes art should communicate an idea. Your goal: challenge his view and agree on one sentence for the exhibition label.'}
};
let role='nova',roleStart=0,roleTick=null,roleHistory=[],roleBusy=false,roleRecorder=null,roleRecording=[],roleStream=null,roleRecordTimeout=null;
let voiceAudio=null,voiceURL=null,voiceGeneration=0,recordGeneration=0,voiceInProgress=false;
function voiceStatus(text){const el=$('artlabRoleVoiceStatus');if(el)el.textContent=text}
function stopVoice(){voiceGeneration++;if(voiceAudio){voiceAudio.pause();voiceAudio.src='';voiceAudio=null}if(voiceURL){URL.revokeObjectURL(voiceURL);voiceURL=null}voiceInProgress=false}
async function sayAsCharacter(text){
 if(!$('artlabRoleSpeakPartner')?.checked)return;
 const generation=++voiceGeneration;voiceInProgress=true;voiceStatus(roleInfo[role].name+' is preparing a spoken reply…');
 try{
  const response=await fetch('/api/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,module:'avatar-lab',avatarVoice:role==='nova'?'female':'male',targetLanguage:'en'})});
  if(!response.ok){let error='';try{const payload=await response.json();error=payload.error||''}catch{}throw Error(error||'Voice service returned '+response.status)}
  const blob=await response.blob();if(generation!==voiceGeneration)return;
  if(voiceURL){URL.revokeObjectURL(voiceURL);voiceURL=null}
  voiceURL=URL.createObjectURL(blob);
  const audio=$('artlabRolePartnerAudio');audio.src=voiceURL;audio.hidden=false;voiceAudio=audio;
  voiceStatus(roleInfo[role].name+' is speaking…');
  try{await audio.play()}catch(e){voiceStatus('Audio is ready. Press ▶ on the player to hear '+roleInfo[role].name+'.');return}
  audio.onended=()=>{if(generation===voiceGeneration)voiceStatus('Your turn: press the microphone and speak.')};
 }catch(e){voiceStatus('Voice unavailable: '+e.message+'. Text conversation still works.');}
 finally{voiceInProgress=false}
}

const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function status(message){if($('artlabRoleStatus'))$('artlabRoleStatus').textContent=message}
function secsLeft(){return Math.max(0,300-Math.floor((Date.now()-roleStart)/1000))}
function clock(){if(!roleStart)return;const s=secsLeft();$('artlabRoleTime').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;if(s===0)window.artlabEndRoleplay()}
function append(who,text){roleHistory.push({who,text});const log=$('artlabRoleMessages');if(!log)return;const p=document.createElement('div');p.className='artlab-message '+(who==='You'?'mine':'theirs');const b=document.createElement('strong');b.textContent=who;const q=document.createElement('p');q.textContent=text;p.append(b,q);log.append(p);log.scrollTop=log.scrollHeight}
function connectAvatar(){
 const frame=$('artlabRoleAvatar');if(!frame)return;
 // Reuse the existing Webilang 3D model, but display the stage ONLY.
 // The old translated iframe showed a chopped face and inaccessible realtime buttons.
 const set=()=>{try{
  const doc=frame.contentDocument;if(!doc)return;
  if(!doc.getElementById('artlab-portrait-only')){
   const style=doc.createElement('style');style.id='artlab-portrait-only';
   style.textContent=`html,body{margin:0!important;overflow:hidden!important;height:100%!important;background:#e2e8df!important}
   body .wrap{padding:0!important;margin:0!important;max-width:none!important;width:100%!important}
   body .wrap>header,body .wrap>h1,body .wrap>p,body .wrap>footer,body .layout>.panel,body .stageTag{display:none!important}
   body .layout{display:block!important;margin:0!important;padding:0!important}
   body .stage{display:block!important;width:100%!important;height:100vh!important;min-height:0!important;border:0!important;border-radius:0!important;overflow:hidden!important}
   body #scene{height:100%!important;width:100%!important}
   body .layout>.stage{margin:0!important}`;
   doc.head.append(style);
  }
  const select=doc.getElementById('modelMode');
  if(select&&select.value!==role){select.value=role;select.dispatchEvent(new Event('change',{bubbles:true}))}
  const label=document.querySelector('.artlab-avatar-label');if(label)label.textContent=roleInfo[role].name.toUpperCase()+' · 3D CHARACTER';
 }catch(e){console.debug('Art Lab avatar stage unavailable:',e)}};
 if(!frame.dataset.artlabListener){frame.dataset.artlabListener='1';frame.addEventListener('load',set)}
 if(frame.contentDocument?.readyState==='complete')set();
}
window.artlabChooseRole=function(next,btn){if(roleStart)return status('End the current roleplay before switching characters.');stopVoice();role=next==='chaz'?'chaz':'nova';document.querySelectorAll('.artlab-role-option').forEach(b=>b.classList.toggle('active',b.dataset.liveRole===role));$('artlabRoleName').textContent=roleInfo[role].name+' · '+roleInfo[role].role.toLowerCase();$('artlabRoleChatName').textContent=roleInfo[role].name;$('artlabRoleGoal').textContent=roleInfo[role].goal;$('artlabRoleMessages').replaceChildren();$('artlabRoleTime').textContent='05:00';$('artlabRoleFeedbackBox').hidden=true;status('Selected '+roleInfo[role].name+'. Press Start when ready.');connectAvatar()};
window.artlabStartRoleplay=function(){if(roleStart)return;stopVoice();roleStart=Date.now();roleHistory=[];$('artlabRoleMessages').replaceChildren();$('artlabRoleFeedbackBox').hidden=true;append(roleInfo[role].name,roleInfo[role].hello);$('artlabRoleStart').disabled=true;$('artlabRoleEnd').disabled=false;$('artlabRoleSend').disabled=false;$('artlabRoleMic').disabled=false;$('artlabRoleInput').disabled=false;roleTick=setInterval(clock,1000);clock();status('Conversation started. Press 🎙 Speak, finish your turn, and Nova/Chaz will respond.');voiceStatus('Microphone ready. Tap Speak to answer.');void sayAsCharacter(roleInfo[role].hello);};
async function postJSON(url,payload){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});let data;try{data=await r.json()}catch{throw Error('Server returned an unreadable response')}if(!r.ok)throw Error(data.error||'AI service unavailable');return data}
window.artlabSendRoleMessage=async function(ev){ev.preventDefault();const input=$('artlabRoleInput'),text=input.value.trim();if(!roleStart||roleBusy||!text||!secsLeft())return;input.value='';append('You',text);roleBusy=true;$('artlabRoleSend').disabled=true;status(roleInfo[role].name+' is responding…');
 try{const result=await postJSON('/api/artlab-roleplay',{mode:'reply',character:role,history:roleHistory.slice(-14),remainingSeconds:secsLeft()});if(!roleStart)return;append(roleInfo[role].name,result.reply);status('Your turn. Ask a question or make a suggestion.');
 void sayAsCharacter(result.reply);
 }catch(e){status('AI dialogue unavailable: '+e.message+'. Your previous turns are still saved.');}finally{roleBusy=false;if(roleStart&&secsLeft())$('artlabRoleSend').disabled=false;}};
window.artlabEndRoleplay=async function(){if(!roleStart)return;stopVoice();recordGeneration++;clearInterval(roleTick);roleTick=null;roleStart=0;if(roleRecorder?.state==='recording')roleRecorder.stop();$('artlabRoleStart').disabled=false;$('artlabRoleEnd').disabled=true;$('artlabRoleSend').disabled=true;$('artlabRoleMic').disabled=true;$('artlabRoleInput').disabled=true;const box=$('artlabRoleFeedbackBox');box.hidden=false;const holder=$('artlabRoleFeedback');holder.textContent='Reviewing your conversation…';status('Roleplay finished. You can start again later.');
 const yours=roleHistory.filter(x=>x.who==='You').map(x=>x.text);if(!yours.length){holder.textContent='No learner responses to assess. Try a short conversation first.';return}
 try{const result=await postJSON('/api/artlab-coach',{mode:'feedback',task:'roleplay-'+role,prompt:roleInfo[role].brief,text:yours.join('\n').slice(0,2300)});holder.replaceChildren();for(const [key,title] of [['interaction','Interaction'],['grammar','Grammar'],['vocabulary','Vocabulary'],['nextStep','Next step']]){const section=document.createElement('section');section.className='artlab-feedback-row artlab-feedback-'+key;const h=document.createElement('strong');h.textContent=title;const p=document.createElement('p');p.textContent=result[key]||'No additional comment.';section.append(h,p);holder.append(section)}const save=$('artlabRoleSaveGrammar');save.replaceChildren();(result.grammarItems||[]).filter(x=>typeof x==='string').slice(0,3).forEach(item=>{const button=document.createElement('button');button.type='button';button.className='action secondary';button.textContent='＋ Save: '+item;button.onclick=()=>{if(typeof window.artSaveGrammarItem==='function'){window.artSaveGrammarItem(item,button)}else status('Grammar Stock not available.')};save.append(button)})}catch(e){holder.textContent='AI feedback currently unavailable: '+e.message+'. The transcript can still be downloaded.'}
};
window.artlabExportRoleplay=()=>{const blob=new Blob([roleHistory.map(x=>x.who+': '+x.text).join('\n\n')],{type:'text/plain'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='artlab-'+role+'-roleplay.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
async function transcribeBlob(blob){const raw=new Uint8Array(await blob.arrayBuffer());if(raw.byteLength>4500000)throw Error('Audio too large; please record a shorter answer.');let binary='';for(let i=0;i<raw.length;i+=8192)binary+=String.fromCharCode(...raw.subarray(i,i+8192));const result=await postJSON('/api/artlab-transcribe',{audioBase64:btoa(binary),mimeType:blob.type});if(!result.text)throw Error('Empty transcription');return result.text}
window.artlabRoleRecord=async function(){
 const button=$('artlabRoleMic');if(!roleStart)return;
 if(roleRecorder?.state==='recording'){
  roleRecorder.stop();button.textContent='🎙 Speak';clearTimeout(roleRecordTimeout);return;
 }
 if(roleBusy)return status('Wait for '+roleInfo[role].name+' to finish replying.');
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)return status('Microphone recording is not supported here. Please type your answer.');
 stopVoice();
 try{
  roleStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  const token=++recordGeneration;
  roleRecording=[];
  const formats=['audio/webm;codecs=opus','audio/webm','audio/mp4'];const mime=formats.find(f=>MediaRecorder.isTypeSupported(f))||'';
  roleRecorder=new MediaRecorder(roleStream,mime?{mimeType:mime}:undefined);
  roleRecorder.ondataavailable=e=>{if(e.data.size)roleRecording.push(e.data)};
  roleRecorder.onstop=async()=>{
   const stream=roleStream;roleStream=null;stream?.getTracks().forEach(track=>track.stop());clearTimeout(roleRecordTimeout);
   button.textContent='🎙 Speak';
   if(!roleStart||token!==recordGeneration)return;
   const blob=new Blob(roleRecording,{type:roleRecorder.mimeType||'audio/webm'});
   if(!blob.size)return status('No audio recorded. Try speaking again.');
   const player=$('artlabRoleRecording');if(player.dataset.temporaryUrl)URL.revokeObjectURL(player.dataset.temporaryUrl);
   const url=URL.createObjectURL(blob);player.dataset.temporaryUrl=url;player.src=url;player.hidden=false;
   status('Transcribing your answer…');button.disabled=true;
   try{
    const transcript=await transcribeBlob(blob);
    if(!roleStart||token!==recordGeneration)return;
    $('artlabRoleInput').value=transcript;
    status('Heard: “'+transcript.slice(0,110)+'”. Sending to '+roleInfo[role].name+'…');
    $('artlabRoleForm').requestSubmit();
   }catch(e){status('Could not transcribe: '+e.message+'. You can replay the recording or type the reply.');}
   finally{if(roleStart)button.disabled=false}
  };
  roleRecorder.start();button.textContent='■ Finish speaking';
  status('🎙 Listening. Speak naturally, then press Finish speaking.');voiceStatus('Listening to you…');
  roleRecordTimeout=setTimeout(()=>{if(roleRecorder?.state==='recording')roleRecorder.stop()},75000);
 }catch(e){button.textContent='🎙 Speak';status('Microphone unavailable: '+e.message+'. Check Chrome site permissions or type your reply.');}
};
window.artlabTranscribeRoulette=async function(){const player=$('audioPreview');if(!player?.src)return $('recStatus-roulette').textContent='Record your answer using the Record button first.';$('recStatus-roulette').textContent='Transcribing your recording…';try{const blob=await (await fetch(player.src)).blob();const transcript=await transcribeBlob(blob);$('rouletteTranscript').value=transcript;$('recStatus-roulette').textContent='Transcript ready. Review or correct it, then request AI feedback.';}catch(e){$('recStatus-roulette').textContent='Transcription failed: '+e.message}};
// Hard-limit the existing oral-feedback recorder to two minutes for the Banksy task.
const previousRecord=window.artRecordToggle;
if(typeof previousRecord==='function'){
 let bankTimer=null;
 window.artRecordToggle=async function(task){const button=document.querySelector('[onclick="artRecordToggle(\''+task+'\')"]');const wasRecording=button?.textContent?.includes('Stop recording');await previousRecord(task);if(task==='banksy'){
  if(wasRecording){clearTimeout(bankTimer);bankTimer=null}
  else{clearTimeout(bankTimer);bankTimer=setTimeout(()=>{const b=document.querySelector('[onclick="artRecordToggle(\'banksy\')"]');if(b?.textContent?.includes('Stop recording'))previousRecord('banksy')},120000)}
 }};
}
// Bind selection and context for all checked tasks via the established Kostya mechanism.
window.addEventListener('webilang-artlab-answer-checked',ev=>{window.artlabLatestCheck=ev.detail});
connectAvatar();
})();
