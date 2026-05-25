import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_SYSTEM_PROMPT } from '../hooks/useSystemPrompt';
import { type GradingRules, DEFAULT_GRADING_RULES } from '../hooks/useGradingRules';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  gradingRules: GradingRules;
  onSave: (prompt: string, rules: GradingRules) => void;
  onReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  systemPrompt, 
  gradingRules,
  onSave, 
  onReset 
}) => {
  const { t } = useTranslation();
  const [localPrompt, setLocalPrompt] = useState(systemPrompt);
  const [localRules, setLocalRules] = useState<GradingRules>(gradingRules);

  useEffect(() => {
    if (isOpen) {
      setLocalPrompt(systemPrompt);
      setLocalRules(gradingRules);
    }
  }, [isOpen, systemPrompt, gradingRules]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localPrompt, localRules);
    onClose();
  };

  const handleReset = () => {
    setLocalPrompt(DEFAULT_SYSTEM_PROMPT);
    setLocalRules(DEFAULT_GRADING_RULES);
    onReset();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">{t('settings.title')}</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title={t('settings.cancel')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div>
              <label htmlFor="systemPrompt" className="block text-sm font-medium text-slate-700 mb-2">
                {t('settings.systemPrompt')}
              </label>
              <p className="text-sm text-slate-500 mb-3">
                {t('settings.systemPromptDesc')}
              </p>
              <textarea
                id="systemPrompt"
                rows={12}
                className="w-full rounded-lg border-slate-300 border p-3 text-sm focus:border-primary focus:ring-primary font-mono shadow-sm"
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
              />
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Erweiterte Regeln für Tabs</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="spellingRules" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('settings.spellingRules')}
                  </label>
                  <textarea
                    id="spellingRules"
                    rows={3}
                    className="w-full rounded-lg border-slate-300 border p-3 text-sm focus:border-primary focus:ring-primary font-mono shadow-sm"
                    value={localRules.spelling}
                    onChange={(e) => setLocalRules({ ...localRules, spelling: e.target.value })}
                  />
                </div>
                
                <div>
                  <label htmlFor="languageRules" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('settings.languageRules')}
                  </label>
                  <textarea
                    id="languageRules"
                    rows={3}
                    className="w-full rounded-lg border-slate-300 border p-3 text-sm focus:border-primary focus:ring-primary font-mono shadow-sm"
                    value={localRules.language}
                    onChange={(e) => setLocalRules({ ...localRules, language: e.target.value })}
                  />
                </div>
                
                <div>
                  <label htmlFor="contentRules" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('settings.contentRules')}
                  </label>
                  <textarea
                    id="contentRules"
                    rows={4}
                    className="w-full rounded-lg border-slate-300 border p-3 text-sm focus:border-primary focus:ring-primary font-mono shadow-sm"
                    value={localRules.content}
                    onChange={(e) => setLocalRules({ ...localRules, content: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            {t('settings.reset')}
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {t('settings.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              {t('settings.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
