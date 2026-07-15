import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Users, Search, Download, Trash2, Mail, Calendar, Shield,
  GraduationCap, BookOpen, AlertCircle, CheckCircle2, UserX,
  RefreshCw, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import api from '../../api/axios';
import { resolveMediaUrl } from '../../utils/resolveUrl';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'tutor', 'student'
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState(null); // track which user is being deleted

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await api.get('/admin/users', {
        params: { limit: 2000, page: 1 }
      });
      setUsers(data.data?.users || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load user directory. Is the server running?';
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id, name, role) => {
    // Role-specific warning message
    const warningExtra = role === 'tutor'
      ? '\n\n⚠️ This will also permanently delete all their courses, enrollments, and promotion requests.'
      : role === 'student'
      ? '\n\n⚠️ This will also remove all their enrollments and reviews.'
      : '';

    if (!window.confirm(
      `Are you sure you want to permanently delete ${role} "${name}"?${warningExtra}\n\nThis action CANNOT be undone.`
    )) return;

    setDeletingId(id);
    try {
      await api.delete(`/admin/users/${id}`);

      // ✅ Optimistic sync: immediately remove from local state
      setUsers((prev) => prev.filter((u) => u.id !== id));

      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} "${name}" has been permanently deleted.`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete user.';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter users by search and activeTab
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search.trim() ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      
      const matchesTab =
        activeTab === 'all' || u.role === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [users, search, activeTab]);

  // Statistics – computed from current state (updates instantly after delete)
  const stats = useMemo(() => {
    const total = users.length;
    const tutors = users.filter((u) => u.role === 'tutor').length;
    const students = users.filter((u) => u.role === 'student').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    return { total, tutors, students, admins };
  }, [users]);

  // Premium jsPDF Exporter
  const handleExportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const roleLabel = activeTab === 'tutor' ? 'Tutors' : activeTab === 'student' ? 'Students' : 'All Users';
      const pageTitle = `TechSips LMS — ${roleLabel} Directory`;
      
      // Page styling helper
      const addHeaderFooter = (pageNumber, totalPages) => {
        // Top banner
        doc.setFillColor(30, 41, 59); // Slate-800
        doc.rect(0, 0, 210, 15, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('TECHSIPS LMS DIRECTORY', 14, 10);
        
        // Footer
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 287);
        doc.text(`Page ${pageNumber} of ${totalPages}`, 180, 287);
      };

      // Calculate pagination
      const rowsPerPage = 22;
      const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;

      for (let page = 1; page <= totalPages; page++) {
        if (page > 1) doc.addPage();
        
        // Header info on page 1
        if (page === 1) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(20);
          doc.setTextColor(15, 23, 42); // Slate-900
          doc.text(pageTitle, 14, 30);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139); // Slate-500
          doc.text(`Total Records Found: ${filteredUsers.length} | Tutors: ${stats.tutors} | Students: ${stats.students}`, 14, 37);

          doc.setLineWidth(0.3);
          doc.setDrawColor(226, 232, 240); // Slate-200
          doc.line(14, 42, 196, 42);
        }

        // Table headers starting Y coordinate
        const startY = page === 1 ? 50 : 25;
        
        // Header background row
        doc.setFillColor(248, 250, 252); // Slate-50
        doc.rect(14, startY - 5, 182, 7, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105); // Slate-600
        
        doc.text('#', 16, startY);
        doc.text('Full Name', 25, startY);
        doc.text('Email Address', 80, startY);
        doc.text('Role', 145, startY);
        doc.text('Joined Date', 170, startY);
        
        doc.setLineWidth(0.2);
        doc.setDrawColor(203, 213, 225); // Slate-300
        doc.line(14, startY + 3, 196, startY + 3);

        // Rows printing
        const startIndex = (page - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, filteredUsers.length);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85); // Slate-700

        let Y = startY + 10;
        for (let i = startIndex; i < endIndex; i++) {
          const user = filteredUsers[i];
          
          // Draw thin light separator line
          if (i > startIndex) {
            doc.setDrawColor(241, 245, 249); // Slate-100
            doc.line(14, Y - 6, 196, Y - 6);
          }

          doc.text(String(i + 1), 16, Y);
          doc.text(user.full_name || 'N/A', 25, Y);
          doc.text(user.email || 'N/A', 80, Y);
          doc.text(user.role?.toUpperCase() || 'N/A', 145, Y);
          doc.text(user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A', 170, Y);
          
          Y += 10;
        }

        // Add standard Header/Footer to each page
        addHeaderFooter(page, totalPages);
      }

      doc.save(`TechSips-${roleLabel.replace(' ', '_')}-Directory.pdf`);
      toast.success('PDF exported successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="glass-card p-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-rose-500 opacity-80" />
        <p className="font-bold text-slate-800 dark:text-white">Failed to Load User Directory</p>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">{loadError}</p>
        <button
          onClick={fetchUsers}
          className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            User Management Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View all registered tutors and students, delete accounts, and export lists to PDF format.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchUsers}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-darkCard dark:hover:bg-darkBorder text-slate-700 dark:text-white rounded-xl text-sm font-bold transition-all"
            title="Refresh user list"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting || filteredUsers.length === 0}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-500/10 transition-all disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{exporting ? 'Generating PDF...' : 'Export to PDF'}</span>
          </button>
        </div>
      </div>

      {/* Summary counters – always reflect current state */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Users</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-extrabold text-brand-500">{stats.tutors}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Tutors</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-extrabold text-emerald-500">{stats.students}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Students</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-extrabold text-indigo-500">{stats.admins}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Admins</p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-darkCard/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-darkBg text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            All Users ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('tutor')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'tutor'
                ? 'bg-white dark:bg-darkBg text-brand-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Tutors ({stats.tutors})
          </button>
          <button
            onClick={() => setActiveTab('student')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'student'
                ? 'bg-white dark:bg-darkBg text-emerald-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Students ({stats.students})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="user-directory-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user name or email…"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkCard text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Directory Table */}
      {filteredUsers.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <AlertCircle className="h-12 w-12 mx-auto text-slate-500 mb-4 opacity-50" />
          <p className="font-semibold">
            {search.trim()
              ? 'No users match your search.'
              : activeTab === 'student'
              ? 'No students registered yet.'
              : activeTab === 'tutor'
              ? 'No tutors registered yet.'
              : 'No users found.'}
          </p>
          <p className="text-xs mt-1 text-slate-500">
            {search.trim() ? 'Try a different name or email.' : 'Users will appear here once they register on the platform.'}
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b dark:border-darkBorder/40 bg-slate-100/50 dark:bg-darkCard/50 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y dark:divide-darkBorder/30">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50/50 dark:hover:bg-darkCard/30 transition-colors ${
                      deletingId === user.id ? 'opacity-40 pointer-events-none' : ''
                    }`}
                  >
                    {/* User Meta */}
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {user.avatar_url ? (
                          <img
                            src={resolveMediaUrl(user.avatar_url)}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-darkBorder"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-darkBg text-slate-500 flex items-center justify-center font-bold text-sm select-none">
                            {user.full_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{user.full_name}</p>
                          <p className="text-[10px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      {user.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 uppercase text-[9px]">
                          <Shield className="h-3 w-3" /> Admin
                        </span>
                      )}
                      {user.role === 'tutor' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-brand-500/10 text-brand-500 border border-brand-500/20 uppercase text-[9px]">
                          <GraduationCap className="h-3 w-3" /> Tutor
                        </span>
                      )}
                      {user.role === 'student' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase text-[9px]">
                          <BookOpen className="h-3 w-3" /> Student
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5 opacity-60" />
                        <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {user.is_suspended ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-600 border border-rose-500/25">
                          <UserX className="h-3 w-3" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/25">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(user.id, user.full_name, user.role)}
                          disabled={deletingId === user.id}
                          className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-500 rounded-xl transition-colors disabled:opacity-50"
                          title={`Delete ${user.role} permanently`}
                        >
                          {deletingId === user.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div className="px-4 py-3 border-t dark:border-darkBorder/30 text-[10px] text-slate-400 font-medium">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      )}
    </div>
  );
}
