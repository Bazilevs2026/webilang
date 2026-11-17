/* Webilang Art Lab-style WebRTC live conversation, adapted to A1–A2 Russian. */
(()=>{'use strict';
const $=id=>document.getElementById(id), names=['Максим','Анна'];
window.ruRoleChoice=0;
window.ruConfigure3DAvatar=function(){
 const f=$('ruLiveAvatarFrame');if(!f)return;
 const isAnna=window.ruRoleChoice===1;
 const mode=isAnna?'nova':'chaz';
 const background=isAnna?'/russian-unscripted/assets/bus-stop-background.jpg':'/russian-unscripted/assets/station-background.jpg';
 const adjust=()=>{try{
  const d=f.contentDocument;if(!d)return;
  let style=d.getElementById('ruPortraitOnly');
  if(!style){style=d.createElement('style');style.id='ruPortraitOnly';d.head.append(style)}
  // The style exists solely within the Russian Unscripted iframe; Art Lab and Gender Roles are unchanged.
  style.textContent=`body{overflow:hidden!important}.wrap,.layout{padding:0!important;margin:0!important;max-width:none!important;width:100%!important}.layout{display:block!important}.panel,header,footer,.stageTag{display:none!important}.stage{height:100vh!important;min-height:0!important;border:0!important;border-radius:0!important;background:#dedbd5 url("${background}") center center / cover no-repeat!important}`;
  const select=d.getElementById('modelMode');if(select&&select.value!==mode){select.value=mode;select.dispatchEvent(new Event('change',{bubbles:true}))}
  const cam=d.getElementById('cameraMode');if(cam&&cam.value!=='close'){cam.value='close';cam.dispatchEvent(new Event('change',{bubbles:true}))}
 }catch(e){console.warn('3D portrait not ready',e)}};
 f.addEventListener('load',adjust,{once:true});adjust();
};

let active=null,serial=0,transcriptVisible=false;window.ruRoleIsActive=()=>!!active;
const pretty=n=>`${String(Math.floor(Math.max(0,n)/60)).padStart(2,'0')}:${String(Math.floor(Math.max(0,n)%60)).padStart(2,'0')}`;
function note(s){if($('ruLiveState'))$('ruLiveState').textContent=s}
function setButtons(on){if($('ruRoleStart'))$('ruRoleStart').disabled=on;if($('ruRoleEnd'))$('ruRoleEnd').disabled=!on}
function close(s){if(!s)return;clearInterval(s.timer);try{s.channel?.close()}catch{}try{s.peer?.close()}catch{}for(const t of s.stream?.getTracks()||[])t.stop();const a=$('ruPartnerAudio');if(a){a.pause();a.srcObject=null}}
function log(s,who,text){if(!text?.trim())return;s.history.push({role:who==='student'?'student':'agent',text});const el=$('ruRoleTranscript');if(el){el.textContent=s.history.map(x=>(x.role==='student'?'Вы':names[s.choice])+': '+x.text).join('\n\n');el.hidden=!transcriptVisible}}
function event(s,e){if(active!==s)return;
 if(e.type==='input_audio_buffer.speech_started')note('🎙 Слушаю вас…');
 if(e.type==='input_audio_buffer.speech_stopped')note('Обрабатываю ваш ответ…');
 if(e.type==='response.created')note(names[s.choice]+' отвечает…');
 if(e.type==='response.done')note('Ваш ход — говорите свободно.');
 if(e.type==='error')note('Ошибка голосового сервиса: '+(e.error?.message||'повторите подключение'));
 if(e.type==='conversation.item.input_audio_transcription.completed'&&e.transcript){const k='u:'+e.item_id;if(!s.seen.has(k)){s.seen.add(k);log(s,'student',e.transcript)}}
 if((e.type==='response.output_audio_transcript.done'||e.type==='response.audio_transcript.done')&&e.transcript){const k='a:'+(e.item_id||e.response_id||e.transcript);if(!s.seen.has(k)){s.seen.add(k);log(s,'agent',e.transcript)}}
}
window.ruChooseRole=function(index){if(active)return note('Сначала завершите текущий разговор.');window.ruRoleChoice=index===1?1:0;window.render();setTimeout(window.ruConfigure3DAvatar,150)};
window.ruToggleCaptions=function(){transcriptVisible=!!$('ruCaptions')?.checked;const el=$('ruRoleTranscript');if(el)el.hidden=!transcriptVisible};
window.ruToggleTranscript=function(){transcriptVisible=!transcriptVisible;if($('ruRoleTranscript'))$('ruRoleTranscript').hidden=!transcriptVisible;if($('ruCaptions'))$('ruCaptions').checked=transcriptVisible};
window.ruEnableAudio=()=>{$('ruPartnerAudio')?.play().then(()=>{$('ruEnableAudio').hidden=true}).catch(e=>note(e.message))};
window.ruStartRoleplay=async function(){if(active)return;
 const s={id:++serial,choice:window.ruRoleChoice,history:[],seen:new Set(),peer:null,channel:null,stream:null,timer:null,started:0};active=s;setButtons(true);transcriptVisible=false;$('ruRoleTranscript').textContent='';$('ruRoleTranscript').hidden=true;$('ruRoleFeedback').replaceChildren();note('Разрешите доступ к микрофону…');
 try{
  if(!window.RTCPeerConnection||!navigator.mediaDevices?.getUserMedia)throw Error('Для разговора необходимы HTTPS и поддержка WebRTC.');
  s.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});if(active!==s){close(s);return}
  s.peer=new RTCPeerConnection();s.peer.ontrack=e=>{const a=$('ruPartnerAudio');if(!a)return;a.srcObject=e.streams[0];a.hidden=false;a.play().catch(()=>{$('ruEnableAudio').hidden=false;note('Нажмите «Включить звук»')})};
  for(const track of s.stream.getAudioTracks())s.peer.addTrack(track,s.stream);
  s.channel=s.peer.createDataChannel('oai-events');s.channel.onmessage=e=>{try{event(s,JSON.parse(e.data))}catch(err){console.warn(err)}};
  s.channel.onopen=()=>{if(active!==s)return;s.started=Date.now();note('● Разговор начался. Говорите естественно.');s.timer=setInterval(()=>{if(active!==s)return;const left=300-(Date.now()-s.started)/1000;if($('ruRoleTime'))$('ruRoleTime').textContent=pretty(left);if(left<=0)window.ruEndRoleplay()},500);s.channel.send(JSON.stringify({type:'response.create',response:{instructions:s.choice===0?'Ты сотрудник справочной вокзала Максим. Начни строго в роли: «Здравствуйте! Справочная вокзала. Чем могу помочь?» После этого жди запроса пассажира.':'Ты сотрудница информационной службы метро Анна. Начни строго в роли: «Здравствуйте! Информация метро. Вам подсказать маршрут?» Затем слушай пассажира.'}}))};
  const offer=await s.peer.createOffer();await s.peer.setLocalDescription(offer);
  const r=await fetch('/api/russian-unscripted-realtime-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sdp:s.peer.localDescription?.sdp||offer.sdp,character:s.choice?'nova':'chaz'})});if(!r.ok){let body={};try{body=await r.json()}catch{}throw Error(body.error||'Realtime API не отвечает')}
  if(active!==s){close(s);return}await s.peer.setRemoteDescription({type:'answer',sdp:await r.text()});note('Подключение к '+names[s.choice]+'…');
 }catch(err){if(active===s){active=null;close(s);setButtons(false);note('Не удалось начать разговор: '+err.message)}}
};
window.ruEndRoleplay=async function(){const s=active;if(!s)return;active=null;close(s);setButtons(false);if($('ruRoleTime'))$('ruRoleTime').textContent='05:00';note('Разговор завершён.');const transcript=$('ruRoleTranscript');if(transcript){transcript.hidden=false;transcriptVisible=true}const box=$('ruRoleFeedback');if(!box)return;const turns=s.history.filter(x=>x.role==='student').map(x=>x.text);if(!turns.length){box.textContent='Нет распознанной речи ученика. Проверьте микрофон и повторите попытку.';return}box.textContent='Анализирую вашу речь…';try{const r=await fetch('/api/russian-unscripted-feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:turns.join('\n').slice(0,2800),type:'roleplay',scene:s.choice,context:s.history})});const data=await r.json();if(!r.ok)throw Error(data.error||'AI-feedback недоступен');box.replaceChildren();for(const [k,label] of [['interaction','Interaction'],['grammar','Grammar'],['vocabulary','Vocabulary'],['nextStep','Next step']]){const p=document.createElement('p');const b=document.createElement('b');b.textContent=label+': ';p.append(b,document.createTextNode(String(data[k]||'—')));box.append(p)}for(const item of (data.grammarItems||[]).slice(0,4)){const b=document.createElement('button');b.className='btn small alt';b.textContent='＋ Grammar Stock: '+item;b.onclick=()=>window.addGrammar(item);box.append(b)}}catch(err){box.textContent='AI-feedback недоступен: '+err.message+'. Транскрипт сохранён на странице для самостоятельного разбора.'}}
window.addEventListener('pagehide',()=>{if(active){close(active);active=null}});
})();
