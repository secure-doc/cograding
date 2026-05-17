import { useState } from 'react';
import { useApiKey } from './hooks/useApiKey';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SettingsModal } from './components/SettingsModal';
import { GradingForm } from './components/GradingForm';
import { ResultDisplay } from './components/ResultDisplay';
import { gradeSubmission } from './services/gemini';
import { GraduationCap, LogOut, Settings } from 'lucide-react';
import { useSystemPrompt } from './hooks/useSystemPrompt';

function App() {
  const { apiKey, setApiKey } = useApiKey();
  const { systemPrompt, setSystemPrompt, resetSystemPrompt } = useSystemPrompt();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGrade = async (task: string | File, expected: string | File, files: File[]) => {
    if (!apiKey) return;
    
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await gradeSubmission(apiKey, systemPrompt, task, expected, files);
      setResult(response);
    } catch (err) {
      console.error('Grading error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during grading.');
    } finally {
      setIsLoading(false);
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
        onSave={setSystemPrompt}
        onReset={resetSystemPrompt}
      />
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <GraduationCap className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">CoGrader<span className="text-primary">.ai</span></h1>
          </div>
          {apiKey && (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                title="Clear API Key"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Grade Submission</h2>
          <p className="text-slate-600 text-lg">
            Upload a student's work along with the task description and expected solution. CoGrader will analyze it and provide structured feedback.
          </p>
        </div>

        <GradingForm onSubmit={handleGrade} isLoading={isLoading} />
        
        <ResultDisplay result={result} error={error} />
      </main>
      
      <footer className="bg-slate-50 border-t border-slate-200 py-6 text-center text-slate-500 text-sm">
        <p>CoGrader.ai &copy; {new Date().getFullYear()} - BYOK Architecture</p>
      </footer>
    </div>
  );
}

export default App;
