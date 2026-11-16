/* Enhanced learning controls. AI requires configured server endpoints. */
(()=>{
'use strict';
const banksy=[
 ['What happened to Banksy’s Girl with Balloon after the auction?', ['It was partially shredded inside its frame.','The artist painted over it.','It was stolen.'],0,'A shredder hidden inside the frame partially cut the work.'],
 ['When did the shredding start?', ['Before the auction opened.','Immediately after the successful sale.','Several weeks after the sale.'],1,'The event happened just after the hammer fell.'],
 ['What was the artwork later called?', ['Comedian','Man at the Crossroads','Love Is in the Bin'],2,'The partially shredded work became Love Is in the Bin.'],
 ['Why did the event attract attention?', ['It raised questions about destruction, value, and art.','The artwork was free.','The painting was made of food.'],0,'The action changed the artwork and sparked debate about art and value.']
];
const reading=[
 ['What was attached to the gallery wall?', ['A banana with grey tape.','A golden frame.','A bowl of fruit.'],0,'The artwork was a real banana attached with tape.'],
 ['What can happen when the banana gets old?', ['The work must be destroyed.','It can be replaced.','It becomes a different artist’s work.'],1,'The certificate and instructions matter, not one permanent banana.'],
 ['How much did an edition sell for in 2024, including fees?', ['$62,000.','$620,000.','$6.2 million.'],2,'The sale total including fees was approximately $6.2 million.'],
 ['What was a central part of the artwork?', ['The certificate, instructions, and idea.','A rare kind of banana.','The exact wall used in 2019.'],0,'The concept and instructions were central to the sale and presentation.']
];
function mountQuiz(id,questions){let host=document.getElementById(id);if(!host)return;host.replaceChildren();questions.forEach(([question,opts,right,reason],n)=>{let el=document.createElement('div');el.className='quiz-item';let title=document.createElement('h4');title.textContent=(n+1)+'. '+question;el.append(title);let choices=document.createElement('div');choices.className='quiz-options';let choice=-1;opts.forEach((label,i)=>{let b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{choice=i;choices.querySelectorAll('button').forEach(x=>x.classList.remove('chosen'));b.classList.add('chosen');status.textContent='Now check your answer.'};choices.append(b)});el.append(choices);let check=document.createElement('button');check.type='button';check.className='action secondary';check.textContent='Check answer';check.style.marginTop='10px';const status=document.createElement('div');status.className='quiz-feedback';status.setAttribute('aria-live','polite');check.onclick=()=>{status.textContent=choice<0?'Choose an option first.':choice===right?'✓ Correct! '+reason:'Not yet. Try again.';if(choice===right)status.style.color='#13744a';else status.style.color='#af3135'};el.append(check,status);host.append(el)})}
mountQuiz('banksyQuiz',banksy);mountQuiz('bananaQuiz',reading);
// Click every word in comic dialogue and reading, preserving punctuation and text layout.
const segmenter=typeof Intl!=='undefined' && Intl.Segmenter ? new Intl.Segmenter('en',{granularity:'word'}):null;
const pop=document.createElement('div');pop.className='word-action-pop hide';document.body.append(pop);
let selection=null;
function buildWordButtons(container){const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT,{acceptNode(node){return node.parentElement.closest('button,a,script,style,textarea,input,.word-action-pop')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(node=>{const text=node.nodeValue;if(!text||!/[A-Za-z]/.test(text))return;const parts=segmenter?[...segmenter.segment(text)].map(x=>({word:x.segment,yes:x.isWordLike})):(text.match(/[A-Za-z]+(?:['’][A-Za-z]+)?|[^A-Za-z]+/g)||[]).map(x=>({word:x,yes:/^[A-Za-z]/.test(x)}));const frag=document.createDocumentFragment();for(const bit of parts){if(!bit.yes){frag.append(document.createTextNode(bit.word));continue}let b=document.createElement('button');b.type='button';b.className='selectable-word';b.textContent=bit.word;b.title='Add “'+bit.word+'” to My Word Stock';b.onclick=(event)=>{event.stopPropagation();showWord(bit.word,b)};frag.append(b)}node.replaceWith(frag)})}
for(const container of document.querySelectorAll('#p0 .comic-dialogue p,#p0 .mural-context p,#p2 .article p'))buildWordButtons(container);
function showWord(word,anchor){selection=word;pop.replaceChildren();let desc=document.createElement('div');desc.innerHTML='<strong></strong><p style="margin:5px 0;font-size:12px">Select this word for your personal practice.</p>';desc.querySelector('strong').textContent=word;let add=document.createElement('button');add.textContent='＋ Add to My Word Stock';add.onclick=()=>{window.artAddSelectedWord(word);pop.classList.add('hide')};let speak=document.createElement('button');speak.textContent='🔊 Listen';speak.onclick=()=>window.artSpeakWord(word);pop.append(desc,add,speak);const r=anchor.getBoundingClientRect();pop.style.left=Math.max(8,Math.min(innerWidth-330,r.left))+'px';pop.style.top=Math.max(6,Math.min(innerHeight-150,r.bottom+8))+'px';pop.classList.remove('hide')}
document.addEventListener('click',e=>{if(!pop.contains(e.target)&&!e.target.closest('.selectable-word'))pop.classList.add('hide')});
window.artSpeakWord=async function(word){try{const r=await fetch('/api/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:word,module:'art-lab',targetLanguage:'en'})});if(!r.ok)throw Error('No server voice');const blob=await r.blob();let a=new Audio(URL.createObjectURL(blob));a.onended=()=>URL.revokeObjectURL(a.src);await a.play()}catch{if('speechSynthesis'in window){let utter=new SpeechSynthesisUtterance(word);utter.lang='en-US';utter.rate=.9;speechSynthesis.cancel();speechSynthesis.speak(utter)}}};
window.artAddSelectedWord=function(word){try{const key='webilang-art-lab-personal-stocks-v2';let stocks=JSON.parse(localStorage.getItem(key)||'{}');stocks.pending=stocks.pending||[];stocks.words=stocks.words||[];stocks.grammar=stocks.grammar||[];if(!stocks.pending.some(x=>x.toLowerCase()===word.toLowerCase())&&!stocks.words.some(x=>x.toLowerCase()===word.toLowerCase()))stocks.pending.push(word);localStorage.setItem(key,JSON.stringify(stocks));if(typeof artStocks!=='undefined'){artStocks.pending=stocks.pending;if(typeof renderStocks==='function')renderStocks()}else{const host=document.getElementById('pendingWords');if(host){let chip=document.createElement('span');chip.textContent=word;host.append(chip)}}document.getElementById('wordStockStatus').textContent='Selected “'+word+'”. Open My Word Stock and save your selections.'}catch(err){console.error(err)}};
const blobs={};const recorders={};
window.artRecordToggle=async function(task){const status=document.getElementById('recStatus-'+task),audio=document.getElementById('recAudio-'+task),button=document.querySelector('[onclick="artRecordToggle(\''+task+'\')"]');if(recorders[task]?.state==='recording'){recorders[task].stop();button.textContent='🎙 Record again';return}if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){status.textContent='Recording is unavailable. Type your answer instead.';return}try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});const chunks=[];let r=new MediaRecorder(stream);recorders[task]=r;r.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};r.onstop=async()=>{blobs[task]=new Blob(chunks,{type:r.mimeType||'audio/webm'});audio.src=URL.createObjectURL(blobs[task]);audio.classList.remove('hide');stream.getTracks().forEach(t=>t.stop());status.textContent='Recording saved on this device. Transcribing…';try{const raw=new Uint8Array(await blobs[task].arrayBuffer());if(raw.length>4500000)throw Error('Recording is too long; keep it under about 3 minutes.');let binary='';for(let i=0;i<raw.length;i+=8192)binary+=String.fromCharCode(...raw.subarray(i,i+8192));const audioBase64=btoa(binary);let response=await fetch('/api/artlab-transcribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audioBase64,mimeType:blobs[task].type})});let result=await response.json();if(!response.ok)throw Error(result.error||'Transcription unavailable');const box=document.getElementById(document.querySelector('[data-task="'+task+'"]').dataset.textarea);box.value=result.text;box.dispatchEvent(new Event('input',{bubbles:true}));status.textContent='AI transcription ready. Review or correct the text, then request AI feedback.'}catch(e){status.textContent='Audio recorded, but automatic transcription is unavailable: '+e.message+'. Type the answer above, or configure the AI service.'}};r.start();button.textContent='■ Stop recording';status.textContent='Recording… press Stop when finished.'}catch(e){status.textContent='Microphone permission denied or unavailable.'}};
async function coach(payload){const r=await fetch('/api/artlab-coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const j=await r.json();if(!r.ok)throw Error(j.error||'AI service unavailable');return j}
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.artSaveGrammarItem=function(item,button){
 const value=String(item||'').trim();if(!value)return;
 const key='webilang-art-lab-personal-stocks-v2';let stocks={};
 try{stocks=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
 stocks.grammar=Array.isArray(stocks.grammar)?stocks.grammar:[];
 const exists=stocks.grammar.some(s=>String(s).toLowerCase()===value.toLowerCase());
 if(!exists)stocks.grammar.push(value);
 localStorage.setItem(key,JSON.stringify(stocks));
 // Keep the module's existing Stock UI in sync with the saved value.
 try{if(typeof artStocks!=='undefined'){artStocks.grammar=stocks.grammar;if(typeof renderStocks==='function')renderStocks()}}catch(e){console.warn('Stock refresh:',e)}
 if(button){button.textContent='✓ Saved to My Grammar Stock';button.classList.add('stock-saved');button.disabled=true;button.setAttribute('aria-pressed','true')}
 const message=button?.closest('.feedback-grammar')?.querySelector('.stock-save-status');
 if(message)message.textContent=exists?'Already saved.':'✓ Saved! Open My Grammar Stock to practise it.';
};
window.artAnalyze=async function(task){
 const wrapper=document.querySelector('[data-task="'+task+'"]');if(!wrapper)return;
 const text=document.getElementById(wrapper.dataset.textarea).value.trim();
 const feedback=document.getElementById('recFeedback-'+task);
 if(text.length<15){feedback.textContent='Please speak or type at least two sentences first.';return}
 feedback.textContent='Checking your reasoning and English…';
 try{
  const result=await coach({mode:'feedback',text,task,prompt:wrapper.dataset.prompt});
  feedback.replaceChildren();
  const intro=document.createElement('div');intro.className='feedback-grammar feedback-review';
  const h=document.createElement('h3');h.textContent='AI feedback';intro.append(h);
  for(const [k,label] of [['interaction','Interaction'],['grammar','Grammar'],['vocabulary','Vocabulary'],['nextStep','Next step']]){
   if(!result[k])continue;
   const row=document.createElement('section');row.className='review-section review-'+k;
   const name=document.createElement('strong');name.className='review-label';name.textContent=label;
   const body=document.createElement('p');body.textContent=String(result[k]);row.append(name,body);intro.append(row);
  }
  const items=Array.isArray(result.grammarItems)?[...new Set(result.grammarItems.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim()))]:[];
  if(items.length){
   const heading=document.createElement('h4');heading.textContent='Save a grammar item to My Grammar Stock';intro.append(heading);
   const status=document.createElement('p');status.className='stock-save-status';status.setAttribute('aria-live','polite');status.textContent='Click an expression to save it.';intro.append(status);
   let saved=[];try{saved=JSON.parse(localStorage.getItem('webilang-art-lab-personal-stocks-v2')||'{}').grammar||[]}catch{}
   const actions=document.createElement('div');actions.className='review-save-actions';
   items.forEach(item=>{
    const b=document.createElement('button');b.type='button';b.className='stock-save-button';
    const exists=saved.some(x=>String(x).toLowerCase()===item.toLowerCase());
    b.textContent=exists?'✓ Saved to My Grammar Stock':'＋ '+item;
    if(exists){b.classList.add('stock-saved');b.disabled=true}
    b.onclick=()=>artSaveGrammarItem(item,b);actions.append(b);
   });intro.append(actions);
  }
  feedback.append(intro);
 }catch(e){feedback.textContent='AI feedback not available: '+e.message+'. Your answer remains available for teacher review.'}
};
function artLocalPractice(type,items){
 const grammarBank=[
  {test:/should|suggest/i,prompt:'The gallery ___ listen to both sides.',answer:'should',hint:'Use a modal for advice.'},
  {test:/because|reason/i,prompt:'Rivera refused ___ the portrait mattered to his message.',answer:'because',hint:'Introduce a reason.'},
  {test:/present continuous|ongoing/i,prompt:'The artist ___ painting a mural right now.',answer:'is',hint:'Use the present continuous form of be.'},
  {test:/might have|past participle/i,prompt:'The artist ___ have found another solution.',answer:'might',hint:'Use a modal of uncertain past possibility.'},
  {test:/if|conditional|will/i,prompt:'If they agree, they ___ save the mural.',answer:'will',hint:'Use the first conditional.'},
  {test:/past simple/i,prompt:'The managers ___ the mural in 1934. (destroy)',answer:'destroyed',hint:'Use the simple past tense.'},
  {test:/must|obligation/i,prompt:'The artist ___ follow the safety rules.',answer:'must',hint:'Express an obligation.'}
 ];
 const vocabBank=[
  {test:/mural/i,prompt:'A large painting made on a wall is a ___.',answer:'mural',hint:'Starts with m.'},
  {test:/refuse/i,prompt:'To say no to a request is to ___.',answer:'refuse',hint:'Starts with r.'},
  {test:/compromise/i,prompt:'An agreement in which both sides make changes is a ___.',answer:'compromise',hint:'Starts with c.'},
  {test:/consequence/i,prompt:'The result of a decision is a ___.',answer:'consequence',hint:'Starts with c.'},
  {test:/controversial/i,prompt:'A painting that causes a public debate is ___.',answer:'controversial',hint:'Starts with c.'}
 ];
 const bank=type==='grammar'?grammarBank:vocabBank;
 const selected=items.map(item=>bank.find(b=>b.test.test(String(item)))).filter(Boolean);
 const unique=[...new Set(selected)].slice(0,5);
 // Local sample practice is explicitly marked: it is not presented as AI-generated practice.
 return (unique.length?unique:bank.slice(0,3)).map(({prompt,answer,hint})=>({prompt,answer,hint}));
}
window.artStockPractice=async function(type){
 const key='webilang-art-lab-personal-stocks-v2';let stocks={};
 try{stocks=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
 const items=type==='words'?(stocks.words||[]):(stocks.grammar||[]);
 const holder=document.getElementById(type==='words'?'wordExercise':'grammarExercise');if(!holder)return;
 holder.textContent=items.length?'Generating AI exercises for '+items.length+' saved item(s)…':'Save items to My '+(type==='words'?'Word':'Grammar')+' Stock first.';
 if(!items.length)return;
 let questions=[],error='';
 try{
  const result=await coach({mode:'practice',stockType:type,items:items.slice(-20)});
  if(!Array.isArray(result.questions)||!result.questions.length)throw Error('No questions returned.');
  questions=result.questions.filter(q=>q&&typeof q.prompt==='string'&&q.prompt.trim()&&typeof q.answer==='string'&&q.answer.trim()).slice(0,7);
  if(!questions.length)throw Error('The generated exercises were incomplete.');
 }catch(e){error=e.message||'Request failed';questions=artLocalPractice(type,items)}
 holder.replaceChildren();
 const title=document.createElement('p');title.className='practice-heading';title.textContent=error?'Local sample practice':'✨ AI-generated practice · '+questions.length+' questions';holder.append(title);
 if(error){const note=document.createElement('p');note.className='practice-warning';note.textContent='AI generation failed: '+error+'. Showing local sample questions instead.';holder.append(note)}
 const wrap=document.createElement('div');wrap.className='generated-practice';
 questions.forEach((q,i)=>{
  const card=document.createElement('section');card.className='task';
  const prompt=document.createElement('p');prompt.textContent=(i+1)+'. '+q.prompt;
  const input=document.createElement('input');input.placeholder='Type your answer';input.setAttribute('aria-label','Answer '+(i+1));
  const check=document.createElement('button');check.type='button';check.className='action secondary';check.textContent='Check answer';
  const hint=document.createElement('button');hint.type='button';hint.className='action secondary';hint.textContent='Hint';
  const status=document.createElement('p');status.className='practice-item-feedback';status.setAttribute('aria-live','polite');
  let tries=0;
  check.onclick=()=>{
   tries++;const norm=t=>String(t||'').toLowerCase().replace(/[.!?,]/g,'').replace(/\s+/g,' ').trim();
   const correct=norm(input.value)===norm(q.answer);
   status.textContent=correct?'✓ Correct!':tries<2?'Not quite. Try again.':'Hint: '+(q.hint||'Review the expression.');
   status.className='practice-item-feedback '+(correct?'correct':'incorrect');
   if(correct){check.disabled=true;input.disabled=true}
  };
  hint.onclick=()=>{status.textContent=q.hint||'Review the expression.'};
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();check.click()}});
  const actions=document.createElement('div');actions.className='practice-actions';actions.append(check,hint);
  card.append(prompt,input,actions,status);wrap.append(card);
 });holder.append(wrap);
};
window.artResetPage=function(){if(!confirm('Reset this page? This clears progress, selections, My Word Stock, My Grammar Stock and saved answers on this device.'))return;['webilang-art-lab-v1','webilang-art-lab-personal-stocks-v2','webilang-art-lab-lesson-progress-v3'].forEach(k=>localStorage.removeItem(k));location.reload()};
window.artShowKostya=function(force){let pane=document.getElementById('kostyaPane');pane.classList.toggle('hide',force===false?true:force===true?false:!pane.classList.contains('hide'))};
window.artKostyaSend=async function(e){e.preventDefault();const inp=document.getElementById('kostyaQuestion'),log=document.getElementById('kostyaLog'),q=inp.value.trim();if(!q)return;inp.value='';let x=document.createElement('div');x.className='kostya-msg user';x.textContent=q;log.append(x);let pending=document.createElement('div');pending.className='kostya-msg';pending.textContent='Kostya is thinking…';log.append(pending);try{const selected=document.querySelector('.panel.active h2')?.textContent||'Art Lab';const result=await coach({mode:'kostya',text:q,context:selected});pending.textContent=result.answer||'No answer returned.'}catch(err){pending.textContent='Kostya needs an active AI connection on this site. '+err.message}log.scrollTop=log.scrollHeight};
/* Grammar Stock v3: one clear save → practise workflow, based on Webilang's
   per-pattern approach. No generic suggestion chips or silent empty results. */
const artGrammarStoreKey='webilang-art-lab-personal-stocks-v2';
function getArtGrammarStore(){
 let data={};
 try{data=JSON.parse(localStorage.getItem(artGrammarStoreKey)||'{}')||{}}catch{}
 return {...data,grammar:Array.isArray(data.grammar)?data.grammar:[]};
}
function writeArtGrammarStore(data){
 localStorage.setItem(artGrammarStoreKey,JSON.stringify(data));
 try{if(typeof artStocks!=='undefined'){artStocks.grammar=data.grammar;renderStocks()}}catch(err){console.warn('Art Lab stock rendering:',err)}
}
function renderArtGrammarCards(){
 const root=document.getElementById('grammarCards');if(!root)return;
 const list=getArtGrammarStore().grammar;root.replaceChildren();
 const counter=document.getElementById('grammarCount');
 if(counter)counter.textContent=list.length+' saved';
 if(!list.length){
  const empty=document.createElement('div');empty.className='grammar-stock-empty';
  empty.textContent='No saved patterns yet. Record or type an answer, request AI feedback, then save a grammar suggestion.';
  root.append(empty);return;
 }
 list.forEach((entry,index)=>{
  const item=typeof entry==='string'?entry:(entry.pattern||entry.rule||String(entry));
  const card=document.createElement('div');card.className='saved-grammar-card';
  const num=document.createElement('span');num.className='grammar-card-num';num.textContent=String(index+1).padStart(2,'0');
  const label=document.createElement('strong');label.textContent=item;
  const row=document.createElement('div');row.className='saved-grammar-actions';
  const practise=document.createElement('button');practise.type='button';practise.textContent='▶ Practise';practise.className='grammar-practise-btn';
  practise.onclick=()=>window.artStockPractice('grammar',item);
  const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.className='grammar-remove-btn';
  remove.onclick=()=>{
   const data=getArtGrammarStore();data.grammar.splice(index,1);writeArtGrammarStore(data);renderArtGrammarCards();
   const target=document.getElementById('grammarExercise');if(target)target.replaceChildren();
  };
  row.append(practise,remove);card.append(num,label,row);root.append(card);
 });
}
window.artSaveGrammarItem=function(item,button){
 const s=String(item||'').trim();if(!s)return;
 const data=getArtGrammarStore();
 const exists=data.grammar.some(x=>String(x).trim().toLowerCase()===s.toLowerCase());
 if(!exists)data.grammar.push(s);
 writeArtGrammarStore(data);renderArtGrammarCards();
 if(button){
   button.textContent='✓ Saved to My Grammar Stock';
   button.classList.add('stock-saved');button.disabled=true;
   button.setAttribute('aria-pressed','true');
 }
 const message=button?.closest('.feedback-grammar')?.querySelector('.stock-save-status');
 if(message)message.textContent=exists?'Already saved.':'✓ Saved! Open My Grammar Stock to practise it.';
};
window.artSaveManualGrammar=function(){
 const input=document.getElementById('grammarInput');if(!input)return;
 const word=input.value.trim();if(!word){input.focus();return}
 window.artSaveGrammarItem(word);
 input.value='';
 const msg=document.getElementById('grammarPracticeInstruction');
 if(msg)msg.textContent='✓ Added '+word+'. Choose Practise next to the item to start.';
};
window.artStockPractice=async function(type,oneItem){
 const data=getArtGrammarStore();
 const items=type==='grammar'?(oneItem?[oneItem]:data.grammar):(data.words||[]);
 const holder=document.getElementById(type==='grammar'?'grammarExercise':'wordExercise');
 if(!holder)return;
 holder.replaceChildren();
 if(!items.length){holder.textContent='Nothing saved yet. Save an item first.';return}
 const heading=document.getElementById('grammarPracticeHeading');
 if(type==='grammar'&&heading)heading.textContent=oneItem?'Practise: '+oneItem:'Practice all saved structures';
 const pending=document.createElement('p');pending.className='grammar-practice-status';
 pending.textContent='✨ Creating personalized exercises…';pending.setAttribute('role','status');holder.append(pending);
 let questions=[];
 try{
  const result=await coach({mode:'practice',stockType:type,items:items.slice(-20)});
  if(!Array.isArray(result.questions))throw Error('The AI did not return a question list.');
  questions=result.questions.filter(q=>q && typeof q.prompt==='string' && q.prompt.trim() && typeof q.answer==='string' && q.answer.trim()).slice(0,7);
  if(!questions.length)throw Error('The AI returned no usable questions.');
 }catch(err){
  holder.replaceChildren();
  const fail=document.createElement('div');fail.className='grammar-practice-error';
  fail.textContent='AI exercises could not be generated: '+(err.message||'Connection error')+'. Your saved items are safe.';
  const retry=document.createElement('button');retry.type='button';retry.className='action secondary';retry.textContent='↻ Retry AI practice';
  retry.onclick=()=>window.artStockPractice(type,oneItem);fail.append(retry);holder.append(fail);return;
 }
 holder.replaceChildren();
 const intro=document.createElement('p');intro.className='grammar-practice-success';
 intro.textContent='✓ '+questions.length+' new exercises ready. Check every answer and try again if needed.';holder.append(intro);
 const stack=document.createElement('div');stack.className='generated-practice';
 questions.forEach((q,index)=>{
  const box=document.createElement('div');box.className='task';
  const title=document.createElement('p');title.className='grammar-task-prompt';title.textContent=(index+1)+'. '+q.prompt;
  const input=document.createElement('input');input.type='text';input.autocomplete='off';input.placeholder='Type the missing word or phrase';
  input.setAttribute('aria-label','Answer to grammar question '+(index+1));
  const controls=document.createElement('div');controls.className='grammar-task-controls';
  const check=document.createElement('button');check.type='button';check.className='action secondary';check.textContent='Check';
  const hint=document.createElement('button');hint.type='button';hint.className='action secondary';hint.textContent='Hint';
  const status=document.createElement('p');status.className='grammar-answer-status';status.setAttribute('aria-live','polite');
  let attempts=0;
  const normalize=s=>String(s||'').toLowerCase().replace(/[.!?,]/g,'').replace(/\s+/g,' ').trim();
  check.onclick=()=>{
   if(!input.value.trim()){status.textContent='Enter your answer first.';return}
   attempts++;
   if(normalize(input.value)===normalize(q.answer)){
    status.textContent='✓ Correct!';status.className='grammar-answer-status correct';
    input.disabled=true;check.disabled=true;
   }else{
    status.textContent=attempts>=2?'Try again. '+(q.hint||'Look at the structure.'):'Not quite. Try again.';
    status.className='grammar-answer-status incorrect';
   }
  };
  hint.onclick=()=>{status.textContent=q.hint||'Review your saved grammar pattern.'};
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();check.click()}});
  controls.append(check,hint);box.append(title,input,controls,status);stack.append(box);
 });
 holder.append(stack);
};
renderArtGrammarCards();

})();
