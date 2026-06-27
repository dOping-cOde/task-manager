import multer from "multer";

// Keep the file in memory; we store it as a base64 data URI on the user doc
// (no filesystem/cloud needed, and it survives ephemeral hosting).
const storage = multer.memoryStorage();

const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

export const MAX_AVATAR_BYTES = 1 * 1024 * 1024; // 1 MB hard cap

export const avatarUpload = multer({
  storage,
  limits: { fileSize: MAX_AVATAR_BYTES },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    const err = new Error("Only PNG, JPG, WEBP or GIF images are allowed");
    err.status = 400;
    cb(err);
  },
}).single("avatar"); // expects a form field named "avatar"