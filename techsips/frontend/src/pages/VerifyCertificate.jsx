import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Award, CheckCircle2, AlertTriangle, Calendar, User, BookOpen, Download, Search } from 'lucide-react';
import api from '../api/axios';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

export default function VerifyCertificate() {
  const { code: urlCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [inputCode, setInputCode] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine the active verification code
  const activeCode = urlCode || searchParams.get('code') || '';

  useEffect(() => {
    if (activeCode) {
      setInputCode(activeCode);
      verifyCode(activeCode);
    } else {
      setCertificate(null);
      setError(null);
    }
  }, [activeCode]);

  const verifyCode = async (codeToVerify) => {
    if (!codeToVerify.trim()) return;
    setLoading(true);
    setError(null);
    setCertificate(null);
    try {
      const { data } = await api.get(`/certificates/verify/${codeToVerify.trim()}`);
      setCertificate(data.data);
      toast.success('Certificate verified successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid verification code. Please check and try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      navigate(`/verify-certificate/${inputCode.trim()}`);
    }
  };

  const handleDownload = () => {
    if (!certificate) return;
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 600],
      });

      // Background theme (dark blue and gold accent)
      doc.setFillColor(15, 15, 26); // Dark blue bg
      doc.rect(0, 0, 800, 600, 'F');

      // Border lines (gold colors)
      doc.setDrawColor(212, 175, 55); // Gold border
      doc.setLineWidth(4);
      doc.rect(20, 20, 760, 560);

      doc.setLineWidth(1);
      doc.rect(25, 25, 750, 550);

      // Certificate header
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('TECHSIPS LEARNING PLATFORM', 400, 80, { align: 'center' });

      // Gold badge icon design
      doc.setFillColor(212, 175, 55);
      doc.circle(400, 160, 30, 'F');
      doc.setTextColor(15, 15, 26);
      doc.setFontSize(16);
      doc.text('TS', 400, 165, { align: 'center' });

      // Certificate of Completion title
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(36);
      doc.text('CERTIFICATE OF COMPLETION', 400, 240, { align: 'center' });

      // Student name details
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(16);
      doc.text('This is proudly presented to', 400, 280, { align: 'center' });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(24);
      doc.text(certificate.users?.full_name?.toUpperCase() || 'STUDENT NAME', 400, 320, { align: 'center' });

      // Course text
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(16);
      doc.text('for successfully completing the technology bootcamp cohort', 400, 360, { align: 'center' });

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(22);
      doc.text(certificate.courses?.title || 'COURSE TITLE', 400, 400, { align: 'center' });

      // Footer values
      doc.setDrawColor(55, 55, 80);
      doc.line(100, 490, 300, 490);
      doc.line(500, 490, 700, 490);

      doc.setTextColor(150, 150, 170);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(12);
      
      // Date and Signatures
      const issueDate = new Date(certificate.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Issued Date: ${issueDate}`, 200, 510, { align: 'center' });
      doc.text('Verified Platform Mentor', 600, 510, { align: 'center' });

      // Verification code
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 120);
      doc.text(`Verification Hash: ${certificate.certificate_code}`, 400, 550, { align: 'center' });

      doc.save(`TechSips-Certificate-${certificate.certificate_code}.pdf`);
      toast.success('Certificate downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF certificate.');
    }
  };

  return (
    <div className="min-h-screen dark:bg-darkBg py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-2xl w-full space-y-8">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-brand-500/10 text-brand-500 mb-2">
            <Award className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Online Credential Verification
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Verify the authenticity of graduation credentials and completion certificates issued by TechSips.
          </p>
        </div>

        {/* Verification Search Box */}
        <form onSubmit={handleSearchSubmit} className="glass-card p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Enter certificate hash (e.g. TSIPS-XXXXX)..."
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg/60 text-slate-950 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-colors shadow-md shadow-brand-500/10 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500" />
          </div>
        )}

        {/* Certificate Verification Display */}
        {certificate && !loading && (
          <div className="glass-card overflow-hidden border border-emerald-500/35 dark:border-emerald-500/20 animate-fade-in shadow-2xl">
            {/* Verification Status Header */}
            <div className="bg-emerald-500/10 dark:bg-emerald-500/5 px-6 py-4 flex items-center gap-3 border-b border-emerald-500/20 text-emerald-600 dark:text-emerald-500">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs uppercase font-extrabold tracking-wider">Valid Certificate</p>
                <p className="text-[10px] text-slate-450 dark:text-slate-500">This credential is certified authentic by TechSips.</p>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="p-6 sm:p-8 space-y-6 text-left">
              <div className="border-b dark:border-darkBorder/40 pb-5 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Recipient Name</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white capitalize">
                  {certificate.users?.full_name}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 opacity-70" /> Course Name
                  </p>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-white">
                    {certificate.courses?.title}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 opacity-70" /> Instructor
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {certificate.courses?.users?.full_name}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 opacity-70" /> Completion Date
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Verification Hash</p>
                  <p className="text-xs font-mono font-bold text-brand-500 uppercase tracking-wider">
                    {certificate.certificate_code}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t dark:border-darkBorder/40 flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF Document</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-card p-6 border border-rose-500/35 dark:border-rose-500/20 text-center space-y-3 animate-fade-in">
            <AlertTriangle className="h-10 w-10 mx-auto text-rose-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Verification Failed</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">{error}</p>
          </div>
        )}

      </div>
    </div>
  );
}
