import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from '../scripts/serve.js';
import {songs,levels} from '../src/content.js';
import {buildBank,questionTypes} from '../src/question-bank.js';

const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=process.env.TEST_URL||`http://127.0.0.1:${server.address().port}`;
await fs.mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];let completed=0,expectedXP=0;
function check(name,value){assert.ok(value,name);results.push(name);console.log(`PASS ${name}`);}
async function finishRound(page,config,{wrongFirst=false}={}){
  const byId=new Map(buildBank(config).map(q=>[q.id,q]));
  const total=config.mode==='match'?5:config.mode==='kana'?8:6;
  const seen=[],types=new Set();
  if(config.mode==='match'){
    const ids=await page.locator('[data-left]').evaluateAll(es=>es.map(e=>e.dataset.left));
    assert.equal(new Set(await page.locator('[data-right]').allTextContents()).size,5);
    if(wrongFirst){await page.locator(`[data-left="${ids[0]}"]`).click();await page.locator(`[data-right="${ids[1]}"]`).click();assert.ok((await page.locator('#feedback').textContent()).includes('還沒有'));}
    for(const id of ids){
      const q=byId.get(id);assert.ok(q,`match ${id} in selected bank`);seen.push(q.sourceId);types.add(q.type);
      const left=page.locator(`[data-left="${id}"] span`),right=page.locator(`[data-right="${id}"]`);
      assert.equal(await left.getAttribute('lang'),q.leftLang);
      assert.equal(await right.getAttribute('lang'),q.rightLang);
      if(q.leftLang==='ja')assert.equal(await left.getAttribute('data-pronunciation'),q.reading);
      else assert.equal(await left.getAttribute('data-pronunciation'),null,'Chinese prompt must not reveal Japanese answer');
      if(q.rightLang==='ja'){assert.equal(await right.getAttribute('data-pronunciation'),q.reading);assert.equal(await right.locator('..').locator('.speak-button').count(),1);}
      assert.equal(await page.locator(`[data-right="${id}"]`).textContent(),q.rightLabel);
      await page.locator(`[data-left="${id}"]`).click();await page.locator(`[data-right="${id}"]`).click();
    }
    await page.locator('#finish-match').click();
  }else{
    for(let i=0;i<total;i++){
      const id=await page.locator('#dialog-body').getAttribute('data-question-id');
      const q=byId.get(id);assert.ok(q,`question ${id} in selected bank`);seen.push(q.sourceId);types.add(q.type);
      if(q.speechPrompt){assert.equal(await page.locator('.question-main').getAttribute('data-pronunciation'),q.speechPrompt);await page.locator('.question-main + .speak-button').waitFor();}
      if(q.kind==='order'){
        if(i===0){await page.locator('#check-order').click();assert.ok(await page.locator('#next-question').isHidden());}
        const indices=q.tokens.map((_,j)=>j);if(wrongFirst&&i===0)indices.reverse();
        for(const index of indices)await page.locator(`[data-token="${index}"]`).click();
        await page.locator('#check-order').click();
      }else{
        assert.equal(await page.locator('.choice').first().getAttribute('lang'),q.answerLang);
        if(q.answerLang==='ja')assert.equal(await page.locator('.choices .speak-button').count(),4,'every Japanese answer has pronunciation');
        if(q.promptLang)assert.equal(await page.locator('.question-main').getAttribute('lang'),q.promptLang);
        const choices=await page.locator('.choice').allTextContents();
        assert.equal(choices.length,4);assert.equal(new Set(choices).size,4);assert.ok(choices.includes(q.answer));
        const chosen=wrongFirst&&i===0?choices.find(v=>v!==q.answer):q.answer;
        await page.getByRole('button',{name:chosen,exact:true}).click();assert.equal(await page.locator('.choice:disabled').count(),4);
      }
      assert.ok((await page.locator('#feedback').textContent()).length>0);await page.locator('#next-question').click();
    }
  }
  const correct=total-(wrongFirst?1:0);
  assert.equal(await page.locator('.result-score').textContent(),`${correct} / ${total}`);
  assert.equal(new Set(seen).size,total,'no repeated source in a round');
  if(config.type==='mixed')assert.ok(types.size>=(config.mode==='song'?4:3),'mixed round covers all available types');
  completed++;expectedXP+=correct*10;return seen;
}
try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.locator('#stage[data-renderer]').waitFor();
  check('home has four games and difficulty selector',await page.locator('.game-card').count()===4&&await page.locator('#level').isVisible());
  check('three.js renderer active',await page.locator('#stage').getAttribute('data-renderer')==='webgl');
  await page.screenshot({path:'test-results/desktop.png',fullPage:true});
  await page.goto(url+'#games');await page.locator('.skip-link').focus();await page.keyboard.press('Enter');
  check('skip link preserves route and focus',page.url().endsWith('#games')&&await page.evaluate(()=>document.activeElement.id==='main'));
  await page.locator('[data-start=kana]').click();await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.activeElement?.dataset.start==='kana');
  check('dialog restores trigger focus',await page.locator('[data-start=kana]').evaluate(e=>e===document.activeElement));
  await page.locator('[data-start=kana]').click();await page.evaluate(()=>{document.querySelector('#game-dialog').close();document.querySelector('[data-start=kana]').click();});
  await page.locator('.choice').first().click();check('rapid reopen remains playable',await page.locator('#next-question').isVisible());await page.locator('#close-dialog').click();
  for(const mode of ['kana','match','order'])for(const level of Object.keys(levels))for(const type of Object.keys(questionTypes[mode])){
    const config={mode,level,type,kanaType:'hira'};
    await page.locator('#level').selectOption(level);await page.locator(`#type-${mode}`).selectOption(type);await page.locator('[data-start='+mode+']').click();
    const seen=await finishRound(page,config,{wrongFirst:type==='mixed'});
    check(`${mode}/${level}/${type}: complete, correct score, unique material`,true);
    if(mode==='kana'&&type==='mixed'&&level==='beginner'){
      check('wrong answers reviewed',await page.locator('.review-item').count()===1);await page.locator('#replay').click();
      const next=await finishRound(page,config);check('replay draws fresh material and preserves settings',next.every(id=>!seen.includes(id)));
    }
    await page.locator('#close-dialog').click();
  }
  await page.locator('#level').selectOption('advanced');await page.locator('#kana-type').selectOption('kata');await page.locator('#type-kana').selectOption('script');
  await page.locator('[data-start=kana]').click();await finishRound(page,{mode:'kana',level:'advanced',type:'script',kanaType:'kata'});
  check('katakana contracted-sound conversion round',true);await page.locator('#close-dialog').click();
  await page.goto(url+'#songs');check('16 songs visible',await page.locator('.song-card').count()===16);
  await page.locator('#song-search').fill('impossible');check('empty search feedback',await page.locator('.empty').isVisible());
  await page.locator('#song-search').fill('Idol');check('romanized search',await page.locator('.song-card').count()===1);await page.locator('#song-search').fill('');
  for(const song of songs)for(const level of Object.keys(levels)){
    await page.locator(`[data-song="${song.id}"]`).click();
    assert.ok((await page.locator('.detail-meta').textContent()).includes(song.story));assert.equal(await page.locator('.source-links a').first().getAttribute('href'),song.source);
    await page.locator('#song-level').selectOption(level);await page.locator('[data-song-start]').click();assert.ok((await page.locator('#dialog-label').textContent()).includes(levels[level]));
    await finishRound(page,{mode:'song',level,type:'mixed',songId:song.id});check(`${song.id}/${level}: six random questions, three types, source retained`,true);await page.locator('#close-dialog').click();
  }
  await page.goto(url+'#progress');await page.reload();
  check('all completed rounds persist',Number(await page.locator('.stat strong').nth(1).textContent())===Math.min(completed,100));
  check('XP correct across every new mode',Number(await page.locator('.stat strong').first().textContent())===expectedXP);
  await page.locator('#reset-progress').click();await page.locator('#cancel-reset').click();check('reset cancel preserves data',Number(await page.locator('.stat strong').first().textContent())===expectedXP);
  await page.locator('#reset-progress').click();await page.locator('#confirm-reset').click();check('confirmed reset clears progress',await page.locator('.empty').isVisible());
  await page.goto(url+'#kana');
  for(const [level,count] of [['beginner',46],['intermediate',25],['advanced',33]]){await page.locator('#level').selectOption(level);check(`${level} reference updates`,await page.locator('.kana-cell').count()===count);}
  for(const width of [390,768,1024]){
    await page.setViewportSize({width,height:844});
    for(const route of ['home','games','songs','progress','kana']){await page.goto(url+'#'+route);check(`${width}px ${route} no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  }
  await page.setViewportSize({width:390,height:844});await page.goto(url+'#games');await page.screenshot({path:'test-results/mobile.png',fullPage:true});
  await page.locator('#level').selectOption('advanced');await page.locator('#type-order').selectOption('cloze');await page.locator('[data-start=order]').click();
  check('mobile long-form questions fit',await page.locator('dialog').evaluate(e=>e.scrollWidth<=e.clientWidth));await page.screenshot({path:'test-results/mobile-game.png',fullPage:true});
  await page.keyboard.press('Escape');check('Escape dismisses dialog',await page.locator('dialog').isHidden());
  const fallback=await browser.newPage({reducedMotion:'reduce'});
  await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl2')return null;return original.call(this,type,...args);};Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}});});
  await fallback.goto(url);await fallback.locator('#stage[data-renderer=fallback]').waitFor();check('no WebGL fallback visible',await fallback.locator('.record-fallback').isVisible());
  await fallback.locator('.hero [data-start=kana]').click();for(let i=0;i<8;i++){await fallback.locator('.choice').first().click();await fallback.locator('#next-question').click();}
  check('denied storage still playable with notice',await fallback.locator('.result-score').isVisible()&&await fallback.locator('#toast').isVisible());check('no uncaught browser errors',errors.length===0);
  await fs.writeFile('test-results/report.json',JSON.stringify({date:new Date().toISOString(),url,checks:results.length,completedRounds:completed,results,errors},null,2));
  console.log(`PASS ${results.length} browser checks, ${completed} complete rounds`);
}finally{await browser.close();server.close();}
