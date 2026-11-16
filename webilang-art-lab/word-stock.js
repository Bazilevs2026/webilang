import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '/student-memory/config.js';
import { normal, wordOf, readWords, insertWord, deleteWord } from '/student-memory/word-stock.js';

const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
const $ = id => document.getElementById(id);
let user = null, rows = [], selected = '', epoch = 0, revision = 0, controller = null, queue = Promise.resolve(), ready = false;
const status = message => { $('wordStockStatus').textContent = message; $('comicWordStatus').textContent = message; };
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
  return queue;
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
    rows = loaded; ready = true; render(); status('Your account Word Stock · saved vocabulary from all connected modules.');
  } catch (error) { if (version === epoch) { ready = false; rows = []; selected = ''; clear(); render(); status(error.message); } }
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
function showExercises(exercises, target, version) {
  const holder = $('wordExercise');
  exercises.forEach((q, index) => {
    const card = document.createElement('section'); card.className = 'word-exercise-card';
    const label = document.createElement('label'); label.htmlFor = `word-answer-${index}`; label.textContent = `${index + 1}. ${q.prompt}`;
    const input = document.createElement(q.type === 'meaning' ? 'select' : q.type === 'production' ? 'textarea' : 'input'); input.id = label.htmlFor;
    if (q.type === 'meaning') { input.append(new Option('Choose an answer', '')); q.options.forEach(option => input.append(new Option(option, option))); }
    const controls = document.createElement('div'); controls.className = 'row';
    const check = document.createElement('button'); check.type = 'button'; check.className = 'action secondary'; check.textContent = 'Check';
    const hint = document.createElement('button'); hint.type = 'button'; hint.className = 'action secondary'; hint.textContent = 'Hint';
    const feedback = document.createElement('p'); feedback.className = 'word-exercise-feedback'; feedback.setAttribute('role', 'status');
    const hintText = document.createElement('p'); hintText.hidden = true; hintText.textContent = q.hint;
    hint.onclick = () => { hintText.hidden = !hintText.hidden; hint.setAttribute('aria-expanded', String(!hintText.hidden)); };
    hint.setAttribute('aria-expanded', 'false');
    check.onclick = async () => {
      if (!input.value.trim()) { feedback.textContent = 'Write or choose an answer first.'; return; }
      if (q.type !== 'production') { const correct = normal(input.value).replace(/[.!?]$/, '') === normal(q.answer).replace(/[.!?]$/, ''); feedback.textContent = correct ? `✓ Correct. ${q.explanation}` : `Not yet. ${q.hint} Try again or open the hint.`; return; }
      check.disabled = true; feedback.textContent = 'Checking your sentence…';
      try { const result = await request({ mode: 'check', target, exercise: q, answer: input.value.slice(0,1200) }, controller?.signal); if (version === revision) feedback.textContent = `${result.correct ? '✓ ' : 'Try again. '}${result.feedback}`; }
      catch (error) { if (version === revision) feedback.textContent = `Check unavailable: ${error.message}. Your answer remains here.`; }
      finally { if (version === revision) check.disabled = false; }
    };
    input.addEventListener('keydown', event => { if (event.key === 'Enter' && input.tagName !== 'TEXTAREA') { event.preventDefault(); check.click(); } });
    controls.append(check, hint); card.append(label, input, controls, hintText, feedback); holder.append(card);
  });
}
async function generate() {
  if (!ready || !selected) return;
  const target = wordOf(rows.find(row => normal(wordOf(row)) === selected));
  clear(); const version = revision; controller = new AbortController();
  $('wordPracticeGenerate').disabled = true; $('wordPracticeStatus').textContent = `Generating five exercises for “${target}”…`;
  try {
    const result = await request({ mode: 'generate', target }, controller.signal);
    if (version !== revision) return;
    const types = ['gap','meaning','collocation','completion','production'];
    if (!Array.isArray(result.exercises) || result.exercises.length !== 5 || result.exercises.some((q,i) => q.target !== target || q.type !== types[i] || !q.prompt || !q.answer || !q.hint || !q.explanation || !Array.isArray(q.options) || q.type === 'meaning' && !q.options.includes(q.answer))) throw Error('The AI returned an incomplete or mixed-target set. Please retry.');
    showExercises(result.exercises, target, version); $('wordPracticeStatus').textContent = `Five exercises for “${target}”.`;
  } catch (error) { if (version === revision) $('wordPracticeStatus').textContent = `Could not generate practice: ${error.message}. Your words are unchanged.`; }
  finally { if (version === revision) $('wordPracticeGenerate').disabled = false; }
}
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
  epoch++; user = null; ready = false; rows = []; selected = ''; clear(); render(); status('Connecting to your account…');
  setTimeout(refresh, 0);
});
refresh();
