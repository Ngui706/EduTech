import React, { useEffect, useState, useMemo } from 'react';
import {
  Activity, Search, Calendar, User, Eye, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/activity-logs', {
        params: { page, limit }
      });
      setLogs(data.data?.logs || []);
      setTotalLogs(data.data?.pagination?.total || 0);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch activity logs.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Unique actions list for filter
  const actionTypes = useMemo(() => {
    const types = new Set();
    logs.forEach(log => {
      if (log.action) types.add(log.action);
    });
    return Array.from(types);
  }, [logs]);

  // Client-side filtering for search & action type filter
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const userMail = log.users?.email || '';
      const userName = log.users?.full_name || '';
      const details = typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '');
      const actionName = log.action || '';
      
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        userMail.toLowerCase().includes(searchLower) ||
        userName.toLowerCase().includes(searchLower) ||
        details.toLowerCase().includes(searchLower) ||
        actionName.toLowerCase().includes(searchLower);

      return matchesAction && matchesSearch;
    });
  }, [logs, search, actionFilter]);

  const totalPages = Math.ceil(totalLogs / limit);

  // Helper for color-coding log actions
  const getActionBadgeStyle = (action) => {
    const actionUpper = action?.toUpperCase() || '';
    if (actionUpper.includes('LOGIN') || actionUpper.includes('LOGOUT')) {
      return 'bg-blue-500/10 text-blue-600 border-blue-500/25';
    }
    if (actionUpper.includes('DELETE') || actionUpper.includes('REJECT') || actionUpper.includes('SUSPEND')) {
      return 'bg-rose-500/10 text-rose-600 border-rose-500/25';
    }
    if (actionUpper.includes('CREATE') || actionUpper.includes('APPROVE') || actionUpper.includes('REGISTER') || actionUpper.includes('VERIFY')) {
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25';
    }
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25';
  };

  // Helper to format action names to user friendly text
  const formatActionName = (action) => {
    return action
      ?.replace(/_/g, ' ')
      ?.toLowerCase()
      ?.replace(/\b\w/g, (char) => char.toUpperCase()) || 'Unknown Action';
  };

  // Helper to display raw log details nicely
  const renderDetails = (details) => {
    if (!details) return <span className="text-slate-400 italic">No extra details</span>;
    if (typeof details === 'object') {
      return (
        <pre className="text-[10px] leading-tight bg-slate-50 dark:bg-darkBg/60 p-2 rounded-lg border border-slate-100 dark:border-darkBorder/40 overflow-x-auto max-w-md font-mono text-slate-600 dark:text-slate-400">
          {JSON.stringify(details, null, 2)}
        </pre>
      );
    }
    return <span className="text-slate-600 dark:text-slate-300 break-all">{details}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-brand-500" />
            System Activity Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit trail of platform activities, authentication records, and admin actions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkCard hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="logs-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, description, or user email…"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkCard text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkCard text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="all">All Action Types</option>
            {actionTypes.map((type) => (
              <option key={type} value={type}>
                {formatActionName(type)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content States */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500" />
        </div>
      ) : error ? (
        <div className="glass-card p-12 text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-rose-500 opacity-80" />
          <p className="font-bold text-slate-800 dark:text-white">Failed to Load Logs</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">{error}</p>
          <button
            onClick={fetchLogs}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <AlertCircle className="h-12 w-12 mx-auto text-slate-500 mb-4 opacity-50" />
          <p className="font-semibold">No logs match your filter criteria.</p>
          <p className="text-xs mt-1 text-slate-500">Try modifying your search or dropdown filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b dark:border-darkBorder/40 bg-slate-100/50 dark:bg-darkCard/50 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                    <th className="p-4">User</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y dark:divide-darkBorder/30">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-darkCard/30 transition-colors">
                      {/* User Info */}
                      <td className="p-4">
                        {log.users ? (
                          <div className="flex items-center space-x-2.5">
                            <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-darkBg text-slate-500 flex items-center justify-center font-bold text-xs select-none">
                              {log.users.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{log.users.full_name}</p>
                              <p className="text-[9px] text-slate-400">{log.users.email}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-slate-400">
                            <User className="h-3.5 w-3.5" />
                            <span className="font-medium italic text-[11px]">System (Anonymous)</span>
                          </div>
                        )}
                      </td>

                      {/* Action Type Badge */}
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-bold border uppercase text-[9px] ${getActionBadgeStyle(log.action)}`}>
                          {formatActionName(log.action)}
                        </span>
                      </td>

                      {/* Details Area */}
                      <td className="p-4">
                        <div className="max-w-md truncate hover:whitespace-normal hover:break-words">
                          {renderDetails(log.details)}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5 opacity-60" />
                          <span>
                            {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-darkBorder/40 pt-4">
              <span className="text-xs text-slate-500">
                Showing page <strong className="text-slate-800 dark:text-slate-200">{page}</strong> of <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong> ({totalLogs} total logs)
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkCard hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkCard hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
