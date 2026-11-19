# Free hosting for Campus Commons

This guide deploys Campus Commons on an Oracle Cloud Infrastructure (OCI) Always Free Ampere VM. The VM runs the complete Docker Compose stack: production-built React frontend, Java/Spring API, MySQL, LibreTranslate, and Caddy for HTTPS. That keeps the database private and persistent, and avoids depending on a web host's separate database service.

## Cost and availability

OCI currently lists up to 1,500 Ampere OCPU-hours and 9,000 GB-hours per month as Always Free, enough for a VM configured with up to 2 OCPUs and 12 GB RAM running continuously for a month. The free allowance is subject to home-region capacity, account limits, and current OCI terms. OCI asks for payment-card details for identity verification. Do not create resources marked paid, and check the account's cost and usage pages after provisioning. See [OCI Free Tier](https://www.oracle.com/cloud/free/), [Always Free resource limits](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm), and [the Always Free FAQ](https://www.oracle.com/cloud/free/faq/).

This is a free hosting option, not an uptime guarantee. OCI may reclaim Always Free compute instances that meet its idle criteria, and home-region capacity can be unavailable. OCI also says free accounts that are inactive can be suspended. Keep off-VM backups of the database. If uninterrupted availability is essential, use a paid host and a managed database.

## What you need

- An OCI Free Tier account and an Ubuntu VM in your OCI home region.
- An SSH key for that VM.
- A free DNS name, such as a DuckDNS subdomain, pointed at the VM's public IPv4 address. DuckDNS describes its service as [free dynamic DNS](https://www.duckdns.org/faqs.jsp). You can also use a domain you already own.
- A computer with Windows PowerShell and the built-in OpenSSH client, or another SSH client.

## 1. Create the VM

1. Sign in to OCI, select your **home region**, and create a compute instance. Choose an Ubuntu Server ARM64 image and shape **VM.Standard.A1.Flex**. Keep the total allocation within the Always Free allowance; **2 OCPUs and 12 GB memory** is a practical maximum for this stack. The Compose images used here publish ARM64 builds.
2. Select a public subnet and assign a public IPv4 address. Download or upload your SSH public key during instance creation. Keep the private key only on your computer.
3. In the VCN security list or network security group attached to the VM, add inbound rules:

   | Protocol | Port | Source |
   | --- | ---: | --- |
   | TCP | 22 | Your current public IP with `/32` |
   | TCP | 80 | `0.0.0.0/0` |
   | TCP | 443 | `0.0.0.0/0` |
   | UDP | 443 | `0.0.0.0/0` (optional HTTP/3) |

   Do **not** open ports 3000, 3306, 5000, or 5001. The app and database containers communicate on Docker's private network.

4. Create a DNS record at DuckDNS or your DNS provider pointing the chosen hostname to the VM public IPv4 address. For this example, assume the hostname is `campuscommons.example.duckdns.org`. Wait until the record resolves to the VM before starting Caddy. Do not add an IPv6 `AAAA` record unless the VM has a working public IPv6 address.

## 2. Connect and install Docker

From Windows PowerShell, connect using the private key you saved. Replace the key path and address with your own:

```powershell
ssh -i "$env:USERPROFILE\.ssh\campus-oci" ubuntu@YOUR_VM_PUBLIC_IP
```

On the Ubuntu VM, install Docker Engine and its Compose plugin using Docker's current [Ubuntu installation instructions](https://docs.docker.com/engine/install/ubuntu/). Then ensure Docker starts on reboot and allow the `ubuntu` user to run Docker commands:

```bash
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
newgrp docker
docker version
docker compose version
```

Enable the VM firewall only after allowing SSH, so you do not lock yourself out:

```bash
sudo apt update
sudo apt install -y ufw git
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw --force enable
sudo ufw status
```

## 3. Download the project and set secrets

Clone the repository on the VM:

```bash
git clone --branch main https://github.com/KUSHALDSMaster20/finalCDDProject.git campus-commons
cd campus-commons
cp .env.example .env
```

Generate two different long random secrets. Run the command twice and use one value for each secret:

```bash
openssl rand -hex 32
```

Edit `.env` on the VM:

```bash
nano .env
```

Set these values. Replace the example hostname with the exact DNS name you registered; do not put `https://` in `SITE_ADDRESS`:

