import { useState, useRef } from 'react';
import { Upload, FileText, Send, Loader2, Image as ImageIcon, Type, FileUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GradingFormProps {
  onSubmit: (task: string | File, expected: string | File, files: File[]) => Promise<void>;
  isLoading: boolean;
}

function FileDropzone({ 
  file, 
  onFileChange, 
  accept, 
  title, 
  subtitle 
}: { 
  file: File | null; 
  onFileChange: (file: File | null) => void; 
  accept: string; 
  title: string; 
  subtitle: string; 
}) {
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
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
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
        accept={accept}
        onChange={handleChange}
      />
      <div className="flex flex-col items-center gap-2 text-slate-500">
        <Upload className="w-8 h-8 text-slate-400" />
        {file ? (
          <span className="font-medium text-primary">{file.name}</span>
        ) : (
          <>
            <p className="font-medium">{title}</p>
            <p className="text-xs">{subtitle}</p>
          </>
        )}
      </div>
    </div>
  );
}

function MultiFileDropzone({ 
  files, 
  onFilesChange, 
  accept, 
  title, 
  subtitle 
}: { 
  files: File[]; 
  onFilesChange: (files: File[]) => void; 
  accept: string; 
  title: string; 
  subtitle: string; 
}) {
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesChange(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      onFilesChange(Array.from(e.target.files));
    }
  };

  return (
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
        multiple
        className="hidden"
        accept={accept}
        onChange={handleChange}
      />
      <div className="flex flex-col items-center gap-2 text-slate-500">
        <Upload className="w-8 h-8 text-slate-400" />
        {files.length > 0 ? (
          <div className="flex flex-col items-center max-h-32 overflow-y-auto w-full px-4 space-y-1">
            {files.map((f, i) => (
              <span key={i} className="font-medium text-primary truncate w-full text-center" title={f.name}>{f.name}</span>
            ))}
          </div>
        ) : (
          <>
            <p className="font-medium">{title}</p>
            <p className="text-xs">{subtitle}</p>
          </>
        )}
      </div>
    </div>
  );
}

export function GradingForm({ onSubmit, isLoading }: GradingFormProps) {
  const { t } = useTranslation();
  const [taskType, setTaskType] = useState<'text' | 'file'>('text');
  const [taskText, setTaskText] = useState('');
  const [taskFile, setTaskFile] = useState<File | null>(null);

  const [expectedType, setExpectedType] = useState<'text' | 'file'>('text');
  const [expectedText, setExpectedText] = useState('');
  const [expectedFile, setExpectedFile] = useState<File | null>(null);

  const [studentFiles, setStudentFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData = taskType === 'text' ? taskText : taskFile;
    const expectedData = expectedType === 'text' ? expectedText : expectedFile;

    if (studentFiles.length === 0 || !taskData || !expectedData) return;

    await onSubmit(taskData, expectedData, studentFiles);
  };

  const isFormValid = () => {
    const isTaskValid = taskType === 'text' ? taskText.trim().length > 0 : taskFile !== null;
    const isExpectedValid = expectedType === 'text' ? expectedText.trim().length > 0 : expectedFile !== null;
    const isStudentFileValid = studentFiles.length > 0;
    return isTaskValid && isExpectedValid && isStudentFileValid;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      {/* Task Description Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4" /> {t('form.task')}
          </label>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setTaskType('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${taskType === 'text' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Type className="w-3.5 h-3.5" /> {t('form.text')}
            </button>
            <button
              type="button"
              onClick={() => setTaskType('file')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${taskType === 'file' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <FileUp className="w-3.5 h-3.5" /> {t('form.file')}
            </button>
          </div>
        </div>
        
        {taskType === 'text' ? (
          <textarea
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-32"
            placeholder={t('form.taskPlaceholder')}
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            required
          />
        ) : (
          <FileDropzone
            file={taskFile}
            onFileChange={setTaskFile}
            accept="image/*,application/pdf"
            title={t('form.uploadTitle')}
            subtitle={t('form.uploadSubtitle')}
          />
        )}
      </div>

      {/* Expected Solution Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4" /> {t('form.expected')}
          </label>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setExpectedType('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${expectedType === 'text' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Type className="w-3.5 h-3.5" /> {t('form.text')}
            </button>
            <button
              type="button"
              onClick={() => setExpectedType('file')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${expectedType === 'file' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <FileUp className="w-3.5 h-3.5" /> {t('form.file')}
            </button>
          </div>
        </div>

        {expectedType === 'text' ? (
          <textarea
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-32"
            placeholder={t('form.expectedPlaceholder')}
            value={expectedText}
            onChange={(e) => setExpectedText(e.target.value)}
            required
          />
        ) : (
          <FileDropzone
            file={expectedFile}
            onFileChange={setExpectedFile}
            accept="image/*,application/pdf"
            title={t('form.uploadTitle')}
            subtitle={t('form.uploadSubtitle')}
          />
        )}
      </div>

      {/* Student Submission Section */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> {t('form.studentSubmission')}
        </label>
        <MultiFileDropzone
          files={studentFiles}
          onFilesChange={setStudentFiles}
          accept="image/*,application/pdf"
          title={t('form.uploadTitle')}
          subtitle={t('form.uploadMultipleSubtitle')}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !isFormValid()}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> {t('form.analyzing')}
          </>
        ) : (
          <>
            <Send className="w-5 h-5" /> {t('form.submit')}
          </>
        )}
      </button>
    </form>
  );
}
