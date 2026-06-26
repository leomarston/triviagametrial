/* ============================================================
   Trivia Quest — application logic
   ============================================================ */
(function(){
'use strict';

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const AVATARS = ['av_frog','av_fox','av_robot','av_cat','av_alien','av_chick','av_blob','av_imp'];
const AV = id => `assets/art/avatars/${id}.svg`;
const BOT_NAMES = ['Zoe','Marco','Bella','Kai','Luna','Theo','Nova','Pixel','Rex','Juno'];
const LETTERS = ['a','b','c','d'];

const rand   = n => Math.floor(Math.random()*n);
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]];} return a; };
const clamp  = (v,lo,hi) => Math.max(lo, Math.min(hi, v));

/* ---------- persistent settings ---------- */
const DEFAULTS = { sound:true, music:false, timer:false, secs:20, fullscreen:false, best:0 };
let settings = load();
function load(){ try{ return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem('tq.settings')||'{}')); }catch(e){ return Object.assign({},DEFAULTS); } }
function save(){ try{ localStorage.setItem('tq.settings', JSON.stringify(settings)); }catch(e){} }

/* ---------- shared state ---------- */
const state = {
  config: { categoryId:'mixed', num:10, diff:'mixed', mode:'solo', playerCount:3 },
  players: [],          // pregame roster {name, avatar, isBot}
  run: null,            // active game runtime
};

/* ---------- screen router ---------- */
function show(id){
  const cur = $('.screen.active');
  if(cur && cur.id === id) return;
  if(cur) cur.classList.remove('active');
  const next = document.getElementById(id);
  next.classList.add('active');
  if(settings.sound) Sfx.whoosh();
  window.scrollTo(0,0);
}

/* =========================================================
   MENU
   ========================================================= */
function initMenu(){
  $$('#screen-menu [data-act]').forEach(b=>b.addEventListener('click', ()=>{
    Sfx.unlock(); if(settings.sound) Sfx.click();
    const a = b.dataset.act;
    if(a==='play'){ openPregame(); }
    else if(a==='settings'){ openSettings(); }
    else if(a==='quit'){ quit(); }
  }));
  // floating decorative characters — each tuned individually so the idle
  // motion reads hand-animated, not a uniform template bob.
  const decor = $('#menuDecor');
  const set = [
    // art, x%, y%, scale, bobDur, bobAmp, swayDur, swayDeg, delay, opacity
    {art:'science.svg',       x:6,  y:15, s:.92, bd:5.2, ba:13, sd:6.9, sr:3.0, d:0.0, o:.46},
    {art:'sports.svg',        x:87, y:11, s:1.02,bd:6.3, ba:19, sd:5.1, sr:4.5, d:1.6, o:.42},
    {art:'geography.svg',     x:4,  y:69, s:.98, bd:4.6, ba:11, sd:7.6, sr:2.4, d:0.7, o:.5 },
    {art:'general_knowledge.svg', x:88, y:64, s:.9, bd:5.9, ba:17, sd:6.1, sr:3.6, d:2.2, o:.4 },
    {art:'arts.svg',          x:15, y:88, s:.7, bd:6.7, ba:14, sd:5.7, sr:5.0, d:1.0, o:.38},
    {art:'history.svg',       x:81, y:90, s:.72,bd:4.9, ba:16, sd:7.2, sr:2.2, d:0.4, o:.4 },
  ];
  decor.innerHTML = set.map(o=>
    `<div class="float" style="left:${o.x}%;top:${o.y}%;opacity:${o.o};--bd:${o.bd}s;--ba:${o.ba}px;--delay:${o.d}s">
       <img style="--s:${o.s};--sd:${o.sd}s;--sr:${o.sr}deg" src="assets/art/characters/${o.art}" alt="">
     </div>`
  ).join('');
  refreshBest();
}
function refreshBest(){ $('#bestLine').textContent = settings.best>0 ? `Best score: ${settings.best}` : 'Best score: —'; }
function quit(){
  if(window.steamShell && window.steamShell.quit){ window.steamShell.quit(); return; }
  const inner = $('#screen-menu .menu-inner');
  inner.innerHTML = `<div class="bye"><img src="assets/art/brand/mascot.svg" alt=""><p>Thanks for playing!</p><button class="btn btn-secondary" id="byeBack"><span>BACK</span></button></div>`;
  $('#byeBack').addEventListener('click', ()=>location.reload());
}

