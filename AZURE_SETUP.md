# Azure Hosting Setup — Meridian Studio

This guide provisions the Azure resources required to run Meridian Studio as a
containerised Azure Static Web App (Bring Your Own Container).

## Prerequisites

```bash
az --version      # Azure CLI 2.50+
docker --version  # Docker 24+
gh --version      # GitHub CLI
```

Log in:

```bash
az login
az account set --subscription "<your-subscription-id>"
```

---

## 1. Provision Azure Resources

```bash
# ── Variables (adjust as needed) ─────────────────────────────────────────────
RG=meridian-rg
LOCATION=eastus
ACR_NAME=meridianstudioacr        # must be globally unique, alphanumeric only
SWA_NAME=meridian-studio

# ── Resource Group ────────────────────────────────────────────────────────────
az group create --name $RG --location $LOCATION

# ── Azure Container Registry (Basic) ─────────────────────────────────────────
az acr create \
  --resource-group $RG \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Retrieve credentials (needed for GitHub secrets)
az acr credential show --name $ACR_NAME --query "{server:loginServer,user:username,pass:passwords[0].value}" -o table

# ── Azure Static Web Apps (Standard — required for BYOC) ─────────────────────
az staticwebapp create \
  --name $SWA_NAME \
  --resource-group $RG \
  --location $LOCATION \
  --sku Standard

# Get the deployment token (needed for AZURE_STATIC_WEB_APPS_API_TOKEN)
az staticwebapp secrets list \
  --name $SWA_NAME \
  --resource-group $RG \
  --query "properties.apiKey" -o tsv
```

---

## 2. Configure GitHub Secrets & Variables

In your GitHub repository → **Settings → Secrets and variables → Actions**:

### Secrets
| Name | Value |
|---|---|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Output of `az staticwebapp secrets list` above |
| `ACR_LOGIN_SERVER` | e.g. `meridianstudioacr.azurecr.io` |
| `ACR_USERNAME` | ACR admin username |
| `ACR_PASSWORD` | ACR admin password |

### Variables (not secrets — visible in logs)
| Name | Example Value |
|---|---|
| `VITE_API_BASE_URL` | `https://api.yourdomain.com` |
| `VITE_MCP_BASE_URL` | `https://mcp.yourdomain.com` |

---

## 3. First Deployment

Push to `main` — the `azure-deploy.yml` workflow will:

1. Build the Docker image with your API URLs baked in
2. Push the image to ACR
3. Deploy the image to Azure Static Web Apps

Monitor progress under **Actions** tab in GitHub.

---

## 4. Verify

```bash
# Get the SWA hostname
az staticwebapp show \
  --name $SWA_NAME \
  --resource-group $RG \
  --query "defaultHostname" -o tsv
```

Open `https://<defaultHostname>` in your browser. Navigate to `/query` directly
to confirm React Router fallback is working.

---

## 5. Local Docker Test (before pushing)

```bash
docker build \
  --build-arg VITE_API_BASE_URL=http://localhost:8000 \
  --build-arg VITE_MCP_BASE_URL=http://localhost:8001 \
  -t meridian-studio:local .

docker run -p 8080:80 meridian-studio:local
# Open http://localhost:8080
```

---

## Cost Estimate

| Resource | SKU | ~Monthly Cost |
|---|---|---|
| Azure Container Registry | Basic | ~$5 |
| Azure Static Web Apps | Standard | ~$9 |
| **Total** | | **~$14/month** |

> Free tier SWA does **not** support Bring Your Own Container — Standard is required.
