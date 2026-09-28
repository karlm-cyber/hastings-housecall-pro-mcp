import { createRemoteJWKSet, jwtVerify } from "jose";

export const RESOURCE = "https://hastings-housecall-pro-mcp.vercel.app/api/mcp";
export const METADATA = "https://hastings-housecall-pro-mcp.vercel.app/.well-known/oauth-protected-resource";
export const SCOPE = "hcp:read";
let cachedIssuer;
let cachedKeys;

export function issuer() {
  const value = process.env.OAUTH_ISSUER;
  if (!value) throw new Error("OAuth is not configured");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Invalid OAuth issuer");
  }
  return url.href;
}

export async function verifyAccess(token, config, keys) {
  const { payload } = await jwtVerify(token, keys, {
    issuer: config.issuer,
    audience: RESOURCE,
    algorithms: ["RS256"],
    requiredClaims: ["exp", "iat", "sub", "aud", "iss"],
  });
  if (!config.subjects.includes(payload.sub)) throw new Error("User not allowed");
  if (typeof payload.scope !== "string" || !payload.scope.split(" ").includes(SCOPE)) {
    throw new Error("Missing scope");
  }
  return payload;
}

export async function authorize(request) {
  let config;
  try {
    config = {
      issuer: issuer(),
      subjects: (process.env.OAUTH_ALLOWED_SUBJECTS || "").split(",").map(s => s.trim()).filter(Boolean),
    };
    if (!config.subjects.length) throw new Error("No approved users configured");
  } catch {
    return Response.json({ error: "OAuth setup is incomplete" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const match = /^Bearer ([^\s]+)$/i.exec(request.headers.get("authorization") || "");
    if (!match) throw new Error("Missing token");
    if (cachedIssuer !== config.issuer) {
      cachedKeys = createRemoteJWKSet(new URL(".well-known/jwks.json", config.issuer));
      cachedIssuer = config.issuer;
    }
    await verifyAccess(match[1], config, cachedKeys);
    return null;
  } catch {
    return Response.json({ error: "Unauthorized" }, {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
        "WWW-Authenticate": `Bearer resource_metadata="${METADATA}", scope="${SCOPE}"`,
      },
    });
  }
}
