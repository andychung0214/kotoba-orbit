import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBank} from '../src/question-bank.js';
import {sampleRound} from '../src/core.js';
import {kanaWords,grammarMaterial,repairForms} from '../src/new-material.js';
const additions={kana:['mora','spelling'],match:['antonym','collocation'],order:['intent','repair'],song:['inference','response']};
for(const [mode,types] of Object.entries(additions))for(const level of ['beginner','intermediate','advanced'])test(`${mode}/${level}: genuinely new types, Japanese speech and complete rounds`,()=>{
 for(const type of types){
  const bank=buildBank({mode,level,type,songId:'yoru'});
  assert.ok(bank.length>=(mode==='song'?4:8));
  assert.ok(bank.every(q=>q.type===type&&q.level===level&&q.explanation));
  const round=sampleRound(bank,mode==='match'?5:mode==='kana'?8:6);
  assert.equal(round.length,Math.min(bank.length,mode==='match'?5:mode==='kana'?8:6));
  assert.equal(new Set(round.map(q=>q.sourceId)).size,round.length);
  for(const q of bank){
   if(q.kind==='choice'){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.answer));}
   if(q.kind==='match'){assert.equal(q.leftLang,'ja');assert.equal(q.rightLang,'ja');assert.ok(q.leftSpeech&&q.rightSpeech);}
   if(type==='mora')assert.ok(q.speechPrompt);
   if(type==='spelling'){assert.equal(q.answer+q.speechPrompt,q.speechAnswer);assert.notEqual(q.speechPrompt,q.speechAnswer,'do not speak complete hidden answer');}
   if(type==='repair')assert.ok(q.prompt.includes('錯句'));
   if(mode==='song')assert.ok(q.prompt.includes('共同閱讀'));
  }
 }
});

test('grammar distractors change only the tested fragment; collocations do not repeat the noun',()=>{
 for(const level of ['beginner','intermediate','advanced']){
  const bank=buildBank({mode:'order',level,type:'repair'});
  for(const [i,q] of bank.entries()){
   const [sentence,,,error]=grammarMaterial[level][i],forms=repairForms[level][i];
   assert.equal(error.replace(forms[0],forms[1]),sentence);
   assert.ok(q.options.every(option=>forms.some(form=>error.replace(forms[0],form)===option)));
  }
  for(const q of buildBank({mode:'match',level,type:'collocation'}))assert.ok(!q.rightLabel.includes(q.leftLabel));
  for(const [word,,count] of kanaWords[level])assert.equal(word.match(/.[ゃゅょぁぃぅぇぉ]?/gu).length,count);
 }
});
