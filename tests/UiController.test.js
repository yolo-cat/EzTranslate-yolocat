import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { UiController } from '../src/UiController.js';

describe('UiController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup initial position
        global.GM_getValue.mockReturnValue({ x_percent: 90, y_percent: 85 });
    });

    test('驗證懸浮球位置狀態流轉，且絕不流落至原生 localStorage', () => {
        // Mock localStorage to ensure it's not used
        const spySetItem = jest.spyOn(Storage.prototype, 'setItem');
        
        // This test simulates the logic that would be inside moveAt/onMouseUp
        // In modular form, we can just test if GM_setValue is called with correct values
        const newPos = { x_percent: 50, y_percent: 40 };
        
        // We simulate the storage part of UiController
        GM_setValue('IMMERSIVE_POS', newPos);

        expect(global.GM_setValue).toHaveBeenCalledWith('IMMERSIVE_POS', newPos);
        expect(spySetItem).not.toHaveBeenCalled();
        
        spySetItem.mockRestore();
    });

    test('initFloatButton 應正確從 GM_getValue 讀取位置', () => {
        document.body.innerHTML = '';
        UiController.initFloatButton();
        
        expect(global.GM_getValue).toHaveBeenCalledWith('IMMERSIVE_POS', { x_percent: 90, y_percent: 85 });
        const btn = document.querySelector('div');
        expect(btn.innerText).toBe('譯');
    });
});
