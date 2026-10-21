# 參與開發

使用語意清楚的英文命名，繁體中文文件與註解使用臺灣用語。維持 HTML、CSS、Vanilla JavaScript ES Modules，不加入前端框架、TypeScript、後端服務。

1. 使用 `feature/xxx`、`fix/xxx` 或 `chore/xxx` 分支。
2. 新行為先增加能失敗的測試，再實作與驗證；資料更新需確認答案唯一且解說正確。
3. 執行 `npm test` 與 `npm run test:browser`，確認桌機／手機與鍵盤可使用。
4. Commit 使用 Conventional Commits，描述以 zh-TW 撰寫，例如 `feat: 新增濁音練習`。
5. PR 說明使用者會看到的變化、驗證結果與限制。涉及日語內容請列出查核依據，最好由母語教學者審閱。

禁止提交憑證、token、`.env` 或私人金鑰；不要為了檢查而讀取這些檔案。依明確檔案清單加入版本控制。推送前顯示 remote、branch、commit。

不得直接加入受版權保護的完整歌詞、音源、封面或小說。新增曲目只使用必要事實資訊、來源連結與原創題目；若取得授權，需先記錄授權範圍。不要把主題例句標示成歌詞摘錄。

third-party 更新：安裝固定版本後，從 `node_modules/three/build` 更新 `vendor/three.module.min.js`、`three.core.min.js` 及授權檔，重新測試無 WebGL 與減少動態情境。