/* ---------- fullscreen (works in browser + Electron shell) ---------- */
function applyFullscreen(on){
  if(window.steamShell && window.steamShell.setFullscreen){ window.steamShell.setFullscreen(on); return; }
  try{
    if(on){ if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }
    else if(document.fullscreenElement && document.exitFullscreen){ document.exitFullscreen(); }
  }catch(e){}
}

/* =========================================================
   SETTINGS
   ========================================================= */
function openSettings(){ syncSettingsUI(); show('screen-settings'); }
function syncSettingsUI(){
  $$('#screen-settings .toggle').forEach(t=>{
    const on = !!settings[t.dataset.set];
    t.classList.toggle('on', on);
    t.style.backgroundImage = `url(assets/art/ui/toggle_${on?'on':'off'}.svg)`;
  });
  $('#secsVal').textContent = settings.secs;
}
function initSettings(){
  $$('#screen-settings .toggle').forEach(t=>t.addEventListener('click', ()=>{
    const k = t.dataset.set; settings[k] = !settings[k]; save();
    if(settings.sound) Sfx.click();
    Sfx.setEnabled(settings.sound);
    if(k==='music') Sfx.setMusic(settings.music);
    if(k==='fullscreen') applyFullscreen(settings.fullscreen);
    syncSettingsUI();
  }));
  $$('#screen-settings .step').forEach(s=>s.addEventListener('click', ()=>{
    if(s.dataset.step!=='secs') return;
    settings.secs = clamp(settings.secs + (+s.dataset.dir)*5, 10, 40); save();
    if(settings.sound) Sfx.click(); syncSettingsUI();
  }));
  $$('#screen-settings [data-act="back-menu"]').forEach(b=>b.addEventListener('click', ()=>{ if(settings.sound) Sfx.click(); show('screen-menu'); }));
}

/* =========================================================
   PREGAME
   ========================================================= */
function catTiles(){ return CATEGORIES.concat([{id:'mixed', name:'All Mixed', color:'#F8D45B', art:'assets/art/brand/mascot.svg'}]); }

function openPregame(){
  renderCats();
  syncControls();
  syncPlayers(true);
  show('screen-pregame');
}
function renderCats(){
  const row = $('#catRow');
  row.innerHTML = catTiles().map(c=>`
    <button class="cat-tile ${c.id===state.config.categoryId?'on':''}" data-cat="${c.id}" style="--cc:${c.color}">
      <div class="cat-art"><img src="${c.art}" alt=""></div>
      <div class="cat-name">${c.name}</div>
    </button>`).join('');
  $$('#catRow .cat-tile').forEach(t=>t.addEventListener('click', ()=>{
    state.config.categoryId = t.dataset.cat;
    if(settings.sound) Sfx.select();
    $$('#catRow .cat-tile').forEach(x=>x.classList.toggle('on', x===t));
    clampNum();
  }));
}
function syncControls(){
  $('#numVal').textContent = state.config.num;
  $('#playersVal').textContent = state.config.playerCount;
  $$('#diffRow .chip2').forEach(c=>c.classList.toggle('on', c.dataset.diff===state.config.diff));
  $$('#modeRow .chip2').forEach(c=>c.classList.toggle('on', c.dataset.mode===state.config.mode));
}
function poolSize(){
  const cid = state.config.categoryId;
  let pool = cid==='mixed' ? Object.values(QUESTION_BANK).flat() : (QUESTION_BANK[cid]||[]);
  if(state.config.diff!=='mixed'){ const f = pool.filter(q=>q.d===state.config.diff); if(f.length>=4) pool=f; }
  return pool.length;
}
function clampNum(){ state.config.num = clamp(state.config.num, 5, Math.min(20, Math.max(5, poolSize()))); $('#numVal').textContent = state.config.num; }

