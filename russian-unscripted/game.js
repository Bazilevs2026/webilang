/* Four-player Russian transport Code Names; separate from Video Games. */
(()=>{'use strict';
const ENDPOINT='/api/russian-unscripted-codenames';
const ROLES=['Красные · капитан','Красные · угадывающий','Синие · капитан','Синие · угадывающий'];
const $=id=>document.getElementById(id);
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='ru-transport-code-names-session-v2';
let session=null,state=null,poll=null,busy=false;
try{session=JSON.parse(sessionStorage.getItem(KEY)||'null')}catch{}
const colors={target:'#5ba786',red:'#ed6578',blue:'#8ca7fa',neutral:'#d1d1cb',assassin:'#31313b'};
const html=`<div class="ru-game-setup" id="ruGameSetup">
 <p class="ru-game-help">Играй вдвоём с другом или командами 2 на 2. Каждый игрок должен открыть модуль на своём устройстве.</p><div class="ru-game-settings"><label>Режим<select id="ruGameMode"><option value="duo">1 на 1 · меняемся ролями</option><option value="team">2 на 2 · две команды</option></select></label></div>
 <div class="ru-game-settings"><label>Ваше имя<input id="ruGameName" maxlength="28" placeholder="Имя игрока"></label><label>Ваша роль<select id="ruGameSeat"></select></label></div>
 <button class="btn" id="ruGameCreate">Создать комнату</button><div class="ru-game-join"><input id="ruGameJoinCode" maxlength="6" placeholder="Код комнаты (6 символов)" aria-label="Код комнаты"><button class="btn alt" id="ruGameJoin">Присоединиться</button></div>
 <p class="ru-game-note">В режиме 1 на 1 игроки меняются ролями после каждого хода; у каждого своя скрытая карта. В командах капитан показывает слово-подсказку и число.</p></div>
 <div id="ruGameLive" hidden><div class="ru-game-top"><div><h3 id="ruGameRoom"></h3><p id="ruGameRole"></p><p id="ruGameWaiting"></p></div><div class="ru-game-buttons"><button class="btn alt small" id="ruGameCopy">Скопировать приглашение</button><button class="btn alt small" id="ruGameNew">Новая партия</button><button class="btn alt small" id="ruGameLeave">Выйти</button></div></div>
 <div class="ru-game-score" id="ruGameScore"></div><div class="ru-game-board" id="ruGameBoard"></div>
 <div class="ru-game-controls" id="ruGameClueControls" hidden><label>Подсказка (одно слово)<input id="ruGameClue" placeholder="Например: городской"></label><label>Сколько слов?<select id="ruGameCount"><option>1</option><option>2</option><option>3</option><option>4</option></select></label><button class="btn" id="ruGameGiveClue">Дать подсказку</button></div>
 <div class="ru-game-turn" id="ruGameGuessControls" hidden><strong id="ruGameCurrentClue"></strong><p>Выбери связанные слова на поле. Если не уверен, передай ход.</p><button class="btn alt" id="ruGamePass">Закончить ход</button></div>
 <div class="ru-game-log"><h4>История ходов</h4><div id="ruGameHistory"></div></div></div>
 <p class="ru-game-error" id="ruGameError" role="status" aria-live="polite"></p>`;
const err=message=>{const x=$('ruGameError');if(x)x.textContent=message||''};
async function api(action,extra={}){const payload={action,...extra};if(session){payload.code=session.code;payload.token=session.token}const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});let d={};try{d=await r.json()}catch{}if(!r.ok)throw Error(d.error||`Ошибка ${r.status}`);return d}
async function action(name,data={}){if(busy)return;busy=true;try{err('');const d=await api(name,data);if(d.state){state=d.state;render()}}catch(e){err(e.message)}finally{busy=false}}
const party=()=>session&&state;
const currentRoles=()=>($('ruGameMode')?.value==='duo'?['Игрок А','Игрок Б']:ROLES);
function updateSeats(){const box=$('ruGameSeat');if(!box)return;const old=box.value;box.replaceChildren();currentRoles().forEach((role,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=role;box.append(opt)});if([...box.options].some(x=>x.value===old))box.value=old;}
function render(){if(!$('ruGameLive'))return;$('ruGameSetup').hidden=!!party();$('ruGameLive').hidden=!party();if(!party())return;
 $('ruGameRoom').textContent='Комната '+state.code;$('ruGameRole').textContent=state.mode==='duo'?['Игрок А','Игрок Б'][state.seat]:ROLES[state.seat];
 $('ruGameWaiting').textContent=state.joined<(state.mode==='duo'?2:4)?`Игроков: ${state.joined}/${state.mode==='duo'?2:4}. Ждём остальных.`:state.finished?`Игра закончена. Победили ${state.mode==='duo'?(state.winner==='both'?'оба игрока':state.winner===0?'игрок А':'игрок Б'):(state.winner==='red'?'красные':'синие')}!`:state.mode==='duo'?`Сейчас ${state.turn===0?'игрок А':'игрок Б'} даёт подсказку, ${state.turn===0?'игрок Б':'игрок А'} угадывает`: `Сейчас ходят ${state.turn==='red'?'красные':'синие'} · ${state.phase==='clue'?'капитан даёт подсказку':'игрок выбирает слова'}`;
 const red=state.open.filter((o,i)=>o&&state.colors[i]==='red').length,blue=state.open.filter((o,i)=>o&&state.colors[i]==='blue').length;
 $('ruGameScore').innerHTML=state.mode==='duo'?`<span>Найдено слов: ${state.score}/12</span><span>Игроков: ${state.joined}/2</span><span>Ходы по очереди</span>`:`<span>🔴 Красные: ${red}/9</span><span>🔵 Синие: ${blue}/8</span><span>Игроков: ${state.joined}/4</span>`;
 const duo=state.mode==='duo',isCaptain=duo?state.seat===state.turn:state.seat%2===0,team=state.seat<2?'red':'blue',myTurn=duo?true:team===state.turn,ready=state.joined===(duo?2:4),guess=myTurn&&!isCaptain&&state.phase==='guess'&&ready&&!state.finished;
 $('ruGameBoard').classList.toggle('duo',duo);$('ruGameBoard').replaceChildren();state.words.forEach((word,i)=>{const b=document.createElement('button');b.type='button';b.className='ru-game-tile';b.textContent=word;const color=state.colors[i];if(color)b.style.setProperty('--tile-color',colors[color]);if(color)b.classList.add('ru-game-colored');if(state.open[i])b.classList.add('ru-game-open');if(isCaptain&&!state.open[i])b.classList.add('ru-game-secret');b.disabled=!guess||state.open[i];b.setAttribute('aria-label',word+(state.open[i]?' — открыто':''));if(guess)b.onclick=()=>action('guess',{index:i});$('ruGameBoard').append(b)});
 const clueTurn=myTurn&&isCaptain&&state.phase==='clue'&&ready&&!state.finished;$('ruGameClueControls').hidden=!clueTurn;$('ruGameGuessControls').hidden=!guess;
 $('ruGameCurrentClue').textContent=state.clue?`Подсказка: ${state.clue.word} — ${state.clue.count}. Осталось попыток: ${state.remaining}`:'';
 $('ruGameHistory').replaceChildren();for(const item of (state.history||[])){const p=document.createElement('p');p.textContent=item;$('ruGameHistory').append(p)}
}
async function start(create){if(busy)return;busy=true;try{err('');const name=$('ruGameName').value.trim()||'Игрок';const seat=Number($('ruGameSeat').value);const payload={name,seat,mode:$('ruGameMode').value};if(!create)payload.code=$('ruGameJoinCode').value.trim();const d=await api(create?'create':'join',payload);session={code:d.state.code,token:d.token};sessionStorage.setItem(KEY,JSON.stringify(session));state=d.state;render();startPolling();}catch(e){err(e.message)}finally{busy=false}}
function startPolling(){if(poll)clearInterval(poll);poll=setInterval(async()=>{if(!session||document.hidden||!$('ruGameLive'))return;try{const d=await api('state');if(!state||d.state.version!==state.version){state=d.state;render()}}catch(e){err(e.message)}},2100)}
function install(){if(!$('ruGameHost'))return;$('ruGameHost').innerHTML=html;
 $('ruGameMode').onchange=updateSeats;updateSeats();$('ruGameCreate').onclick=()=>start(true);$('ruGameJoin').onclick=()=>start(false);
 $('ruGameGiveClue').onclick=()=>action('clue',{word:$('ruGameClue').value,count:Number($('ruGameCount').value)});
 $('ruGamePass').onclick=()=>action('pass');$('ruGameNew').onclick=()=>{if(confirm('Начать новую партию для всех участников?'))action('reset')};
 $('ruGameLeave').onclick=()=>{session=null;state=null;sessionStorage.removeItem(KEY);if(poll){clearInterval(poll);poll=null}render()};
 $('ruGameCopy').onclick=async()=>{const url=location.origin+location.pathname+'?game='+encodeURIComponent(state.code)+'#game';try{await navigator.clipboard.writeText(url);err('Ссылка скопирована. Передайте её партнёрам.')}catch{prompt('Скопируйте ссылку:',url)}};
 const code=new URLSearchParams(location.search).get('game');if(code&&!session)$('ruGameJoinCode').value=code;
 if(session){api('state').then(d=>{state=d.state;render();startPolling()}).catch(e=>{err('Не удалось восстановить комнату: '+e.message);session=null;sessionStorage.removeItem(KEY);render()})}else render();}
window.ruGameMount=install;
if(new URLSearchParams(location.search).has('game')){try{window.go?.(9)}catch(e){console.warn('Game navigation:',e)}}
window.addEventListener('pagehide',()=>{if(poll)clearInterval(poll)});
})();
