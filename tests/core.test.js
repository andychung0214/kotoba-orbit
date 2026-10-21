import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffle, makeQuiz, gradeOrder, readProgress, recordRound } from '../src/core.js';
import { kana, words, sentences, songs } from '../src/content.js';

test('shuffle preserves source and values', () => {
  const source = [1,2,3,4];
  const result = shuffle(source, () => .25);
  assert.deepEqual(source, [1,2,3,4]);
  assert.deepEqual([...result].sort(), source);
});
test('quiz contains unique questions and exactly one correct option', () => {
  const quiz = makeQuiz(kana.map(k => ({id:k.hira, prompt:k.hira, answer:k.roman, explanation:k.kata})), 8);
  assert.equal(quiz.length, 8);
  assert.equal(new Set(quiz.map(q => q.id)).size, 8);
  for (const q of quiz) { assert.equal(q.options.length,4); assert.equal(q.options.filter(o => o === q.answer).length,1); }
});
test('small quiz never invents answers', () => {
  assert.deepEqual(makeQuiz([], 8), []);
  assert.deepEqual(makeQuiz([{id:'a', answer:'a'}], 8)[0].options, ['a']);
});
test('sentence order is exact and handles missing tokens', () => {
  assert.equal(gradeOrder(['私は','本を','読みます。'], ['私は','本を','読みます。']),true);
  assert.equal(gradeOrder(['本を','私は','読みます。'], ['私は','本を','読みます。']),false);
  assert.equal(gradeOrder([], ['私は']),false);
});
test('sentence order accepts explicitly reviewed natural variants', () => {
  assert.equal(gradeOrder(['毎日','私は','お茶を','飲みます。'], ['私は','毎日','お茶を','飲みます。'], [['毎日','私は','お茶を','飲みます。']]),true);
  assert.equal(gradeOrder(['飲みます。','私は','毎日','お茶を'], ['私は','毎日','お茶を','飲みます。'], [['毎日','私は','お茶を','飲みます。']]),false);
});
test('corrupt and denied storage returns safe progress', () => {
  for (const storage of [{getItem:()=>'{oops'},{getItem:()=>'{"xp":-1,"rounds":"oops"}'},{getItem:()=>{throw Error('denied');}}]) {
    const p = readProgress(storage); assert.equal(p.xp,0); assert.deepEqual(p.rounds,[]);
  }
});
test('round scoring clamps values and preserves previous progress', () => {
  const p = {xp:0, rounds:[]};
  const next = recordRound(p,{mode:'kana',correct:5,total:8,date:'2026-10-21'});
  assert.equal(next.xp,50); assert.equal(next.rounds.length,1); assert.equal(p.rounds.length,0);
  assert.equal(recordRound(p,{mode:'kana',correct:99,total:8}).xp,80);
  assert.equal(recordRound(p,{mode:'kana',correct:-3,total:8}).xp,0);
});
test('content includes 46 kana, 16 unique songs and all difficulty levels', () => {
  assert.equal(kana.filter(k=>k.level==='beginner').length,46); assert.equal(new Set(kana.map(k=>k.hira)).size,kana.length);
  assert.equal(songs.length,16); assert.equal(new Set(songs.map(s=>s.id)).size,16);
  for (const level of ['beginner','intermediate','advanced']) {
    assert.ok(words.filter(w=>w.level===level).length>=6);
    assert.ok(sentences.filter(s=>s.level===level).length>=4);
  }
  for (const s of songs) {
    assert.ok(s.practice.length>=3); assert.ok(s.source.startsWith('https://'));
    for (const q of s.practice) { assert.ok(q.answer); assert.ok(q.explanation); }
  }
});
