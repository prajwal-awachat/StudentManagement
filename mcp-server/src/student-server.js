// MCP SERVER 2 - STUDENT CRUD: add / list / update / delete students on the live website.
import { z } from "zod";
import { api, tool, fmtStudent } from "./backend.js";

export function registerStudentTools(server) {
  server.registerTool(
    "list_students",
    {
      description: "List all students, optionally filtered by name or email text.",
      inputSchema: { search: z.string().optional().describe("Part of a name or email") },
    },
    tool(async ({ search }) => {
      const students = await api(`/students?search=${encodeURIComponent(search || "")}`);
      return { count: students.length, students: students.map(fmtStudent) };
    })
  );

  server.registerTool(
    "get_student",
    {
      description: "Get one student by id.",
      inputSchema: { id: z.string() },
    },
    tool(async ({ id }) => fmtStudent(await api(`/students/${id}`)))
  );

  server.registerTool(
    "add_student",
    {
      description: "Add a new student. Year must be 1-6. Email must be unique.",
      inputSchema: {
        name: z.string().min(1),
        email: z.string().email(),
        course: z.string().min(1),
        year: z.number().int().min(1).max(6),
      },
    },
    tool(async (args) => {
      const s = await api("/students", { method: "POST", body: args });
      return { message: "Student added", student: fmtStudent(s) };
    })
  );

  server.registerTool(
    "update_student",
    {
      description: "Update a student by id. Only send the fields you want to change. Use list_students first if you only know the name.",
      inputSchema: {
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        course: z.string().min(1).optional(),
        year: z.number().int().min(1).max(6).optional(),
      },
    },
    tool(async ({ id, ...changes }) => {
      const current = await api(`/students/${id}`);
      const body = {
        name: current.name,
        email: current.email,
        course: current.course,
        year: current.year,
        ...Object.fromEntries(Object.entries(changes).filter(([, v]) => v !== undefined)),
      };
      const s = await api(`/students/${id}`, { method: "PUT", body });
      return { message: "Student updated", student: fmtStudent(s) };
    })
  );

  server.registerTool(
    "delete_student",
    {
      description: "Delete a student by id. Use list_students first if you only know the name.",
      inputSchema: { id: z.string() },
    },
    tool(async ({ id }) => {
      const r = await api(`/students/${id}`, { method: "DELETE" });
      return { message: r.message, id };
    })
  );
}
