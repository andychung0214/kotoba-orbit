import { songs } from './songs.js';
export { songs };
const hiragana = [...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'];
const katakana = [...'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'];
const roman = 'a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n'.split(' ');
export const kana = hiragana.map((hira,i) => ({hira, kata:katakana[i], roman:roman[i]}));
const vocabulary = [
 ['夜','よる','夜晚','beginner'],['朝','あさ','早晨','beginner'],['本','ほん','書','beginner'],['水','みず','水','beginner'],['駅','えき','車站','beginner'],['友達','ともだち','朋友','beginner'],['音楽','おんがく','音樂','beginner'],['花','はな','花','beginner'],['海','うみ','海','beginner'],['夢','ゆめ','夢','beginner'],['学校','がっこう','學校','beginner'],['時間','じかん','時間','beginner'],
 ['約束','やくそく','約定','intermediate'],['記憶','きおく','記憶','intermediate'],['未来','みらい','未來','intermediate'],['気持ち','きもち','心情','intermediate'],['旅','たび','旅程','intermediate'],['景色','けしき','風景','intermediate'],['選ぶ','えらぶ','選擇','intermediate'],['伝える','つたえる','傳達','intermediate'],['別れ','わかれ','離別','intermediate'],['再会','さいかい','重逢','intermediate'],
 ['憧れ','あこがれ','憧憬','advanced'],['葛藤','かっとう','內心衝突','advanced'],['余韻','よいん','餘韻','advanced'],['絆','きずな','羈絆','advanced'],['儚い','はかない','短暫而易逝','advanced'],['懐かしい','なつかしい','令人懷念的','advanced'],['向き合う','むきあう','面對','advanced'],['受け入れる','うけいれる','接納','advanced']
];
export const words = vocabulary.map(([word,reading,meaning,level],i) => ({id:`word-${i}`,word,reading,meaning,level}));
const sentenceRows = [
 ['beginner','我每天喝茶。','私は|毎日|お茶を|飲みます。','は標示主題，を標示喝的對象。'],
 ['beginner','車站在哪裡？','駅は|どこ|ですか。','どこ詢問地點；ですか是禮貌問句。'],
 ['beginner','請給我這個。','これを|ください。','名詞＋をください，用來請求物品。'],
 ['beginner','今天很冷。','今日は|寒い|です。','寒い是い形容詞，描述天氣寒冷。'],
 ['beginner','我和朋友去學校。','私は|友達と|学校へ|行きます。','と表示一起行動的對象；へ表示方向。'],
 ['beginner','我喜歡音樂。','私は|音楽が|好きです。','好き的對象通常用が標示。'],
 ['intermediate','回家之後再讀書。','家に|帰ってから|本を|読みます。','動詞て形＋から表示先完成某個動作。'],
 ['intermediate','因為下雨，所以帶傘去。','雨が|降っているので|傘を|持っていきます。','ので用來表達原因；持っていく是帶著去。'],
 ['intermediate','我一邊聽音樂一邊走路。','音楽を|聞きながら|歩きます。','動詞ます形去ます＋ながら表示兩個動作同時進行。'],
 ['intermediate','我打算明天見朋友。','明日|友達に|会う|つもりです。','動詞辭書形＋つもりです表示打算。'],
 ['intermediate','這本書比那本更有趣。','この本は|あの本より|面白い|です。','より標示比較的基準。'],
 ['advanced','即使失敗，也不打算放棄。','たとえ|失敗しても|諦める|つもりはありません。','たとえ〜ても表示即使；つもりはありません表示沒有這個打算。'],
 ['advanced','隨著經驗增加，想法也會改變。','経験が|増えるにつれて|考え方も|変わります。','〜につれて表達隨著某個變化，另一件事也跟著變化。'],
 ['advanced','並不是每個人都有相同的想法。','誰もが|同じ考えを|持っている|わけではありません。','〜わけではない表示部分否定，不能理解成完全否定。'],
 ['advanced','因為是重要的朋友，才想說實話。','大切な友達|だからこそ|本当のことを|伝えたいです。','〜からこそ強調正因為這個理由。'],
 ['advanced','讀了又讀，仍然有新的發現。','何度|読んでも|新しい発見が|あります。','疑問詞＋ても表示無論如何；何度読んでも是無論讀幾次。']
];
const naturalOrders = {
  0:[[1,0,2,3],[0,2,1,3],[1,2,0,3],[2,0,1,3],[2,1,0,3]],
  4:[[0,2,1,3],[1,0,2,3],[1,2,0,3],[2,0,1,3],[2,1,0,3]],
  6:[[2,0,1,3]],
  7:[[2,0,1,3]],
  9:[[1,0,2,3]]
};
export const sentences = sentenceRows.map(([level,meaning,text,explanation],i) => {
  const tokens=text.split('|');
  return {id:`sentence-${i}`,level,meaning,tokens,explanation,alternatives:(naturalOrders[i]||[]).map(order=>order.map(index=>tokens[index]))};
});
export const levels = {beginner:'基礎',intermediate:'中階',advanced:'進階'};
export const modes = {kana:'假名閃卡',match:'詞彙連線',order:'句子拼軌',song:'音樂讀本'};
