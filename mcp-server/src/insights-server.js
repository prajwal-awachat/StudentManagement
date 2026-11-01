// MCP SERVER 3 - INSIGHTS & OPS: statistics, health check, bulk import, CSV export.
import { z } from "zod";
import { api, health, tool } from "./backend.js";

const countBy = (arr, key) =>
  arr.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});

export function registerInsightsTools(server) {
  server.registerTool(
    "get_student_stats",
    { description: "Statistics: total students, count per course, count per year." },
    tool(async () => {
      const students = await api("/students");
      return {
        total: students.length,
        byCourse: countBy(students, "course"),
        byYear: countBy(students, "year"),
      };
    })
  );

  server.registerTool(
    "check_backend_health",
    { description: "Check whether the Render backend is running and how fast it responds." },
    tool(async () => health())
  );

  server.registerTool(
    "bulk_add_students",
    {
      description: "Add many students at once (max 20). Reports which succeeded and which failed.",
      inputSchema: {
        students: z
          .array(
            z.object({
              name: z.string().min(1),
              email: z.string().email(),
              course: z.string().min(1),
              year: z.number().int().min(1).max(6),
            })
          )
          .min(1)
          .max(20),
      },
    },
    tool(async ({ students }) => {
      const added = [];
      const failed = [];
      for (const s of students) {
        try {
          await api("/students", { method: "POST", body: s });
          added.push(s.email);
        } catch (err) {
          failed.push({ email: s.email, reason: err.message });
        }
      }
      return { addedCount: added.length, failedCount: failed.length, added, failed };
    })
  );

  server.registerTool(
    "export_students_csv",
    { description: "Export all students as CSV text." },
    tool(async () => {
      const students = await api("/students");
      const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
      const rows = students.map((s) => [s.name, s.email, s.course, s.year].map(esc).join(","));
      return ["name,email,course,year", ...rows].join("\n");
    })
  );
}