function initPregame(){
  $$('#screen-pregame [data-act="back-menu"]').forEach(b=>b.addEventListener('click', ()=>{ if(settings.sound) Sfx.click(); show('screen-menu'); }));
  $('#diffRow').addEventListener('click', e=>{ const c=e.target.closest('.chip2'); if(!c) return; state.config.diff=c.dataset.diff; if(settings.sound)Sfx.click(); syncControls(); clampNum(); });
  $('#modeRow').addEventListener('click', e=>{ const c=e.target.closest('.chip2'); if(!c) return; state.config.mode=c.dataset.mode; if(settings.sound)Sfx.click(); syncControls(); syncPlayers(); });
  $$('#screen-pregame .step').forEach(s=>s.addEventListener('click', ()=>{
    const dir=+s.dataset.dir; if(settings.sound)Sfx.click();
    if(s.dataset.step==='num'){ state.config.num=clamp(state.config.num+dir*5,5,Math.min(20,Math.max(5,poolSize()))); $('#numVal').textContent=state.config.num; }
    if(s.dataset.step==='players'){ state.config.playerCount=clamp(state.config.playerCount+dir,2,4); $('#playersVal').textContent=state.config.playerCount; syncPlayers(); }
  }));
  $('#screen-pregame [data-act="start"]').addEventListener('click', ()=>{ Sfx.unlock(); startGame(); });
}
function syncPlayers(reset){
  const n = state.config.playerCount, mode = state.config.mode;
  if(reset || state.players.length===0){
    const avs = shuffle(AVATARS);
    state.players = Array.from({length:4}, (_,i)=>({
      name: i===0 ? 'You' : BOT_NAMES[rand(BOT_NAMES.length)],
      avatar: avs[i], isBot:false
    }));
    // keep bot-name uniqueness loosely
    state.players[2].name = BOT_NAMES[(BOT_NAMES.indexOf(state.players[1].name)+3)%BOT_NAMES.length];
    state.players[3].name = BOT_NAMES[(BOT_NAMES.indexOf(state.players[2].name)+4)%BOT_NAMES.length];
  }
  state.players.forEach((p,i)=>{ p.isBot = (mode==='solo' && i>0); });
  renderPlayerSlots(n);
}
function renderPlayerSlots(n){
  const wrap = $('#playerSlots');
  wrap.innerHTML = state.players.slice(0,n).map((p,i)=>`
    <div class="pslot" data-i="${i}">
      <button class="pslot-av" title="Tap to change look"><img src="${AV(p.avatar)}" alt=""></button>
      <input class="pslot-name" maxlength="12" value="${p.name.replace(/"/g,'')}">
      ${p.isBot?'<span class="bot-tag">BOT</span>':'<span class="you-tag">'+(i===0?'YOU':'P'+(i+1))+'</span>'}
    </div>`).join('');
  $$('#playerSlots .pslot').forEach(slot=>{
    const i=+slot.dataset.i;
    slot.querySelector('.pslot-av').addEventListener('click', ()=>{
      const cur=AVATARS.indexOf(state.players[i].avatar);
      state.players[i].avatar=AVATARS[(cur+1)%AVATARS.length];
      slot.querySelector('img').src=AV(state.players[i].avatar);
      if(settings.sound) Sfx.hover();
    });
    slot.querySelector('.pslot-name').addEventListener('input', e=>{ state.players[i].name = e.target.value || (i===0?'You':'Player'); });
  });
}

/* =========================================================
   GAME
   ========================================================= */
function buildQuestions(){
  const cid = state.config.categoryId;
  let pool = cid==='mixed'
    ? Object.entries(QUESTION_BANK).flatMap(([k,arr])=>arr.map(q=>Object.assign({cat:k},q)))
    : (QUESTION_BANK[cid]||[]).map(q=>Object.assign({cat:cid},q));
  if(state.config.diff!=='mixed'){ const f=pool.filter(q=>q.d===state.config.diff); if(f.length>=4) pool=f; }
  pool = shuffle(pool).slice(0, clamp(state.config.num,1,pool.length));
  return pool.map(q=>{
    const order = shuffle([0,1,2,3]);
    return { text:q.q, cat:q.cat, d:q.d,
             choices: order.map(i=>q.choices[i]),
             answer: order.indexOf(q.answer) };
  });
}
function startGame(){
  Sfx.setEnabled(settings.sound);
  const players = state.players.slice(0, state.config.playerCount).map((p,i)=>({
    name:p.name||'Player', avatar:p.avatar, isBot:p.isBot, score:0,
    skill: 0.55 + Math.random()*0.3   // bot competence
  }));
  state.run = { qs: buildQuestions(), idx:0, players, active:0, locked:false, mode:state.config.mode };
  buildTopbar(); updateTopbar();
  $('#turnFlag').classList.remove('show');
  state.paused = false; $('#pause').classList.remove('show');
  show('screen-game');
  if(settings.sound) Sfx.start();
  setTimeout(()=>nextQuestion(), 220);
}

