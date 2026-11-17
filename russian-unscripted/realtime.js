/* Webilang Art Lab-style WebRTC live conversation, adapted to A1–A2 Russian. */
(()=>{'use strict';
const $=id=>document.getElementById(id), names=['Максим','Анна'];
window.ruRoleChoice=0;
const RU_ROLE_PROMPTS=["ТЫ МАКСИМ, СОТРУДНИК СПРАВОЧНОЙ ЖЕЛЕЗНОДОРОЖНОГО ВОКЗАЛА. Ты стоишь за стойкой. Перед тобой незнакомый пассажир. Обращайся на «вы». Веди спокойный деловой разговор, не дружескую беседу.\nВАЖНО: ТЫ НЕ ЗНАЕШЬ, ЧТО ПРОИЗОШЛО С ПАССАЖИРОМ. Не предполагай, что он опоздал, пока он сам об этом не скажет. Не называй билет, следующий поезд, возврат и переоформление заранее.\nСАМАЯ ПЕРВАЯ РЕПЛИКА: «Здравствуйте. Слушаю вас.» И НИЧЕГО БОЛЬШЕ. Замолчи и слушай ответ.\nЕсли пассажир сказал, что опоздал, ответь одной короткой понятной репликой, например: «Понятно. У вас остался билет?» — затем ЖДИ ОТВЕТА. Если он ответил, что билет есть, скажи: «Покажите билет в кассе. Там скажут, можно ли его поменять.» — и снова жди. Не задавай сразу много вопросов. Не перечисляй категории билетов, документы, правила тарифа, возвраты и варианты поездки одним ответом.\nСведения о билетах и следующем поезде зависят от перевозчика. Не обещай, что старый билет подойдёт; не придумывай расписание или цену. В учебной ситуации касса находится у главного входа. Дай эту информацию только если пассажир попросит.\nТВОЙ СТИЛЬ: каждое высказывание обычно 8–15 русских слов, строго НЕ БОЛЕЕ 20 слов за ОДИН ответ. Это лимит, а не цель. Короткий естественный ответ из 2–5 слов тоже допустим. Одна мысль или максимум один вопрос, затем замолчи. Не монолог, не список, не лекция, не анализ. Реагируй только на последнюю реплику пассажира.\nНИКОГДА НЕ ГОВОРИ «Могу ещё чем-то помочь?» и не добавляй формальный вопрос на прощание. Если пассажир уходит: «До свидания».\nТы ведёшь ЖИВОЙ разговор на русском уровне A1–A2. Обычно одна реплика — 8–15 слов, никогда больше 20 слов. Одна мысль или один вопрос, затем остановись и слушай ученика. Никаких списков, длинных объяснений, проверочных вопросов, грамматических замечаний и длинного приветствия. Не выдавай информацию, пока студент её не спросил. Не повторяй «Могу ещё чем-то помочь?». Ты должен отвечать на последнее сказанное студентом, а не читать заранее заданную миссию.", "ТЫ АННА, ОБЫЧНАЯ ДЕВУШКА НА ОСТАНОВКЕ У ВОКЗАЛА. Ты не сотрудница метро или вокзала. Видишь человека, который потерялся. Начни только: «Здравствуйте! Вы, кажется, дорогу ищете?» И жди ответа.\nЕсли человек спросит про остановку «Парк», объясняй маленькими порциями: в условном учебном городе идёт автобус № 24, ехать три остановки без пересадки. Не придумывай реального расписания или цены.\nПосле того как он разберётся с транспортом, можешь естественно и ненавязчиво спросить, откуда он приехал или чем занимается в России. Только один вопрос за раз, с реакцией на ответ. Не допрашивай и не торопи.\nДружелюбный, живой тон. Говори коротко, обычно 8–15 слов, не больше 20. Одна мысль за раз. Не выдавай всю информацию сразу. Не произноси «Информация метро» и «Могу ещё чем-то помочь?».\nТы ведёшь ЖИВОЙ разговор на русском уровне A1–A2. Обычно одна реплика — 8–15 слов, никогда больше 20 слов. Одна мысль или один вопрос, затем остановись и слушай ученика. Никаких списков, длинных объяснений, проверочных вопросов, грамматических замечаний и длинного приветствия. Не выдавай информацию, пока студент её не спросил. Не повторяй «Могу ещё чем-то помочь?». Ты должен отвечать на последнее сказанное студентом, а не читать заранее заданную миссию."];

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
function close(s){if(!s)return;clearInterval(s.timer);clearTimeout(s.setupTimeout);try{s.incoming?.close()}catch{}try{s.channel?.close()}catch{}try{s.peer?.close()}catch{}for(const t of s.stream?.getTracks()||[])t.stop();const a=$('ruPartnerAudio');if(a){a.pause();a.srcObject=null}}
function log(s,who,text){if(!text?.trim())return;s.history.push({role:who==='student'?'student':'agent',text});const el=$('ruRoleTranscript');if(el){el.textContent=s.history.map(x=>(x.role==='student'?'Вы':names[s.choice])+': '+x.text).join('\n\n');el.hidden=!transcriptVisible}}
function send(s,msg){
 const candidates=[s.incoming,s.channel];
 const channel=candidates.find(c=>c?.readyState==='open');
 if(!channel)throw Error('Канал Qwen ещё не открыт');
 channel.send(JSON.stringify(msg));
}
function event(s,e){
 if(active!==s)return;
 if(e.type==='session.created'&&!s.configSent){
  s.configSent=true;
  note('Qwen подключён. Настраиваю русский голос…');
  send(s,{type:'session.update',session:{instructions:RU_ROLE_PROMPTS[s.choice],audio:{output:{voice:s.voice}}}});
  return;
 }
 if(e.type==='session.updated'&&!s.ready){
  const confirmed=e.session?.audio?.output?.voice||e.session?.voice||'';
  if(confirmed&&confirmed!==s.voice){note('Qwen выбрал другой голос: '+confirmed);return}
  s.ready=true;clearTimeout(s.setupTimeout);
  s.sender.replaceTrack(s.stream.getAudioTracks()[0]).catch(err=>note('Микрофон: '+err.message));
  s.started=Date.now();
  note('● '+names[s.choice]+' на связи.');
  s.timer=setInterval(()=>{if(active!==s)return;const left=300-(Date.now()-s.started)/1000;if($('ruRoleTime'))$('ruRoleTime').textContent=pretty(left);if(left<=0)window.ruEndRoleplay()},500);
  // Only the greeting; all following turns are truly improvised.
  const greeting=s.choice===0?'Скажи ТОЛЬКО «Здравствуйте. Слушаю вас.» Затем жди ответа пассажира.':'Скажи ТОЛЬКО «Здравствуйте! Вы, кажется, дорогу ищете?» Затем жди ответа человека.';
  send(s,{type:'response.create',response:{instructions:greeting}});
  return;
 }
 if(e.type==='input_audio_buffer.speech_started')note('🎙 Слушаю вас…');
 if(e.type==='input_audio_buffer.speech_stopped')note('Обрабатываю ваш ответ…');
 if(e.type==='response.created')note(names[s.choice]+' отвечает…');
 if(e.type==='response.done')note('Ваш ход — говорите свободно.');
 if(e.type==='error')note('Ошибка Qwen: '+(e.error?.message||'попробуйте ещё раз'));
 if(e.type==='conversation.item.input_audio_transcription.completed'&&e.transcript){
  const k='u:'+(e.item_id||e.transcript);if(!s.seen.has(k)){s.seen.add(k);log(s,'student',e.transcript)}
 }
 if(['response.output_audio_transcript.done','response.audio_transcript.done','response.output_audio_transcript.completed'].includes(e.type)&&e.transcript){
  const k='a:'+(e.item_id||e.response_id||e.transcript);if(!s.seen.has(k)){s.seen.add(k);log(s,'agent',e.transcript)}
 }
}

window.ruChooseRole=function(index){if(active)return note('Сначала завершите текущий разговор.');window.ruRoleChoice=index===1?1:0;window.render();setTimeout(window.ruConfigure3DAvatar,150)};
window.ruToggleCaptions=function(){transcriptVisible=!!$('ruCaptions')?.checked;const el=$('ruRoleTranscript');if(el)el.hidden=!transcriptVisible};
window.ruToggleTranscript=function(){transcriptVisible=!transcriptVisible;if($('ruRoleTranscript'))$('ruRoleTranscript').hidden=!transcriptVisible;if($('ruCaptions'))$('ruCaptions').checked=transcriptVisible};
window.ruEnableAudio=()=>{$('ruPartnerAudio')?.play().then(()=>{$('ruEnableAudio').hidden=true}).catch(e=>note(e.message))};
window.ruStartRoleplay=async function(){
 if(active)return;
 const s={id:++serial,choice:window.ruRoleChoice,history:[],seen:new Set(),peer:null,channel:null,incoming:null,sender:null,stream:null,timer:null,setupTimeout:null,started:0,configSent:false,ready:false,voice:''};
 active=s;setButtons(true);transcriptVisible=false;
 $('ruRoleTranscript').textContent='';$('ruRoleTranscript').hidden=true;$('ruRoleFeedback').replaceChildren();note('Разрешите доступ к микрофону…');
 try{
  if(!window.RTCPeerConnection||!navigator.mediaDevices?.getUserMedia)throw Error('Нужны HTTPS и поддержка WebRTC.');
  // Reuse exactly the same Qwen configuration endpoint as working Webilang modules.
  const confResponse=await fetch('/api/qwen-voice-session',{cache:'no-store'});
  if(!confResponse.ok)throw Error('Не удалось получить настройки голоса Qwen (HTTP '+confResponse.status+').');
  const config=await confResponse.json();
  // Prefer the configured Russian voice; female uses the existing Nova voice.
  s.voice=s.choice===0?(config.voices?.ru||config.voices?.en||'Aiden'):(config.voices?.nova||config.voices?.ru||'Tina');
  if(!s.voice)throw Error('В Qwen не задан подходящий голос.');
  s.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  if(active!==s){close(s);return}
  s.peer=new RTCPeerConnection();
  s.peer.ontrack=e=>{const a=$('ruPartnerAudio');if(!a)return;a.srcObject=e.streams[0];a.hidden=false;a.play().catch(()=>{$('ruEnableAudio').hidden=false;note('Нажмите «Включить звук»')})};
  // Qwen starts with a silent sendrecv transceiver; attach microphone after session.updated.
  s.sender=s.peer.addTransceiver('audio',{direction:'sendrecv'}).sender;
  s.channel=s.peer.createDataChannel('oai-events');
  const receive=raw=>{try{event(s,JSON.parse(raw))}catch(err){console.warn('Qwen event',err);note('Ошибка обработки Qwen: '+err.message)}};
  s.channel.onmessage=e=>receive(e.data);
  s.peer.ondatachannel=e=>{s.incoming=e.channel;s.incoming.onmessage=msg=>receive(msg.data)};
  s.setupTimeout=setTimeout(()=>{if(active===s&&!s.ready)note('Qwen не подтвердил голосовую сессию. Завершите разговор и попробуйте ещё раз.')},20000);
  const offer=await s.peer.createOffer();await s.peer.setLocalDescription(offer);
  const response=await fetch('/api/qwen-voice-session',{method:'POST',headers:{'Content-Type':'application/sdp'},body:s.peer.localDescription?.sdp||offer.sdp});
  if(!response.ok){let details=await response.text();try{const j=JSON.parse(details);details=j.error||details}catch{}throw Error('Qwen: '+details.slice(0,230))}
  if(active!==s){close(s);return}
  await s.peer.setRemoteDescription({type:'answer',sdp:await response.text()});
  note('Подключаю '+names[s.choice]+' через Qwen…');
 }catch(err){if(active===s){active=null;close(s);setButtons(false);note('Не удалось начать разговор: '+err.message)}}
};

window.ruEndRoleplay=async function(){const s=active;if(!s)return;active=null;close(s);setButtons(false);if($('ruRoleTime'))$('ruRoleTime').textContent='05:00';note('Разговор завершён.');const transcript=$('ruRoleTranscript');if(transcript){transcript.hidden=false;transcriptVisible=true}const box=$('ruRoleFeedback');if(!box)return;const turns=s.history.filter(x=>x.role==='student').map(x=>x.text);if(!turns.length){box.textContent='Нет распознанной речи ученика. Проверьте микрофон и повторите попытку.';return}box.textContent='Анализирую вашу речь…';try{const r=await fetch('/api/russian-unscripted-feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:turns.join('\n').slice(0,2800),type:'roleplay',scene:s.choice,context:s.history})});const data=await r.json();if(!r.ok)throw Error(data.error||'AI-feedback недоступен');if(window.ruRenderFeedback){window.ruRenderFeedback(box,data);return}box.replaceChildren();if(typeof window.ruRenderFeedback==='function'){window.ruRenderFeedback(box,data);return;}for(const [k,label] of [['interaction','Взаимодействие'],['grammar','Грамматика'],['vocabulary','Лексика'],['nextStep','Следующий шаг']]){const p=document.createElement('p');const b=document.createElement('b');b.textContent=label+': ';p.append(b,document.createTextNode(String(data[k]||'—')));box.append(p)}for(const item of (data.grammarItems||[]).slice(0,4)){const b=document.createElement('button');b.className='btn small alt';b.textContent='＋ Grammar Stock: '+item;b.onclick=()=>window.addGrammar(item);box.append(b)}}catch(err){box.textContent='AI-feedback недоступен: '+err.message+'. Транскрипт сохранён на странице для самостоятельного разбора.'}}
window.addEventListener('pagehide',()=>{if(active){close(active);active=null}});
})();
