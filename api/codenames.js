import { randomBytes } from "node:crypto";

const WORDS=[

    "console","loot box","reward","puzzle","take a break","in-game purchase","lose control","feel confident",
    "problem-solving","decision-making","addiction","healthy balance","game","player","friend","family",
    "school","college","class","homework","help","problem","time","break","money","choice","result","level",
    "skill","world","video","learn","talk","speak","conversation","support","confidence","control","limit","risk",
    "photography","camping","hobby","mother","parents","student","teacher","team","people","young","day","year",
    "hour","home","life","water","dog","outside","weekend","test","active","interest","motivation","thinking",
    "decision","digital","safe","practice","physical","coordination","power","skin","hero","fun","stop","playing",
    "sleep","tired","stress","social media","content","creator","streamer","podcaster","business","speech","therapy",
    "focus","escape","California","Xbox","sports","Call of Duty","Halo","YouTube","livestreaming","productive",
    "seizure","mic","operator","England","doctor","danger","sound","scared","save","interactive","engaging",
    "critical thinking","hand-eye coordination","digital skills","rewards","in-game purchases","gambling",
    "uncertain","entertainment","decision practice","communication","routine","schedule","shared room","balance","activity",
    "airport", "animal", "answer", "apartment", "apple", "arm", "baby", "bag", "ball", "banana", "bank", "bathroom", "beach", "bed", "bedroom", "bike", "bird", "birthday", "boat", "book", "bottle", "box", "boy", "bread", "breakfast", "bridge", "brother", "bus", "camera", "car", "cat", "chair", "cheese", "child", "city", "clock", "clothes", "cloud", "coffee", "computer", "country", "cow", "cup", "dance", "daughter", "desk", "dinner", "door", "dress", "driver", "ear", "egg", "email", "evening", "eye", "face", "farm", "father", "film", "fish", "flower", "food", "foot", "forest", "fork", "fruit", "garden", "girl", "glass", "grandfather", "grandmother", "grass", "hair", "hand", "hat", "head", "holiday", "hospital", "hotel", "house", "ice", "island", "jacket", "job", "juice", "key", "kitchen", "lake", "lamp", "letter", "library", "lunch", "map", "market", "meal", "milk", "minute", "morning", "mountain", "movie", "museum", "music", "name", "newspaper", "night", "office", "orange", "park", "party", "pen", "pencil", "phone", "photo", "picture", "pizza", "plane", "plant", "police", "potato", "rain", "restaurant", "rice", "river", "road", "room", "sand", "sea", "shirt", "shoe", "shop", "sister", "sky", "snow", "son", "station", "street", "summer", "table", "taxi", "tea", "ticket", "train", "tree", "trip", "vegetable", "village", "wall", "weather", "window", "winter", "woman", "wood", "angry", "beautiful", "big", "boring", "busy", "cheap", "clean", "closed", "cold", "cool", "dark", "different", "difficult", "dirty", "easy", "expensive", "fast", "favorite", "free", "friendly", "funny", "good", "happy", "hard", "heavy", "hot", "hungry", "important", "interesting", "kind", "late", "light", "long", "loud", "lucky", "modern", "new", "nice", "old", "open", "quiet", "ready", "rich", "sad", "short", "slow", "small", "strong", "sunny", "sweet", "tall", "thirsty", "warm", "wet", "young", "ask", "buy", "call", "carry", "catch", "change", "choose", "close", "cook", "draw", "drink", "drive", "eat", "finish", "find", "forget", "give", "go", "hear", "keep", "know", "laugh", "leave", "listen", "look", "love", "make", "meet", "pay", "play", "read", "remember", "ride", "run", "send", "show", "sing", "sit", "sleep", "smile", "start", "stay", "study", "swim", "take", "travel", "try", "use", "visit", "wait", "walk", "watch", "wear", "win", "work", "write", "afternoon", "autumn", "basket", "bath", "bus stop", "cake", "calendar", "castle", "center", "cinema", "coat", "corner", "doctor", "dream", "engine", "fire", "floor", "gift", "glove", "gold", "guest", "horse", "internet", "king", "knife", "language", "lesson", "moon", "mouse", "paper", "queen", "radio", "riverbank", "roof", "schoolbag", "ship", "sport", "star", "store", "sun", "supermarket", "swimming", "television", "tent", "town", "toy", "traffic", "umbrella", "week", "zoo"
];

