import { useState } from 'react';
import { Key } from 'lucide-react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

export function ApiKeyModal({ onSave }: ApiKeyModalProps) {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4 text-primary">
          <Key className="w-6 h-6" />
          <h2 className="text-xl font-semibold text-slate-800">API Key Required</h2>
        </div>
        <p className="text-slate-600 mb-6 text-sm">
          CoGrader.ai uses the Gemini API. Please enter your Gemini API key to continue. 
          Your key is stored securely in your browser's local storage and is never sent to our servers.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
            required
          />
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Save Key
          </button>
        </form>
      </div>
    </div>
  );
}