/* ---------- pause / quit-to-menu ---------- */
function pauseGame(){
  if(!state.run || state.run.locked || state.paused) return;
  if(!$('#screen-game.active')) return;
  state.paused = true; clearTimeout(timerTO);
  $('#pause').classList.add('show');
  if(settings.sound) Sfx.click();
}
function resumeGame(){
  if(!state.paused) return;
  state.paused = false; $('#pause').classList.remove('show');
  if(settings.sound) Sfx.click();
  if(settings.timer && state.run && !state.run.locked) startTimer();
}
function quitToMenu(){
  state.paused = false; clearTimeout(timerTO);
  $('#pause').classList.remove('show');
  state.run = null; Sfx.setMusic(false);
  if(settings.sound) Sfx.click();
  show('screen-menu'); refreshBest();
}

let topbarRefs = null;
function half(n){ return Math.floor(n/2); }
function buildTopbar(){
  const r = state.run, bar = $('#topbar');
  const left = r.players.slice(0, half(r.players.length));
  const right = r.players.slice(half(r.players.length));
  const cardHTML = (p, idx) => `
    <div class="pcard" data-i="${idx}">
      <img class="frame" src="assets/art/ui/player_card.svg" alt="">
      <img class="avatar" src="${AV(p.avatar)}" alt="">
      <div class="pname">${escapeHtml(p.name)}</div>
      <div class="plabel">POINTS</div>
      <div class="pts"><img class="badge" src="assets/art/ui/points_badge.svg" alt=""><span class="num">0</span></div>
    </div>`;
  const coin = `
    <div class="progress">
      <img class="coin" src="assets/art/ui/progress_coin.svg" alt="">
      <svg class="ring" viewBox="0 0 140 140">
        <circle class="track" cx="70" cy="68" r="57"></circle>
        <circle class="bar" cx="70" cy="68" r="57" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" transform="rotate(-90 70 68)"></circle>
      </svg>
      <div class="ptext"><div class="plabel2">Progress</div><div class="ppct">0%</div></div>
    </div>`;
  let html='', gi=0;
  left.forEach(p=>{ html+=cardHTML(p,gi++); });
  html+=coin;
  right.forEach(p=>{ html+=cardHTML(p,gi++); });
  bar.innerHTML = html;
  topbarRefs = $$('#topbar .pcard').map(el=>({
    el, frame:el.querySelector('.frame'), name:el.querySelector('.pname'),
    num:el.querySelector('.num'), avatar:el.querySelector('.avatar')
  }));
  topbarRefs.bar = $('#topbar .progress .bar');
  topbarRefs.pct = $('#topbar .progress .ppct');
}
function updateTopbar(){
  const r = state.run;
  r.players.forEach((p,i)=>{
    const ref = topbarRefs[i]; if(!ref) return;
    ref.num.textContent = p.score;
    const act = (i===r.active);
    ref.el.classList.toggle('is-active', act);
    ref.frame.src = act ? 'assets/art/ui/player_card_active.svg' : 'assets/art/ui/player_card.svg';
  });
  const pct = Math.round((r.idx / r.qs.length) * 100);
  topbarRefs.pct.textContent = pct + '%';
  topbarRefs.bar.setAttribute('stroke-dashoffset', String(100 - pct));
}

