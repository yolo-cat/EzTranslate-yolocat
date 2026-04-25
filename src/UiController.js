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

        // 使用 GM_addStyle 定義按鈕與 Toast 樣式
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
            .immersive-translate-toast {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(31, 41, 55, 0.9);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 13px;
                z-index: 2147483647;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                pointer-events: none;
                transition: opacity 0.3s;
                font-family: system-ui, -apple-system, sans-serif;
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

    isTranslating: false,

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'immersive-translate-toast';
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    async executeTranslation() {
        if (this.isTranslating) {
            console.log("Translation already in progress, skipping...");
            return;
        }

        const paragraphs = DomManager.extractParagraphs();
        if (paragraphs.length === 0) {
            console.log("No new paragraphs found to translate.");
            return;
        }

        const engineName = LlmService.getEngineName();
        this.showToast(`目前使用：${engineName}`);

        this.isTranslating = true;
        const batchSize = 5;

        try {
            for (let i = 0; i < paragraphs.length; i += batchSize) {
                const batch = paragraphs.slice(i, i + batchSize);
                batch.forEach(p => DomManager.setLoadingState(p, true));

                let retryCount = 0;
                const maxRetries = 1;

                while (retryCount <= maxRetries) {
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
                        break; // 成功則跳出重試迴圈
                    } catch (error) {
                        if (error.message.includes("429") && retryCount < maxRetries) {
                            console.warn(`[Immersive Translation] 觸發頻率限制，等待 10 秒後重試... (${retryCount + 1}/${maxRetries})`);
                            await new Promise(r => setTimeout(r, 10000));
                            retryCount++;
                        } else {
                            console.error("[Immersive Translation] 批次翻譯失敗:", error);
                            break;
                        }
                    }
                }

                batch.forEach(p => DomManager.setLoadingState(p, false));

                // 增加延遲以符合 15 RPM 限制 (60/15 = 4s)
                if (i + batchSize < paragraphs.length) {
                    await new Promise(r => setTimeout(r, 4000));
                }
            }
        } finally {
            this.isTranslating = false;
        }
    }
};
