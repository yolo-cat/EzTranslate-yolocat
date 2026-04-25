import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { LlmService } from '../src/LlmService.js';
import { GoogleService } from '../src/GoogleService.js';

describe('LlmService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.GM_getValue.mockReturnValue({
            api_key: "test_key",
            base_url: "https://api.test",
            model_name: "test_model",
            system_prompt: "test_prompt"
        });
    });

    test('當 API Key 缺失時，應自動路由至 GoogleService', async () => {
        global.GM_getValue.mockReturnValue({
            api_key: "請在此填入您的_Google_API_KEY"
        });
        const spy = jest.spyOn(GoogleService, 'translate').mockResolvedValue("Google 翻譯");

        const result = await LlmService.translate("Hello");
        
        expect(spy).toHaveBeenCalledWith("Hello");
        expect(result).toBe("Google 翻譯");
        spy.mockRestore();
    });

    test('當 API 回傳 HTTP 200，應正確解析並返回翻譯文字（單一字串）', async () => {
        const mockResponse = { candidates: [{ content: { parts: [{ text: "你好" }] } }] };
        global.GM_xmlhttpRequest.mockImplementation(({ onload }) => {
            onload({ status: 200, responseText: JSON.stringify(mockResponse) });
        });

        const result = await LlmService.translate("Hello");
        expect(result).toBe("你好");
    });

    test('當 API 回傳 HTTP 200 且為 JSON 陣列，應正確解析並返回陣列（批次翻譯）', async () => {
        const mockResponse = { 
            candidates: [{ 
                content: { 
                    parts: [{ 
                        text: JSON.stringify(["你好", "世界"]) 
                    }] 
                } 
            }] 
        };
        global.GM_xmlhttpRequest.mockImplementation(({ onload }) => {
            onload({ status: 200, responseText: JSON.stringify(mockResponse) });
        });

        const result = await LlmService.translate(["Hello", "World"]);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual(["你好", "世界"]);
    });

    test('當 API 請求超過 10000ms，應拋出超時 Error', async () => {
        global.GM_xmlhttpRequest.mockImplementation(({ ontimeout }) => {
            ontimeout();
        });

        await expect(LlmService.translate("Hello")).rejects.toThrow("Timeout after 10000ms");
    });

    test('資安防禦：API 傳輸必須使用油猴沙盒，絕對禁止調用原生 window.fetch', async () => {
        const spyFetch = jest.fn();
        global.fetch = spyFetch;

        global.GM_xmlhttpRequest.mockImplementation(({ onload }) => {
            onload({ status: 200, responseText: JSON.stringify({ candidates: [{ content: { parts: [{ text: "你好" }] } }] }) });
        });

        await LlmService.translate("Hello");
        expect(spyFetch).not.toHaveBeenCalled();
    });
});
