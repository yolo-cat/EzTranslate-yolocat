## **Step 3 測試驅動開發（TDD）**

**遵循：[PRD.md](http://PRD.md)**  
**協同：[SPEC.md](http://SPEC.md)**

這份規劃書嚴格遵循了敏捷大叔（Agile 3 Uncles）的實踐指引：**摒棄漫長的 UI 操作流程描述，完全聚焦於狀態邊界與防禦規格**，並透過 Stub、Mock 等手段提供高度的系統可測性 \[agile3uncles\]。特別是收攏了我們最終達成的資安共識——**依賴油猴原生沙盒進行物理隔離**，避免無效的複雜前端加密 \[agile3uncles\]。

## ---

**🚦 油猴腳本「沉浸式翻譯」第一階段：TDD 規劃書**

## **📌 1\. 測試策略與環境隔離**

為提高系統可測性（Testability），本規劃書要求將**業務邏輯**、**網路請求**與**網頁 DOM** 徹底解耦 \[agile3uncles\]：

* **API 測試入口**：不發起真實跨域請求，透過模擬 GM\_xmlhttpRequest 的 Stub 進行隔離斷言 \[agile3uncles\]。  
* **DOM 測試環境**：使用記憶體中的 Virtual DOM（如 jsdom）來模擬網頁，不依賴真實瀏覽器 UI \[agile3uncles\]。  
* **不寫 UI 腳本**：所有測試僅驗證「狀態轉移」與「資料副作用」，不測試滑鼠點擊與拖曳路徑 \[agile3uncles\]。

## ---

**🧪 2\. 測試案例定義（以 Jest 偽代碼呈現）**

## **模組 A：LlmService（核心路由與 Google 備援）**

**目的**：驗證引擎自動切換、批次解析以及 10 秒超時 Fail-safe。

* **實例 A-1：Google 備援路由測試**
  test('當 API Key 缺失或為預設值時，應自動呼叫 GoogleService', async () => {
    // Given: Mock GoogleService
    // When: LlmService.translate
    // Then: 斷言 GoogleService 被調用
  });

* **實例 A-2：批次解析測試 (JSON Array)**
  test('當 Gemini 回傳 JSON 陣列字串時，應正確解析為翻譯陣列', async () => {
    // Given: Mock API 回傳 ["譯文1", "譯文2"]
    // When: LlmService.translate(["Text1", "Text2"])
    // Then: 返回 ["譯文1", "譯文2"]
  });

* **實例 A-3：超時防禦（10 秒 Fail-safe）**  
  test('當 API 請求超過 10000ms，應拋出超時 Error', async () \=\> {  
    *// Given: 模擬 10s 超時*  
    *// When & Then: 斷言拋出 "Timeout after 10000ms"*  
  });

* **實例 A-3：防外洩物理隔離（強制禁止原生 Fetch）**  
  test('資安防禦：API 傳輸必須使用油猴沙盒，絕對禁止調用原生 window.fetch', async () \=\> {  
    *// Given: 模擬惡意網頁嘗試覆寫 window.fetch 來竊聽流量*  
    const spyFetch \= jest.fn();  
    global.fetch \= spyFetch;  
    global.GM\_xmlhttpRequest \= jest.fn(); *// 模擬油猴沙盒函數*

    *// When: 執行 LLM 翻譯請求*  
    try { await LlmService.translate("Hello"); } catch(e) {}

    *// Then: 斷言惡意覆寫的 fetch 完全沒有收到任何流量與 API Key*  
    expect(spyFetch).not.toHaveBeenCalled();  
  });

## ---

**模組 B：DomManager（DOM 渲染與 XSS 防護）**

**目的**：驗證譯文節點的正確插入，以及**防止網頁被惡意腳本注入（XSS）**。

* **實例 B-1：對照譯文節點注入**  
  test('injectTranslation 應在原生節點正下方插入獨立的對照譯文節點', () \=\> {  
    *// Given: 建立原生 P 標籤*  
    document.body.innerHTML \= '\<div id="art"\>\<p id="origin"\>Hello\</p\>\</div\>';  
    const originNode \= document.getElementById('origin');

    *// When: 注入譯文*  
    DomManager.injectTranslation(originNode, "你好");

    *// Then: 斷言原生節點保持原樣，且下一個相鄰節點為譯文 \<div\>*  
    const translationNode \= originNode.nextSibling;  
    expect(translationNode.tagName).toBe('DIV');  
    expect(translationNode.classList.contains('immersive-translate-node')).toBe(true);  
    expect(translationNode.textContent).toBe('你好');  
  });

* **實例 B-2：輸出防禦（防範 XSS 攻擊）**  
  test('防禦 XSS：當 LLM 回傳惡意 HTML 標籤時，應被安全渲染為純文字', () \=\> {  
    *// Given: 模擬 LLM 吐出含有惡意 XSS 攻擊程式碼的字串*  
    const maliciousXss \= "\<img src=x onerror=alert(1)\>";  
    document.body.innerHTML \= '\<p id="origin"\>Origin\</p\>';  
    const originNode \= document.getElementById('origin');

    *// When: 執行譯文注入*  
    DomManager.injectTranslation(originNode, maliciousXss);

    *// Then: 斷言渲染出的節點不能觸發惡意腳本，必須被轉義為純文字*  
    const translationNode \= originNode.nextSibling;  
    expect(translationNode.innerHTML).not.toContain('\<img');  
    expect(translationNode.textContent).toBe(maliciousXss); *// 採用 textContent 物理防禦*  
  });

## ---

**模組 C：UiController（狀態轉移驗證）**

**目的**：不測試拖曳路徑，專注驗證**懸浮球位置的持久化狀態流轉**與**儲存隔離** \[agile3uncles\]。

* **實例 C-1：位置持久化與儲存隔離**  
  test('驗證懸浮球位置狀態流轉，且絕不流落至原生 localStorage', () \=\> {  
    *// 1\. Given: 初始狀態，且模擬網頁的 localStorage*  
    global.GM\_setValue \= jest.fn();  
    global.localStorage \= { setItem: jest.fn() };

    *// 2\. When: 使用者移動懸浮球至位置 (50, 40\)*  
    UiController.savePosition({ x\_percent: 50, y\_percent: 40 });

    *// 3\. Then: 斷言狀態成功寫入油猴專屬儲存*  
    expect(global.GM\_setValue).toHaveBeenCalledWith('IMMERSIVE\_POS', { x\_percent: 50, y\_percent: 40 });

    *// 4\. Then: 斷言原生 localStorage 裡面絕對沒有被寫入，達成物理隔離*  
    expect(global.localStorage.setItem).not.toHaveBeenCalled();  
  });

## ---

**🏁 3\. 交付與進入開發標準**

當且僅當上述所有測試案例在模擬環境中**全數通過（Green State）**，我們才定義本階段的 MVP 開發任務「完成並具備高防禦交付標準」。