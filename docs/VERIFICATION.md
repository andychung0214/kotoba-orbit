# 驗證紀錄

日期：2026-10-21（Asia/Taipei）。

## M1：規劃與內容
- docs/PLAN.md、ART-DIRECTION.md 先於產品程式碼建立，初始提交 b3c19f1。
- 參考站 data.js HTTP 200，與本機 yoru-notes 的 16 曲目一致。
- Node 初次執行因核心模組尚未實作失敗，實作後 7 項通過；語序回歸新增後先失敗，再修正至 8 項通過。
- 實際題庫：46 清音平／片假名、30 詞彙、16 生活句子、16 曲目／48 題主題練習。

## M2／M3：功能與審查
- `npm test`：8 / 8 通過。
- `npm run test:browser`：106 個檢查通過，Microsoft Edge 無頭模式，桌機 1440×1100；390、768、1024px 各頁無水平溢出。
- 四種遊戲完成回合；所有曲目完成挑戰；三種句子難度；錯答、重玩、片假名、搜尋、紀錄重載、清除確認均通過。
- three.js WebGL 場景實際載入；模擬無 WebGL、拒絕 localStorage 時仍可完成回合並顯示儲存通知。
- 瀏覽器未捕捉的程式錯誤：0。桌機／手機截圖已人工檢視。
- 瀏覽器測試發現 hidden 樣式被覆蓋：補上全域 hidden 規則後通過。
- 獨立審查列出四項 P2：對話框關閉事件競態、關閉後焦點遺失、跳過連結觸發首頁路由、自然替代語序判錯。已修正並增加回歸測試；第二次審查未發現這些修正的剩餘重要問題。
- `node --check src/app.js`、`node --check src/stage.js` 通過。
- `npm audit --omit=dev`：0 vulnerabilities。

測試證據（本機，不提交）：test-results/report.json、desktop.png、mobile.png、mobile-game.png。

## 未驗證／未實作
未執行真實手機 Safari／Chrome、完整 NVDA／VoiceOver 人工讀屏、Blender 腳本與 Unreal 編輯器。未取得母語教師審訂。未提供逐句歌詞、音源或完整初級至進階課程。

## 執行裁決
- 使用者已明確要求建立、提交、直接推送與 Pages 發布，按該授權連續執行，不重複要求階段許可。
- 父工作目錄含多個獨立專案，於 kotoba-orbit 建立新 Git 儲存庫；沒有既有分支需要建立 worktree。
- 本機 Git 不支援 `git init -b`，改用 `git init` 與 `git checkout -b feature/initial-release`。
- 工具沒有建立 GitHub 儲存庫與 Pages 設定能力，以已登入的 Chrome 頁面完成；Git 只透過正常的認證機制推送，不讀取憑證。
- Blender 缺少執行檔、Unreal 與純靜態限制不相容，實際執行使用 three.js，替代製作流程另載 ASSET-PIPELINE.md。

## 發布
公開儲存庫已建立：https://github.com/andychung0214/kotoba-orbit 。Pages 狀態於完成部署後補記。
