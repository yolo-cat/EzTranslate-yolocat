import { DEFAULT_CONFIG } from './config.js';
import { LlmService } from './LlmService.js';
import { DomManager } from './DomManager.js';

export const UiController = {
    initFloatButton() {
        const config = GM_getValue("IMMERSIVE_CONFIG", DEFAULT_CONFIG);
        const pos = GM_getValue("IMMERSIVE_POS", { x_percent: 90, y_percent: 85 });

        // 註冊油猴選單
        GM_registerMenuCommand("設定 API 密鑰", () => {
            const currentConfig = GM_getValue("IMMERSIVE_CONFIG", DEFAULT_CONFIG);
            const key = prompt("請輸入您的 Google Gemini API Key:", currentConfig.api_key);
            if (key) {
                currentConfig.api_key = key;
                GM_setValue("IMMERSIVE_CONFIG", currentConfig);
            }
        });

        const btn = document.createElement('div');
        btn.innerText = '譯';
        btn.style.cssText = `
            position: fixed; left: ${pos.x_percent}%; top: ${pos.y_percent}%;
            width: 40px; height: 40px; background: #2563eb; color: white;
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 999999; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            user-select: none; font-weight: bold; font-family: sans-serif;
        `;
        document.body.appendChild(btn);

        let isDragging = false;
        btn.addEventListener('mousedown', (e) => {
            isDragging = false;
            e.preventDefault();
            const shiftX = e.clientX - btn.getBoundingClientRect().left;
            const shiftY = e.clientY - btn.getBoundingClientRect().top;

            function moveAt(pageX, pageY) {
                isDragging = true;
                const x_percent = Math.min(Math.max(0, (pageX - shiftX) / window.innerWidth * 100), 95);
                const y_percent = Math.min(Math.max(0, (pageY - shiftY) / window.innerHeight * 100), 95);
                btn.style.left = x_percent + '%';
                btn.style.top = y_percent + '%';
            }

            function onMouseMove(e) { moveAt(e.clientX, e.clientY); }
            document.addEventListener('mousemove', onMouseMove);

            document.addEventListener('mouseup', function onMouseUp(e) {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                  
                if (isDragging) {
                    const finalX = parseFloat(btn.style.left);
                    const finalY = parseFloat(btn.style.top);
                    GM_setValue("IMMERSIVE_POS", { x_percent: finalX, y_percent: finalY });
                }
            });
        });

        btn.addEventListener('click', () => {
            if (!isDragging) { this.executeTranslation(); }
        });
    },

    async executeTranslation() {
        const paragraphs = DomManager.extractParagraphs();
        if (paragraphs.length === 0) { alert("沒有發現需要翻譯的新段落！"); return; }

        for (const p of paragraphs) {
            DomManager.setLoadingState(p, true);
            try {
                const translatedText = await LlmService.translate(p.innerText.trim());
                DomManager.injectTranslation(p, translatedText);
            } catch (error) {
                console.error("翻譯失敗:", error);
            } finally {
                DomManager.setLoadingState(p, false);
            }
        }
    }
};
