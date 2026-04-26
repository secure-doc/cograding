import { useState } from 'react';

const API_KEY_STORAGE_KEY = 'cograding_gemini_api_key';

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  });

  const setApiKey = (key: string | null) => {
    if (key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
    setApiKeyState(key);
  };

  return { apiKey, setApiKey };
}
