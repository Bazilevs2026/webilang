import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '/student-memory/config.js';
import { normal, wordOf, readWords, insertWord, deleteWord } from '/student-memory/word-stock.js';

const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
const $ = id => document.getElementById(id);
let user = null, rows = [], selected = '', epoch = 0, revision = 0, controller = null, queue = Promise.resolve(), ready = false;
const staged = new Map(); let savingStage = false;

const GUEST_WORDS_KEY = 'webilang-art-lab-guest-words-v1';
function loadGuestRows() {
  let words=[];
  try { const saved=JSON.parse(localStorage.getItem(GUEST_WORDS_KEY)||'[]'); if(Array.isArray(saved))words=saved; } catch {}
  return words.filter(x=>typeof x==='string'&&x.trim()&&x.length<=130).slice(0,500)
    .map((word,index)=>({id:'guest-'+index,user_id:null,module:'Art Lab',content:{type:'words',item:{word:word.trim(),source:'Art Lab'}}}));
}
function persistGuestRows() {
  try { localStorage.setItem(GUEST_WORDS_KEY,JSON.stringify(rows.map(wordOf).filter(Boolean).slice(0,500))); return true; }
  catch { return false; }
}
function showStockScope() {
  const heading=document.querySelector('#p8 .card.mint > h3');
  if(heading)heading.textContent=user?'Your saved words · all connected modules':'Your saved words · saved on this device';
}
function loadGuestWordStock() {
  user=null; rows=loadGuestRows(); ready=true; selected=rows.some(r=>normal(wordOf(r))===selected)?selected:'';
  render();renderStaged();showStockScope();
  status('Guest mode · words saved in this browser. No sign-in needed. To sync across devices, sign in to Webilang Global.');
}

const pendingSelectionKey = 'webilang-art-lab-pending-words-v1';
// Keep unsaved selections while a student visits the sign-in page in the same tab.
try {
  const pending = JSON.parse(sessionStorage.getItem(pendingSelectionKey) || 'null');
  if (pending && Date.now() - pending.savedAt < 24*60*60*1000 && Array.isArray(pending.words)) {
    for (const item of pending.words.slice(0,80)) {
      const word = String(item||'').trim().replace(/\s+/g,' ');
      if(word && word.length<=130) staged.set(normal(word),word);
    }
  }
} catch {}
function rememberSelection() {
  try {
    if (staged.size) sessionStorage.setItem(pendingSelectionKey, JSON.stringify({savedAt:Date.now(),words:[...staged.values()]}));
    else sessionStorage.removeItem(pendingSelectionKey);
  } catch {}
}

