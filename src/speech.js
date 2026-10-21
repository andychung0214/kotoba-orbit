export function createSpeaker({synth,Utterance,notify=()=>{},onState=()=>{}}={}) {
 let active=null,current=null,timer;
 function stop(){active=null;current=null;clearTimeout(timer);try{synth?.cancel();}catch{}onState(null);}
 function play(text,key){
  if(!text?.trim())return;
  if(active===key){stop();return;}
  stop();
  if(!synth||!Utterance){notify('此瀏覽器不支援語音朗讀，請使用支援語音的瀏覽器。');return;}
  try{
   const voices=synth.getVoices().filter(v=>/^ja(?:[-_]|$)/i.test(v.lang));
   const voice=voices.find(v=>v.localService)||voices[0];
   if(!voice){notify('尚未找到日語語音。請稍後再試，或在裝置的語音設定安裝日語語音。');return;}
   const utterance=new Utterance(text.trim());
   utterance.lang='ja-JP';utterance.voice=voice;utterance.rate=.85;utterance.pitch=1;utterance.volume=1;
   active=key;current=utterance;onState(key);
   const done=()=>{if(current!==utterance)return false;active=null;current=null;clearTimeout(timer);onState(null);return true;};
   utterance.onend=done;
   utterance.onerror=e=>{if(done()&&!['canceled','interrupted'].includes(e.error))notify('日語播放失敗，請確認裝置語音與網路設定後再試。');};
   timer=setTimeout(()=>{if(current===utterance){stop();notify('語音播放逾時，請重試或檢查裝置的日語語音設定。');}},60000);
   synth.speak(utterance);
  }catch{stop();notify('日語播放失敗，請確認裝置語音設定後再試。');}
 }
 return {play,stop};
}

export function mountPronunciation({roots,notify}){
 let sequence=0,playingKey=null;
 const speaker=createSpeaker({synth:window.speechSynthesis,Utterance:window.SpeechSynthesisUtterance,notify,onState:key=>{
  playingKey=key;
  document.querySelectorAll('.speak-button').forEach(b=>{const playing=b.dataset.speechKey===key;b.setAttribute('aria-pressed',String(playing));const label=playing?'■ 停止':'▶ 發音';if(b.textContent!==label)b.textContent=label;b.setAttribute('aria-label',`${playing?'停止':'播放日語發音'}：${b.dataset.label}`);});
 }});
 const selector='.kana-cell strong[lang="ja"],.kana-cell > span[lang="ja"],.song-detail [lang="ja"],.choice[lang="ja"],.token[lang="ja"],.match-button [lang="ja"],.match-button[lang="ja"],[data-pronunciation]';
 function enhance(){
  for(const root of roots)for(const element of root.querySelectorAll(selector)){
   if(element.dataset.speechReady)continue;
   element.dataset.speechReady='true';
   const text=element.dataset.pronunciation||element.textContent.trim();if(!text)continue;
   const button=document.createElement('button');button.type='button';button.className='speak-button';button.textContent='▶ 發音';
   button.dataset.label=text;button.dataset.speechKey=String(++sequence);button.setAttribute('aria-label',`播放日語發音：${text}`);button.setAttribute('aria-pressed','false');
   const parentButton=element.closest('button');
   if(parentButton){
    const row=document.createElement('div');row.className='pronunciation-option';parentButton.before(row);row.append(parentButton,button);
   }else element.after(button);
   button.addEventListener('click',event=>{event.stopPropagation();speaker.play(text,button.dataset.speechKey);});
  }
 }
 const observer=new MutationObserver(()=>{
  // A removed playback control means its question or page has been replaced.
  if(playingKey&&!document.querySelector('.speak-button[aria-pressed="true"]'))speaker.stop();
  enhance();
 });
 for(const root of roots)observer.observe(root,{childList:true,subtree:true});
 enhance();
 document.addEventListener('visibilitychange',()=>{if(document.hidden)speaker.stop();});
 window.addEventListener('pagehide',speaker.stop);
 return speaker;
}
