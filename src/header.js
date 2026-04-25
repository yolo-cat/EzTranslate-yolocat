// ==UserScript==
// @name         極簡沉浸式翻譯 (Gemini API 專用版)
// @namespace    https://github.com/yolo-cat/mini-translation
// @version      1.2.0
// @description  使用自備 Gemini API 實現沉浸式上下對照翻譯，具備物理沙盒隔離防外洩保護
// @author       Gemini CLI
// @match        *://*/*
// @connect      generativelanguage.googleapis.com
// @connect      translate.googleapis.com
// @connect      translate.google.com
// @connect      .googleapis.com
// @connect      .google.com
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
