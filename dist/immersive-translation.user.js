// ==UserScript==
// @name         極簡沉浸式翻譯 (Gemini API 專用版)
// @namespace    https://github.com/yolo-cat/mini-translation
// @version      1.2.1
// @description  使用自備 Gemini API 實現沉浸式上下對照翻譯，具備物理沙盒隔離防外洩保護
// @author       Gemini CLI
// @match        *://*/*
// @connect      generativelanguage.googleapis.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @license      MIT
// @run-at       document-idle
// @supportURL   https://github.com/yolo-cat/mini-translation/issues
// @updateURL    https://raw.githubusercontent.com/yolo-cat/mini-translation/main/dist/immersive-translation.user.js
// @downloadURL  https://raw.githubusercontent.com/yolo-cat/mini-translation/main/dist/immersive-translation.user.js
// ==/UserScript==

var ImmersiveTranslation = (() => {
  // src/config.js
  var DEFAULT_CONFIG = {
    api_key: "請在此填入您的_Google_API_KEY",
    base_url: "https://generativelanguage.googleapis.com/v1beta/models",
    model_name: "gemini-flash-lite-latest",
    system_prompt: "Translate the input array of texts into Traditional Chinese. Return ONLY a JSON array of strings, where each string is the translation of the corresponding input text. Maintain the exact same order. No explanation, no markdown blocks, just the raw JSON array."
  };

  // src/LlmService.js
  var LlmService = {
    async translate(textOrArray) {
      const config = GM_getValue("IMMERSIVE_CONFIG", DEFAULT_CONFIG);
      const inputText = Array.isArray(textOrArray) ? JSON.stringify(textOrArray) : textOrArray;
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "POST",
          url: `${config.base_url}/${config.model_name}:generateContent?key=${config.api_key}`,
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 1e4,
          data: JSON.stringify({
            system_instruction: {
              parts: [{ text: config.system_prompt }]
            },
            contents: [{
              parts: [{ text: inputText }]
            }],
            generationConfig: {
              temperature: 0,
              response_mime_type: "application/json"
            }
          }),
          onload: function(response) {
            if (response.status === 200) {
              try {
                const data = JSON.parse(response.responseText);
                let translatedContent = data.candidates[0].content.parts[0].text;
                try {
                  const parsed = JSON.parse(translatedContent);
                  resolve(parsed);
                } catch (e) {
                  resolve(translatedContent.trim());
                }
              } catch (e) {
                reject(new Error("JSON 解析失敗"));
              }
            } else {
              reject(new Error(`API 錯誤: ${response.status}`));
            }
          },
          ontimeout: function() {
            reject(new Error("Timeout after 10000ms"));
          },
          onerror: function(err) {
            reject(new Error("網路請求失敗"));
          }
        });
      });
    }
  };

  // src/DomManager.js
  var DomManager = {
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
      return Array.from(document.querySelectorAll("p")).filter((p) => {
        const text = p.innerText.trim();
        return text.length > 20 && !p.dataset.translated;
      });
    },
    injectTranslation(originNode, translationText) {
      if (!originNode) return;
      const translationNode = document.createElement("div");
      translationNode.className = "immersive-translate-node";
      translationNode.textContent = translationText;
      originNode.parentNode.insertBefore(translationNode, originNode.nextSibling);
      originNode.dataset.translated = "true";
    },
    setLoadingState(originNode, isLoading) {
      if (!originNode) return;
      if (isLoading) {
        originNode.classList.add("immersive-translate-loading");
      } else {
        originNode.classList.remove("immersive-translate-loading");
      }
    }
  };

  // src/UiController.js
  var UiController = {
    initFloatButton() {
      DomManager.init();
      const config = GM_getValue("IMMERSIVE_CONFIG", DEFAULT_CONFIG);
      const pos = GM_getValue("IMMERSIVE_POS", { x_percent: 90, y_percent: 85 });
      GM_registerMenuCommand("⚙️ 設定 API 密鑰", () => {
        const currentConfig = GM_getValue("IMMERSIVE_CONFIG", DEFAULT_CONFIG);
        const key = prompt("請輸入您的 Google Gemini API Key:", currentConfig.api_key);
        if (key) {
          currentConfig.api_key = key;
          GM_setValue("IMMERSIVE_CONFIG", currentConfig);
        }
      });
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
      const btn = document.createElement("div");
      btn.id = "immersive-translate-btn";
      btn.innerText = "譯";
      btn.style.left = `${pos.x_percent}%`;
      btn.style.top = `${pos.y_percent}%`;
      document.body.appendChild(btn);
      this.bindDragEvents(btn);
      btn.addEventListener("click", () => {
        if (!btn.dataset.dragging) {
          this.executeTranslation();
        }
      });
    },
    bindDragEvents(btn) {
      let isDragging = false;
      btn.addEventListener("mousedown", (e) => {
        isDragging = false;
        btn.dataset.dragging = "";
        e.preventDefault();
        const shiftX = e.clientX - btn.getBoundingClientRect().left;
        const shiftY = e.clientY - btn.getBoundingClientRect().top;
        const onMouseMove = (e2) => {
          isDragging = true;
          btn.dataset.dragging = "true";
          const x_percent = Math.min(Math.max(0, (e2.clientX - shiftX) / window.innerWidth * 100), 95);
          const y_percent = Math.min(Math.max(0, (e2.clientY - shiftY) / window.innerHeight * 100), 95);
          btn.style.left = x_percent + "%";
          btn.style.top = y_percent + "%";
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", () => {
          document.removeEventListener("mousemove", onMouseMove);
          if (isDragging) {
            const finalX = parseFloat(btn.style.left);
            const finalY = parseFloat(btn.style.top);
            GM_setValue("IMMERSIVE_POS", { x_percent: finalX, y_percent: finalY });
            setTimeout(() => {
              delete btn.dataset.dragging;
            }, 50);
          } else {
            delete btn.dataset.dragging;
          }
        }, { once: true });
      });
    },
    isTranslating: false,
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
      this.isTranslating = true;
      const batchSize = 5;
      try {
        for (let i = 0; i < paragraphs.length; i += batchSize) {
          const batch = paragraphs.slice(i, i + batchSize);
          batch.forEach((p) => DomManager.setLoadingState(p, true));
          let retryCount = 0;
          const maxRetries = 1;
          while (retryCount <= maxRetries) {
            try {
              const textsToTranslate = batch.map((p) => p.innerText.trim());
              const results = await LlmService.translate(textsToTranslate);
              if (Array.isArray(results)) {
                batch.forEach((p, index) => {
                  if (results[index]) {
                    DomManager.injectTranslation(p, results[index]);
                  }
                });
              } else if (typeof results === "string" && batch.length === 1) {
                DomManager.injectTranslation(batch[0], results);
              }
              break;
            } catch (error) {
              if (error.message.includes("429") && retryCount < maxRetries) {
                console.warn(`[Immersive Translation] 觸發頻率限制，等待 10 秒後重試... (${retryCount + 1}/${maxRetries})`);
                await new Promise((r) => setTimeout(r, 1e4));
                retryCount++;
              } else {
                console.error("[Immersive Translation] 批次翻譯失敗:", error);
                break;
              }
            }
          }
          batch.forEach((p) => DomManager.setLoadingState(p, false));
          if (i + batchSize < paragraphs.length) {
            await new Promise((r) => setTimeout(r, 4e3));
          }
        }
      } finally {
        this.isTranslating = false;
      }
    }
  };

  // src/index.js
  (function() {
    "use strict";
    UiController.initFloatButton();
  })();
})();
