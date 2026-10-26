import {kanaWords,pairMaterial,grammarMaterial,readingMaterial,repairForms,collocationHints} from './new-material.js';

const morae=text=>text.match(/.[ゃゅょぁぃぅぇぉ]?/gu)||[];
const katakana=text=>text.replace(/[ぁ-ゖ]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60));
export function newQuestions({mode,level,kanaType,songIndex=0},choice){
 const base={level};
 if(mode==='kana'){
  const items=kanaWords[level];if(!items)return [];
  const script=text=>kanaType==='kata'?katakana(text):text;
  return items.flatMap(([text,meaning,count],i)=>{
   const parts=morae(text),visible=script(parts.slice(1).join(''));
   const common={...base,sourceId:`mora-${level}-${i}`,speechAnswer:script(text),explanation:`${text}（${meaning}）は ${parts.join('・')}：${count} 拍。小ゃゅょ與前字合一拍；ん、っ與長音各一拍。`};
   return [
    choice({...common,id:common.sourceId+'-mora-'+kanaType,type:'mora',prompt:`「${script(text)}」有幾拍？（日語 mora）`,speechPrompt:script(text),answer:`${count} 拍`,answerLang:'zh-Hant'},[1,2,3,4,5,6,7,8].map(n=>`${n} 拍`)),
    choice({...common,id:common.sourceId+'-spelling-'+kanaType,type:'spelling',prompt:`補上單字缺少的第一拍：${meaning}\n（　）${visible}`,speechPrompt:visible,answer:script(parts[0])},items.map(([word])=>script(morae(word)[0])))
   ];
  });
 }
 if(mode==='match')return Object.entries(pairMaterial[level]||{}).flatMap(([type,items])=>items.map(([left,leftSpeech,right,rightSpeech],i)=>({
  ...base,id:`pair-${level}-${type}-${i}`,sourceId:`pair-${level}-${type}-${i}`,type,kind:'match',word:left,reading:leftSpeech,meaning:right,
  leftLabel:left,leftHint:type==='antonym'?'配反義／對應詞':collocationHints[level][i],rightLabel:type==='collocation'?right.slice(left.length):right,leftLang:'ja',rightLang:'ja',leftSpeech,rightSpeech:type==='collocation'?rightSpeech.slice(leftSpeech.length):rightSpeech,
  explanation:type==='antonym'?`${left} ↔ ${right}：對立或相對概念。`:`自然搭配：${right}。`
 })));
 if(mode==='order'){
  const items=grammarMaterial[level];if(!items)return [];
  return items.flatMap(([sentence,meaning,intent,error,explanation],i)=>{
   const common={...base,sourceId:`grammar-${level}-${i}`,speechAnswer:sentence,explanation};
   const forms=repairForms[level][i],corrections=forms.map(form=>error.replace(forms[0],form));
   return [
    choice({...common,id:common.sourceId+'-intent',type:'intent',prompt:`這句話主要在做什麼？\n${sentence}`,speechPrompt:sentence,answer:intent,answerLang:'zh-Hant'},['陳述資訊','提出請求','詢問資訊','表達邀請']),
    choice({...common,id:common.sourceId+'-repair',type:'repair',prompt:`依指定中文修正錯句：${meaning}\n錯句：${error}`,speechPrompt:error,answer:sentence},corrections)
   ];
  });
 }
 if(mode==='song'){
  const items=readingMaterial[level];if(!items)return [];
  // 每首輪替四段；保留共用來源 ID，避免把共同教材宣稱成不同故事。
  return Array.from({length:4},(_,i)=>(songIndex+i)%items.length).flatMap(index=>{
   const [passage,question,answer,context,response]=items[index];
   const common={...base,sourceId:`reading-${level}-${index}`,explanation:`共同閱讀原創場景，非歌詞或原作情節。${question}答案：${answer}。`};
   return [
    choice({...common,id:common.sourceId+'-inference',type:'inference',prompt:`共同閱讀：依短文回答\n${passage}\n${question}`,speechPrompt:passage,speechAnswer:passage,answer,answerLang:'zh-Hant'},items.map(item=>item[2])),
    choice({...common,id:common.sourceId+'-response',type:'response',prompt:`共同閱讀：依情境選擇接話\n${passage}\n${context}`,speechPrompt:passage,speechAnswer:response,answer:response},items.map(item=>item[4]))
   ];
  });
 }
 return [];
}