let timerTO = null;
function nextQuestion(){
  const r = state.run;
  if(r.idx >= r.qs.length){ return endGame(); }
  const q = r.qs[r.idx];
  r.locked = false;
  updateTopbar();

  // turn flag (pass & play)
  const flag = $('#turnFlag');
  if(r.mode==='pass'){ flag.textContent = (r.players[r.active].name) + "'s turn"; flag.classList.add('show'); }
  else { flag.classList.remove('show'); }

  // question
  $('#question').innerHTML = escapeHtml(q.text);

  // answers
  const ans = $('#answers'); ans.classList.remove('locked');
  ans.innerHTML = q.choices.map((c,i)=>
    `<button class="answer" data-k="${LETTERS[i]}" data-i="${i}"><span class="a-letter">${LETTERS[i].toUpperCase()}</span><span class="a-text">${escapeHtml(c)}</span></button>`
  ).join('');
  $$('#answers .answer').forEach(b=>{
    b.addEventListener('mouseenter', ()=>{ if(!r.locked && settings.sound) Sfx.hover(); });
    b.addEventListener('click', ()=>onAnswer(+b.dataset.i, b));
  });

  startTimer();
}
function startTimer(){
  clearTimeout(timerTO);
  const fill = $('#qtimerFill'), bar = $('#qtimer');
  if(!settings.timer){ bar.classList.add('off'); return; }
  bar.classList.remove('off');
  fill.style.transition='none'; fill.style.width='100%';
  // force reflow then animate
  void fill.offsetWidth;
  fill.style.transition=`width ${settings.secs}s linear`;
  fill.style.width='0%';
  fill.className='qtimer-fill';
  timerTO = setTimeout(()=>{ if(!state.run.locked) resolve(-1, null); }, settings.secs*1000);
  // warning tint near the end
  setTimeout(()=>{ if(!state.run.locked) fill.classList.add('warn'); }, Math.max(0,(settings.secs-5))*1000);
}
function onAnswer(i, btn){
  const r = state.run; if(r.locked) return;
  if(settings.sound) Sfx.click();
  resolve(i, btn);
}
function resolve(chosen, btn){
  const r = state.run; if(r.locked) return;
  r.locked = true;
  clearTimeout(timerTO);
  const fill=$('#qtimerFill'); fill.style.transition='none'; fill.style.width=getComputedStyle(fill).width;

  const q = r.qs[r.idx];
  const ans = $('#answers'); ans.classList.add('locked');
  const btns = $$('#answers .answer');
  btns.forEach((b,i)=>{
    if(i===q.answer) b.classList.add('correct');
    else if(i===chosen) b.classList.add('wrong');
    else b.classList.add('dim');
  });

  // active (human) scoring
  const correct = chosen===q.answer;
  if(correct){ r.players[r.active].score++; }
  if(settings.sound){ correct ? Sfx.correct() : (chosen===-1 ? Sfx.timeout() : Sfx.wrong()); }
  popScore(r.active, correct);

  // bots (solo race): every bot answers this question too
  if(r.mode==='solo'){
    r.players.forEach((p,i)=>{
      if(!p.isBot) return;
      const penalty = q.d==='hard'?0.22 : q.d==='normal'?0.08 : -0.06;
      const prob = clamp(p.skill - penalty, 0.2, 0.95);
      if(Math.random() < prob){ p.score++; popScore(i, true); }
      else popScore(i, false);
    });
  }
  setTimeout(()=>{ updateTopbar(); }, 220);

  // advance: show the mid-game leaderboard between questions
  setTimeout(()=>{
    r.idx++;
    if(r.mode==='pass'){ r.active = (r.active+1) % r.players.length; }
    if(r.idx >= r.qs.length){ endGame(); }
    else { showLeaderboard(); }
  }, 1500);
}

/* ---------- Kahoot-style mid-game leaderboard ---------- */
function showLeaderboard(){
  const r = state.run;
  const ranked = r.players.map((p,i)=>Object.assign({i},p)).sort((a,b)=>b.score-a.score);
  const prev = r.prevRank || {};                       // remember last standings
  $('#lbSub').textContent = `After question ${r.idx} of ${r.qs.length}`;
  const maxScore = Math.max(1, ranked[0].score);
  $('#lbList').innerHTML = ranked.map((p,pos)=>{
    const was = (pos+1) - (prev[p.i] || (pos+1));      // negative = moved up
    const move = was<0 ? `<svg class="lb-move up" viewBox="0 0 14 14"><path d="M7 2 12 11 2 11 Z"/></svg>`
               : was>0 ? `<svg class="lb-move down" viewBox="0 0 14 14"><path d="M7 12 2 3 12 3 Z"/></svg>`
               : `<span class="lb-move flat"></span>`;
    const w = 30 + (p.score / maxScore) * 70;
    return `<div class="lb-row ${pos===0?'lead':''} ${p.i===0?'me':''}" style="--w:${w}%">
        <span class="lb-pos">${pos+1}</span>
        <img class="lb-av" src="${AV(p.avatar)}" alt="">
        <span class="lb-name">${escapeHtml(p.name)}${p.isBot?' <small>BOT</small>':''}</span>
        ${move}
        <span class="lb-score">${p.score}</span>
      </div>`;
  }).join('');
  const np = {}; ranked.forEach((p,pos)=>{ np[p.i]=pos+1; }); r.prevRank = np;
  show('screen-leaderboard');
}
function continueFromBoard(){
  if(settings.sound) Sfx.click();
  show('screen-game');
  nextQuestion();
}
function popScore(i, correct){
  const ref = topbarRefs[i]; if(!ref) return;
  const c = correct ? 'flash-good' : 'flash-bad';
  ref.num.classList.remove('flash-good','flash-bad'); void ref.num.offsetWidth;
  ref.num.classList.add(c);
}

