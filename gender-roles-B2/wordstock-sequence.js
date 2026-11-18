/* Webilang Gender Roles · My Word Stock v6
   Same learning sequence as Russian Unscripted: Recognition → Retrieval → Production.
   Keep genderRolesAIStocks_v1 and all selected words; do not touch Grammar Stock. */
(()=>{
 'use strict';
 const KEY='genderRolesAIStocks_v1',API='/api/gender-wordstock-practice';
 const root=document.getElementById('wl-wordstock-repaired');
 if(!root)return;
 const $=id=>document.getElementById(id);
 const list=$('wl-word-items'),out=$('wl-word-exercises'),msg=$('wl-word-message'),go=$('wl-word-practice'),clear=$('wl-word-clear');
 const selected=new Set(),sessions=new Map();let activeKey='',building=false;
 const word=w=>typeof w==='string'?w.trim():String(w?.word||w?.text||w?.phrase||'').trim();
 const norm=s=>String(s||'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();
 const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return Array.isArray(v.words)?v.words:[]}catch{return []}};
 const write=items=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');v.words=items;localStorage.setItem(KEY,JSON.stringify(v));window.dispatchEvent(new Event('wl-word-items-updated'));return true}catch{return false}};
 const say=s=>{if(!window.speechSynthesis)return;const u=new SpeechSynthesisUtterance(s);u.lang='en-US';speechSynthesis.cancel();speechSynthesis.speak(u)};
 const node=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x};
 const button=(label,fn,cls='')=>{const b=node('button',cls,label);b.type='button';b.onclick=fn;return b};
 const escStatus=(text,type='')=>{msg.textContent=text;msg.dataset.type=type;};
 const uniqueWords=()=>{const seen=new Set();return read().map((w,i)=>({raw:w,id:i,value:word(w)})).filter(w=>{const k=norm(w.value);if(!k||seen.has(k))return false;seen.add(k);return true})};
 function drawList(){
  const words=uniqueWords();list.replaceChildren();
  const count=$('wordCountDisplay');if(count)count.textContent=words.length+' items saved';
  if(!words.length){list.append(node('p','wl-stock-empty','No words yet. Save expressions from the story, reading, listening or Nova and Chaz interviews.'));return}
  const available=new Set(words.map(w=>norm(w.value)));
  for(const k of [...selected])if(!available.has(k))selected.delete(k);
  // First load respects previously selected words. Later, selection is controlled by this UI.
  if(!drawList.initialized){words.forEach(w=>{if(w.raw.selected&&selected.size<6)selected.add(norm(w.value))});drawList.initialized=true;}
  words.forEach(w=>{
   const k=norm(w.value);const row=node('div','wl6-word-row');const label=node('label','wl6-word-label');
   const check=document.createElement('input');check.type='checkbox';check.checked=selected.has(k);
   check.onchange=()=>{
    if(check.checked&&selected.size>=6){check.checked=false;escStatus('Select up to six expressions at a time.');return;}
    if(check.checked)selected.add(k);else selected.delete(k);
    const items=read();for(const it of items){if(norm(word(it))===k&&typeof it==='object')it.selected=check.checked;}
    write(items);drawList();
   };
   label.append(check,node('strong','',w.value));
   row.append(label,node('span','wl6-source',String(w.raw?.source||'Personal vocabulary')));
   row.append(button('▶ Listen',()=>say(w.value),'wl6-mini'));
   row.append(button('Remove',()=>{
    const items=read().filter(it=>norm(word(it))!==k);if(write(items)){selected.delete(k);sessions.delete(k);if(activeKey===k){activeKey='';out.replaceChildren();}drawList();}
   },'wl6-mini wl6-remove'));
   list.append(row);
  });
 }
 function progressBar(session){
  const bar=node('div','wl6-progress');
  ['Recognition','Retrieval','Production'].forEach((name,i)=>{
   const b=button((i+1)+' · '+name,()=>{if(i>session.maxStage)return;session.stage=i;drawPractice(session)},'wl6-stage '+(i===session.stage?'active':'')+(i>session.maxStage?' locked':'')+(session.attempted[i]?' attempted':''));
   b.disabled=i>session.maxStage;
   bar.append(b);
  });
  return bar;
 }
 function drawPractice(session){
  const q=session.questions[session.stage],stage=session.stage;
  out.replaceChildren();const section=node('section','wl6-practice-card');
  const head=node('div','wl6-head');
  head.append(node('div','wl6-eyebrow','YOUR WORD · '+(session.stage+1)+' OF 3'));
  head.append(node('h3','',session.word));
  head.append(button('▶ Pronounce',()=>say(session.word),'wl6-mini'));
  section.append(head,progressBar(session));
  if(stage===0&&q.context)section.append(node('p','wl6-context',q.context));
  section.append(node('p','wl6-prompt',q.prompt));
  const status=node('p','wl6-feedback');status.setAttribute('role','status');
  if(stage===0){
   const opts=node('div','wl6-options');
   q.options.forEach(opt=>{
    const label=node('label','wl6-option');const radio=document.createElement('input');
    radio.type='radio';radio.name='wl6-recognition';radio.value=opt;radio.checked=session.answers[stage]===opt;
    radio.onchange=()=>{session.answers[stage]=opt;status.textContent='';};
    label.append(radio,node('span','',opt));opts.append(label);
   });
   section.append(opts);
  }else{
   const input=document.createElement(stage===1?'input':'textarea');input.className='wl6-answer';input.placeholder=stage===1?'Complete the gap without looking at the heading':'Write 1–3 natural sentences';
   if(stage===1)input.type='text';else input.rows=4;
   input.value=session.answers[stage]||'';input.oninput=()=>{session.answers[stage]=input.value};
   section.append(input);
  }
  const actions=node('div','wl6-actions');
  const check=button(stage===2?'✨ Get AI feedback':'✓ Check my answer',async()=>{
    let answer=session.answers[stage]||'';
    if(!answer.trim()){status.textContent='Please give an answer first.';return}
    if(stage===0||stage===1){
      const ok=norm(answer)===norm(q.answer);
      session.attempted[stage]=true;session.maxStage=Math.max(session.maxStage,stage+1);
      status.textContent=ok?'✓ Correct — well done.':'Not quite. '+(stage===0?'Read the context carefully and try again.':'Check the context and try another form.');
      status.dataset.correct=String(ok);
      const reveal=node('p','wl6-model','Target answer: '+q.answer);const previous=section.querySelector('.wl6-model');if(previous)previous.remove();section.append(reveal);
      actions.replaceChildren();
      actions.append(button('Try again',()=>{session.answers[stage]='';drawPractice(session)},'wl6-mini'));
      actions.append(button('Next →',()=>{session.stage=Math.min(2,stage+1);drawPractice(session)},'wl6-next'));
      section.replaceChild(progressBar(session),section.querySelector('.wl6-progress'));
    }else{
      check.disabled=true;status.textContent='Checking your B2 response…';
      try{
       const d=await request({action:'assess',item:session.word,prompt:q.prompt,answer});
       session.attempted[2]=true;status.textContent=(d.appropriate?'✓ ':'↻ ')+d.feedback+(d.suggestion?' Suggested phrasing: '+d.suggestion:'');
       status.dataset.correct=String(d.appropriate);
       const model=node('p','wl6-model','One possible answer: '+q.modelAnswer);
       const old=section.querySelector('.wl6-model');if(old)old.remove();section.append(model);
       actions.append(button('Practise another word →',()=>{out.replaceChildren();escStatus('Choose a saved expression and build another practice sequence.')},'wl6-next'));
      }catch(e){status.textContent=e.message||'AI feedback unavailable. Your answer is preserved.'}
      finally{check.disabled=false;}
    }
   },'wl6-next');
  actions.append(check);
  actions.append(button('Hint',()=>{let h=section.querySelector('.wl6-hint');if(h){h.remove();return}section.insertBefore(node('p','wl6-hint',q.hint||'Use the context for clues.'),actions)},'wl6-mini'));
  if(stage>0)actions.append(button('← Previous',()=>{session.stage=stage-1;drawPractice(session)},'wl6-mini'));
  section.append(actions,status);out.append(section);
 }
 async function request(body){
  const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(d.error||'AI practice unavailable');return d;
 }
 async function start(){
  if(building)return;
  const words=uniqueWords().filter(w=>selected.has(norm(w.value)));
  if(!words.length){escStatus('Select one or more saved expressions first.');return}
  if(words.length>6){escStatus('Select no more than six expressions.');return}
  // Select a single expression at a time; each expression gets three purposeful stages.
  out.replaceChildren();const chooser=node('div','wl6-chooser');
  chooser.append(node('h3','','Choose a word to practise'));
  const strip=node('div','wl6-chooser-buttons');
  for(const w of words){
   const b=button(w.value,async()=>{
    const k=norm(w.value);activeKey=k;const existing=sessions.get(k);
    if(existing){drawPractice(existing);return}
    building=true;for(const el of strip.querySelectorAll('button'))el.disabled=true;
    escStatus('Building contextual B2 exercises for “'+w.value+'”…');
    try{
      const d=await request({action:'build',item:w.value});
      if(k!==activeKey)return;
      if(!Array.isArray(d.questions)||d.questions.length!==3)throw Error('The practice sequence is incomplete.');
      const session={word:w.value,questions:d.questions,stage:0,maxStage:0,attempted:[false,false,false],answers:['','','']};
      sessions.set(k,session);drawPractice(session);
      escStatus('Ready: Recognition → Retrieval → Production.');
    }catch(err){escStatus(err.message||'Could not build reliable exercises. No answers were changed.','error');out.replaceChildren();out.append(chooser)}
    finally{building=false;for(const el of strip.querySelectorAll('button'))el.disabled=false}
   },'wl6-choice');
   strip.append(b);
  }
  chooser.append(strip);out.append(chooser);escStatus('Pick one expression. Complete all three stages, then choose another.');
 }
 // Replace only legacy Word Stock buttons; retain all original lesson integrations.
 go.onclick=start;
 clear.onclick=()=>{
  selected.clear();const words=read();words.forEach(w=>{if(typeof w==='object')w.selected=false});
  write(words);drawList();escStatus('Selection cleared. Existing practice answers were preserved.');
 };
 $('wordStockSelectAll')?.addEventListener('click',()=>{const words=read();selected.clear();for(const it of words){if(selected.size>=6)break;const k=norm(word(it));if(k)selected.add(k);}words.forEach(it=>{if(typeof it==='object')it.selected=selected.has(norm(word(it)))});write(words);drawList()});
 $('wordStockDeselect')?.addEventListener('click',()=>clear.click());
 window.addEventListener('gender-roleplay-stock-updated',drawList);
 window.addEventListener('storage',e=>{if(e.key===KEY)drawList()});
 document.querySelectorAll('[data-tab="wordstock"]').forEach(b=>b.addEventListener('click',()=>setTimeout(drawList,0)));
 drawList();
})();
