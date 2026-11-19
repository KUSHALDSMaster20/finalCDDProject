# Campus Commons — Connected Learning Platform

Campus Commons now combines a campus resource board with online classes, family/teacher meetings, translation, and a voice-enabled learning assistant. Students, teachers, and parents use the same responsive web app with role-aware actions.

## Technology

- **Frontend:** React, JavaScript/JSX, HTML, custom CSS, Bootstrap 5, Tailwind CSS, Vite.
- **Backend:** Java 17, Spring Boot, Spring Web, JDBC, WebSockets, BCrypt password hashing.
- **Database:** MySQL/MariaDB, using the existing XAMPP MySQL service and `campus_tracker` database.
- **Local infrastructure:** Docker Compose, XAMPP, Node.js/npm for the frontend.
- **Optional services:** Google Cloud Translation or OpenAI API keys can override/extend the defaults. Docker Compose includes a self-hosted LibreTranslate service, and the learning assistant has built-in help when no AI key is configured. Browser speech recognition and speech synthesis power voice input and read-aloud where supported.
- **Visual design:** Google Fonts and Material Symbols, responsive CSS illustrations and motion.

<<<<<<< HEAD
## Run locally with Docker

1. Copy `.env.example` to `.env` and set a private `JWT_SECRET` (at least 32 random characters). The example connects to the bundled Docker MySQL. To keep using an existing XAMPP database, set `DB_HOST=host.docker.internal` and use that database's existing `DB_PASSWORD`.
2. Start Docker Desktop and run:
=======
## Run with XAMPP and Docker

1. Start MySQL in the XAMPP Control Panel.
2. Import `database/schema.sql` in phpMyAdmin. It creates `campus_tracker`, the account/resource/class/meeting tables, and starter resources. On an existing v1 database the Java API also upgrades the user role column.
3. If `.env` does not exist, copy `.env.example` to `.env`; otherwise keep your current `.env` and update its settings. Set your XAMPP database password and a private `JWT_SECRET`.
4. Optional: add `GOOGLE_TRANSLATE_API_KEY` and/or `OPENAI_API_KEY` in `.env` to enable the connected providers.
5. Start Docker Desktop and run:
>>>>>>> 84687b719dadb2b8b6fedd94ed53cc87c674f615

   ```powershell
   docker compose up --build
   ```

<<<<<<< HEAD
3. Open `http://localhost:3000`. Bundled MySQL data is persisted in the `campus_mysql_data` Docker volume. Schema and starter resources initialize automatically on first startup. MySQL is published on port 3307 so it does not conflict with XAMPP. Existing XAMPP databases are preserved; the API upgrades their user role column at startup.

The Java API health endpoint is `http://localhost:5000/api/health`.

## Run without Docker

Requirements: Java 17, Maven, Node.js 20+, npm, and MySQL 8/MariaDB with `database/schema.sql` imported.
=======
6. Open `http://localhost:3000`. The Java API health endpoint is `http://localhost:5000/api/health`.

The containers connect to XAMPP MySQL through `host.docker.internal:3306`. Keep XAMPP MySQL running while the app is in use.

<<<<<<< HEAD
## Run without Docker

Requirements: Java 17, Maven, Node.js 20+, npm, XAMPP MySQL, and the imported schema.
=======
## Hosting

The full free-hosting walkthrough is in [docs/HOSTING.md](docs/HOSTING.md). It uses Oracle Cloud's free Ampere VM to run the frontend, Java API, MySQL, and LibreTranslate together with Docker Compose, and Caddy to provide HTTPS.

## Run without Docker

Requirements: Java 17, Maven, Node.js 24+, npm, XAMPP MySQL, and the imported schema.
>>>>>>> c4fdfa9 (version 3.3.0)
>>>>>>> 84687b719dadb2b8b6fedd94ed53cc87c674f615

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

<<<<<<< HEAD
## Hosting online

