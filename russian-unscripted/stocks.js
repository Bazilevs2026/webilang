/* Webilang Global account-bound Stocks; never persist words in localStorage. */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '/student-memory/config.js';
const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let currentUser=null;let wordRows=[],grammarRows=[];let sessionSerial=0;
const norm=s=>String(s||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('ru');
const wordOf=r=>r.content?.item?.word||r.content?.item?.phrase||r.content?.text||'';
const grammarOf=r=>r.content?.item?.pattern||r.content?.item?.rule||r.content?.item?.text||r.content?.text||'';
// Russian Unscripted displays only Cyrillic-language material. Foreign-language
// entries are not deleted; they stay available in their original modules.
const russianEntry=(row,value)=>/[А-Яа-яЁё]/.test(String(value||'')) && !(/art lab|gender roles|video games/i.test(String(row.module||'')+' '+String(row.content?.item?.source||'')));
async function ensureUser(){const {data,error}=await db.auth.getUser();if(error||!data?.user)throw Error('Войдите в аккаунт Webilang Global');if(currentUser&&currentUser!==data.user.id)throw Error('Аккаунт изменился. Обновите страницу.');currentUser=data.user.id;return currentUser}
async function getRows(){const user=await ensureUser(),rows=[];for(let i=0;i<5000;i+=500){const {data,error}=await db.from('student_learning_entries').select('id,user_id,module,kind,content,created_at').eq('user_id',user).eq('kind','memory_note').order('created_at',{ascending:false}).range(i,i+499);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<500)break}return rows}
function refreshUI(){window.ruStockState.words.length=0;window.ruStockState.grammar.length=0;window.ruStockState.words.push(...[...new Map(wordRows.map(x=>[norm(wordOf(x)),wordOf(x)]))].map(x=>x[1]));window.ruStockState.grammar.push(...[...new Map(grammarRows.map(x=>[norm(grammarOf(x)),grammarOf(x)]))].map(x=>x[1]));if([7,8].includes(window.ruStockState.getActive()))window.ruStockState.render()}
async function refresh(){const stamp=++sessionSerial;try{const rows=await getRows();if(stamp!==sessionSerial)return;wordRows=rows.filter(r=>r.content?.type==='words'&&russianEntry(r,wordOf(r)));grammarRows=rows.filter(r=>['grammar','grammar_pattern','grammar_patterns'].includes(r.content?.type)&&russianEntry(r,grammarOf(r)));refreshUI()}catch(e){wordRows=[];grammarRows=[];refreshUI();console.info('Account Stocks unavailable:',e.message)}}
async function insert(type,text){const user=await ensureUser();const item=type==='words'?{word:text,source:'Russian Unscripted'}:{pattern:text,source:'Russian Unscripted'};const {data,error}=await db.from('student_learning_entries').insert({user_id:user,module:'Russian Unscripted',kind:'memory_note',content:{source:'webilang-ai-stock-v1',version:1,type,item,text}}).select('id,user_id,module,kind,content,created_at').single();if(error)throw Error(error.message);return data}
window.ruStockBridge={
 async saveWords(words){await ensureUser();const existing=await getRows();const used=new Set(existing.filter(r=>r.content?.type==='words').map(r=>norm(wordOf(r))));for(const w of words){const value=String(w).trim();if(!value||used.has(norm(value)))continue;const row=await insert('words',value);wordRows.unshift(row);used.add(norm(value))}refreshUI()},
 async saveGrammar(pattern){await ensureUser();const value=String(pattern).trim();if(!value)return;const existing=await getRows();if(!existing.some(r=>['grammar','grammar_pattern','grammar_patterns'].includes(r.content?.type)&&norm(grammarOf(r))===norm(value))){grammarRows.unshift(await insert('grammar',value))}refreshUI()},
 async remove(kind,index){const user=await ensureUser(),value=(kind==='word'?window.ruStockState.words:window.ruStockState.grammar)[index];if(!value)throw Error('Материал не найден');const rows=kind==='word'?wordRows:grammarRows;const match=rows.filter(r=>norm(kind==='word'?wordOf(r):grammarOf(r))===norm(value));for(const row of match){const {error}=await db.from('student_learning_entries').delete().eq('id',row.id).eq('user_id',user);if(error)throw Error(error.message)}await refresh()},
 refresh
};
await refresh();db.auth.onAuthStateChange(()=>{currentUser=null;wordRows=[];grammarRows=[];refreshUI();setTimeout(refresh,0)});
