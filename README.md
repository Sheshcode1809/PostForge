# PostForge - Professional LinkedIn Post Generator & Writing Studio

PostForge is an editorial LinkedIn drafting studio designed for founders, engineers, and creators. It generates multi-angle post variations, provides AI-guided targeted rewrites, customizable voice profiles, proven editorial templates, and cloud-synced draft history.

---

## ✨ Features

- **Multi-Angle Generation**: Generates 3 distinct post variations for each idea (e.g. Counterintuitive, Actionable Checklist, Relatable Narrative).
- **Inline Editing & Word/Char Counter**: Full inline drafting mode with live word and character counts. Restores original drafts on cancel.
- **Targeted Rewrites**: 1-click single-purpose transformations:
  - ⚡ *Strengthen Opening Hook*
  - 🔍 *Make Clearer & Simpler*
  - ✂️ *Make 25% Shorter*
  - ☕ *Make Warmer & Sincere*
  - 💬 *Stronger Closing Question*
- **Personal Voice Profile**: Configure your signature writing style to steer all generation toward your authentic voice.
- **Prompt & Format Template Library**: Pre-built frameworks across Lessons Learned, Tactical Lists, Contrarian Takes, Announcements, and Retro Breakdowns.
- **Accounts & Synced Draft History**:
  - Secure authentication (Signup, Login, Logout, Password Reset).
  - Passwords hashed using Node.js native `crypto.scryptSync`.
  - HTTP-only session cookies with zero credentials in browser `localStorage`.
  - Strict per-user ownership and cross-device draft synchronization.
  - Explicit consent prompt before importing local drafts to an account.
- **Publishing Schedule Planner & Export**:
  - Direct 1-click Google Calendar scheduling reminder with post body pre-filled.
  - Markdown (`.md`) and Plain Text (`.txt`) export.
  - Shareable post preview overview.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- pnpm (v9+)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Run Development Server
Runs both the Express API server (port 8080) and the Vite React frontend (port 5173) in parallel with a single command:
```bash
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
pnpm run build
```

---

## 📁 Architecture & Workspace

- `artifacts/linkedin-generator`: React 18 + Vite + Tailwind CSS + Radix UI frontend.
- `artifacts/api-server`: Express 5 REST API with session auth and draft endpoints.
- `lib/api-client-react`: React Query hooks for API mutations and queries.
- `lib/api-zod`: Shared Zod validation schemas and TypeScript types.
- `lib/db`: User-scoped persistence layer with fallback local storage (`.data/db_store.json`) and PostgreSQL compatibility.
- `lib/api-spec`: OpenAPI 3.0 specification (`openapi.yaml`).

---

## 📄 License
MIT
