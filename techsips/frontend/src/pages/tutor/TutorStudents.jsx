import React, { useEffect, useState, useCallback } from 'react';
import { Users, GraduationCap, CheckCircle, Clock, Download, Calendar, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { jsPDF } from 'jspdf';
import { resolveMediaUrl } from '../../utils/resolveUrl';

export default function TutorStudents() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTutorCourses = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingCourses(true);
    try {
      const response = await api.get('/tutors/me/courses');
      const courseList = response.data.data || [];
      setCourses(courseList);
      
      // If we don't have a selectedCourseId, select the first one.
      // If the previously selected course is deleted/no longer in courseList, reset selection to first course or empty.
      if (courseList.length > 0) {
        setSelectedCourseId((prev) => {
          const exists = courseList.some((c) => c.id === prev);
          return exists ? prev : courseList[0].id;
        });
      } else {
        setSelectedCourseId('');
      }
    } catch {
      toast.error('Failed to load courses.');
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const fetchEnrolledStudents = useCallback(async (courseId, isSilent = false) => {
    if (!isSilent) setLoadingStudents(true);
    try {
      const response = await api.get(`/tutors/me/courses/${courseId}/students`);
      setStudents(response.data.data || []);
    } catch {
      toast.error('Failed to load student list.');
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    fetchTutorCourses();
  }, [fetchTutorCourses]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchEnrolledStudents(selectedCourseId);
    } else {
      setStudents([]);
    }
  }, [selectedCourseId, fetchEnrolledStudents]);

  // Auto-sync every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchTutorCourses(true); // Silent course list update
      if (selectedCourseId) {
        fetchEnrolledStudents(selectedCourseId, true); // Silent student list update
      }
    }, 30000);
    return () => clearInterval(intervalId);
  }, [fetchTutorCourses, fetchEnrolledStudents, selectedCourseId]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchTutorCourses(true);
    if (selectedCourseId) {
      await fetchEnrolledStudents(selectedCourseId, true);
    }
    setRefreshing(false);
    toast.success('Student tracker data refreshed!');
  };

  const downloadPDFReport = () => {
    if (students.length === 0) {
      toast.error('No students to download.');
      return;
    }

    const currentCourse = courses.find(c => c.id === selectedCourseId);
    const courseTitle = currentCourse ? currentCourse.title : 'Course';

    const doc = new jsPDF();
    
    // Header banner (Indigo gradient style)
    doc.setFillColor(79, 70, 229); // Brand Indigo
    doc.rect(0, 0, 210, 38, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('TechSips LMS', 15, 22);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Student Enrollment & Progress Tracker Report', 15, 30);
    
    // Generation details
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 15, 45);
    
    // Course Details Section
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`Course: ${courseTitle}`, 15, 54);
    
    // Cohort Stats Summary
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total Enrolled Students: ${students.length}`, 15, 62);
    doc.text(`Completed Courses: ${students.filter(s => s.completed_at).length}`, 15, 67);
    doc.text(`In Progress: ${students.filter(s => !s.completed_at).length}`, 15, 72);
    
    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 78, 180, 8, 'F');
    
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Student Name', 18, 83.5);
    doc.text('Email Address', 65, 83.5);
    doc.text('Enrollment Date', 115, 83.5);
    doc.text('Progress', 150, 83.5);
    doc.text('Last Active', 170, 83.5);
    
    // Table Rows
    let y = 92;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    
    students.forEach((enroll) => {
      // Page break check
      if (y > 275) {
        doc.addPage();
        y = 25;
        
        // Render table header on new page
        doc.setFillColor(241, 245, 249);
        doc.rect(15, y - 6, 180, 8, 'F');
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'bold');
        doc.text('Student Name', 18, y - 1);
        doc.text('Email Address', 65, y - 1);
        doc.text('Enrollment Date', 115, y - 1);
        doc.text('Progress', 150, y - 1);
        doc.text('Last Active', 170, y - 1);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        y += 8;
      }
      
      // Separator Line
      doc.setDrawColor(241, 245, 249);
      doc.line(15, y - 5, 195, y - 5);
      
      // Values
      const name = enroll.users?.full_name || 'N/A';
      const email = enroll.users?.email || 'N/A';
      const date = enroll.enrolled_at ? new Date(enroll.enrolled_at).toLocaleDateString() : 'N/A';
      const progress = `${enroll.progress_percentage}%`;
      const active = enroll.last_login_at ? new Date(enroll.last_login_at).toLocaleDateString() : 'Never';
      
      const cleanName = name.length > 22 ? name.substring(0, 20) + '...' : name;
      const cleanEmail = email.length > 25 ? email.substring(0, 23) + '...' : email;
      
      doc.text(cleanName, 18, y);
      doc.text(cleanEmail, 65, y);
      doc.text(date, 115, y);
      doc.text(progress, 150, y);
      doc.text(active, 170, y);
      
      y += 8;
    });
    
    // Page Numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${pageCount}`, 105, 288, null, null, 'center');
    }
    
    // Trigger download
    const filename = `${courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_enrolled_students.pdf`;
    doc.save(filename);
    toast.success('PDF report downloaded successfully!');
  };

  if (loadingCourses) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Student Enrollment Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Review learning analytics, progress percentages, and last login dates for your active cohorts.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-darkCard dark:hover:bg-darkBorder text-slate-700 dark:text-white rounded-xl text-sm font-bold transition-all border border-slate-200 dark:border-darkBorder"
            title="Refresh student list"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {students.length > 0 && (
            <button
              onClick={downloadPDFReport}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs shadow-md shadow-brand-500/10 transition-all hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector panel */}
      <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Cohort / Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 border dark:border-darkBorder bg-slate-50 dark:bg-darkBg rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
          >
            {courses.length === 0 ? (
              <option value="">No courses created yet</option>
            ) : (
              courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center space-x-3 text-xs font-bold text-slate-400">
          <span className="flex items-center px-3 py-1.5 bg-slate-100 dark:bg-darkCard rounded-xl">
            <Users className="h-4 w-4 mr-1 text-brand-500" />
            <span>{students.length} Total Enrolled</span>
          </span>
          <span className="flex items-center px-3 py-1.5 bg-slate-100 dark:bg-darkCard rounded-xl">
            <CheckCircle className="h-4 w-4 mr-1 text-emerald-500" />
            <span>{students.filter(s => s.completed_at).length} Completed</span>
          </span>
        </div>
      </div>

      {/* Student List */}
      {loadingStudents ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
        </div>
      ) : students.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <GraduationCap className="h-10 w-10 mx-auto text-slate-500 mb-2 opacity-50" />
          <p>No students enrolled in this course yet.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b dark:border-darkBorder/40 bg-slate-100/50 dark:bg-darkCard/50 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <th className="p-4">Student</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Enrollment Date</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Last Active</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y dark:divide-darkBorder/30">
                {students.map((enroll) => (
                  <tr key={enroll.id} className="hover:bg-slate-50/50 dark:hover:bg-darkCard/30 transition-colors">
                    <td className="p-4 flex items-center space-x-3">
                      {enroll.users?.avatar_url ? (
                        <img src={resolveMediaUrl(enroll.users.avatar_url)} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-xs">
                          {enroll.users?.full_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{enroll.users?.full_name}</span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">{enroll.users?.email}</td>
                    <td className="p-4 text-slate-400 text-xs">
                      {new Date(enroll.enrolled_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-100 dark:bg-darkBg h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-500 h-full rounded-full"
                            style={{ width: `${enroll.progress_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold">{enroll.progress_percentage}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5 opacity-60 text-slate-400" />
                        <span>
                          {enroll.last_login_at ? new Date(enroll.last_login_at).toLocaleString() : 'Never'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {enroll.completed_at ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-500 text-xs font-bold">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Finished</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-slate-400 text-xs font-semibold">
                          <Clock className="h-3.5 w-3.5 animate-pulse" />
                          <span>In Progress</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
