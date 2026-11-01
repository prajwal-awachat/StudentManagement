import Settings from "../models/Settings.js";

// Allows: #hex, color names (red), rgb()/hsl() values
const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,25}|(rgb|hsl)a?\([0-9.,%\s/]+\))$/;
const COLOR_FIELDS = ["primaryColor", "backgroundColor", "cardColor", "textColor"];

const getOrCreate = () =>
  Settings.findOneAndUpdate(
    { key: "main" },
    { $setOnInsert: { key: "main" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

// GET /api/settings
export const getSettings = async (req, res) => {
  try {
    res.json(await getOrCreate());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/settings   (needs x-api-key if API_KEY is set)
export const updateSettings = async (req, res) => {
  try {
    const update = {};

    for (const field of COLOR_FIELDS) {
      if (req.body[field] !== undefined) {
        const value = String(req.body[field]).trim();
        if (!COLOR_RE.test(value)) {
          return res.status(400).json({ message: `Invalid color for ${field}: "${value}"` });
        }
        update[field] = value;
      }
    }

    if (req.body.appTitle !== undefined) {
      const title = String(req.body.appTitle).trim();
      if (!title || title.length > 80) {
        return res.status(400).json({ message: "Title must be 1-80 characters" });
      }
      update.appTitle = title;
    }

    if (req.body.darkMode !== undefined) {
      update.darkMode = Boolean(req.body.darkMode);
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    await getOrCreate();
    const settings = await Settings.findOneAndUpdate(
      { key: "main" },
      { $set: update },
      { new: true, runValidators: true }
    );
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/settings/reset   (needs x-api-key if API_KEY is set)
export const resetSettings = async (req, res) => {
  try {
    await Settings.deleteOne({ key: "main" });
    res.json(await getOrCreate());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
