// ============================================
// File Upload Routes
// ============================================

import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { isAuthenticated, hasPermission } from '../middleware/auth';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { sendSuccess, errors } from '../utils/apiResponse';
import { prisma } from '../utils/prisma';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880'), // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const uploadPath = process.env.UPLOAD_PATH || './uploads';
  const dirs = ['avatars', 'banners', 'content', 'gallery'];
  
  for (const dir of dirs) {
    const fullPath = path.join(uploadPath, dir);
    await fs.mkdir(fullPath, { recursive: true });
  }
};
ensureUploadDirs();

// All upload routes require authentication and rate limiting
router.use(isAuthenticated);
router.use(uploadRateLimiter);

// Upload avatar
router.post('/avatar',
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return errors.validation(res, {
          file: ['No file provided'],
        });
      }

      const uploadPath = process.env.UPLOAD_PATH || './uploads';
      const filename = `${req.user!.id}-${Date.now()}.webp`;
      const filepath = path.join(uploadPath, 'avatars', filename);

      // Process image with sharp
      await sharp(req.file.buffer)
        .resize(256, 256, { fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(filepath);

      // Update user avatar
      const avatarUrl = `/uploads/avatars/${filename}`;
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { avatar: avatarUrl },
      });

      sendSuccess(res, { url: avatarUrl });
    } catch (error: any) {
      if (error.message.includes('Invalid file type')) {
        return errors.validation(res, {
          file: [error.message],
        });
      }
      errors.serverError(res);
    }
  }
);

// Upload banner
router.post('/banner',
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return errors.validation(res, {
          file: ['No file provided'],
        });
      }

      const uploadPath = process.env.UPLOAD_PATH || './uploads';
      const filename = `${req.user!.id}-${Date.now()}.webp`;
      const filepath = path.join(uploadPath, 'banners', filename);

      // Process image with sharp
      await sharp(req.file.buffer)
        .resize(1200, 400, { fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(filepath);

      // Update user banner
      const bannerUrl = `/uploads/banners/${filename}`;
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { banner: bannerUrl },
      });

      sendSuccess(res, { url: bannerUrl });
    } catch (error: any) {
      if (error.message.includes('Invalid file type')) {
        return errors.validation(res, {
          file: [error.message],
        });
      }
      errors.serverError(res);
    }
  }
);

// Upload content image (for news, events, etc.)
router.post('/content',
  hasPermission('content.news.create'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return errors.validation(res, {
          file: ['No file provided'],
        });
      }

      const uploadPath = process.env.UPLOAD_PATH || './uploads';
      const filename = `${uuidv4()}.webp`;
      const filepath = path.join(uploadPath, 'content', filename);

      // Process image with sharp
      await sharp(req.file.buffer)
        .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(filepath);

      const imageUrl = `/uploads/content/${filename}`;
      sendSuccess(res, { url: imageUrl });
    } catch (error: any) {
      if (error.message.includes('Invalid file type')) {
        return errors.validation(res, {
          file: [error.message],
        });
      }
      errors.serverError(res);
    }
  }
);

// Upload to gallery
router.post('/gallery',
  hasPermission('content.gallery.create'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return errors.validation(res, {
          file: ['No file provided'],
        });
      }

      const uploadPath = process.env.UPLOAD_PATH || './uploads';
      const filename = `${uuidv4()}.webp`;
      const thumbnailFilename = `${uuidv4()}-thumb.webp`;
      const filepath = path.join(uploadPath, 'gallery', filename);
      const thumbnailPath = path.join(uploadPath, 'gallery', thumbnailFilename);

      // Process main image
      await sharp(req.file.buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(filepath);

      // Create thumbnail
      await sharp(req.file.buffer)
        .resize(400, 300, { fit: 'cover' })
        .webp({ quality: 75 })
        .toFile(thumbnailPath);

      const imageUrl = `/uploads/gallery/${filename}`;
      const thumbnailUrl = `/uploads/gallery/${thumbnailFilename}`;

      // Create gallery item
      const galleryItem = await prisma.galleryItem.create({
        data: {
          title: req.body.title || null,
          description: req.body.description || null,
          type: 'image',
          url: imageUrl,
          thumbnailUrl,
          category: req.body.category || null,
          uploadedById: req.user!.id,
        },
        include: {
          uploadedBy: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      sendSuccess(res, galleryItem, undefined, 201);
    } catch (error: any) {
      if (error.message.includes('Invalid file type')) {
        return errors.validation(res, {
          file: [error.message],
        });
      }
      errors.serverError(res);
    }
  }
);

// Upload clan logo
router.post('/clan-logo',
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return errors.validation(res, {
          file: ['No file provided'],
        });
      }

      const { clanId } = req.body;
      if (!clanId) {
        return errors.validation(res, {
          clanId: ['Clan ID is required'],
        });
      }

      // Check if user is leader or officer of the clan
      const membership = await prisma.clanMember.findFirst({
        where: {
          clanId,
          userId: req.user!.id,
          role: { in: ['leader', 'officer'] },
        },
      });

      if (!membership) {
        return errors.forbidden(res, 'Only clan leaders and officers can change the logo');
      }

      const uploadPath = process.env.UPLOAD_PATH || './uploads';
      const filename = `clan-${clanId}-${Date.now()}.webp`;
      const filepath = path.join(uploadPath, 'content', filename);

      // Process image with sharp
      await sharp(req.file.buffer)
        .resize(256, 256, { fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(filepath);

      // Update clan logo
      const logoUrl = `/uploads/content/${filename}`;
      await prisma.clan.update({
        where: { id: clanId },
        data: { logo: logoUrl },
      });

      sendSuccess(res, { url: logoUrl });
    } catch (error: any) {
      if (error.message.includes('Invalid file type')) {
        return errors.validation(res, {
          file: [error.message],
        });
      }
      errors.serverError(res);
    }
  }
);

export default router;

