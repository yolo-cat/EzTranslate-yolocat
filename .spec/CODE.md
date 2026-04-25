## **Step 4 MVP Coding**

**遵循：[SPEC.md](http://SPEC.md) / [SPEC.md](http://SPEC.md) / [TEST.md](http://TEST.md)**

This provides the complete code for the first version of the immersive translation script using the Gemini API.

The code seamlessly integrates with Google's official Gemini 2.5/3.1 series routing. It defaults to **gemini-2.5-flash-lite**, which offers the best performance for translating large amounts of web content. The code also includes TDD security isolation and a fail-safe five-second timeout. \[1, 2\]

## ---

**🛠️ Core Code for Google Gemini Integration**

To use this code:

1. Add a new script in your Tampermonkey extension.  
2. Replace the existing code with the following code:

*`// ==UserScript==`*  
*`// @name         極簡沉浸式翻譯 (Gemini API 專用版)`*  
*`// @namespace    http://tampermonkey.net`*  
*`// @version      1.1`*  
*`// @description  使用自備 Gemini API 實現沉浸式上下對照翻譯，具備物理沙盒隔離防外洩保護`*  
*`// @match        *://*/*`*  
*`// @connect      generativelanguage.googleapis.com`*  
*`// @grant        GM_xmlhttpRequest`*  
*`// @grant        GM_setValue`*  
*`// @grant        GM_getValue`*  
*`// @grant        GM_registerMenuCommand`*  
*`// ==/UserScript==`*

`(function() {`  
    `'use strict';`

    `// ==========================================`  
    `// 1. Data Schema & Config (SDD 規格)`  
    `// ==========================================`  
    `const DEFAULT_CONFIG = {`  
        `api_key: "請在此填入您的_Google_API_KEY",`  
        `base_url: "https://generativelanguage.googleapis.com/v1beta/models", // Gemini 專屬路徑`  
        `model_name: "gemini-2.5-flash-lite", // 亦可手動更改為 gemini-3.1-flash-lite-preview`  
        `system_prompt: "You are a professional translator. Translate the following text into Traditional Chinese. Maintain the original meaning and tone."`  
    `};`

    `const config = GM_getValue("IMMERSIVE_CONFIG", DEFAULT_CONFIG);`  
    `const pos = GM_getValue("IMMERSIVE_POS", { x_percent: 90, y_percent: 85 });`

    `// 註冊油猴選單，方便點擊設定 API`  
    `GM_registerMenuCommand("設定 API 密鑰", () => {`  
        `const key = prompt("請輸入您的 Google Gemini API Key:", config.api_key);`  
        `if (key) { config.api_key = key; GM_setValue("IMMERSIVE_CONFIG", config); }`  
    `});`

    `// ==========================================`  
    `// 2. LlmService (TDD 物理隔離 & 5秒超時防禦)`  
    `// ==========================================`  
    `const LlmService = {`  
        `async translate(text) {`  
            `return new Promise((resolve, reject) => {`  
                `// 使用 GM_xmlhttpRequest 原生 timeout 與物理隔離，防範 API 外洩`  
                `GM_xmlhttpRequest({`  
                    `method: "POST",`  
                    ``url: `${config.base_url}/${config.model_name}:generateContent?key=${config.api_key}`,``  
                    `headers: {`  
                        `"Content-Type": "application/json"`  
                    `},`  
                    `timeout: 5000,`  
                    `data: JSON.stringify({`  
                        `contents: [{`  
                            ``parts: [{ text: `${config.system_prompt}\n\n請翻譯以下這段文字：\n${text}` }]``  
                        `}],`  
                        `generationConfig: {`  
                            `temperature: 0.3`  
                        `}`  
                    `}),`  
                    `onload: function(response) {`  
                        `if (response.status === 200) {`  
                            `try {`  
                                `const data = JSON.parse(response.responseText);`  
                                `// 解析 Google Gemini 回傳的 JSON 深度結構`  
                                `const translatedText = data.candidates[0].content.parts[0].text;`  
                                `resolve(translatedText.trim());`  
                            `} catch (e) {`   
                                `reject(new Error("JSON 解析失敗"));`   
                            `}`  
                        `} else {`  
                            ``reject(new Error(`API 錯誤: ${response.status}`));``  
                        `}`  
                    `},`  
                    `ontimeout: function() { reject(new Error("Timeout after 5000ms")); },`  
                    `onerror: function(err) { reject(new Error("網路請求失敗")); }`  
                `});`  
            `});`  
        `}`  
    `};`

    `// ==========================================`  
    `// 3. DomManager (TDD 輸出防護與對照渲染)`  
    `// ==========================================`  
    `const DomManager = {`  
        `extractParagraphs() {`  
            `return Array.from(document.querySelectorAll('p')).filter(p => {`  
                `const text = p.innerText.trim();`  
                `return text.length > 20 && !p.dataset.translated;`  
            `});`  
        `},`

        `injectTranslation(originNode, translationText) {`  
            `const translationNode = document.createElement('div');`  
            `translationNode.className = 'immersive-translate-node';`  
            `// 強制使用 textContent 物理防禦，杜絕 XSS 注入攻擊`  
            `translationNode.textContent = translationText;`  
              
            `// 注入沉浸式對照樣式`  
            `translationNode.style.color = '#6b7280';`   
            `translationNode.style.fontSize = '0.95em';`  
            `translationNode.style.marginTop = '4px';`  
            `translationNode.style.marginBottom = '12px';`

            `originNode.parentNode.insertBefore(translationNode, originNode.nextSibling);`  
            `originNode.dataset.translated = "true";`  
        `},`

        `setLoadingState(originNode, isLoading) {`  
            `originNode.style.opacity = isLoading ? '0.5' : '1';`  
        `}`  
    `};`

    `// ==========================================`  
    `// 4. UiController (懸浮球渲染與點擊觸發)`  
    `// ==========================================`  
    `const UiController = {`  
        `initFloatButton() {`  
            `const btn = document.createElement('div');`  
            `btn.innerText = '譯';`  
            `` btn.style.cssText = ` ``  
                `position: fixed; left: ${pos.x_percent}%; top: ${pos.y_percent}%;`  
                `width: 40px; height: 40px; background: #2563eb; color: white;`  
                `border-radius: 50%; display: flex; align-items: center; justify-content: center;`  
                `cursor: pointer; z-index: 999999; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);`  
                `user-select: none; font-weight: bold; font-family: sans-serif;`  
            `` `; ``  
            `document.body.appendChild(btn);`

            `let isDragging = false;`  
            `btn.addEventListener('mousedown', (e) => {`  
                `isDragging = false;`  
                `e.preventDefault(); // 防止拖曳時選取到網頁文字`  
                `const shiftX = e.clientX - btn.getBoundingClientRect().left;`  
                `const shiftY = e.clientY - btn.getBoundingClientRect().top;`

                `function moveAt(pageX, pageY) {`  
                    `isDragging = true;`  
                    `const x_percent = Math.min(Math.max(0, (pageX - shiftX) / window.innerWidth * 100), 95);`  
                    `const y_percent = Math.min(Math.max(0, (pageY - shiftY) / window.innerHeight * 100), 95);`  
                    `btn.style.left = x_percent + '%';`  
                    `btn.style.top = y_percent + '%';`  
                `}`

                `function onMouseMove(e) { moveAt(e.clientX, e.clientY); }`  
                `document.addEventListener('mousemove', onMouseMove);`

                `document.addEventListener('mouseup', function onMouseUp(e) {`  
                    `document.removeEventListener('mousemove', onMouseMove);`  
                    `document.removeEventListener('mouseup', onMouseUp);`  
                      
                    `if (isDragging) {`  
                        `const finalX = parseFloat(btn.style.left);`  
                        `const finalY = parseFloat(btn.style.top);`  
                        `GM_setValue("IMMERSIVE_POS", { x_percent: finalX, y_percent: finalY });`  
                    `}`  
                `});`  
            `});`

            `btn.addEventListener('click', () => {`  
                `if (!isDragging) { this.executeTranslation(); }`  
            `});`  
        `},`

        `async executeTranslation() {`  
            `const paragraphs = DomManager.extractParagraphs();`  
            `if (paragraphs.length === 0) { alert("沒有發現需要翻譯的新段落！"); return; }`

            `for (const p of paragraphs) {`  
                `DomManager.setLoadingState(p, true);`  
                `try {`  
                    `const translatedText = await LlmService.translate(p.innerText.trim());`  
                    `DomManager.injectTranslation(p, translatedText);`  
                `} catch (error) {`  
                    `console.error("翻譯失敗:", error);`  
                    `// 安全失敗 (Fail-safe)：失敗時保留原文不做任何更動`  
                `} finally {`  
                    `DomManager.setLoadingState(p, false);`  
                `}`  
            `}`  
        `}`  
    `};`

    `// 啟動腳本`  
    `UiController.initFloatButton();`  
`})();`

## ---

**🎬 Deployment and Testing**

1. **Obtain a Gemini API Key** from Google AI Studio, which may be free or low-cost.  
2. Add the script to your Tampermonkey and **save it**.  
3. Refresh any English webpage you want to translate (e.g., Wikipedia). Click the Tampermonkey icon in your browser and select "設定 API 密鑰" to enter your key.  
4. Click the "譯" button in the lower right corner of the webpage to experience the low-latency, high-protection immersive translation. \[3\]