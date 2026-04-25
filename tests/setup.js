import { jest } from '@jest/globals';

// Mock Tampermonkey GM_* APIs
global.GM_getValue = jest.fn();
global.GM_setValue = jest.fn();
global.GM_xmlhttpRequest = jest.fn();
global.GM_registerMenuCommand = jest.fn();

// Mock window.prompt
global.prompt = jest.fn();
