const fs = require('fs');
const path = require('path');

/**
 * Gemini CLI Hook: Sync Check (Dual-Track Architecture)
 * 負責守護雙層文檔架構：
 * 1. 專案框架 (Project Framework): 結構變更必須同步至 GEMINI.md
 * 2. 開發方向 (Development Sync): 代碼變更必須回歸 .spec/PRD.md，並在 .spec/ 中漸進揭露
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
    try {
        return input ? JSON.parse(input) : {};
    } catch (e) {
        return {};
    }
}

const event = process.argv[2];

// 判斷某個檔案是否匹配前綴
function hasPrefix(state, prefix) {
    return Object.keys(state).some(file => file.startsWith(prefix));
}

async function main() {
    const input = await getStdin();
    let state = readState();

    switch (event) {
        case 'AfterTool':
            const filePath = input?.args?.file_path;
            if (filePath) {
                const normalizedPath = path.relative(process.cwd(), filePath).replace(/^\.\//, '');
                state[normalizedPath] = true;
                saveState(state);
            }
            process.stdout.write(JSON.stringify({}));
            break;

        case 'BeforeAgent':
            // 軌道 A: 專案框架變更 (Project Framework)
            const hasFrameworkChange = state['package.json'] || state['build.js'] || state['jest.config.cjs'] || hasPrefix(state, '.gemini/hooks/');
            const frameworkUpdated = state['GEMINI.md'];

            // 軌道 B: 開發代碼變更 (Development Sync)
            const hasCodeChange = state['.spec/CODE.md'] || hasPrefix(state, 'src/') || hasPrefix(state, 'tests/');
            const specUpdated = state['.spec/PRD.md'] || state['.spec/SPEC.md'] || state['.spec/TEST.md'] || state['.spec/session_log.md'];

            let additionalContext = "";
            if (hasFrameworkChange && !frameworkUpdated) {
                additionalContext += "⚠️ 系統提示：偵測到專案結構變更。請確保 GEMINI.md 已同步更新以反映最新專案框架。\n";
            }
            if (hasCodeChange && !specUpdated) {
                additionalContext += "⚠️ 系統提示：偵測到代碼變更。請依據 .spec/PRD.md 的業務邏輯，漸進式更新 SPEC.md, TEST.md 或 session_log.md。\n";
            }

            process.stdout.write(JSON.stringify({
                hookSpecificOutput: {
                    hookEventName: "BeforeAgent",
                    additionalContext: additionalContext.trim()
                }
            }));
            break;

        case 'AfterAgent':
            // 軌道 A: 專案框架變更 (Project Framework)
            const frameworkChange = state['package.json'] || state['build.js'] || state['jest.config.cjs'] || hasPrefix(state, '.gemini/hooks/');
            const frameworkSync = state['GEMINI.md'];

            // 軌道 B: 開發代碼變更 (Development Sync)
            const codeChange = state['.spec/CODE.md'] || hasPrefix(state, 'src/') || hasPrefix(state, 'tests/');
            const specSync = state['.spec/PRD.md'] || state['.spec/SPEC.md'] || state['.spec/TEST.md'] || state['.spec/session_log.md'];

            // 優先處理框架級別的失步
            if (frameworkChange && !frameworkSync) {
                process.stdout.write(JSON.stringify({
                    decision: "block",
                    reason: "@generalist 偵測到專案結構、依賴或 Hook 工具鏈發生變更，但作為專案戰略地圖的 `GEMINI.md` 未能同步更新。請審核這些結構性變更，並強制要求開發者將新的環境配置或工具鏈決策寫入 `GEMINI.md`，以維持專案總覽的絕對準確性。",
                    systemMessage: "🚀 正在啟動「專案框架 (Project Framework)」同步審核..."
                }));
                return;
            }

            // 接著處理開發級別的失步
            if (codeChange && !specSync) {
                process.stdout.write(JSON.stringify({
                    decision: "block",
                    reason: "@generalist 偵測到原始碼 (`src/` 或 `CODE.md`) 發生變更，但未能在 `.spec/` 目錄下留下任何漸進式的紀錄。請以 `.spec/PRD.md` 為最高業務準則審核此代碼變更：\n1. 若為重大邏輯更動，請要求同步修改 `SPEC.md` 或 `TEST.md`。\n2. 若為微小修正或一般重構，請要求至少在 `session_log.md` 中補齊開發歷程。\n3. 若判斷完全不需任何紀錄，請回覆『ALLOW_TRIVIAL_CHANGE』放行。",
                    systemMessage: "🚀 正在啟動「開發方向與漸進揭露 (Development Sync)」審核..."
                }));
                return;
            }

            // 雙軌皆通過
            saveState({});
            process.stdout.write(JSON.stringify({
                decision: "continue"
            }));
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
