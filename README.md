# Hallen

React + ASP.NET Core + PostgreSQL för spelargrupper, lag, matcher och resultat.

## Lokal utveckling

```bash
npm install
npm --prefix frontend/hallen-app ci
dotnet restore backend
docker compose up -d
npm run db:update
npm run dev
```

Databasmigreringar körs automatiskt vid lokal API-start i Development.

Frontend: `http://localhost:5173`. API: `https://localhost:7251`.
Frontend skickar `/api` via Vites lokala proxy till API:et, så inloggningen använder
samma adress som sidan. Endast i Development skickas kakan utan Secure så att
lokal HTTP fungerar; produktionskakan kräver HTTPS.

## Demo och produktion

[Guiden för Render och Supabase](docs/DEPLOYMENT.md) beskriver kontoinställningar,
hemligheter, migreringar, första användaren och övergången till produktion.

```bash
docker build -t hallen:demo .
python3 scripts/smoke-deployment.py --image hallen:demo
```

`render.yaml` är en Blueprint för en gratis demo-instans. `Dockerfile` bygger både
frontend och backend och serverar dem på samma adress. Ingen tjänst publiceras
bara genom att filerna läggs till i repot.