/* =========================================================
   RESULTS
   ========================================================= */
function endGame(){
  clearTimeout(timerTO);
  const r = state.run;
  const ranked = r.players.map((p,i)=>Object.assign({i},p)).sort((a,b)=>b.score-a.score);
  const you = r.players[0];
  if(you.score > settings.best){ settings.best = you.score; save(); }

  const youRank = ranked.findIndex(p=>p.i===0)+1;
  $('#resTitle').textContent = (r.players.length>1 && youRank===1) ? 'You Win!' :
                               (r.players.length===1) ? 'Quiz Complete!' :
                               `You placed #${youRank}`;

  renderPodium(ranked);
  renderRanking(ranked);
  show('screen-results');
  const conf = $('#resConfetti');
  conf.style.display = (youRank===1) ? 'block' : 'none';
  if(youRank===1){ conf.classList.remove('play'); void conf.offsetWidth; conf.classList.add('play'); }
  if(settings.sound) setTimeout(()=>Sfx.fanfare(), 250);
  refreshBest();
}
function renderPodium(ranked){
  const top = ranked.slice(0,3);
  const order = [1,0,2];           // silver, gold, bronze visual order
  const heights = {0:150,1:112,2:92};
  const medals = ['medal_gold','medal_silver','medal_bronze'];
  const pod = $('#podium');
  pod.innerHTML = order.map(rankPos=>{
    const p = top[rankPos]; if(!p) return '';
    return `<div class="pod-col rank-${rankPos}">
      <div class="pod-figure">
        ${rankPos===0?'<img class="pod-crown" src="assets/art/results/crown.svg" alt="">':''}
        <img class="pod-av" src="${AV(p.avatar)}" alt="">
        <img class="pod-medal" src="assets/art/results/${medals[rankPos]}.svg" alt="">
      </div>
      <div class="pod-block" style="height:${heights[rankPos]}px">
        <div class="pod-rankno">${rankPos+1}</div>
        <div class="pod-name">${escapeHtml(p.name)}</div>
        <div class="pod-score">${p.score} pts</div>
      </div>
    </div>`;
  }).join('');
}
function renderRanking(ranked){
  $('#ranking').innerHTML = ranked.map((p,i)=>`
    <div class="rank-row ${p.i===0?'is-you':''}">
      <span class="rank-pos">${i+1}</span>
      <img class="rank-av" src="${AV(p.avatar)}" alt="">
      <span class="rank-name">${escapeHtml(p.name)}${p.isBot?' <small>BOT</small>':''}</span>
      <span class="rank-score">${p.score}</span>
    </div>`).join('');
}
function initResults(){
  $$('#screen-results [data-act]').forEach(b=>b.addEventListener('click', ()=>{
    if(settings.sound) Sfx.click();
    const a=b.dataset.act;
    if(a==='again'){ startGame(); }
    else if(a==='setup'){ openPregame(); }
    else if(a==='menu'){ show('screen-menu'); refreshBest(); }
  }));
}

/* ---------- util ---------- */
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* ---------- boot ---------- */
function fit(){ const fr=$('#frame'); const s=Math.min(window.innerWidth/1280, window.innerHeight/720); fr.style.transform=`translate(-50%,-50%) scale(${s})`; }
window.addEventListener('resize', fit);
document.addEventListener('click', ()=>Sfx.unlock(), {once:true});

document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    if($('#screen-game.active')){ state.paused ? resumeGame() : pauseGame(); }
    else if($('#screen-settings.active') || $('#screen-pregame.active')){ show('screen-menu'); }
  } else if(e.key === 'F11' && !window.steamShell){
    e.preventDefault(); settings.fullscreen = !settings.fullscreen; save(); applyFullscreen(settings.fullscreen);
  }
});

document.addEventListener('DOMContentLoaded', ()=>{
  fit();
  Sfx.setEnabled(settings.sound);
  initMenu(); initSettings(); initPregame(); initResults();
  $('#screen-leaderboard [data-act="next-q"]').addEventListener('click', continueFromBoard);
  $('#pause [data-act="resume"]').addEventListener('click', resumeGame);
  $('#pause [data-act="quit-menu"]').addEventListener('click', quitToMenu);
  if(settings.fullscreen) applyFullscreen(true);
  show('screen-menu');
});
})();
