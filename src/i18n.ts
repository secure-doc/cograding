import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      app: {
        settings: 'Settings',
        logout: 'Logout',
        gradeSubmission: 'Grade Submission',
        description: "Upload a student's work along with the task description and expected solution. CoGrader will analyze it and provide structured feedback.",
        footer: 'CoGrader.ai © {{year}} - BYOK Architecture',
      },
      apiKey: {
        title: 'API Key Required',
        description: "CoGrader.ai uses the Gemini API. Please enter your Gemini API key to continue. Your key is stored securely in your browser's local storage and is never sent to our servers.",
        placeholder: 'AIzaSy...',
        save: 'Save Key',
      },
      form: {
        task: 'Task Description',
        expected: 'Expected Solution',
        studentSubmission: 'Student Submission',
        text: 'Text',
        file: 'File',
        taskPlaceholder: 'Enter the task description here...',
        expectedPlaceholder: 'Enter the expected solution or grading criteria here...',
        uploadTitle: 'Click to upload or drag and drop',
        uploadSubtitle: 'Images (PNG, JPG) or PDF',
        uploadMultipleSubtitle: 'Images (PNG, JPG) or PDF. Multiple files allowed.',
        analyzing: 'Analyzing...',
        submit: 'Grade Submission',
      },
      result: {
        error: 'Error Occurred',
        success: 'Grading Result',
      },
      settings: {
        title: 'Settings',
        systemPrompt: 'System Prompt',
        systemPromptDesc: 'Adjust the instructions Gemini receives for grading here. This controls the behavior and type of feedback.',
        spellingRules: 'Spelling Rules',
        languageRules: 'Language Rules',
        contentRules: 'Content Rules',
        reset: 'Reset to Default',
        cancel: 'Cancel',
        save: 'Save',
      },
      progress: {
        fetchingModels: 'Initializing models...',
        extractTask: 'Reading task description...',
        extractExpected: 'Reading expected solution...',
        extractStudent: 'Analyzing student submission {{current}} of {{total}}...',
        grading: 'Grading submission...',
      }
    }
  },
  de: {
    translation: {
      app: {
        settings: 'Einstellungen',
        logout: 'Abmelden',
        gradeSubmission: 'Korrektur durchführen',
        description: 'Laden Sie die Arbeit eines Schülers zusammen mit der Aufgabenstellung und dem Erwartungshorizont hoch. CoGrader analysiert diese und gibt strukturiertes Feedback.',
        footer: 'CoGrader.ai © {{year}} - BYOK Architecture',
      },
      apiKey: {
        title: 'API-Schlüssel erforderlich',
        description: 'CoGrader.ai verwendet die Gemini-API. Bitte geben Sie Ihren Gemini-API-Schlüssel ein, um fortzufahren. Ihr Schlüssel wird sicher im lokalen Speicher Ihres Browsers gespeichert und niemals an unsere Server gesendet.',
        placeholder: 'AIzaSy...',
        save: 'Schlüssel speichern',
      },
      form: {
        task: 'Aufgabenstellung',
        expected: 'Erwartungshorizont',
        studentSubmission: 'Schülerarbeit',
        text: 'Text',
        file: 'Datei',
        taskPlaceholder: 'Geben Sie hier die Aufgabenstellung ein...',
        expectedPlaceholder: 'Geben Sie hier den Erwartungshorizont oder die Bewertungskriterien ein...',
        uploadTitle: 'Klicken zum Hochladen oder Drag & Drop',
        uploadSubtitle: 'Bilder (PNG, JPG) oder PDF',
        uploadMultipleSubtitle: 'Bilder (PNG, JPG) oder PDF. Mehrere Dateien erlaubt.',
        analyzing: 'Analysiere...',
        submit: 'Korrektur starten',
      },
      result: {
        error: 'Ein Fehler ist aufgetreten',
        success: 'Korrekturergebnis',
      },
      settings: {
        title: 'Einstellungen',
        systemPrompt: 'System Prompt',
        systemPromptDesc: 'Passe hier die Anweisungen an, die Gemini für die Korrektur erhält. Dies steuert das Verhalten und die Art des Feedbacks.',
        spellingRules: 'Regeln für Rechtschreibung',
        languageRules: 'Regeln für Sprache',
        contentRules: 'Regeln für Inhalt',
        reset: 'Auf Standard zurücksetzen',
        cancel: 'Abbrechen',
        save: 'Speichern',
      },
      progress: {
        fetchingModels: 'Initialisiere Modelle...',
        extractTask: 'Lese Aufgabenstellung...',
        extractExpected: 'Lese Erwartungshorizont...',
        extractStudent: 'Analysiere Schülerarbeit {{current}} von {{total}}...',
        grading: 'Bewerte Ergebnisse...',
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    }
  });

export default i18n;
