import { Router } from 'express';
import {
  getStudentDashboard,
  getStudentEnrollments,
  updateLessonProgress,
  getStudentCertificates,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateStudentProfile,
  getStudentNotifications,
  markNotificationRead,
  completeEnrollment,
} from '../controllers/student.controller.js';
import { authenticate, requireStudent } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/dashboard', requireStudent, getStudentDashboard);
router.get('/enrollments', requireStudent, getStudentEnrollments);
router.post('/progress', requireStudent, updateLessonProgress);
router.post('/enrollments/:id/complete', requireStudent, completeEnrollment);
router.get('/certificates', requireStudent, getStudentCertificates);
router.get('/wishlist', requireStudent, getWishlist);
router.post('/wishlist', requireStudent, addToWishlist);
router.delete('/wishlist/:courseId', requireStudent, removeFromWishlist);
router.put('/profile', requireStudent, updateStudentProfile);
router.get('/notifications', getStudentNotifications);
router.put('/notifications/:id/read', markNotificationRead);

export default router;
