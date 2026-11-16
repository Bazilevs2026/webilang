const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const types=['gap','meaning','collocation','completion','production'];
const fixture=target=>({exercises:types.map(type=>({type,target,prompt:`Practise ${target}`,answer:type==='meaning'?'A job':target,options:type==='meaning'?['A job','A colour','A place']:[],hint:'Use the context.',explanation:'The word fits this meaning.'}))});
test('authenticated single-target A2–B1 API contract and failure handling',async()=>{
  const {default:handler}=await import(pathToFileURL(path.resolve(__dirname,'../api/artlab-word-practice.js')));
  const oldFetch=global.fetch,oldKey=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-only';
  let output=fixture('commission'),calls=[],authOK=true;
  global.fetch=async(url,options)=>{
    calls.push({url,options});
    if(url.endsWith('/auth/v1/user'))return {ok:authOK,json:async()=>({id:'student-a'})};
    assert.equal(url,'https://api.openai.com/v1/chat/completions');
    return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(output)}}]})};
  };
  const run=async(body,authorization='Bearer test-session',method='POST')=>{
    let status,data;const res={setHeader(){},status(value){status=value;return this},json(value){data=value;return this}};
    await handler({method,headers:{authorization},body},res);return {status,data};
  };
  try{
    assert.equal((await run({},'','GET')).status,405);
    assert.equal((await run({mode:'generate',target:'commission'},'')).status,401);assert.equal(calls.length,0);
    authOK=false;assert.equal((await run({mode:'generate',target:'commission'})).status,401);authOK=true;
    assert.equal((await run({mode:'generate',target:''})).status,400);
    for(const target of ['commission','cover']){
      output=fixture(target);const result=await run({mode:'generate',target});assert.equal(result.status,200);assert.equal(result.data.exercises.length,5);
      assert.ok(result.data.exercises.every(q=>q.target===target));
      const request=JSON.parse(calls.at(-1).options.body);assert.deepEqual(JSON.parse(request.messages[1].content),{target});
      assert.match(request.messages[0].content,/A2–B1/);assert.match(request.messages[0].content,/ONE target/);
    }
    output=fixture('commission');output.exercises[2].target='cover';assert.equal((await run({mode:'generate',target:'commission'})).status,502);
    output=fixture('commission');output.exercises.pop();assert.equal((await run({mode:'generate',target:'commission'})).status,502);
    output=fixture('commission');output.exercises[1].answer='not an option';assert.equal((await run({mode:'generate',target:'commission'})).status,502);
    output={correct:true,feedback:'Your sentence uses the word naturally.'};
    const result=await run({mode:'check',target:'cover',exercise:{type:'production',target:'cover',prompt:'Use cover in a sentence.',answer:'Please cover the painting.'},answer:'We should cover it before painting the room.'});
    assert.equal(result.status,200);assert.equal(result.data.correct,true);
    assert.match(JSON.parse(calls.at(-1).options.body).messages[0].content,/Accept natural correct alternatives/);
    delete process.env.OPENAI_API_KEY;assert.equal((await run({mode:'generate',target:'cover'})).status,503);
  }finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey}
});

test('shared reader paginates account words across modules without importing unowned lists',async()=>{
  const {readWords}=await import(pathToFileURL(path.resolve(__dirname,'../student-memory/word-stock.js')));
  const all=Array.from({length:501},(_,i)=>({id:String(i),user_id:'student-a',module:i%2?'Art Lab':'AI C1',content:{type:'words',item:{word:'word '+i}}}));
  const ranges=[];
  const db={from(table){assert.equal(table,'student_learning_entries');const filters=[];return {
    select(){return this},eq(k,v){filters.push([k,v]);return this},contains(k,v){assert.equal(k,'content');assert.deepEqual(v,{type:'words'});return this},order(){return this},
    async range(a,b){assert.ok(filters.some(([k,v])=>k==='user_id'&&v==='student-a'));assert.ok(filters.some(([k,v])=>k==='kind'&&v==='memory_note'));ranges.push([a,b]);return {data:all.slice(a,b+1)}}
  }}};
  const result=await readWords(db,'student-a');assert.equal(result.length,501);assert.deepEqual(ranges,[[0,499],[500,999]]);
});
