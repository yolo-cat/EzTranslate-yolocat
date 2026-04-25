## **Step 2 規格書**

**遵循：[PRD.md](http://PRD.md)**  
**協同：[TEST.md](http://TEST.md)**

這份規格書嚴格遵循 SDD（系統設計文件）模式，將資料結構、API 接口與元件職責進行了嚴謹的定義，並將我們剛剛確認的「百分比座標」與「5秒超時」完整收錄，確保代碼具備極高的**可測性（Testability）**。

## ---

**📐 油猴腳本「沉浸式翻譯」第一階段：規格書 (Spec)**

## **📊 1\. Data Schema（資料模型與儲存規格）**

腳本必須持久化儲存使用者配置與懸浮球位置。資料儲存採用 GM\_getValue 與 GM\_setValue 達成。

## **1.1 使用者配置 (Key: IMMERSIVE\_CONFIG)**

`type: object`  
`required:`  
  `- api_key`  
  `- base_url`  
  `- model_name`  
`properties:`  
  `api_key:`  
    `type: string`  
    `description: "使用者的 LLM API 密鑰"`  
    `example: "sk-..."`  
  `base_url:`  
    `type: string`  
    `description: "LLM API 的基礎網址"`  
    `default: "https://generativelanguage.googleapis.com/v1beta/models"`  
  `model_name:`  
    `type: string`  
    `description: "指定的模型名稱"`  
    `default: "gemini-flash-lite-latest"`  
  `system_prompt:`  
    `type: string`  
    `description: "發送給 LLM 的翻譯指導語"`  
    `default: "Translate the input to Traditional Chinese. Output ONLY the translation. No preamble, no explanation, no chat."`

## **1.2 懸浮球位置 (Key: IMMERSIVE\_POS)**

`type: object`  
`required:`  
  `- x_percent`  
  `- y_percent`  
`properties:`  
  `x_percent:`  
    `type: number`  
    `description: "懸浮球中心點距離瀏覽器視窗左側的百分比（0-100）"`  
    `default: 90`  
  `y_percent:`  
    `type: number`  
    `description: "懸浮球中心點距離瀏覽器視窗頂部的百分比（0-100）"`  
    `default: 85`

## ---

**🔌 2\. API Interface（LLM 請求規格）**

腳本封裝的純函數 callLlmApi 介面規格如下，底層由 GM\_xmlhttpRequest 實現跨域請求。

## **2.1 請求定義**

* **Method**: POST  
* **URL**: {Config.base\_url}/{Config.model_name}:generateContent?key={Config.api_key}  
* **Timeout**: 5000 (5 秒，使用 GM_xmlhttpRequest 原生 timeout 屬性，超時即視為失敗並觸發 Fail-safe) [agile3uncles]

## **2.2 請求標頭與權限 (Headers & Permissions)**

* **Required Permission**: `@connect generativelanguage.googleapis.com`, `@connect translate.googleapis.com`
* **Content-Type**: `application/json` (Gemini) / `application/x-www-form-urlencoded` (Google)

## **2.3 請求本體 (Body)**

`type: object`  
`properties:`  
  `model: "{Config.model_name}"`  
  `system_instruction:`
    `parts:`
      `- text: "{Config.system_prompt}"`
  `contents:`  
    `- parts:`  
      `- text: "{JSON_stringified_paragraphs_or_single_text}"`  
  `generationConfig:`
    `temperature: 0.0`
    `response_mime_type: "application/json"`

## **2.4 預期響應 (Response)**

* **成功 (200 OK)**：回傳 HTTP 200，腳本將解析 JSON 並提取 `.candidates[0].content.parts[0].text`。由於設定了 `response_mime_type`，該內容應為可解析的 JSON 陣列。
* **失敗 (非 200、超時或 onerror)**：callLlmApi 函數應立即拋出 Error 異常並觸發 Fail-safe。

## ---

**🏗️ 3\. Component Spec（元件介面與職責）**

為了提升單元測試的可行性，系統切分為 3 個高內聚、低耦合的核心元件 \[agile3uncles\]：

## **🛠️ 3.1 元件 A：LlmService（核心翻譯路由）**

負責管理翻譯引擎的分流與通訊，內部不含任何 DOM 操作。

* **getEngineName(): string**
  * **邏輯**：檢查 `api_key` 是否為預設值。如果是，返回 "Google 機器翻譯"；否則返回 "Gemini API"。
* **translate(textOrArray: string | string[]): Promise<string | string[]>**  
  * **邏輯**：若 `api_key` 為預設值，轉發請求至 `GoogleService`；否則使用 Gemini API。
  * **輸入**：待翻譯的純文字或字串陣列。  
  * **輸出**：翻譯後的字串或字串陣列。

## **🛠️ 3.2 元件 B：GoogleService（Google 備援引擎）**

負責與 Google Translate 免費接口通訊。

* **translate(textOrArray: string | string[]): Promise<string | string[]>**
  * **邏輯**：調用 Google Translate 單一翻譯接口。若輸入為陣列，則併發發送請求並匯整結果。

## **🎨 3.3 元件 C：DomManager（網頁節點操作）**

負責網頁解析與譯文 DOM 注入。

* **extractParagraphs(): HTMLElement\[\]**  
  * **輸出**：抓取網頁中所有待翻譯的 \<p\> 節點。  
* **injectTranslation(originNode: HTMLElement, translation: string): void**  
  * **輸入**：原生節點、翻譯結果。  
  * **邏輯**：在原生節點正下方插入一個 \<div\>（帶有 CSS Class .immersive-translate-node），並將透明度設為 100%。  
* **setLoadingState(originNode: HTMLElement, isLoading: boolean): void**  
  * **邏輯**：當為 true 時，降低原生節點透明度至 0.5 提示翻譯中；為 false 時恢復為 1。

## **🕹️ 3.3 元件 C：UiController（UI 元件與事件）**

負責懸浮球渲染與拖曳位置持久化。

* **initFloatButton(): void**  
  * **邏輯**：從 IMMERSIVE\_POS 讀取百分比，透過 fixed 定位渲染圓形懸浮球。  
* **bindDragEvents(): void**  
  * **邏輯**：監聽懸浮球的 mousedown、mousemove 與 mouseup 事件，於放開鼠標時計算當前百分比位置，並寫入 IMMERSIVE\_POS。  
* **executeTranslation(): Promise<void>**  
  * **邏輯**：當使用者點擊按鈕時，抓取段落並以「5 個為一組」進行批次翻譯。
  * **提示**：開始時呼叫 `showToast` 顯示目前使用的翻譯引擎（由 `LlmService.getEngineName()` 取得）。
  * **細節**：翻譯時需設置 Loading 狀態，完成後呼叫 DomManager 注入結果。批次間建議增加 4 秒延遲以規避 Gemini API 的 429 錯誤。

* **showToast(message: string): void**
  * **邏輯**：在畫面中央下方彈出一個半透明提示框，顯示訊息 2 秒後自動消失。

---

