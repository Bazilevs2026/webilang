import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '/student-memory/config.js';
import { normal, wordOf, readWords, insertWord, deleteWord } from '/student-memory/word-stock.js';

const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
const $ = id => document.getElementById(id);
let user = null, rows = [], selected = '', epoch = 0, revision = 0, controller = null, queue = Promise.resolve(), ready = false;
const staged = new Map(); let savingStage = false;
const status = message => { $('wordStockStatus').textContent = message; $('comicWordStatus').textContent = message; };
function renderStaged(message) {
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
  $('comicSaveWords').disabled = !staged.size || savingStage || !ready;
  $('comicClearSelection').disabled = !staged.size || savingStage;
  if ($('readingSaveWords')) $('readingSaveWords').disabled = !staged.size || savingStage || !ready;
  if ($('readingClearSelection')) $('readingClearSelection').disabled = !staged.size || savingStage;
  document.querySelectorAll('.selectable-word,.vocab-select').forEach(button => { button.classList.toggle('word-staged', staged.has(normal(button.dataset.expression || button.textContent))); });
  if (message !== undefined) { $('comicWordStatus').textContent = message; if ($('readingWordStatus')) $('readingWordStatus').textContent=message; }
}
function stageWord(value) {
  const word = String(value||'').trim().replace(/\s+/g,' '), key = normal(word);
  if (!key || word.length > 130) return;
  if (!staged.has(key)) staged.set(key,word);
  renderStaged('✓ “'+word+'” selected. '+staged.size+' word(s) ready. Press Save selected words.');
  document.querySelectorAll('.selectable-word,.vocab-select').forEach(button => {
    const active = staged.has(normal(button.dataset.expression||button.textContent));
    button.classList.toggle('word-staged',active);
    if (active) button.setAttribute('aria-pressed','true');
  });
}
function clearStaged(){staged.clear();document.querySelectorAll('.word-staged').forEach(el=>el.classList.remove('word-staged'));renderStaged('Selection cleared. Saved vocabulary was not deleted.');}
async function saveStaged(){
  if(savingStage || !staged.size)return;
  if(!ready || !user){ renderStaged('Sign in to Webilang Global to save words. Your selection is still here.');return; }
  savingStage=true;const items=[...staged.values()];renderStaged('Saving '+items.length+' word(s)…');
  try {
    for (const word of items) {
      // Add waits for the authenticated Supabase write; never clear on failed save.
      await add(word);
      staged.delete(normal(word));
      renderStaged('Saved “'+word+'” to your account.');
    }
    renderStaged('✓ Saved '+items.length+' word(s) to My Word Stock. Open My Word Stock to practise.');
  } catch(error){renderStaged('Could not save all words: '+(error.message||'Please retry.')+' Unsaved words remain selected.');}
  finally{savingStage=false;renderStaged();}
}
$('comicSaveWords').addEventListener('click',saveStaged);
$('comicClearSelection').addEventListener('click',clearStaged);
$('readingSaveWords')?.addEventListener('click',saveStaged);
$('readingClearSelection')?.addEventListener('click',clearStaged);
window.artStageWord=stageWord;
function clear() {
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
      if (!confirm(`Remove “${word}” from your account Word Stock? This also removes its saved records from the listed modules.`)) return;
      const owner = user?.id, version = epoch;
      enqueue(async () => {
        await verify(owner, version);
        for (const record of records) { await verify(owner, version); await deleteWord(db, owner, record.id); }
        if (version === epoch) { rows = rows.filter(r => !records.some(item => item.id === r.id)); render(); status(`Removed “${word}”.`); }
      });
    };
    const source = document.createElement('span'); source.className = 'word-stock-source'; source.textContent = [...new Set(records.map(r => r.module || 'Saved vocabulary'))].join(' · ');
    row.append(choose, remove, source); $('savedWords').append(row);
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
  const version = epoch;
  try {
    const { data, error } = await db.auth.getUser();
    if (version !== epoch) return;
    if (error || !data?.user) throw Error('Sign in to Webilang Global to save and practise your words.');
    if (user?.id !== data.user.id) { rows = []; selected = ''; clear(); }
    user = data.user; ready = false;
    const loaded = await readWords(db, user.id);
    if (version !== epoch) return;
    rows = loaded; ready = true; render(); renderStaged(); status('Your account Word Stock · saved vocabulary from all connected modules.');
  } catch (error) { if (version === epoch) { ready = false; rows = []; selected = ''; clear(); render(); renderStaged(); status(error.message); } }
}
function add(value) {
  const word = String(value || '').trim().replace(/\s+/g, ' '), owner = user?.id, version = epoch;
  if (!word || word.length > 130) return;
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
  const { data: { session } } = await db.auth.getSession();
  if (!session || session.user.id !== user?.id) throw Error('Sign in again to practise.');
  const response = await fetch('/api/artlab-word-practice', { method: 'POST', signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(payload) });
  const data = await response.json(); if (!response.ok) throw Error(data.error || 'AI practice is unavailable.'); return data;
}
function equivalentRetrieval(actual, expected) {
  const tidy = value => normal(value).replace(/[.!?]+$/, '').replace(/\s+/g, ' ');
  const got = tidy(actual), wanted = tidy(expected);
  if (got === wanted) return true;
  // Students may use a grammatically suitable inflection of the same English word.
  if (wanted.length < 4) return false;
  return [wanted+'s',wanted+'es',wanted.replace(/e$/,'')+'ing',wanted+'ing',wanted+'ed',wanted.replace(/e$/,'')+'ed'].includes(got);
}
function showExercises(exercises, target, version) {
  const holder = $('wordExercise');
  const stageNames = ['1. Recognition — understand', '2. Retrieval — remember', '3. Production — make it yours'];
  const cards = [];
  const unlock = index => {
    if (!cards[index]) return;
    cards[index].hidden = false;
    cards[index].scrollIntoView?.({block:'nearest',behavior:'smooth'});
    $('wordPracticeStatus').textContent = stageNames[index]+' · '+target;
  };
  exercises.forEach((q, index) => {
    const card = document.createElement('section'); card.className = 'word-exercise-card';
    card.hidden = index !== 0;
    const heading = document.createElement('h4'); heading.textContent = stageNames[index];
    const label = document.createElement('label'); label.htmlFor = `word-answer-${index}`; label.textContent = q.prompt;
    const input = document.createElement(index===0 ? 'select' : index===2 ? 'textarea' : 'input'); input.id = label.htmlFor;
    if(index===0){
      input.append(new Option('Choose an answer', ''));
      // Rotate option order by target and current timestamp, without changing the correct answer.
      const options = [...q.options];
      const indexOfAnswer = options.indexOf(q.answer);
      if(indexOfAnswer===0) options.push(options.shift());
      options.forEach(option=>input.append(new Option(option,option)));
    }
    if(index===2){input.rows=3;input.placeholder='Write 1–3 meaningful sentences…';}
    else if(index===1){input.placeholder='Recall the missing word';input.autocomplete='off';}
    const controls = document.createElement('div'); controls.className = 'row';
    const check = document.createElement('button'); check.type='button';check.className='action secondary';
    check.textContent = index===2?'Review my answer':'Check';
    const hint = document.createElement('button');hint.type='button';hint.className='action secondary';hint.textContent='Hint';
    const feedback = document.createElement('p');feedback.className='word-exercise-feedback';feedback.setAttribute('role','status');
    const hintText = document.createElement('p');hintText.hidden=true;hintText.textContent=q.hint;
    hint.onclick=()=>{hintText.hidden=!hintText.hidden;hint.setAttribute('aria-expanded',String(!hintText.hidden));};
    hint.setAttribute('aria-expanded','false');
    let unlocked = false;
    check.onclick=async()=>{
      if(!input.value.trim()){feedback.textContent='Write or choose an answer first.';return;}
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
    controls.append(check,hint);card.append(heading,label,input,controls,hintText,feedback);holder.append(card);cards.push(card);
  });
}
async function generate() {
  if(!ready||!selected)return;
  const target=wordOf(rows.find(row=>normal(wordOf(row))===selected));
  clear();const version=revision;controller=new AbortController();
  $('wordPracticeGenerate').disabled=true;
  $('wordPracticeStatus').textContent=`Preparing Recognition → Retrieval → Production for “${target}”…`;
  try{
    const result=await request({mode:'generate',target},controller.signal);
    if(version!==revision)return;
    const types=['recognition','retrieval','production'];
    if(!Array.isArray(result.exercises)||result.exercises.length!==3||result.exercises.some((q,i)=>q.target!==target||q.type!==types[i]||!q.prompt||!q.answer||!q.hint||!q.explanation||!Array.isArray(q.options)||(i===0?!q.options.includes(q.answer):q.options.length!==0)))throw Error('The exercise set was incomplete. Please retry.');
    showExercises(result.exercises,target,version);
    $('wordPracticeStatus').textContent=`${result.source==='offline-reviewed'?'Reviewed offline practice (AI unavailable)':'AI practice'} · Begin with Recognition.`;
  }catch(error){if(version===revision)$('wordPracticeStatus').textContent=`Practice unavailable: ${error.message}. No generic exercises were substituted; your saved words remain unchanged.`;}
  finally{if(version===revision)$('wordPracticeGenerate').disabled=false;}
}

renderStaged();
$('wordPracticeGenerate').onclick = generate; $('wordPracticeClear').onclick = clear; $('wordStockRefresh').onclick = () => enqueue(refresh);
$('wordStockImport').onclick = async () => {
  if (!ready || !confirm('Import the older Art Lab vocabulary on this browser into YOUR signed-in account? Only continue if these words belong to you.')) return;
  let old; try { old = JSON.parse(localStorage.getItem('webilang-art-lab-personal-stocks-v2') || '{}'); } catch { status('The older browser list could not be read.'); return; }
  const version = epoch;
  for (const word of [...(old.words || []), ...(old.pending || [])]) { if (version !== epoch) break; await add(word); }
};
window.artWordStock = { add, generate, clear, refresh };
db.auth.onAuthStateChange((_event, session) => {
  if (session?.user?.id === user?.id) return;
  epoch++; user = null; ready = false; rows = []; selected = ''; clear(); render(); renderStaged(); status('Connecting to your account…');
  setTimeout(refresh, 0);
});
refresh();
