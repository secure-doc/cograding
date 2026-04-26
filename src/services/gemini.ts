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
  taskDescription: string,
  expectedSolution: string,
  studentFile: File
) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using the multimodal model 1.5-flash which is standard for these tasks and fast
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
Du bist ein erfahrener Lehrer, der eine Schülerarbeit korrigiert.
Bitte analysiere das beigefügte Bild der Schülerarbeit und vergleiche es mit der folgenden Aufgabenstellung und dem Erwartungshorizont.

Aufgabenstellung:
${taskDescription}

Erwartungshorizont:
${expectedSolution}

Bitte gib ein strukturiertes Feedback zur Lösung des Schülers. 
Bewerte, ob die Aufgabe vollständig und richtig bearbeitet wurde, und nenne spezifische Fehler oder gute Ansätze.
Schließe mit einer kurzen Zusammenfassung und ggf. einer Notentendenz (z.B. "sehr gut", "befriedigend" etc., falls aus dem Erwartungshorizont ableitbar).
  `.trim();

  const imagePart = await fileToGenerativePart(studentFile);

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  return response.text();
};