```dotenv
DB_PASSWORD=PASTE_A_RANDOM_SECRET_HERE
DB_NAME=campus_tracker
JWT_SECRET=PASTE_A_DIFFERENT_RANDOM_SECRET_HERE
CORS_ORIGIN=https://campuscommons.example.duckdns.org
SITE_ADDRESS=campuscommons.example.duckdns.org
OPENAI_API_KEY=
GOOGLE_TRANSLATE_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Save and exit Nano with **Ctrl+O**, **Enter**, **Ctrl+X**. The `.env` file is ignored by Git; never commit it or paste its values into a public issue or chat. Leave the OpenAI and Google keys blank if you do not have those provider accounts. The assistant then uses its built-in campus guidance, which is not a general-purpose generative AI model. LibreTranslate runs as a separate container; its first start downloads the selected language models and can take several minutes.

## 4. Start the site

Check that the DNS hostname points to this VM, then start the stack from the repository directory:

```bash
docker compose -f docker-compose.cloud.yml up -d --build
```

The first build downloads base images and builds the Java and frontend images, so it may take several minutes. Caddy obtains and renews an HTTPS certificate automatically when the hostname resolves to this VM and inbound TCP ports 80 and 443 are reachable. See [Caddy automatic HTTPS requirements](https://caddyserver.com/docs/automatic-https).

Open `https://campuscommons.example.duckdns.org`, replacing that address with your hostname. Create a test student account and sign in. HTTPS is required by browsers for microphone and camera access in the meeting features.

Useful status and logs:

```bash
docker compose -f docker-compose.cloud.yml ps
docker compose -f docker-compose.cloud.yml logs --tail=100 backend
docker compose -f docker-compose.cloud.yml logs --tail=100 mysql
docker compose -f docker-compose.cloud.yml logs --tail=100 libretranslate
docker compose -f docker-compose.cloud.yml logs --tail=100 caddy
```

The API health endpoint is `https://YOUR_HOSTNAME/api/health`. To check signup or sign-in failures, inspect the backend log; the database must be healthy and reachable for those endpoints to work.

## Update, stop, and restart

Update the project after a code change:

```bash
cd ~/campus-commons
git pull --ff-only
docker compose -f docker-compose.cloud.yml up -d --build
```

Stop the containers while keeping the database volume:

```bash
docker compose -f docker-compose.cloud.yml down
```

Start them again:

```bash
docker compose -f docker-compose.cloud.yml up -d
```

The services use Docker's `unless-stopped` restart policy and should return after the VM or Docker daemon restarts. `docker compose down` keeps the named MySQL volume. **Do not run `docker compose down -v`** unless you intend to delete the database and Caddy certificate data.

## Back up and restore the database

Create a database dump on the VM. It is written outside the MySQL container into the current project directory:

```bash
docker compose -f docker-compose.cloud.yml exec -T mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' > "campus-commons-$(date +%F).sql"
```

Copy the dump to your Windows computer from a separate PowerShell window:

```powershell
scp -i "$env:USERPROFILE\.ssh\campus-oci" ubuntu@YOUR_VM_PUBLIC_IP:~/campus-commons/campus-commons-YYYY-MM-DD.sql .
```

Keep backups somewhere other than the VM. To restore a dump, place it in the project directory, then run:

```bash
cat campus-commons-YYYY-MM-DD.sql | docker compose -f docker-compose.cloud.yml exec -T mysql sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
```

## Troubleshooting

- **Browser cannot connect:** Confirm DNS points to the VM public IP, and OCI plus Ubuntu firewall rules allow TCP 80/443.
- **Caddy does not issue HTTPS:** Confirm DNS has propagated, ports 80/443 are reachable, and there is no stale `AAAA` record. Check `docker compose -f docker-compose.cloud.yml logs caddy`.
- **Login/signup says request failed:** Check `docker compose -f docker-compose.cloud.yml logs backend mysql`. Confirm `.env` has a non-empty `DB_PASSWORD` and `DB_NAME`; the MySQL container must pass its health check before the API can initialize.
- **Translation is unavailable:** Check LibreTranslate logs and allow the model download to complete. The selected language list is configured in `docker-compose.cloud.yml`.
- **Assistant is not generating open-ended answers:** Add a valid `OPENAI_API_KEY` in `.env`, then run `docker compose -f docker-compose.cloud.yml up -d` to recreate the backend. Provider usage can incur charges; the built-in assistant remains available without the key.
- **VM creation reports no capacity:** OCI A1 capacity varies by home region. Retry later or select another availability domain in the same region; do not create a paid shape by mistake.
- **Memory pressure or containers restart:** Use the full free A1 allocation if available (within the account quota), inspect `docker stats`, and check `dmesg -T | tail` for out-of-memory kills.

## Platform references

- [OCI Free Tier and Always Free resources](https://www.oracle.com/cloud/free/)
- [OCI Always Free compute quotas and idle-instance policy](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [OCI Linux VM tutorial](https://docs.oracle.com/en-us/iaas/Content/Compute/tutorials/first-linux-instance/overview.htm)
- [Docker Engine for Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [DuckDNS FAQ](https://www.duckdns.org/faqs.jsp)
- [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https)
