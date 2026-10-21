import {kana, words, sentences, songs, levels, modes} from './content.js';
import {shuffle, makeQuiz, gradeOrder, readProgress, recordRound, STORAGE_KEY} from './core.js';

const $ = selector => document.querySelector(selector);
const main = $('#main');
const dialog = $('#game-dialog');
const body = $('#dialog-body');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storage;
try { storage = window.localStorage; } catch { storage = {getItem(){return null;},setItem(){throw Error('blocked');}}; }
let progress = readProgress(storage);
let level = 'beginner';
let kanaType = 'hira';
let session = null;
let stageCleanup = null;
let routeVersion = 0;
let toastTimer;
let returnSelector = null;
const coverColors = ['#b9acd5','#cda6b7','#a6bca5','#9eafcf','#c8b794','#b7a1c9','#9ebbbd','#b4b0d9'];
function toast(message) { $('#toast').textContent=message; $('#toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').hidden=true,4500); }
function save() { try {storage.setItem(STORAGE_KEY,JSON.stringify(progress));} catch {toast('瀏覽器無法儲存紀錄；這次學習仍有效，關閉頁面後紀錄可能消失。');} updateXP(); }
function updateXP() { $('#xp-total').textContent = `${progress.xp} XP`; }
function today() {const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function settings() { return `<div class="practice-settings"><label for="level">練習難度</label><select id="level">${Object.entries(levels).map(([id,label])=>`<option value="${id}" ${id===level?'selected':''}>${label}</option>`).join('')}</select><label for="kana-type">假名字形</label><select id="kana-type"><option value="hira" ${kanaType==='hira'?'selected':''}>平假名</option><option value="kata" ${kanaType==='kata'?'selected':''}>片假名</option></select><span class="hint">不限時，按照自己的步調。</span></div>`; }
const gameCards = () => `<div class="games-grid">
  ${[
    ['kana','あ','入門','假名閃卡','從一個字開始。<br>看假名，找到正確的讀音。','8 題 · 約 2 分鐘'],
    ['match','結','基礎 → 進階','詞彙連線','把意思連起來。<br>漢字、讀音與中文一起記。','5 組 · 約 3 分鐘'],
    ['order','文','基礎 → 進階','句子拼軌','讓詞語各就各位。<br>拼出生活中真正用得到的句子。','4 題 · 約 3 分鐘'],
    ['song','♫','16 首讀本','音樂讀本','沿著喜歡的旋律。<br>從歌曲的故事，認識新的日語。','3 題 · 每首一個主題']
  ].map(([mode,symbol,tag,title,description,meta])=>`<article class="game-card"><div class="card-top"><div class="game-symbol" lang="ja" aria-hidden="true">${symbol}</div><span class="chip">${tag}</span></div><h3>${title}</h3><p>${description}</p><button class="card-action" data-start="${mode}" aria-label="開始${title}">${meta}<span aria-hidden="true">↗</span></button></article>`).join('')}
</div>`;
function home() {
  const count=progress.rounds.filter(r=>r.date===today()).length;
  return `<div class="intro-line"><strong>こんにちは！今天也來學一點日語吧。</strong><span>一點點練習，慢慢成為日常。</span></div>
  <section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><div class="eyebrow">PLAY A LITTLE. LEARN A LITTLE.</div><h1 id="hero-title">讓喜歡的旋律，<br>成為<em>你的日語。</em></h1><p>從「あ」到聽懂故事的那一天。<br>玩一局、學一句，讓每個新單字找到自己的軌道。</p><div class="hero-actions"><button class="primary" data-start="kana">開始今天的練習 <span>↗</span></button><a class="text-link" href="#songs">探索音樂讀本 →</a></div></div><div id="stage" class="stage" role="img" aria-label="可隨指標轉動視角的紫色唱片與軌道"><div class="record-fallback"></div><span class="stage-sticker">ことばを、あつめよう。</span><div class="stage-label"><span>KOTOBA RADIO / VOL. 01</span><span>33⅓ RPM · NO AUTOPLAY</span></div></div></section>
  <div class="section-heading"><div><div class="section-kicker">FIND YOUR RHYTHM</div><h2>今天，想怎麼練習？</h2><p>四種玩法，找到適合自己的學習節奏。</p></div><a class="text-link" href="#games">全部練習 ↗</a></div>${gameCards()}
  <div class="below-grid"><article class="feature-song"><div class="album-art" lang="ja">夜<small>ORIGINAL STUDY ART</small></div><div><div class="section-kicker">FIRST LISTEN / 第一篇音樂讀本</div><h3 lang="ja">夜に駆ける</h3><p>YOASOBI · 夜晚與敘事<br>讀一點故事，帶走三個新發現。</p></div><button data-song="yoru" aria-label="開啟夜に駆ける讀本">↗</button></article><article class="daily-card"><span class="daily-count">${count}<small> / 3</small></span><h3>給自己，一小段日語時間。</h3><p>今日完成 ${count} 回合 · 自訂小目標：3 回合</p><progress value="${Math.min(count,3)}" max="3" aria-label="今日三回合目標"></progress><a class="text-link" href="#progress">${count>=3?'今天的小目標已達成，做得很好。':'不必趕路，開始就是進步。'} ↗</a></article></div>`;
}
function songRows(query='') {
  const filtered=songs.filter(s=>`${s.title} ${s.zh} ${s.roman} ${s.theme}`.toLowerCase().includes(query.toLowerCase().trim()));
  return filtered.length?filtered.map(s=>{const i=songs.indexOf(s); return `<button class="song-card" data-song="${s.id}"><span class="album-art" style="--cover:${coverColors[i%8]}" lang="ja">${escape(s.word[0])}</span><span><h3 lang="ja">${escape(s.title)}</h3><p>${escape(s.zh)} · ${escape(s.theme)}</p><span class="chip">${s.year} / 3 題練習</span></span><span class="song-number">${String(i+1).padStart(2,'0')} ↗</span></button>`;}).join(''):'<p class="empty">沒有符合的曲目。試試中文曲名、日文或羅馬拼音。</p>';
}
function render() {
  stageCleanup?.(); stageCleanup=null;
  const version=++routeVersion;
  const route=location.hash.slice(1).split('/')[0]||'home';
  const names={home:'學習大廳',games:'遊戲練習場',songs:'音樂讀本',progress:'我的學習軌跡',kana:'五十音小抄'};
  const current=names[route]?route:'home';
  document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===current); if(a.dataset.nav===current)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  $('#breadcrumb').textContent=names[current];
  document.title=`${names[current]}｜Kotoba Orbit 言葉軌道`;
  if(current==='home') {
    main.innerHTML=home();
    import('./stage.js').then(({mountStage})=>{if(version===routeVersion)stageCleanup=mountStage($('#stage'));}).catch(()=>{});
  } else if(current==='games') {
    main.innerHTML=`<div class="page-title"><div class="eyebrow">PRACTICE ARCADE</div><h1>把日語，練成你的節奏。</h1><p>沒有倒數，也沒有扣血。每一局都是一個小練習，答錯後會留下解說。</p></div>${settings()}${gameCards()}<p class="notice">難度套用於詞彙連線與句子拼軌。假名練習涵蓋 46 個清音；歌曲讀本依曲目主題編排。本站分級不是 JLPT 等級認證。</p>`;
  } else if(current==='songs') {
    main.innerHTML=`<div class="page-title"><div class="eyebrow">THE LISTENING LIBRARY / 16 STORIES</div><h1>每首歌，都有故事的起點。</h1><p>從 YOASOBI 的原作背景出發，練習主題單字與原創例句。讀本不收錄完整歌詞或音源；想聽歌時，可以前往官方 MV。</p></div><div class="filters"><label for="song-search">搜尋讀本</label><input id="song-search" type="search" placeholder="曲名、中文或羅馬拼音…" autocomplete="off"></div><div class="song-list" id="song-list">${songRows()}</div><p class="notice">曲目依 <a class="text-link" href="https://tool.crownchung.tw/yoru-notes/" target="_blank" rel="noopener noreferrer">YORU Notes 夜讀音樂室 ↗</a> 整理。封面為本站文字圖形，不是官方專輯封面。</p>`;
  } else if(current==='kana') {
    main.innerHTML=`<div class="page-title"><div class="eyebrow">YOUR POCKET REFERENCE</div><h1>從「あいうえお」開始。</h1><p>46 個現代清音：左為平假名，右為片假名，下方為羅馬拼音。を記為 wo，作助詞時通常讀作 o；は、へ作助詞時分別讀 wa、e。濁音、半濁音、拗音將在後續擴充。</p></div><button class="primary" data-start="kana">練習八題 ↗</button><div class="section-heading"><h2>清音速查</h2></div><div class="kana-grid">${kana.map(k=>`<div class="kana-cell"><strong lang="ja">${k.hira}</strong><span lang="ja">${k.kata}</span><small>${k.roman}</small></div>`).join('')}</div>`;
  } else renderProgress();
  updateXP();
}
function renderProgress() {
  const rounds=progress.rounds;
  const total=rounds.reduce((n,r)=>n+r.total,0),correct=rounds.reduce((n,r)=>n+r.correct,0);
  main.innerHTML=`<div class="page-title"><div class="eyebrow">A LITTLE FURTHER, EVERY DAY</div><h1>你的每一步，都有留下來。</h1><p>紀錄只儲存在這個瀏覽器，不需要帳號。保留最近 100 回合，累積 XP 不受此限制。</p></div><div class="stats-grid"><div class="stat"><strong>${progress.xp}</strong><span>累積學習 XP</span></div><div class="stat"><strong>${rounds.length}</strong><span>近期完成回合</span></div><div class="stat"><strong>${total?Math.round(correct/total*100):0}%</strong><span>近期首次答對率</span></div></div><div class="section-heading"><h2>最近的練習</h2></div>${rounds.length?[...rounds].reverse().slice(0,20).map(r=>`<div class="history-row"><span>${escape(modes[r.mode]||'練習')}<br><small>${escape(r.date)}</small></span><span>${r.correct} / ${r.total}<br><small>+${r.correct*10} XP</small></span></div>`).join(''):'<div class="empty">還沒有完成的回合。<br><a href="#games" class="text-link">從第一個小練習開始 →</a></div>'}<div class="reset-area"><button id="reset-progress" class="secondary">清除本機紀錄</button><span class="hint">清除前會再次確認，無法復原。</span></div>`;
}
function openDialog(label) {
  $('#dialog-label').textContent=label;
  if(!dialog.open){
    const trigger=document.activeElement;
    returnSelector=trigger?.id?`#${CSS.escape(trigger.id)}`:trigger?.dataset.song?`[data-song="${trigger.dataset.song}"]`:trigger?.dataset.start?`[data-start="${trigger.dataset.start}"]`:null;
    dialog.showModal();
  }
}
function showSong(id) {
  const song=songs.find(s=>s.id===id); if(!song)return;
  session=null;
  body.innerHTML=`<article class="song-detail"><div class="eyebrow">YOASOBI / ${song.year}</div><h2 id="dialog-title" lang="ja">${escape(song.title)}</h2><p>${escape(song.zh)} · ${escape(song.theme)}</p><dl class="detail-meta"><dt>原作</dt><dd lang="ja">${escape(song.story)}</dd><dt>作者</dt><dd lang="ja">${escape(song.author)}</dd><dt>這篇讀本練習什麼</dt><dd>「<span lang="ja">${escape(song.word)}（${escape(song.reading)}）</span>」：${escape(song.meaning)}。先讀背景，再練習單字與一句生活日語。</dd></dl><p>這裡用「${escape(song.theme)}」作為學習切入點。它是本站的主題延伸，不是原作情節摘要，也不是歌詞逐句翻譯。想深入理解作品，請閱讀原作來源。</p><div class="source-links"><a href="${song.source}" target="_blank" rel="noopener noreferrer">原作／出版來源 ↗</a><a href="${song.listen}" target="_blank" rel="noopener noreferrer">觀看官方 MV ↗</a></div><button class="primary" data-song-start="${song.id}">開始這首的 3 題練習 ↗</button></article>`;
  openDialog('MUSIC READER / 原作與日語');
}
function start(mode, songId) {
  if(mode==='song'&&!songId){location.hash='songs';if(dialog.open)dialog.close();return;}
  const base={mode,songId,index:0,correct:0,answered:false,wrong:[],recorded:false};
  if(mode==='kana')base.questions=makeQuiz(kana.map(k=>({id:k.hira,prompt:k[kanaType],answer:k.roman,explanation:`${k.hira}／${k.kata} 的讀音是 ${k.roman}。${k.hira==='を'?'作助詞時通常讀 o。':''}`})),8);
  if(mode==='song')base.questions=songs.find(s=>s.id===songId).practice.map(q=>({...q,options:shuffle([q.answer,...q.distractors])}));
  if(mode==='order')base.questions=shuffle(sentences.filter(s=>s.level===level)).slice(0,4);
  if(mode==='match'){
    base.pairs=shuffle(words.filter(w=>w.level===level)).slice(0,5);
    base.right=shuffle(base.pairs);base.matched=[];base.left=null;base.mistakes=new Set();
  }
  session=base; renderQuestion();openDialog(`${modes[mode]} / ${mode==='kana'?(kanaType==='hira'?'平假名':'片假名'):levels[level]}`);
}
function renderQuestion() {
  const s=session;if(!s)return;
  if(s.mode==='match'){renderMatch();return;}
  s.answered=false;s.selected=[];
  const q=s.questions[s.index];
  const order=s.mode==='order';
  body.innerHTML=`<h2 id="dialog-title" class="question-heading">${order?'把詞塊排成這句日語':s.mode==='kana'?'這個假名，怎麼讀？':'沿著歌曲，學一句日語'}</h2><progress max="${s.questions.length}" value="${s.index}" aria-label="答題進度"></progress><div class="question-main ${s.mode==='kana'?'':'long'}" ${s.mode==='kana'?'lang="ja"':''}>${escape(order?q.meaning:q.prompt)}</div>${order?`<div class="selected-tokens" id="selected-tokens" aria-label="已選詞塊"></div><div class="token-bank" id="token-bank">${shuffle(q.tokens.map((text,id)=>({text,id}))).map(t=>`<button class="token" data-token="${t.id}" lang="ja">${escape(t.text)}</button>`).join('')}</div><button class="secondary" id="check-order">確認句子</button>`:`<div class="choices">${q.options.map((o,i)=>`<button class="choice" data-choice="${i}">${escape(o)}</button>`).join('')}</div>`}<div id="feedback" aria-live="polite"></div><div class="session-footer"><span class="hint">${s.index+1} / ${s.questions.length} 題 · 答對 ${s.correct} 題</span><button id="next-question" class="primary" hidden>${s.index===s.questions.length-1?'查看學習成果':'下一題 →'}</button></div>`;
}
function answer(value) {
  const s=session;if(!s||s.answered)return;
  const q=s.questions[s.index];
  if(s.mode==='order'&&s.selected.length!==q.tokens.length){toast('請先排好所有詞塊，再確認句子。');return;}
  const correct=s.mode==='order'?gradeOrder(s.selected.map(i=>q.tokens[i]),q.tokens,q.alternatives):value===q.answer;
  s.answered=true;
  if(correct)s.correct++;else s.wrong.push({prompt:q.meaning||q.prompt,answer:q.answer||q.tokens.join(''),explanation:q.explanation});
  body.querySelectorAll('.choice,.token,#check-order').forEach(b=>b.disabled=true);
  if(s.mode!=='order')body.querySelectorAll('.choice').forEach(b=>{const v=q.options[Number(b.dataset.choice)];b.classList.toggle('correct',v===q.answer);b.classList.toggle('incorrect',v===value&&!correct);});
  $('#feedback').className=`feedback ${correct?'':'wrong'}`;
  $('#feedback').innerHTML=`<strong>${correct?'✓ 答對了！':'再記一次，也是一種進步。'}</strong>${correct?'':`正確答案：<span lang="ja">${escape(q.answer||q.tokens.join(''))}</span><br>`}${escape(q.explanation)}`;
  $('#next-question').hidden=false;$('#next-question').focus();
}
function renderMatch() {
  const s=session;
  body.innerHTML=`<h2 id="dialog-title" class="question-heading">讓單字，遇見它的意思。</h2><p class="hint">先選左邊的日語，再選右邊的中文。答錯可以繼續；首次配對正確才計分。</p><progress max="5" value="${s.matched.length}" aria-label="配對進度"></progress><div class="match-grid"><div class="match-column">${s.pairs.map(w=>`<button class="match-button ${s.matched.includes(w.id)?'matched':''}" data-left="${w.id}" ${s.matched.includes(w.id)?'disabled':''}><span lang="ja">${w.word}</span><small lang="ja">${w.reading}</small></button>`).join('')}</div><div class="match-column">${s.right.map(w=>`<button class="match-button ${s.matched.includes(w.id)?'matched':''}" data-right="${w.id}" ${s.matched.includes(w.id)?'disabled':''}>${w.meaning}${s.matched.includes(w.id)?' ✓':''}</button>`).join('')}</div></div><div id="feedback" class="feedback" aria-live="polite">${s.matched.length?`已完成 ${s.matched.length} / 5 組配對。`:'選一個日語單字開始。'}</div><div class="session-footer"><span class="hint">${s.matched.length} / 5 組</span><button class="primary" id="finish-match" ${s.matched.length===5?'':'hidden'}>查看學習成果</button></div>`;
}
function matchRight(id) {
  const s=session;
  if(!s||s.mode!=='match'||s.recorded||s.matched.includes(id))return;
  if(!s.left){$('#feedback').textContent='先選左邊的日語單字，再選意思。';return;}
  if(s.left===id){s.matched.push(id);if(!s.mistakes.has(id))s.correct++;s.left=null;renderMatch();if(s.matched.length===5)$('#finish-match').focus();}
  else {s.mistakes.add(s.left);$('#feedback').textContent='還沒有配對成功。保留左邊的單字，再找找它的意思。';}
}
function finish() {
  const s=session;if(!s||s.recorded)return;
  s.recorded=true;
  const total=s.mode==='match'?5:s.questions.length;
  progress=recordRound(progress,{mode:s.mode,correct:s.correct,total,date:today()});save();
  if(s.mode==='match')s.wrong=s.pairs.filter(w=>s.mistakes.has(w.id)).map(w=>({prompt:w.word,answer:`${w.reading} · ${w.meaning}`,explanation:'下次再遇見這個單字時，試著先想起它的意思。'}));
  body.innerHTML=`<div class="result"><div class="result-icon" aria-hidden="true">✳</div><div class="eyebrow" style="justify-content:center">A LITTLE MORE JAPANESE</div><h2 id="dialog-title">又靠近日語一點了。</h2><div class="result-score">${s.correct}<span class="muted"> / ${total}</span></div><p>首次答對 ${s.correct} 題 · +${s.correct*10} XP<br>${s.correct===total?'這一回合全部答對，換個難度再出發吧。':'讓這些還不熟悉的字，成為下一次的熟悉。'}</p>${s.wrong.length?`<div class="review-list"><h3>這回合的小筆記</h3>${s.wrong.map(w=>`<div class="review-item">${escape(w.prompt)}<br><strong>${escape(w.answer)}</strong><br><span class="muted">${escape(w.explanation)}</span></div>`).join('')}</div>`:''}<div class="result-actions"><button class="primary" id="replay">再練一回合 ↗</button><button class="secondary" id="done">回到學習大廳</button></div></div>`;
  $('#dialog-title').tabIndex=-1;$('#dialog-title').focus();
}
document.addEventListener('click',e=>{
  if(e.target.closest('.skip-link')){e.preventDefault();main.focus();main.scrollIntoView();return;}
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.start){start(b.dataset.start);return;}
  if(b.dataset.song){showSong(b.dataset.song);return;}
  if(b.dataset.songStart){start('song',b.dataset.songStart);return;}
  if(b.id==='close-dialog'){dialog.close();return;}
  if(b.id==='done'){dialog.close();location.hash='home';render();return;}
  if(b.id==='replay'){start(session.mode,session.songId);return;}
  if(b.id==='reset-progress'){
    session=null;body.innerHTML='<h2 id="dialog-title">清除這個瀏覽器的學習紀錄？</h2><p class="hint">累積 XP 與所有回合會一併清除，無法復原。</p><div class="result-actions"><button id="cancel-reset" class="secondary">保留紀錄</button><button id="confirm-reset" class="primary">確認清除</button></div>';openDialog('LOCAL PROGRESS');return;
  }
  if(b.id==='cancel-reset'){dialog.close();return;}
  if(b.id==='confirm-reset'){progress={xp:0,rounds:[]};save();dialog.close();render();return;}
  const s=session;if(!s||s.recorded)return;
  if(b.dataset.choice!==undefined){answer(s.questions[s.index].options[Number(b.dataset.choice)]);return;}
  if(b.id==='next-question'){if(!s.answered)return;s.index++;if(s.index===s.questions.length)finish();else renderQuestion();return;}
  if(b.dataset.token!==undefined&&!s.answered){const id=Number(b.dataset.token);if(!s.selected.includes(id)){s.selected.push(id);b.disabled=true;updateTokens();}return;}
  if(b.dataset.unselect!==undefined&&!s.answered){const id=Number(b.dataset.unselect);s.selected=s.selected.filter(i=>i!==id);$(`[data-token="${id}"]`).disabled=false;updateTokens();return;}
  if(b.id==='check-order'){answer();return;}
  if(b.dataset.left){s.left=b.dataset.left;body.querySelectorAll('[data-left]').forEach(x=>x.classList.toggle('selected',x.dataset.left===s.left));$('#feedback').textContent='現在選擇右邊對應的中文意思。';return;}
  if(b.dataset.right){matchRight(b.dataset.right);return;}
  if(b.id==='finish-match'&&s.matched.length===5)finish();
});
function updateTokens(){const s=session;$('#selected-tokens').innerHTML=s.selected.map(i=>`<button class="token" data-unselect="${i}" lang="ja" aria-label="移回 ${escape(s.questions[s.index].tokens[i])}">${escape(s.questions[s.index].tokens[i])}</button>`).join('');}
document.addEventListener('change',e=>{if(e.target.id==='level')level=e.target.value;if(e.target.id==='kana-type')kanaType=e.target.value;});
document.addEventListener('input',e=>{if(e.target.id==='song-search')$('#song-list').innerHTML=songRows(e.target.value);});
dialog.addEventListener('close',()=>{
  if(dialog.open)return;
  session=null;render();
  const trigger=returnSelector?$(returnSelector):null;
  (trigger||main).focus({preventScroll:true});
});
window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();render();window.scrollTo(0,0);});
render();
