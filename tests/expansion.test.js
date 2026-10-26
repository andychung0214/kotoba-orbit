import test from 'node:test';
import assert from 'node:assert/strict';
import {kana,words,sentences,songs,levels} from '../src/content.js';
import {buildBank, questionTypes} from '../src/question-bank.js';
import {sampleRound,gradeOrder} from '../src/core.js';
const random = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

test('expanded learning material covers every level',()=>{
  for(const level of Object.keys(levels)){
    assert.ok(kana.filter(k=>k.level===level).length>=25);
    assert.ok(words.filter(w=>w.level===level).length>=24);
    assert.equal(sentences.filter(s=>s.level===level).length,24);
  }
});
for(const mode of ['kana','match','order','song']) for(const level of Object.keys(levels)){
  test(`${mode}/${level}: varied bank, unique answers, deterministic sampling`,()=>{
    const bank=buildBank({mode,level,kanaType:'hira',songId:'yoru'});
    assert.equal(new Set(bank.map(q=>q.type)).size,mode==='song'?7:5);
    assert.equal(new Set(bank.map(q=>q.id)).size,bank.length);
    for(const q of bank){
      assert.equal(q.level,level);assert.ok(q.explanation);
      if(q.kind==='choice'){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.answer));}
    }
    const snapshot=JSON.stringify(bank);
    const first=sampleRound(bank,mode==='match'?5:6,[],random(42));
    const same=sampleRound(bank,mode==='match'?5:6,[],random(42));
    assert.deepEqual(first,same);
    assert.equal(new Set(first.map(q=>q.sourceId)).size,first.length);
    assert.ok(new Set(first.map(q=>q.type)).size>=3);
    const next=sampleRound(bank,first.length,first.map(q=>q.sourceId),random(12));
    assert.notDeepEqual(next.map(q=>q.id),first.map(q=>q.id));
    const available=new Set(bank.map(q=>q.sourceId)).size-first.length;
    assert.ok(next.filter(q=>!first.some(p=>p.sourceId===q.sourceId)).length>=Math.min(available,first.length));
    assert.equal(JSON.stringify(bank),snapshot);
    if(mode==='match')assert.equal(new Set(first.map(q=>q.rightLabel)).size,first.length);
    for(const type of Object.keys(questionTypes[mode]).filter(t=>t!=='mixed')){
      const chosen=sampleRound(buildBank({mode,level,type,kanaType:'kata',songId:'yoru'}),6,[],random(3));
      assert.ok(chosen.length>0);assert.ok(chosen.every(q=>q.type===type));
    }
  });
}
test('all sixteen songs have substantial distinct three-level banks',()=>{
  for(const song of songs)for(const level of Object.keys(levels)){
    const bank=buildBank({mode:'song',level,songId:song.id});
    assert.equal(bank.length,28,`${song.id}/${level}`);
    assert.equal(bank.filter(q=>q.type==='story').length,2,'original story learning is retained');
    assert.ok(new Set(bank.map(q=>q.sourceId)).size>=6);
    for(const q of bank){assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.answer));}
  }
});

test('new question directions expose only visible Japanese for pronunciation',()=>{
 for(const level of Object.keys(levels)){
  for(const mode of ['order','song']){
   const bank=buildBank({mode,level,songId:'yoru'});
   const translated=bank.filter(q=>q.type==='translation');assert.ok(translated.length);
   for(const q of translated){assert.equal(q.answerLang,'ja');assert.ok(!q.speechPrompt);assert.ok(q.speechAnswer);}
   const blanks=bank.filter(q=>q.type==='headcloze');assert.ok(blanks.length);
   for(const q of blanks){assert.ok(q.prompt.includes(q.speechPrompt));assert.equal(q.speechAnswer,q.answer+q.speechPrompt);}
  }
  const pairs=buildBank({mode:'match',level,type:'fromMeaning'});assert.equal(pairs.length,24);
  for(const q of pairs){assert.equal(q.leftLang,'zh-Hant');assert.equal(q.rightLang,'ja');assert.equal(q.rightSpeech,q.reading);}
  assert.equal(buildBank({mode:'kana',level,type:'sequence'}).length,kana.filter(k=>k.level===level).length);
 }
});
test('empty, exhausted and tiny pools terminate without duplicate material',()=>{
  assert.deepEqual(sampleRound([],8),[]);
  const bank=[{id:'a1',sourceId:'a',type:'one'},{id:'a2',sourceId:'a',type:'two'}];
  assert.equal(sampleRound(bank,8,['a'],random(1)).length,1);
});

test('mixed matching rejects duplicate prompts as well as duplicate answers',()=>{
 const bank=[
  {sourceId:'a',type:'a',leftLabel:'こうえん',rightLabel:'公園'},
  {sourceId:'b',type:'b',leftLabel:'こうえん',rightLabel:'講演'},
  {sourceId:'c',type:'c',leftLabel:'公園',rightLabel:'こうえん'}
 ];
 const round=sampleRound(bank,3,[],random(2));
 assert.equal(round.length,2);assert.equal(new Set(round.map(q=>q.leftLabel)).size,round.length);
});
test('new sentence reordering accepts natural subject/location and object/time orders',()=>{
  for(const [meaning,answer] of [
    ['桌上有一本書。',['本が','机の上に','あります。']],
    ['房間裡有一隻狗。',['犬が','部屋に','います。']],
    ['出門前先確認天氣。',['天気を','出かける前に','確認します。']]
  ]){const q=sentences.find(s=>s.meaning===meaning);assert.ok(gradeOrder(answer,q.tokens,q.alternatives));}
});
test('cloze questions hide a meaningful phrase rather than an isolated inflection',()=>{
  const bank=buildBank({mode:'order',level:'advanced',type:'cloze'});
  const q=bank.find(q=>q.prompt.includes('不實際試試看，就無從得知'));
  assert.equal(q.answer,'分かりません。');
});
