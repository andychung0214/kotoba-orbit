import {kana,words,sentences,songs} from './content.js';
import {songLessons} from './song-lessons.js';

export const questionTypes={
 kana:{mixed:'混合題型',reading:'假名 → 讀音',reverse:'讀音 → 假名',script:'平片假名互換'},
 match:{mixed:'混合配對',meaning:'漢字 → 中文',reading:'漢字 → 讀音',reverse:'讀音 → 中文'},
 order:{mixed:'混合題型',order:'句子重組',meaning:'句意辨識',cloze:'中文提示填空'},
 song:{mixed:'詞彙・句意・填空・原作'}
};
export const typeLabels={reading:'讀音辨識',reverse:'讀音選字',script:'字形互換',meaning:'意思辨識',order:'句子重組',cloze:'中文提示填空',vocabulary:'主題詞彙',comprehension:'原創例句理解',story:'原作背景辨識'};
function choice(data,alternatives){
 const distractors=[...new Set(alternatives)].filter(answer=>answer!==data.answer).slice(0,3);
 return {answerLang:'ja',...data,kind:'choice',options:[data.answer,...distractors],optionPool:[...new Set(alternatives)].filter(answer=>answer!==data.answer)};
}
function clozeParts(sentence){
 const cut=sentence.tokens.length>2&&sentence.tokens.at(-1).length<=7?sentence.tokens.length-2:sentence.tokens.length-1;
 return {stem:sentence.tokens.slice(0,cut).join(''),answer:sentence.tokens.slice(cut).join('')};
}
function sentenceQuestions(items,level,prefix=''){
 const meanings=items.map(s=>s.meaning);
 return items.flatMap(s=>{
  const sourceId=prefix+s.id;
  const common={level,sourceId,explanation:s.explanation,speechAnswer:s.tokens.join('')};
  const blank=clozeParts(s);
  return [
   {...s,...common,id:sourceId+'-order',type:'order',kind:'order',prompt:s.meaning},
   choice({...common,id:sourceId+'-meaning',type:'meaning',speechPrompt:s.tokens.join(''),prompt:`「${s.tokens.join('')}」是什麼意思？`,answer:s.meaning,answerLang:'zh-Hant'},meanings),
   choice({...common,id:sourceId+'-cloze',type:'cloze',speechPrompt:blank.stem,prompt:`依中文填空：${s.meaning}\n${blank.stem}（　）`,answer:blank.answer},items.map(item=>clozeParts(item).answer))
  ];
 });
}
export function buildBank({mode,level='beginner',type='mixed',kanaType='hira',songId}){
 let bank=[];
 if(mode==='kana'){
  const items=kana.filter(k=>k.level===level),other=kanaType==='hira'?'kata':'hira';
  bank=items.flatMap(k=>{
   const sourceId='kana-'+k.hira;
   const common={sourceId,level,speechAnswer:k.hira,explanation:`${k.hira}／${k.kata}：${k.roman}。${['じ','ぢ','ず','づ'].includes(k.hira)?'じ與ぢ通常同音，ず與づ通常同音；逆向題另標行別以區分字形。':k.hira==='を'?'を作助詞時通常讀 o。':''}`};
   return [
    choice({...common,id:sourceId+'-reading-'+kanaType,type:'reading',speechPrompt:k[kanaType],prompt:k[kanaType],promptLang:'ja',answer:k.roman,answerLang:'en'},items.map(x=>x.roman)),
    choice({...common,id:sourceId+'-reverse-'+kanaType,type:'reverse',prompt:`讀音 ${k.roman}${['ji','zu'].includes(k.roman)&&level==='intermediate'?`（${k.group}）`:''} 的${kanaType==='hira'?'平':'片'}假名是？`,answer:k[kanaType]},items.map(x=>x[kanaType])),
    choice({...common,id:sourceId+'-script-'+kanaType,type:'script',speechPrompt:k[kanaType],prompt:`「${k[kanaType]}」對應的${other==='hira'?'平':'片'}假名是？`,answer:k[other]},items.map(x=>x[other]))
   ];
  });
 }else if(mode==='match'){
  bank=words.filter(w=>w.level===level).flatMap(w=>{
   const common={...w,sourceId:w.id,level,kind:'match',explanation:`${w.word}（${w.reading}）：${w.meaning}。`};
   return [
    {...common,id:w.id+'-meaning',type:'meaning',leftLabel:w.word,leftHint:'配中文',rightLabel:w.meaning},
    {...common,id:w.id+'-reading',type:'reading',leftLabel:w.word,leftHint:'配讀音',rightLabel:w.reading},
    {...common,id:w.id+'-reverse',type:'reverse',leftLabel:w.reading,leftHint:'配中文',rightLabel:w.meaning}
   ];
  });
 }else if(mode==='order')bank=sentenceQuestions(sentences.filter(s=>s.level===level),level);
 else if(mode==='song'){
  const lesson=songLessons[songId]?.[level];if(!lesson)return [];
  const allLessons=Object.values(songLessons).map(l=>l[level]);
  const allWords=allLessons.flatMap(l=>l.words),allSentences=allLessons.flatMap(l=>l.sentences);
  bank=lesson.words.flatMap(w=>{
   const common={sourceId:w.id,level,type:'vocabulary',speechPrompt:w.reading,speechAnswer:w.reading,explanation:`主題延伸單字：${w.word}（${w.reading}）＝${w.meaning}。不是歌詞摘錄。`};
   return [
    choice({...common,id:w.id+'-reading',prompt:`「${w.word}」怎麼讀？`,answer:w.reading},allWords.map(x=>x.reading)),
    choice({...common,id:w.id+'-meaning',prompt:`「${w.word}」的意思是？`,answer:w.meaning,answerLang:'zh-Hant'},allWords.map(x=>x.meaning))
   ];
  });
  for(const s of lesson.sentences){
   const common={level,sourceId:s.id,speechAnswer:s.tokens.join(''),explanation:`原創例句：${s.tokens.join('')} → ${s.meaning} ${s.explanation}`};
   bank.push(
    choice({...common,id:s.id+'-meaning',type:'comprehension',speechPrompt:s.tokens.join(''),prompt:`「${s.tokens.join('')}」是什麼意思？`,answer:s.meaning,answerLang:'zh-Hant'},allSentences.map(x=>x.meaning)),
    choice({...common,id:s.id+'-cloze',type:'cloze',speechPrompt:s.tokens[0],prompt:`依中文填空：${s.meaning}\n${s.tokens[0]}（　）`,answer:s.tokens[1]},allSentences.map(item=>item.tokens[1]))
   );
  }
  const song=songs.find(s=>s.id===songId);
  const context={level,type:'story',speechPrompt:song.title,explanation:`〈${song.title}〉原作：${song.story}；作者：${song.author}。來源連結位於讀本。`};
  bank.push(
   choice({...context,id:`${songId}-${level}-story`,sourceId:`${songId}-story`,prompt:`〈${song.title}〉對應的原作是？`,answer:song.story},songs.map(s=>s.story)),
   choice({...context,id:`${songId}-${level}-author`,sourceId:`${songId}-author`,prompt:`〈${song.title}〉的原作作者是？`,answer:song.author},songs.map(s=>s.author))
  );
 }
 return type==='mixed'?bank:bank.filter(q=>q.type===type);
}
