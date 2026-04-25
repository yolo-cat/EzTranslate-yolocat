/**
 * Universal AI Agent Hook
 * Compatible with: Gemini CLI, Claude Code, GitHub Copilot CLI, and Git Hooks.
 * 
 * This script detects the running environment and enforces project integrity rules.
 */

const fs = require('fs');
const path = require('path');

// 1. Detect Project Root and State File
const PROJECT_ROOT = process.env.GEMINI_PROJECT_DIR || 
                     process.env.CLAUDE_PROJECT_DIR || 
                     process.env.GITHUB_WORKSPACE || 
                     process.cwd();

const STATE_FILE = path.join(PROJECT_ROOT, '.gemini/modified_files.json'); // Shared state

// 2. Load State
function readState() {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } 
    catch (e) { return {}; }
}

function writeState(state) {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// 3. Logic: Mark modified files
function markModified(filePath) {
    if (!filePath) return;
    let state = readState();
    // Common logic: Guard src/ and CODE.md
    if (filePath.startsWith('src/') || filePath.endsWith('CODE.md') || filePath.endsWith('.spec/CODE.md')) {
        state[filePath] = true;
        writeState(state);
    }
}

// 4. Main Execution
async function main() {
    let input = {};
    try {
        const stdin = fs.readFileSync(0, 'utf8');
        if (stdin) input = JSON.parse(stdin);
    } catch (e) {
        // Not all agents pass JSON on stdin; fallback to env vars
    }

    // Determine Event Source
    const eventName = input.hook_event_name || input.event || process.env.CLAUDE_HOOK_EVENT || "unknown";
    const toolName = input.tool_name || input.tool || "unknown";
    const filePath = input.tool_input?.file_path || input.tool_input?.path || input.arguments?.path;

    // A. Track Changes (Post-Tool / After-Tool)
    if (eventName.includes('PostTool') || eventName.includes('AfterTool')) {
        markModified(filePath);
    }

    // B. Prompt/Review (Before-Agent / UserPromptSubmit)
    if (eventName.includes('BeforeAgent') || eventName.includes('UserPromptSubmit')) {
        const modified = Object.keys(readState());
        if (modified.length > 0) {
            const msg = `⚠️ [Audit] Detected changes in: ${modified.join(', ')}. Ensure documentation (.spec/ or GEMINI.md) is updated accordingly.`;
            
            // Standard Output Formats
            if (process.env.GEMINI_PROJECT_DIR) {
                // Gemini CLI Format
                console.log(JSON.stringify({ decision: "allow", systemMessage: msg }));
            } else if (process.env.CLAUDE_PROJECT_DIR) {
                // Claude Code Format (Context injection via stdout)
                console.log(`\n${msg}\n`);
            } else {
                // Generic Fallback
                process.stderr.write(msg + "\n");
                console.log(JSON.stringify({ decision: "allow" }));
            }
            return;
        }
    }

    // Default: Allow
    console.log(JSON.stringify({ decision: "allow" }));
}

main().catch(err => {
    process.stderr.write(err.stack + "\n");
    process.exit(1);
});
