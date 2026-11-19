# ADR 007: Deployment to one Azure VM with Docker Compose

## Status
Accepted

## Context
StudyMind should be online, and every merge to `main` should go live
without manual work. The budget is an Azure for Students subscription
($100 credit, only five allowed regions). The app is small: one backend,
one Postgres database, few users.

## Decision
- **One Azure VM** (`Standard_B1s`, Ubuntu 24.04, `denmarkeast`) runs
  Postgres, the backend and Caddy with `docker-compose.prod.yml`.
- **Caddy** is the only public entry point (ports 80/443) and gets HTTPS
  certificates from Let's Encrypt automatically. Postgres and the backend
  are only reachable inside the Docker network.
- **GitHub Actions** builds the backend image and pushes it to GHCR
  (`publish`). After that, the `deploy` job logs in to the VM over SSH and
  runs `docker compose pull` and `up -d`. Old images are pruned so the small
  disk does not fill up.
- The deploy job uses **its own SSH key**, not a personal one. The private
  key, host, user and the server's fingerprint (`known_hosts`) are GitHub
  secrets. Host key checking stays on.
- Production secrets live only in `.env` on the server (mode 600) and are
  different from the development secrets.
- The server was created with the Azure CLI; every step is in
  `docs/runbooks/azure-server.md`.

## Alternatives considered
- **Azure App Service / Container Apps:** managed and scalable, but costs
  more than the student credit allows for an app with a database, and
  hides what happens on the server.
- **Managed Postgres (Azure Database for PostgreSQL):** backups and updates
  included, but too expensive for the credit. Postgres runs in a container
  with a named volume instead.
- **Terraform / Bicep:** the right tool for larger setups. For one VM, the
  CLI commands in the runbook are easier to understand and repeat.

## Consequences
- Cheap and simple: one server, one Compose file, deploys in about a minute.
- No high availability: if the VM is down, the app is down. A deploy causes
  a few seconds of downtime while the backend restarts.
- No automatic database backups yet.
- Changes to `docker-compose.prod.yml` or `Caddyfile` are not deployed
  automatically; they must be copied to the server with `scp`
  (see the runbook).
- 1 GB RAM is tight; 2 GB swap prevents crashes, but heavy load would be slow.