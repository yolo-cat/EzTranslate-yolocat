import { DEFAULT_CONFIG } from './config.js';
import { LlmService } from './LlmService.js';
import { DomManager } from './DomManager.js';

export const UiController = {
    initFloatButton() {
        DomManager.init(); // 初始化 CSS

        const config = GM_getValue("IMMERSIVE_CONFIG", DEFAULT_CONFIG);
        const pos = GM_getValue("IMMERSIVE_POS", { x_percent: 90, y_percent: 85 });

        // 註冊油猴選單
        GM_registerMenuCommand("⚙️ 設定 API 密鑰", () => {
            const currentConfig = GM_getValue("IMMERSIVE_CONFIG", DEFAULT_CONFIG);
            const key = prompt("請輸入您的 Google Gemini API Key:", currentConfig.api_key);
            if (key) {
                currentConfig.api_key = key;
                GM_setValue("IMMERSIVE_CONFIG", currentConfig);
            }
        });

        // 使用 GM_addStyle 定義按鈕樣式
        GM_addStyle(`
            #immersive-translate-btn {
                position: fixed;
                width: 44px;
                height: 44px;
                background: #2563eb;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 2147483647;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                user-select: none;
                font-weight: bold;
                font-family: system-ui, -apple-system, sans-serif;
                transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.2s;
            }
            #immersive-translate-btn:hover {
                background: #1d4ed8;
                transform: scale(1.1);
            }
            #immersive-translate-btn:active {
                transform: scale(0.95);
            }
        `);

        const btn = document.createElement('div');
        btn.id = 'immersive-translate-btn';
        btn.innerText = '譯';
        btn.style.left = `${pos.x_percent}%`;
        btn.style.top = `${pos.y_percent}%`;
        document.body.appendChild(btn);

        this.bindDragEvents(btn);

        btn.addEventListener('click', () => {
            if (!btn.dataset.dragging) {
                this.executeTranslation();
            }
        });
    },

    bindDragEvents(btn) {
        let isDragging = false;
        btn.addEventListener('mousedown', (e) => {
            isDragging = false;
            btn.dataset.dragging = "";
            e.preventDefault();
            const shiftX = e.clientX - btn.getBoundingClientRect().left;
            const shiftY = e.clientY - btn.getBoundingClientRect().top;

            const onMouseMove = (e) => {
                isDragging = true;
                btn.dataset.dragging = "true";
                const x_percent = Math.min(Math.max(0, (e.clientX - shiftX) / window.innerWidth * 100), 95);
                const y_percent = Math.min(Math.max(0, (e.clientY - shiftY) / window.innerHeight * 100), 95);
                btn.style.left = x_percent + '%';
                btn.style.top = y_percent + '%';
            };

            document.addEventListener('mousemove', onMouseMove);

            document.addEventListener('mouseup', () => {
                document.removeEventListener('mousemove', onMouseMove);
                if (isDragging) {
                    const finalX = parseFloat(btn.style.left);
                    const finalY = parseFloat(btn.style.top);
                    GM_setValue("IMMERSIVE_POS", { x_percent: finalX, y_percent: finalY });
                    // 延遲移除 dragging 標記，防止立即觸發 click
                    setTimeout(() => { delete btn.dataset.dragging; }, 50);
                } else {
                    delete btn.dataset.dragging;
                }
            }, { once: true });
        });
    },

    async executeTranslation() {
        const paragraphs = DomManager.extractParagraphs();
        if (paragraphs.length === 0) {
            console.log("No new paragraphs found to translate.");
            return;
        }

        const batchSize = 5;
        for (let i = 0; i < paragraphs.length; i += batchSize) {
            const batch = paragraphs.slice(i, i + batchSize);
            batch.forEach(p => DomManager.setLoadingState(p, true));

            try {
                const textsToTranslate = batch.map(p => p.innerText.trim());
                const results = await LlmService.translate(textsToTranslate);

                if (Array.isArray(results)) {
                    batch.forEach((p, index) => {
                        if (results[index]) {
                            DomManager.injectTranslation(p, results[index]);
                        }
                    });
                } else if (typeof results === 'string' && batch.length === 1) {
                    DomManager.injectTranslation(batch[0], results);
                }
            } catch (error) {
                console.error("[Immersive Translation] 批次翻譯失敗:", error);
            } finally {
                batch.forEach(p => DomManager.setLoadingState(p, false));
            }

            // 如果還有下一批，增加一個小的延遲以確保穩定性
            if (i + batchSize < paragraphs.length) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
};
