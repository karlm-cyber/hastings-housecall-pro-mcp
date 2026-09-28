import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const API_BASE = (process.env.HOUSECALL_PRO_API_BASE || "https://api.housecallpro.com").replace(/\/$/, "");

async function hcp(path, query = {}) {
  if (!process.env.HOUSECALL_PRO_API_KEY) throw new Error("HOUSECALL_PRO_API_KEY is not configured");
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: { Authorization: `Token ${process.env.HOUSECALL_PRO_API_KEY}`, Accept: "application/json" },
    cache: "no-store"
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Housecall Pro returned ${response.status}: ${body.slice(0, 600)}`);
  return body ? JSON.parse(body) : {};
}

const content = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const pageSchema = {
  page: z.number().int().positive().optional().describe("Page number"),
  page_size: z.number().int().min(1).max(100).optional().describe("Items per page")
};

const mcpHandler = createMcpHandler((server) => {
  server.registerTool("search_jobs", {
    title: "Search jobs", description: "List or filter Housecall Pro jobs (read-only)",
    inputSchema: z.object({ ...pageSchema, customer_id: z.string().optional(), employee_id: z.string().optional(), status: z.string().optional(), scheduled_start_min: z.string().optional(), scheduled_start_max: z.string().optional() })
  }, async (args) => content(await hcp("/jobs", args)));
  server.registerTool("get_job", {
    title: "Get job", description: "Get one Housecall Pro job by ID (read-only)", inputSchema: z.object({ job_id: z.string().min(1) })
  }, async ({ job_id }) => content(await hcp(`/jobs/${encodeURIComponent(job_id)}`)));
  server.registerTool("search_customers", {
    title: "Search customers", description: "List or filter Housecall Pro customers (read-only)", inputSchema: z.object({ ...pageSchema, search: z.string().optional() })
  }, async (args) => content(await hcp("/customers", args)));
  server.registerTool("get_customer", {
    title: "Get customer", description: "Get one Housecall Pro customer by ID (read-only)", inputSchema: z.object({ customer_id: z.string().min(1) })
  }, async ({ customer_id }) => content(await hcp(`/customers/${encodeURIComponent(customer_id)}`)));
  server.registerTool("search_estimates", {
    title: "Search estimates", description: "List or filter Housecall Pro estimates (read-only)", inputSchema: z.object({ ...pageSchema, customer_id: z.string().optional(), status: z.string().optional() })
  }, async (args) => content(await hcp("/estimates", args)));
  server.registerTool("get_estimate", {
    title: "Get estimate", description: "Get one Housecall Pro estimate by ID (read-only)", inputSchema: z.object({ estimate_id: z.string().min(1) })
  }, async ({ estimate_id }) => content(await hcp(`/estimates/${encodeURIComponent(estimate_id)}`)));
  server.registerTool("get_job_invoices", {
    title: "Get job invoices", description: "Get invoices associated with a Housecall Pro job (read-only)", inputSchema: z.object({ job_id: z.string().min(1) })
  }, async ({ job_id }) => content(await hcp(`/jobs/${encodeURIComponent(job_id)}/invoices`)));
  server.registerTool("search_employees", {
    title: "Search employees", description: "List Housecall Pro employees (read-only)", inputSchema: z.object(pageSchema)
  }, async (args) => content(await hcp("/employees", args)));
});

async function authorized(request) {
  const expected = process.env.CONNECTOR_ACCESS_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected) return Response.json({ error: "CONNECTOR_ACCESS_TOKEN is not configured" }, { status: 503 });
  if (supplied !== expected) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return mcpHandler(request);
}

export const GET = authorized;
export const POST = authorized;
export const DELETE = authorized;
