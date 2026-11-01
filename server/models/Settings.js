import mongoose from "mongoose";

// Only ONE settings document is ever used (key = "main").
// The MCP "UI theme" server edits it, the React site reads it.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    appTitle: { type: String, default: "Student Information Management System" },
    primaryColor: { type: String, default: "#4f46e5" },
    backgroundColor: { type: String, default: "#f3f4f6" },
    cardColor: { type: String, default: "#ffffff" },
    textColor: { type: String, default: "#1f2937" },
    darkMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
