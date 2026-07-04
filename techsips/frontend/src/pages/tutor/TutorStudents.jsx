import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function TutorStudents() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    fetchTutorCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchEnrolledStudents(selectedCourseId);
    } else {
      setStudents([]);
    }
  }, [selectedCourseId]);

  const fetchTutorCourses = async () => {
    try {
      const response = await api.get('/tutors/me/courses');
      const courseList = response.data.data || [];
      setCourses(courseList);
      if (courseList.length > 0) {
        setSelectedCourseId(courseList[0].id);
      }
    } catch {
      toast.error('Failed to load courses.');
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchEnrolledStudents = async (courseId) => {
    setLoadingStudents(true);
    try {
      const response = await api.get(`/tutors/me/courses/${courseId}/students`);
      setStudents(response.data.data || []);
    } catch {
      toast.error('Failed to load student list.');
    } finally {
      setLoadingStudents(false);
    }
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
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Student Enrollment Tracker</h1>
        <p className="text-sm text-slate-500 mt-1">Review learning analytics and progress percentages for your active cohorts.</p>
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
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y dark:divide-darkBorder/30">
                {students.map((enroll) => (
                  <tr key={enroll.id} className="hover:bg-slate-50/50 dark:hover:bg-darkCard/30 transition-colors">
                    <td className="p-4 flex items-center space-x-3">
                      {enroll.users?.avatar_url ? (
                        <img src={enroll.users.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
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
