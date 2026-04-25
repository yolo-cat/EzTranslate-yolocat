import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { GoogleService } from '../src/GoogleService.js';

describe('GoogleService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('當 Google API 回傳 HTTP 200，應正確解析並返回翻譯文字', async () => {
        // Google Translate 返回格式
        const mockResponse = [[["你好", "Hello", null, null, 1]], null, "en"];
        global.GM_xmlhttpRequest.mockImplementation(({ onload }) => {
            onload({ status: 200, responseText: JSON.stringify(mockResponse) });
        });

        const result = await GoogleService.translate("Hello");
        expect(result).toBe("你好");
    });

    test('當輸入為陣列時，應發起多個請求並返回陣列', async () => {
        const mockResponse1 = [[["你好", "Hello", null, null, 1]], null, "en"];
        const mockResponse2 = [[["世界", "World", null, null, 1]], null, "en"];
        
        let callCount = 0;
        global.GM_xmlhttpRequest.mockImplementation(({ onload }) => {
            const resp = callCount === 0 ? mockResponse1 : mockResponse2;
            callCount++;
            onload({ status: 200, responseText: JSON.stringify(resp) });
        });

        const result = await GoogleService.translate(["Hello", "World"]);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual(["你好", "世界"]);
        expect(global.GM_xmlhttpRequest).toHaveBeenCalledTimes(2);
    });
});
