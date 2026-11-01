// Small helper used by all 3 MCP servers to talk to your Express backend on Render.
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_KEY = process.env.API_KEY || "";

export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: body ? JSON.stringify(body) : undefined,
    // Render free tier can take ~50s to wake up
    signal: AbortSignal.timeout(60000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Backend returned ${res.status}`);
  return data;
}

export async function health() {
  const started = Date.now();
  const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(60000) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: data.status, ms: Date.now() - started, url: BACKEND_URL };
}

// Wraps a tool handler so errors are returned to Claude as readable text, not crashes.
export const tool = (fn) => async (args) => {
  try {
    const result = await fn(args || {});
    return { content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }] };
  } catch (err) {
    return { isError: true, content: [{ type: "text", text: `Error: ${err.message}` }] };
  }
};

export const fmtStudent = (s) => ({
  id: s._id,
  name: s.name,
  email: s.email,
  course: s.course,
  year: s.year,
});
