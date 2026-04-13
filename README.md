# CodeMind - AI Code Reviewer

CodeMind is a web app for reviewing, explaining, and fixing code snippets using LLMs.
It supports multiple languages and multiple AI providers through a single interface.

## Overview

CodeMind helps developers quickly answer 3 common questions:

1. What is wrong with this code?
2. Can you explain this code clearly?
3. Can you fix this bug directly?

The app provides:

1. Review mode: structured JSON output (`issues`, `suggestions`, `security`).
2. Explain mode: plain-English line-by-line explanation.
3. Fix mode: corrected code only.

## Features

1. App Router with Next.js + TypeScript.
2. Dark-themed UI with responsive layout.
3. Language selector: Python, JavaScript, TypeScript, Java, C++.
4. Provider selector: OpenRouter or Groq.
5. Local review history (last 5 results) using `localStorage`.
6. Structured rendering for review JSON.
7. Error handling for invalid input and provider/API failures.

## Tech Stack

1. Next.js 14
2. React 18
3. TypeScript
4. TailwindCSS
5. `react-markdown`
6. `lucide-react`

## Project Structure

```text
app/
	api/review/route.ts        # AI gateway API (OpenRouter/Groq)
	components/CodeReviewer.tsx # Main client component
	page.tsx                    # Landing page
	layout.tsx
	globals.css
.env.local.example
vercel.json
```

## Environment Variables

Create `.env.local` from `.env.local.example`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=qwen/qwen3-36b-plus

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

Notes:

1. `OPENROUTER_MODEL` and `GROQ_MODEL` are optional overrides.
2. If model vars are missing, route defaults are used.

## Model Configuration

Current defaults in API route:

1. OpenRouter: `qwen/qwen3-36b-plus`
2. Groq: `openai/gpt-oss-120b`

## API Contract

Endpoint:

```text
POST /api/review
```

Request body:

```json
{
	"code": "print('Hello')",
	"language": "Python",
	"mode": "review",
	"provider": "openrouter"
}
```

Field rules:

1. `code`: required, max 5000 chars.
2. `language`: optional string.
3. `mode`: required, one of `review | explain | fix`.
4. `provider`: optional, one of `openrouter | groq`.

Success response:

```json
{
	"result": "...model output..."
}
```

Error response:

```json
{
	"error": "...message..."
}
```

Status codes:

1. `400`: input validation failed.
2. `500`: missing key or provider request failed.

## Getting Started

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Start production server:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

## Usage Flow

1. Paste code into editor.
2. Select language.
3. Select AI provider.
4. Choose action: Review, Explain, or Fix.
5. Inspect result panel.
6. Click a history item to restore old input/output.

## Deployment

This project includes `vercel.json` with API function timeout configured for `app/api/review/route.ts`.

To deploy:

1. Push repository to GitHub.
2. Import project into Vercel.
3. Add environment variables in Vercel dashboard.
4. Deploy.

## Troubleshooting

### 1) `npm run dev` fails on Windows path with special characters

If your folder path contains special characters (for example `&`), npm `.bin` resolution may fail in PowerShell/CMD.

This project already uses direct Node script paths in `package.json` to reduce that issue.

If needed, run from a safe junction path (without special characters).

### 2) API returns `Missing OPENROUTER_API_KEY` or `Missing GROQ_API_KEY`

Check `.env.local` and restart dev server.

### 3) Review output not rendered as structured cards

Review mode expects valid JSON from model with keys:

1. `issues`
2. `suggestions`
3. `security`

If model returns plain text, app will show fallback rendering.

## Roadmap

1. PR comment format export.
2. Severity tagging (`Critical`, `Major`, `Minor`).
3. File upload and multi-file analysis.
4. Team-level review history and shared reports.

## License

MIT (you can change this to your preferred license).
