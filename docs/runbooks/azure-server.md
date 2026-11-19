# Runbook: Azure server

How the StudyMind production server was created and how to operate it.
All commands use the Azure CLI (`az`). If the CLI login from WSL fails
(account in several directories), use Azure Cloud Shell in the portal (`>_`).

## Overview

| What | Value |
|---|---|
| Subscription | Azure for Students |
| Resource group | `studymind-rg` |
| VM | `studymind-server`, Ubuntu 24.04, `Standard_B1s` (1 vCPU, 1 GB RAM) |
| Region | `denmarkeast` (the student policy only allows francecentral, switzerlandnorth, denmarkeast, italynorth, swedencentral) |
| Domain | `studymind-oussama.denmarkeast.cloudapp.azure.com` |
| Open ports | 22 (SSH), 80 + 443 (Caddy) |
| App folder | `/home/azureuser/studymind` |

## 1. Create the Azure resources

```bash
# Allowed regions for this subscription
az policy assignment list --query "[].{name:displayName, regions:parameters.listOfAllowedLocations.value}" --output json

# Check that the VM size is available in the region (Restrictions: None)
az vm list-skus --location denmarkeast --size Standard_B1s --output table

az group create --name studymind-rg --location germanywestcentral

az vm create \
  --resource-group studymind-rg \
  --name studymind-server \
  --location denmarkeast \
  --image Ubuntu2404 \
  --size Standard_B1s \
  --admin-username azureuser \
  --ssh-key-values "<content of ~/.ssh/studymind_azure.pub>" \
  --public-ip-address-dns-name studymind-oussama \
  --os-disk-size-gb 64 \
  --storage-sku Premium_LRS

az vm open-port --resource-group studymind-rg --name studymind-server --port 80,443

# Check
az vm list --resource-group studymind-rg --show-details --output table
az network nsg rule list --resource-group studymind-rg --nsg-name studymind-serverNSG --output table
```

The resource group's location only stores metadata, so the VM can be in another region.

## 2. Log in

```bash
ssh -i ~/.ssh/studymind_azure azureuser@studymind-oussama.denmarkeast.cloudapp.azure.com
```

Only the public key is on the server. Never share the private key.

## 3. Prepare the server (once)

### Swap (2 GB)

The VM has only 1 GB RAM. Without swap, Linux kills a process when memory runs out.

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab   # keep after reboot
free -h
```

### Docker

Follow the official guide: https://docs.docker.com/engine/install/ubuntu/
("Install using the apt repository", steps 1 and 2), then:

```bash
sudo usermod -aG docker $USER   # use docker without sudo; log out and in again
docker run hello-world
```

## 4. App files and secrets

The server only needs `docker-compose.prod.yml`, `Caddyfile` and `.env`.
The backend code comes inside the image from GHCR.

```bash
# On the server
mkdir ~/studymind

# On the laptop, from the repo root (up-to-date main)
scp -i ~/.ssh/studymind_azure docker-compose.prod.yml Caddyfile \
  azureuser@studymind-oussama.denmarkeast.cloudapp.azure.com:~/studymind/
```

Create `~/studymind/.env` on the server with **new** production secrets
(never the same as on the laptop):

```bash
openssl rand -hex 32   # once for POSTGRES_PASSWORD, once for JWT_SECRET_KEY
nano ~/studymind/.env
chmod 600 ~/studymind/.env
```

Required variables (list them with
`grep -o '\${[A-Z_]*}' docker-compose.prod.yml | sort -u`):

```
POSTGRES_USER=studymind
POSTGRES_PASSWORD=<random>
POSTGRES_DB=studymind
JWT_SECRET_KEY=<random>
GEMINI_API_KEY=<production key from Google AI Studio>
DOMAIN=studymind-oussama.denmarkeast.cloudapp.azure.com
CORS_ORIGINS=["<frontend URL>"]
```

`CORS_ORIGINS` must be JSON (a list), otherwise the backend fails at startup.

## 5. Start and update

```bash
cd ~/studymind
docker compose -f docker-compose.prod.yml config --quiet   # no output = OK
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --no-build
docker compose -f docker-compose.prod.yml ps
```

Check: https://studymind-oussama.denmarkeast.cloudapp.azure.com/docs

## Troubleshooting

| Symptom | Meaning | Check |
|---|---|---|
| Browser shows 502 | Caddy works, the backend doesn't answer | `docker compose -f docker-compose.prod.yml ps` → backend `Restarting`? |
| Backend `Restarting` | Crash at startup (often a wrong `.env` value) | `docker compose -f docker-compose.prod.yml logs backend --tail 30`, read the last line |
| No HTTPS certificate | Port 80/443 closed or wrong `DOMAIN` | `docker compose -f docker-compose.prod.yml logs caddy --tail 30` |
| `RequestDisallowedByAzure` | Region not allowed for the subscription | Use a region from the policy list above |

## Costs and cleanup

B1s and a 64 GB disk are within the student free services; the $100
credit covers the rest. To delete everything at once:

```bash
az group delete --name studymind-rg
```

After every merge to `main`, the `deploy` job in `.github/workflows/ci.yml`
runs `pull` and `up -d` automatically. Run these commands by hand only after
changing `.env`, `docker-compose.prod.yml` or `Caddyfile` (copy changed files
with `scp` first).