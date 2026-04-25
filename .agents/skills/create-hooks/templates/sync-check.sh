#!/bin/sh
# Generic Sync-Check Hook for Gemini CLI (POSIX Shell Version)
# Purpose: Basic file tracking without heavy dependencies.

STATE_FILE="${GEMINI_PROJECT_DIR:-.}/.gemini/modified_files.json"

# Function to initialize state if missing
if [ ! -f "$STATE_FILE" ]; then
    echo "{}" > "$STATE_FILE"
fi

# Read stdin
INPUT=$(cat)

# Simple JSON field extraction using sed/grep (for maximum portability)
EVENT=$(echo "$INPUT" | grep -o '"hook_event_name":"[^"]*"' | head -1 | cut -d'"' -f4)
TOOL=$(echo "$INPUT" | grep -o '"tool_name":"[^"]*"' | head -1 | cut -d'"' -f4)
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ "$EVENT" = "AfterTool" ]; then
    if [ "$TOOL" = "write_file" ] || [ "$TOOL" = "replace" ]; then
        case "$FILE_PATH" in
            src/*|*CODE.md)
                # Mark as modified
                echo "{\"$FILE_PATH\": true}" > "$STATE_FILE"
                ;;
        esac
    fi
fi

if [ "$EVENT" = "BeforeAgent" ]; then
    # Check if state file has any true flags
    MODIFIED=$(cat "$STATE_FILE" | grep -o '"[^"]*": true' | cut -d'"' -f2 | tr '\n' ' ')
    if [ ! -z "$MODIFIED" ]; then
        MSG="⚠️ 系統提示：偵測到代碼變更 ($MODIFIED)。請同步更新 .spec/ 文檔。"
        echo "{\"decision\": \"allow\", \"systemMessage\": \"$MSG\"}"
        exit 0
    fi
fi

echo "{\"decision\": \"allow\"}"
