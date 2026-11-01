function StudentTable({ students, onEdit, onDelete }) {
  if (students.length === 0) {
    return <p className="empty">No students found.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Course</th>
            <th>Year</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.course}</td>
              <td>{s.year}</td>
              <td className="actions">
                <button className="btn" onClick={() => onEdit(s)}>Edit</button>
                <button className="btn danger" onClick={() => onDelete(s._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentTable;