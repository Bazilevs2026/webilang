/**
 * Webilang Missions: actual Webilang student identity + paired learning pilot.
 * This is an additive enhancement of the existing Missions visual prototype.
 * Real lessons, student records and the existing Cloudflare video room are unchanged.
 * The fictional mission conversations and My Creations remain marked as previews.
 */
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from '/student-memory/config.js';
const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clip=(s,n)=>String(s||'').trim().slice(0,n);
const isUUID=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s||'');
const modules={
 'video-games-a2':{name:'Video Games · A2',emoji:'🎮',level:'A2',type:'Real Webilang module',href:'/',description:'Play Code Names, practise giving clues and communicating as a team. Use the game code in the module to join the same game.',room:'chat'},
 'gender-roles-b2':{name:'Gender Roles · B2',emoji:'🎭',level:'B2',type:'Real Webilang module',href:'/gender-roles-B2/',description:'Practise discussing social expectations with Nova and Chaz. Partner video is for peer discussion; the AI roleplays remain separate.',room:'chat'},
 'secret':{name:'The Secret Restaurant',emoji:'🍽️',level:'A2–B1',type:'Live peer-mission prompt',href:'',description:'Investigate the secret menu. Share information and decide what you would order.',room:'secret'},
 'hometown':{name:'My Hometown Guide',emoji:'🏙️',level:'A2–B1',type:'Live peer-mission prompt',href:'',description:'Build a two-stop city tour with another student.',room:'hometown'},
 'business':{name:'Start a Business',emoji:'💡',level:'A2–B1',type:'Live peer-mission prompt',href:'',description:'Design a product, agree on a price and pitch it together.',room:'business'},
 'chat':{name:'Just Chat',emoji:'☕',level:'A2–B1',type:'Open conversation',href:'',description:'Get to know each other and practise listening and speaking.',room:'chat'}
};
const qs=new URLSearchParams(location.search);
const knownModule=qs.get('module');
let selectedMission=modules[knownModule]?knownModule:'video-games-a2';
let user=null,studentProfile=null,own=null,partnerList=[],invitations=[],messages=[],assignments=[];
let statusText='',isBusy=false,roomInviteId=null,roomPollBusy=false,identityLoaded=false,lastPanelSignature='';
let lastRefresh=0;

