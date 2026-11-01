const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

export const fetchStudents = (search = "") =>
  request(`/students?search=${encodeURIComponent(search)}`);

export const createStudent = (student) =>
  request("/students", { method: "POST", body: JSON.stringify(student) });

export const updateStudent = (id, student) =>
  request(`/students/${id}`, { method: "PUT", body: JSON.stringify(student) });

export const deleteStudent = (id) =>
  request(`/students/${id}`, { method: "DELETE" });

export const fetchSettings = () => request("/settings");
