import { Router } from 'express';
import { body } from 'express-validator';
import { createReview, getCourseReviews, updateReview, deleteReview } from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.get('/course/:courseId', getCourseReviews);
router.post('/', authenticate, [
  body('course_id').isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').trim().isLength({ min: 10, max: 1000 }),
], validate, createReview);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
