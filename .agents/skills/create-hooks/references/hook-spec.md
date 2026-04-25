# Gemini CLI Hook Specification Summary

## Communication Protocol
- **Input**: Received via `stdin` as a JSON object containing `hook_event_name`, `tool_name`, `tool_input`, etc.
- **Output**: Sent via `stdout` as a JSON object (e.g., `{"decision": "allow", "systemMessage": "..."}`).
- **Logging**: All debug messages must be written to `stderr`.

## Key Event Types
- `BeforeAgent`: Runs before the model starts planning. Good for context injection.
- `AfterAgent`: Runs after the model finishes a turn. Good for review.
- `AfterTool`: Runs after a tool successfully executes. Good for state tracking.

## Return Schema Fields
- `decision`: ("allow" | "deny") Controls if the action proceeds.
- `systemMessage`: Text displayed to the user immediately.
- `additionalContext`: Text appended to the agent's history.
- `continue`: (boolean) If false, stops the agent loop.
