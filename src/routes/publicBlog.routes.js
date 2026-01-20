import express from 'express';
import PublicBlogController from '../controllers/publicBlog.controller.js';
import cacheMiddleware from '../middleware/cache.middleware.js';

const router = express.Router();

// Public routes with 1-hour cache
router.get('/', cacheMiddleware(3600), PublicBlogController.getBlogs);
router.get('/settings', cacheMiddleware(3600), PublicBlogController.getSettings);
router.get('/:slug', cacheMiddleware(3600), PublicBlogController.getBlogBySlug);

export default router;
