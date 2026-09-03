import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { getUserIdFromRequest } from '../session.js';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDir),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase() || '.jpg';
    callback(null, `${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error('Only JPEG, PNG, WEBP, or GIF images are allowed.'));
      return;
    }
    callback(null, true);
  },
});

router.post('/', (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to upload photos.' });
  }

  upload.single('image')(req, res, (error: unknown) => {
    if (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload photo.';
      return res.status(400).json({ message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file was uploaded.' });
    }
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(201).json({ url });
  });
});

export default router;