const css=document.createElement('style');css.textContent=`
.wl-online-note{background:#eff8f5;border:1px solid #cfe5dc;border-radius:15px;padding:14px 17px;margin:14px 0;color:#254e47;font-size:14px;line-height:1.55}
.wl-online-note.warn{background:#fff7ef;border-color:#f1d8ba;color:#79552c}
.wl-online-section{margin:21px 0 26px}
.wl-online-section h2{font-size:23px;margin:0 0 6px}.wl-online-section p{line-height:1.55}
.wl-real-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin-top:15px}
.wl-real-card{background:#fff;border:1px solid var(--line);border-radius:19px;box-shadow:var(--shadow);padding:19px;display:flex;flex-direction:column;gap:11px}
.wl-real-card h3{font-size:20px;margin:0}.wl-real-card p{margin:0;color:var(--ink2);font-size:14px;flex:1}.wl-real-card .wl-icon{font-size:36px}.wl-real-actions{display:flex;gap:9px;flex-wrap:wrap}.wl-action{background:var(--orange);color:#fff;border:0;border-radius:11px;padding:11px 14px;font-weight:750;display:inline-block;text-decoration:none;font-size:13px}.wl-action.soft{background:#e5f4ee;color:#1b6658}.wl-action.outline{background:white;color:var(--ink);border:1px solid var(--line)}.wl-action:disabled{opacity:.6}
.wl-hub{max-width:1120px}.wl-hub-head{display:flex;justify-content:space-between;flex-wrap:wrap;gap:15px;align-items:center}.wl-hub-section{background:#fff;border:1px solid var(--line);border-radius:20px;padding:21px;margin:16px 0;box-shadow:var(--shadow)}.wl-hub-section h2{font-size:20px;margin:0 0 9px}.wl-hub-section h3{font-size:16px;margin:0 0 8px}.wl-hub-section p{font-size:14px;color:var(--ink2)}
.wl-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.wl-hub label{display:block;font-size:13px;font-weight:740;margin-bottom:6px;color:var(--ink)}.wl-hub input,.wl-hub select,.wl-hub textarea{display:block;width:100%;border-radius:10px;border:1px solid #c8d6d6;padding:10px;background:#fff;color:var(--ink);font:inherit;min-width:0}.wl-hub textarea{min-height:66px;resize:vertical}.wl-hub .wl-inline-check{display:flex;align-items:center;gap:9px;margin:12px 0}.wl-hub .wl-inline-check input{width:auto;flex-shrink:0}.wl-hub button{margin:0}.wl-hub .wl-hint{font-size:12px;color:var(--ink2);margin:8px 0}
.wl-pair-list{display:grid;gap:11px}.wl-pair{border:1px solid #dfebe8;border-radius:14px;padding:14px;display:flex;justify-content:space-between;align-items:flex-start;gap:15px;flex-wrap:wrap;background:#fbfdfc}.wl-pair strong{font-size:15px}.wl-pair p{margin:5px 0;font-size:13px}.wl-chip{display:inline-block;background:#e8f3ef;border-radius:40px;color:#256456;padding:4px 10px;font-size:11px;font-weight:750;margin:5px 6px 0 0}.wl-chip.amber{background:#fff2e6;color:#986027}.wl-chip.grey{background:#eef1f4;color:#526273}.wl-pair-actions{display:flex;flex-wrap:wrap;gap:8px}.wl-status{font-size:13px;padding:11px 13px;background:#f2f8fb;border:1px solid #cee1eb;border-radius:10px;white-space:pre-wrap;overflow-wrap:anywhere}.wl-status.error{background:#fff0ed;border-color:#f0c3b7;color:#973d30}
.wl-msgs{border:1px solid #e2eae8;background:#fbfdfc;padding:11px;border-radius:11px;max-height:280px;overflow:auto;display:grid;gap:8px}.wl-msg{background:#eaf4f0;padding:9px 11px;border-radius:9px;max-width:90%;font-size:13px}.wl-msg.mine{background:#fff0e5;justify-self:end}.wl-msg small{display:block;color:#677c83;font-size:11px;margin-bottom:2px}.wl-msg-form{display:flex;gap:8px;margin-top:9px}.wl-msg-form input{flex:1}.wl-online-privacy{font-size:12px;color:#55706d;line-height:1.55}
.wl-quick-directory{margin:17px 0 19px}.wl-quick-directory .wl-hub-head{margin-bottom:8px}
.wl-quick-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:13px}
.wl-quick-person{background:#f7fbf9;border:1px solid #e1ede7;border-radius:13px;padding:13px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;min-width:0}
.wl-quick-person strong{color:var(--ink);font-size:16px}
@media(max-width:800px){.wl-quick-list{grid-template-columns:1fr}}

@media(max-width:780px){.mobile-nav{grid-template-columns:repeat(6,minmax(0,1fr));gap:0}.mobile-nav button{font-size:10px;padding:6px 1px;min-width:0}.mobile-nav button b{font-size:17px}}
@media(max-width:800px){.wl-real-grid,.wl-grid-2{grid-template-columns:1fr}.wl-hub-section{padding:16px}.wl-msg-form{flex-wrap:wrap}.wl-pair{display:block}.wl-pair-actions{margin-top:11px}}
`;document.head.append(css);

