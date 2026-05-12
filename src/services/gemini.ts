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
  taskDescription: string | File,
  expectedSolution: string | File,
  studentFile: File
) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using the multimodal model 1.5-flash which is standard for these tasks and fast
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const promptParts: any[] = [];
  promptParts.push("Du bist ein erfahrener Lehrer, der eine Schülerarbeit korrigiert.\nBitte analysiere das beigefügte Dokument der Schülerarbeit und vergleiche es mit der folgenden Aufgabenstellung und dem Erwartungshorizont.\n\nAufgabenstellung:\n");

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
  promptParts.push(await fileToGenerativePart(studentFile));
  
  promptParts.push("\n\nBitte gib ein strukturiertes Feedback zur Lösung des Schülers. \nBewerte, ob die Aufgabe vollständig und richtig bearbeitet wurde, und nenne spezifische Fehler oder gute Ansätze.\nSchließe mit einer kurzen Zusammenfassung und ggf. einer Notentendenz (z.B. \"sehr gut\", \"befriedigend\" etc., falls aus dem Erwartungshorizont ableitbar).");

  const result = await model.generateContent(promptParts);
  const response = await result.response;
  return response.text();
};
