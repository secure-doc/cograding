import { useState } from 'react';
import { useApiKey } from './hooks/useApiKey';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SettingsModal } from './components/SettingsModal';
import { GradingForm } from './components/GradingForm';
import { ResultDisplay } from './components/ResultDisplay';
import { gradeSubmission, type ProgressData } from './services/gemini';
import { GraduationCap, LogOut, Settings } from 'lucide-react';
import { useSystemPrompt } from './hooks/useSystemPrompt';
import { useGradingRules } from './hooks/useGradingRules';
import { useTranslation } from 'react-i18next';

function App() {
  const { t, i18n } = useTranslation();
  const { apiKey, setApiKey } = useApiKey();
  const { systemPrompt, setSystemPrompt, resetSystemPrompt } = useSystemPrompt();
  const { rules, setRules, resetRules } = useGradingRules();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [result, setResult] = useState<import('./services/gemini').GradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGrade = async (task: string | File, expected: string | File, files: File[]) => {
    if (!apiKey) return;
    
    setIsLoading(true);
    setProgress(null);
    setResult(null);
    setError(null);
    
    try {
      const response = await gradeSubmission(apiKey, systemPrompt, rules, task, expected, files, setProgress);
      setResult(response);
    } catch (err) {
      console.error('Grading error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during grading.');
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  const handleLogout = () => {
    setApiKey(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {!apiKey && <ApiKeyModal onSave={setApiKey} />}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        systemPrompt={systemPrompt}
        gradingRules={rules}
        onSave={(prompt, newRules) => {
          setSystemPrompt(prompt);
          setRules(newRules);
        }}
        onReset={() => {
          resetSystemPrompt();
          resetRules();
        }}
      />
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <GraduationCap className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">CoGrader<span className="text-primary">.ai</span></h1>
          </div>
          <div className="flex items-center gap-4">
            {apiKey && (
              <>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  title={t('app.settings')}
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('app.settings')}</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  title={t('app.logout')}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('app.logout')}</span>
                </button>
                <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
              </>
            )}
            <div className="flex items-center gap-1 text-sm font-medium text-slate-600 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => i18n.changeLanguage('de')}
                className={`px-2 py-1 rounded-md transition-colors ${i18n.language.startsWith('de') ? 'bg-white text-primary shadow-sm' : 'hover:text-slate-900'}`}
              >
                DE
              </button>
              <button
                onClick={() => i18n.changeLanguage('en')}
                className={`px-2 py-1 rounded-md transition-colors ${i18n.language.startsWith('en') ? 'bg-white text-primary shadow-sm' : 'hover:text-slate-900'}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">{t('app.gradeSubmission')}</h2>
          <p className="text-slate-600 text-lg">
            {t('app.description')}
          </p>
        </div>

        <GradingForm onSubmit={handleGrade} isLoading={isLoading} progress={progress} />
        
        <ResultDisplay result={result} error={error} />
      </main>
      
      <footer className="bg-slate-50 border-t border-slate-200 py-6 text-center text-slate-500 text-sm">
        <p>{t('app.footer', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}

export default App;