const TTL_SECONDS=21600;
const PREFIX="webilang:codenames:";
const LOCK_PREFIX="webilang:codenames:lock:";

function redisConfig(){
  const url=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL||"";
  const token=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN||"";
  if(!url||!token)throw new Error("Live Codenames storage is not configured. Add an Upstash Redis integration in Vercel, then redeploy.");
  return {url:url.replace(/\/$/,""),token};
}

async function redis(command){
  const {url,token}=redisConfig();
  const r=await fetch(url,{
    method:"POST",
    headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},
    body:JSON.stringify(command)
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok||data?.error)throw new Error(data?.error||`Redis error (${r.status})`);
  return data.result;
}

function key(code){return PREFIX+code;}
function lockKey(code){return LOCK_PREFIX+code;}
function makeToken(){return randomBytes(18).toString("hex");}

function normCode(raw){
  let s=String(raw||"").trim().toUpperCase().replace(/\s+/g,"");
  if(s.startsWith("GAME-"))s=s.slice(5);
  s=s.replace(/[^A-Z0-9]/g,"");
  return s.length===6?"GAME-"+s:"";
}

function newCode(){
  const abc="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes=randomBytes(6);let s="";
  for(let i=0;i<6;i++)s+=abc[bytes[i]%abc.length];
  return"GAME-"+s;
}

