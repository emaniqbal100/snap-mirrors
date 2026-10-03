import multer from 'multer';

// IMPORTANT: memoryStorage (not diskStorage) — the product controller reads
// req.file.buffer / req.files[].buffer to upload directly to Cloudinary.
// Railway/Vercel containers have ephemeral disks, so files written to disk
// would be lost anyway; memory storage avoids that entirely.
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Kept as the original named export "upload" — other routes (admin.routes.ts,
// payment.route.ts) import this directly, e.g. `upload.single('receipt')`.
// Do not rename this export.
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
});

// Kept for any existing single-image routes.
export const uploadSingleImage = upload.single('image');

// NEW: accepts up to 6 images in one request, all under the field name "newImages".
// On the client, append each File under the same field name:
//   files.forEach((file) => formData.append('newImages', file));
export const uploadMultipleImages = upload.array('newImages', 6);

export default upload;
