import { useState } from 'react';

export const DEFAULT_SYSTEM_PROMPT = `Du bist ein erfahrener Lehrer, der eine Schülerarbeit korrigiert.
Bitte analysiere die beigefügte Schülerarbeit und vergleiche sie mit der Aufgabenstellung und dem Erwartungshorizont.

Bitte gib ein strukturiertes Feedback zur Lösung des Schülers.
Bewerte, ob die Aufgabe vollständig und richtig bearbeitet wurde, und nenne spezifische Fehler oder gute Ansätze.
Schließe mit einer kurzen Zusammenfassung und ggf. einer Notentendenz (z.B. "sehr gut", "befriedigend" etc., falls aus dem Erwartungshorizont ableitbar).`;

export function useSystemPrompt() {
  const [systemPrompt, setSystemPromptState] = useState<string>(() => {
    return localStorage.getItem('systemPrompt') || DEFAULT_SYSTEM_PROMPT;
  });

  const setSystemPrompt = (prompt: string) => {
    setSystemPromptState(prompt);
    localStorage.setItem('systemPrompt', prompt);
  };

  const resetSystemPrompt = () => {
    setSystemPromptState(DEFAULT_SYSTEM_PROMPT);
    localStorage.removeItem('systemPrompt');
  };

  return { systemPrompt, setSystemPrompt, resetSystemPrompt };
}
