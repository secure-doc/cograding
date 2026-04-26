# CoGrader.ai - AI Assistant Guidelines

Welcome! If you are an AI assistant helping to develop this project, please read these guidelines carefully to understand the architecture and goals of CoGrader.ai.

## Architecture Principles

1. **Client-Side Only**: This is a pure React frontend application built with Vite and Tailwind CSS. **Do not create a backend.** 
2. **Bring Your Own Key (BYOK)**: We do not host or pay for the Gemini API key. Users must provide their own Google Gemini API key. 
3. **Local Storage**: The API key is stored securely in the browser's `localStorage` via the `useApiKey` hook.
4. **Direct API Communication**: Communication with the Gemini API happens directly from the browser using the official `@google/generative-ai` SDK.

## Technology Stack

- **Framework**: React 19+ (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (configured via Vite plugin, no `tailwind.config.js` or `postcss.config.js`)
- **Icons**: `lucide-react`
- **Markdown Rendering**: `react-markdown` and `@tailwindcss/typography`
- **AI SDK**: `@google/generative-ai` (Gemini 1.5 Flash model)

## Core Logic & Data Flow

- The grading process requires three inputs:
  1. Task Description (Text)
  2. Expected Solution (Text)
  3. Student Submission (Image or PDF)
- Images are converted to Base64 (using `fileToGenerativePart` in `src/services/gemini.ts`) before being sent to the Gemini API.

## Future Development Ideas

When extending this application, keep the BYOK paradigm in mind. Possible extensions include:
- Generating and exporting PDF reports of the grading results.
- Storing past grading sessions locally using IndexedDB.
- Adding a prompt-tuning UI to let teachers customize how Gemini grades the papers.
- Batch processing multiple student submissions.

## Rules for AI Programming

- Do not add backend code (Node.js/Express/Python).
- Preserve the Tailwind v4 setup. 
- Keep components small and focused.
- Ensure the UI remains clean, modern, and accessible.
