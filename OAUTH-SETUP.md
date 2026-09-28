# OAuth setup (replaces the original bearer-token instructions)

Live sign-in and HCP access remain unverified until Auth0 is configured.
Static CONNECTOR_ACCESS_TOKEN passwords are no longer accepted.

Create an Auth0 API with RS256 and identifier:
https://hastings-housecall-pro-mcp.vercel.app/api/mcp

Add scope hcp:read. Enable Resource Parameter Compatibility Profile in tenant
settings. Configure an OAuth application for ChatGPT using authorization code
flow with PKCE S256 and the exact callback URI shown in ChatGPT's advanced
OAuth settings. Enter client credentials directly in ChatGPT, never in chat.

Set Vercel production variables:
- OAUTH_ISSUER: Auth0 tenant HTTPS URL with trailing slash.
- OAUTH_ALLOWED_SUBJECTS: comma-separated approved Auth0 user IDs (sub claims).
- HOUSECALL_PRO_API_KEY: retain the new read-only HCP key.

Redeploy after setting variables. Choose OAuth in ChatGPT and use the existing
/api/mcp URL. The server denies access until the issuer and user allowlist exist.
The health route confirms server liveness only, not access to HCP.

Verification: node --test test/oauth.test.js and npm run build.