const status = message => { $('wordStockStatus').textContent = message; $('comicWordStatus').textContent = message; };
function renderStaged(message) {
  rememberSelection();
  const list = $('comicSelectedWords'); if (!list) return;
  list.replaceChildren(); $('readingSelectedWords')?.replaceChildren();
  for (const [key, word] of staged) {
    const chip = document.createElement('span'); chip.className = 'staged-word-chip';
    const label = document.createElement('span'); label.textContent = word;
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×';
    remove.setAttribute('aria-label', 'Remove '+word+' from selection');
    remove.onclick = () => { staged.delete(key); renderStaged('Removed “'+word+'” from selection.'); };
    chip.append(label,remove); list.append(chip);
    if ($('readingSelectedWords')) {const clone=chip.cloneNode(true);clone.querySelector('button').onclick=()=>{staged.delete(key);renderStaged('Removed “'+word+'” from selection.');};$('readingSelectedWords').append(clone);}
  }
  $('comicSelectedCount').textContent = staged.size+' selected';
  if ($('readingSelectedCount')) $('readingSelectedCount').textContent = staged.size+' selected';
  $('comicSaveWords').disabled = !staged.size || savingStage;
  $('comicClearSelection').disabled = !staged.size || savingStage;
  if ($('readingSaveWords')) $('readingSaveWords').disabled = !staged.size || savingStage;
  if ($('readingClearSelection')) $('readingClearSelection').disabled = !staged.size || savingStage;
  document.querySelectorAll('.selectable-word,.vocab-select').forEach(button => { button.classList.toggle('word-staged', staged.has(normal(button.dataset.expression || button.textContent))); });
  if (message !== undefined) { $('comicWordStatus').textContent = message; if ($('readingWordStatus')) $('readingWordStatus').textContent=message; }
}
function stageWord(value) {
  const word = String(value||'').trim().replace(/\s+/g,' '), key = normal(word);
  if (!key || word.length > 130) return;
  if (!staged.has(key)) staged.set(key,word);
  renderStaged('✓ “'+word+'” selected. '+staged.size+' word(s) ready. Tap Save selected words to keep them in your account.');
  document.querySelectorAll('.selectable-word,.vocab-select').forEach(button => {
    const active = staged.has(normal(button.dataset.expression||button.textContent));
    button.classList.toggle('word-staged',active);
    if (active) button.setAttribute('aria-pressed','true');
  });
}
function clearStaged(){staged.clear();document.querySelectorAll('.word-staged').forEach(el=>el.classList.remove('word-staged'));renderStaged('Selection cleared. Saved vocabulary was not deleted.');}
async function saveStaged(){
  if(savingStage || !staged.size)return;
  savingStage=true;const items=[...staged.values()];renderStaged('Saving '+items.length+' word(s)…');
  try {
    for (const word of items) {
      // Add waits for the authenticated Supabase write; never clear on failed save.
      await add(word);
      staged.delete(normal(word));
      renderStaged('Saved “'+word+'” to your account.');
    }
    renderStaged('✓ Saved '+items.length+' word(s) to My Word Stock '+(user?'in your account.':'on this device. No sign-in needed.')+' Open My Word Stock to practise.');
  } catch(error){renderStaged('Could not save all words: '+(error.message||'Please retry.')+' Unsaved words remain selected.');}
  finally{savingStage=false;renderStaged();}
}
$('comicSaveWords').addEventListener('click',saveStaged);
$('comicClearSelection').addEventListener('click',clearStaged);
$('readingSaveWords')?.addEventListener('click',saveStaged);
$('readingClearSelection')?.addEventListener('click',clearStaged);
window.artStageWord=stageWord;
function clear() {
  stopDictation();
  if('speechSynthesis' in window) window.speechSynthesis.cancel();
  document.querySelectorAll('.word-stock-row[data-temporarily-hidden]').forEach(row=>{ row.hidden=false; row.removeAttribute('data-temporarily-hidden'); });
  revision++; controller?.abort(); controller = null;
  $('wordExercise').replaceChildren(); $('wordPracticeStatus').textContent = '';
  $('wordPracticeGenerate').disabled = !ready || !selected;
}
function render() {
  const groups = new Map();
  for (const row of rows) { const key = normal(wordOf(row)); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(row); }
  if (!groups.has(selected)) { selected = ''; clear(); }
  $('savedWords').replaceChildren();
  for (const [key, records] of groups) {
    const word = wordOf(records[0]), row = document.createElement('div'); row.className = 'word-stock-row';
    const choose = document.createElement('button'); choose.type = 'button'; choose.className = 'word-stock-select'; choose.textContent = word;
    choose.setAttribute('aria-pressed', String(key === selected));
    choose.onclick = () => { if (selected !== key) { selected = key; clear(); render(); } };
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'word-stock-remove'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', `Remove ${word}`);
    remove.onclick = () => {
      if (!confirm(user ? `Remove “${word}” from your account Word Stock? This also removes its saved records from the listed modules.` : `Remove “${word}” from My Word Stock on this device?`)) return;
      if (!user) { rows=rows.filter(r=>normal(wordOf(r))!==key); persistGuestRows(); render();status(`Removed “${word}” from this device.`);return; }
      const owner = user?.id, version = epoch;
      enqueue(async () => {
        await verify(owner, version);
        for (const record of records) { await verify(owner, version); await deleteWord(db, owner, record.id); }
        if (version === epoch) { rows = rows.filter(r => !records.some(item => item.id === r.id)); render(); status(`Removed “${word}”.`); }
      });
    };
    // Pronunciation replaces the repeated module name. Listening never changes selection.
    const audio = document.createElement('button'); audio.type='button'; audio.className='word-stock-audio';
    audio.textContent='🔊 Listen'; audio.setAttribute('aria-label', 'Hear the pronunciation of '+word);
    audio.title='Listen to '+word;
    audio.onclick=()=>listenTo(word, $('wordPracticeStatus'));
    row.append(choose, audio, remove); $('savedWords').append(row);
  }
  $('wordPracticeHeading').textContent = selected ? `Practise: ${wordOf(groups.get(selected)[0])}` : 'Select one word to practise';
  $('wordPracticeGenerate').disabled = !ready || !selected;
  document.querySelectorAll('.vocab-select,.selectable-word').forEach(button => {
    const saved = groups.has(normal(button.dataset.expression || button.textContent));
    button.classList.toggle('picked', saved); button.setAttribute('aria-pressed', String(saved));
  });
}
function enqueue(fn) {
  const version = epoch;
  const result = queue.then(fn);
  queue = result.catch(error => { if (version === epoch) status(error.message || 'Word Stock is unavailable. Please retry.'); });
  return result;
}
async function verify(owner, version) {
  const { data, error } = await db.auth.getUser();
  if (error || !owner || data?.user?.id !== owner || epoch !== version) throw Error('Sign in to Webilang Global and try again.');
}
async function refresh() {
  const version=epoch;
  let authenticatedUser=null;
  try {
    const {data,error}=await db.auth.getUser();
    if(!error) authenticatedUser=data?.user||null;
  } catch {}
  if(version!==epoch)return;
  if(!authenticatedUser) { loadGuestWordStock(); return; }
  try {
    user=authenticatedUser;ready=false;
    const loaded=await readWords(db,user.id);
    if(version!==epoch)return;
    rows=loaded;ready=true;
    if(!rows.some(row=>normal(wordOf(row))===selected))selected='';
    render();renderStaged();showStockScope();
    status('Your account Word Stock · saved vocabulary from all connected modules.');
  } catch(error) {
    if(version===epoch) {
      loadGuestWordStock();
      status('Account Word Stock could not sync. Guest practice is available on this device; signed-in words have not been changed.');
    }
  }
}
function add(value) {
  const word = String(value || '').trim().replace(/\s+/g, ' '), owner = user?.id, version = epoch;
  if (!word || word.length > 130) return Promise.resolve();
  if (!user) {
    if(!rows.some(row=>normal(wordOf(row))===normal(word)))rows.unshift({
      id:'guest-'+Date.now()+'-'+rows.length,user_id:null,module:'Art Lab',
      content:{type:'words',item:{word,source:'Art Lab'}}
    });
    const stored=persistGuestRows();ready=true;render();
    status(stored ? `“${word}” saved on this device. Select it in My Word Stock to practise.` :
      `“${word}” added for this session. Your browser blocked local storage, so it may not remain after closing.`);
    return Promise.resolve();
  }
  return enqueue(async () => {
    await verify(owner, version);
    const loaded = await readWords(db, owner);
    if (version !== epoch) return;
    const exists = loaded.some(row => normal(wordOf(row)) === normal(word));
    if (!exists) { const row = await insertWord(db, owner, word); if (version !== epoch) return; loaded.unshift(row); }
    rows = loaded; ready = true; render(); status(`“${word}” ${exists ? 'is already saved' : 'saved to your account'}. Select it in My Word Stock to practise.`);
  });
}
async function request(payload, signal) {
  const headers={'Content-Type':'application/json'};
  // Signed-in learners keep the existing authenticated API flow; guests can practise too.
  if(user) {
    try {
      const {data:{session}}=await db.auth.getSession();
      if(session?.user?.id===user.id)headers.Authorization='Bearer '+session.access_token;
    } catch {}
  }
  const response=await fetch('/api/artlab-word-practice',{
    method:'POST',signal,headers,body:JSON.stringify(payload)
  });
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'AI practice is unavailable.');
  return data;
}
function equivalentRetrieval(actual, expected) {
  const tidy = value => normal(value).replace(/[.!?]+$/, '').replace(/\s+/g, ' ');
  const got = tidy(actual), wanted = tidy(expected);
  if (got === wanted) return true;
  // Students may use a grammatically suitable inflection of the same English word.
  if (wanted.length < 4) return false;
  return [wanted+'s',wanted+'es',wanted.replace(/e$/,'')+'ing',wanted+'ing',wanted+'ed',wanted.replace(/e$/,'')+'ed'].includes(got);
}
// Speech controls are additive: the existing Word Stock playback and saving logic are untouched.
// Browser-native speech recognition puts text into the same editable answer field as typing.
let activeDictation = null;
function stopDictation(){
  if(activeDictation){ try { activeDictation.stop(); } catch {} activeDictation=null; }
}
function listenTo(text, feedback){
  if(!('speechSynthesis' in window)){
    feedback.textContent='Audio is unavailable in this browser. You can still read the question.';
    return;
  }
  window.speechSynthesis.cancel();
  const voice=new SpeechSynthesisUtterance(text);
  voice.lang='en-US'; voice.rate=0.82; voice.pitch=1;
  window.speechSynthesis.speak(voice);
}
function addDictation(input, controls, feedback){
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const button=document.createElement('button');
  button.type='button';button.className='action secondary';
  button.textContent='🎙 Speak answer';button.setAttribute('aria-label','Speak your answer instead of typing');
  controls.append(button);
  if(!Recognition){
    button.disabled=true;
    button.title='Speech recognition is not available in this browser. Type your answer instead.';
    return;
  }
  button.onclick=()=>{
    if(activeDictation){stopDictation();button.textContent='🎙 Speak answer';return;}
    const recog=new Recognition();
    recog.lang='en-US';recog.interimResults=false;recog.maxAlternatives=1;
    activeDictation=recog;button.textContent='■ Stop listening';
    feedback.textContent='Listening… Speak clearly. Your answer will appear in the text box.';
    recog.onresult=event=>{
      const spoken=event.results?.[0]?.[0]?.transcript||'';
      if(spoken){input.value=input.tagName==='TEXTAREA'&&input.value.trim()?input.value.trim()+' '+spoken:spoken;input.dispatchEvent(new Event('input',{bubbles:true})); feedback.textContent='Speech captured. You can edit your answer before pressing Check.';}
    };
    recog.onerror=event=>{feedback.textContent='Microphone unavailable ('+(event.error||'unknown error')+'). You can type instead.';};
    recog.onend=()=>{if(activeDictation===recog)activeDictation=null;button.textContent='🎙 Speak answer';};
    try{recog.start();}catch{feedback.textContent='Could not start microphone. Type your answer instead.';activeDictation=null;button.textContent='🎙 Speak answer';}
  };
}
function showExercises(exercises, target, version) {
  const holder = $('wordExercise');
  const stageNames = ['1. Recognition', '2. Retrieval', '3. Production'];
  const cards = [];
  const unlock = index => {
    if (!cards[index]) return;
    cards[index].hidden = false;
    cards[index].scrollIntoView?.({block:'nearest',behavior:'smooth'});
    // Keep the chosen word visible in Word Stock throughout: hiding it looked like deletion.
    $('wordPracticeHeading').textContent='Practise: '+target;
    $('wordPracticeStatus').textContent = stageNames[index];
  };
  // Emphasise the target within Recognition's actual source sentence.
  // Use DOM text nodes, never innerHTML from an AI response.
  const highlightTarget=(element, sentence, word)=>{
    const escape=value=>value.replace(/[^a-zA-Z0-9\s]/g,'\\$&');
    const escaped=escape(word);
    const expression=new RegExp('\\b'+escaped+'(?:s|ed|d|ing)?\\b','gi');
    let match,last=0,found=false;
    while((match=expression.exec(sentence))!==null){
      element.append(document.createTextNode(sentence.slice(last,match.index)));
      const strong=document.createElement('strong'); strong.className='practice-target-highlight';
      strong.textContent=match[0]; element.append(strong);
      last=match.index+match[0].length;found=true;
      if(!match[0].length)break;
    }
    element.append(document.createTextNode(sentence.slice(last)));
    return found;
  };
  exercises.forEach((q, index) => {
    const card = document.createElement('section'); card.className = 'word-exercise-card';
    card.hidden = index !== 0;
    const heading = document.createElement('h4'); heading.textContent = stageNames[index];
    const label = document.createElement('label'); label.htmlFor = `word-answer-${index}`;
    if(index===0){
      const focus=document.createElement('p');focus.className='practice-focus-word';
      focus.textContent='Focus word: '+target; card.append(focus);
      highlightTarget(label,q.prompt,target);
    }else label.textContent=q.prompt;
    const input = document.createElement(index===0 ? 'select' : index===2 ? 'textarea' : 'input'); input.id = label.htmlFor;
    if(index===0){
      input.append(new Option('Choose an answer', ''));
      const options = [...q.options];
      if(options.indexOf(q.answer)===0) options.push(options.shift());
      options.forEach(option=>input.append(new Option(option,option)));
    }
    if(index===2){input.rows=3;input.placeholder='Write or speak a short personal answer…';}
    else if(index===1){input.placeholder='Type or say the missing word';input.autocomplete='off';}
    const controls = document.createElement('div'); controls.className = 'row';
    const check = document.createElement('button'); check.type='button';check.className='action secondary';
    check.textContent = index===2?'Review my answer':'Check';
    const hint = document.createElement('button');hint.type='button';hint.className='action secondary';hint.textContent='Hint';
    // Learners may always opt out of an unclear activity. Revealed answers are NOT scored as mastered.
    const reveal = document.createElement('button');reveal.type='button';reveal.className='action secondary';
    reveal.textContent=index===2?'Show example answer':'Reveal answer';
    reveal.setAttribute('aria-label',index===2?'Show an example and finish practice':'Reveal the correct answer and allow continuing');
    const continueButton = document.createElement('button');continueButton.type='button';
    continueButton.className='action secondary';continueButton.textContent=index===2?'Finish practice':'Continue →';continueButton.hidden=true;
    const revealInfo = document.createElement('p');revealInfo.className='word-exercise-feedback';revealInfo.setAttribute('role','status');
    const listen=document.createElement('button');listen.type='button';listen.className='action secondary';listen.textContent='🔊 Listen to question';
    const feedback = document.createElement('p');feedback.className='word-exercise-feedback';feedback.setAttribute('role','status');
    const hintText = document.createElement('p');hintText.hidden=true;hintText.textContent=q.hint;
    hint.onclick=()=>{hintText.hidden=!hintText.hidden;hint.setAttribute('aria-expanded',String(!hintText.hidden));};
    hint.setAttribute('aria-expanded','false');
    listen.onclick=()=>listenTo(q.prompt,feedback);
    let unlocked = false;
    reveal.onclick=()=>{
      if(version!==revision)return;
      const displayed=q.answer;
      revealInfo.textContent=(index===2?'Example answer: ':'Answer: ')+displayed+'. This was revealed, not marked correct.';
      continueButton.hidden=false;
      reveal.disabled=true;
      feedback.textContent='You can continue without completing this task.';
    };
    continueButton.onclick=()=>{
      if(version!==revision || unlocked)return;
      unlocked=true;
      if(index<2){unlock(index+1);}
      else{feedback.textContent='Practice finished. You can choose another word or clear the exercises.';}
      continueButton.hidden=true;
    };
    check.onclick=async()=>{
      if(!input.value.trim()){feedback.textContent='Write, say or choose an answer first.';return;}
      if(index!==2){
        const correct = index===0 ? normal(input.value)===normal(q.answer) : equivalentRetrieval(input.value,q.answer);
        feedback.textContent = correct ? '✓ Correct! '+q.explanation : 'Not quite. '+(index===0?'Look again at the context. ':'Check the situation and try recalling the word. ')+'You can use Hint.';
        if(correct&&!unlocked){unlocked=true;unlock(index+1);}
        return;
      }
      check.disabled=true;feedback.textContent='Reviewing your answer…';
      try{
        const result=await request({mode:'check',target,exercise:q,answer:input.value.slice(0,1200)},controller?.signal);
        if(version===revision)feedback.textContent=`${result.correct===true?'✓ ':result.correct===false?'Try again. ':'Review pending. '}${result.feedback}`;
      }catch(error){if(version===revision)feedback.textContent=`Review unavailable: ${error.message}. Your answer is still here.`;}
      finally{if(version===revision)check.disabled=false;}
    };
    input.addEventListener('keydown',e=>{if(e.key==='Enter'&&input.tagName!=='TEXTAREA'){e.preventDefault();check.click();}});
    controls.append(check,hint,listen,reveal,continueButton);
    if(index>0)addDictation(input,controls,feedback);
    const note=document.createElement('p');note.className='note';
    note.textContent=index===0?'Listen or read, then choose the meaning.':index===1?'Try to remember without looking at the saved word. You can reveal the answer and continue at any time.':'Speak or type a meaningful answer. Review the transcript before checking.';
    card.append(heading,label,note,input,controls,hintText,revealInfo,feedback);holder.append(card);cards.push(card);
  });
}

