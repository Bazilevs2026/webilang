/* Russian Unscripted: transport-only, four-player Code Names.
   Separate KV namespace. Does not modify the existing Video Games server. */
import {randomBytes} from 'node:crypto';
const PREFIX='webilang:ru-transport-codenames:v1:', TTL=21600;
const SEATS=['red_spymaster','red_guesser','blue_spymaster','blue_guesser'];
const WORDS=[
'поезд','вагон','билет','вокзал','метро','платформа','путь','касса','багаж','чемодан',
'пассажир','проводник','расписание','отправление','прибытие','пересадка','станция','остановка',
'автобус','трамвай','такси','самолёт','аэропорт','посадка','рейс','выход','вход','турникет',
'эскалатор','карта','маршрут','билетёр','водитель','машинист','светофор','дорога','мост',
'переход','улица','поворот','парковка','машина','велосипед','колесо','руль','островок',
'лестница','лифт','пешеход','осторожно','опоздание','очередь','контролёр','троллейбус',
'пригород','рельсы','туннель','движение','справочная','терминал','номер','место',
'сиденье','дверь','окно','проезд','покупка','навигатор','пробка','перрон','таксист',
'документы','паспорт','поездка','турист','граница','турникет','сумка','карман','время'];
const shuffle=src=>{const a=[...src];for(let i=a.length-1;i>0;i--){const j=randomBytes(2).readUInt16BE(0)%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const code=()=>Array.from(randomBytes(6),b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b%32]).join('');
const token=()=>randomBytes(22).toString('hex');
const norm=x=>String(x||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
function config(){const url=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL;const key=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;if(!url||!key)throw Error('Игровая база Redis не настроена на Vercel');return {url:url.replace(/\/$/,''),key}}
async function kv(cmd){const c=config();const r=await fetch(c.url,{method:'POST',headers:{Authorization:`Bearer ${c.key}`,'Content-Type':'application/json'},body:JSON.stringify(cmd)});const d=await r.json();if(!r.ok||d.error)throw Error(d.error||`Ошибка сохранения (${r.status})`);return d.result}
const load=async c=>{const x=await kv(['GET',PREFIX+c]);return x?JSON.parse(x):null};
async function save(s){s.updated=Date.now();s.version++;await kv(['SET',PREFIX+s.code,JSON.stringify(s),'EX',TTL])}
async function locked(c,fn){const key=PREFIX+c+':lock',t=token();if(await kv(['SET',key,t,'NX','PX',6000])!=='OK')throw Error('Кто-то сделал ход одновременно. Повторите попытку.');try{return await fn()}finally{await kv(['EVAL',"if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end",'1',key,t]).catch(()=>{})}}
function freshDuo(c){return {mode:'duo',code:c,version:1,created:Date.now(),updated:Date.now(),seats:[null,null],words:shuffle([...new Set(WORDS)]).slice(0,16),maps:[duoMap(),duoMap()],revealed:[Array(16).fill(false),Array(16).fill(false)],turn:0,phase:'clue',clue:null,remaining:0,score:0,history:[],finished:false,winner:null}}
function duoMap(){return shuffle([...Array(6).fill('target'),...Array(8).fill('neutral'),...Array(2).fill('assassin')])}
function fresh(c){return {code:c,version:1,created:Date.now(),updated:Date.now(),seats:[null,null,null,null],words:shuffle([...new Set(WORDS)]).slice(0,25),colors:shuffle([...Array(9).fill('red'),...Array(8).fill('blue'),...Array(7).fill('neutral'),'assassin']),open:Array(25).fill(false),turn:'red',phase:'clue',clue:null,remaining:0,history:[],finished:false,winner:null}}
function done(s){for(const color of ['red','blue'])if(s.colors.filter(x=>x===color).length===s.open.filter((x,i)=>x&&s.colors[i]===color).length){s.finished=true;s.winner=color;break}}
function view(s,seat){if(s.mode==='duo')return {mode:'duo',code:s.code,seat,joined:s.seats.filter(Boolean).length,seats:s.seats.map((p,i)=>({role:i===0?'Игрок А':'Игрок Б',name:p?.name||null})),words:s.words,open:s.revealed[s.turn],colors:s.maps[s.turn].map((v,i)=>seat===s.turn||s.revealed[s.turn][i]?v:null),turn:s.turn,phase:s.phase,clue:s.clue,remaining:s.remaining,score:s.score,history:s.history.slice(-18),finished:s.finished,winner:s.winner,version:s.version};const captain=seat===0||seat===2;return {code:s.code,seat,joined:s.seats.filter(Boolean).length,seats:s.seats.map((p,i)=>({role:SEATS[i],name:p?.name||null})),words:s.words,open:s.open,colors:s.colors.map((v,i)=>captain||s.open[i]?v:null),turn:s.turn,phase:s.phase,clue:s.clue,remaining:s.remaining,history:s.history.slice(-16),finished:s.finished,winner:s.winner,version:s.version}}
const err=(res,n,message)=>res.status(n).json({error:message});
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return err(res,405,'Используйте POST');try{
 const b=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
 if(b.action==='create'){let s=b.mode==='duo'?freshDuo(code()):fresh(code()),seat=Number.isInteger(b.seat)&&b.seat>=0&&b.seat<s.seats.length?b.seat:0;const t=token();s.seats[seat]={token:t,name:String(b.name||'Игрок').slice(0,28)};await kv(['SET',PREFIX+s.code,JSON.stringify(s),'EX',TTL,'NX']);return res.status(200).json({token:t,state:view(s,seat)})}
 const c=norm(b.code);if(c.length!==6)return err(res,400,'Укажите шестизначный код комнаты');
 if(b.action==='join')return await locked(c,async()=>{const s=await load(c);if(!s)return err(res,404,'Комната не найдена');if(s.finished)return err(res,409,'Игра уже закончена');const seat=Number(b.seat);if(!Number.isInteger(seat)||seat<0||seat>=s.seats.length)return err(res,400,'Выберите роль');if(s.seats[seat])return err(res,409,'Эта роль занята');const t=token();s.seats[seat]={token:t,name:String(b.name||'Игрок').slice(0,28)};s.history.push('К игре присоединился '+s.seats[seat].name);await save(s);return res.status(200).json({token:t,state:view(s,seat)})});
 return await locked(c,async()=>{const s=await load(c);if(!s)return err(res,404,'Комната не найдена');const seat=s.seats.findIndex(p=>p?.token&&p.token===b.token);if(seat<0)return err(res,403,'Недействительный игрок');if(b.action==='state')return res.status(200).json({state:view(s,seat)});
 if(b.action==='reset'){if(s.seats.filter(Boolean).length<2)return err(res,409,'Нужен хотя бы второй игрок');const n=s.mode==='duo'?freshDuo(c):fresh(c);n.seats=s.seats;n.version=s.version;n.history=['Новый раунд'];await save(n);return res.status(200).json({state:view(n,seat)})}
 if(s.mode==='duo'){
  if(s.finished)return err(res,409,'Игра закончена');
  if(s.seats.filter(Boolean).length!==2)return err(res,409,'Подождите второго игрока');
  if(b.action==='clue'){
    if(seat!==s.turn||s.phase!=='clue')return err(res,403,'Сейчас подсказку даёт другой игрок');
    const word=String(b.word||'').trim().toLocaleLowerCase('ru');
    if(!word||word.length>45||/\s/.test(word)||s.words.some(w=>w.toLocaleLowerCase('ru')===word))return err(res,400,'Одно слово, которого нет на поле');
    const count=Number(b.count);if(!Number.isInteger(count)||count<1||count>4)return err(res,400,'Укажите число от 1 до 4');
    s.clue={word,count};s.remaining=count+1;s.phase='guess';s.history.push((s.seats[seat]?.name||'Игрок')+': '+word+' — '+count);
  } else if(b.action==='guess'){
    if(seat===s.turn||s.phase!=='guess')return err(res,403,'Сейчас угадывает другой игрок');
    const i=Number(b.index),owner=s.turn;
    if(!Number.isInteger(i)||i<0||i>=16||s.revealed[owner][i])return err(res,400,'Карточка недоступна');
    s.revealed[owner][i]=true;const color=s.maps[owner][i];
    s.history.push(s.words[i]+': '+(color==='target'?'верно':color==='neutral'?'нейтральная карточка':'опасная карточка'));
    if(color==='target')s.score++;
    s.remaining--;
    if(color==='assassin'){s.finished=true;s.winner=owner===0?1:0}
    else if([0,1].every(n=>s.maps[n].every((v,i)=>v!=='target'||s.revealed[n][i]))){s.finished=true;s.winner='both'}
    else if(color!=='target'||s.remaining<=0){s.turn=1-owner;s.phase='clue';s.clue=null;s.remaining=0}
  } else if(b.action==='pass'){
    if(seat===s.turn||s.phase!=='guess')return err(res,403,'Передать ход может угадывающий');
    s.turn=1-s.turn;s.phase='clue';s.clue=null;s.remaining=0;s.history.push('Игроки поменялись ролями');
  } else return err(res,400,'Неизвестное действие');
  await save(s);return res.status(200).json({state:view(s,seat)});
 }
 if(s.finished)return err(res,409,'Игра закончена');if(s.seats.filter(Boolean).length!==4)return err(res,409,'Дождитесь всех четырёх игроков');
 const isCaptain=seat%2===0,team=seat<2?'red':'blue';if(team!==s.turn)return err(res,403,'Сейчас ход другой команды');
 if(b.action==='clue'){
  if(!isCaptain||s.phase!=='clue')return err(res,403,'Подсказку даёт капитан');const word=String(b.word||'').trim().toLocaleLowerCase('ru');if(!word||word.length>45||/\s/.test(word)||s.words.some(w=>w.toLocaleLowerCase('ru')===word))return err(res,400,'Одно слово, которого нет на поле');const count=Number(b.count);if(!Number.isInteger(count)||count<1||count>4)return err(res,400,'Число от 1 до 4');s.clue={word,count};s.remaining=count+1;s.phase='guess';s.history.push(`${team==='red'?'Красные':'Синие'}: ${word} — ${count}`);
 }else if(b.action==='guess'){
  if(isCaptain||s.phase!=='guess')return err(res,403,'Сейчас угадывает игрок команды');const i=Number(b.index);if(!Number.isInteger(i)||i<0||i>=25||s.open[i])return err(res,400,'Недоступная карточка');s.open[i]=true;const color=s.colors[i];s.history.push(`${s.words[i]}: ${color==='assassin'?'опасная карточка':color==='neutral'?'нейтральная':color==='red'?'красная':'синяя'}`);s.remaining--;
  if(color==='assassin'){s.finished=true;s.winner=team==='red'?'blue':'red'}else{done(s);if(!s.finished&&(color!==team||s.remaining<=0)){s.turn=team==='red'?'blue':'red';s.phase='clue';s.clue=null;s.remaining=0}}
 }else if(b.action==='pass'){
  if(isCaptain||s.phase!=='guess')return err(res,403,'Передать ход может угадывающий');s.turn=team==='red'?'blue':'red';s.phase='clue';s.clue=null;s.remaining=0;s.history.push('Ход передан');
 }else return err(res,400,'Неизвестное действие');await save(s);return res.status(200).json({state:view(s,seat)})});
 }catch(e){console.error('RU transport game:',e);return err(res,503,String(e.message||'Сервис недоступен').slice(0,200))}}
