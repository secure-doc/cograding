import { useState } from 'react';

export interface GradingRules {
  spelling: string;
  language: string;
  content: string;
}

export const DEFAULT_GRADING_RULES: GradingRules = {
  spelling: 'For "spelling", include ALL identified mistakes.',
  language: 'For "language", include ALL identified mistakes.',
  content: 'For "content", this is the most critical part for justifying the grading. You MUST provide at least 5 content-related comments per page (including both positive aspects and negative/missing aspects).'
};

export function useGradingRules() {
  const [rules, setRulesState] = useState<GradingRules>(() => {
    const saved = localStorage.getItem('gradingRules');
    if (saved) {
      try {
        return { ...DEFAULT_GRADING_RULES, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse grading rules from local storage', e);
      }
    }
    return DEFAULT_GRADING_RULES;
  });

  const setRules = (newRules: GradingRules) => {
    setRulesState(newRules);
    localStorage.setItem('gradingRules', JSON.stringify(newRules));
  };

  const resetRules = () => {
    setRulesState(DEFAULT_GRADING_RULES);
    localStorage.removeItem('gradingRules');
  };

  return { rules, setRules, resetRules };
}
