---
name: create-hooks
description: |
  當使用者需要「設定 Hook」、「建立文件同步機制」、「自動化審計代碼與文檔」或「監控專案完整性」時，務必啟用此技能。
  此技能強制執行「文件驅動開發 (DDD)」的自動化護航機制，確保代碼變更時同步更新 SPEC, TEST 與 PRD。
version: 1.1.0
language: zh-Hant
---

# create-hooks — 專案自動化 Hook 產出器

## 1) Context & Goals
在複雜的代碼開發中，文檔（如 PRD, SPEC, TEST）往往會隨時間與代碼脫節。本技能透過產出具備「跨 Agent 兼容性」的 Hooks，建立「變更監控 -> 智慧提醒 -> 自癒同步」的閉環，確保專案始終維持高品質的 SSOT (Single Source of Truth)。

## 2) Preconditions
### Trigger
- 「幫我設定這個專案的 hooks」
- 「建立代碼與文檔的同步檢查機制」
- 「監控 src/ 變更並要求更新 SPEC.md」
- 「自動化管理開發日誌 (session_log)」
- 「跨 Agent (Gemini/Claude/Copilot) 同步監控」

### Required Inputs
1. **守護路徑 (Guard Paths)**：哪些資料夾/檔案變更時需要觸發（例如 `src/**`, `CODE.md`）。
2. **目標文檔 (Target Docs)**：觸發後應要求同步更新的文件（例如 `SPEC.md`, `TEST.md`, `session_log.md`）。
3. **Agent 類型**：Gemini CLI, Claude Code, 或 GitHub Copilot CLI。

### Fail-fast Questions
若缺乏資訊，務必先提問：
1. 您希望監控哪些路徑的變更？（例如 `src/`）
2. 當變更發生時，應該提醒更新哪一份文件？（例如 `.spec/SPEC.md`）
3. 您目前使用的是哪款 AI Agent CLI 工具？

## 3) SOP (Plan → Validate → Execute)

### 3.1 Plan
1. 確認守護規則（Mapping Rules）。
2. 確定使用的 Agent（Gemini, Claude, Copilot 或通用 Git）。
3. 提案檔案結構：建議統一存放於 `.gemini/hooks/` (作為中立區) 或 `.hooks/`。

### 3.2 Validate
- **通用性檢查**：確保腳本能辨識 `GEMINI_PROJECT_DIR` 與 `CLAUDE_PROJECT_DIR` 等環境變數。
- **標準化輸出**：確保對不同 Agent 輸出正確的 JSON 格式或系統訊息。

### 3.3 Execute
1. 建立 Hook 存放目錄。
2. 複製 `templates/universal-hook.js` 並根據專案需求調整守護路徑（RegExp）。
3. 根據 Agent 類型，參考 `templates/adapters/` 下的對應配置檔更新專案設定。

## 4) Output Format & Examples
### Output Format
- 呈現更新後的 Agent 設定檔（如 `.claude/settings.json`）。
- 呈現 `universal-hook.js` 中的守護邏輯片段。

## 5) 跨 Agent 支援 (Cross-Agent Support)
本技能採用「通用架構 (Universal Architecture)」，一份腳本即可支援多種工具：

### Gemini CLI
- 事件：`BeforeAgent`, `AfterTool`
- 格式：需回傳 `{"decision": "allow", "systemMessage": "..."}`

### Claude Code
- 事件：`UserPromptSubmit`, `PostToolUse`
- 格式：可直接透過 `stdout` 注入提示詞。

### GitHub Copilot CLI
- 事件：`preToolUse`, `postToolUse`
- 配置：`.github/hooks/hooks.json`

## 6) Error Handling & Boundaries
- **嚴禁阻斷正當變更**：Hook 應預設為「提示 (Notification)」而非強制「拒絕 (Deny)」，除非使用者要求 Hard-block。
- **性能考慮**：避免在 Hook 中執行大型構建或網路請求，應優先使用本地標記位（modified_files.json）。
