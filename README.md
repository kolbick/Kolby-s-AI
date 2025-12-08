# Kolby's AI – Custom Assistant Roadmap

This repository hosts the static frontend for Kolby's AI. The next phase is to turn it into a full custom assistant with a dedicated backend and persistence. The roadmap below distills the project plan into actionable steps so the repo can guide development and deployment.

## Architecture & Hosting
- **Separation of concerns:** Keep the frontend static (GitHub Pages-compatible) and point it to a dedicated API service (e.g., `https://api.kolbysai.com`).
- **Backend runtime:** A FastAPI (Python) or Express/NestJS (TypeScript) service that can call local LLMs (llama.cpp/llama-cpp-python, LocalAI, or Ollama) and expose REST/WebSocket endpoints.
- **Persistence:** Start with SQLite for users, conversations, and messages; allow easy upgrade to Postgres/MySQL later. Enforce per-user access to conversation data.
- **Containerization:** Use Docker (and optionally Docker Compose) for the backend and any model-serving sidecar (e.g., LocalAI/Ollama) to keep deployments reproducible.
- **Deployment targets:**
  - Frontend: GitHub Pages (static export) or served by the backend if you reverse-proxy at `kolbysai.com`.
  - Backend: VPS/home server with HTTPS (e.g., via Caddy/Nginx + Let’s Encrypt) reachable at `api.kolbysai.com`.

## Frontend Work
- **Framework choice:** Pick React (Next.js/Vite) or SvelteKit to replace the static HTML with a SPA that matches the current layout (sidebar, chat panel, quick prompts).
- **State management:** Track auth state, selected model, current conversation, message list, and request status. In React, Context + reducer or Zustand works well; in Svelte, use stores.
- **Chat UX:**
  - Send messages via `/api/chat` (or WebSocket) and stream responses token-by-token where possible.
  - Preserve “quick prompt” buttons and add “New chat” behavior that resets state and posts to the backend.
  - Add a visible status indicator (e.g., “Connected”, “Backend offline”, “Generating…”).
- **Auth UI:** Login form (modal or route) that stores a JWT/session token; conditionally render admin-only links when `user.role === "admin"`.
- **Model picker:** Fetch available models from `/api/models`, display metadata (local/cloud, size, GPU/CPU), and keep selection in sync with chat requests.
- **History pane:** Fetch and render conversation titles for the logged-in user; allow loading, renaming, and deleting threads.

## Backend Work
- **Core endpoints:**
  - `POST /api/login` (issue JWT after password hash check) and `POST /api/register` (optional).
  - `GET /api/models` (list available model IDs/names and capabilities).
  - `POST /api/chat` with `{ model, messages }`, returning streamed or buffered assistant output.
  - `GET /api/conversations` and `GET /api/conversations/:id` scoped to the authenticated user; `POST /api/conversations` to create; `DELETE`/`PATCH` to manage titles.
- **Model abstraction:** Implement a single `generate(model, messages)` adapter that can call:
  - LocalAI/Ollama via OpenAI-compatible REST, **or**
  - In-process llama.cpp/transformers bindings for GGUF/GPTQ models.
- **Persistence schema:** Tables for `users`, `conversations`, `messages` (with role/user association). Add an `is_admin` flag for elevated controls.
- **Security:** CORS for the Pages domain, JWT validation middleware, rate limiting on `/api/chat`, input length limits, and HTML escaping in message rendering.
- **Browser agent (optional):** Expose `POST /api/agent/browser` to run a Playwright/Puppeteer routine that retrieves page text for the model to use as context.

## Testing & QA
- Unit-test the model adapter and auth flows. Integration-test chat round-trips (request → model → DB persistence) and authorization (users cannot read others’ chats).
- Exercise long conversations to ensure context window trimming/summary strategies work and the UI remains responsive during streaming.
- Validate error states: backend offline, model missing, auth failure, and generation timeout.

## Deployment Checklist
- Configure environment variables for DB URL, JWT secret, allowed origins, and model paths.
- Prepare Dockerfiles (backend + optional LocalAI/Ollama) and a Compose file for local/home-server deployment.
- Build and publish the frontend to GitHub Pages (or serve from the backend) and point DNS/CNAME to `kolbysai.com`. Reverse-proxy `/api` to the running backend service.
- Add monitoring/logging for request errors and resource usage (GPU/CPU) to guide future optimizations.

## Next Actions
- Choose the frontend framework (React/Next or SvelteKit) and scaffold the app that mirrors the current UI design.
- Stand up the backend skeleton with auth, `/api/models`, `/api/chat`, and SQLite persistence using an ORM.
- Wire the existing UI to the live API endpoints and enable streaming responses.
- Commit Docker/Compose configs to make local + VPS deployment repeatable.
