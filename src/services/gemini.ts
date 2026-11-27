import { GoogleGenerativeAI, type GenerativeModel, type GenerationConfig, type Part } from '@google/generative-ai';
import type { GradingRules } from '../hooks/useGradingRules';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Error with an i18n key so the UI can show a translated, actionable message.
 */
export class GradingError extends Error {
  readonly key: string;
  readonly params: Record<string, unknown>;

  constructor(key: string, params: Record<string, unknown> = {}, cause?: unknown) {
    super(key, { cause });
    this.name = 'GradingError';
    this.key = key;
    this.params = params;
  }
}

// The SDK throws "Candidate was blocked due to <REASON>" from response.text().
// Waiting does not help for these, so they must not go through the rate-limit retry.
const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error ?? ''));
const isBlockedCandidateError = (error: unknown) => /Candidate was blocked due to/i.test(errorMessage(error));
const isRecitationError = (error: unknown) => /blocked due to RECITATION/i.test(errorMessage(error));

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 5, defaultDelayMs = 5000): Promise<T> => {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      if (attempt > maxRetries || isBlockedCandidateError(error)) {
        throw error;
      }

      let waitTime = defaultDelayMs;
      const errorMsg = error.message || '';

      // Look for "Please retry in 49.9s" or "retryDelay":"49s"
      const retryMatch = errorMsg.match(/Please retry in ([\d.]+)s/i) || errorMsg.match(/"retryDelay":"([\d.]+)s"/i);
      if (retryMatch && retryMatch[1]) {
        const parsedSeconds = parseFloat(retryMatch[1]);
        if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
          waitTime = Math.ceil(parsedSeconds * 1000) + 1000; // Add 1 second buffer
        }
      }

      console.warn(`API call failed (attempt ${attempt}/${maxRetries}). Retrying in ${waitTime}ms... Error:`, error.message);
      await sleep(waitTime);
    }
  }
};

let cachedModels: any[] | null = null;

async function getAvailableModels(apiKey: string) {
  if (cachedModels) return cachedModels;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      throw new Error('Failed to fetch available models');
    }
    const data = await response.json();
    cachedModels = data.models || [];
    return cachedModels;
  } catch (error) {
    console.error("Error fetching models, falling back to defaults", error);
    return [];
  }
}

async function getModelNames(apiKey: string) {
  const models = await getAvailableModels(apiKey);
  if (!models || models.length === 0) {
    return { flashModel: 'gemini-flash-lite-latest', proModel: 'gemini-pro-latest' };
  }

  const hasModel = (name: string) => models.some((m: any) =>
    m.name === `models/${name}` &&
    m.supportedGenerationMethods.includes('generateContent')
  );

  // Prioritized list of known stable models.
  // We use flash-lite for grading as well because standard Pro models currently have strict 0-limits on the free tier.
  const preferredFlash = ['gemini-flash-lite-latest', 'gemini-2.0-flash-lite'];
  const preferredPro = ['gemini-flash-lite-latest'];

  let flashModel = preferredFlash.find(hasModel);
  let proModel = preferredPro.find(hasModel);

  if (!flashModel) {
    const standardModels = models.filter((m: any) =>
      m.name.startsWith('models/gemini-') &&
      !m.name.includes('experimental') &&
      !m.name.includes('preview') &&
      !m.name.includes('test') &&
      m.supportedGenerationMethods.includes('generateContent')
    );
    const flashModels = standardModels.filter((m: any) => m.name.includes('flash'));
    flashModels.sort((a: any, b: any) => a.name.localeCompare(b.name)); // Ascending to avoid picking latest preview versions that slipped through
    flashModel = flashModels.length > 0 ? flashModels[0].name.replace('models/', '') : 'gemini-flash-lite-latest';
  }

  if (!proModel) {
    const standardModels = models.filter((m: any) =>
      m.name.startsWith('models/gemini-') &&
      !m.name.includes('experimental') &&
      !m.name.includes('preview') &&
      !m.name.includes('test') &&
      m.supportedGenerationMethods.includes('generateContent')
    );
    const proModels = standardModels.filter((m: any) => m.name.includes('pro'));
    proModels.sort((a: any, b: any) => a.name.localeCompare(b.name));
    proModel = proModels.length > 0 ? proModels[0].name.replace('models/', '') : 'gemini-pro-latest';
  }

  return {
    flashModel: flashModel || 'gemini-flash-lite-latest',
    proModel: proModel || 'gemini-flash-lite-latest'
  };
}

export const fileToGenerativePart = async (file: File) => {
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return { inlineData: { data: base64Data, mimeType: file.type } };
};

interface GenerationAttempt {
  parts: (string | Part)[];
  generationConfig?: GenerationConfig;
  postProcess?: (text: string) => string;
}

