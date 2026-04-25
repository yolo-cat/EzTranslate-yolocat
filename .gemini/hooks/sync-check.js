const fs = require('fs');
const path = require('path');

/**
 * Gemini CLI Hook: Sync Check (Subagent-Optimized)
 * 負責追蹤文件變更，並在需要時透過 invoke_agent (Subagent) 進行智慧審核。
 * 優點：不需在腳本中管理 API Key，利用 CLI 內建的 Subagent 進行語意分析。
 */

const STATE_FILE = path.join(__dirname, '../modified_files.json');

function initState() {
    if (!fs.existsSync(STATE_FILE)) {
        fs.writeFileSync(STATE_FILE, JSON.stringify({}));
    }
}

function readState() {
    initState();
    try {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function getStdin() {
    let input = '';
    for await (const chunk of process.stdin) {
        input += chunk;
    }
    return JSON.parse(input);
}

const event = process.argv[2];

async function main() {
    const input = await getStdin();
    let state = readState();

    switch (event) {
        case 'AfterTool':
            const filePath = input.args.file_path;
            if (filePath) {
                const normalizedPath = path.relative(process.cwd(), filePath).replace(/^\.\//, '');
                state[normalizedPath] = true;
                saveState(state);
            }
            process.stdout.write(JSON.stringify({}));
            break;

        case 'BeforeAgent':
            const codeChanged = state['.spec/CODE.md'];
            const docsUpdated = state['.spec/TEST.md'] || state['.spec/SPEC.md'] || state['.spec/PRD.md'] || state['.spec/session_log.md'] || state['GEMINI.md'];

            let additionalContext = "";
            if (codeChanged && !docsUpdated) {
                additionalContext = "⚠️ 系統提示：偵測到你修改了 .spec/CODE.md，若涉及重要邏輯變更，請同步更新文檔。";
            }

            process.stdout.write(JSON.stringify({
                hookSpecificOutput: {
                    hookEventName: "BeforeAgent",
                    additionalContext: additionalContext
                }
            }));
            break;

        case 'AfterAgent':
            const hasCodeChange = state['.spec/CODE.md'];
            const hasDocUpdate = state['.spec/TEST.md'] || state['.spec/SPEC.md'] || state['.spec/PRD.md'] || state['.spec/session_log.md'] || state['GEMINI.md'];

            if (hasCodeChange && !hasDocUpdate) {
                // 利用 AfterAgent 的 block 決策與 @ 語法觸發 subagent 審核
                // 這裡我們不直接 block 並結束，而是要求 subagent 介入判定
                process.stdout.write(JSON.stringify({
                    decision: "block",
                    reason: "@generalist 請審核我剛才對 .spec/CODE.md 的變更。若這是「重大變更」（如 API、核心邏輯改動），請要求我更新文檔；若只是「微小變更」（如註解、排版），則請回覆『ALLOW_TRIVIAL_CHANGE』並允許我通過。",
                    systemMessage: "🚀 正在調用 subagent 進行智慧比對..."
                }));
            } else {
                saveState({});
                process.stdout.write(JSON.stringify({
                    decision: "continue"
                }));
            }
            break;

        default:
            process.stdout.write(JSON.stringify({}));
            break;
    }
}

main().catch(err => {
    process.stderr.write(err.message);
    process.exit(1);
});
