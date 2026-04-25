# 🚀 極簡沉浸式翻譯 (Gemini API 專用版)

[![Version](https://img.shields.io/badge/version-1.2.1-blue.svg)](https://github.com/yolo-cat/mini-translation)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Tampermonkey](https://img.shields.io/badge/Platform-Tampermonkey-red.svg)](https://www.tampermonkey.net/)

這是一款為瀏覽器設計的**輕量級沉浸式翻譯腳本**。它能將網頁上的段落直接翻譯成繁體中文，並以**原文與譯文上下對照**的方式呈現，提供極致的雙語閱讀體驗。

---

## ✨ 核心特色

- 📖 **沉浸式對照**：直接在原生段落下方插入譯文，無需切換分頁。
- 🤖 **Gemini 驅動**：預設使用 Google 的 `gemini-2.5-flash-lite` 模型，翻譯速度極快且精準。
- 🔒 **安全隱私**：具備物理沙盒隔離機制，API Key 僅存於本地，絕不外洩給網頁。
- 🎯 **智慧 UI**：可自由拖拽的懸浮翻譯球，位置自動跨分頁記憶。
- ⚡ **零依賴**：極簡代碼實作，不佔用額外系統資源。

---

## 🛠️ 安裝步驟

### 1. 安裝 Tampermonkey 擴充功能
首先，您需要一個 Userscript 管理器。請依據您的瀏覽器安裝對應版本：
- [Chrome 商店安裝](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Firefox 商店安裝](https://addons.mozilla.org/zh-TW/firefox/addon/tampermonkey/)
- [Edge 商店安裝](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepckh登記f)

### 2. 安裝本腳本
點擊下方的連結即可進入安裝頁面：

👉 [**點我安裝「極簡沉浸式翻譯」最新版本**](https://raw.githubusercontent.com/yolo-cat/mini-translation/main/dist/immersive-translation.user.js)

*(點擊後 Tampermonkey 會自動彈出安裝確認視窗，點擊「安裝」或「更新」即可)*

---

## 📖 使用指南

### 第一步：設定您的 API 密鑰
1. 前往 [Google AI Studio](https://aistudio.google.com/app/apikey) 免費申請您的 Gemini API Key。
2. 在瀏覽器點擊 **Tampermonkey 圖示**。
3. 找到「極簡沉浸式翻譯」，點擊選單中的 **「⚙️ 設定 API 密鑰」**。
4. 貼上您的 Key 並按確定。

### 第二步：一鍵翻譯
1. 開啟任何英文網頁（如：[Wikipedia](https://en.wikipedia.org/wiki/Main_Page)）。
2. 點擊頁面右下角的藍色圓形 **「譯」** 按鈕。
3. 系統會自動抓取網頁段落並進行上下對照翻譯。

> 💡 **小技巧**：您可以長按「譯」按鈕將它拖拽到您喜歡的任何位置，下次開啟網頁時它會停留在同一個地方！

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