async function generate() {
  if(!ready||!selected)return;
  const target=wordOf(rows.find(row=>normal(wordOf(row))===selected));
  clear();const version=revision;controller=new AbortController();
  $('wordPracticeGenerate').disabled=true;
  $('wordPracticeStatus').textContent='Preparing Recognition → Retrieval → Production…';
  try{
    const result=await request({mode:'generate',target},controller.signal);
    if(version!==revision)return;
    const types=['recognition','retrieval','production'];
    if(!Array.isArray(result.exercises)||result.exercises.length!==3||result.exercises.some((q,i)=>q.target!==target||q.type!==types[i]||!q.prompt||!q.answer||!q.hint||!q.explanation||!Array.isArray(q.options)||(i===0?!q.options.includes(q.answer):q.options.length!==0)))throw Error('The exercise set was incomplete. Please retry.');
    showExercises(result.exercises,target,version);
    $('wordPracticeStatus').textContent=`${result.source==='offline-reviewed'?'Reviewed classroom practice':'AI practice'} · Begin with Recognition.`;
  }catch(error){if(version===revision)$('wordPracticeStatus').textContent=`Practice unavailable: ${error.message}. No generic exercises were substituted; your saved words remain unchanged.`;}
  finally{if(version===revision)$('wordPracticeGenerate').disabled=false;}
}

loadGuestWordStock();
$('wordPracticeGenerate').onclick = generate; $('wordPracticeClear').onclick = clear; $('wordStockRefresh').onclick = () => enqueue(refresh);
window.artWordStock = { add, generate, clear, refresh };
db.auth.onAuthStateChange((_event, session) => {
  if (session?.user?.id === user?.id) return;
  epoch++; user = null; ready = false; rows = []; selected = ''; clear(); loadGuestWordStock();
  setTimeout(refresh, 0);
});
refresh();