The same Docker Compose stack can run on a Linux VM or any host with Docker Compose. Copy the project to the host, create `.env` with a strong database password and private JWT secret, set `CORS_ORIGIN` to the public app origin, and run `docker compose up --build -d`. Put a TLS reverse proxy (such as Caddy or nginx) in front of port 3000; the web container proxies API and WebSocket traffic to the backend. Keep ports 5000 and 3307 private in production. The included MySQL volume persists data across container restarts. Back up that volume regularly.

For a managed hosted MySQL database, set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` to its connection values. The bundled `mysql` service remains available but the backend connects to the configured host. To deploy only the frontend to Netlify, connect this GitHub repository and set the Netlify environment variable `VITE_API_URL` to the public backend base URL. The root `netlify.toml` configures the frontend build and SPA fallback. Set backend `CORS_ORIGIN` to the Netlify site origin (comma-separated origins are supported) and `API_BIND_ADDRESS=0.0.0.0` so Netlify can reach the API through the host firewall and TLS reverse proxy.

## Features

- Student, teacher, and parent account portals. Existing lecturer accounts are accepted as teacher accounts.
- Student resource search, category filters, reservation, and return. Faculty can add and remove resources they created.
- Faculty-scheduled online classes with shareable room codes. Faculty can remove classes they host.
=======
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> c4fdfa9 (version 3.3.0)
## Deploy on Render

The web service needs a **remote MySQL-compatible database**. `127.0.0.1` inside a Render container points back to that same container, not to XAMPP on your computer. If login and registration fail with MySQL `Connection refused`, set these database values in the Render service's **Environment** page. A no-cost option is a TiDB Cloud Starter database; create a cluster first and use the connection values it gives you:

```text
DB_HOST=<database host>
DB_PORT=<database port, commonly 4000 for TiDB>
DB_NAME=<database name>
DB_USER=<database username>
DB_PASSWORD=<database password>
DB_SSL_MODE=VERIFY_IDENTITY
JWT_SECRET=<a long random secret>
```

Never use `DISABLED` for a public cloud database. Use the TLS mode specified by your provider. Save the variables and redeploy; the app creates its tables when it connects. Keep database credentials in Render's environment settings and never commit them. Free database services have quotas and availability limits; back up important data.

Render free web services can spin down when idle, so the first request may take a while. They do not provide an always-on guarantee.

## Host it online for free

For a server that stays on until you stop it, a practical free option is an Oracle Cloud Always Free VM. The app, MySQL database, and translator run together on the VM with Docker Compose. This avoids relying on your computer's XAMPP database. Oracle's free Ampere allowance is currently up to 2 OCPUs and 12 GB RAM, subject to regional capacity and account terms; Always Free instances can be reclaimed if they meet Oracle's idle thresholds, so this is not an uptime guarantee. See Oracle's [Always Free compute limits](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm) and [free tier FAQ](https://www.oracle.com/cloud/free/faq/).

1. Create an Oracle Cloud Free Tier account and launch an **Always Free eligible** Ubuntu VM.Standard.A1.Flex VM in your home region. Allocate up to 2 OCPUs and 12 GB RAM. Save its public IP and SSH key. Free capacity may not be available in every region.
2. In the VM's VCN security list, allow inbound TCP 80 and 22. Keep port 3306 closed. Port 80 serves the app; for camera/microphone and production use, attach a domain and configure HTTPS before sharing it.
3. SSH into the VM, install Docker Engine and the Docker Compose plugin using Docker's official Ubuntu instructions, then clone this repository. (The official Oracle tutorial also covers creating the VM and network ingress.)
4. In the repository root, create `.env` with these values. Use long random secrets and the public IP in `CORS_ORIGIN`:

   ```dotenv
   DB_PASSWORD=choose-a-long-random-database-password
   DB_NAME=campus_tracker
   JWT_SECRET=choose-a-different-long-random-secret
   CORS_ORIGIN=http://YOUR_VM_PUBLIC_IP
   OPENAI_API_KEY=
   GOOGLE_TRANSLATE_API_KEY=
   ```

   OpenAI and Google keys are optional. Without an OpenAI key, the assistant uses its built-in campus help; this does not provide general generated AI answers.
5. Start it in the background:

   ```bash
   docker compose -f docker-compose.cloud.yml up --build -d
   ```

   Open `http://YOUR_VM_PUBLIC_IP`. Containers restart after a VM reboot and continue running until you stop them. Check logs with `docker compose -f docker-compose.cloud.yml logs -f`; stop the app with `docker compose -f docker-compose.cloud.yml down`. The database volume is retained by `down`; `down -v` deletes the database, so do not use it unless you intend to erase your data.

