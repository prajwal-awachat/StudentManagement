// MCP SERVER 1 - UI THEME: changes colors / title / dark mode of the live website.
import { z } from "zod";
import { api, tool } from "./backend.js";

const PRESETS = {
  default: { primaryColor: "#4f46e5", backgroundColor: "#f3f4f6", cardColor: "#ffffff", textColor: "#1f2937", darkMode: false },
  ocean:   { primaryColor: "#0284c7", backgroundColor: "#e0f2fe", cardColor: "#ffffff", textColor: "#0c4a6e", darkMode: false },
  forest:  { primaryColor: "#16a34a", backgroundColor: "#dcfce7", cardColor: "#ffffff", textColor: "#14532d", darkMode: false },
  sunset:  { primaryColor: "#ea580c", backgroundColor: "#ffedd5", cardColor: "#fffaf5", textColor: "#7c2d12", darkMode: false },
  rose:    { primaryColor: "#e11d48", backgroundColor: "#ffe4e6", cardColor: "#ffffff", textColor: "#881337", darkMode: false },
  midnight:{ primaryColor: "#38bdf8", backgroundColor: "#0f172a", cardColor: "#1e293b", textColor: "#e2e8f0", darkMode: true },
};

const color = z.string().describe("CSS color: hex like #ff5500, or a name like red / teal / orange");

export function registerUiTools(server) {
  server.registerTool(
    "get_theme",
    { description: "Get the current UI theme (colors, dark mode, title) of the Student Management website." },
    tool(async () => api("/settings"))
  );

  server.registerTool(
    "set_theme_colors",
    {
      description:
        "Change one or more colors of the live website. primaryColor = buttons/heading/focus, backgroundColor = page background, cardColor = cards/forms, textColor = text.",
      inputSchema: {
        primaryColor: color.optional(),
        backgroundColor: color.optional(),
        cardColor: color.optional(),
        textColor: color.optional(),
      },
    },
    tool(async (args) => {
      const body = Object.fromEntries(Object.entries(args).filter(([, v]) => v !== undefined));
      const s = await api("/settings", { method: "PUT", body });
      return { message: "Theme updated. The website refreshes within ~4 seconds.", theme: s };
    })
  );

  server.registerTool(
    "set_dark_mode",
    {
      description: "Turn dark mode on or off on the live website.",
      inputSchema: { enabled: z.boolean() },
    },
    tool(async ({ enabled }) => {
      const s = await api("/settings", { method: "PUT", body: { darkMode: enabled } });
      return { message: `Dark mode ${enabled ? "ON" : "OFF"}`, theme: s };
    })
  );

  server.registerTool(
    "set_app_title",
    {
      description: "Change the main heading / browser tab title of the website.",
      inputSchema: { title: z.string().min(1).max(80) },
    },
    tool(async ({ title }) => {
      const s = await api("/settings", { method: "PUT", body: { appTitle: title } });
      return { message: "Title updated", theme: s };
    })
  );

  server.registerTool(
    "apply_theme_preset",
    {
      description: "Apply a ready-made theme: default, ocean (blue), forest (green), sunset (orange), rose (red/pink), midnight (dark).",
      inputSchema: { preset: z.enum(["default", "ocean", "forest", "sunset", "rose", "midnight"]) },
    },
    tool(async ({ preset }) => {
      const s = await api("/settings", { method: "PUT", body: PRESETS[preset] });
      return { message: `Preset "${preset}" applied`, theme: s };
    })
  );

  server.registerTool(
    "reset_theme",
    { description: "Reset the website theme and title back to the original defaults." },
    tool(async () => {
      const s = await api("/settings/reset", { method: "POST" });
      return { message: "Theme reset to defaults", theme: s };
    })
  );
}
