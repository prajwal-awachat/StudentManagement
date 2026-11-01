// Hosts 3 independent MCP servers on ONE Render web service:
//   /ui/mcp        -> UI Theme server
//   /students/mcp  -> Student CRUD server
//   /insights/mcp  -> Insights server
//   /all/mcp       -> all tools in one server (fallback for Claude Free plan = 1 connector only)
import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerUiTools } from "./ui-server.js";
import { registerStudentTools } from "./student-server.js";
import { registerInsightsTools } from "./insights-server.js";

const makeServer = (name, registerFns) => () => {
  const server = new McpServer({ name, version: "1.0.0" });
  registerFns.forEach((fn) => fn(server));
  return server;
};

const SERVERS = {
  "/ui/mcp": makeServer("student-ui-theme", [registerUiTools]),
  "/students/mcp": makeServer("student-crud", [registerStudentTools]),
  "/insights/mcp": makeServer("student-insights", [registerInsightsTools]),
  "/all/mcp": makeServer("student-all-in-one", [registerUiTools, registerStudentTools, registerInsightsTools]),
};

const app = express();
app.use(cors({ origin: "*", exposedHeaders: ["Mcp-Session-Id"] }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "Student Management MCP servers",
    status: "running",
    endpoints: Object.keys(SERVERS),
  });
});
app.get("/health", (req, res) => res.json({ status: "OK" }));

for (const [path, create] of Object.entries(SERVERS)) {
  // Stateless mode: a fresh server + transport for every request (works great on Render)
  app.post(path, async (req, res) => {
    const server = create();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error(`MCP error on ${path}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
      }
    }
  });

  const notAllowed = (req, res) =>
    res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed" }, id: null });
  app.get(path, notAllowed);
  app.delete(path, notAllowed);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`MCP servers running on port ${PORT}: ${Object.keys(SERVERS).join(", ")}`));
