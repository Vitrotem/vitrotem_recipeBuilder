# VitroTEM Protocol Builder

Graphene liquid cell protocol builder for cryo-EM and room-temperature EM.

- **frontend/** — Next.js app (deploy to Vercel)
- **backend/** — FastAPI API (deploy to Fly.io) with MongoDB Atlas

## Local development

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with MONGODB_URI, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# API_URL=http://localhost:8000  (server-only; browser calls /api/* via rewrite)
npm run dev
```

Open http://localhost:3000 and sign in with the admin credentials from `.env`.

## Fly.io backend

From `backend/`:

```bash
fly auth login
fly apps create vitrotem-recipes-api
fly secrets set --app vitrotem-recipes-api `
  "MONGODB_URI=mongodb+srv://USER:PASSWORD@vitrotem-cluster.spc45fz.mongodb.net/recipebuilder?retryWrites=true&w=majority" `
  "MONGODB_DB=recipebuilder" `
  "JWT_SECRET=long-random-string" `
  "ADMIN_USERNAME=admin" `
  "ADMIN_PASSWORD=your-lab-password" `
  "CORS_ORIGINS=http://localhost:3000,https://YOUR-VERCEL-APP.vercel.app"
fly deploy
```

Ensure MongoDB Atlas **Network Access** allows Fly (or `0.0.0.0/0` for development) and that the database user password in `MONGODB_URI` is correct. If Atlas auth fails, regenerate the user password in Atlas and update the secret:

```powershell
fly secrets set --app vitrotem-recipes-api "MONGODB_URI=mongodb+srv://USER:NEW_PASSWORD@vitrotem-cluster.spc45fz.mongodb.net/recipebuilder?retryWrites=true&w=majority"
```

API health: `https://vitrotem-recipes-api.fly.dev/health`

## Vercel frontend

1. Import this repo in Vercel and set the **Root Directory** to `frontend`.
2. Add environment variable (**Config**, not `NEXT_PUBLIC_`):

   `API_URL=https://vitrotem-recipes-api.fly.dev`

3. Remove any old `NEXT_PUBLIC_API_URL` variable, then redeploy.

The browser talks only to `/api/*` on your Vercel domain; Next.js rewrites those to Fly.

## Auth

Simple JWT login. On first boot the backend seeds `ADMIN_USERNAME` / `ADMIN_PASSWORD` into MongoDB (password hashed). Change the password via secrets and clear/reseed the user document if you need to rotate it.
