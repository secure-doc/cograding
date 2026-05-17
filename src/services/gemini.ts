import { GoogleGenerativeAI } from '@google/generative-ai';

export const fileToGenerativePart = async (file: File) => {
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return { inlineData: { data: base64Data, mimeType: file.type } };
};

export const gradeSubmission = async (
  apiKey: string,
  systemPrompt: string,
  taskDescription: string | File,
  expectedSolution: string | File,
  studentFiles: File[]
) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using the multimodal model 1.5-flash which is standard for these tasks and fast
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt
  });

  const promptParts: any[] = [];
  promptParts.push("Aufgabenstellung:\n");

  if (typeof taskDescription === 'string') {
    promptParts.push(taskDescription + "\n\n");
  } else {
    promptParts.push(await fileToGenerativePart(taskDescription));
    promptParts.push("\n\n");
  }

  promptParts.push("Erwartungshorizont:\n");
  if (typeof expectedSolution === 'string') {
    promptParts.push(expectedSolution + "\n\n");
  } else {
    promptParts.push(await fileToGenerativePart(expectedSolution));
    promptParts.push("\n\n");
  }

  promptParts.push("Schülerarbeit:\n");
  for (const file of studentFiles) {
    promptParts.push(await fileToGenerativePart(file));
  }

  const result = await model.generateContent(promptParts);
  const response = await result.response;
  return response.text();
};
