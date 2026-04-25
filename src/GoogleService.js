export const GoogleService = {
    async translate(textOrArray) {
        const isArray = Array.isArray(textOrArray);
        const texts = isArray ? textOrArray : [textOrArray];
        
        // 為了簡單起見並確保穩定性，我們對批次中的每個項目發起獨立請求
        // 因為 Google 免費接口對單一字串的支援最穩定
        const results = await Promise.all(texts.map(text => this.fetchTranslation(text)));
        
        return isArray ? results : results[0];
    },

    async fetchTranslation(text) {
        return new Promise((resolve, reject) => {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-TW&dt=t&q=${encodeURIComponent(text)}`;
            
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                timeout: 10000,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            const data = JSON.parse(response.responseText);
                            // Google Translate 返回格式為 [[[translation, original, ...], ...], ...]
                            const translatedText = data[0].map(item => item[0]).join('');
                            resolve(translatedText);
                        } catch (e) {
                            reject(new Error("Google JSON 解析失敗"));
                        }
                    } else {
                        reject(new Error(`Google API 錯誤: ${response.status}`));
                    }
                },
                ontimeout: function() { reject(new Error("Google API 超時")); },
                onerror: function() { reject(new Error("Google 網路請求失敗")); }
            });
        });
    }
};