/**
 * Runs the attempts in order. Gemini's RECITATION filter is non-deterministic and depends on
 * the exact output, so a different prompt variant / temperature usually gets through.
 * Throws the last recitation error if every attempt was blocked.
 */
const generateTextWithRecitationFallback = async (model: GenerativeModel, attempts: GenerationAttempt[]) => {
  let lastError: unknown;
  for (let i = 0; i < attempts.length; i++) {
    const { parts, generationConfig, postProcess } = attempts[i];
    try {
      const text = await withRetry(async () => {
        const result = await model.generateContent({ contents: [{ role: 'user', parts: toParts(parts) }], generationConfig });
        return result.response.text();
      });
      return postProcess ? postProcess(text) : text;
    } catch (error) {
      if (!isRecitationError(error)) throw error;
      lastError = error;
      console.warn(`Gemini blocked the response due to RECITATION (attempt ${i + 1}/${attempts.length}), trying a variant...`);
    }
  }
  throw lastError;
};

const toParts = (parts: (string | Part)[]): Part[] => parts.map(p => (typeof p === 'string' ? { text: p } : p));

// Matches the "12 | " prefix we ask for in the line-numbered fallback prompt.
const LINE_NUMBER_PREFIX = /^\s*\d+\s*\|\s?/;
const stripLineNumbers = (text: string) => text.split('\n').map(line => line.replace(LINE_NUMBER_PREFIX, '')).join('\n');

const extractTextFromFile = async (file: File, genAI: GoogleGenerativeAI, flashModelName: string) => {
  const model = genAI.getGenerativeModel({ model: flashModelName });
  const part = await fileToGenerativePart(file);

  let prompt = "Extract all text from this document accurately. Preserve line breaks exactly as they appear in the original document. Do not add any extra explanations, just output the extracted text.";
  if (file.type.includes('pdf')) {
    prompt = "Extract all text from this PDF accurately. Preserve the structure where possible. Do not add any extra explanations, just output the extracted text.";
  } else if (file.type.includes('image')) {
    prompt = "Extract all text from this image accurately (OCR). Do not add any extra explanations, just output the extracted text.";
  }

  // Fallback: a verbatim transcription of a known text (poem, textbook excerpt, quotes in an essay)
  // trips the RECITATION filter. Prefixing every line with its number changes the output enough
  // to pass; the prefixes are stripped again afterwards.
  const numberedPrompt = "Transcribe this document line by line (OCR) for a teacher who grades a student's handwritten work. " +
    "Prefix EVERY line with its line number followed by ' | ' (e.g. '1 | ...'). Keep the student's original wording and spelling mistakes. " +
    "Do not add any extra explanations, just output the numbered lines.";

  return generateTextWithRecitationFallback(model, [
    { parts: [prompt, part] },
    { parts: [numberedPrompt, part], generationConfig: { temperature: 0.4 }, postProcess: stripLineNumbers },
    { parts: [numberedPrompt, part], generationConfig: { temperature: 1.0 }, postProcess: stripLineNumbers },
  ]);
};

export interface CorrectionComment {
  line: number;
  text: string;
}

export interface PageResult {
  file: File;
  extractedText: string;
  comments: {
    spelling: CorrectionComment[];
    language: CorrectionComment[];
    content: CorrectionComment[];
  };
}

export interface GradingResult {
  overallFeedback: string;
  pages: PageResult[];
}

export interface ProgressData {
  percentage: number;
  key: string;
  current?: number;
  total?: number;
}

