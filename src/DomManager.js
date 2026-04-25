export const DomManager = {
    extractParagraphs() {
        return Array.from(document.querySelectorAll('p')).filter(p => {
            const text = p.innerText.trim();
            return text.length > 20 && !p.dataset.translated;
        });
    },

    injectTranslation(originNode, translationText) {
        const translationNode = document.createElement('div');
        translationNode.className = 'immersive-translate-node';
        // 強制使用 textContent 物理防禦，杜絕 XSS 注入攻擊
        translationNode.textContent = translationText;
          
        // 注入沉浸式對照樣式
        translationNode.style.color = '#6b7280';
        translationNode.style.fontSize = '0.95em';
        translationNode.style.marginTop = '4px';
        translationNode.style.marginBottom = '12px';

        originNode.parentNode.insertBefore(translationNode, originNode.nextSibling);
        originNode.dataset.translated = "true";
    },

    setLoadingState(originNode, isLoading) {
        originNode.style.opacity = isLoading ? '0.5' : '1';
    }
};
