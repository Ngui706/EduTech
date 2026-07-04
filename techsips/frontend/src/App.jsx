import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Stores
import useAuthStore from './store/authStore';

// Layouts
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages - Public
import Landing from './pages/Landing';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import About from './pages/About';
import Contact from './pages/Contact';

// Pages - Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RegisterTutor from './pages/auth/RegisterTutor';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Pages - Student Portal
import StudentDashboard from './pages/student/StudentDashboard';
import StudentOverview from './pages/student/StudentOverview';
import StudentCourses from './pages/student/StudentCourses';
import StudentWishlist from './pages/student/StudentWishlist';
import StudentCertificates from './pages/student/StudentCertificates';
import StudentSettings from './pages/student/StudentSettings';
import CoursePlayer from './pages/student/CoursePlayer';

// Pages - Tutor Portal
import TutorDashboard from './pages/tutor/TutorDashboard';
import TutorOverview from './pages/tutor/TutorOverview';
import TutorCourses from './pages/tutor/TutorCourses';
import TutorCourseEditor from './pages/tutor/TutorCourseEditor';
import TutorStudents from './pages/tutor/TutorStudents';
import TutorPromotions from './pages/tutor/TutorPromotions';
import TutorSettings from './pages/tutor/TutorSettings';

// Pages - Admin Portal
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOverview from './pages/admin/AdminOverview';
import AdminTutors from './pages/admin/AdminTutors';
import AdminTutorCourses from './pages/admin/AdminTutorCourses';
import AdminCourses from './pages/admin/AdminCourses';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminCategories from './pages/admin/AdminCategories';

// Route Guards
function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkBg">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (user?.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (user?.role === 'tutor') return <Navigate to="/dashboard/tutor" replace />;
    return <Navigate to="/dashboard/student" replace />;
  }

  return <Outlet />;
}

// Layout wrapper for Public vs Dashboard paths
function MainLayout() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      {!isDashboard && <Footer />}
    </div>
  );
}

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Main layout with Navbar */}
        <Route element={<MainLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/tutor" element={<RegisterTutor />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Student Dashboard Routes (Protected) */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/dashboard/student" element={<StudentDashboard />}>
              <Route index element={<StudentOverview />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="courses/:courseId" element={<CoursePlayer />} />
              <Route path="wishlist" element={<StudentWishlist />} />
              <Route path="certificates" element={<StudentCertificates />} />
              <Route path="settings" element={<StudentSettings />} />
            </Route>
          </Route>

          {/* Tutor Dashboard Routes (Protected) */}
          <Route element={<ProtectedRoute allowedRoles={['tutor']} />}>
            <Route path="/dashboard/tutor" element={<TutorDashboard />}>
              <Route index element={<TutorOverview />} />
              <Route path="courses" element={<TutorCourses />} />
              <Route path="courses/create" element={<TutorCourseEditor isCreate={true} />} />
              <Route path="courses/:courseId/edit" element={<TutorCourseEditor isCreate={false} />} />
              <Route path="students" element={<TutorStudents />} />
              <Route path="promotions" element={<TutorPromotions />} />
              <Route path="settings" element={<TutorSettings />} />
            </Route>
          </Route>

          {/* Admin Dashboard Routes (Protected) */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/dashboard/admin" element={<AdminDashboard />}>
              <Route index element={<AdminOverview />} />
              <Route path="tutors" element={<AdminTutors />} />
              <Route path="tutor-catalogue" element={<AdminTutorCourses />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="promotions" element={<AdminPromotions />} />
              <Route path="categories" element={<AdminCategories />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