const languageName={en:'English',ru:'Russian',both:'English + Russian',other:'Another language'};
function moduleCard(id){const m=modules[id];return `<article class="wl-real-card"><div class="wl-icon" aria-hidden="true">${m.emoji}</div><div><span class="wl-chip">${esc(m.type)}</span><span class="wl-chip amber">${esc(m.level)}</span></div><h3>${esc(m.name)}</h3><p>${esc(m.description)}</p><div class="wl-real-actions">${m.href?`<a class="wl-action" target="_blank" rel="noopener" href="${esc(m.href)}">Open module ↗</a>`:''}<button type="button" class="wl-action soft" data-wl-action="go-teams" data-wl-module="${id}">Find a partner →</button></div></article>`}
function realModulesHTML(){return `<section id="wl-real-modules" class="wl-online-section"><div class="section-head"><div><div class="eyebrow">WORKING WEBILANG MODULES</div><h2>Choose a real lesson</h2><p class="sub">These open your existing modules. A partner can join a separate video room for communication and coordination.</p></div><a href="/webilang-global/" class="wl-action outline">My student profile ↗</a></div><div class="wl-real-grid">${moduleCard('video-games-a2')}${moduleCard('gender-roles-b2')}</div><div class="wl-online-note warn"><strong>Levels are not yet adapted automatically.</strong> Video Games is A2, while Gender Roles is B2. The other mission story conversations below are design previews, not live AI roleplays.</div></section>`}
function demoWarning(){return `<div id="wl-story-demo" class="wl-online-note warn"><strong>Story preview only.</strong> The scripted avatar conversation and example feedback on this page are demonstrations. For a real AI roleplay, open an existing Webilang module; for a real peer conversation, select Teams &amp; Lounge.</div>`}
function displayName(){return clip(studentProfile?.display_name,80)||clip(user?.email?.split('@')[0],50)||'Student'}
function signedInPrompt(){return `<div class="wl-online-note warn"><strong>Student login required for partner matching.</strong> <a href="/webilang-global/" style="text-decoration:underline;color:inherit;font-weight:750">Sign in to your Webilang Global student account</a>, then return here. You can still preview the missions without signing in.</div>`}
function profileForm(){return `<form id="wl-own-profile-form"><div class="wl-grid-2"><div><label for="wl-profile-name">Name other students will see</label><input id="wl-profile-name" maxlength="80" required value="${esc(own?.display_name||displayName())}" autocomplete="nickname"></div><div><label for="wl-profile-level">My current level</label><select id="wl-profile-level">${['A1','A2','B1','B2','C1','C2'].map(x=>`<option ${x===(own?.learner_level||studentProfile?.english_level||'A2')?'selected':''}>${x}</option>`).join('')}</select></div><div><label for="wl-profile-learning">I am learning</label><select id="wl-profile-learning"><option value="en" ${(own?.learning_language||'en')==='en'?'selected':''}>English</option><option value="ru" ${own?.learning_language==='ru'?'selected':''}>Russian</option></select></div><div><label for="wl-profile-help">I can help others practise</label><select id="wl-profile-help"><option value="ru" ${(own?.can_help_with||'ru')==='ru'?'selected':''}>Russian</option><option value="en" ${own?.can_help_with==='en'?'selected':''}>English</option><option value="other" ${own?.can_help_with==='other'?'selected':''}>Another language / not sure</option></select></div></div><label for="wl-profile-intro" style="margin-top:12px">Short introduction (optional)</label><textarea id="wl-profile-intro" maxlength="250" placeholder="I like gaming, art and travelling…">${esc(own?.intro||'')}</textarea><label class="wl-inline-check"><input id="wl-profile-available" type="checkbox" ${own?.available?'checked':''}><span>Yes, show my name and learning preferences to other signed-in learners so they can invite me.</span></label><button type="submit" class="wl-action">Save partner preferences</button><p class="wl-hint">This is an opt-in directory. Your email, personal goals and Student Memory are never shown to other students.</p></form>`}
const matchScore=p=>{
 if(!own)return 0;
 let v=0;
 if(p.can_help_with===own.learning_language)v+=3;
 if(own.can_help_with===p.learning_language)v+=3;
 if(p.learning_language===own.learning_language)v+=1;
 if(p.learner_level===own.learner_level)v+=1;
 return v;
};
function personName(id){const p=partnerList.find(x=>x.user_id===id);return clip(p?.display_name,80)||'Webilang learner'}
function partnerDirectory(){
 const inviteHint=own?.available?'':'<div class="wl-online-note warn">You can browse available learners. To send an invitation, first enable “show my name” in My partner preferences and save.</div>';
 const peers=partnerList.filter(p=>p.available && p.user_id!==user.id).sort((a,b)=>matchScore(b)-matchScore(a)||a.display_name.localeCompare(b.display_name));
 if(!peers.length)return `<div class="wl-online-note">No available partners yet. Registered students appear here only after they select “Show my name” and save their partner preferences. Ask a classmate to opt in, then click Refresh.</div>`;
 return `${inviteHint}<div class="wl-pair-list">${peers.slice(0,60).map(p=>`<div class="wl-pair"><div><strong>${esc(clip(p.display_name,80))}</strong><div><span class="wl-chip">Learning ${languageName[p.learning_language]||'language'} · ${esc(p.learner_level)}</span><span class="wl-chip">Can help with ${languageName[p.can_help_with]||'language'}</span>${matchScore(p)>=6?'<span class="wl-chip amber">Language exchange match</span>':''}</div>${p.intro?`<p>${esc(clip(p.intro,250))}</p>`:''}</div><div class="wl-pair-actions"><button class="wl-action" type="button" data-wl-action="invite" data-id="${esc(p.user_id)}">Invite to mission →</button></div></div>`).join('')}</div>`;
}
function directoryPreview(){
 if(!identityLoaded)return `<div class="wl-online-note">Checking student directory…</div>`;
 if(!user)return signedInPrompt();
 const peers=partnerList.filter(p=>p.available && p.user_id!==user.id)
   .sort((a,b)=>matchScore(b)-matchScore(a)||(a.display_name||'').localeCompare(b.display_name||''));
 if(!peers.length)return `<div class="wl-online-note">No classmates are listed yet. Only students who have chosen <strong>“Show my name”</strong> and clicked <strong>Save partner preferences</strong> appear here. Ask a second student to opt in, then click Refresh.</div>`;
 return `<div class="wl-quick-list">${peers.slice(0,12).map(p=>`<div class="wl-quick-person"><div><strong>${esc(clip(p.display_name,80))}</strong><div><span class="wl-chip">Learning ${languageName[p.learning_language]||'language'} · ${esc(p.learner_level)}</span><span class="wl-chip">Can help: ${languageName[p.can_help_with]||'another language'}</span>${matchScore(p)>=6?'<span class="wl-chip amber">Language exchange match</span>':''}</div></div><button class="wl-action soft" type="button" data-wl-action="go-teams" data-wl-partner="${esc(p.user_id)}">Invite →</button></div>`).join('')}</div>`;
}
function quickDirectoryCard(){return `<section id="wl-quick-directory" class="wl-hub-section wl-quick-directory"><div class="wl-hub-head"><div><div class="eyebrow">REAL WEBILANG LEARNERS</div><h2>👥 Available Learning Partners</h2><p class="sub">Choose a classmate learning English or Russian. Names appear here only with the student's permission — this does not indicate who is online right now.</p></div><button type="button" class="wl-action outline" data-wl-action="go-teams">Find a Partner →</button></div><div id="wl-quick-directory-body">${directoryPreview()}</div></section>`}
function missionChoices(){return Object.entries(modules).map(([key,m])=>`<option value="${key}" ${key===selectedMission?'selected':''}>${esc(m.name)}</option>`).join('')}
function inviteActions(item){const amSender=item.inviter_id===user.id;const s=item.status;
 if(s==='pending')return amSender?`<button class="wl-action outline" data-wl-action="cancel" data-id="${item.id}">Cancel invitation</button>`:`<button class="wl-action" data-wl-action="accept" data-id="${item.id}">Accept</button> <button class="wl-action outline" data-wl-action="decline" data-id="${item.id}">Decline</button>`;
 if(s==='accepted')return amSender?`<button class="wl-action" data-wl-action="start-room" data-id="${item.id}">${item.room_url?'Start another room':'Start video room'}</button>`:item.room_url?`<a class="wl-action" href="${esc(safeMeetingURL(item.room_url)||'#')}" target="_blank" rel="noopener noreferrer">Join video room ↗</a>`:'<span class="wl-chip amber">Waiting for the organizer to create the room</span>';
 return '';
}
function safeMeetingURL(raw){try{const u=new URL(raw);if(u.protocol!=='https:'||!['webilang-git-test-qwen-webilang.vercel.app','webilang.vercel.app'].includes(u.hostname)||u.pathname!=='/webilang-global/webilang-meet.html'||u.searchParams.get('p')!=='rtk'||!(u.searchParams.get('invite')||'').length||u.username||u.password)return '';return u.toString()}catch{return ''}}
function formatDate(s){const d=new Date(s);return Number.isNaN(d.getTime())?'':d.toLocaleString()}
function invitationList(){if(!invitations.length)return `<div class="wl-online-note">No invitations yet. Choose a classmate from the directory to start.</div>`;
 return `<div class="wl-pair-list">${invitations.slice(0,35).map(inv=>{const outgoing=inv.inviter_id===user.id,other=outgoing?inv.invitee_id:inv.inviter_id,m=modules[inv.mission]||modules.chat;
  const msg=messages.filter(x=>x.invitation_id===inv.id).slice(-8);
  return `<article class="wl-pair" style="display:block"><div style="display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap"><div><h3>${outgoing?'To':'From'} ${esc(personName(other))}</h3><div><span class="wl-chip">${m.emoji} ${esc(m.name)}</span><span class="wl-chip ${inv.status==='pending'?'amber':''}">${esc(inv.status)}</span><span class="wl-chip grey">${esc(formatDate(inv.created_at))}</span></div>${inv.note?`<p>${esc(clip(inv.note,350))}</p>`:''}</div><div class="wl-pair-actions">${inviteActions(inv)}${m.href?`<a class="wl-action soft" href="${esc(m.href)}" target="_blank" rel="noopener">Open lesson ↗</a>`:''}</div></div>${inv.status==='accepted'?`<details style="margin-top:13px"><summary style="cursor:pointer;font-weight:750">💬 Private partner chat (${messages.filter(x=>x.invitation_id===inv.id).length} messages)</summary><div class="wl-msgs" style="margin-top:10px">${msg.length?msg.map(x=>`<div class="wl-msg ${x.sender_id===user.id?'mine':''}"><small>${x.sender_id===user.id?'You':esc(personName(x.sender_id))} · ${esc(formatDate(x.created_at))}</small>${esc(clip(x.body,800))}</div>`).join(''):'<p class="wl-hint">Write a message to coordinate your mission.</p>'}</div><form class="wl-msg-form" data-wl-chat="${inv.id}"><input name="message" maxlength="800" placeholder="Plan your quest or exchange clues…" required><button type="submit" class="wl-action soft">Send</button></form><p class="wl-hint">Text messages persist in Webilang; this pilot does not record video/audio or send push notifications.</p></details>`:''}</article>`}).join('')}</div>`}
