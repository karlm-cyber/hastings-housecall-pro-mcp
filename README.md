# Hastings Housecall Pro MCP

**OAuth update:** Follow OAUTH-SETUP.md instead of the legacy token setup below.
The static bearer password is no longer supported. Live OAuth setup is pending.

Read-only remote MCP connector for Housecall Pro. It exposes jobs, customers,
estimates, job invoices, and employees to a custom ChatGPT app.

## Security first

Revoke any API key previously pasted into chat. Create a new **read-only** key in
Housecall Pro, and store it only as a deployment secret. Never commit `.env`.

## Deploy to Vercel

1. Import this folder into a new Vercel project.
2. Add these Environment Variables to Production, Preview, and Development:
   - `HOUSECALL_PRO_API_KEY`: a new Housecall Pro read-only API key
   - `CONNECTOR_ACCESS_TOKEN`: a long random value (at least 32 random bytes)
   - `HOUSECALL_PRO_API_BASE`: `https://api.housecallpro.com`
3. Deploy and confirm `https://YOUR-DOMAIN/api/health` returns `{ "status": "ok" }`.

## Add to ChatGPT

In **Workspace Settings → Apps → Create**, enter:

- Name: `Hastings Housecall Pro`
- Description: `Read-only access to Hastings Mechanical Housecall Pro data.`
- Server URL: `https://YOUR-DOMAIN/api/mcp`
- Authentication: **Access token / Bearer token**
- Token: the exact value stored as `CONNECTOR_ACCESS_TOKEN`

Click **Scan Tools**, verify the eight read-only tools, and then click **Create**.

## Local test

```bash
npm install
cp .env.example .env
# Fill .env with safe test values, then export them in your shell.
npm run dev
```

The health endpoint is `http://localhost:3000/api/health`; the MCP endpoint is
`http://localhost:3000/api/mcp`.
