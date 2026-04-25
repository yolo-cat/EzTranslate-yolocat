import { DEFAULT_CONFIG } from './config.js';

export const LlmService = {
    async translate(text) {
        const config = GM_getValue("IMMERSIVE_CONFIG", DEFAULT_CONFIG);
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: `${config.base_url}/${config.model_name}:generateContent?key=${config.api_key}`,
                headers: {
                    "Content-Type": "application/json"
                },
                timeout: 5000,
                data: JSON.stringify({
                    contents: [{
                        parts: [{ text: `${config.system_prompt}\n\nText to translate:\n${text}` }]
                    }],
                    generationConfig: {
                        temperature: 0.3
                    }
                }),
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            const data = JSON.parse(response.responseText);
                            const translatedText = data.candidates[0].content.parts[0].text;
                            resolve(translatedText.trim());
                        } catch (e) {
                            reject(new Error("JSON 解析失敗"));
                        }
                    } else {
                        reject(new Error(`API 錯誤: ${response.status}`));
                    }
                },
                ontimeout: function() { reject(new Error("Timeout after 5000ms")); },
                onerror: function(err) { reject(new Error("網路請求失敗")); }
            });
        });
    }
};
