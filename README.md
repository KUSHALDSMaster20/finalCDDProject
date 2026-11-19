# Campus Commons — Connected Learning Platform

Campus Commons now combines a campus resource board with online classes, family/teacher meetings, translation, and a voice-enabled learning assistant. Students, teachers, and parents use the same responsive web app with role-aware actions.

## Technology

- **Frontend:** React, JavaScript/JSX, HTML, custom CSS, Bootstrap 5, Tailwind CSS, Vite.
- **Backend:** Java 17, Spring Boot, Spring Web, JDBC, WebSockets, BCrypt password hashing.
- **Database:** MySQL/MariaDB, using the existing XAMPP MySQL service and `campus_tracker` database.
- **Local infrastructure:** Docker Compose, XAMPP, Node.js/npm for the frontend.
- **Optional services:** Google Cloud Translation or OpenAI API keys can override/extend the defaults. Docker Compose includes a self-hosted LibreTranslate service, and the learning assistant has built-in help when no AI key is configured. Browser speech recognition and speech synthesis power voice input and read-aloud where supported.
- **Visual design:** Google Fonts and Material Symbols, responsive CSS illustrations and motion.

## Run with XAMPP and Docker

1. Start MySQL in the XAMPP Control Panel.
2. Import `database/schema.sql` in phpMyAdmin. It creates `campus_tracker`, the account/resource/class/meeting tables, and starter resources. On an existing v1 database the Java API also upgrades the user role column.
3. If `.env` does not exist, copy `.env.example` to `.env`; otherwise keep your current `.env` and update its settings. Set your XAMPP database password and a private `JWT_SECRET`.
4. Optional: add `GOOGLE_TRANSLATE_API_KEY` and/or `OPENAI_API_KEY` in `.env` to enable the connected providers.
5. Start Docker Desktop and run:

   ```powershell
   docker compose up --build
   ```

6. Open `http://localhost:3000`. The Java API health endpoint is `http://localhost:5000/api/health`.

The containers connect to XAMPP MySQL through `host.docker.internal:3306`. Keep XAMPP MySQL running while the app is in use.

## Run without Docker

Requirements: Java 17, Maven, Node.js 20+, npm, XAMPP MySQL, and the imported schema.

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

## Features

- Student, teacher, and parent account portals. Existing lecturer accounts are accepted as teacher accounts.
- Student resource search, category filters, reservation, and return. Teachers can add resources.
- Teacher-scheduled online classes with shareable room codes.
- Faculty call scheduling and video rooms for campus conversations.
- In-browser audio/video calls and screen sharing with WebRTC and WebSocket signaling.
- Text translation through a self-hosted LibreTranslate service, with optional Google Cloud Translation.
- Assistant text chat, optional generated AI responses, speech input, and read-aloud.
- Responsive layouts, animated cards, Google Fonts and Material Symbols.

## Important deployment notes

Set a private JWT secret, serve the app over HTTPS, and configure access to provider APIs before deployment. Browser camera/microphone permissions generally require HTTPS or localhost. Peer-to-peer calls may need a TURN relay on restrictive networks; this local build configures a public STUN server only. Meeting room codes are invitations, so share them with the intended participants. Teacher accounts currently self-register; add school approval before production use.

## Provider keys

`GOOGLE_TRANSLATE_API_KEY` optionally enables Google Cloud Translation on the Translator page. Otherwise Docker Compose uses self-hosted LibreTranslate (initial language-model download can take a few minutes). `OPENAI_API_KEY` enables generated assistant replies; `OPENAI_MODEL` can select the model. Without the OpenAI key, the assistant uses built-in campus help. Put secrets in `.env` or Jenkins Credentials, never in source code. No provider keys are included in this project.

## Jenkins CI/CD

The root `Jenkinsfile` builds both Docker images on every branch and polls the repository every five minutes. Create a Jenkins **Multibranch Pipeline** for this repository and allow a Docker-capable Jenkins agent. For push-triggered runs, configure the matching GitHub webhook in Jenkins. The `Deploy to Docker Compose` stage runs only on `main` when `DEPLOY_TO_COMPOSE` is selected.

Before enabling deployment, add Jenkins credentials: username/password `campus-db`, and secret text credentials `campus-jwt-secret`, `google-translate-api-key`, and `openai-api-key`. The Jenkins agent must run Docker Compose and reach the configured MySQL host. Never put tokens in the Jenkinsfile or source repository.
