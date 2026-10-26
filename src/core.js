export const STORAGE_KEY = 'kotoba-orbit-v1';
export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function makeQuiz(items, limit = 8) {
  return shuffle(items).slice(0, limit).map(item => ({
    ...item,
    options: shuffle([item.answer, ...shuffle([...new Set(items.map(i => i.answer))].filter(a => a !== item.answer)).slice(0, 3)])
  }));
}
// 題型輪替、同局素材不重複、先避開上一局；亂數可注入供確定性測試。
export function sampleRound(pool, count, previous = [], random = Math.random) {
  const previousSet=new Set(previous),used=new Set(),usedLabels=new Set(),usedLeftLabels=new Set(),result=[];
  const types=shuffle([...new Set(pool.map(q=>q.type))],random);
  const candidates=shuffle(pool,random);
  const available=q=>!used.has(q.sourceId)&&(!q.rightLabel||!usedLabels.has(q.rightLabel))&&(!q.leftLabel||!usedLeftLabels.has(q.leftLabel));
  for(const allowPrevious of [false,true]){
    while(result.length<count){
      let added=false;
      for(const type of types){
        if(result.length>=count)break;
        const q=candidates.find(q=>q.type===type&&available(q)&&(allowPrevious||!previousSet.has(q.sourceId)));
        if(q){result.push(q);used.add(q.sourceId);if(q.rightLabel)usedLabels.add(q.rightLabel);if(q.leftLabel)usedLeftLabels.add(q.leftLabel);added=true;}
      }
      if(!added)break;
    }
  }
  return shuffle(result,random).map(q=>({...q,...(q.options?{options:shuffle(q.optionPool?[q.answer,...shuffle(q.optionPool,random).slice(0,3)]:q.options,random)}:{})}));
}
export function gradeOrder(selected, expected, alternatives = []) {
  return [expected, ...alternatives].some(order => selected.length === order.length && selected.every((part, i) => part === order[i]));
}
export function readProgress(storage) {
  try {
    const p = JSON.parse(storage.getItem(STORAGE_KEY));
    if (p && Number.isFinite(p.xp) && p.xp >= 0 && Array.isArray(p.rounds)) {
      return {xp: Math.floor(p.xp), rounds: p.rounds.filter(r => r && typeof r.mode === 'string' && Number.isFinite(r.correct) && Number.isFinite(r.total) && r.total > 0 && r.correct >= 0 && r.correct <= r.total && typeof r.date === 'string').slice(-100)};
    }
  } catch { /* 儲存受限時仍可遊玩。 */ }
  return {xp: 0, rounds: []};
}
export function recordRound(progress, result) {
  const total = Number.isFinite(result.total) ? Math.max(0, Math.floor(result.total)) : 0;
  const correct = Number.isFinite(result.correct) ? Math.max(0, Math.min(total, Math.floor(result.correct))) : 0;
  return {xp: progress.xp + correct * 10, rounds: [...progress.rounds, {...result, total, correct}].slice(-100)};
}
