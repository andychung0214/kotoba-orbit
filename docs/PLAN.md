# Kotoba Orbit｜言葉軌道 Implementation Plan

> 執行方式：superpowers:executing-plans，依任務逐項實作與驗證。

## 目標與需求
建立繁體中文導覽的日語學習遊戲集，以 YOASOBI 16 首歌的原作背景與主題作為學習入口，從五十音、漢字詞彙到生活句子。名稱：Kotoba Orbit／言葉軌道；類型：短回合語言益智遊戲。

## 架構與範圍
原生 HTML/CSS/JavaScript ES Modules；three.js 唱片場景為漸進增強。所有題目可透過 DOM 操作，WebGL 不可用時仍能遊玩。無後端、無框架，靜態 GitHub Pages 發布。Node.js 僅供本機測試與靜態檔案伺服器。

歌曲資料以參考站 https://tool.crownchung.tw/yoru-notes/ 的 16 首曲目為準；2026-10-21 透過 HTTP 200 核對其 data.js 與本機 yoru-notes/data.js 相同。只移入曲名、原作名、作者與來源／官方 MV 連結，重新撰寫主題導讀與原創題目，不移入歌詞、錄音或封面。不是官方授權產品，也不宣稱由日本母語教師審訂。

## 全域限制
- 最新任務優先於上層電商規範：不使用 Angular、TypeScript、後端與金流。
- 中文採臺灣用語；三組版型：手機 <640px、平板 640–1023px、桌機 ≥1024px。
- 無憑證檔案存取；依明確檔案清單提交。Git push 前顯示 remote、branch、commit。
- Blender 提供可重建模型的 Python 腳本；本機無執行檔時標示未執行。Unreal 新版無官方 HTML5 匯出，僅提供離線製作流程說明，不宣稱已整合。

## 工作分解與里程碑
### M1：內容與純函式核心
- [x] 建立 src/content.js：46 組清音平／片假名、分級詞彙與句子、16 首曲目與原創練習。
- [x] 先寫 tests/core.test.js，執行確認失敗，再建立 src/core.js。
- [x] 介面：shuffle(items, random)、makeQuiz(items, limit)、gradeOrder(selected, expected)、readProgress(storage)、recordRound(progress, result)。
- [x] 驗收：題目唯一正解、洗牌保留集合、計分不超出範圍、損壞或不可用儲存可復原。
### M2：可遊玩的網站
- [x] index.html/styles.css/src/app.js：首頁、遊戲集、曲目資料館、學習紀錄，原生 dialog。
- [x] 四種遊戲：假名四選一、漢字詞彙配對、句子重組、歌曲主題四選一。每題回饋、解說、結果與重玩。
- [x] src/stage.js：本機 three.js 唱片場景、指標互動、減少動態與無 WebGL 替代。
- [x] 驗收：每種模式完成一回合、錯答不重複得分、重玩重置、鍵盤與觸控均可操作。
### M3：驗證與交付
- [x] Node 單元測試、Playwright 桌機／手機瀏覽器測試與截圖。
- [x] 補齊 README、ART-DIRECTION、TEST-PLAN、LICENSE、CONTRIBUTING、資產製作說明。
- [x] 獨立程式碼審查，修復影響使用者的問題，再重新驗證。
### M4：Git 與 Pages
- [x] 新 Git 儲存庫 feature/initial-release；初始文件與產品提交。
- [x] 建立公開 GitHub 儲存庫，推送前揭露 remote／branch／commit，使用 branch 根目錄 Pages。
- [x] 等待 Pages 建置並實際 HTTP 與瀏覽器驗證；正式網址 HTTP 200、106 項瀏覽器檢查通過。

## Review Focus／風險
1. localStorage 拒絕或 JSON 損壞：使用者仍可遊玩，明確告知紀錄未持久化。
2. 連點、關閉與重開對話框：不重複加分，不沿用上一局選項。
3. 手機與鍵盤：焦點可見、dialog 可離開、不靠拖曳操作、無水平溢出。
4. GPU 不可用與減少動態：維持可閱讀替代圖，不影響題目載入。
5. 內容：歌曲主題題目不偽稱歌詞原文；難度為本站分級，非官方 JLPT 認證；16 首都有練習與來源。

## 驗收條件
所有必要文件存在；四種遊戲完整流程；16 首均可開啟；46 清音涵蓋平片假名；基礎／中階／進階題庫；紀錄重載保留；桌機與行動測試通過；無主控台程式錯誤；Git 有提交；Pages 發布狀態與實際驗證證據清楚記載。
