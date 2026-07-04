import { Router } from 'express';
import {
  getAdminDashboard,
  getPendingTutors,
  verifyTutor,
  suspendTutor,
  getPendingCourses,
  approveCourse,
  rejectCourse,
  deleteCourseAdmin,
  featureCourse,
  getPendingPromotions,
  approvePromotion,
  rejectPromotion,
  getAllUsers,
  deleteUser,
  getActivityLogs,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getPlatformSettings,
  updatePlatformSettings,
} from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { body } from 'express-validator';

const router = Router();
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard', getAdminDashboard);

// Tutors
router.get('/tutors/pending', getPendingTutors);
router.put('/tutors/:id/verify', verifyTutor);
router.put('/tutors/:id/suspend', suspendTutor);

// Courses
router.get('/courses/pending', getPendingCourses);
router.put('/courses/:id/approve', approveCourse);
router.put('/courses/:id/reject', rejectCourse);
router.delete('/courses/:id', deleteCourseAdmin);
router.put('/courses/:id/feature', featureCourse);

// Promotions
router.get('/promotions/pending', getPendingPromotions);
router.put('/promotions/:id/approve', approvePromotion);
router.put('/promotions/:id/reject', rejectPromotion);

// Users
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Activity Logs
router.get('/activity-logs', getActivityLogs);

// Categories
router.get('/categories', getCategories);
router.post('/categories', [body('name').trim().notEmpty()], validate, createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Platform Settings
router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);

export default router;
