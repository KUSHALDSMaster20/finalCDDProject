# Campus Commons user manual

## Requirements

- Windows with Docker Desktop running.
- XAMPP with **MySQL** running on port 3306. Apache is not required by the app. phpMyAdmin is useful for importing the schema.
- A current browser such as Chrome or Edge. Use `http://localhost:3000` so the browser can grant local camera and microphone access.

## Start the application

1. Open XAMPP Control Panel and click **Start** beside MySQL. Wait until XAMPP shows MySQL running.
2. If this is a new database, open phpMyAdmin at `http://localhost/phpmyadmin`, choose **Import**, select `database/schema.sql`, then click **Import**. This creates the `campus_tracker` database and its tables. Do not re-import if you need to preserve an existing database.
3. In PowerShell, move to the project folder:

   ```powershell
   cd "D:\CDD_6th_experiment\CDD_Project - Copy"
   ```

4. Create a local environment file the first time only:

   ```powershell
   Copy-Item .env.example .env
   ```

   Open `.env` and set the XAMPP MySQL username, password, database name, and a private `JWT_SECRET`. The default XAMPP root account often has an empty password; use the password configured on your computer. Keep `.env` private.
5. Make sure Docker Desktop is running, then start all services:

   ```powershell
   docker compose up -d --build
   ```

   The first startup downloads the LibreTranslate image and language models. Give it several minutes before trying to translate. Google and OpenAI API keys are optional.
6. Check service status:

   ```powershell
   docker compose ps
   ```

   Open `http://localhost:3000` and create a Student, Teacher, or Parent account. The Java API is at `http://localhost:5000/api/health`.

## Stop, start, and update

- Stop containers while preserving the downloaded translator data: `docker compose stop`.
- Start them again: `docker compose start`.
- Rebuild after changing project code: `docker compose up -d --build`.
- Follow service logs: `docker compose logs -f frontend backend libretranslate`. Press **Ctrl+C** to stop viewing logs; it does not stop the containers.
- Refresh the site after a rebuild with **Ctrl+Shift+R**.

## Use the campus tools

- **Resource board:** Students search and filter resources, reserve available items, and return their own bookings. Teachers can add resources.
- **Online classes:** Teachers create a class with a title, subject, and time, then share its room code. Students choose **Join class**.
- **Call Faculty:** Any signed-in user can schedule a faculty conversation. Add a topic and time, then share the room code with the intended participants. They choose **Join call** at the scheduled call card.
- **Video controls:** Allow camera and microphone access to preview yourself and join the room. Use the call buttons to mute, turn the camera off, share your screen, copy the room code, or leave.
- **Translator:** Enter up to 4,000 characters, choose a target language, and select **Translate text**. By default, translation uses the self-hosted LibreTranslate service and needs no API key. First use can be delayed while language models download.
- **AI assistant:** Type a question or press the microphone button if your browser supports speech recognition. Use the speaker button to read an answer aloud. Built-in campus guidance and study-planning replies work without an AI key. An OpenAI key enables generated responses.

## Fix camera and microphone permission errors

If a browser prompt was dismissed, the call room now shows a **Try again** button with instructions instead of a generic “Permission dismissed” alert.

1. In Chrome or Edge, click the site information/settings icon to the left of `localhost:3000` in the address bar.
2. Open **Site settings** and set **Camera** and **Microphone** to **Allow** for localhost.
3. Reload the page, open the call card, and select **Join call**. If the prompt appears, choose **Allow** for both devices. If it was already dismissed, press **Try again** in the call window.
4. On Windows, if access is still blocked, open **Settings → Privacy & security → Camera** and **Microphone** and allow access for desktop apps. Check that another app is not using the devices.

Each participant must allow their own camera and microphone. If the browser cannot access a device, use a current browser on `localhost` or HTTPS and check Windows device permissions.

## Optional provider keys

Set keys in `.env`, then rebuild/restart the backend with `docker compose up -d --build backend`:

- `GOOGLE_TRANSLATE_API_KEY` switches translation to Google Cloud Translation. Leave blank to use the local LibreTranslate service.
- `OPENAI_API_KEY` enables generated assistant responses. Leave blank to use the built-in learning assistant.
- `OPENAI_MODEL` optionally selects the OpenAI model.

Never paste provider keys into source code, chat, or screenshots. No provider keys are included with this project.

## Jenkins CI/CD

The root `Jenkinsfile` builds the Java API and frontend Docker images. Create a Jenkins Multibranch Pipeline connected to this repository and use a Docker-capable agent. Deployment is opt-in through the `DEPLOY_TO_COMPOSE` build parameter on the `main` branch. Configure the Jenkins credentials named in the Jenkinsfile before enabling deployment. The Jenkins controller URL and job still need to be connected to the project owner’s Jenkins instance.

## Troubleshooting

- **Site is blank or outdated:** Confirm the frontend container is running with `docker compose ps`, then refresh using **Ctrl+Shift+R**. Inspect frontend logs with `docker compose logs --tail 100 frontend`.
- **API/database error:** Confirm XAMPP MySQL is running on port 3306 and `.env` has matching `DB_USER`, `DB_PASSWORD`, and `DB_NAME`; inspect `docker compose logs --tail 100 backend`.
- **Port is already in use:** Close the other app using port 3000 or 5000, then run `docker compose up -d --build` again.
- **Translator is not ready:** On the first run, wait for language models to finish downloading. Check `docker compose logs -f libretranslate`; retry the translation after the service starts.
- **Call has no other participant:** Confirm both people joined the same room code and each has allowed the browser camera and microphone. This local version uses STUN only; some networks require a TURN relay.
- **Voice input does not work:** Browser speech recognition support varies. Type your question in the assistant chat instead.
