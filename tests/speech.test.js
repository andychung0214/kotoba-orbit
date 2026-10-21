import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpeaker} from '../src/speech.js';

function setup(voices=[{lang:'en-US'},{lang:'ja-JP',name:'Japanese',localService:true}]) {
 const calls=[],notices=[],states=[];
 const synth={getVoices:()=>voices,cancel(){calls.push('cancel');},speak(u){calls.push(u);}};
 class Utterance {constructor(text){this.text=text;}}
 const speaker=createSpeaker({synth,Utterance,notify:m=>notices.push(m),onState:s=>states.push(s)});
 return {speaker,calls,notices,states,synth};
}
test('Japanese voice, rate and text are sent to speech engine',()=>{
 const {speaker,calls}=setup();speaker.play('明日は晴れです。','one');
 const u=calls.at(-1);assert.equal(u.text,'明日は晴れです。');assert.equal(u.lang,'ja-JP');assert.equal(u.voice.name,'Japanese');assert.equal(u.rate,.85);speaker.stop();
});
test('toggle stops; switching cancels; stale completion cannot reset new playback',()=>{
 const {speaker,calls,states}=setup();speaker.play('あ','a');const first=calls.at(-1);
 speaker.play('い','b');first.onend();assert.equal(states.at(-1),'b');
 speaker.play('い','b');assert.equal(states.at(-1),null);assert.equal(calls.at(-1),'cancel');
});
test('unsupported and missing Japanese voice report useful messages',()=>{
 const notices=[];createSpeaker({notify:m=>notices.push(m)}).play('あ','a');assert.match(notices[0],/不支援/);
 const f=setup([{lang:'en-US'}]);f.speaker.play('あ','a');assert.match(f.notices[0],/日語/);assert.equal(f.calls.filter(x=>typeof x==='object').length,0);
});
test('voices are refreshed at every click and errors reset state',()=>{
 const f=setup([]);f.speaker.play('あ','a');assert.equal(f.notices.length,1);
 f.synth.getVoices=()=>[{lang:'ja_JP'}];f.speaker.play('あ','a');const u=f.calls.at(-1);u.onerror({error:'network'});assert.equal(f.states.at(-1),null);assert.match(f.notices.at(-1),/播放失敗/);
});
test('cancelled utterance errors are ignored and blank text never plays',()=>{
 const f=setup();f.speaker.play('あ','a');const u=f.calls.at(-1);f.speaker.stop();u.onerror({error:'interrupted'});assert.equal(f.notices.length,0);
 const n=f.calls.length;f.speaker.play('  ','a');assert.equal(f.calls.length,n);
});
