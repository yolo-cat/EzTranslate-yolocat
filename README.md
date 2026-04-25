# 🚀 極簡沉浸式翻譯 (Gemini API 專用版)

[![Version](https://img.shields.io/badge/version-1.2.1-blue.svg)](https://github.com/yolo-cat/mini-translation)
<a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)</a>
<a href="https://www.tampermonkey.net/" target="_blank" rel="noopener noreferrer">![Platform: Tampermonkey](https://img.shields.io/badge/Platform-Tampermonkey-red.svg)</a>

這是一款為瀏覽器設計的**輕量級沉浸式翻譯腳本**。它能將網頁上的段落直接翻譯成繁體中文，並以**原文與譯文上下對照**的方式呈現，提供極致的雙語閱讀體驗。

---

## ✨ 核心特色

- 📖 **沉浸式對照**：直接在原生段落下方插入譯文，無需切換分頁。
- ⚡ **免設定即用**：沒 API Key？沒問題！預設自動啟用 **Google 翻譯備援**。
- 🤖 **Gemini 驅動**：填入 Key 後自動升級為 `gemini-flash-lite-latest` 模型，極速且精準。
- 🔒 **安全隱私**：具備物理沙盒隔離機制，API Key 僅存於本地，絕不外洩給網頁。
- 🎯 **智慧 UI**：可自由拖拽的懸浮翻譯球，位置記憶並提供當前引擎提示。
- ⏳ **穩定抗壓**：內建批次翻譯與頻率限制機制，有效規避 429 錯誤。

---

## 🛠️ 安裝步驟

### 1. 安裝 Tampermonkey 擴充功能
首先，您需要一個 Userscript 管理器。請依據您的瀏覽器安裝對應版本：
- <a href="https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo" target="_blank" rel="noopener noreferrer">Chrome 商店安裝</a>
- <a href="https://addons.mozilla.org/zh-TW/firefox/addon/tampermonkey/" target="_blank" rel="noopener noreferrer">Firefox 商店安裝</a>
- <a href="https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepckh登記f" target="_blank" rel="noopener noreferrer">Edge 商店安裝</a>

### 2. 安裝本腳本
點擊下方的連結即可進入安裝頁面：

👉 [**點我安裝「極簡沉浸式翻譯」最新版本**](https://raw.githubusercontent.com/yolo-cat/mini-translation/main/dist/immersive-translation.user.js)

*(點擊後 Tampermonkey 會自動彈出安裝確認視窗，點擊「安裝」或「更新」即可)*

---

## 📖 使用指南

### 快速開始
1. 安裝腳本後，開啟任何英文網頁。
2. 點擊右下角藍色圓形 **「譯」** 按鈕。
3. 系統會提示「目前使用：Google 機器翻譯」並開始工作。

### 進階優化：設定 Gemini API 密鑰
1. 前往 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a> 免費申請您的 Gemini API Key。
2. 在瀏覽器點擊 **Tampermonkey 圖示**。
3. 找到「極簡沉浸式翻譯」，點擊選單中的 **「⚙️ 設定 API 密鑰」**。
4. 貼上您的 Key 並按確定。
5. 下次點擊翻譯時，系統將自動切換為 **Gemini API** 引擎。

> 💡 **小技巧**：長按「譯」按鈕可自由拖拽位置；若遇到 429 頻率限制，系統會自動等待後重試。

---

## ⚙️ 開發者資訊 (TDD 架構)

本專案採用 **文檔驅動 (BDD)** 與 **測試驅動 (TDD)** 流程開發：
- **原始碼**: 位於 `src/` 目錄，採用 ESM 模組化。
- **打包工具**: 使用 `esbuild` 將模組封裝為單體 Userscript。
- **品質保證**: 內建 Jest 測試環境，執行 `npm test` 即可驗證核心邏輯。

---

## 📜 免責聲明與授權

- 本專案僅供學習與研究使用，翻譯過程中產生的 API 消耗由使用者自行承擔。
- 本專案採用 [MIT License](LICENSE) 授權。

---

**⭐ 覺得好用嗎？歡迎到 [GitHub 儲存庫](https://github.com/yolo-cat/mini-translation) 給我們一個 Star！**
