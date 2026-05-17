import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_SYSTEM_PROMPT } from '../hooks/useSystemPrompt';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  onSave: (prompt: string) => void;
  onReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  systemPrompt, 
  onSave, 
  onReset 
}) => {
  const { t } = useTranslation();
  const [localPrompt, setLocalPrompt] = useState(systemPrompt);

  useEffect(() => {
    if (isOpen) {
      setLocalPrompt(systemPrompt);
    }
  }, [isOpen, systemPrompt]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localPrompt);
    onClose();
  };

  const handleReset = () => {
    setLocalPrompt(DEFAULT_SYSTEM_PROMPT);
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
