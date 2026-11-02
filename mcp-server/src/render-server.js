// MCP SERVER 4 - RENDER CONTAINERS: create / list / redeploy / delete demo copies of the backend
import { z } from "zod";
import { tool } from "./backend.js";

const KEY = process.env.RENDER_API_KEY;
const SRC = process.env.RENDER_BACKEND_SERVICE_ID; // srv-xxxx of your real backend
const PREFIX = "student-backend-demo-";

async function render(path, { method = "GET", body } = {}) {
  if (!KEY) throw new Error("RENDER_API_KEY is not set on the MCP service");
  const res = await fetch(`https://api.render.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  let data = text;
  try { data = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(`Render API ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  return data;
}

const short = (s) => ({
  id: s.id,
  name: s.name,
  status: s.suspended,
  url: s.serviceDetails?.url,
  dashboard: s.dashboardUrl,
});

export function registerRenderTools(server) {
  server.registerTool(
    "list_containers",
    { description: "List all services (containers) on Render with their URLs." },
    tool(async () => (await render("/services?limit=50")).map((x) => short(x.service)))
  );

  server.registerTool(
    "create_demo_container",
    {
      description: "Create a NEW duplicate container of the student backend on Render (same repo, settings and env vars). It appears in the Render dashboard.",
      inputSchema: { label: z.string().max(20).optional().describe("Optional short name suffix, e.g. 'v2'") },
    },
    tool(async ({ label }) => {
      const src = await render(`/services/${SRC}`);
      const envs = await render(`/services/${SRC}/env-vars`);
      const sd = src.serviceDetails || {};
      const suffix = (label || String(Date.now()).slice(-6)).toLowerCase().replace(/[^a-z0-9-]/g, "");
      const body = {
        type: "web_service",
        name: PREFIX + suffix,
        ownerId: src.ownerId,
        repo: src.repo,
        branch: src.branch,
        rootDir: src.rootDir,
        autoDeploy: "yes",
        envVars: envs.map((e) => e.envVar).filter((e) => e && e.value !== undefined).map((e) => ({ key: e.key, value: e.value })),
        serviceDetails: {
          runtime: sd.runtime || "node",
          plan: sd.plan || "free",
          region: sd.region,
          envSpecificDetails: sd.envSpecificDetails,
        },
      };
      const r = await render("/services", { method: "POST", body });
      return { message: "Demo container created. Check the Render dashboard.", ...short(r.service), deployId: r.deployId };
    })
  );

  server.registerTool(
    "redeploy_container",
    {
      description: "Redeploy (update) the main backend or a demo container so the latest code goes live.",
      inputSchema: { id: z.string().describe("Service id like srv-xxxx (use list_containers)") },
    },
    tool(async ({ id }) => {
      const s = await render(`/services/${id}`);
      if (id !== SRC && !s.name.startsWith(PREFIX)) throw new Error("Only the backend and demo containers can be redeployed");
      const d = await render(`/services/${id}/deploys`, { method: "POST", body: { clearCache: "do_not_clear" } });
      return { message: `Redeploy started for ${s.name}`, deployId: d.id };
    })
  );

  server.registerTool(
    "delete_demo_container",
    {
      description: "Delete a DEMO container (only names starting with student-backend-demo-).",
      inputSchema: { id: z.string() },
    },
    tool(async ({ id }) => {
      const s = await render(`/services/${id}`);
      if (!s.name.startsWith(PREFIX)) throw new Error("Refused: only demo containers can be deleted");
      await render(`/services/${id}`, { method: "DELETE" });
      return { message: `Deleted ${s.name}` };
    })
  );
}