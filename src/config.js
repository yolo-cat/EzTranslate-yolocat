export const DEFAULT_CONFIG = {
    api_key: "請在此填入您的_Google_API_KEY",
    base_url: "https://generativelanguage.googleapis.com/v1beta/models",
    model_name: "gemini-flash-lite-latest",
    system_prompt: "Translate the input array of texts into Traditional Chinese. Return ONLY a JSON array of strings, where each string is the translation of the corresponding input text. Maintain the exact same order. No explanation, no markdown blocks, just the raw JSON array."
};