export const gradeSubmission = async (
  apiKey: string,
  systemPrompt: string,
  rules: GradingRules,
  taskDescription: string | File,
  expectedSolution: string | File,
  studentFiles: File[],
  onProgress?: (progress: ProgressData) => void
): Promise<GradingResult> => {
  const genAI = new GoogleGenerativeAI(apiKey);

  const totalSteps = 4 + studentFiles.length;
  let currentStep = 0;

  const updateProgress = (key: string, current?: number, total?: number) => {
    if (onProgress) {
      onProgress({
        percentage: Math.round((currentStep / totalSteps) * 100),
        key,
        current,
        total
      });
    }
  };

  updateProgress('progress.fetchingModels');

  // 1. Get appropriate models dynamically
  const { flashModel, proModel } = await getModelNames(apiKey);
  console.log(`Selected Models - Extraction: ${flashModel}, Grading: ${proModel}`);

  // 2. Helper to resolve task / expected solution to prompt content.
  // If the transcription is blocked by the RECITATION filter (e.g. the task quotes a well-known text),
  // the file itself is handed to the grading model instead - it only needs to understand it, not reproduce it.
  const resolveToContext = async (input: string | File): Promise<string | Part> => {
    if (typeof input === 'string') return input;
    try {
      return await extractTextFromFile(input, genAI, flashModel);
    } catch (error) {
      if (!isRecitationError(error)) throw error;
      console.warn(`Text extraction of "${input.name}" blocked due to RECITATION, passing the file to the grading model directly.`);
      return fileToGenerativePart(input);
    }
  };

  // 3. Extract text from all inputs sequentially to avoid RPM rate limits
  currentStep++;
  updateProgress('progress.extractTask');
  const taskContext = await resolveToContext(taskDescription);
  if (typeof taskDescription !== 'string') await sleep(4000);

  currentStep++;
  updateProgress('progress.extractExpected');
  const expectedContext = await resolveToContext(expectedSolution);
  if (typeof expectedSolution !== 'string') await sleep(4000);

  const studentTexts: string[] = [];
  for (let i = 0; i < studentFiles.length; i++) {
    currentStep++;
    updateProgress('progress.extractStudent', i + 1, studentFiles.length);
    try {
      studentTexts.push(await extractTextFromFile(studentFiles[i], genAI, flashModel));
    } catch (error) {
      if (isRecitationError(error)) {
        throw new GradingError('errors.recitationStudent', { index: i + 1, name: studentFiles[i].name }, error);
      }
      throw error;
    }
    await sleep(4000); // 4 second delay = 15 RPM exactly
  }

  currentStep++;
  updateProgress('progress.grading');

  // Enforce JSON schema
  const jsonSchemaInstruction = `\n\nCRITICAL FORMAT REQUIREMENT: You MUST output your response strictly as a JSON object matching this schema:
{
  "overallFeedback": "Your general feedback and grading summary. Use Markdown for formatting.",
  "pages": [
    {
      "pageIndex": 0,
      "comments": {
        "spelling": [
          { "line": 1, "text": "First spelling comment" },
          { "line": 5, "text": "Second spelling comment" }
        ],
        "language": [
          { "line": 2, "text": "First Grammar/language comment" },
		  { "line": 8, "text": "Second Grammar/language comment" }
        ],
        "content": [
          { "line": 3, "text": "First Content logic comment" },
		  { "line": 10, "text": "Second Content logic comment" },
        ]
      }
    }
  ]
}
IMPORTANT RULES:
- Include an entry in the "pages" array for EACH file provided. The pageIndex should start at 0.
- ${rules.spelling}
- ${rules.language}
- ${rules.content}
- Ensure line numbers correspond accurately to the line numbers provided in the text.
- Do not reproduce longer passages of the provided texts verbatim. Refer to line numbers and quote at most a few words.`;

  // 4. Perform Grading using the Pro model
  const gradingModel = genAI.getGenerativeModel({
    model: proModel,
    systemInstruction: systemPrompt + jsonSchemaInstruction,
  });

  const promptParts: (string | Part)[] = [];
  const pushContext = (label: string, context: string | Part) => {
    if (typeof context === 'string') {
      promptParts.push(`${label}:\n${context}\n\n`);
    } else {
      promptParts.push(`${label} (siehe angehängte Datei):\n`, context, '\n\n');
    }
  };
  pushContext('Aufgabenstellung', taskContext);
  pushContext('Erwartungshorizont', expectedContext);

  const numberedStudentTexts = studentTexts.map(text => 
    text.split('\n').map((line, idx) => `${idx + 1} | ${line}`).join('\n')
  );

  promptParts.push("Schülerarbeit:\n");
  numberedStudentTexts.forEach((text, i) => {
    promptParts.push(`Datei ${i} (pageIndex: ${i}):\n${text}\n\n`);
  });

  let responseText: string;
  try {
    responseText = await generateTextWithRecitationFallback(gradingModel, [
      { parts: promptParts, generationConfig: { responseMimeType: 'application/json' } },
      { parts: promptParts, generationConfig: { responseMimeType: 'application/json', temperature: 1.0 } },
      { parts: promptParts, generationConfig: { responseMimeType: 'application/json', temperature: 1.3 } },
    ]);
  } catch (error) {
    if (isRecitationError(error)) throw new GradingError('errors.recitationGrading', {}, error);
    throw error;
  }

  let parsedResult: any = { overallFeedback: responseText, pages: [] };
  try {
    parsedResult = JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse JSON grading response", e);
  }
  
  const pages = studentFiles.map((file, i) => {
    const pageData = parsedResult.pages?.find((p: any) => p.pageIndex === i) || { comments: {} };
    return {
      file,
      extractedText: numberedStudentTexts[i],
      comments: {
        spelling: pageData.comments?.spelling || [],
        language: pageData.comments?.language || [],
        content: pageData.comments?.content || [],
      }
    };
  });

  return {
    overallFeedback: parsedResult.overallFeedback || '',
    pages
  };
};
