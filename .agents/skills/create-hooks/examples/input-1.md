# Example Input: Setup Documentation Sync

**User Prompt:**
"幫我建立一個 Hook，每當 src/ 目錄下的檔案變更時，都要提醒我要更新 .spec/SPEC.md"

**Expected Action:**
The skill should identify the guard path (`src/`) and the target document (`.spec/SPEC.md`), then generate the appropriate `.gemini/settings.json` configuration and a specialized `sync-check.cjs` script.
