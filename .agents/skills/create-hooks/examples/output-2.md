# Output Example 2: Claude Code Integration

**Action Summary:**
1. Deployed `universal-hook.js` to `.claude/hooks/`.
2. Updated `.claude/settings.json` with the following configuration:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/universal-hook.js"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/universal-hook.js"
          }
        ]
      }
    ]
  }
}
```
