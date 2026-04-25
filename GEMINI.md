# Immersive Translation Userscript Project

## Project Overview
這是一個為 Tampermonkey 設計的輕量級、具備物理沙盒隔離的沉浸式翻譯腳本。利用 Google Gemini API 將網頁段落翻譯為繁體中文，並以雙語對照方式呈現。
*   **Repository**: https://github.com/yolo-cat/mini-translation
*   **Auto-Update**: 透過 GitHub Raw 連結實現自動檢查更新。
*   **Prompt Optimization**: 嚴格調優 System Prompt，確保模型僅輸出譯文，避免冗餘解釋。

## 📂 Directory Structure & Key Files
*   **.spec/**: 核心開發規格與追溯文檔 (SSOT)。
    *   `PRD.md`: 需求書 (BDD 模式)。
    *   `SPEC.md`: 系統設計規格 (SDD 模式)。
    *   `TEST.md`: TDD 測試計畫。
    *   `CODE.md`: 最終編譯產出的 Userscript 代碼。
    *   `PLAN.md`: 實作計畫執行追蹤。
    *   `session_log.md`: 開發進度與 Prompt 追溯日誌（Rolling Window 設計）。
*   **src/**: 模組化原始碼。
    *   `LlmService.js`, `DomManager.js`, `UiController.js`, `config.js`.
*   **tests/**: Jest 測試套件，確保 TDD 流程。
*   **dist/**: 構建產物目錄。
*   **.gemini/hooks/**: 專案自動化 Hook，確保代碼與文檔同步。

## 🛠️ Development Environment
*   **Runtime**: Node.js (ESM).
*   **Testing**: Jest + JSDOM.
*   **Bundler**: esbuild (用於將模組封裝為 IIFE Userscript)。
*   **Command**: `NODE_OPTIONS=--experimental-vm-modules npm test` (驗證邏輯), `npm run build` (構建腳本)。

## 🤖 AI Agent Loop Workflow (Hooks)
本專案透過 **Gemini CLI Hooks** 強制執行「文檔驅動開發」：
*   **Sync Check Hook**: 監聽代碼與結構變更。
*   **智慧審核機制**: 當偵測到重大變更但未同步更新 `.spec/` 或 `GEMINI.md` 時，Hook 會自動喚醒 `@generalist` 子代理進行語意審核，決定是否放行或要求補齊文檔。
*   **物理隔離原則**: API Key 僅存於本地 `.env` 或油猴儲存，Hook 審核流程透過 CLI 內建 Subagent 執行，無需暴露 API Key。

## 🚀 Usage
1. 安裝 Tampermonkey。
2. 從 `.spec/CODE.md` 複製代碼至新腳本。
3. 於網頁選單「設定 API 密鑰」輸入 Gemini API Key。
4. 點擊懸浮「譯」按鈕進行沉浸式翻譯。
