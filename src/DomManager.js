export const DomManager = {
    init() {
        GM_addStyle(`
            .immersive-translate-node {
                color: #6b7280;
                font-size: 0.95em;
                margin-top: 4px;
                margin-bottom: 12px;
                display: block;
                transition: opacity 0.3s ease;
            }
            .immersive-translate-loading {
                opacity: 0.5;
            }
        `);
    },

    extractParagraphs() {
        return Array.from(document.querySelectorAll('p')).filter(p => {
            const text = p.innerText.trim();
            // 忽略太短的段落，通常是導覽列或裝飾性文字
            return text.length > 20 && !p.dataset.translated;
        });
    },

    injectTranslation(originNode, translationText) {
        if (!originNode) return;

        const translationNode = document.createElement('div');
        translationNode.className = 'immersive-translate-node';
        // 強制使用 textContent 物理防禦，杜絕 XSS 注入攻擊
        translationNode.textContent = translationText;
          
        originNode.parentNode.insertBefore(translationNode, originNode.nextSibling);
        originNode.dataset.translated = "true";
    },

    setLoadingState(originNode, isLoading) {
        if (!originNode) return;
        if (isLoading) {
            originNode.classList.add('immersive-translate-loading');
        } else {
            originNode.classList.remove('immersive-translate-loading');
        }
    }
};
