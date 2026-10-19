# profiler-backend

Edtrepreneurship Profiler API (Express 5 + MongoDB/Mongoose). Users register/log in (JWT), and learners submit a story, goals, motivations and learning style to `/api/assessment/analyze`, which summarises it via the Hugging Face API and stores the profile.

## Commands
- `npm install`: install dependencies
- `npm run dev`: start with auto-reload (nodemon), port 5000
- `npm start`: start once
- `npm test`: Jest tests (mocked DB). Run after every change; treat a failure as unfinished work.

## Settings and secrets
- Required variables are listed in `.env.example`: MONGO_URI, HF_API_KEY, JWT_SECRET. The server refuses to start if any is missing.
- Never read, print, log or commit `.env` or any key value. Refer to variables by name only.
- Never hardcode secrets in code; read them from `process.env`.

## Where things live
- `server.js`: app setup, middleware, routes, DB connection
- `src/routes/auth.js`, `src/routes/assessment.js`: API routes
- `src/models/User.js`, `src/models/Assessment.js`: Mongoose models

## Rules
- Don't add dependencies without asking Joseph.
- Spell the brand exactly "EdtrepreneurIgnite" / "Edtrepreneur".
- This repo is public on GitHub: check `git status` before committing and never stage `.env`, zips or `node_modules`.
