# Immersive Translation Userscript Project

## Project Overview
This repository contains the specifications, design documents, and the initial MVP code for a Tampermonkey userscript named "極簡沉浸式翻譯 (Gemini API 專用版)". The project's goal is to build a lightweight, secure browser extension that translates web page paragraphs into Traditional Chinese using a user-provided Google Gemini API key. It features a floating action button for in-place dual-language reading and emphasizes physical sandbox isolation to prevent API key leaks. The documentation follows a Behavior-Driven Development (BDD) and Test-Driven Development (TDD) approach, focusing on state-boundary testing.

## Directory Structure & Key Files
*   **.spec/**: The core documentation defining the project.
    *   `PRD.md`: Product Requirements Document (BDD format). Defines core value, business rules (dual-language display, fail-safe mechanisms), and out-of-scope features for the MVP.
    *   `SPEC.md`: System Design Document (SDD format). Specifies data schema (config, UI position), API interfaces (using `GM_xmlhttpRequest`), and component responsibilities (`LlmService`, `DomManager`, `UiController`).
    *   `TEST.md`: Test-Driven Development plan. Outlines tests for API responses, timeouts, sandbox isolation (preventing `window.fetch` overrides), DOM injection, and XSS prevention.
    *   `CODE.md`: The MVP Tampermonkey userscript code implementing the specifications, including native timeout handling and DOM security measures.
*   **.agents/skills/tampermonkey/**: Contains expert guidance and reference material for writing Tampermonkey userscripts.
*   `GEMINI.md`: This file, providing project context.

## Development Conventions
*   **Tampermonkey Best Practices**: Strict adherence to security (`@connect` constraints, `textContent` over `innerHTML` for XSS prevention) and state management (`GM_setValue`/`GM_getValue`) guidelines.
*   **Test-Driven Development (TDD)**: Development requires writing tests (mocking `GM_*` APIs and using JSDOM) before implementing business logic.
*   **Physical Isolation**: Relies on the native Tampermonkey sandbox (`GM_xmlhttpRequest`) rather than frontend encryption to protect API keys from host webpage interception.

## AI Agent Loop Workflow (Hooks)
本專案導入了 **Gemini CLI Hooks** 攔截機制，確保「持續改進」與「文件同步」：
*   **Sync Check Hook**: 監聽 `AfterTool`, `BeforeAgent`, `AfterAgent` 事件。
*   **強制同步規則**: 當 AI 修改了 `.spec/CODE.md` 時，Hook 會要求同回合內必須同步更新 `.spec/TEST.md` 或 `GEMINI.md`。
*   **自癒迴圈**: 若 AI 忘記更新文件，`AfterAgent` Hook 會自動攔截並退回重做，確保代碼與規格永遠同步。

## Usage & Building
The primary artifact is the userscript located in `.spec/CODE.md`.

To use the script:
1. Install the Tampermonkey extension.
2. Create a new script in the Tampermonkey dashboard.
3. Copy the contents of the `// ==UserScript==` block and the IIFE function from `.spec/CODE.md`.
4. Save the script.
5. On an English webpage, click the Tampermonkey icon, select "設定 API 密鑰", and enter your Google Gemini API Key.
6. Use the floating "譯" button to translate text.

For development and testing, refer to `PLAN.md` (to be created) for the Node.js/Jest/JSDOM setup.
