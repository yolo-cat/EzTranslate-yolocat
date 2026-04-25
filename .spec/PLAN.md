# TDD Implementation Plan: Immersive Translation Userscript

## Objective
Initialize a Node.js/Jest/JSDOM environment for Test-Driven Development (TDD), modularize the Tampermonkey script currently defined in `.spec/CODE.md`, implement the exact tests specified in `.spec/TEST.md`, and set up an automated build process to bundle the modules back into a deployable Tampermonkey userscript. 

Crucially, this plan itself will be saved to `.spec/PLAN.md` as the single source of truth for implementation, and the development process will strictly adhere to the project's Hook design (Sync Check Hook) to ensure documentation remains synchronized with code changes.

## Background & Motivation
The current codebase in `.spec/CODE.md` is a monolithic Tampermonkey script. To strictly follow the BDD/TDD specifications outlined in `PRD.md`, `SPEC.md`, and `TEST.md`, we need a formal development environment. This allows us to verify edge cases like 5-second timeouts, XSS prevention, and sandbox isolation using automated Jest tests with JSDOM, rather than manual browser testing.

## Key Files & Context
- **New Source Files**:
  - `src/config.js` (Constants and defaults)
  - `src/LlmService.js` (API communication)
  - `src/DomManager.js` (DOM manipulation and XSS defense)
  - `src/UiController.js` (Floating button UI and state)
  - `src/index.js` (Entry point)
- **New Test Files**:
  - `tests/setup.js` (Global mocks for Tampermonkey `GM_*` APIs)
  - `tests/LlmService.test.js`
  - `tests/DomManager.test.js`
  - `tests/UiController.test.js`
- **Tooling**:
  - `package.json`
  - `jest.config.js`
  - `build.js` (Script to bundle and attach Userscript headers)
- **Outputs**:
  - `dist/immersive-translation.user.js` (Final deployable script)
  - `.spec/PLAN.md` (This document, synchronized to the workspace)

## Implementation Steps

### Phase 1: Planning & Hook Synchronization
1.  **Save Plan**: Copy this finalized plan to `.spec/PLAN.md` as the single source of truth.
2.  **Hook Design Integration**: Acknowledge the "Sync Check Hook" defined in `GEMINI.md`. Whenever `build.js` modifies `.spec/CODE.md` (to sync the final output), we MUST simultaneously update `.spec/TEST.md` or `GEMINI.md` (e.g., updating a version bump or timestamp) in the same turn to satisfy the Hook and prevent self-healing loop rollbacks.

### Phase 2: Environment Initialization
1.  **Package Setup**: Create `package.json` and configure `scripts` for `test` and `build`.
2.  **Dependencies**: Install development dependencies: `jest`, `jest-environment-jsdom`, and `esbuild` (for fast bundling).
3.  **Jest Configuration**: Create `jest.config.js` specifying JSDOM as the test environment and pointing to a setup file (`tests/setup.js`) to mock `GM_setValue`, `GM_getValue`, `GM_xmlhttpRequest`, and `GM_registerMenuCommand`.

### Phase 3: Modularization
1.  Extract `DEFAULT_CONFIG` into `src/config.js`.
2.  Extract `LlmService` into `src/LlmService.js`, exporting the module.
3.  Extract `DomManager` into `src/DomManager.js`, exporting the module.
4.  Extract `UiController` into `src/UiController.js`, injecting dependencies (like LlmService and DomManager) if necessary for testability, or keeping them as imports.
5.  Create `src/index.js` to initialize the script (`UiController.initFloatButton()`), matching the IIFE behavior in `CODE.md`.

### Phase 4: TDD Implementation
Implement the tests as defined in `.spec/TEST.md`:
1.  **`tests/LlmService.test.js`**:
    *   Test successful API response parsing.
    *   Test the 5-second fail-safe timeout.
    *   Test physical sandbox isolation (ensuring native `window.fetch` is NOT called).
2.  **`tests/DomManager.test.js`**:
    *   Test translation node injection below the original node.
    *   Test XSS defense (ensuring malicious HTML is escaped via `textContent`).
3.  **`tests/UiController.test.js`**:
    *   Test state transition for position persistence (`GM_setValue`).
    *   Test storage isolation (ensuring native `localStorage` is NOT used).

### Phase 5: Build System & Final Delivery
1.  Create a custom Node.js script (`build.js`) using `esbuild`.
2.  The script will bundle `src/index.js` into an IIFE format.
3.  The script will read the Tampermonkey `==UserScript==` header block from `.spec/CODE.md` (or a dedicated `header.js` file) and prepend it to the bundled output.
4.  The final output will be written to `dist/immersive-translation.user.js` and synchronized back to `.spec/CODE.md`.
5.  *Sync Check Trigger*: Touch/update `GEMINI.md` or `.spec/TEST.md` with the new build status to satisfy the AI Agent Loop Workflow Hook requirement.

## Verification & Testing
1.  Run `npm install`.
2.  Run `npm test`. All tests MUST pass (Green State) to prove the implementation meets the TDD Spec requirements.
3.  Run `npm run build`. Verify that the built script contains the correct header and all the combined logic.
