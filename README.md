# Kotoba Orbit｜言葉軌道

從喜歡的旋律開始，每天多懂一點日語。夜間電台與日系音樂雜誌風格的短回合日語學習遊戲集。

**[立即遊玩](https://andychung0214.github.io/kotoba-orbit/)** · [GitHub 儲存庫](https://github.com/andychung0214/kotoba-orbit)

## 遊戲與特色
- **假名閃卡**：104 組平／片假名。基礎 46 清音、中階 25 濁音／半濁音、進階 33 組拗音；每級都有假名讀音、讀音選字、字形互換，每回合隨機 8 題。
- **詞彙連線**：72 個詞彙，每級 24 個。漢字配中文、漢字配讀音、讀音配中文，或混合配對；每回合隨機 5 組。
- **句子拼軌**：72 個原創生活例句，每級 24 句。句子重組、句意辨識、中文提示填空，每回合隨機 6 題。
- **音樂讀本**：16 首 YOASOBI 曲目，每首三種難度、每級 18 題，共 864 題分級練習。主題詞彙、原創例句理解、中文提示填空與原作背景辨識混合出題，每回合隨機 6 題；保留原作與官方 MV 連結。
- 答題解說、錯題筆記、每回合成果、累積 XP 與最近 100 回合紀錄。
- 原生 three.js 唱片舞台、無 WebGL 替代圖、減少動態設定支援。
- 無帳號、無後端、無追蹤分析、無遠端字型／CDN。three.js 以本機 vendor 檔案載入。

## 操作
滑鼠或觸控點選練習。首頁與遊戲練習場可設定所有遊戲的難度；前三種遊戲卡可選指定題型或混合題型。歌曲讀本內可獨立調整這回合難度，詞彙與原創例句隨級別改變，原作／作者事實題則跨級保留。

詞彙先點左邊，再按提示配對右邊的中文或讀音；重組題點選下方詞塊，點上方已選詞塊可移回。四選一答題後顯示解說，再按下一題。填空附中文提示，依指定句意選出完整語塊。

每局同一素材只出現一次；題目順序、選項順序、干擾選項與配對排列均會隨機化。混合練習輪替不同題型。下一局優先抽上一局未出現的素材，題庫不足時才補回；因此歌曲等較小題庫仍可能跨局重複。避重複紀錄只存在目前頁面記憶體，重新載入後重置；XP 與完成回合仍持久儲存。重玩沿用上一局難度、題型與字形。

鍵盤：Tab／Shift+Tab 移動焦點，Enter／Space 操作按鈕；Escape 離開對話框。未完成回合不會計分；答對一題得到 10 XP。詞彙題答錯可重試，但該組不再計首次答對分數。每天 3 回合是介面上的小目標，不會鎖住遊戲。

## 安裝與執行
需要 Node.js 20 或更新版本，以及現代瀏覽器。

```sh
npm ci
npm start
```

開啟 http://127.0.0.1:4173 。正式部署只需靜態檔案，不需要 Node.js 伺服器。因使用 ES Modules，請使用 HTTP 伺服器，不以 file:// 直接開啟 HTML。

## 專案結構
```text
index.html              網站外殼與對話框
styles.css              三組響應式版型、設計變數與元件
src/app.js              路由、互動、四種遊戲、學習紀錄
src/core.js             洗牌、出題、句子判定、進度純函式
src/content.js          假名、漢字詞彙、原創生活例句
src/expanded-content.js  擴充假名、詞彙與生活句子
src/song-lessons.js      16 首三難度的主題詞彙與原創例句
src/question-bank.js     教材轉題型、題目語言與干擾選項
src/songs.js            曲目事實資訊與原創主題練習
src/stage.js            three.js 唱片舞台與資源釋放
vendor/                 three.js 0.180.0 與 MIT 授權
assets/                 原創 SVG 圖示
art/                    Blender 場景重建腳本
scripts/serve.js         僅供開發的本機靜態伺服器
tests/                  Node 與瀏覽器測試
docs/                   規劃、美術、測試、資產流程與驗證紀錄
```

## 測試
```sh
npm test
npm run test:browser
```

單元測試採 Node 內建 test runner。瀏覽器測試使用 Playwright 及已安裝的 Microsoft Edge，輸出 `test-results/report.json` 與桌機／手機截圖；不提交測試瀏覽器資料。`TEST_URL` 可指定已部署的網址（不含末尾 `/`）重跑同一組瀏覽器檢查。測試用獨立無頭瀏覽器，不讀取使用者登入資訊。

詳細項目與尚未驗證的項目請見 [測試計畫](docs/TEST-PLAN.md) 與 [驗證紀錄](docs/VERIFICATION.md)。

## 部署至 GitHub Pages
本專案不需要建構，已提交執行所需的 three.js 檔案。

1. 建立公開 GitHub 儲存庫，推送專案分支。
2. 在 Settings → Pages 選擇 **Deploy from a branch**。
3. 選擇 `feature/initial-release`、`/ (root)` 並儲存。
4. 等待 `pages build and deployment` 成功；網址通常為 `https://<帳號>.github.io/kotoba-orbit/`。
5. 所有資產使用相對路徑，遊戲頁面採 hash 路由，支援專案子路徑。

`.nojekyll` 停用 Jekyll 處理。請勿上傳 `.env`、金鑰、憑證或 `node_modules`。

## 內容來源與授權
曲目清單與原作事實依 [YORU Notes 夜讀音樂室](https://tool.crownchung.tw/yoru-notes/) 核對（2026-10-21），每首另附原作出版方或官方來源。YOASOBI 是正確藝名拼法。

本站沒有取得歌曲歌詞、音源、官方封面或小說全文的再發布授權，因此**不內建逐句歌詞教材**；以主題詞彙、原創生活例句及原作辨識作為學習入口。原作名、曲名及作者資訊不代表合作或授權。所有歌曲及原作的權利仍屬各權利人。請自行透過合法平台閱讀歌詞與原作。

程式碼、原創練習與原創視覺採 MIT，見 [LICENSE](LICENSE)。three.js 另附 [MIT 授權](vendor/THREE-LICENSE.txt)。本專案不宣稱為官方 YOASOBI 產品，也不宣稱已由日本母語教師審訂。分級為本站內部分級，不等同 JLPT 認證或完整教材。

## 已知限制
- 假名涵蓋 46 清音、25 濁音／半濁音、33 組常見拗音，尚未另設促音、長音或外來語特殊音節課程。じ／ぢ及ず／づ同音，逆向選字題會附行別。
- 句子練習接受題庫列出的常見替代語序；尚未列入的特殊語境或強調語序可能不被接受，首版不進行自由語法判定。
- 沒有聽力音源、語音評分、跨裝置同步、帳號、排行榜或完整初級至進階課程。
- 清除網站資料或瀏覽器隱私模式可能造成紀錄消失；本機無法儲存時會提示。
- Blender 腳本已提供但本機未安裝 Blender，因此未執行或產生 `.blend`／`.glb`。瀏覽器場景為 three.js 程式化幾何。
- **Unreal Engine 未整合**：新版官方 HTML5 發布不適用這個純靜態專案，且 Pixel Streaming 需要伺服器。詳見 [資產製作流程](docs/ASSET-PIPELINE.md)。

## 參與開發
請先閱讀 [CONTRIBUTING.md](CONTRIBUTING.md)、[規劃](docs/PLAN.md) 與 [美術方向](docs/ART-DIRECTION.md)。
