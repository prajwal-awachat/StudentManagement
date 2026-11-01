import { useState, useEffect, useRef } from "react";
import StudentForm from "./components/StudentForm";
import StudentTable from "./components/StudentTable";
import {
  fetchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  fetchSettings,
} from "./app.js";
import "./App.css";

// Applies the theme saved in the database (changed through the MCP UI server)
const applyTheme = (s) => {
  const root = document.documentElement.style;
  const dark = s.darkMode;
  root.setProperty("--primary", s.primaryColor);
  root.setProperty("--bg", dark ? "#0f172a" : s.backgroundColor);
  root.setProperty("--card", dark ? "#1e293b" : s.cardColor);
  root.setProperty("--text", dark ? "#e2e8f0" : s.textColor);
  root.setProperty("--border", dark ? "#334155" : "#d1d5db");
  root.setProperty("--muted", dark ? "#94a3b8" : "#6b7280");
  root.setProperty("--th-bg", dark ? "#273449" : "#f9fafb");
  document.title = s.appTitle;
};

function App() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [appTitle, setAppTitle] = useState("Student Information Management System");
  const searchRef = useRef("");

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3500);
  };

  const loadStudents = async (term = "") => {
    setLoading(true);
    try {
      setStudents(await fetchStudents(term));
    } catch (err) {
      showMessage("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 4s: picks up theme changes and student changes made through Claude (MCP)
  useEffect(() => {
    const sync = async () => {
      if (document.hidden) return;
      try {
        const settings = await fetchSettings();
        applyTheme(settings);
        setAppTitle(settings.appTitle);
        setStudents(await fetchStudents(searchRef.current));
      } catch {
        /* ignore - backend may be waking up */
      }
    };
    sync();
    const id = setInterval(sync, 4000);
    return () => clearInterval(id);
  }, []);

  // Reload list when search changes (with a small debounce)
  useEffect(() => {
    searchRef.current = search;
    const timer = setTimeout(() => loadStudents(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSubmit = async (data) => {
    try {
      if (editingStudent) {
        await updateStudent(editingStudent._id, data);
        showMessage("success", "Student updated");
        setEditingStudent(null);
      } else {
        await createStudent(data);
        showMessage("success", "Student added");
      }
      await loadStudents(search);
      return true;
    } catch (err) {
      showMessage("error", err.message);
      return false;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await deleteStudent(id);
      showMessage("success", "Student deleted");
      await loadStudents(search);
    } catch (err) {
      showMessage("error", err.message);
    }
  };

  return (
    <div className="container">
      <h1>{appTitle}</h1>

      {message.text && <div className={`alert ${message.type}`}>{message.text}</div>}

      <StudentForm
        onSubmit={handleSubmit}
        editingStudent={editingStudent}
        onCancel={() => setEditingStudent(null)}
      />

      <div className="card">
        <div className="list-header">
          <h2>Students ({students.length})</h2>
          <input
            className="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <p className="empty">Loading...</p>
        ) : (
          <StudentTable
            students={students}
            onEdit={(s) => {
              setEditingStudent(s);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}

export default App;