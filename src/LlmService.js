import { DEFAULT_CONFIG } from './config.js';
import { GoogleService } from './GoogleService.js';

export const LlmService = {
    getEngineName() {
        const config = GM_getValue("IMMERSIVE_CONFIG", DEFAULT_CONFIG);
        if (!config.api_key || config.api_key === DEFAULT_CONFIG.api_key) {
            return "Google 機器翻譯";
        }
        return "Gemini API";
    },

    async translate(textOrArray) {
        const config = GM_getValue("IMMERSIVE_CONFIG", DEFAULT_CONFIG);
        
        // 分流邏輯：如果沒有有效 Key，使用 Google 翻譯
        if (!config.api_key || config.api_key === DEFAULT_CONFIG.api_key) {
            return GoogleService.translate(textOrArray);
        }

        const inputText = Array.isArray(textOrArray) ? JSON.stringify(textOrArray) : textOrArray;
        
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: `${config.base_url}/${config.model_name}:generateContent?key=${config.api_key}`,
                headers: {
                    "Content-Type": "application/json"
                },
                timeout: 10000,
                data: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: config.system_prompt }]
                    },
                    contents: [{
                        parts: [{ text: inputText }]
                    }],
                    generationConfig: {
                        temperature: 0.0,
                        response_mime_type: "application/json"
                    }
                }),
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            const data = JSON.parse(response.responseText);
                            let translatedContent = data.candidates[0].content.parts[0].text;
                            
                            // 嘗試解析 JSON，如果失敗則視為單一字串
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
                ontimeout: function() { reject(new Error("Timeout after 10000ms")); },
                onerror: function(err) { reject(new Error("網路請求失敗")); }
            });
        });
    }
};
