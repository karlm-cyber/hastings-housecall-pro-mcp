import { issuer, RESOURCE, SCOPE } from "../../../lib/oauth.js";

export function GET() {
  try {
    return Response.json({
      resource: RESOURCE,
      authorization_servers: [issuer()],
      scopes_supported: [SCOPE],
      bearer_methods_supported: ["header"],
      resource_name: "Hastings Housecall Pro",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "OAuth setup is incomplete" }, { status: 503 });
  }
}
