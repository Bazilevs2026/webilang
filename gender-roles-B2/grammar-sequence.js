/* Gender Roles B2 · two independent four-stage rule pathways.
   Existing Grammar Stock, Word Stock and other tabs are untouched. */
(()=>{
'use strict';
const root=document.getElementById('gender-grammar-two-columns');
if(!root)return;
const defs=[
 {id:'ing',label:'Rule 1 · Preposition + -ing',rule:'After a preposition, use a gerund (verb-ing).',
  support:'by entering · without depending · after completing · instead of giving up',
  example:'Women gained independence by entering higher education.',
  recognize:[
   {stem:'Women gained greater independence by ___ higher education.',correct:'entering',options:['enter','entering','entered'],why:'After by, the verb takes -ing.'},
   {stem:'She continued working without ___ on her former husband.',correct:'depending',options:['depend','depending','depended'],why:'Without is a preposition; it is followed by a gerund.'},
   {stem:'After ___ her PhD, Elena pursued an academic career.',correct:'completing',options:['complete','completing','completed'],why:'After functions as a preposition here, so use -ing.'},
   {stem:'Instead of ___ up, she supported her family.',correct:'giving',options:['give','giving','gave'],why:'Instead of is followed by a noun or gerund.'}
  ],
  paraphrase:[
   {original:'She gained confidence because she began speaking in meetings.',variants:[
    {text:'She gained confidence by speaking in meetings.',correct:true,en:'By + -ing expresses the method that helped her gain confidence.',ru:'By + -ing обозначает способ: уверенность появилась благодаря выступлениям.'},
    {text:'She gained confidence by speak in meetings.',correct:false,en:'By is a preposition and requires speaking, not the base form speak.',ru:'После предлога by нужна форма speaking, а не начальная форма speak.'},
    {text:'She gained confidence without speaking in meetings.',correct:false,en:'Without changes the meaning: it says she did not speak in meetings.',ru:'Without меняет смысл: получается, что она не выступала на собраниях.'}
   ]},
   {original:'She did not ask permission; she made the decision herself.',variants:[
    {text:'Instead of asking permission, she made the decision herself.',correct:true,en:'Instead of + -ing expresses the action she chose not to do.',ru:'Instead of + -ing показывает действие, от которого она отказалась.'},
    {text:'Instead of ask permission, she made the decision herself.',correct:false,en:'After instead of, the verb must be asking, not ask.',ru:'После instead of нужен герундий asking, а не ask.'},
    {text:'After asking permission, she made the decision herself.',correct:false,en:'After asking says that she asked permission first; the original says she did not.',ru:'After asking означает, что она сначала попросила разрешения; в исходной фразе она этого не делала.'}
   ]}
,
   {original:"Her manager did not interrupt her when she presented her proposal.",variants:[{text:"Her manager listened without interrupting her presentation.",correct:true,en:"Without + interrupting expresses that no interruption occurred.",ru:"Without + interrupting означает, что руководитель не перебивал выступающую."},{text:"Her manager listened without interrupt her presentation.",correct:false,en:"After the preposition without, use interrupting rather than interrupt.",ru:"После предлога without нужна форма interrupting, а не interrupt."},{text:"Her manager listened after interrupting her presentation.",correct:false,en:"After interrupting means he interrupted her first, reversing the original meaning.",ru:"After interrupting означает, что он сначала перебил её, а это противоположно исходному смыслу."}]},
   {original:"She checked the evidence first and then challenged the claim.",variants:[{text:"After checking the evidence, she challenged the claim.",correct:true,en:"After + checking correctly shows the order of the two actions.",ru:"After + checking правильно передаёт последовательность двух действий."},{text:"After check the evidence, she challenged the claim.",correct:false,en:"After as a preposition requires checking, not check.",ru:"После предлога after нужен герундий checking, а не check."},{text:"Instead of checking the evidence, she challenged the claim.",correct:false,en:"Instead of checking implies that she skipped the checking stage.",ru:"Instead of checking означает, что проверки не было, хотя исходное предложение говорит обратное."}]},
   {original:"They decided to negotiate rather than abandon the project.",variants:[{text:"Instead of abandoning the project, they decided to negotiate.",correct:true,en:"Instead of + abandoning expresses negotiation as an alternative to giving up.",ru:"Instead of + abandoning показывает, что они выбрали переговоры вместо отказа от проекта."},{text:"Instead of abandon the project, they decided to negotiate.",correct:false,en:"Instead of must be followed by abandoning, not abandon.",ru:"После instead of нужна форма abandoning, а не abandon."},{text:"After abandoning the project, they decided to negotiate.",correct:false,en:"After abandoning says they had already given up the project.",ru:"After abandoning означает, что они уже отказались от проекта; смысл меняется."}]}
  ],
  retrieval:[
   {prompt:'Она добилась независимости, получив образование.',model:'She gained independence by getting an education.'},
   {prompt:'Она продолжала работать, не полагаясь на поддержку мужа.',model:'She continued working without relying on her husband for support.'}
,
   {prompt:"Она улучшила свои навыки, участвуя в совместных проектах.",model:"She improved her skills by taking part in collaborative projects."},
   {prompt:"Он ответил на критику, не переходя на личности.",model:"He responded to criticism without making personal attacks."},
   {prompt:"Вместо того чтобы спорить, они предложили компромисс.",model:"Instead of arguing, they suggested a compromise."}
  ],
  production:'A colleague says that professional progress depends entirely on luck. Explain a practical action that can help people become more independent. Use a preposition + -ing structure naturally.',
  model:'People can become more independent by developing professional skills.'
 },
 {id:'contrast',label:'Rule 2 · Concession and contrast',rule:'Although / even though + clause; despite / in spite of + noun or -ing; whereas / while + contrasting clause.',
  support:'although + clause · despite + noun/-ing · whereas + clause',
  example:'Although both parents worked, she did more domestic work.',
  recognize:[
   {stem:'___ women had access to paid work, many still carried domestic responsibilities.',correct:'Although',options:['Despite','Although','In spite of'],why:'Although introduces a full clause: women had access.'},
   {stem:'___ having a demanding career, she supported her family.',correct:'Despite',options:['Despite','Although','Whereas'],why:'Despite takes a noun or gerund, here having.'},
   {stem:'Some jobs offer flexible hours, ___ others require fixed schedules.',correct:'whereas',options:['despite','whereas','in spite of'],why:'Whereas joins two contrasting clauses.'},
   {stem:'___ both partners working, housework was divided unequally.',correct:'Despite',options:['Although','Despite','Whereas'],why:'Despite can be followed by the gerund phrase both partners working.'}
  ],
  paraphrase:[
   {original:'Although she had a demanding career, she still supported her family.',variants:[
    {text:'Despite having a demanding career, she still supported her family.',correct:true,en:'Despite + -ing preserves the concession expressed by although + clause.',ru:'Despite + -ing сохраняет уступительное значение although + полного предложения.'},
    {text:'Despite she had a demanding career, she still supported her family.',correct:false,en:'Despite cannot directly introduce a full finite clause. Use despite having or although she had.',ru:'После despite нельзя сразу ставить полное предложение. Нужно despite having или although she had.'},
    {text:'Because she had a demanding career, she still supported her family.',correct:false,en:'Because expresses cause, whereas although expresses an unexpected contrast.',ru:'Because выражает причину, а although — уступку, вопреки ожиданиям.'}
   ]},
   {original:'Men and women had similar legal rights, but domestic duties remained unequal.',variants:[
    {text:'Although men and women had similar legal rights, domestic duties remained unequal.',correct:true,en:'Although introduces a contrast between legal rights and unequal domestic duties.',ru:'Although показывает контраст между юридическим равенством и неравным распределением обязанностей.'},
    {text:'Despite men and women had similar legal rights, domestic duties remained unequal.',correct:false,en:'Despite requires a noun or -ing phrase, not the clause men and women had.',ru:'После despite нужно существительное или -ing конструкция, а не предложение men and women had.'},
    {text:'Because men and women had similar legal rights, domestic duties remained unequal.',correct:false,en:'Because incorrectly changes the contrast into a cause-and-effect relationship.',ru:'Because ошибочно превращает противопоставление в причинно-следственную связь.'}
   ]}
,
   {original:"The company offered equal salaries, but promotion opportunities were unequal.",variants:[{text:"Although the company offered equal salaries, promotion opportunities were unequal.",correct:true,en:"Although introduces a clause and retains the contrast between pay and promotion.",ru:"Although присоединяет полное предложение и сохраняет противопоставление оплаты и продвижения."},{text:"Despite the company offered equal salaries, promotion opportunities were unequal.",correct:false,en:"Despite cannot directly introduce the clause the company offered.",ru:"После despite нельзя сразу ставить полное предложение the company offered."},{text:"Because the company offered equal salaries, promotion opportunities were unequal.",correct:false,en:"Because replaces the original contrast with an unsupported cause.",ru:"Because заменяет противопоставление необоснованной причиной."}]},
   {original:"Some employees prefer remote work, but others work better in an office.",variants:[{text:"Some employees prefer remote work, whereas others work better in an office.",correct:true,en:"Whereas connects contrasting clauses without changing either preference.",ru:"Whereas соединяет противопоставленные предложения, сохраняя их смысл."},{text:"Some employees prefer remote work, despite others work better in an office.",correct:false,en:"Despite cannot be followed immediately by a full finite clause.",ru:"После despite нельзя сразу ставить полное предложение."},{text:"Some employees prefer remote work because others work better in an office.",correct:false,en:"Because creates a causal link missing from the original.",ru:"Because добавляет причинную связь, которой нет в исходной фразе."}]},
   {original:"She applied for the position even though she did not meet every requirement.",variants:[{text:"Despite not meeting every requirement, she applied for the position.",correct:true,en:"Despite + not meeting retains the concession in the original.",ru:"Despite + not meeting сохраняет уступительное значение исходного предложения."},{text:"Despite she did not meet every requirement, she applied for the position.",correct:false,en:"Despite does not introduce a complete finite clause; use despite not meeting.",ru:"После despite нельзя ставить полное предложение; используйте despite not meeting."},{text:"Because she did not meet every requirement, she applied for the position.",correct:false,en:"Because falsely makes missing requirements the reason for applying.",ru:"Because ошибочно представляет несоответствие требованиям как причину подачи заявки."}]}
  ],
  retrieval:[
   {prompt:'Хотя оба родителя работали, мать делала большую часть домашней работы.',model:'Although both parents worked, the mother did most of the housework.'},
   {prompt:'Несмотря на опыт, её не пригласили на собеседование.',model:'Despite her experience, she was not invited for an interview.'}
,
   {prompt:"Хотя у них одинаковые должности, их зарплаты различаются.",model:"Although they have the same job titles, their salaries differ."},
   {prompt:"Несмотря на высокий уровень квалификации, ей отказали в повышении.",model:"Despite her high qualifications, she was denied a promotion."},
   {prompt:"Одни сотрудники предпочитают гибкий график, тогда как другие выбирают стабильные часы.",model:"Some employees prefer flexible schedules, whereas others choose fixed hours."}
  ],
  production:'A friend claims that equal laws always mean equal opportunities at work and at home. Respond with a meaningful contrast using although, despite, whereas or another suitable concession structure.',
  model:'Although the law provides equal rights, everyday opportunities can still differ.'
 }
];
const progress=new Map();
const make=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
const button=(txt,fn,cls='')=>{const b=make('button',cls,txt);b.type='button';b.onclick=fn;return b};
const normalize=t=>String(t||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const say=text=>{if(!window.speechSynthesis)return;const u=new SpeechSynthesisUtterance(text);u.lang='en-US';speechSynthesis.cancel();speechSynthesis.speak(u)};
const note=(parent,en,ru,good)=>{
 const box=make('div','gg-note '+(good?'good':'needs-work'));
 box.append(make('p','',en),make('p','gg-russian','🇷🇺 '+ru));
 parent.replaceChildren(box);
};
async function assess(rule,stage,answer,prompt,model){
 const r=await fetch('/api/gender-grammar-practice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rule,stage,answer,prompt,model})});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'AI feedback unavailable');return d;
}
function init(rule){
 const section=document.getElementById('gg-'+rule.id);
 if(!section)return;
 const st={stage:0,unlocked:0,rec:{},para:{},retrieval:{},production:'',passed:{}};
 progress.set(rule.id,st);
 const controls=make('div','gg-steps'),slot=make('div','gg-work');
 section.append(controls,slot);
 function mark(stage,done){st.passed[stage]=done;if(done)st.unlocked=Math.max(st.unlocked,Math.min(3,stage+1));render()}
 function render(){
  controls.replaceChildren();
  ['Recognition','Paraphrase','Retrieval','Production'].forEach((title,i)=>{
   const b=button((st.passed[i]?'✓ ':i+1+' · ')+title,()=>{if(i<=st.unlocked){st.stage=i;render()}},'gg-step'+(st.stage===i?' selected':''));
   b.disabled=i>st.unlocked;controls.append(b);
  });
  slot.replaceChildren();
  if(st.stage===0)recognition();
  if(st.stage===1)paraphrase();
  if(st.stage===2)retrieval();
  if(st.stage===3)production();
 }
 function next(stage){
  const bar=make('div','gg-next');
  if(st.passed[stage]&&stage<3)bar.append(button('Next: '+['','Paraphrase','Retrieval','Production'][stage+1]+' →',()=>{st.stage=stage+1;render()},'gg-primary'));
  slot.append(bar);
 }
 function recognition(){
  slot.append(make('h4','','1 · Recognize the correct form'));
  const done=make('div','gg-status');
  rule.recognize.forEach((x,i)=>{
   const row=make('div','gg-item');row.append(make('p','gg-prompt',(i+1)+'. '+x.stem));
   const sel=make('select','gg-answer');sel.append(new Option('Choose…',''));
   x.options.forEach(o=>sel.append(new Option(o,o)));sel.value=st.rec[i]||'';
   sel.onchange=()=>{st.rec[i]=sel.value;row.querySelector('.gg-feedback').replaceChildren()};
   const feedback=make('div','gg-feedback');
   row.append(sel,button('Check',()=>{
    if(!sel.value){feedback.textContent='Choose an answer first.';return}
    const correct=sel.value===x.correct;
    note(feedback,correct?x.why:'Check the form. '+x.why,correct?'Верно. '+({ing:'После предлога используется -ing.',contrast:'Проверьте, что стоит после союза или предлога.'}[rule.id]):'Неверно. '+({ing:'После предлога обычно нужна форма -ing.',contrast:'После although идёт полное предложение; после despite — существительное или -ing.'}[rule.id]),correct);
    st.rec[i]=sel.value;st.rec['ok'+i]=correct;
    if(rule.recognize.every((_,index)=>st.rec['ok'+index])){st.passed[0]=true;st.unlocked=Math.max(st.unlocked,1);done.textContent='✓ Recognition complete. Open Paraphrase.';renderTabsOnly()}
   },'gg-secondary'),feedback);slot.append(row);
  });
  slot.append(done);next(0);
 }
 function renderTabsOnly(){
  controls.replaceChildren();
  ['Recognition','Paraphrase','Retrieval','Production'].forEach((title,i)=>{const b=button((st.passed[i]?'✓ ':i+1+' · ')+title,()=>{if(i<=st.unlocked){st.stage=i;render()}},'gg-step'+(st.stage===i?' selected':''));b.disabled=i>st.unlocked;controls.append(b)});
 }
 function paraphrase(){
  slot.append(make('h4','','2 · Choose the best paraphrase'));
  slot.append(make('p','gg-instruction','Each alternative must preserve both grammar and meaning. Check an option to see why it works or fails — in English and Russian.'));
  const done=make('div','gg-status');
  rule.paraphrase.forEach((x,i)=>{
   const card=make('section','gg-item');card.append(make('p','gg-prompt','Original: '+x.original));
   const options=make('div','gg-options');
   x.variants.forEach((v,j)=>{
    const label=make('label','gg-option');const input=document.createElement('input');input.type='radio';input.name='gg-'+rule.id+'-'+i;input.value=String(j);input.checked=st.para[i]===j;
    input.onchange=()=>{st.para[i]=j;card.querySelector('.gg-feedback').replaceChildren()};
    label.append(input,make('span','',v.text));options.append(label)
   });
   const fb=make('div','gg-feedback');
   card.append(options,button('Check paraphrase',()=>{
    const choice=st.para[i];if(choice===undefined){fb.textContent='Choose an option first.';return}
    const v=x.variants[choice];note(fb,(v.correct?'✓ Correct. ':'Not quite. ')+v.en,v.ru,v.correct);
    st.para['ok'+i]=v.correct;
    if(rule.paraphrase.every((_,j)=>st.para['ok'+j])){st.passed[1]=true;st.unlocked=Math.max(st.unlocked,2);done.textContent='✓ Paraphrase complete. Open Retrieval.';renderTabsOnly()}
   },'gg-secondary'),fb);slot.append(card);
  });
  slot.append(done);next(1);
 }
 function retrieval(){
  slot.append(make('h4','','3 · Translate into English'));
  slot.append(make('p','gg-instruction','Translate short Russian sentences using this grammar structure. Capitalization and punctuation are ignored. Different accurate translations are welcome.'));
  const done=make('div','gg-status');
  rule.retrieval.forEach((x,i)=>{
   const card=make('section','gg-item');card.append(make('p','gg-prompt','🇷🇺 '+x.prompt));
   const input=make('textarea','gg-translation');input.rows=2;input.placeholder='Write your translation…';input.value=st.retrieval[i]?.answer||'';
   const fb=make('div','gg-feedback');
   input.oninput=()=>{st.retrieval[i]={...(st.retrieval[i]||{}),answer:input.value}};
   const check=button('✨ AI check',async()=>{
    if(!input.value.trim()){fb.textContent='Write a translation first.';return}
    check.disabled=true;fb.textContent='Checking grammar and meaning…';
    try{const d=await assess(rule.id,'retrieval',input.value,x.prompt,x.model);
     note(fb,d.feedbackEn+(d.suggestion?' Suggested: '+d.suggestion:''),d.feedbackRu,d.correct);
     st.retrieval[i]={answer:input.value,correct:d.correct};
     if(rule.retrieval.every((_,j)=>st.retrieval[j]?.correct)){st.passed[2]=true;st.unlocked=Math.max(st.unlocked,3);done.textContent='✓ Retrieval complete. Open Production.';renderTabsOnly()}
    }catch(e){fb.textContent=e.message}finally{check.disabled=false}
   },'gg-primary');
   card.append(input,button('🎙 Speak',()=>{
    const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Speech){fb.textContent='Speech recognition unavailable here; you can type.';return}
    const rec=new Speech();rec.lang='en-US';rec.onresult=e=>{input.value=e.results[0][0].transcript;input.dispatchEvent(new Event('input'))};
    rec.onerror=e=>{fb.textContent='Microphone error: '+e.error};rec.start();
   },'gg-secondary'),check,fb);
   if(st.retrieval[i]?.correct)card.append(button('▶ Listen to model',()=>say(x.model),'gg-secondary'));
   slot.append(card);
  });
  slot.append(done);next(2);
 }
 function production(){
  slot.append(make('h4','','4 · Produce your own language'));
  slot.append(make('p','gg-prompt',rule.production));
  slot.append(make('p','gg-instruction','Use the target structure accurately. AI feedback checks only formal grammar and appropriate structure use, not your opinions.'));
  const field=make('textarea','gg-translation');field.rows=4;field.placeholder='Your original response…';field.value=st.production;
  field.oninput=()=>{st.production=field.value};slot.append(field);
  const fb=make('div','gg-feedback');
  const check=button('✨ AI grammar feedback',async()=>{
   if(!field.value.trim()){fb.textContent='Write your answer first.';return}
   check.disabled=true;fb.textContent='Checking the target grammar structure…';
   try{const d=await assess(rule.id,'production',field.value,rule.production,rule.model);
    note(fb,d.feedbackEn+(d.suggestion?' Suggested: '+d.suggestion:''),d.feedbackRu,d.correct);
    if(d.correct){st.passed[3]=true;renderTabsOnly()}
   }catch(e){fb.textContent=e.message}finally{check.disabled=false}
  },'gg-primary');
  slot.append(check,fb);
 }
 render();
}
defs.forEach(d=>init(d));
window.genderGrammarPractice=progress;
})();