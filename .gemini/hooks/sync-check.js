const fs = require('fs');
const path = require('path');

/**
 * Gemini CLI Hook: Sync Check
 * 負責追蹤文件變更，並確保代碼與規格文件同步。
 */

const STATE_FILE = path.join(__dirname, '../modified_files.json');

// 初始化狀態檔
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

// 讀取 stdin JSON
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
            // 追蹤 write_file 或 replace 的檔案
            const tool = input.toolName;
            const filePath = input.args.file_path;
            
            if (filePath) {
                const normalizedPath = path.relative(process.cwd(), filePath);
                state[normalizedPath] = true;
                saveState(state);
            }
            process.stdout.write(JSON.stringify({})); // Success response
            break;

        case 'BeforeAgent':
            // 檢查是否需要同步提醒
            const codeChanged = state['.spec/CODE.md'];
            const docsUpdated = state['.spec/TEST.md'] || state['.spec/SPEC.md'] || state['GEMINI.md'];

            let additionalContext = "";
            if (codeChanged && !docsUpdated) {
                additionalContext = "⚠️ 系統提示：偵測到你修改了 .spec/CODE.md，但尚未更新 TEST.md 或 GEMINI.md。請確保在完成任務前，同步更新相關測試與規格文件，以符合專案 TDD 規範。";
            }

            process.stdout.write(JSON.stringify({
                hookSpecificOutput: {
                    hookEventName: "BeforeAgent",
                    additionalContext: additionalContext
                }
            }));
            break;

        case 'AfterAgent':
            // 強制驗證同步狀態
            const hasCodeChange = state['.spec/CODE.md'];
            const hasDocUpdate = state['.spec/TEST.md'] || state['.spec/SPEC.md'] || state['.spec/PRD.md'] || state['GEMINI.md'];

            if (hasCodeChange && !hasDocUpdate) {
                // 阻擋回合結束
                process.stdout.write(JSON.stringify({
                    decision: "block",
                    reason: "文件同步失敗！偵測到代碼變更，但缺乏對應的 TEST.md 或 GEMINI.md 更新。請補齊相關文檔後再結束回合。",
                    systemMessage: "🔄 觸發自動同步流程：請更新文件"
                }));
            } else {
                // 通過，清空狀態
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
