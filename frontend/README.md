# Frontend

The web interface of StudyMind: where students log in, create courses,
upload PDFs, chat with their material and take quizzes.

## Tech stack
- React with TypeScript
- Vite (dev server and build)
- Tailwind CSS
- Vitest and React Testing Library for tests
- ESLint for linting

## Development

All commands run from the `frontend/` folder.

### Setup
```bash
npm install
cp .env.example .env   # first time only
```

`VITE_API_URL` in `.env` points to the backend (default: `http://localhost:8000`).

### Run the app
Start the backend first (see `backend/README.md`), then:
```bash
npm run dev
```
Open http://localhost:5173

### Run tests and checks
```bash
npm test
npm run lint
npm run build
```

## Status
Home page that shows whether the backend is online (see #5).