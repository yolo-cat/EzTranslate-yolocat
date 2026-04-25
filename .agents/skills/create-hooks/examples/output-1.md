# Output Example 1: Setup Documentation Sync (Gemini CLI)

**Action Summary:**
1. Created `.gemini/hooks/` directory.
2. Deployed `universal-hook.js` to `.gemini/hooks/`.
3. Initialized `.gemini/modified_files.json` as `{}`.
4. Updated `.gemini/settings.json` with the following:

```json
{
  "hooks": {
    "AfterTool": [
      {
        "matcher": "write_file|replace",
        "hooks": [{
          "name": "sync-check-after-tool",
          "type": "command",
          "command": "node .gemini/hooks/universal-hook.js"
        }]
      }
    ],
    "BeforeAgent": [
      {
        "matcher": "*",
        "hooks": [{
          "name": "sync-check-before-agent",
          "type": "command",
          "command": "node .gemini/hooks/universal-hook.js"
        }]
      }
    ]
  }
}
```
