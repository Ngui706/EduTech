import React, { useEffect, useState } from 'react';
import { FolderOpen, Plus, Edit2, Trash2, Check, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data.data || []);
    } catch {
      toast.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setFormData({ name: '', slug: '', description: '' });
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditId(cat.id);
    setFormData({ name: cat.name, slug: cat.slug || '', description: cat.description || '' });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, [e.target.name]: val };
      // Auto-generate slug from name
      if (e.target.name === 'name') {
        updated.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      return updated;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/categories/${editId}`, formData);
        toast.success('Category updated!');
      } else {
        await api.post('/admin/categories', formData);
        toast.success('Category created!');
      }
      setShowForm(false);
      setEditId(null);
      setFormData({ name: '', slug: '', description: '' });
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category? Courses in this category will lose their categorization.')) return;
    try {
      await api.delete(`/admin/categories/${catId}`);
      toast.success('Category deleted.');
      fetchCategories();
    } catch {
      toast.error('Failed to delete category.');
    }
  };

  if (loading) {
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Category Manager</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage the course classification hierarchy used throughout the platform.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-brand-500/15"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="glass-card p-6 border-2 border-brand-500/20 space-y-4">
          <h3 className="font-extrabold text-base">{editId ? 'Edit Category' : 'Create New Category'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Category Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                  placeholder="e.g. Web Development"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">URL Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                  placeholder="web-development"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Description (optional)</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                placeholder="Short description for this category..."
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>Save Category</span>
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="flex items-center space-x-1.5 px-5 py-2.5 border dark:border-darkBorder rounded-xl text-sm font-bold hover:bg-slate-100 dark:hover:bg-darkCard transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Table */}
      {categories.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <FolderOpen className="h-12 w-12 mx-auto text-slate-500 mb-4 opacity-55" />
          <p className="font-semibold">No categories found.</p>
          <p className="text-xs mt-1 text-slate-500">Add your first course category to get started.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b dark:border-darkBorder/40 bg-slate-100/50 dark:bg-darkCard/50 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <th className="p-4">#</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y dark:divide-darkBorder/30">
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-darkCard/30 transition-colors">
                    <td className="p-4 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                    </td>
                    <td className="p-4">
                      <code className="text-xs bg-slate-100 dark:bg-darkCard px-2 py-1 rounded-lg text-slate-500">{cat.slug}</code>
                    </td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-darkCard dark:hover:bg-darkBg rounded-lg text-slate-500 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
