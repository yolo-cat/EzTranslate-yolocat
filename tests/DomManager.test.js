import { describe, test, expect } from '@jest/globals';
import { DomManager } from '../src/DomManager.js';

describe('DomManager', () => {
    test('injectTranslation 應在原生節點正下方插入獨立的對照譯文節點', () => {
        document.body.innerHTML = '<div id="art"><p id="origin">Hello</p></div>';
        const originNode = document.getElementById('origin');

        DomManager.injectTranslation(originNode, "你好");

        const translationNode = originNode.nextSibling;
        expect(translationNode.tagName).toBe('DIV');
        expect(translationNode.classList.contains('immersive-translate-node')).toBe(true);
        expect(translationNode.textContent).toBe('你好');
    });

    test('防禦 XSS：當 LLM 回傳惡意 HTML 標籤時，應被安全渲染為純文字', () => {
        const maliciousXss = "<img src=x onerror=alert(1)>";
        document.body.innerHTML = '<p id="origin">Origin</p>';
        const originNode = document.getElementById('origin');

        DomManager.injectTranslation(originNode, maliciousXss);

        const translationNode = originNode.nextSibling;
        expect(translationNode.innerHTML).not.toContain('<img');
        expect(translationNode.textContent).toBe(maliciousXss);
    });
});
