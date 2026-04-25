/**
 * Generic Sync-Check Hook for Gemini CLI
 * Purpose: Track file modifications and prompt for documentation updates.
 */
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(process.env.GEMINI_PROJECT_DIR || '.', '.gemini/modified_files.json');

function readState() {
    try {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

function writeState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function main() {
    // Read input from stdin
    const inputStr = fs.readFileSync(0, 'utf8');
    if (!inputStr) return;
    const input = JSON.parse(inputStr);
    
    const event = input.hook_event_name;
    let state = readState();

    if (event === 'AfterTool') {
        const tool = input.tool_name;
        const toolInput = input.tool_input || {};
        const filePath = toolInput.file_path || toolInput.path;

        if (filePath && (tool === 'write_file' || tool === 'replace')) {
            // Logic: If code changes, mark it
            // This regex should be customized per project
            if (filePath.startsWith('src/') || filePath.endsWith('CODE.md')) {
                state[filePath] = true;
                writeState(state);
            }
        }
    }

    if (event === 'BeforeAgent') {
        const modifiedFiles = Object.keys(state);
        if (modifiedFiles.length > 0) {
            // Emit warning message to the Agent via systemMessage
            const msg = `⚠️ 系統提示：偵測到代碼變更 (${modifiedFiles.join(', ')})。請依據 .spec/PRD.md 的業務邏輯，漸進式更新 SPEC.md, TEST.md 或 session_log.md。`;
            console.log(JSON.stringify({
                decision: "allow",
                systemMessage: msg
            }));
            return;
        }
    }

    // Default allow
    console.log(JSON.stringify({ decision: "allow" }));
}

main().catch(err => {
    process.stderr.write(err.stack);
    process.exit(1);
});
