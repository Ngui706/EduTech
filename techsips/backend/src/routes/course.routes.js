import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  getCourses,
  getCourseById,
  getCourseContent,
  enrollInCourse,
  getCategories,
  searchCourses,
  getFeaturedCourses,
  getSponsoredCourses,
} from '../controllers/course.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// GET /api/courses - Public paginated course list
router.get('/', optionalAuth, getCourses);

// GET /api/courses/featured
router.get('/featured', getFeaturedCourses);

// GET /api/courses/sponsored
router.get('/sponsored', getSponsoredCourses);

// GET /api/courses/search
router.get('/search', [query('q').trim().notEmpty().withMessage('Search query required')], validate, searchCourses);

// GET /api/courses/:id
router.get('/:id', optionalAuth, getCourseById);

// GET /api/courses/:id/content (requires enrollment)
router.get('/:id/content', authenticate, getCourseContent);

// POST /api/courses/:id/enroll
router.post('/:id/enroll', authenticate, enrollInCourse);

export default router;
