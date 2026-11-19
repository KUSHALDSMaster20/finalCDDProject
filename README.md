# Campus Commons — Connected Learning Platform

Campus Commons now combines a campus resource board with online classes, family/teacher meetings, translation, and a voice-enabled learning assistant. Students, teachers, and parents use the same responsive web app with role-aware actions.

## Technology

- **Frontend:** React, JavaScript/JSX, HTML, custom CSS, Bootstrap 5, Tailwind CSS, Vite.
- **Backend:** Java 17, Spring Boot, Spring Web, JDBC, WebSockets, BCrypt password hashing.
- **Database:** MySQL/MariaDB, using the existing XAMPP MySQL service and `campus_tracker` database.
- **Local infrastructure:** Docker Compose, XAMPP, Node.js/npm for the frontend.
- **Optional services:** Google Cloud Translation or OpenAI API keys can override/extend the defaults. Docker Compose includes a self-hosted LibreTranslate service, and the learning assistant has built-in help when no AI key is configured. Browser speech recognition and speech synthesis power voice input and read-aloud where supported.
- **Visual design:** Google Fonts and Material Symbols, responsive CSS illustrations and motion.

## Run locally with Docker

1. Copy `.env.example` to `.env` and set a private `JWT_SECRET` (at least 32 random characters). The example connects to the bundled Docker MySQL. To keep using an existing XAMPP database, set `DB_HOST=host.docker.internal` and use that database's existing `DB_PASSWORD`.
2. Start Docker Desktop and run:

   ```powershell
   docker compose up --build
   ```

3. Open `http://localhost:3000`. Bundled MySQL data is persisted in the `campus_mysql_data` Docker volume. Schema and starter resources initialize automatically on first startup. MySQL is published on port 3307 so it does not conflict with XAMPP. Existing XAMPP databases are preserved; the API upgrades their user role column at startup.

The Java API health endpoint is `http://localhost:5000/api/health`.

## Run without Docker

Requirements: Java 17, Maven, Node.js 20+, npm, and MySQL 8/MariaDB with `database/schema.sql` imported.

In one terminal, set the database variables and start the API:

```powershell
cd backend
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "3306"
$env:DB_USER = "root"
$env:DB_PASSWORD = ""
$env:DB_NAME = "campus_tracker"
$env:JWT_SECRET = "replace-with-a-long-random-secret"
mvn spring-boot:run
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`. Vite proxies browser requests to `http://localhost:5000` by default.

## Hosting online

The same Docker Compose stack can run on a Linux VM or any host with Docker Compose. Copy the project to the host, create `.env` with a strong database password and private JWT secret, set `CORS_ORIGIN` to the public app origin, and run `docker compose up --build -d`. Put a TLS reverse proxy (such as Caddy or nginx) in front of port 3000; the web container proxies API and WebSocket traffic to the backend. Keep ports 5000 and 3307 private in production. The included MySQL volume persists data across container restarts. Back up that volume regularly.

For a managed hosted MySQL database, set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` to its connection values. The bundled `mysql` service remains available but the backend connects to the configured host. To deploy only the frontend to Netlify, connect this GitHub repository and set the Netlify environment variable `VITE_API_URL` to the public backend base URL. The root `netlify.toml` configures the frontend build and SPA fallback. Set backend `CORS_ORIGIN` to the Netlify site origin (comma-separated origins are supported) and `API_BIND_ADDRESS=0.0.0.0` so Netlify can reach the API through the host firewall and TLS reverse proxy.

## Features

- Student, teacher, and parent account portals. Existing lecturer accounts are accepted as teacher accounts.
- Student resource search, category filters, reservation, and return. Faculty can add and remove resources they created.
- Faculty-scheduled online classes with shareable room codes. Faculty can remove classes they host.
- Faculty call scheduling and video rooms for campus conversations.
- In-browser audio/video calls and screen sharing with WebRTC and WebSocket signaling.
- Text translation through a self-hosted LibreTranslate service, with optional Google Cloud Translation.
- Assistant text chat, optional generated AI responses, speech input, and read-aloud.
- Responsive layouts, animated cards, Google Fonts and Material Symbols.

## Important deployment notes

Set private secrets, serve the app over HTTPS, and configure access to provider APIs before deployment. Browser camera/microphone permissions generally require HTTPS or localhost. Peer-to-peer calls may need a TURN relay on restrictive networks; this local build configures a public STUN server only. Meeting room codes are invitations, so share them with the intended participants. Faculty accounts currently self-register; add school approval before production use.

## Provider keys

`GOOGLE_TRANSLATE_API_KEY` optionally enables Google Cloud Translation on the Translator page. Otherwise Docker Compose uses self-hosted LibreTranslate (initial language-model download can take a few minutes). `OPENAI_API_KEY` enables generated assistant replies; `OPENAI_MODEL` can select the model. Without the OpenAI key, the assistant uses built-in campus help. Put secrets in `.env` or Jenkins Credentials, never in source code. No provider keys are included in this project.

## Jenkins CI/CD

The root `Jenkinsfile` builds both Docker images on every branch and polls the repository every five minutes. Create a Jenkins **Multibranch Pipeline** for this repository and allow a Docker-capable Jenkins agent. For push-triggered runs, configure the matching GitHub webhook in Jenkins. The `Deploy to Docker Compose` stage runs only on `main` when `DEPLOY_TO_COMPOSE` is selected.

Before enabling deployment, add Jenkins credentials: username/password `campus-db`, and secret text credentials `campus-jwt-secret`, `google-translate-api-key`, and `openai-api-key`. The Jenkins agent must run Docker Compose and reach the configured MySQL host. Never put tokens in the Jenkinsfile or source repository.
