# Projekt-Spezifikation: CoGrader.ai

## 1. Übersicht
CoGrader.ai ist eine React-basierte Web-Applikation, die Lehrer bei der Korrektur von Klausuren unterstützt. Die App nutzt die Gemini 1.5 API (Multimodal), um handschriftliche Scans/Fotos von Schülerarbeiten zu analysieren und sie mit einer vorgegebenen Aufgabenstellung sowie einem Erwartungshorizont abzugleichen.

## 2. Architektur-Prinzipien
* **Bring Your Own Key (BYOK):** Die App besitzt kein eigenes Backend. Nutzer geben ihren eigenen Google Gemini API-Key an.
* **Serverless/Static:** Die App läuft rein im Browser (Client-side). Der API-Key wird nur lokal im `localStorage` gespeichert.
* **Direkte API-Kommunikation:** Die Kommunikation mit der Gemini-API erfolgt direkt über das offizielle `@google/generative-ai` SDK. Ein Backend-Proxy ist aufgrund des BYOK-Ansatzes nicht zwingend erforderlich (CORS wird vom SDK gehandhabt).

## 3. Technischer Stack
* **Frontend:** React (Vite als Build-Tool)
* **Sprache:** JavaScript/JSX (oder TypeScript)
* **KI-Integration:** `@google/generative-ai`
* **Styling:** Tailwind CSS (empfohlen für schnelles Prototyping)
* **Zustandsverwaltung:** React Hooks (useState, useEffect)

## 4. Kern-Features & Logik

### A. API-Key Management
* Eingabefeld für den API-Key (Typ: Password).
* Speicherung im `localStorage`.
* Validierung des Keys beim ersten API-Aufruf.

### B. Multimodale Korrektur
Der Korrektur-Prozess erfordert drei Eingaben:
1.  **Text:** Aufgabenstellung
2.  **Text:** Erwartungshorizont
3.  **Bild:** Scan der Schülerarbeit (Upload als Datei/Foto)

**Verarbeitungs-Logik:**
Bilder müssen im Frontend in Base64 umgewandelt werden, um sie an das SDK zu übergeben:
```javascript
const fileToGenerativePart = async (file) => {
  const base64Data = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return { inlineData: { data: base64Data, mimeType: file.type } };
};