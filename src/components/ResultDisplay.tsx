import { CheckCircle2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

interface ResultDisplayProps {
  result: string | null;
  error: string | null;
}

export function ResultDisplay({ result, error }: ResultDisplayProps) {
  const { t } = useTranslation();
  
  if (!result && !error) return null;

  return (
    <div className={`mt-8 p-6 rounded-xl border ${error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50/50'} shadow-sm`}>
      <div className="flex items-center gap-2 mb-4">
        {error ? (
          <>
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-semibold text-red-800">{t('result.error')}</h3>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-semibold text-green-800">{t('result.success')}</h3>
          </>
        )}
      </div>
      
      <div className="prose prose-slate max-w-none">
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="text-slate-800">
            <ReactMarkdown>{result || ''}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
