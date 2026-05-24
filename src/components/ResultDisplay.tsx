import { CheckCircle2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import type { GradingResult } from '../services/gemini';

interface ResultDisplayProps {
  result: GradingResult | null;
  error: string | null;
}

function FileViewer({ file }: { file: File }) {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return null;

  if (file.type.includes('pdf')) {
    return <iframe src={url} className="w-full h-[600px] border-0 rounded-lg bg-white" title={file.name} />;
  }
  
  return <img src={url} alt={file.name} className="w-full h-auto rounded-lg border border-slate-200" />;
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
      
      <div className="w-full">
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : result ? (
          <div className="flex flex-col gap-8">
            <div className="text-slate-800 prose prose-slate max-w-none">
              <ReactMarkdown>{result.overallFeedback || ''}</ReactMarkdown>
            </div>
            
            {result.pages && result.pages.length > 0 && (
              <div className="flex flex-col gap-6 mt-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Seitenansicht</h3>
                {result.pages.map((page, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex flex-col">
                      <h4 className="font-medium text-slate-700 mb-3">Original (Seite {index + 1})</h4>
                      <FileViewer file={page.file} />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-medium text-slate-700 mb-3">Erkannter Text</h4>
                      <div className="flex-1 bg-white p-4 rounded-lg border border-slate-200 overflow-y-auto max-h-[600px]">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-black">
                          {page.extractedText}
                        </pre>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-medium text-slate-700 mb-3">Korrektur-Kommentare</h4>
                      <PageComments comments={page.comments} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PageComments({ comments }: { comments: GradingResult['pages'][0]['comments'] }) {
  const [activeTab, setActiveTab] = useState<'rechtschreibung' | 'sprache' | 'inhalt'>('rechtschreibung');

  const tabs = [
    { id: 'rechtschreibung', label: 'Rechtschreibung' },
    { id: 'sprache', label: 'Sprache' },
    { id: 'inhalt', label: 'Inhalt' },
  ] as const;

  const activeComments = comments ? comments[activeTab] || [] : [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 border-b border-slate-200 mb-4 pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
            {comments && comments[tab.id]?.length > 0 && (
              <span className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {comments[tab.id].length}
              </span>
            )}
          </button>
        ))}
      </div>
      
      <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-y-auto max-h-[600px]">
        {activeComments.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Keine Anmerkungen in diesem Bereich.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {activeComments.map((comment, i) => (
              <div key={i} className="bg-white p-3 rounded shadow-sm border border-slate-200 text-sm">
                <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-mono mb-2">Zeile {comment.line}</span>
                <p className="text-slate-800">{comment.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
