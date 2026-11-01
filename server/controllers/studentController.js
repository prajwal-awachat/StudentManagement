import Student from "../models/Student.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const handleError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({ message: "A student with this email already exists" });
  }
  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ message });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid student ID" });
  }
  console.error(error);
  return res.status(500).json({ message: "Server error" });
};

// GET /api/students?search=term
export const getStudents = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};
    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      filter = { $or: [{ name: regex }, { email: regex }] };
    }
    const students = await Student.find(filter).sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/students/:id
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    handleError(res, error);
  }
};

// POST /api/students
export const createStudent = async (req, res) => {
  try {
    const { name, email, course, year } = req.body;
    const student = await Student.create({ name, email, course, year });
    res.status(201).json(student);
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /api/students/:id
export const updateStudent = async (req, res) => {
  try {
    const { name, email, course, year } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { name, email, course, year },
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /api/students/:id
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
};