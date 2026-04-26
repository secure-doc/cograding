import { useState, useRef } from 'react';
import { Upload, FileText, Send, Loader2, Image as ImageIcon } from 'lucide-react';

interface GradingFormProps {
  onSubmit: (task: string, expected: string, file: File) => Promise<void>;
  isLoading: boolean;
}

export function GradingForm({ onSubmit, isLoading }: GradingFormProps) {
  const [task, setTask] = useState('');
  const [expected, setExpected] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !task || !expected) return;
    await onSubmit(task, expected, file);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Aufgabenstellung (Task)
        </label>
        <textarea
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-32"
          placeholder="Enter the task description here..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Erwartungshorizont (Expected Solution)
        </label>
        <textarea
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-32"
          placeholder="Enter the expected solution or grading criteria here..."
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Schülerarbeit (Student Submission)
        </label>
        <div 
          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary/50'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={handleChange}
          />
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Upload className="w-8 h-8 text-slate-400" />
            {file ? (
              <span className="font-medium text-primary">{file.name}</span>
            ) : (
              <>
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-xs">Images (PNG, JPG) or PDF</p>
              </>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !file || !task || !expected}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Analyzing...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" /> Grade Submission
          </>
        )}
      </button>
    </form>
  );
}
