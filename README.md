# AI Business Analytics

Upload a CSV, get automated data profiling, anomaly detection, a health
score, auto-generated charts, an AI-written business summary (Groq
`llama-3.3-70b-versatile`), a trained baseline ML model (scikit-learn
Random Forest), a downloadable PDF report, and a chat interface to ask
questions about your data — all behind real user accounts.

## Stack

- **Backend**: FastAPI, pandas, scikit-learn, matplotlib/seaborn, reportlab, Groq

- **DB**: PostgreSQL via SQLAlchemy + Alembic migrations (SQLite fallback for quick local testing)
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind


### 1. Rotate your Groq key

If you inherited this repo from an earlier zip, the old `.env.example`
had a real key committed to it. Revoke it and generate a fresh one at
https://console.groq.com/keys before doing anything else.

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env: set GROQ_API_KEY, DATABASE_URL, JWT_SECRET_KEY
# Generate a JWT secret with: python -c "import secrets; print(secrets.token_hex(32))"

# Option A — quick local start (SQLite, no Postgres needed):
#   leave DATABASE_URL unset / remove it from .env, tables are created
#   automatically on startup.
#
# Option B — Postgres (recommended, matches production):
alembic upgrade head

uvicorn main:app --reload
```

API docs at http://127.0.0.1:8000/docs.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
npm run dev
```

App at http://localhost:3000. You'll be redirected to `/login` — register
an account, then upload a CSV.

### 4. Or run everything with Docker

```bash
cp backend/.env.example backend/.env   # fill in real values first
docker compose up --build
```

## What's implemented

- Email/password auth (JWT, bcrypt) — `/auth/register`, `/auth/login`, `/auth/me`
- Every upload is tied to the logged-in user and saved to Postgres
  (`GET /datasets` for history, `GET /datasets/{id}` to reload without
  recomputing)
- Chat history persisted per dataset (`GET /chat/{dataset_id}`)
- add the history button
- Every model-training run logged (`training_runs` table)


## Still worth adding before a real production launch

- Rate limiting on `/upload` and `/chat` (a single abusive user can hammer the Groq API / burn compute)
- Background job queue (Celery/RQ) for large CSVs — the whole pipeline (profiling + charts + PDF + AI summary) currently runs synchronously in the request
- File size limits + stricter CSV validation on `/upload`
- Password reset / email verification flow
- Object storage (S3-compatible) instead of local disk for `uploads/` and `reports/` once you deploy somewhere without persistent disk (e.g. most PaaS)
