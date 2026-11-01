import { useState, useEffect } from "react";

const emptyForm = { name: "", email: "", course: "", year: "" };

function StudentForm({ onSubmit, editingStudent, onCancel }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editingStudent) {
      setForm({
        name: editingStudent.name,
        email: editingStudent.email,
        course: editingStudent.course,
        year: editingStudent.year,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingStudent]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onSubmit({ ...form, year: Number(form.year) });
    if (success) setForm(emptyForm);
  };

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>{editingStudent ? "Edit Student" : "Add Student"}</h2>
      <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
      <input name="course" placeholder="Course (e.g. Computer Engineering)" value={form.course} onChange={handleChange} required />
      <input name="year" type="number" min="1" max="6" placeholder="Year (1-6)" value={form.year} onChange={handleChange} required />
      <div className="actions">
        <button type="submit" className="btn primary">
          {editingStudent ? "Update" : "Add"}
        </button>
        {editingStudent && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default StudentForm;