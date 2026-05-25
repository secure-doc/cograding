import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GradingRules } from '../hooks/useGradingRules';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 5, defaultDelayMs = 5000): Promise<T> => {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      if (attempt > maxRetries) {
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

const extractTextFromFile = async (file: File, genAI: GoogleGenerativeAI, flashModelName: string) => {
  const model = genAI.getGenerativeModel({ model: flashModelName });
  const part = await fileToGenerativePart(file);

  let prompt = "Extract all text from this document accurately. Preserve line breaks exactly as they appear in the original document. Do not add any extra explanations, just output the extracted text.";
  if (file.type.includes('pdf')) {
    prompt = "Extract all text from this PDF accurately. Preserve the structure where possible. Do not add any extra explanations, just output the extracted text.";
  } else if (file.type.includes('image')) {
    prompt = "Extract all text from this image accurately (OCR). Do not add any extra explanations, just output the extracted text.";
  }

  const result = await withRetry(() => model.generateContent([prompt, part]));
  return result.response.text();
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

  // 2. Helper to resolve strings or files to text
  const resolveToText = async (input: string | File) => {
    if (typeof input === 'string') return input;
    return extractTextFromFile(input, genAI, flashModel);
  };

  // 3. Extract text from all inputs sequentially to avoid RPM rate limits
  currentStep++;
  updateProgress('progress.extractTask');
  const taskText = await resolveToText(taskDescription);
  if (typeof taskDescription !== 'string') await sleep(4000);

  currentStep++;
  updateProgress('progress.extractExpected');
  const expectedText = await resolveToText(expectedSolution);
  if (typeof expectedSolution !== 'string') await sleep(4000);

  const studentTexts: string[] = [];
  for (let i = 0; i < studentFiles.length; i++) {
    currentStep++;
    updateProgress('progress.extractStudent', i + 1, studentFiles.length);
    const text = await resolveToText(studentFiles[i]);
    studentTexts.push(text);
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
- Ensure line numbers correspond accurately to the line numbers provided in the text.`;

  // 4. Perform Grading using the Pro model
  const gradingModel = genAI.getGenerativeModel({
    model: proModel,
    systemInstruction: systemPrompt + jsonSchemaInstruction,
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const promptParts: string[] = [];
  promptParts.push("Aufgabenstellung:\n" + taskText + "\n\n");
  promptParts.push("Erwartungshorizont:\n" + expectedText + "\n\n");

  const numberedStudentTexts = studentTexts.map(text => 
    text.split('\n').map((line, idx) => `${idx + 1} | ${line}`).join('\n')
  );

  promptParts.push("Schülerarbeit:\n");
  numberedStudentTexts.forEach((text, i) => {
    promptParts.push(`Datei ${i} (pageIndex: ${i}):\n${text}\n\n`);
  });

  const result = await withRetry(() => gradingModel.generateContent(promptParts));
  const response = await result.response;
  
  let parsedResult: any = { overallFeedback: response.text(), pages: [] };
  try {
    parsedResult = JSON.parse(response.text());
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