function partnersShell(){return `<div id="wl-live-hub" class="wl-hub"> <div class="wl-hub-head"><div><div class="eyebrow">REAL WEBILANG LEARNERS</div><h1 class="h1">Find a partner. Complete a mission.</h1><p class="sub">Find available classmates, invite them into a shared task, and talk through Webilang Video. No public emails or simulated learners.</p></div><a class="wl-action outline" href="/webilang-global/">← My student profile</a></div>
${!identityLoaded?'<div class="wl-online-note">Checking Webilang sign-in…</div>':!user?signedInPrompt():`<p class="wl-online-note">Signed in as <strong>${esc(displayName())}</strong>. Invitations appear here for both participants. Refreshes automatically while this page is open.</p>${quickDirectoryCard()}<section class="wl-hub-section"><h2>1 · My partner preferences</h2>${profileForm()}</section><section class="wl-hub-section"><h2>2 · Choose a mission & partner</h2><div class="wl-grid-2"><div><label for="wl-activity">Mission or existing learning module</label><select id="wl-activity">${missionChoices()}</select></div><div><label for="wl-invite-language">Conversation language</label><select id="wl-invite-language"><option value="en">English</option><option value="ru">Russian</option><option value="both">English + Russian exchange</option></select></div></div><label for="wl-invite-note" style="margin-top:13px">Invitation message (optional)</label><textarea id="wl-invite-note" maxlength="350" placeholder="Let's play Code Names and explain our clues in English."></textarea><p class="wl-hint">Students choose whether to be discoverable. A language exchange match means you learn each other's languages; it is not an online-status indicator.</p><div id="wl-partner-list">${partnerDirectory()}</div></section><section class="wl-hub-section"><div class="wl-hub-head"><h2>3 · Invitations & shared rooms</h2><button class="wl-action outline" type="button" data-wl-action="refresh">Refresh</button></div><div id="wl-invite-list">${invitationList()}</div></section><p class="wl-online-privacy">Pilot rules: invite only classmates who have agreed to participate, use teacher supervision where appropriate, and avoid sharing personal contact information. The video room uses an expiring signed link. Private chat is visible only to the two invitation participants. Voice messages, scheduling, automatic speech analysis and notifications while logged out are not yet implemented.</p>`}
 <p id="wl-hub-status" class="wl-status ${statusText.startsWith('Error:')?'error':''}" role="status">${esc(statusText||'')}</p></div>`}

function authenticatedLearning(){return `<section id="wl-real-learning" class="wl-online-section"><div class="eyebrow">YOUR REAL WEBILANG RECORD</div><h1 class="h1">My Learning</h1><p class="sub">Your goals, feedback, Student Memory, learning priorities and assigned lessons live in the Student Dashboard.</p><p><a class="wl-action" href="/webilang-global/">Open My Learning →</a></p>${!user?signedInPrompt():`<div class="wl-real-grid">${(assignments.length?assignments:[]).map(x=>{const m=modules[x.lesson_id];return m?`<article class="wl-real-card"><h3>${m.emoji} ${esc(m.name)}</h3><span class="wl-chip">${esc(x.status||'assigned')}</span><p>${esc(m.description)}</p><div class="wl-real-actions"><a class="wl-action" href="${esc(m.href)}" target="_blank" rel="noopener">Open lesson ↗</a><button class="wl-action soft" data-wl-action="go-teams" data-wl-module="${esc(x.lesson_id)}">Invite a partner</button></div></article>`:''}).join('')||'<div class="wl-online-note">No lessons assigned yet. Your teacher can assign Video Games or Gender Roles in Admin.</div>'}</div>`}<div class="wl-online-note warn">The original Missions prototype showed sample progress numbers and sample Word/Grammar Stock items. Those numbers are intentionally hidden here to avoid confusing demonstration data with your real records.</div></section>`}
function currentPage(){const title=$('headerTitle')?.textContent?.trim();if(title==='Mission experience')return 'mission';if(title==='Teacher Studio')return 'teacher';return document.querySelector('.sidebar .nav-item.active')?.dataset.page||document.querySelector('.mobile-nav button.active')?.dataset.page||'home'}
function enhancePage(){const root=$('content');if(!root)return;const p=currentPage();
 if(p==='home'&&!root.querySelector('#wl-real-modules')){const hero=root.querySelector('.hero');if(hero)hero.insertAdjacentHTML('afterend',realModulesHTML()+quickDirectoryCard());else root.insertAdjacentHTML('afterbegin',realModulesHTML()+quickDirectoryCard());const illustrative=root.querySelector('.four');if(illustrative)illustrative.remove();const gathering=[...root.querySelectorAll('h3')].find(x=>x.textContent==='Your team is gathering');if(gathering){gathering.textContent='Real partners, real conversations';const card=gathering.closest('.card');if(card){const tag=card.querySelector('.tag');if(tag)tag.textContent='Authenticated learners';const desc=card.querySelector('.sub');if(desc)desc.textContent='Find classmates who opted in and invite them to a shared task.';const fine=card.querySelector('.tiny-muted');if(fine)fine.textContent='Student invitations are private.';}}const kostya=[...root.querySelectorAll('h3')].find(x=>x.textContent==='Kostya recommends');if(kostya){const card=kostya.closest('.k-card');if(card){const para=card.querySelector('p');if(para)para.textContent='Your individual recommendations and AI tutor are available in My Learning, using your real Student Memory.';const button=card.querySelector('button');if(button){const link=document.createElement('a');link.href='/webilang-global/';link.className='btn soft tiny';link.textContent='Open My Learning →';button.replaceWith(link);}}}const top=document.createElement('div');top.id='wl-login-state';top.className='wl-online-note';top.innerHTML=user?`Signed in to Webilang as <strong>${esc(displayName())}</strong>. <a style="color:inherit;text-decoration:underline" href="/webilang-global/">My profile</a>`:signedInPrompt();root.prepend(top)}
 if(p==='missions'&&!root.querySelector('#wl-real-modules')){root.insertAdjacentHTML('afterbegin',realModulesHTML())}
 if(p==='teams'&&!root.querySelector('#wl-live-hub')){root.innerHTML=partnersShell();}
 if(p==='learning'&&!root.querySelector('#wl-real-learning'))root.innerHTML=authenticatedLearning();
 if(p==='mission'&&!root.querySelector('#wl-story-demo')){root.insertAdjacentHTML('afterbegin',demoWarning());const badge=root.querySelector('.live-pill');if(badge)badge.textContent='● Story preview · attempt';}
 if(p==='meet'&&!root.querySelector('#wl-video-join-hint')){const note=document.createElement('div');note.className='wl-online-note';note.id='wl-video-join-hint';note.innerHTML=`<strong>Webilang Video:</strong> Choose a learning partner above, send an invitation through Teams &amp; Lounge, then start your private room. The inviter creates the room; the invited student simply joins.`;root.insertBefore(note,root.firstChild);note.insertAdjacentHTML('beforebegin',quickDirectoryCard());const old=root.querySelector('.meet-notice');if(old)old.textContent='Webilang Video keeps your conversation inside the platform. Room links are shared with accepted partners. The pilot does not record or transcribe calls.';}
 if(p==='creations'&&!root.querySelector('#wl-creations-preview'))root.insertAdjacentHTML('afterbegin','<div id="wl-creations-preview" class="wl-online-note warn">My Creations is a design preview. Artwork, certificates and awards here are illustrative; student-owned work is not yet saved in Supabase.</div>');
 if(p==='teacher'&&!root.querySelector('#wl-teacher-preview'))root.insertAdjacentHTML('afterbegin','<div id="wl-teacher-preview" class="wl-online-note warn">Teacher Studio on this page is a prototype preview. For real students, placement results and assignment records, use <a href="/webilang-global/admin/">Admin Dashboard</a>.</div>');
 if(p==='teams'&&identityLoaded&&user)refreshPanelOnly();
}
const markupCache=new WeakMap();
function safeSetHTML(node,markup){if(!node)return;if(markupCache.get(node)===markup)return;node.innerHTML=markup;markupCache.set(node,markup)}
function refreshPanelOnly(){const quick=$('wl-quick-directory-body');safeSetHTML(quick,directoryPreview());if(currentPage()!=='teams')return;const root=$('wl-live-hub');if(!root)return;
 const a=$('wl-partner-list'),b=$('wl-invite-list');safeSetHTML(a,partnerDirectory());safeSetHTML(b,invitationList());
 const node=$('wl-hub-status');if(node){node.textContent=statusText||'';node.classList.toggle('error',statusText.startsWith('Error:'))}
}
function setMessage(s,bad=false){statusText=(bad?'Error: ':'')+clip(s,450);const node=$('wl-hub-status');if(node){node.textContent=statusText;node.classList.toggle('error',bad)}}
function rerenderHub(){if(currentPage()!=='teams')return;const root=$('content');if(!root)return;root.innerHTML=partnersShell();}
function snapshotIdentity(){const p=currentPage();if(p==='teams')rerenderHub();else if(['home','learning'].includes(p)){if(typeof window.render==='function')window.render()}}
async function refreshIdentity(){try{
  const {data,error}=await db.auth.getUser();if(error)throw error;
  user=data?.user||null;studentProfile=null;own=null;assignments=[];if(!user){partnerList=[];invitations=[];messages=[];roomInviteId=null;}
  if(user){const [res,profileRow,lessonRows]=await Promise.all([
    db.from('webilang_partner_profiles').select('*').eq('user_id',user.id).maybeSingle(),
    db.from('student_profiles').select('display_name,english_level,goals').eq('user_id',user.id).maybeSingle(),
    db.from('webilang_lesson_assignments').select('lesson_id,status').eq('student_id',user.id).limit(50)
  ]);
  if(res.error && res.error.code!=='42P01')console.warn('Partner profile:',res.error.message);
  own=res.data||null;studentProfile=profileRow.data||null;assignments=lessonRows.data||[];
  }
  identityLoaded=true;snapshotIdentity();if(user)await refreshPeerData(true);
 }catch(err){identityLoaded=true;setMessage('Could not check login: '+clip(err.message,180),true);snapshotIdentity();}}
async function refreshPeerData(force=false){if(!user)return;if(isBusy&&!force)return;if(!force&&Date.now()-lastRefresh<7000)return;lastRefresh=Date.now();
 try{
   const peers=await db.from('webilang_partner_profiles').select('user_id,display_name,learning_language,can_help_with,learner_level,intro,available,updated_at').eq('available',true).limit(120);
   if(peers.error)throw peers.error;partnerList=peers.data||[];
   const invites=await db.from('webilang_partner_invitations').select('id,inviter_id,invitee_id,mission,language,learner_level,note,status,room_url,created_at,updated_at')
      .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`).order('created_at',{ascending:false}).limit(80);
   if(invites.error)throw invites.error;invitations=invites.data||[];
   const accepted=invitations.filter(x=>x.status==='accepted').map(x=>x.id);
   messages=[];
   if(accepted.length){const result=await db.from('webilang_partner_messages').select('id,invitation_id,sender_id,body,created_at').in('invitation_id',accepted).order('created_at',{ascending:false}).limit(200);if(result.error)throw result.error;messages=(result.data||[]).reverse();}
   if(currentPage()==='teams'){
     const focus=document.activeElement;
     if(focus?.closest('#wl-own-profile-form') || focus?.id==='wl-invite-note' || focus?.closest('.wl-msg-form')){
       // Preserve an active input rather than replacing it every few seconds.
       const status=$('wl-hub-status');if(status)status.textContent='New invitations are loaded. Click Refresh after you finish typing.';
     }else refreshPanelOnly();
   }
 }catch(err){setMessage('Partner database unavailable: '+clip(err.message,250)+'. Install partners-and-invitations.sql in Supabase first.',true);}
}
function moduleOnArrival(){if(qs.get('view')==='teams'&&typeof window.navigate==='function')window.navigate('teams')}
async function saveOwnProfile(){if(!user)return setMessage('Sign in to Webilang Global first.',true);
 const name=clip($('wl-profile-name')?.value,80),learning=$('wl-profile-learning')?.value,help=$('wl-profile-help')?.value,level=$('wl-profile-level')?.value,intro=clip($('wl-profile-intro')?.value,250),available=$('wl-profile-available')?.checked===true;
 if(!name)return setMessage('Enter a display name.',true);
 if(!['en','ru'].includes(learning)||!['en','ru','other'].includes(help)||!['A1','A2','B1','B2','C1','C2'].includes(level))return setMessage('Invalid language or level.',true);
 const {error}=await db.from('webilang_partner_profiles').upsert({user_id:user.id,display_name:name,learning_language:learning,can_help_with:help,learner_level:level,intro,available,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 if(error)throw error;own={user_id:user.id,display_name:name,learning_language:learning,can_help_with:help,learner_level:level,intro,available};setMessage(available?'Preferences saved. Other learners can now invite you.':'Preferences saved. Your profile is hidden from the student directory.');await refreshPeerData(true);rerenderHub();}
async function newInvite(otherId){if(!user||!own?.available)return setMessage('Save your profile and enable invitations first.',true);
 if(!isUUID(otherId)||otherId===user.id)return setMessage('Select a different Webilang learner.',true);
 const peer=partnerList.find(x=>x.user_id===otherId&&x.available);if(!peer)return setMessage('This learner is no longer available.',true);
 const mission=$('wl-activity')?.value||selectedMission,language=$('wl-invite-language')?.value||'en',note=clip($('wl-invite-note')?.value,350),level=$('level')?.value||'A2';
 if(!modules[mission]||!['en','ru','both'].includes(language))return setMessage('Choose a valid module and language.',true);
 const existing=invitations.some(x=>x.inviter_id===user.id&&x.invitee_id===otherId&&x.status==='pending'&&x.mission===mission);
 if(existing)return setMessage('You already have a pending invitation to this student for this mission.');
 const result=await db.from('webilang_partner_invitations').insert({inviter_id:user.id,invitee_id:otherId,mission,language,learner_level:['A2','B1'].includes(level)?level:'A2',note});
 if(result.error)throw result.error;setMessage(`Invitation sent to ${clip(peer.display_name,80)}. They will see it in Teams & Lounge after signing in (or while this page is open).`);await refreshPeerData(true);}
async function updateInvite(id,action){const inv=invitations.find(x=>x.id===id);if(!inv)return setMessage('Invitation not found.',true);
 const recipient=inv.invitee_id===user.id;const sender=inv.inviter_id===user.id;
 const status={accept:'accepted',decline:'declined',cancel:'cancelled'}[action];
 if(!status || (recipient&&!['accept','decline'].includes(action)) || (sender&&action!=='cancel'))return setMessage('Not allowed.',true);
 const {error}=await db.from('webilang_partner_invitations').update({status}).eq('id',id);
 if(error)throw error;setMessage(action==='accept'?'Invitation accepted. The organizer can now create the Cloudflare room.':'Invitation updated.');await refreshPeerData(true);}
async function sendMessage(inviteId,body){const inv=invitations.find(x=>x.id===inviteId);if(!inv||inv.status!=='accepted')return setMessage('Only accepted partners can chat.',true);
 const value=clip(body,800);if(!value)return;
 const {error}=await db.from('webilang_partner_messages').insert({invitation_id:inviteId,sender_id:user.id,body:value});if(error)throw error;setMessage('Message sent. Your partner will see it when they open Teams & Lounge.');await refreshPeerData(true);}
function startVideo(inviteId){const inv=invitations.find(x=>x.id===inviteId);if(!inv||inv.inviter_id!==user?.id||inv.status!=='accepted')return setMessage('Only the inviter can start this accepted room.',true);
 roomInviteId=inv.id;const module=modules[inv.mission]||modules.chat;
 if(typeof window.launchMeet==='function'){window.launchMeet(module.room);const state=$('wl-video-join-hint');if(state)state.insertAdjacentHTML('afterend',`<div class="wl-online-note" id="wl-current-room-note">Room for ${esc(personName(inv.invitee_id))}: create a Cloudflare video room below. Once ready, the invitation link is automatically sent to that student. They can click Join video room in Teams &amp; Lounge.</div>`);}else setMessage('Could not open the video room. Reload this page.',true);
}
async function publishVideoURL(){if(roomPollBusy||!roomInviteId||!user||currentPage()!=='meet')return;
 const inv=invitations.find(i=>i.id===roomInviteId);if(!inv||inv.inviter_id!==user.id||inv.status!=='accepted')return;
 let url='';try{const frame=$('meetFrame');url=frame?.contentWindow?.document?.getElementById('live-invite-url')?.value||'';}catch(_){return;}
 const good=safeMeetingURL(url);if(!good || good===inv.room_url)return;
 roomPollBusy=true;try{const {error}=await db.from('webilang_partner_invitations').update({room_url:good}).eq('id',roomInviteId).eq('inviter_id',user.id);if(error)throw error;
  inv.room_url=good;const note=$('wl-current-room-note');if(note)note.textContent='✓ Video invitation delivered privately to your partner. They can open Teams & Lounge and click Join video room.';
 }catch(err){const note=$('wl-current-room-note');if(note)note.textContent='Could not deliver invitation: '+clip(err.message,230);}
 finally{roomPollBusy=false;}
}
const content=$('content');
content.addEventListener('click',async e=>{const b=e.target.closest('[data-wl-action]');if(!b||isBusy)return;const action=b.dataset.wlAction,id=b.dataset.id;
 if(action==='go-teams'){const partner=b.dataset.wlPartner;selectedMission=modules[b.dataset.wlModule]?b.dataset.wlModule:selectedMission;window.navigate('teams');if(isUUID(partner))requestAnimationFrame(()=>{const target=content.querySelector('[data-wl-action=\"invite\"][data-id=\"'+partner+'\"]');if(target){target.scrollIntoView({block:'center',behavior:'smooth'});target.focus({preventScroll:true})}});return;}
 if(action==='refresh'){await refreshPeerData(true);setMessage('Partner list refreshed.');return;}
 if(!user)return setMessage('Sign in through your Webilang Student Dashboard first.',true);
 if(['accept','decline','cancel'].includes(action)||action==='invite'){
  isBusy=true;b.disabled=true;try{if(action==='invite')await newInvite(id);else await updateInvite(id,action)}catch(err){setMessage(clip(err.message,300),true)}finally{isBusy=false;b.disabled=false}return;
 }
 if(action==='start-room'){startVideo(id);return;}
});
content.addEventListener('change',e=>{if(e.target.id==='wl-activity'){selectedMission=modules[e.target.value]?e.target.value:'chat';}});
content.addEventListener('submit',async e=>{if(e.target.id==='wl-own-profile-form'){
 e.preventDefault();if(isBusy)return;isBusy=true;try{await saveOwnProfile()}catch(err){setMessage(clip(err.message,280),true)}finally{isBusy=false}return;
 }if(e.target.matches('.wl-msg-form')){
 e.preventDefault();if(isBusy)return;const id=e.target.dataset.wlChat;const val=e.target.querySelector('[name=message]')?.value||'';isBusy=true;try{await sendMessage(id,val);e.target.reset()}catch(err){setMessage(clip(err.message,280),true)}finally{isBusy=false}
 }});
const observer=new MutationObserver(()=>{queueMicrotask(enhancePage)});
observer.observe(content,{childList:true});
await refreshIdentity();
moduleOnArrival();
enhancePage();
setInterval(()=>{if(!document.hidden && user)refreshPeerData()},12000);
setInterval(publishVideoURL,1500);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshPeerData(true)});
db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN'||event==='SIGNED_OUT')queueMicrotask(refreshIdentity)});