The cloud Compose file initializes a new MySQL volume from `database/schema.sql` once. Back up that volume regularly. Keep `.env` private and do not commit it. Oracle requires a payment card for identity verification, and free resource availability and policies can change. A free VM is not guaranteed to stay available forever or provide an uptime SLA.

<<<<<<< HEAD
=======
=======
>>>>>>> f52b18b (version 3.3.0)
>>>>>>> c4fdfa9 (version 3.3.0)
## Features

- Student, teacher, and parent account portals. Existing lecturer accounts are accepted as teacher accounts.
- Student resource search, category filters, reservation, and return. Teachers can add resources.
- Teacher-scheduled online classes with shareable room codes.
>>>>>>> 84687b719dadb2b8b6fedd94ed53cc87c674f615
- Faculty call scheduling and video rooms for campus conversations.
- In-browser audio/video calls and screen sharing with WebRTC and WebSocket signaling.
- Text translation through a self-hosted LibreTranslate service, with optional Google Cloud Translation.
- Assistant text chat, optional generated AI responses, speech input, and read-aloud.
- Responsive layouts, animated cards, Google Fonts and Material Symbols.

## Important deployment notes

<<<<<<< HEAD
Set private secrets, serve the app over HTTPS, and configure access to provider APIs before deployment. Browser camera/microphone permissions generally require HTTPS or localhost. Peer-to-peer calls may need a TURN relay on restrictive networks; this local build configures a public STUN server only. Meeting room codes are invitations, so share them with the intended participants. Faculty accounts currently self-register; add school approval before production use.
=======
Set a private JWT secret, serve the app over HTTPS, and configure access to provider APIs before deployment. Browser camera/microphone permissions generally require HTTPS or localhost. Peer-to-peer calls may need a TURN relay on restrictive networks; this local build configures a public STUN server only. Meeting room codes are invitations, so share them with the intended participants. Teacher accounts currently self-register; add school approval before production use.
>>>>>>> 84687b719dadb2b8b6fedd94ed53cc87c674f615

## Provider keys

`GOOGLE_TRANSLATE_API_KEY` optionally enables Google Cloud Translation on the Translator page. Otherwise Docker Compose uses self-hosted LibreTranslate (initial language-model download can take a few minutes). `OPENAI_API_KEY` enables generated assistant replies; `OPENAI_MODEL` can select the model. Without the OpenAI key, the assistant uses built-in campus help. Put secrets in `.env` or Jenkins Credentials, never in source code. No provider keys are included in this project.

## Jenkins CI/CD

The root `Jenkinsfile` builds both Docker images on every branch and polls the repository every five minutes. Create a Jenkins **Multibranch Pipeline** for this repository and allow a Docker-capable Jenkins agent. For push-triggered runs, configure the matching GitHub webhook in Jenkins. The `Deploy to Docker Compose` stage runs only on `main` when `DEPLOY_TO_COMPOSE` is selected.

Before enabling deployment, add Jenkins credentials: username/password `campus-db`, and secret text credentials `campus-jwt-secret`, `google-translate-api-key`, and `openai-api-key`. The Jenkins agent must run Docker Compose and reach the configured MySQL host. Never put tokens in the Jenkinsfile or source repository.
