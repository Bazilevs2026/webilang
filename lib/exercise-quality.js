// CommonJS: compatible with the Vercel Node.js function runtime.
const english = require("./grammar-reference-en.json");
const russian = require("./grammar-reference-ru.json");
const libraries={en:english,ru:russian};

function norm(s){return String(s||"").toLocaleLowerCase().replace(/[\u2013\u2014_-]/g," ").replace(/\s+/g," ").trim();}
function referenceRule(language,pattern){
 const rules=libraries[language]?.rules||[];
 const query=norm(pattern);
 if(!query)return null;
 const scored=rules.map(r=>{
  const title=norm(r.title),id=norm(r.id).replace(/^en |^ru /,"");
  const score=title===query||id===query?100:query.includes(title)&&title.length>7?80:title.includes(query)&&query.length>9?65:0;
  return {r,score};
 }).sort((a,b)=>b.score-a.score);
 // No speculative matches. Unmatched rules remain eligible for independent audit.
 return scored[0]?.score>=65?scored[0].r:null;
}
function checkExerciseShape(e){
 const issues=[];
 if(!e||typeof e!=="object")return ["exercise missing"];
 const text=v=>typeof v==="string"&&v.trim().length>0;
 for(const k of ["targetStructure","modelSentence","modelTranslationRu"])if(!text(e[k]))issues.push(k);
 for(const k of ["recognize","retrieve","produce"])if(!e[k]||typeof e[k]!=="object")issues.push(k);
 if(issues.length)return issues;
 const r=e.recognize,t=e.retrieve,p=e.produce;
 if(!text(r.prompt)||!text(r.promptTranslationRu))issues.push("recognize prompt/translation");
 if(!Array.isArray(r.options)||r.options.length!==3||new Set(r.options.map(norm)).size!==3||r.options.some(x=>!text(x)))issues.push("three distinct recognition choices");
 if(!r.options?.includes(r.correctOption))issues.push("recognize answer must be exact option");
 if(!text(t.prompt)||!text(t.modelAnswer)||!text(t.promptTranslationRu))issues.push("retrieve fields");
 if(!text(p.prompt)||!text(p.promptTranslationRu))issues.push("produce fields");
 return issues;
}
const brief=o=>String(o||"").slice(0,900);
async function auditGrammarExercise({exercise,language="en",pattern,callModel}){
 const issues=checkExerciseShape(exercise);
 if(issues.length)return {ok:false,issues};
 const rule=referenceRule(language,pattern);
 const ruleContext=rule?{id:rule.id,title:rule.title,canonical_pattern:rule.canonical_pattern,examples:rule.test_cases?.grammatical||[],caveats:rule.caveats||[],verification_status:rule.verification_status}:null;
 const instructions=`Act as an independent linguistics and L2 pedagogy reviewer. Validate the exercise, not the learner.
Review grammar formula accuracy, whether the model sentence illustrates the target, whether exactly ONE recognize option is grammatically correct FOR THE STATED TARGET, and answer key, whether retrieval has a valid model answer, explicit and fairly assessable production requirements, whether Russian translations accurately translate the English instructions and model without revealing a correct answer, and B2-C1 level. Do NOT impose the model sentence's exact wording as the only correct answer. A correct independent subject and valid grammatical alternative must be accepted. A reference entry marked editorial_review_required or draft is advisory, never independently authoritative. If an item lacks a matching reference, reason from linguistic evidence and say so in issues, rather than inventing a match. Do not approve an uncertain or contradictory exercise.
Return only JSON: {"ok":boolean,"issues":["brief specific actionable problem"],"suggestedFixes":["brief fixes"]}. No markdown.`;
 const result=await callModel([
 {role:"system",content:instructions},
 {role:"user",content:JSON.stringify({targetLanguage:language,savedPattern:brief(pattern),reference:ruleContext,exercise})}
 ]);
 if(result?.ok!==true)return {ok:false,issues:Array.isArray(result?.issues)&&result.issues.length?result.issues.map(brief):["Independent grammar audit did not approve exercise"]};
 return {ok:true,issues:[],referenceId:rule?.id||null};
}

module.exports = { referenceRule, checkExerciseShape, auditGrammarExercise };