function hashString(str){
  let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}
  h+=h<<13;h^=h>>>7;h+=h<<3;h^=h>>>17;h+=h<<5;return h>>>0;
}
function rng(seed){
  let a=seed>>>0;
  return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
}
function shuf(a,r){
  a=[...a];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

function createState(code){
  const r=rng(hashString(code));
  const words=shuf([...new Set(WORDS)],r).slice(0,25);
  const roles=shuf([...Array(9).fill("our"),...Array(8).fill("opponent"),...Array(7).fill("neutral"),"assassin"],r);
  const board=words.map((word,i)=>({word,role:roles[i],revealed:false}));
  const rr=rng(hashString(code+"|opponent-order"));
  const opponentOrder=shuf(board.map((c,i)=>({c,i})).filter(x=>x.c.role==="opponent").map(x=>x.i),rr);
  return {
    code,version:1,board,opponentOrder,ourLeft:9,opponentLeft:8,
    gameOver:false,win:false,clueActive:false,clueWord:"",clueNumber:0,guessesLeft:0,mustPass:false,
    teacherToken:makeToken(),studentToken:"",studentJoined:false,
    message:"Room created. Send the Game Code to the student.",messageType:"",
    createdAt:Date.now(),updatedAt:Date.now()
  };
}

async function getState(code){
  const raw=await redis(["GET",key(code)]);
  if(!raw)return null;
  try{return JSON.parse(raw);}catch(e){return null;}
}
async function saveState(state){
  state.updatedAt=Date.now();state.version=(Number(state.version)||0)+1;
  await redis(["SET",key(state.code),JSON.stringify(state),"EX",TTL_SECONDS]);
}
async function withLock(code,fn){
  const lk=lockKey(code),lt=makeToken();
  const ok=await redis(["SET",lk,lt,"NX","PX",3000]);
  if(ok!=="OK")throw new Error("The other player just made a move. Please try again.");
  try{return await fn();}
  finally{
    try{await redis(["EVAL","if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end","1",lk,lt]);}catch(e){}
  }
}

function auth(state,role,t){
  if(role==="teacher")return Boolean(t&&t===state.teacherToken);
  if(role==="student")return Boolean(t&&t===state.studentToken);
  return false;
}

function publicState(state,role){
  return {
    code:state.code,version:state.version,
    board:state.board.map(c=>({word:c.word,revealed:Boolean(c.revealed),role:role==="teacher"||c.revealed?c.role:null})),
    ourLeft:state.ourLeft,opponentLeft:state.opponentLeft,
    gameOver:Boolean(state.gameOver),win:Boolean(state.win),
    clueActive:Boolean(state.clueActive),clueWord:state.clueWord||"",clueNumber:Number(state.clueNumber)||0,
    guessesLeft:Number(state.guessesLeft)||0,mustPass:Boolean(state.mustPass),
    studentJoined:Boolean(state.studentJoined),
    message:state.message||"",messageType:state.messageType||"",updatedAt:state.updatedAt
  };
}

function validClue(state,raw){
  const w=String(raw||"").trim().toLowerCase();
  if(!w)return{ok:false,msg:"Enter one English clue word."};
  if(/\s/.test(w)||!/^[a-z][a-z'-]*$/i.test(w))return{ok:false,msg:"Use one English word only."};
  const words=state.board.filter(c=>!c.revealed).map(c=>c.word.toLowerCase());
  if(words.includes(w))return{ok:false,msg:"The clue cannot be one of the board words."};
  const parts=new Set(words.flatMap(x=>x.split(/[\s-]+/)));
  if(parts.has(w))return{ok:false,msg:"Choose another clue: it appears inside a board expression."};
  return{ok:true,word:w};
}

function finish(state,win,message){
  state.gameOver=true;state.win=Boolean(win);state.clueActive=false;state.mustPass=false;
  state.message=message;state.messageType=win?"win":"danger";
}
function claimOpponent(state){
  for(const idx of state.opponentOrder){
    const c=state.board[idx];
    if(c.role==="opponent"&&!c.revealed){c.revealed=true;state.opponentLeft--;return c.word;}
  }
  return null;
}

async function createRoom(){
  for(let tries=0;tries<8;tries++){
    const code=newCode();if(await getState(code))continue;
    const state=createState(code);
    await redis(["SET",key(code),JSON.stringify(state),"EX",TTL_SECONDS]);
    return{code,token:state.teacherToken,state:publicState(state,"teacher")};
  }
  throw new Error("Could not create a unique room. Try again.");
}

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store, no-cache, must-revalidate");
  try{
    if(req.method==="GET"){
      const code=normCode(req.query?.code),role=req.query?.role==="teacher"?"teacher":"student",t=String(req.query?.token||"");
      if(!code)return res.status(400).json({error:"Invalid Game Code."});
      const state=await getState(code);
      if(!state)return res.status(404).json({error:"This live room was not found or has expired."});
      if(!auth(state,role,t))return res.status(403).json({error:"This room session is not authorized."});
      return res.status(200).json({state:publicState(state,role)});
    }

    if(req.method!=="POST"){
      res.setHeader("Allow","GET, POST");
      return res.status(405).json({error:"Method not allowed"});
    }

    const body=req.body||{},action=String(body.action||"");
    if(action==="create")return res.status(200).json(await createRoom());

    const code=normCode(body.code);
    if(!code)return res.status(400).json({error:"Invalid Game Code."});

    if(action==="join"){
      return await withLock(code,async()=>{
        const state=await getState(code);
        if(!state)return res.status(404).json({error:"Game Code not found. Ask Teacher for the current code."});
        const reconnecting=Boolean(state.studentJoined&&state.studentToken);
        state.studentToken=makeToken();state.studentJoined=true;
        state.message=reconnecting
          ?"Student reconnected. The new Student tab now controls the Guesser."
          :"Student connected. Teacher can give the first clue.";
        state.messageType="win";
        await saveState(state);
        return res.status(200).json({code,token:state.studentToken,state:publicState(state,"student")});
      });
    }

    const role=body.role==="teacher"?"teacher":"student",t=String(body.token||"");
    return await withLock(code,async()=>{
      const state=await getState(code);
      if(!state)return res.status(404).json({error:"This live room was not found or has expired."});
      if(!auth(state,role,t))return res.status(403).json({error:"This room session is not authorized."});
      if(state.gameOver)return res.status(409).json({error:"The game is already over."});

      if(action==="clue"){
        if(role!=="teacher")return res.status(403).json({error:"Only Teacher can send a clue."});
        if(!state.studentJoined)return res.status(409).json({error:"Wait for Student to join the room first."});
        if(state.clueActive)return res.status(409).json({error:"Finish the current turn first."});
        const c=validClue(state,body.clue);if(!c.ok)return res.status(400).json({error:c.msg});
        state.clueWord=c.word;state.clueNumber=Math.max(1,Math.min(4,Number(body.number)||1));
        state.guessesLeft=state.clueNumber+1;state.clueActive=true;state.mustPass=false;
        state.message=`Teacher sent “${state.clueWord} · ${state.clueNumber}”. Student can guess now.`;state.messageType="";
        await saveState(state);
        return res.status(200).json({ok:true,message:"✓ Clue sent live to Student.",state:publicState(state,role)});
      }

      if(action==="guess"){
        if(role!=="student")return res.status(403).json({error:"Only Student clicks guesses."});
        if(!state.clueActive)return res.status(409).json({error:"Wait for Teacher's clue."});
        if(state.mustPass)return res.status(409).json({error:"This turn has ended. Press Pass turn."});
        const i=Number(body.index);
        if(!Number.isInteger(i)||i<0||i>=state.board.length)return res.status(400).json({error:"Invalid card."});
        const c=state.board[i];if(c.revealed)return res.status(409).json({error:"That card is already open."});
        c.revealed=true;

        if(c.role==="assassin")finish(state,false,"💀 Danger card! Your team loses the mission.");
        else if(c.role==="our"){
          state.ourLeft--;
          if(state.ourLeft<=0)finish(state,true,"🏆 Mission complete! You found all Our team words.");
          else{
            state.guessesLeft--;state.mustPass=state.guessesLeft<=0;
            state.message=state.mustPass?"✓ Our team word. No guesses remain — Student presses Pass turn.":"✓ Our team word! Student may guess again or press Pass turn.";
            state.messageType="win";
          }
        }else if(c.role==="opponent"){
          state.opponentLeft--;
          if(state.opponentLeft<=0)finish(state,false,"Opponent has claimed all of its words. Mission failed.");
          else{state.mustPass=true;state.message="Opponent word. Guessing stops — Student presses Pass turn.";state.messageType="";}
        }else{state.mustPass=true;state.message="Neutral word. Guessing stops — Student presses Pass turn.";state.messageType="";}

        await saveState(state);
        return res.status(200).json({ok:true,message:"✓ Guess synchronized.",state:publicState(state,role)});
      }

      if(action==="pass"){
        if(role!=="student")return res.status(403).json({error:"Student ends the guessing turn."});
        if(!state.clueActive)return res.status(409).json({error:"There is no active guessing turn."});
        state.clueActive=false;state.clueWord="";state.clueNumber=0;state.guessesLeft=0;state.mustPass=false;
        const claimed=claimOpponent(state);
        if(state.opponentLeft<=0)finish(state,false,"Opponent claimed its final word. Mission failed.");
        else{state.message=claimed?`Virtual Opponent claimed “${claimed}”. Teacher gives the next clue.`:"Teacher gives the next clue.";state.messageType="";}
        await saveState(state);
        return res.status(200).json({ok:true,message:"✓ Turn passed. Both screens updated.",state:publicState(state,role)});
      }

      return res.status(400).json({error:"Unknown game action."});
    });
  }catch(err){
    console.error("Codenames live error",err);
    const message=err?.message||"Live game server error";
    return res.status(message.includes("not configured")?503:500).json({error:message});
  }
}
