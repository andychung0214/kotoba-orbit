import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from '../scripts/serve.js';
import {kana,songs,sentences} from '../src/content.js';

const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=process.env.TEST_URL||`http://127.0.0.1:${server.address().port}`;
await fs.mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];
function check(name,value){assert.ok(value,name);results.push(name);console.log(`PASS ${name}`);}
try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await page.locator('#stage[data-renderer]').waitFor();
  check('home has four games',await page.locator('.game-card').count()===4);
  check('three.js renderer active',await page.locator('#stage').getAttribute('data-renderer')==='webgl');
  await page.screenshot({path:'test-results/desktop.png',fullPage:true});
  await page.locator('.hero [data-start=kana]').click();
  for(let i=0;i<8;i++){
    const prompt=await page.locator('.question-main').textContent();
    const correct=kana.find(k=>k.hira===prompt).roman;
    const choice=i===0?page.locator('.choice').filter({hasNotText:new RegExp(`^${correct}$`)}).first():page.getByRole('button',{name:correct,exact:true});
    await choice.click();
    check(`kana question ${i+1} feedback`,await page.locator('#feedback').textContent()!=='');
    check(`kana question ${i+1} locks input`,await page.locator('.choice:disabled').count()===4);
    await page.locator('#next-question').click();
  }
  check('kana round scored once',await page.locator('.result-score').textContent()==='7 / 8');
  check('wrong answers reviewed',await page.locator('.review-item').count()===1);
  await page.locator('#replay').click();check('replay resets round',await page.locator('.session-footer').textContent().then(t=>t.includes('1 / 8')));
  await page.keyboard.press('Escape');
  await page.goto(url+'#games');
  await page.locator('.skip-link').focus();await page.keyboard.press('Enter');
  check('skip link preserves route',page.url().endsWith('#games'));
  check('skip link focuses main',await page.evaluate(()=>document.activeElement.id==='main'));
  await page.locator('[data-start=kana]').click();await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.activeElement?.dataset.start==='kana');
  check('dialog restores trigger focus',await page.locator('[data-start=kana]').evaluate(e=>e===document.activeElement));
  await page.locator('[data-start=kana]').click();
  await page.evaluate(()=>{document.querySelector('#game-dialog').close();document.querySelector('[data-start=kana]').click();});
  await page.locator('.choice').first().click();check('rapid reopen remains playable',await page.locator('#next-question').isVisible());await page.locator('#close-dialog').click();
  await page.locator('#kana-type').selectOption('kata');await page.locator('[data-start=kana]').click();
  check('katakana mode uses katakana',kana.some(k=>k.kata===undefined)===false&&kana.map(k=>k.kata).includes(await page.locator('.question-main').textContent()));
  await page.locator('#close-dialog').click();
  await page.locator('[data-start=match]').click();
  const ids=await page.locator('[data-left]').evaluateAll(es=>es.map(e=>e.dataset.left));
  await page.locator(`[data-left="${ids[0]}"]`).click();await page.locator(`[data-right="${ids[1]}"]`).click();
  check('wrong match gives retry feedback',(await page.locator('#feedback').textContent()).includes('還沒有'));
  for(const id of ids){await page.locator(`[data-left="${id}"]`).click();await page.locator(`[data-right="${id}"]`).click();}
  await page.locator('#finish-match').click();check('match counts only first attempts',await page.locator('.result-score').textContent()==='4 / 5');
  await page.locator('#close-dialog').click();
  for(const level of ['beginner','intermediate','advanced']){
    await page.locator('#level').selectOption(level);await page.locator('[data-start=order]').click();
    await page.locator('#check-order').click();check(`${level} incomplete sentence blocked`,await page.locator('#next-question').isHidden());
    for(let i=0;i<4;i++){
      const meaning=await page.locator('.question-main').textContent();const q=sentences.find(s=>s.meaning===meaning);
      check(`${level} sentence from selected pool`,q.level===level);
      for(let j=0;j<q.tokens.length;j++)await page.locator(`[data-token="${j}"]`).click();
      if(i===0){await page.locator('[data-unselect="0"]').click();await page.locator('[data-token="0"]').click();}
      await page.locator('#check-order').click();await page.locator('#next-question').click();
    }
    check(`${level} sentence result`,await page.locator('.result-score').textContent()==='3 / 4');
    await page.locator('#close-dialog').click();
  }
  await page.goto(url+'#songs');check('16 songs visible',await page.locator('.song-card').count()===16);
  await page.locator('#song-search').fill('impossible');check('empty search feedback',await page.locator('.empty').isVisible());
  await page.locator('#song-search').fill('Idol');check('romanized search',await page.locator('.song-card').count()===1);await page.locator('#song-search').fill('');
  for(const song of songs){
    await page.locator(`[data-song="${song.id}"]`).click();
    check(`${song.id} story and source`,(await page.locator('.detail-meta').textContent()).includes(song.story)&&await page.locator('.source-links a').first().getAttribute('href')===song.source);
    await page.locator('[data-song-start]').click();
    for(const q of song.practice){await page.getByRole('button',{name:q.answer,exact:true}).click();await page.locator('#next-question').click();}
    check(`${song.id} full song challenge`,await page.locator('.result-score').textContent()==='3 / 3');await page.locator('#close-dialog').click();
  }
  await page.goto(url+'#progress');await page.reload();check('progress persisted after reload',(await page.locator('.stat strong').nth(1).textContent())==='21');
  await page.locator('#reset-progress').click();await page.locator('#cancel-reset').click();check('reset cancel preserves data',(await page.locator('.stat strong').nth(1).textContent())==='21');
  await page.locator('#reset-progress').click();await page.locator('#confirm-reset').click();check('confirmed reset clears progress',await page.locator('.empty').isVisible());
  await page.goto(url+'#kana');check('46 kana reference cards',await page.locator('.kana-cell').count()===46);
  for(const width of [390,768,1024]){
    await page.setViewportSize({width,height:844});
    for(const route of ['home','games','songs','progress','kana']){
      await page.goto(url+'#'+route);check(`${width}px ${route} no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
  }
  await page.setViewportSize({width:390,height:844});await page.goto(url+'#home');await page.screenshot({path:'test-results/mobile.png',fullPage:true});
  await page.locator('.hero [data-start=kana]').click();check('mobile dialog fits viewport',await page.locator('dialog').evaluate(e=>e.getBoundingClientRect().width<=innerWidth));
  await page.screenshot({path:'test-results/mobile-game.png',fullPage:true});await page.keyboard.press('Escape');check('Escape dismisses dialog',await page.locator('dialog').isHidden());
  const fallback=await browser.newPage({reducedMotion:'reduce'});
  await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl2')return null;return original.call(this,type,...args);};Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}});});
  await fallback.goto(url);await fallback.locator('#stage[data-renderer=fallback]').waitFor();check('no WebGL fallback visible',await fallback.locator('.record-fallback').isVisible());
  await fallback.locator('.hero [data-start=kana]').click();for(let i=0;i<8;i++){await fallback.locator('.choice').first().click();await fallback.locator('#next-question').click();}check('denied storage still playable',await fallback.locator('.result-score').isVisible());check('denied storage shows notice',await fallback.locator('#toast').isVisible());
  check('no uncaught browser errors',errors.length===0);
  await fs.writeFile('test-results/report.json',JSON.stringify({date:new Date().toISOString(),url,checks:results.length,results,errors},null,2));
  console.log(`PASS ${results.length} browser checks`);
}finally{await browser.close();server.close();}
