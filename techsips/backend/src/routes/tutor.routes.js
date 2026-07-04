import { Router } from 'express';
import { body } from 'express-validator';
import {
  getTutorProfile,
  updateTutorProfile,
  registerTutor,
  getTutorDashboardStats,
  getTutorCourses,
  getTutorCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  submitCourseForApproval,
  requestCoursePromotion,
  getEnrolledStudents,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  getTopTutors,
  getQuizByLesson,
  saveQuiz,
} from '../controllers/tutor.controller.js';

import { authenticate, requireTutor } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// ── Public non-parameterised routes ──────────────────────────────────────────
router.get('/top', getTopTutors);

// ── Public registration (no auth needed) ─────────────────────────────────────
router.post(
  '/register',
  [
    body('full_name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('phone_number').trim().notEmpty(),
    body('whatsapp_number').trim().notEmpty(),
    body('bio').trim().isLength({ min: 50, max: 2000 }),
    body('skills').isArray({ min: 1 }),
    body('experience_years').isInt({ min: 0 }),
  ],
  validate,
  registerTutor
);

// ── Protected routes (must be authenticated) ─────────────────────────────────
router.use(authenticate);

router.get('/me/dashboard', requireTutor, getTutorDashboardStats);
router.put('/me/profile', requireTutor, updateTutorProfile);

// Course CRUD
router.get('/me/courses', requireTutor, getTutorCourses);
router.get('/me/courses/:id', requireTutor, getTutorCourseById);
router.post('/me/courses', requireTutor, [
  body('title').trim().isLength({ min: 5, max: 200 }),
  body('description').trim().isLength({ min: 50 }),
  body('category_id').isUUID(),
  body('difficulty').isIn(['beginner', 'intermediate', 'pro']),
], validate, createCourse);
router.put('/me/courses/:id', requireTutor, updateCourse);
router.delete('/me/courses/:id', requireTutor, deleteCourse);
router.post('/me/courses/:id/submit', requireTutor, submitCourseForApproval);
router.post('/me/courses/:id/promote', requireTutor, requestCoursePromotion);

// Module CRUD
router.post('/me/courses/:courseId/modules', requireTutor, createModule);
router.put('/me/modules/:id', requireTutor, updateModule);
router.delete('/me/modules/:id', requireTutor, deleteModule);

// Lesson CRUD
router.post('/me/modules/:moduleId/lessons', requireTutor, createLesson);
router.put('/me/lessons/:id', requireTutor, updateLesson);
router.delete('/me/lessons/:id', requireTutor, deleteLesson);

// Quiz CRUD
router.get('/me/lessons/:lessonId/quiz', requireTutor, getQuizByLesson);
router.post('/me/lessons/:lessonId/quiz', requireTutor, saveQuiz);

// Student management
router.get('/me/courses/:courseId/students', requireTutor, getEnrolledStudents);

// ── Public wildcard – must be LAST so it doesn't shadow /me/* routes ──────────
router.get('/:id', getTutorProfile);

export default router;
