# 3D 資產製作流程與限制

## 實際執行：three.js
網站使用 0.180.0，固定套件版本並將執行模組放在 vendor。唱片、唱片套、軌道與星點都是程式化幾何；唱片標籤是 Canvas 原創字形貼圖。無外部 3D 資產。WebGL 2 不可用時顯示 CSS 唱片替代圖，題目仍可遊玩。參考：https://threejs.org/docs/pages/WebGLRenderer

## Blender：提供腳本，尚未執行
`art/build_record.py` 可在 Blender 的 Scripting 工作區執行，會建立名為 KotobaOrbit 的獨立集合，保留其他集合，不刪除使用者場景。輸出需要在 Blender 手動選取該集合，使用 glTF 2.0 匯出選取物件。未偽造 .blend 或 .glb 檔案。

建議製作流程：執行腳本 → 人工檢查材質與尺度 → 只選取 KotobaOrbit 集合物件 → 匯出 GLB → 加入本機 GLTFLoader 模組與載入失敗替代 → 增加資產載入測試。首版未採 GLB 載入，避免把未驗證的工具產物當作已完成整合。

## Unreal Engine：未整合的離線製作選項
Epic 官方舊版 HTML5 教材明確註記較新版本不支援 HTML5：
https://dev.epicgames.com/community/learning/courses/MlL/introduction-to-packaging-projects/dEw/packaging-for-html5?locale=es-mx

Unreal 可用於將來製作離線宣傳影片或概念場景，但首版不包含 Unreal 專案、不需要其執行環境。Pixel Streaming 需要 GPU 伺服器與訊號服務，不符合這次「無後端、GitHub Pages」限制。若未來希望改為 Unreal 可玩的遊戲，必須另行確認部署與授權範圍。
